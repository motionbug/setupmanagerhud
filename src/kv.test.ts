import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEvents } from "./kv";

// Valid StoredEvent for testing
const validEvent = (id: string, timestamp: number) => ({
  eventId: `test-event-${id}`,
  timestamp,
  payload: {
    event: "com.jamf.setupmanager.finished",
    name: "Finished",
    timestamp: new Date(timestamp).toISOString(),
    started: new Date(timestamp).toISOString(),
    finished: new Date(timestamp + 60000).toISOString(),
    duration: 60,
    modelName: "MacBook Pro",
    modelIdentifier: "Mac15,3",
    macOSBuild: "24A335",
    macOSVersion: "15.0",
    serialNumber: `SN${id}`,
    setupManagerVersion: "2.0.0",
  },
});

describe("fetchEvents", () => {
  const mockGet = vi.fn();
  const mockList = vi.fn();
  const mockEnv = {
    WEBHOOKS: {
      get: mockGet,
      list: mockList,
    } as unknown as KVNamespace,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("empty KV", () => {
    it("returns empty array when KV list is empty", async () => {
      mockList.mockResolvedValue({ keys: [] });
      const events = await fetchEvents(mockEnv);
      expect(events).toEqual([]);
      expect(mockList).toHaveBeenCalledWith({ limit: 200 });
    });
  });

  describe("valid data", () => {
    it("returns valid events from KV", async () => {
      const event1 = validEvent("1", 1000);
      mockList.mockResolvedValue({ keys: [{ name: "key1" }] });
      mockGet.mockResolvedValue(JSON.stringify(event1));

      const events = await fetchEvents(mockEnv);
      expect(events).toHaveLength(1);
      expect(events[0].eventId).toBe("test-event-1");
    });

    it("sorts events by timestamp descending", async () => {
      const event1 = validEvent("1", 1000);
      const event2 = validEvent("2", 2000);
      const event3 = validEvent("3", 1500);
      mockList.mockResolvedValue({
        keys: [{ name: "key1" }, { name: "key2" }, { name: "key3" }],
      });
      mockGet
        .mockResolvedValueOnce(JSON.stringify(event1))
        .mockResolvedValueOnce(JSON.stringify(event2))
        .mockResolvedValueOnce(JSON.stringify(event3));

      const events = await fetchEvents(mockEnv);
      expect(events.map((e) => e.eventId)).toEqual([
        "test-event-2",
        "test-event-3",
        "test-event-1",
      ]);
    });
  });

  describe("filtering invalid data", () => {
    it("filters out entries where get() returns null", async () => {
      const event1 = validEvent("1", 1000);
      mockList.mockResolvedValue({
        keys: [{ name: "key1" }, { name: "key2" }],
      });
      mockGet
        .mockResolvedValueOnce(JSON.stringify(event1))
        .mockResolvedValueOnce(null);

      const events = await fetchEvents(mockEnv);
      expect(events).toHaveLength(1);
    });

    it("filters out entries with invalid JSON", async () => {
      const event1 = validEvent("1", 1000);
      mockList.mockResolvedValue({
        keys: [{ name: "key1" }, { name: "key2" }],
      });
      mockGet
        .mockResolvedValueOnce(JSON.stringify(event1))
        .mockResolvedValueOnce("not valid json {{{");

      const events = await fetchEvents(mockEnv);
      expect(events).toHaveLength(1);
    });

    it("filters out entries missing payload.event", async () => {
      const event1 = validEvent("1", 1000);
      const invalidEvent = { eventId: "bad", timestamp: 1000, payload: {} };
      mockList.mockResolvedValue({
        keys: [{ name: "key1" }, { name: "key2" }],
      });
      mockGet
        .mockResolvedValueOnce(JSON.stringify(event1))
        .mockResolvedValueOnce(JSON.stringify(invalidEvent));

      const events = await fetchEvents(mockEnv);
      expect(events).toHaveLength(1);
    });

    it("filters out entries missing timestamp", async () => {
      const event1 = validEvent("1", 1000);
      const invalidEvent = {
        eventId: "bad",
        payload: { event: "com.jamf.setupmanager.started" },
      };
      mockList.mockResolvedValue({
        keys: [{ name: "key1" }, { name: "key2" }],
      });
      mockGet
        .mockResolvedValueOnce(JSON.stringify(event1))
        .mockResolvedValueOnce(JSON.stringify(invalidEvent));

      const events = await fetchEvents(mockEnv);
      expect(events).toHaveLength(1);
    });
  });

  describe("limit parameter", () => {
    it("passes custom limit to KV list", async () => {
      mockList.mockResolvedValue({ keys: [] });
      await fetchEvents(mockEnv, 50);
      expect(mockList).toHaveBeenCalledWith({ limit: 50 });
    });

    it("uses default limit of 200", async () => {
      mockList.mockResolvedValue({ keys: [] });
      await fetchEvents(mockEnv);
      expect(mockList).toHaveBeenCalledWith({ limit: 200 });
    });
  });
});
