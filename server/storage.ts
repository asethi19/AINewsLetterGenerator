import { 
  users, articles, newsletters, settings, activityLogs, schedules,
  type User, type InsertUser, type Article, type InsertArticle,
  type Newsletter, type InsertNewsletter, type Settings, type InsertSettings,
  type ActivityLog, type InsertActivityLog, type Schedule, type InsertSchedule
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Articles
  getArticles(): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticleSelection(id: number, selected: boolean): Promise<Article | undefined>;
  clearArticles(): Promise<void>;
  
  // Newsletters
  getNewsletters(): Promise<Newsletter[]>;
  getNewsletter(id: number): Promise<Newsletter | undefined>;
  getLatestNewsletter(): Promise<Newsletter | undefined>;
  createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  updateNewsletter(id: number, updates: Partial<Newsletter>): Promise<Newsletter | undefined>;
  getNextIssueNumber(): Promise<number>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
  
  // Activity Logs
  getActivityLogs(): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  clearActivityLogs(): Promise<void>;
  
  // Schedules
  getSchedules(): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, updates: Partial<Schedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  getEnabledSchedules(): Promise<Schedule[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private articles: Map<number, Article> = new Map();
  private newsletters: Map<number, Newsletter> = new Map();
  private currentSettings: Settings | undefined = undefined;
  private activityLogs: Map<number, ActivityLog> = new Map();
  private schedules: Map<number, Schedule> = new Map();
  private currentId = 1;
  private articleId = 1;
  private newsletterId = 1;
  private logId = 1;
  private scheduleId = 1;

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Articles
  async getArticles(): Promise<Article[]> {
    return Array.from(this.articles.values()).sort((a, b) => 
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.articleId++;
    const article: Article = { 
      ...insertArticle, 
      id, 
      content: insertArticle.content || null,
      selected: insertArticle.selected || null,
      fetchedAt: new Date()
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticleSelection(id: number, selected: boolean): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (article) {
      const updated = { ...article, selected };
      this.articles.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async clearArticles(): Promise<void> {
    this.articles.clear();
  }

  // Newsletters
  async getNewsletters(): Promise<Newsletter[]> {
    return Array.from(this.newsletters.values()).sort((a, b) => b.issueNumber - a.issueNumber);
  }

  async getNewsletter(id: number): Promise<Newsletter | undefined> {
    return this.newsletters.get(id);
  }

  async getLatestNewsletter(): Promise<Newsletter | undefined> {
    const newsletters = await this.getNewsletters();
    return newsletters[0];
  }

  async createNewsletter(insertNewsletter: InsertNewsletter): Promise<Newsletter> {
    const id = this.newsletterId++;
    const newsletter: Newsletter = {
      ...insertNewsletter,
      id,
      status: insertNewsletter.status || "draft",
      frequency: insertNewsletter.frequency || "manual",
      scheduleTime: insertNewsletter.scheduleTime || null,
      approvalRequired: insertNewsletter.approvalRequired || false,
      approvalEmail: insertNewsletter.approvalEmail || null,
      approvedBy: insertNewsletter.approvedBy || null,
      approvedAt: null,
      htmlContent: insertNewsletter.htmlContent || null,
      beehiivId: insertNewsletter.beehiivId || null,
      beehiivUrl: insertNewsletter.beehiivUrl || null,
      wordCount: insertNewsletter.wordCount || null,
      generatedAt: new Date(),
      publishedAt: null,
    };
    this.newsletters.set(id, newsletter);
    return newsletter;
  }

  async updateNewsletter(id: number, updates: Partial<Newsletter>): Promise<Newsletter | undefined> {
    const newsletter = this.newsletters.get(id);
    if (newsletter) {
      const updated = { ...newsletter, ...updates };
      this.newsletters.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getNextIssueNumber(): Promise<number> {
    const latest = await this.getLatestNewsletter();
    const settings = await this.getSettings();
    return latest ? latest.issueNumber + 1 : (settings?.issueStartNumber || 1);
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    return this.currentSettings;
  }

  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const settings: Settings = {
      id: 1,
      claudeApiKey: insertSettings.claudeApiKey || null,
      claudeModel: insertSettings.claudeModel || null,
      claudeTemperature: insertSettings.claudeTemperature || null,
      claudeMaxTokens: insertSettings.claudeMaxTokens || null,
      beehiivApiKey: insertSettings.beehiivApiKey || null,
      beehiivPublicationId: insertSettings.beehiivPublicationId || null,
      newsletterTitle: insertSettings.newsletterTitle || null,
      issueStartNumber: insertSettings.issueStartNumber || null,
      defaultNewsSource: insertSettings.defaultNewsSource || null,
      sendgridApiKey: insertSettings.sendgridApiKey || null,
      approvalEmail: insertSettings.approvalEmail || null,
      approvalRequired: insertSettings.approvalRequired || false,
      dailyScheduleEnabled: insertSettings.dailyScheduleEnabled || false,
      dailyScheduleTime: insertSettings.dailyScheduleTime || "09:00",
      autoSelectArticles: insertSettings.autoSelectArticles || false,
      maxDailyArticles: insertSettings.maxDailyArticles || 5,
      updatedAt: new Date(),
    };
    this.currentSettings = settings;
    return settings;
  }

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values()).sort((a, b) => 
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.logId++;
    const log: ActivityLog = {
      id,
      message: insertLog.message,
      details: insertLog.details || null,
      type: insertLog.type,
      timestamp: new Date(),
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async clearActivityLogs(): Promise<void> {
    this.activityLogs.clear();
  }

  // Schedules
  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleId++;
    const schedule: Schedule = {
      id,
      name: insertSchedule.name,
      frequency: insertSchedule.frequency,
      time: insertSchedule.time,
      newsSourceUrl: insertSchedule.newsSourceUrl,
      maxArticles: insertSchedule.maxArticles || null,
      autoApprove: insertSchedule.autoApprove || false,
      enabled: insertSchedule.enabled || true,
      lastRun: null,
      nextRun: this.calculateNextRun(insertSchedule.frequency, insertSchedule.time),
      createdAt: new Date(),
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (schedule) {
      const updated = { ...schedule, ...updates };
      if (updates.frequency || updates.time) {
        updated.nextRun = this.calculateNextRun(updated.frequency, updated.time);
      }
      this.schedules.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }

  async getEnabledSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(s => s.enabled);
  }

  private calculateNextRun(frequency: string, time: string): Date {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else if (frequency === 'weekly') {
      nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay()));
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      }
    }

    return nextRun;
  }
}

export const storage = new MemStorage();
