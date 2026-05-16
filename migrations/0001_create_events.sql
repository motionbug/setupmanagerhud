CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  name TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  payload_json TEXT NOT NULL,

  serial_number TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_identifier TEXT NOT NULL,
  macos_version TEXT NOT NULL,
  macos_build TEXT NOT NULL,
  setup_manager_version TEXT NOT NULL,

  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_seconds INTEGER,
  computer_name TEXT,
  user_id TEXT,
  department TEXT,
  download_throughput INTEGER,
  upload_throughput INTEGER,
  failed_action_count INTEGER NOT NULL DEFAULT 0,
  total_action_count INTEGER NOT NULL DEFAULT 0,
  has_failed_actions INTEGER NOT NULL DEFAULT 0,

  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_serial_number ON events(serial_number);
CREATE INDEX IF NOT EXISTS idx_events_macos_version ON events(macos_version);
CREATE INDEX IF NOT EXISTS idx_events_model_name ON events(model_name);
CREATE INDEX IF NOT EXISTS idx_events_failed_actions ON events(has_failed_actions);
