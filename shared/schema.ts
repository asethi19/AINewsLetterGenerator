import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  source: text("source").notNull(),
  url: text("url").notNull(),
  publishedDate: timestamp("published_date").notNull(),
  selected: boolean("selected").default(false),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  issueNumber: integer("issue_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("draft"), // draft, generated, published
  beehiivId: text("beehiiv_id"),
  beehiivUrl: text("beehiiv_url"),
  wordCount: integer("word_count"),
  generatedAt: timestamp("generated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  claudeApiKey: text("claude_api_key"),
  claudeModel: text("claude_model").default("claude-sonnet-4-20250514"),
  claudeTemperature: text("claude_temperature").default("0.7"),
  claudeMaxTokens: integer("claude_max_tokens").default(4000),
  beehiivApiKey: text("beehiiv_api_key"),
  beehiivPublicationId: text("beehiiv_publication_id"),
  newsletterTitle: text("newsletter_title").default("AI Weekly"),
  issueStartNumber: integer("issue_start_number").default(1),
  defaultNewsSource: text("default_news_source"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  details: text("details"),
  type: text("type").notNull(), // info, success, warning, error
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  fetchedAt: true,
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  generatedAt: true,
  publishedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
