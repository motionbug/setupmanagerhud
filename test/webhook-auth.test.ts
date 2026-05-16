import { expect, test } from "vitest";
import { handleWebhook, type Env } from "../src/index.ts";

const VALID_PAYLOAD = {
  name: "Started",
  event: "com.jamf.setupmanager.started",
  timestamp: "2025-01-01T00:00:00Z",
  started: "2025-01-01T00:00:00Z",
  modelName: "MacBook Pro",
  modelIdentifier: "Mac15,3",
  macOSBuild: "24A335",
  macOSVersion: "15.0",
  serialNumber: "TESTSERIAL01",
  setupManagerVersion: "2.0.0",
};

type D1RunMock = (...values: unknown[]) => Promise<D1Result>;

function createD1Database(
  run: D1RunMock = async () => ({ success: true } as D1Result),
): D1Database {
  return {
    prepare: () =>
      ({
        bind: (...values: unknown[]) =>
          ({
            run: () => run(...values),
          }) as unknown as D1PreparedStatement,
      }) as unknown as D1PreparedStatement,
  } as unknown as D1Database;
}

function createDashboardRoomNamespace(): DurableObjectNamespace {
  const stub = {
    fetch: async () => new Response(null, { status: 200 }),
  } as unknown as DurableObjectStub;

  return {
    idFromName: () => ({} as DurableObjectId),
    get: () => stub,
  } as unknown as DurableObjectNamespace;
}

function createEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: createD1Database(),
    DASHBOARD_ROOM: createDashboardRoomNamespace(),
    ...overrides,
  };
}

function createRequest(headers: HeadersInit = {}, body = VALID_PAYLOAD): Request {
  return new Request("https://example.com/webhook", {
    method: "POST",
    headers: {
      Authorization: "expected-token",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test("rejects webhook requests when WEBHOOK_TOKEN is not configured", async () => {
  const response = await handleWebhook(
    createRequest(),
    createEnv({ WEBHOOK_TOKEN: undefined }),
  );

  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: "Webhook authentication is not configured",
  });
});

test("rejects webhook requests without an Authorization header", async () => {
  const response = await handleWebhook(
    createRequest({ Authorization: "" }),
    createEnv({ WEBHOOK_TOKEN: "expected-token" }),
  );

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "Unauthorized" });
});

test("rejects webhook requests with the wrong Authorization token", async () => {
  const response = await handleWebhook(
    createRequest({ Authorization: "wrong-token" }),
    createEnv({ WEBHOOK_TOKEN: "expected-token" }),
  );

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "Unauthorized" });
});

test("accepts a valid payload with the correct Authorization token", async () => {
  let storedKey: string | null = null;

  const response = await handleWebhook(
    createRequest(),
    createEnv({
      WEBHOOK_TOKEN: "expected-token",
      DB: createD1Database(
        async (eventId: unknown) => {
          storedKey = String(eventId);
          return { success: true } as D1Result;
        },
      ),
    }),
  );

  expect(response.status).toBe(200);
  if (storedKey === null) {
    throw new Error("Expected webhook event to be stored");
  }
  expect(storedKey).toMatch(/^com\.jamf\.setupmanager\.started:TESTSERIAL01:/);
});

test("returns 400 for invalid payloads after auth succeeds", async () => {
  const invalidPayload = { ...VALID_PAYLOAD, serialNumber: "" };
  const response = await handleWebhook(
    createRequest({}, invalidPayload),
    createEnv({ WEBHOOK_TOKEN: "expected-token" }),
  );

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Invalid webhook payload" });
});

test("accepts Bearer-prefixed Authorization headers", async () => {
  const response = await handleWebhook(
    createRequest({ Authorization: "Bearer expected-token" }),
    createEnv({ WEBHOOK_TOKEN: "expected-token" }),
  );

  expect(response.status).toBe(200);
});

test("falls back to WEBHOOK_SECRET during migration", async () => {
  const response = await handleWebhook(
    createRequest({ Authorization: "Bearer legacy-token" }),
    createEnv({ WEBHOOK_SECRET: "legacy-token" }),
  );

  expect(response.status).toBe(200);
});
