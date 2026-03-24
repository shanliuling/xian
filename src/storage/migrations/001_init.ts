export const INIT_SQL = `
CREATE TABLE IF NOT EXISTS player_profile (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  sect         TEXT NOT NULL,
  faction      TEXT NOT NULL,
  traits       TEXT NOT NULL DEFAULT '[]',
  created_at   INTEGER NOT NULL,
  last_played  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS player_state (
  player_id    TEXT PRIMARY KEY,
  realm        TEXT NOT NULL DEFAULT 'novice',
  cultivation  REAL NOT NULL DEFAULT 0,
  foundation   REAL NOT NULL DEFAULT 10,
  vibe         REAL NOT NULL DEFAULT 5,
  heart        REAL NOT NULL DEFAULT 80,
  prestige     INTEGER NOT NULL DEFAULT 0,
  vibe_rot     INTEGER NOT NULL DEFAULT 0,
  active_path  TEXT NOT NULL DEFAULT 'orthodox',
  last_commit_at INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL,
  FOREIGN KEY (player_id) REFERENCES player_profile(id)
);

CREATE TABLE IF NOT EXISTS cultivation_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id    TEXT NOT NULL,
  timestamp    INTEGER NOT NULL,
  commit_hash  TEXT,
  lines_total  INTEGER NOT NULL DEFAULT 0,
  delta_json   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id    TEXT NOT NULL,
  timestamp    INTEGER NOT NULL,
  event_type   TEXT NOT NULL,
  content      TEXT NOT NULL,
  params_json  TEXT
);

CREATE TABLE IF NOT EXISTS tribulation_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id    TEXT NOT NULL,
  timestamp    INTEGER NOT NULL,
  realm        TEXT NOT NULL,
  type         TEXT NOT NULL,
  choice       TEXT,
  result       TEXT NOT NULL,
  delta_json   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id    TEXT NOT NULL,
  key          TEXT NOT NULL,
  unlocked_at  INTEGER NOT NULL,
  UNIQUE(player_id, key)
);

CREATE TABLE IF NOT EXISTS ai_content_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id    TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  consumed     INTEGER NOT NULL DEFAULT 0,
  event_json   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_log_player
  ON event_log(player_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_cultivation_log_player
  ON cultivation_log(player_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cache_player
  ON ai_content_cache(player_id, consumed, created_at);
`;
