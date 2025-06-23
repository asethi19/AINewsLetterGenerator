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
  htmlContent: text("html_content"),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("draft"), // draft, generated, approved, published, rejected
  frequency: text("frequency").default("manual"), // manual, daily, weekly
  scheduleTime: text("schedule_time"), // HH:MM format for daily scheduling
  approvalRequired: boolean("approval_required").default(false),
  approvalEmail: text("approval_email"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
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
  // Email settings
  sendgridApiKey: text("sendgrid_api_key"),
  approvalEmail: text("approval_email"),
  approvalRequired: boolean("approval_required").default(false),
  // Scheduling settings
  dailyScheduleEnabled: boolean("daily_schedule_enabled").default(false),
  dailyScheduleTime: text("daily_schedule_time").default("09:00"),
  autoSelectArticles: boolean("auto_select_articles").default(false),
  maxDailyArticles: integer("max_daily_articles").default(5),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  details: text("details"),
  type: text("type").notNull(), // info, success, warning, error
  timestamp: timestamp("timestamp").defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  time: text("time").notNull(), // HH:MM format
  newsSourceUrl: text("news_source_url").notNull(),
  maxArticles: integer("max_articles").default(5),
  autoApprove: boolean("auto_approve").default(false),
  enabled: boolean("enabled").default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // 'twitter', 'instagram', 'youtube'
  content: text("content").notNull(),
  hashtags: text("hashtags").array().default([]),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").default("scheduled"), // 'scheduled', 'posted', 'failed'
  newsletterId: integer("newsletter_id").references(() => newsletters.id),
  engagementHook: text("engagement_hook"),
  callToAction: text("call_to_action"),
  postUrl: text("post_url"), // URL after posting
  engagementStats: text("engagement_stats"), // JSON string for likes, shares, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedSources = pgTable("feed_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(), // 'AI', 'Tech', 'Business', etc.
  description: text("description"),
  enabled: boolean("enabled").default(true),
  lastFetched: timestamp("last_fetched"),
  articleCount: integer("article_count").default(0),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  refreshInterval: integer("refresh_interval").default(60), // minutes
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dataBackups = pgTable("data_backups", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(), // bytes
  recordCount: integer("record_count").notNull(),
  tables: text("tables").array().notNull(), // tables included in backup
  createdAt: timestamp("created_at").defaultNow().notNull(),
  downloadUrl: text("download_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  fetchedAt: true,
}).extend({
  publishedDate: z.union([z.date(), z.string().transform((str) => new Date(str))]).default(() => new Date())
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  generatedAt: true,
  publishedAt: true,
  approvedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  lastRun: true,
  nextRun: true,
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedSourceSchema = createInsertSchema(feedSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastFetched: true,
  articleCount: true,
  errorCount: true,
  lastError: true,
});

export const insertDataBackupSchema = createInsertSchema(dataBackups).omit({
  id: true,
  createdAt: true,
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
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type FeedSource = typeof feedSources.$inferSelect;
export type InsertFeedSource = z.infer<typeof insertFeedSourceSchema>;
export type DataBackup = typeof dataBackups.$inferSelect;
export type InsertDataBackup = z.infer<typeof insertDataBackupSchema>;
