import { describe, it, expect } from "vitest";
import { validateWebhookPayload } from "./types";

// Base valid payloads for reuse
const validStartedPayload = {
  name: "Started" as const,
  event: "com.jamf.setupmanager.started" as const,
  timestamp: "2025-01-01T00:00:00Z",
  started: "2025-01-01T00:00:00Z",
  modelName: "MacBook Pro",
  modelIdentifier: "Mac15,3",
  macOSBuild: "24A335",
  macOSVersion: "15.0",
  serialNumber: "TEST001",
  setupManagerVersion: "2.0.0",
};

const validFinishedPayload = {
  ...validStartedPayload,
  name: "Finished" as const,
  event: "com.jamf.setupmanager.finished" as const,
  finished: "2025-01-01T00:10:00Z",
  duration: 600,
};

describe("validateWebhookPayload", () => {
  describe("valid payloads", () => {
    it("accepts valid started webhook", () => {
      const result = validateWebhookPayload(validStartedPayload);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts valid finished webhook", () => {
      const result = validateWebhookPayload(validFinishedPayload);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("accepts finished webhook with enrollmentActions", () => {
      const payload = {
        ...validFinishedPayload,
        enrollmentActions: [
          { label: "Install Apps", status: "finished" },
          { label: "Configure VPN", status: "failed" },
        ],
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });

    it("accepts finished webhook with userEntry", () => {
      const payload = {
        ...validFinishedPayload,
        userEntry: {
          department: "Engineering",
          computerName: "MacBook-001",
          userID: "jdoe",
          assetTag: "ASSET-12345",
        },
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });

    it("accepts optional fields (jamfProVersion, jssID, computerName)", () => {
      const payload = {
        ...validStartedPayload,
        jamfProVersion: "11.0.0",
        jssID: "12345",
        computerName: "MacBook-Pro-001",
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });

    it("accepts finished webhook with throughput fields", () => {
      const payload = {
        ...validFinishedPayload,
        uploadThroughput: 1000,
        downloadThroughput: 5000,
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });
  });

  describe("prototype pollution protection", () => {
    it("rejects payload with __proto__ key", () => {
      // Use JSON.parse to create a payload with __proto__ as an actual key
      const polluted = JSON.parse(
        '{"__proto__": {"polluted": true}, "name": "Started", "event": "com.jamf.setupmanager.started", "timestamp": "2025-01-01T00:00:00Z", "started": "2025-01-01T00:00:00Z", "modelName": "MacBook Pro", "modelIdentifier": "Mac15,3", "macOSBuild": "24A335", "macOSVersion": "15.0", "serialNumber": "TEST001", "setupManagerVersion": "2.0.0"}'
      );
      const result = validateWebhookPayload(polluted);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Payload contains forbidden property names");
    });

    it("rejects payload with constructor key", () => {
      const polluted = { ...validStartedPayload, constructor: {} };
      const result = validateWebhookPayload(polluted);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Payload contains forbidden property names");
    });

    it("rejects payload with prototype key", () => {
      const polluted = { ...validStartedPayload, prototype: {} };
      const result = validateWebhookPayload(polluted);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Payload contains forbidden property names");
    });

    it("rejects enrollmentAction with __proto__ key", () => {
      const pollutedAction = JSON.parse(
        '{"label": "Test", "status": "finished", "__proto__": {}}'
      );
      const payload = {
        ...validFinishedPayload,
        enrollmentActions: [pollutedAction],
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects userEntry with __proto__ key", () => {
      const pollutedEntry = JSON.parse(
        '{"department": "IT", "__proto__": {}}'
      );
      const payload = {
        ...validFinishedPayload,
        userEntry: pollutedEntry,
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects enrollmentAction with constructor key", () => {
      const payload = {
        ...validFinishedPayload,
        enrollmentActions: [
          { label: "Test", status: "finished", constructor: {} },
        ],
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects userEntry with prototype key", () => {
      const payload = {
        ...validFinishedPayload,
        userEntry: { department: "IT", prototype: {} },
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });
  });

  describe("type validation", () => {
    it("rejects null payload", () => {
      const result = validateWebhookPayload(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Payload must be a non-null object");
    });

    it("rejects array payload", () => {
      const result = validateWebhookPayload([]);
      expect(result.valid).toBe(false);
    });

    it("rejects non-object payload (string)", () => {
      const result = validateWebhookPayload("not an object");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Payload must be a non-null object");
    });

    it("rejects non-object payload (number)", () => {
      const result = validateWebhookPayload(42);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Payload must be a non-null object");
    });

    it("rejects undefined payload", () => {
      const result = validateWebhookPayload(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Payload must be a non-null object");
    });
  });

  describe("required fields", () => {
    it("rejects missing name", () => {
      const { name: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing event", () => {
      const { event: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing timestamp", () => {
      const { timestamp: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing started", () => {
      const { started: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing modelName", () => {
      const { modelName: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing modelIdentifier", () => {
      const { modelIdentifier: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing macOSBuild", () => {
      const { macOSBuild: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing macOSVersion", () => {
      const { macOSVersion: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing serialNumber", () => {
      const { serialNumber: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects missing setupManagerVersion", () => {
      const { setupManagerVersion: _, ...payload } = validStartedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects empty string for required field", () => {
      const payload = { ...validStartedPayload, name: "   " };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });
  });

  describe("event type validation", () => {
    it("rejects invalid event type", () => {
      const payload = { ...validStartedPayload, event: "invalid.event.type" };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid event type");
    });

    it("rejects name/event mismatch (Started with finished event)", () => {
      const payload = {
        ...validFinishedPayload,
        name: "Started" as const,
        event: "com.jamf.setupmanager.finished" as const,
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('name must be "Finished" for finished events');
    });

    it("rejects name/event mismatch (Finished with started event)", () => {
      const payload = {
        ...validStartedPayload,
        name: "Finished" as const,
        event: "com.jamf.setupmanager.started" as const,
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('name must be "Started" for started events');
    });
  });

  describe("timestamp validation", () => {
    it("rejects invalid timestamp format", () => {
      const payload = { ...validStartedPayload, timestamp: "not-a-date" };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid timestamp format");
    });

    it("rejects invalid started format", () => {
      const payload = { ...validStartedPayload, started: "invalid-date" };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid started timestamp format");
    });

    it("rejects invalid finished format on finished webhook", () => {
      const payload = { ...validFinishedPayload, finished: "not-valid" };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid finished timestamp format");
    });
  });

  describe("finished webhook specific", () => {
    it("rejects missing duration", () => {
      const { duration: _, ...payload } = validFinishedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("duration must be a non-negative number");
    });

    it("rejects negative duration", () => {
      const payload = { ...validFinishedPayload, duration: -100 };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("duration must be a non-negative number");
    });

    it("rejects non-number duration", () => {
      const payload = { ...validFinishedPayload, duration: "600" };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("duration must be a non-negative number");
    });

    it("rejects missing finished timestamp", () => {
      const { finished: _, ...payload } = validFinishedPayload;
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects non-array enrollmentActions", () => {
      const payload = { ...validFinishedPayload, enrollmentActions: "not-an-array" };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("enrollmentActions must be an array");
    });

    it("rejects invalid enrollmentAction status", () => {
      const payload = {
        ...validFinishedPayload,
        enrollmentActions: [{ label: "Test", status: "pending" }],
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects enrollmentAction missing label", () => {
      const payload = {
        ...validFinishedPayload,
        enrollmentActions: [{ status: "finished" }],
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects enrollmentAction with empty label", () => {
      const payload = {
        ...validFinishedPayload,
        enrollmentActions: [{ label: "", status: "finished" }],
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
    });

    it("rejects invalid userEntry (non-string field)", () => {
      const payload = {
        ...validFinishedPayload,
        userEntry: { department: 123 },
      };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid userEntry object");
    });

    it("rejects negative uploadThroughput", () => {
      const payload = { ...validFinishedPayload, uploadThroughput: -100 };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("uploadThroughput must be a non-negative number");
    });

    it("rejects negative downloadThroughput", () => {
      const payload = { ...validFinishedPayload, downloadThroughput: -50 };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("downloadThroughput must be a non-negative number");
    });

    it("accepts duration of zero", () => {
      const payload = { ...validFinishedPayload, duration: 0 };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });

    it("accepts empty enrollmentActions array", () => {
      const payload = { ...validFinishedPayload, enrollmentActions: [] };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(true);
    });
  });

  describe("optional string field validation", () => {
    it("rejects non-string jamfProVersion", () => {
      const payload = { ...validStartedPayload, jamfProVersion: 123 };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("jamfProVersion must be a string if provided");
    });

    it("rejects non-string jssID", () => {
      const payload = { ...validStartedPayload, jssID: 12345 };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("jssID must be a string if provided");
    });

    it("rejects non-string computerName", () => {
      const payload = { ...validStartedPayload, computerName: true };
      const result = validateWebhookPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("computerName must be a string if provided");
    });
  });
});
