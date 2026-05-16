import { DashboardRoom } from "./DashboardRoom";
import {
  validateWebhookPayload,
  type SetupManagerWebhook,
  type StoredEvent,
} from "./types";
import { fetchEvents, fetchEventStats, insertEvent } from "./events";

export { DashboardRoom };

interface Env {
  DB: D1Database;
  DASHBOARD_ROOM: DurableObjectNamespace;
  WEBHOOK_TOKEN?: string;
  WEBHOOK_SECRET?: string;
  ASSETS?: Fetcher;
  CF_ACCESS_AUD?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",

  // SEC-01: Content-Security-Policy
  // Dashboard loads: React (bundled), Tailwind CSS (bundled), Figtree font (@fontsource),
  // recharts (bundled), Radix UI (bundled), HugeIcons (bundled)
  // WebSocket connections to 'self'
  // Note: 'unsafe-inline' needed for Tailwind v4 runtime styles and Vite dev mode
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self' wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),

  // SEC-02: Strict-Transport-Security (per D-03: 1 year with includeSubDomains)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // SEC-03: Referrer-Policy - strict for privacy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // SEC-04: Permissions-Policy - disable unused browser features
  "Permissions-Policy": [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
  ].join(", "),
};

/**
 * Build CORS headers only when the request Origin matches the Worker's own origin.
 * The dashboard is served from the same Worker (same origin), so most requests
 * don't need CORS at all. Device webhook POSTs are server-to-server and ignore CORS.
 * This prevents arbitrary websites from making cross-origin requests to the API.
 */
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  if (!origin) return {};

  const requestUrl = new URL(request.url);
  const workerOrigin = `${requestUrl.protocol}//${requestUrl.host}`;

  if (origin === workerOrigin) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
  }

  return {};
}

function json(data: unknown, status = 200, request?: Request): Response {
  const corsHeaders = request ? getCorsHeaders(request) : {};
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      ...SECURITY_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Constant-time string comparison using HMAC digests.
 * Both inputs are hashed to fixed-length 256-bit digests before comparison,
 * so no timing information about string length or content is leaked.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode("webhook-hmac-comparison-key");
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(a)),
    crypto.subtle.sign("HMAC", key, encoder.encode(b)),
  ]);

  const bufA = new Uint8Array(sigA);
  const bufB = new Uint8Array(sigB);

  // Compare fixed-length 32-byte digests — no length or content leak
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}

/**
 * Cloudflare Access JWT validation
 * Verifies the CF-Access-Jwt-Assertion header against the configured
 * audience (aud) and team domain JWKs endpoint.
 * Returns null if valid, or a Response with an error if invalid.
 */
async function validateAccessJwt(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const aud = env.CF_ACCESS_AUD;
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN;

  // If not configured, skip validation
  if (!aud || !teamDomain) return null;

  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt) {
    return new Response("Unauthorized: missing Access token", { status: 403 });
  }

  try {
    // Decode header and payload without verification first
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      return new Response("Unauthorized: malformed token", { status: 403 });
    }

    const headerJson = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));

    // Validate audience
    if (
      !payloadJson.aud ||
      !Array.isArray(payloadJson.aud) ||
      !payloadJson.aud.includes(aud)
    ) {
      return new Response("Unauthorized: invalid audience", { status: 403 });
    }

    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (payloadJson.exp && payloadJson.exp < now) {
      return new Response("Unauthorized: token expired", { status: 403 });
    }

    // Validate issuer
    const expectedIssuer = `https://${teamDomain}`;
    if (payloadJson.iss !== expectedIssuer) {
      return new Response("Unauthorized: invalid issuer", { status: 403 });
    }

    // Fetch JWKs and verify signature
    const certsUrl = `https://${teamDomain}/cdn-cgi/access/certs`;
    const certsResponse = await fetch(certsUrl);
    if (!certsResponse.ok) {
      console.error(`Failed to fetch Access certs: ${certsResponse.status}`);
      return new Response("Internal error: unable to verify token", { status: 500 });
    }

    const certs = (await certsResponse.json()) as {
      keys: JsonWebKey[];
      public_certs: { kid: string; cert: string }[];
    };

    // Find the matching key
    const kid = headerJson.kid;
    const jwk = certs.keys.find((k: JsonWebKey & { kid?: string }) => k.kid === kid);
    if (!jwk) {
      return new Response("Unauthorized: no matching key", { status: 403 });
    }

    // Import the key and verify the signature
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = Uint8Array.from(
      atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      signature,
      signedContent,
    );

    if (!valid) {
      return new Response("Unauthorized: invalid signature", { status: 403 });
    }

    return null; // Valid
  } catch (err) {
    console.error("Access JWT validation error:", err);
    return new Response("Unauthorized: token validation failed", { status: 403 });
  }
}

/** Maximum webhook payload size in bytes (8 KB) */
const MAX_WEBHOOK_PAYLOAD_SIZE = 8192;

function logWebhookRejection(
  request: Request,
  reason: string,
  details: Record<string, unknown> = {},
): void {
  const authHeader = request.headers.get("Authorization");
  const authScheme = authHeader?.startsWith("Bearer ")
    ? "bearer"
    : authHeader
      ? "raw"
      : "missing";

  console.warn("Webhook rejected", {
    reason,
    method: request.method,
    path: new URL(request.url).pathname,
    contentType: request.headers.get("Content-Type"),
    userAgent: request.headers.get("User-Agent"),
    authScheme,
    authHeaderLength: authHeader?.length ?? 0,
    ...details,
  });
}

