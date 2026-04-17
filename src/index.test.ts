/**
 * Security function tests for src/index.ts
 *
 * Tests for:
 * - timingSafeEqual: Constant-time string comparison using HMAC digests
 * - validateAccessJwt: Cloudflare Access JWT validation
 *
 * These functions guard authentication boundaries and must be verified
 * before any refactoring.
 */
import { describe, it, expect } from "vitest";
import {
  _testTimingSafeEqual as timingSafeEqual,
  _testValidateAccessJwt as validateAccessJwt,
  type _TestEnv as Env,
} from "./index";

describe("timingSafeEqual", () => {
  describe("matching strings", () => {
    it("returns true for identical strings", async () => {
      expect(await timingSafeEqual("secret123", "secret123")).toBe(true);
    });

    it("returns true for empty strings", async () => {
      expect(await timingSafeEqual("", "")).toBe(true);
    });

    it("returns true for strings with special characters", async () => {
      expect(await timingSafeEqual("abc!@#$%^&*()", "abc!@#$%^&*()")).toBe(
        true
      );
    });

    it("returns true for unicode strings", async () => {
      expect(await timingSafeEqual("hello\u{1F600}world", "hello\u{1F600}world")).toBe(true);
    });

    it("returns true for very long matching strings", async () => {
      const longString = "a".repeat(1000);
      expect(await timingSafeEqual(longString, longString)).toBe(true);
    });

    it("returns true for strings with whitespace", async () => {
      expect(await timingSafeEqual("  spaces  ", "  spaces  ")).toBe(true);
    });

    it("returns true for strings with newlines", async () => {
      expect(await timingSafeEqual("line1\nline2", "line1\nline2")).toBe(true);
    });
  });

  describe("non-matching strings", () => {
    it("returns false for completely different strings", async () => {
      expect(await timingSafeEqual("secret123", "wrong")).toBe(false);
    });

    it("returns false when one string is empty", async () => {
      expect(await timingSafeEqual("secret", "")).toBe(false);
    });

    it("returns false when other string is empty", async () => {
      expect(await timingSafeEqual("", "secret")).toBe(false);
    });

    it("returns false for case-sensitive differences", async () => {
      expect(await timingSafeEqual("Secret", "secret")).toBe(false);
    });

    it("returns false for strings differing by one character", async () => {
      expect(await timingSafeEqual("secret123", "secret124")).toBe(false);
    });

    it("returns false for strings with different lengths", async () => {
      expect(await timingSafeEqual("short", "longer")).toBe(false);
    });

    it("returns false for very long non-matching strings", async () => {
      const longA = "a".repeat(1000);
      const longB = "a".repeat(999) + "b";
      expect(await timingSafeEqual(longA, longB)).toBe(false);
    });

    it("returns false for whitespace differences", async () => {
      expect(await timingSafeEqual("no spaces", "no  spaces")).toBe(false);
    });

    it("returns false for unicode differences", async () => {
      expect(await timingSafeEqual("cafe\u0301", "caf\u00e9")).toBe(false); // Different unicode normalizations
    });
  });

  describe("edge cases", () => {
    it("handles strings with null characters", async () => {
      expect(await timingSafeEqual("a\x00b", "a\x00b")).toBe(true);
      expect(await timingSafeEqual("a\x00b", "a\x00c")).toBe(false);
    });

    it("handles very short strings", async () => {
      expect(await timingSafeEqual("a", "a")).toBe(true);
      expect(await timingSafeEqual("a", "b")).toBe(false);
    });

    it("handles numeric-looking strings", async () => {
      expect(await timingSafeEqual("12345", "12345")).toBe(true);
      expect(await timingSafeEqual("12345", "12346")).toBe(false);
    });
  });
});

