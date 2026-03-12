import test from "node:test";
import assert from "node:assert/strict";
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

function createEnv(overrides: Partial<Env> = {}): Env {
  return {
    WEBHOOKS: {
      put: async () => undefined,
    } as KVNamespace,
    DASHBOARD_ROOM: {
      idFromName: () => "main" as DurableObjectId,
      get: () =>
        ({
          fetch: async () => new Response(null, { status: 200 }),
        }) as DurableObjectStub,
    } as DurableObjectNamespace,
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

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "Webhook authentication is not configured",
  });
});

test("rejects webhook requests without an Authorization header", async () => {
  const response = await handleWebhook(
    createRequest({ Authorization: "" }),
    createEnv({ WEBHOOK_TOKEN: "expected-token" }),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("rejects webhook requests with the wrong Authorization token", async () => {
  const response = await handleWebhook(
    createRequest({ Authorization: "wrong-token" }),
    createEnv({ WEBHOOK_TOKEN: "expected-token" }),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("accepts a valid payload with the correct Authorization token", async () => {
  let storedKey: string | null = null;

  const response = await handleWebhook(
    createRequest(),
    createEnv({
      WEBHOOK_TOKEN: "expected-token",
      WEBHOOKS: {
        put: async (key: string) => {
          storedKey = key;
        },
      } as KVNamespace,
    }),
  );

  assert.equal(response.status, 200);
  assert.ok(storedKey?.startsWith("com.jamf.setupmanager.started:TESTSERIAL01:"));
});

test("returns 400 for invalid payloads after auth succeeds", async () => {
  const invalidPayload = { ...VALID_PAYLOAD, serialNumber: "" };
  const response = await handleWebhook(
    createRequest({}, invalidPayload),
    createEnv({ WEBHOOK_TOKEN: "expected-token" }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid webhook payload" });
});

test("does not accept Bearer-prefixed Authorization headers", async () => {
  const response = await handleWebhook(
    createRequest({ Authorization: "Bearer expected-token" }),
    createEnv({ WEBHOOK_TOKEN: "expected-token" }),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});
