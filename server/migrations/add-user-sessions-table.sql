-- Migration: Add user_sessions table for resume feature
-- Date: 2026-01-13
-- Description: Tracks active/in-progress sessions for resume functionality

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_type TEXT NOT NULL,
  session_key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  channel_id TEXT,
  certification_id TEXT,
  progress INTEGER DEFAULT 0,
  total_items INTEGER NOT NULL,
  completed_items INTEGER DEFAULT 0,
  session_data TEXT,
  started_at TEXT NOT NULL,
  last_accessed_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT DEFAULT 'active'
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_accessed ON user_sessions(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_key ON user_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Comments
-- session_type: 'test', 'voice-interview', 'certification', 'channel'
-- session_key: Unique identifier like 'test-session-aws'
-- status: 'active', 'completed', 'abandoned'
-- session_data: JSON blob with activity-specific data
