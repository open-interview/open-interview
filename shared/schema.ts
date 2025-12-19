import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Channels - source of truth for channel metadata
export const channels = sqliteTable("channels", {
  id: text("id").primaryKey(), // e.g., 'system-design', 'algorithms'
  name: text("name").notNull(), // Display name
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Lucide icon name
  color: text("color").notNull(), // Tailwind color class
  category: text("category").notNull(), // 'engineering', 'cloud', 'ai', etc.
  roles: text("roles"), // JSON array of role IDs
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

// Subchannels - source of truth for subchannel metadata
export const subchannels = sqliteTable("subchannels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: text("channel_id").notNull().references(() => channels.id),
  subChannel: text("sub_channel").notNull(), // e.g., 'infrastructure', 'distributed-systems'
  name: text("name").notNull(), // Display name
  tags: text("tags"), // JSON array of related tags for question generation
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
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
  questionId: text("question_id").notNull().references(() => questions.id),
  botType: text("bot_type").notNull(), // 'video', 'mermaid', 'company', 'eli5', 'improve'
  priority: integer("priority").default(5), // 1=highest, 10=lowest
  status: text("status").default("pending"), // 'pending', 'processing', 'completed', 'failed'
  reason: text("reason"), // why this work was created
  createdBy: text("created_by"), // which bot created this work item
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  result: text("result"), // JSON result or error message
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuestionSchema = createInsertSchema(questions);
export const insertChannelSchema = createInsertSchema(channels);
export const insertSubchannelSchema = createInsertSchema(subchannels);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;
export type InsertSubchannel = z.infer<typeof insertSubchannelSchema>;
export type Subchannel = typeof subchannels.$inferSelect;
