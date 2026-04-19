/**
 * Centralized KV fetch helper for retrieving StoredEvent objects.
 * Consolidates duplicate patterns from DashboardRoom.ts and index.ts.
 */
import type { StoredEvent } from "./types";

/**
 * Environment interface for KV operations.
 * Intentionally narrow - only requires WEBHOOKS binding.
 */
interface KVEnv {
  WEBHOOKS: KVNamespace;
}

/**
 * Fetches events from KV storage with JSON parsing and shape validation.
 *
 * @param env - Environment with WEBHOOKS KV binding
 * @param limit - Maximum number of events to fetch (default: 200)
 * @returns Sorted array of valid StoredEvent objects (newest first)
 */
export async function fetchEvents(
  env: KVEnv,
  limit = 200
): Promise<StoredEvent[]> {
  const list = await env.WEBHOOKS.list({ limit });

  const events = await Promise.all(
    list.keys.map(async (key) => {
      const data = await env.WEBHOOKS.get(key.name);
      if (!data) return null;
      try {
        const parsed = JSON.parse(data);
        // Basic shape validation per D-06: validate at boundaries
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.payload?.event &&
          typeof parsed.timestamp === "number" &&
          typeof parsed.eventId === "string"
        ) {
          return parsed as StoredEvent;
        }
        return null;
      } catch {
        return null;
      }
    })
  );

  return events
    .filter((e): e is StoredEvent => e !== null)
    .sort((a, b) => b.timestamp - a.timestamp);
}
