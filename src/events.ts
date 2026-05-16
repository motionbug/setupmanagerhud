import {
  isFinishedWebhook,
  type SetupManagerFinishedWebhook,
  type StoredEvent,
} from "./types";

interface EventsEnv {
  DB: D1Database;
}

interface EventRow {
  event_id: string;
  timestamp: number;
  payload_json: string;
}

export interface EventStats {
  total: number;
  started: number;
  finished: number;
  avgDuration: number;
  successRate: number;
  devices: number;
  lastEventTime: number | null;
}

function getFinishedPayload(
  event: StoredEvent,
): SetupManagerFinishedWebhook | null {
  return isFinishedWebhook(event.payload) ? event.payload : null;
}

function getActionCounts(payload: SetupManagerFinishedWebhook | null): {
  failedActionCount: number;
  totalActionCount: number;
} {
  const actions = payload?.enrollmentActions ?? [];
  return {
    failedActionCount: actions.filter((action) => action.status === "failed").length,
    totalActionCount: actions.length,
  };
}

export async function insertEvent(
  env: EventsEnv,
  event: StoredEvent,
): Promise<void> {
  const payload = event.payload;
  const finishedPayload = getFinishedPayload(event);
  const { failedActionCount, totalActionCount } = getActionCounts(finishedPayload);

  await env.DB.prepare(
    `INSERT INTO events (
      event_id,
      event_type,
      name,
      timestamp,
      payload_json,
      serial_number,
      model_name,
      model_identifier,
      macos_version,
      macos_build,
      setup_manager_version,
      started_at,
      finished_at,
      duration_seconds,
      computer_name,
      user_id,
      department,
      download_throughput,
      upload_throughput,
      failed_action_count,
      total_action_count,
      has_failed_actions,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      event.eventId,
      payload.event,
      payload.name,
      event.timestamp,
      JSON.stringify(payload),
      payload.serialNumber,
      payload.modelName,
      payload.modelIdentifier,
      payload.macOSVersion,
      payload.macOSBuild,
      payload.setupManagerVersion,
      payload.started,
      finishedPayload?.finished ?? null,
      finishedPayload?.duration ?? null,
      finishedPayload?.computerName ?? null,
      finishedPayload?.userEntry?.userID ?? null,
      finishedPayload?.userEntry?.department ?? null,
      finishedPayload?.downloadThroughput ?? null,
      finishedPayload?.uploadThroughput ?? null,
      failedActionCount,
      totalActionCount,
      failedActionCount > 0 ? 1 : 0,
      Date.now(),
    )
    .run();
}

export async function fetchEvents(
  env: EventsEnv,
  limit = 200,
): Promise<StoredEvent[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 200, 1), 1000);
  const result = await env.DB.prepare(
    `SELECT event_id, timestamp, payload_json
     FROM events
     ORDER BY timestamp DESC
     LIMIT ?`
  )
    .bind(safeLimit)
    .all<EventRow>();

  return (result.results ?? [])
    .map((row) => {
      try {
        const payload = JSON.parse(row.payload_json);
        if (
          payload &&
          typeof payload === "object" &&
          payload.event &&
          typeof row.timestamp === "number" &&
          typeof row.event_id === "string"
        ) {
          return {
            eventId: row.event_id,
            timestamp: row.timestamp,
            payload,
          } as StoredEvent;
        }
      } catch {
        return null;
      }
      return null;
    })
    .filter((event): event is StoredEvent => event !== null);
}

export async function fetchEventStats(env: EventsEnv): Promise<EventStats> {
  const result = await env.DB.prepare(
    `SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN event_type = 'com.jamf.setupmanager.started' THEN 1 ELSE 0 END) AS started,
      SUM(CASE WHEN event_type = 'com.jamf.setupmanager.finished' THEN 1 ELSE 0 END) AS finished,
      AVG(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds ELSE NULL END) AS avg_duration,
      SUM(failed_action_count) AS failed_actions,
      SUM(total_action_count) AS total_actions,
      COUNT(DISTINCT serial_number) AS devices,
      MAX(timestamp) AS last_event_time
     FROM events`
  ).first<{
    total: number;
    started: number | null;
    finished: number | null;
    avg_duration: number | null;
    failed_actions: number | null;
    total_actions: number | null;
    devices: number;
    last_event_time: number | null;
  }>();

  const total = result?.total ?? 0;
  const finished = result?.finished ?? 0;
  const totalActions = result?.total_actions ?? 0;
  const failedActions = result?.failed_actions ?? 0;

  return {
    total,
    started: result?.started ?? 0,
    finished,
    avgDuration: Math.round(result?.avg_duration ?? 0),
    successRate:
      totalActions > 0
        ? Math.round(((totalActions - failedActions) / totalActions) * 100)
        : finished > 0
          ? 100
          : 0,
    devices: result?.devices ?? 0,
    lastEventTime: result?.last_event_time ?? null,
  };
}