// POST /webhook
export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  // Reject oversized payloads before parsing
  const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
  if (contentLength > MAX_WEBHOOK_PAYLOAD_SIZE) {
    logWebhookRejection(request, "payload_too_large", {
      contentLength,
      maxPayloadSize: MAX_WEBHOOK_PAYLOAD_SIZE,
    });
    return json({ error: "Payload too large" }, 413, request);
  }

  // Require application/json Content-Type to block form-based CSRF
  const contentType = request.headers.get("Content-Type");
  if (!contentType || !contentType.includes("application/json")) {
    logWebhookRejection(request, "invalid_content_type");
    return json({ error: "Content-Type must be application/json" }, 415, request);
  }

  const webhookToken = env.WEBHOOK_TOKEN ?? env.WEBHOOK_SECRET;
  if (!webhookToken) {
    logWebhookRejection(request, "missing_worker_token");
    return json({ error: "Webhook authentication is not configured" }, 503, request);
  }

  const authHeader = request.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const authorized =
    !!authHeader &&
    ((await timingSafeEqual(authHeader, webhookToken)) ||
      (!!bearerToken && (await timingSafeEqual(bearerToken, webhookToken))));

  if (!authorized) {
    logWebhookRejection(request, "token_mismatch", {
      configuredTokenLength: webhookToken.length,
      bearerTokenLength: bearerToken?.length ?? null,
    });
    return json({ error: "Unauthorized" }, 401, request);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    logWebhookRejection(request, "invalid_json");
    return json({ error: "Invalid JSON payload" }, 400, request);
  }

  const validation = validateWebhookPayload(payload);
  if (!validation.valid) {
    // Log detailed error server-side; return generic message to client
    console.error(`Webhook validation failed: ${validation.error}`);
    return json({ error: "Invalid webhook payload" }, 400, request);
  }

  const webhookPayload = payload as SetupManagerWebhook;
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const eventId = `${webhookPayload.event}:${webhookPayload.serialNumber}:${timestamp}:${uuid}`;

  const storedEvent: StoredEvent = { payload: webhookPayload, timestamp, eventId };

  await insertEvent(env, storedEvent);

  const roomId = env.DASHBOARD_ROOM.idFromName("main");
  const room = env.DASHBOARD_ROOM.get(roomId);
  await room.fetch("http://internal/broadcast", {
    method: "POST",
    body: JSON.stringify({ type: "setup-manager-event", data: storedEvent }),
  });

  return json({ success: true, eventId }, 200, request);
}

// GET /api/events
async function handleEvents(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "100", 10) || 100, 1), 1000);

  const validEvents = await fetchEvents(env, limit);
  return json(validEvents, 200, request);
}

// GET /api/stats
async function handleStats(request: Request, env: Env): Promise<Response> {
  const stats = await fetchEventStats(env);
  return json(stats, 200, request);
}

// GET /api/health
async function handleHealth(request: Request, env: Env): Promise<Response> {
  const health: {
    status: string;
    timestamp: number;
    durable_objects: string;
    d1: string;
    connections?: number;
  } = {
    status: "healthy",
    timestamp: Date.now(),
    d1: "unknown",
    durable_objects: "unknown",
  };

  try {
    if (env?.DB) {
      await env.DB.prepare("SELECT 1").first();
      health.d1 = "connected";
    } else {
      health.d1 = "not configured";
      health.status = "degraded";
    }
  } catch {
    health.d1 = "error";
    health.status = "degraded";
  }

  try {
    if (env?.DASHBOARD_ROOM) {
      const roomId = env.DASHBOARD_ROOM.idFromName("main");
      const room = env.DASHBOARD_ROOM.get(roomId);
      const response = await room.fetch("http://internal/connections");
      if (response.ok) {
        const data = (await response.json()) as { connections: number };
        health.durable_objects = "connected";
        health.connections = data.connections;
      } else {
        health.durable_objects = "error";
        health.status = "degraded";
      }
    } else {
      health.durable_objects = "not configured";
      health.status = "degraded";
    }
  } catch {
    health.durable_objects = "error";
    health.status = "degraded";
  }

  return json(health, health.status === "healthy" ? 200 : 503, request);
}

// GET /ws — WebSocket upgrade
function handleWebSocket(request: Request, env: Env): Response {
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }
  const id = env.DASHBOARD_ROOM.idFromName("main");
  const stub = env.DASHBOARD_ROOM.get(id);
  return stub.fetch(request) as unknown as Response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withSecurityHeaders(
        new Response(null, { headers: getCorsHeaders(request) }),
      );
    }

    // Webhook endpoint is always open for devices — no Access check
    if (url.pathname === "/webhook" && request.method === "POST") {
      return handleWebhook(request, env);
    }

    // All other routes require Cloudflare Access JWT (if configured)
    const accessDenied = await validateAccessJwt(request, env);
    if (accessDenied) return withSecurityHeaders(accessDenied);

    if (url.pathname === "/api/events" && request.method === "GET") {
      return handleEvents(request, env);
    }
    if (url.pathname === "/api/stats" && request.method === "GET") {
      return handleStats(request, env);
    }
    if (url.pathname === "/api/health" && request.method === "GET") {
      return handleHealth(request, env);
    }
    if (url.pathname === "/ws") {
      return handleWebSocket(request, env);
    }

    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      return withSecurityHeaders(assetResponse);
    }

    return withSecurityHeaders(new Response("Not Found", { status: 404 }));
  },
};

/** @internal Exported for testing only */
export { timingSafeEqual as _testTimingSafeEqual };

/** @internal Exported for testing only */
export { validateAccessJwt as _testValidateAccessJwt };

/** @internal Exported for testing only - Env type for test mocks */
export type { Env as _TestEnv };

export type { Env };
