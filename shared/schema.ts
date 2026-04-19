import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  explanation: text("explanation").notNull(),
  diagram: text("diagram"),
  difficulty: text("difficulty").notNull(),
  tags: text("tags"),
  channel: text("channel").notNull(),
  subChannel: text("sub_channel").notNull(),
  sourceUrl: text("source_url"),
  videos: text("videos"),
  companies: text("companies"),
  eli5: text("eli5"),
  tldr: text("tldr"),
  relevanceScore: integer("relevance_score"),
  relevanceDetails: text("relevance_details"),
  jobTitleRelevance: text("job_title_relevance"),
  experienceLevelTags: text("experience_level_tags"),
  voiceKeywords: text("voice_keywords"),
  voiceSuitable: integer("voice_suitable"),
  status: text("status").default("active"),
  isNew: integer("is_new").default(1),
  lastUpdated: text("last_updated"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const channelMappings = pgTable("channel_mappings", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  subChannel: text("sub_channel").notNull(),
  questionId: text("question_id").notNull().references(() => questions.id),
});

export const workQueue = pgTable("work_queue", {
  id: serial("id").primaryKey(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  action: text("action").notNull(),
  priority: integer("priority").default(5),
  status: text("status").default("pending"),
  reason: text("reason"),
  createdBy: text("created_by"),
  assignedTo: text("assigned_to"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  processedAt: text("processed_at"),
  result: text("result"),
});

export const botLedger = pgTable("bot_ledger", {
  id: serial("id").primaryKey(),
  botName: text("bot_name").notNull(),
  action: text("action").notNull(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  beforeState: text("before_state"),
  afterState: text("after_state"),
  reason: text("reason"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const botRuns = pgTable("bot_runs", {
  id: serial("id").primaryKey(),
  botName: text("bot_name").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  status: text("status").default("running"),
  itemsProcessed: integer("items_processed").default(0),
  itemsCreated: integer("items_created").default(0),
  itemsUpdated: integer("items_updated").default(0),
  itemsDeleted: integer("items_deleted").default(0),
  summary: text("summary"),
});

export const questionRelationships = pgTable("question_relationships", {
  id: serial("id").primaryKey(),
  sourceQuestionId: text("source_question_id").notNull().references(() => questions.id),
  targetQuestionId: text("target_question_id").notNull().references(() => questions.id),
  relationshipType: text("relationship_type").notNull(),
  strength: integer("strength").default(50),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const voiceSessions = pgTable("voice_sessions", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  description: text("description"),
  channel: text("channel").notNull(),
  difficulty: text("difficulty").notNull(),
  questionIds: text("question_ids").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(5),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastUpdated: text("last_updated"),
});

export const certifications = pgTable("certifications", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("award"),
  color: text("color").default("text-primary"),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  estimatedHours: integer("estimated_hours").default(40),
  examCode: text("exam_code"),
  officialUrl: text("official_url"),
  domains: text("domains"),
  channelMappings: text("channel_mappings"),
  tags: text("tags"),
  prerequisites: text("prerequisites"),
  status: text("status").default("active"),
  questionCount: integer("question_count").default(0),
  passingScore: integer("passing_score").default(70),
  examDuration: integer("exam_duration").default(90),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastUpdated: text("last_updated"),
});

export const questionHistory = pgTable("question_history", {
  id: serial("id").primaryKey(),
  questionId: text("question_id").notNull(),
  questionType: text("question_type").notNull().default("question"),
  eventType: text("event_type").notNull(),
  eventSource: text("event_source").notNull(),
  sourceName: text("source_name"),
  changesSummary: text("changes_summary"),
  changedFields: text("changed_fields"),
  beforeSnapshot: text("before_snapshot"),
  afterSnapshot: text("after_snapshot"),
  reason: text("reason"),
  metadata: text("metadata"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id"),
  sessionType: text("session_type").notNull(),
  sessionKey: text("session_key").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  channelId: text("channel_id"),
  certificationId: text("certification_id"),
  progress: integer("progress").default(0),
  totalItems: integer("total_items").notNull(),
  completedItems: integer("completed_items").default(0),
  sessionData: text("session_data"),
  startedAt: text("started_at").$defaultFn(() => new Date().toISOString()),
  lastAccessedAt: text("last_accessed_at").$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
  status: text("status").default("active"),
});

export const learningPaths = pgTable("learning_paths", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pathType: text("path_type").notNull(),
  targetCompany: text("target_company"),
  targetJobTitle: text("target_job_title"),
  difficulty: text("difficulty").notNull(),
  estimatedHours: integer("estimated_hours").default(40),
  questionIds: text("question_ids").notNull(),
  channels: text("channels").notNull(),
  tags: text("tags"),
  prerequisites: text("prerequisites"),
  learningObjectives: text("learning_objectives"),
  milestones: text("milestones"),
  popularity: integer("popularity").default(0),
  completionRate: integer("completion_rate").default(0),
  averageRating: integer("average_rating").default(0),
  metadata: text("metadata"),
  status: text("status").default("active"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastUpdated: text("last_updated"),
  lastGenerated: text("last_generated"),
});

export const codingChallenges = pgTable("coding_challenges", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  tags: text("tags"),
  companies: text("companies"),
  starterCodeJs: text("starter_code_js"),
  starterCodePy: text("starter_code_py"),
  testCases: text("test_cases").notNull(),
  hints: text("hints"),
  solutionJs: text("solution_js"),
  solutionPy: text("solution_py"),
  complexityTime: text("complexity_time"),
  complexitySpace: text("complexity_space"),
  complexityExplanation: text("complexity_explanation"),
  timeLimit: integer("time_limit").default(15),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastUpdated: text("last_updated"),
});

export const blogPosts = pgTable("blog_posts", {
  id: text("id").primaryKey(),
  questionId: text("question_id").references(() => questions.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  sections: text("sections"),
  tags: text("tags"),
  channel: text("channel"),
  imageUrl: text("image_url"),
  svgContent: text("svg_content"),
  status: text("status").default("published"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastUpdated: text("last_updated"),
});

export const flashcards = pgTable("flashcards", {
  id: text("id").primaryKey(),
  questionId: text("question_id").references(() => questions.id),
  channel: text("channel"),
  difficulty: text("difficulty"),
  tags: text("tags"),
  front: text("front").notNull(),
  back: text("back").notNull(),
  hint: text("hint"),
  mnemonic: text("mnemonic"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const tests = pgTable("tests", {
  id: text("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  channelName: text("channel_name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questions: text("questions").notNull(),
  passingScore: integer("passing_score").default(70),
  version: integer("version").default(1),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  lastUpdated: text("last_updated"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuestionSchema = createInsertSchema(questions);
export const insertQuestionHistorySchema = createInsertSchema(questionHistory);
export const insertCertificationSchema = createInsertSchema(certifications);
export const insertUserSessionSchema = createInsertSchema(userSessions);
export const insertLearningPathSchema = createInsertSchema(learningPaths);
export const insertCodingChallengeSchema = createInsertSchema(codingChallenges);
export const insertBlogPostSchema = createInsertSchema(blogPosts);
export const insertFlashcardSchema = createInsertSchema(flashcards);
export const insertTestSchema = createInsertSchema(tests);

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
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertCodingChallenge = z.infer<typeof insertCodingChallengeSchema>;
export type CodingChallenge = typeof codingChallenges.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export const blogAuthors = pgTable("blog_authors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  twitterHandle: text("twitter_handle"),
});

export const blogCategories = pgTable("blog_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
});

export const insertBlogAuthorSchema = createInsertSchema(blogAuthors);
export const insertBlogCategorySchema = createInsertSchema(blogCategories);

export type BlogAuthor = typeof blogAuthors.$inferSelect;
export type BlogCategory = typeof blogCategories.$inferSelect;