describe("validateAccessJwt", () => {
  // Helper to create base64url encoded string
  function base64url(obj: object): string {
    const json = JSON.stringify(obj);
    const base64 = btoa(json);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  // Helper to create a mock JWT (header.payload.signature)
  function createMockJwt(
    header: object,
    payload: object,
    signature = "fake-signature"
  ): string {
    return `${base64url(header)}.${base64url(payload)}.${signature}`;
  }

  // Mock environment with Access configured
  const mockEnvWithAccess: Env = {
    CF_ACCESS_AUD: "test-audience-id",
    CF_ACCESS_TEAM_DOMAIN: "test-team.cloudflareaccess.com",
    WEBHOOKS: {} as KVNamespace,
    DASHBOARD_ROOM: {} as DurableObjectNamespace,
  };

  // Mock environment without Access configured
  const mockEnvWithoutAccess: Env = {
    WEBHOOKS: {} as KVNamespace,
    DASHBOARD_ROOM: {} as DurableObjectNamespace,
  };

  describe("when Access is not configured", () => {
    it("returns null when CF_ACCESS_AUD not set", async () => {
      const request = new Request("https://example.com/api/events");
      const result = await validateAccessJwt(request, {
        ...mockEnvWithoutAccess,
        CF_ACCESS_TEAM_DOMAIN: "test.cloudflareaccess.com",
      });
      expect(result).toBeNull();
    });

    it("returns null when CF_ACCESS_TEAM_DOMAIN not set", async () => {
      const request = new Request("https://example.com/api/events");
      const result = await validateAccessJwt(request, {
        ...mockEnvWithoutAccess,
        CF_ACCESS_AUD: "test-aud",
      });
      expect(result).toBeNull();
    });

    it("returns null when both env vars not set", async () => {
      const request = new Request("https://example.com/api/events");
      const result = await validateAccessJwt(request, mockEnvWithoutAccess);
      expect(result).toBeNull();
    });
  });

  describe("when Access is configured", () => {
    it("returns 403 when JWT header missing", async () => {
      const request = new Request("https://example.com/api/events");
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(403);
      const body = await result!.text();
      expect(body).toContain("missing Access token");
    });

    it("returns 403 for malformed JWT (not 3 parts)", async () => {
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": "invalid.jwt" },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(403);
      const body = await result!.text();
      expect(body).toContain("malformed");
    });

    it("returns 403 for malformed JWT (single part)", async () => {
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": "notajwt" },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
    });

    it("returns 403 for malformed JWT (four parts)", async () => {
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": "a.b.c.d" },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
    });

    it("returns 403 for invalid audience", async () => {
      const jwt = createMockJwt(
        { alg: "RS256", kid: "test-kid" },
        {
          aud: ["wrong-audience"],
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: "https://test-team.cloudflareaccess.com",
        }
      );
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": jwt },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
      const body = await result!.text();
      expect(body).toContain("invalid audience");
    });

    it("returns 403 for missing audience claim", async () => {
      const jwt = createMockJwt(
        { alg: "RS256", kid: "test-kid" },
        {
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: "https://test-team.cloudflareaccess.com",
        }
      );
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": jwt },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
      const body = await result!.text();
      expect(body).toContain("invalid audience");
    });

    it("returns 403 for non-array audience claim", async () => {
      const jwt = createMockJwt(
        { alg: "RS256", kid: "test-kid" },
        {
          aud: "test-audience-id", // Should be an array
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: "https://test-team.cloudflareaccess.com",
        }
      );
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": jwt },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
      const body = await result!.text();
      expect(body).toContain("invalid audience");
    });

    it("returns 403 for expired token", async () => {
      const jwt = createMockJwt(
        { alg: "RS256", kid: "test-kid" },
        {
          aud: ["test-audience-id"],
          exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
          iss: "https://test-team.cloudflareaccess.com",
        }
      );
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": jwt },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
      const body = await result!.text();
      expect(body).toContain("expired");
    });

    it("returns 403 for invalid issuer", async () => {
      const jwt = createMockJwt(
        { alg: "RS256", kid: "test-kid" },
        {
          aud: ["test-audience-id"],
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: "https://wrong-team.cloudflareaccess.com",
        }
      );
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": jwt },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
      const body = await result!.text();
      expect(body).toContain("invalid issuer");
    });

    it("returns 403 for missing issuer claim", async () => {
      const jwt = createMockJwt(
        { alg: "RS256", kid: "test-kid" },
        {
          aud: ["test-audience-id"],
          exp: Math.floor(Date.now() / 1000) + 3600,
          // No iss claim
        }
      );
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": jwt },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
      const body = await result!.text();
      expect(body).toContain("invalid issuer");
    });

    it("returns 403 when certs endpoint fails", async () => {
      // This test creates a valid-looking JWT that passes all claim checks
      // but the fetch to the certs endpoint will fail because it's a fake domain
      const jwt = createMockJwt(
        { alg: "RS256", kid: "test-kid" },
        {
          aud: ["test-audience-id"],
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: "https://test-team.cloudflareaccess.com",
        }
      );
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": jwt },
      });

      // The fetch to the fake domain will fail, resulting in either 500 or 403
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result).not.toBeNull();
      expect([403, 500]).toContain(result!.status);
    });
  });

  describe("edge cases and security boundaries", () => {
    it("rejects empty JWT string", async () => {
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": "" },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
    });

    it("rejects JWT with invalid base64 in header", async () => {
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": "!!!.valid.signature" },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
    });

    it("rejects JWT with invalid base64 in payload", async () => {
      const header = base64url({ alg: "RS256" });
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": `${header}.!!!.signature` },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
    });

    it("rejects JWT with invalid JSON in header", async () => {
      const badHeader = btoa("not valid json")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const request = new Request("https://example.com/api/events", {
        headers: { "Cf-Access-Jwt-Assertion": `${badHeader}.${base64url({ aud: [] })}.sig` },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      expect(result!.status).toBe(403);
    });

    it("handles case-sensitive header name", async () => {
      // Cloudflare headers are case-insensitive, but let's verify
      const jwt = createMockJwt({ alg: "RS256" }, { aud: [] });
      const request = new Request("https://example.com/api/events", {
        headers: { "cf-access-jwt-assertion": jwt },
      });
      const result = await validateAccessJwt(request, mockEnvWithAccess);
      // Should still detect the header (case-insensitive)
      expect(result!.status).toBe(403); // Will fail on audience check, not missing header
    });
  });
});
