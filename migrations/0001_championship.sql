-- Migration 0001: championship
-- Generated from src/championship/schema.mjs by scripts/champ-migrations.mjs. Do not edit by hand.

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  nickname_key TEXT UNIQUE,
  country TEXT NOT NULL,
  recovery_hash TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  titles INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  changed_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS player_tokens (
  token_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tokens_player ON player_tokens (player_id);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  month TEXT NOT NULL,
  seed TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  seq INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  finished_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions (player_id, status);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions (status, ends_at);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  month TEXT NOT NULL,
  country TEXT NOT NULL,
  score INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  answered INTEGER NOT NULL,
  min_gap INTEGER,
  avg_gap INTEGER,
  status TEXT NOT NULL,
  flags TEXT NOT NULL DEFAULT '',
  achieved_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scores_player_month ON scores (player_id, month, status);

CREATE INDEX IF NOT EXISTS idx_scores_status ON scores (status, achieved_at);

CREATE INDEX IF NOT EXISTS idx_scores_month ON scores (month, status);

CREATE TABLE IF NOT EXISTS monthly_best (
  month TEXT NOT NULL,
  player_id TEXT NOT NULL,
  country TEXT NOT NULL,
  score INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  achieved_at INTEGER NOT NULL,
  score_id TEXT NOT NULL,
  PRIMARY KEY (month, player_id)
);

CREATE INDEX IF NOT EXISTS idx_mb_rank ON monthly_best (month, score DESC, errors ASC, achieved_at ASC);

CREATE INDEX IF NOT EXISTS idx_mb_country ON monthly_best (month, country, score DESC, errors ASC, achieved_at ASC);

CREATE TABLE IF NOT EXISTS alltime_best (
  player_id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  score INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  achieved_at INTEGER NOT NULL,
  month TEXT NOT NULL,
  score_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ab_rank ON alltime_best (score DESC, errors ASC, achieved_at ASC);

CREATE INDEX IF NOT EXISTS idx_ab_country ON alltime_best (country, score DESC, errors ASC, achieved_at ASC);

CREATE TABLE IF NOT EXISTS months (
  month TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'open',
  participants INTEGER NOT NULL DEFAULT 0,
  games INTEGER NOT NULL DEFAULT 0,
  closed_at INTEGER
);

CREATE TABLE IF NOT EXISTS monthly_champions (
  month TEXT NOT NULL,
  rank INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  country TEXT NOT NULL,
  score INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  achieved_at INTEGER NOT NULL,
  PRIMARY KEY (month, rank)
);

CREATE INDEX IF NOT EXISTS idx_champions_player ON monthly_champions (player_id, rank);

CREATE TABLE IF NOT EXISTS moderation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  player_id TEXT,
  ref TEXT,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_events_type ON moderation_events (type, resolved, created_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  win INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (key, win)
);

CREATE TABLE IF NOT EXISTS api_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '1');
