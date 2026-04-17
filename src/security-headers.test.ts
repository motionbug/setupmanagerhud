import { describe, it, expect } from "vitest";
import { exports, env } from "cloudflare:workers";

describe("Security Headers", () => {
  const requiredHeaders = [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
  ];

  describe("on API responses", () => {
    it("includes all security headers on /api/health", async () => {
      const response = await exports.default.fetch("http://localhost/api/health", {
        method: "GET",
      });

      for (const header of requiredHeaders) {
        expect(response.headers.has(header), `Missing header: ${header}`).toBe(
          true
        );
      }
    });

    it("includes all security headers on /api/events", async () => {
      const response = await exports.default.fetch("http://localhost/api/events", {
        method: "GET",
      });

      for (const header of requiredHeaders) {
        expect(response.headers.has(header), `Missing header: ${header}`).toBe(
          true
        );
      }
    });

    it("includes all security headers on /webhook", async () => {
      const validPayload = {
        name: "Started",
        event: "com.jamf.setupmanager.started",
        timestamp: "2025-01-01T00:00:00Z",
        started: "2025-01-01T00:00:00Z",
        modelName: "MacBook Pro",
        modelIdentifier: "Mac15,3",
        macOSBuild: "24A335",
        macOSVersion: "15.0",
        serialNumber: "SECHEADERS001",
        setupManagerVersion: "2.0.0",
      };

      const response = await exports.default.fetch("http://localhost/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      });

      for (const header of requiredHeaders) {
        expect(response.headers.has(header), `Missing header: ${header}`).toBe(
          true
        );
      }
    });
  });

  describe("Strict-Transport-Security (SEC-02, D-03)", () => {
    it("has max-age of 31536000 (1 year)", async () => {
      const response = await exports.default.fetch("http://localhost/api/health");
      const hsts = response.headers.get("Strict-Transport-Security");
      expect(hsts).toContain("max-age=31536000");
    });

    it("includes includeSubDomains directive", async () => {
      const response = await exports.default.fetch("http://localhost/api/health");
      const hsts = response.headers.get("Strict-Transport-Security");
      expect(hsts).toContain("includeSubDomains");
    });
  });

  describe("Content-Security-Policy (SEC-01)", () => {
    it("includes default-src directive", async () => {
      const response = await exports.default.fetch("http://localhost/api/health");
      const csp = response.headers.get("Content-Security-Policy");
      expect(csp).toContain("default-src");
    });

    it("includes frame-ancestors 'none'", async () => {
      const response = await exports.default.fetch("http://localhost/api/health");
      const csp = response.headers.get("Content-Security-Policy");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });
});

describe("Event ID randomness (SEC-05, D-04)", () => {
  it("includes UUID in event ID", async () => {
    const validPayload = {
      name: "Started",
      event: "com.jamf.setupmanager.started",
      timestamp: "2025-01-01T00:00:00Z",
      started: "2025-01-01T00:00:00Z",
      modelName: "MacBook Pro",
      modelIdentifier: "Mac15,3",
      macOSBuild: "24A335",
      macOSVersion: "15.0",
      serialNumber: "SECTEST001",
      setupManagerVersion: "2.0.0",
    };

    const response = await exports.default.fetch("http://localhost/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const data = (await response.json()) as { eventId: string };

    // Event ID format: event:serial:timestamp:uuid
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(data.eventId).toMatch(uuidPattern);
  });

  it("generates unique event IDs for same payload", async () => {
    const validPayload = {
      name: "Started",
      event: "com.jamf.setupmanager.started",
      timestamp: "2025-01-01T00:00:00Z",
      started: "2025-01-01T00:00:00Z",
      modelName: "MacBook Pro",
      modelIdentifier: "Mac15,3",
      macOSBuild: "24A335",
      macOSVersion: "15.0",
      serialNumber: "SECTEST002",
      setupManagerVersion: "2.0.0",
    };

    const response1 = await exports.default.fetch("http://localhost/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response2 = await exports.default.fetch("http://localhost/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const data1 = (await response1.json()) as { eventId: string };
    const data2 = (await response2.json()) as { eventId: string };

    // Event IDs should be different due to UUID
    expect(data1.eventId).not.toBe(data2.eventId);
  });
});
