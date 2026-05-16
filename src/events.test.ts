import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEvents, fetchEventStats, insertEvent } from "./events";
import type { StoredEvent } from "./types";

const validEvent = (id: string, timestamp: number): StoredEvent => ({
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
    enrollmentActions: [
      { label: "Install app", status: "finished" },
      { label: "Run script", status: "failed" },
    ],
  },
});

describe("events D1 storage", () => {
  const run = vi.fn();
  const all = vi.fn();
  const first = vi.fn();
  const bind = vi.fn(() => ({ run, all, first }));
  const prepare = vi.fn(() => ({ bind, run, all, first }));
  const mockEnv = {
    DB: { prepare },
  } as unknown as { DB: D1Database };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("insertEvent", () => {
    it("inserts normalized event data and raw payload JSON", async () => {
      const event = validEvent("1", 1000);
      run.mockResolvedValue({ success: true });

      await insertEvent(mockEnv, event);

      expect(prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO events"));
      expect(bind).toHaveBeenCalledWith(
        "test-event-1",
        "com.jamf.setupmanager.finished",
        "Finished",
        1000,
        JSON.stringify(event.payload),
        "SN1",
        "MacBook Pro",
        "Mac15,3",
        "15.0",
        "24A335",
        "2.0.0",
        event.payload.started,
        "1970-01-01T00:01:01.000Z",
        60,
        null,
        null,
        null,
        null,
        null,
        1,
        2,
        1,
        expect.any(Number),
      );
      expect(run).toHaveBeenCalled();
    });
  });

  describe("fetchEvents", () => {
    it("returns events ordered by the D1 query result", async () => {
      const event1 = validEvent("1", 1000);
      const event2 = validEvent("2", 2000);
      all.mockResolvedValue({
        results: [
          {
            event_id: event2.eventId,
            timestamp: event2.timestamp,
            payload_json: JSON.stringify(event2.payload),
          },
          {
            event_id: event1.eventId,
            timestamp: event1.timestamp,
            payload_json: JSON.stringify(event1.payload),
          },
        ],
      });

      const events = await fetchEvents(mockEnv, 50);

      expect(bind).toHaveBeenCalledWith(50);
      expect(events.map((event) => event.eventId)).toEqual([
        "test-event-2",
        "test-event-1",
      ]);
    });

    it("filters invalid payload JSON rows", async () => {
      const event = validEvent("1", 1000);
      all.mockResolvedValue({
        results: [
          {
            event_id: event.eventId,
            timestamp: event.timestamp,
            payload_json: JSON.stringify(event.payload),
          },
          {
            event_id: "bad",
            timestamp: 2000,
            payload_json: "not json",
          },
        ],
      });

      const events = await fetchEvents(mockEnv);

      expect(events).toHaveLength(1);
      expect(events[0].eventId).toBe("test-event-1");
    });
  });

  describe("fetchEventStats", () => {
    it("maps aggregate D1 results into dashboard stats", async () => {
      first.mockResolvedValue({
        total: 10,
        started: 5,
        finished: 5,
        avg_duration: 72.4,
        failed_actions: 2,
        total_actions: 20,
        devices: 8,
        last_event_time: 2000,
      });

      const stats = await fetchEventStats(mockEnv);

      expect(stats).toEqual({
        total: 10,
        started: 5,
        finished: 5,
        avgDuration: 72,
        successRate: 90,
        devices: 8,
        lastEventTime: 2000,
      });
    });
  });
});
