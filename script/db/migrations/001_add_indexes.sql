-- Performance Optimization Indexes
-- Run this migration to significantly improve query performance

-- Questions table indexes
CREATE INDEX IF NOT EXISTS idx_questions_channel ON questions(channel);
CREATE INDEX IF NOT EXISTS idx_questions_channel_difficulty ON questions(channel, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_channel_subchannel ON questions(channel, sub_channel);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_status_channel ON questions(status, channel);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_voice_suitable ON questions(voice_suitable);
CREATE INDEX IF NOT EXISTS idx_questions_last_updated ON questions(last_updated);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- Channel mappings indexes
CREATE INDEX IF NOT EXISTS idx_channel_mappings_channel ON channel_mappings(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_mappings_question ON channel_mappings(question_id);
CREATE INDEX IF NOT EXISTS idx_channel_mappings_channel_subchannel ON channel_mappings(channel_id, sub_channel);

-- Work queue indexes (critical for bot performance)
CREATE INDEX IF NOT EXISTS idx_work_queue_status ON work_queue(status);
CREATE INDEX IF NOT EXISTS idx_work_queue_status_priority ON work_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_work_queue_assigned ON work_queue(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_work_queue_created_by ON work_queue(created_by);
CREATE INDEX IF NOT EXISTS idx_work_queue_item ON work_queue(item_type, item_id);

-- Bot ledger indexes (for audit queries)
CREATE INDEX IF NOT EXISTS idx_bot_ledger_bot ON bot_ledger(bot_name);
CREATE INDEX IF NOT EXISTS idx_bot_ledger_item ON bot_ledger(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_bot_ledger_action ON bot_ledger(action);
CREATE INDEX IF NOT EXISTS idx_bot_ledger_created ON bot_ledger(created_at);

-- Bot runs indexes
CREATE INDEX IF NOT EXISTS idx_bot_runs_bot ON bot_runs(bot_name);
CREATE INDEX IF NOT EXISTS idx_bot_runs_status ON bot_runs(status);
CREATE INDEX IF NOT EXISTS idx_bot_runs_started ON bot_runs(started_at);

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_channel ON blog_posts(channel);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at);

-- Coding challenges indexes
CREATE INDEX IF NOT EXISTS idx_coding_challenges_difficulty ON coding_challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_coding_challenges_category ON coding_challenges(category);
CREATE INDEX IF NOT EXISTS idx_coding_challenges_created ON coding_challenges(created_at);

-- Full-text search index for questions (if supported)
-- Note: SQLite FTS5 requires separate table, this is a placeholder
-- CREATE VIRTUAL TABLE IF NOT EXISTS questions_fts USING fts5(question, answer, explanation, content=questions);
