import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  explanation: text("explanation").notNull(),
  diagram: text("diagram"),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  tags: text("tags"), // JSON array stored as text
  channel: text("channel").notNull(),
  subChannel: text("sub_channel").notNull(),
  sourceUrl: text("source_url"),
  videos: text("videos"), // JSON object stored as text
  companies: text("companies"), // JSON array stored as text
  eli5: text("eli5"),
  tldr: text("tldr"),
  relevanceScore: integer("relevance_score"), // 0-100 interview relevance score
  relevanceDetails: text("relevance_details"), // JSON with detailed scoring breakdown
  voiceKeywords: text("voice_keywords"), // JSON array of mandatory keywords for voice interview
  voiceSuitable: integer("voice_suitable"), // 1 = suitable for voice interview, 0 = not suitable
  status: text("status").default("active"), // active, flagged, deleted
  isNew: integer("is_new").default(1), // 1 = new (less than 7 days old), 0 = not new
  lastUpdated: text("last_updated"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const channelMappings = sqliteTable("channel_mappings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: text("channel_id").notNull(),
  subChannel: text("sub_channel").notNull(),
  questionId: text("question_id").notNull().references(() => questions.id),
});

// Work queue for bot coordination
export const workQueue = sqliteTable("work_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemType: text("item_type").notNull(), // 'question', 'challenge', 'test', 'blog'
  itemId: text("item_id").notNull(),
  action: text("action").notNull(), // 'improve', 'delete', 'verify', 'enrich'
  priority: integer("priority").default(5), // 1=highest, 10=lowest
  status: text("status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  reason: text("reason"), // why this work was created
  createdBy: text("created_by"), // which bot created this work item
  assignedTo: text("assigned_to"), // which bot should process
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  processedAt: text("processed_at"),
  result: text("result"), // JSON result or error message
});

// Audit ledger for all bot actions
export const botLedger = sqliteTable("bot_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  botName: text("bot_name").notNull(),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'verify', 'flag'
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  beforeState: text("before_state"), // JSON snapshot before action
  afterState: text("after_state"), // JSON snapshot after action
  reason: text("reason"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Bot run history
export const botRuns = sqliteTable("bot_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  botName: text("bot_name").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  status: text("status").default("running"), // 'running', 'completed', 'failed'
  itemsProcessed: integer("items_processed").default(0),
  itemsCreated: integer("items_created").default(0),
  itemsUpdated: integer("items_updated").default(0),
  itemsDeleted: integer("items_deleted").default(0),
  summary: text("summary"), // JSON summary
});

// Question relationships for voice session grouping
export const questionRelationships = sqliteTable("question_relationships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceQuestionId: text("source_question_id").notNull().references(() => questions.id),
  targetQuestionId: text("target_question_id").notNull().references(() => questions.id),
  relationshipType: text("relationship_type").notNull(), // 'prerequisite', 'follow_up', 'related', 'deeper_dive'
  strength: integer("strength").default(50), // 0-100 how strongly related
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Voice sessions - pre-built sessions of related questions
export const voiceSessions = sqliteTable("voice_sessions", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  description: text("description"),
  channel: text("channel").notNull(),
  difficulty: text("difficulty").notNull(),
  questionIds: text("question_ids").notNull(), // JSON array of question IDs in order
  totalQuestions: integer("total_questions").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(5),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastUpdated: text("last_updated"),
});

// Certifications table - stores all certification tracks
export const certifications = sqliteTable("certifications", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("award"),
  color: text("color").default("text-primary"),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced, expert
  category: text("category").notNull(), // cloud, devops, security, data, ai, development, management
  estimatedHours: integer("estimated_hours").default(40),
  examCode: text("exam_code"),
  officialUrl: text("official_url"),
  domains: text("domains"), // JSON array of exam domains with weights
  channelMappings: text("channel_mappings"), // JSON array of channel mappings
  tags: text("tags"), // JSON array of tags
  prerequisites: text("prerequisites"), // JSON array of prerequisite cert IDs
  status: text("status").default("active"), // active, draft, archived
  questionCount: integer("question_count").default(0), // cached count of questions
  passingScore: integer("passing_score").default(70), // percentage needed to pass
  examDuration: integer("exam_duration").default(90), // minutes
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastUpdated: text("last_updated"),
});

// Question history tracking - records all changes and events for each question
export const questionHistory = sqliteTable("question_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: text("question_id").notNull(), // Can be question ID, test question ID, or coding challenge ID
  questionType: text("question_type").notNull().default("question"), // 'question', 'test', 'coding'
  eventType: text("event_type").notNull(), // 'created', 'updated', 'improved', 'flagged', 'verified', 'enriched', 'deleted', 'restored'
  eventSource: text("event_source").notNull(), // 'bot', 'user', 'system', 'import'
  sourceName: text("source_name"), // specific bot name or user identifier
  changesSummary: text("changes_summary"), // human-readable summary of what changed
  changedFields: text("changed_fields"), // JSON array of field names that changed
  beforeSnapshot: text("before_snapshot"), // JSON snapshot of relevant fields before change
  afterSnapshot: text("after_snapshot"), // JSON snapshot of relevant fields after change
  reason: text("reason"), // why this change was made
  metadata: text("metadata"), // JSON for additional context (e.g., improvement score, verification result)
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// User sessions - track active/in-progress sessions for resume functionality
export const userSessions = sqliteTable("user_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id"), // Optional - for future user auth
  sessionType: text("session_type").notNull(), // 'test', 'voice-interview', 'certification', 'channel'
  sessionKey: text("session_key").notNull(), // Unique key for the session (e.g., 'test-session-aws')
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  channelId: text("channel_id"),
  certificationId: text("certification_id"),
  progress: integer("progress").default(0), // 0-100
  totalItems: integer("total_items").notNull(),
  completedItems: integer("completed_items").default(0),
  sessionData: text("session_data"), // JSON blob with session-specific data
  startedAt: text("started_at").$defaultFn(() => new Date().toISOString()),
  lastAccessedAt: text("last_accessed_at").$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
  status: text("status").default("active"), // 'active', 'completed', 'abandoned'
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuestionSchema = createInsertSchema(questions);
export const insertQuestionHistorySchema = createInsertSchema(questionHistory);
export const insertCertificationSchema = createInsertSchema(certifications);
export const insertUserSessionSchema = createInsertSchema(userSessions);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestionHistory = z.infer<typeof insertQuestionHistorySchema>;
export type QuestionHistory = typeof questionHistory.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Certification = typeof certifications.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
