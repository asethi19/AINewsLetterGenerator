import type { 
  User, Article, Newsletter, Settings, ActivityLog, Schedule, 
  SocialMediaPost, FeedSource, DataBackup,
  InsertUser, InsertArticle, InsertNewsletter, InsertSettings, 
  InsertActivityLog, InsertSchedule, InsertSocialMediaPost, 
  InsertFeedSource, InsertDataBackup 
} from '@shared/schema';

export class MockDatabase {
  private users: Map<number, User> = new Map();
  private articles: Map<number, Article> = new Map();
  private newsletters: Map<number, Newsletter> = new Map();
  private settings: Settings | undefined = undefined;
  private activityLogs: Map<number, ActivityLog> = new Map();
  private schedules: Map<number, Schedule> = new Map();
  private socialMediaPosts: Map<number, SocialMediaPost> = new Map();
  private feedSources: Map<number, FeedSource> = new Map();
  private dataBackups: Map<number, DataBackup> = new Map();
  
  private currentId = 1;
  private articleId = 1;
  private newsletterId = 1;
  private logId = 1;
  private scheduleId = 1;
  private socialMediaPostId = 1;
  private feedSourceId = 1;
  private backupId = 1;

  constructor() {
    console.log('📦 Using Mock Database for testing');
    this.initializeTestData();
  }

  private initializeTestData() {
    // Create default settings
    this.settings = {
      id: 1,
      claudeApiKey: null,
      claudeModel: 'claude-sonnet-4-20250514',
      claudeTemperature: 0.7,
      claudeMaxTokens: 4096,
      beehiivApiKey: null,
      beehiivPublicationId: null,
      sendgridApiKey: null,
      newsletterTitle: 'AI Weekly Newsletter',
      defaultNewsSource: 'https://example.com/test-feed',
      autoRefreshNews: true,
      refreshInterval: 300000,
      enableScheduling: true,
      dailyScheduleTime: '09:00',
      autoSelectArticles: false,
      requireApproval: false,
      approvalEmail: null,
      enableSocialMedia: true,
      autoPostSocial: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create sample feed sources
    const sampleFeedSources = [
      {
        name: 'AI News Daily',
        url: 'https://example.com/ai-news',
        category: 'AI',
        description: 'Latest AI developments and breakthroughs',
        enabled: true,
        refreshInterval: 60,
        tags: ['artificial-intelligence', 'machine-learning']
      },
      {
        name: 'Tech Crunch AI',
        url: 'https://example.com/techcrunch-ai',
        category: 'Tech',
        description: 'Technology news focused on AI',
        enabled: true,
        refreshInterval: 120,
        tags: ['startup', 'technology', 'ai']
      }
    ];

    sampleFeedSources.forEach(feedSource => {
      const id = this.feedSourceId++;
      this.feedSources.set(id, {
        id,
        ...feedSource,
        lastFetched: null,
        articleCount: 0,
        errorCount: 0,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Create sample articles
    const sampleArticles = [
      {
        title: 'Breaking: New AI Model Achieves Human-Level Performance',
        content: 'A groundbreaking new AI model has demonstrated human-level performance across multiple benchmarks, marking a significant milestone in artificial intelligence development.',
        source: 'AI Research Institute',
        url: 'https://example.com/ai-breakthrough-2025',
        publishedDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        selected: false
      },
      {
        title: 'The Future of Machine Learning: Trends for 2025',
        content: 'Industry experts share their predictions for machine learning trends that will shape the technology landscape in 2025 and beyond.',
        source: 'ML Weekly',
        url: 'https://example.com/ml-trends-2025',
        publishedDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
        selected: true
      },
      {
        title: 'OpenAI Announces Major Safety Improvements',
        content: 'OpenAI has unveiled new safety measures and alignment techniques designed to make AI systems more reliable and beneficial for humanity.',
        source: 'OpenAI Blog',
        url: 'https://example.com/openai-safety-2025',
        publishedDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
        selected: true
      }
    ];

    sampleArticles.forEach(article => {
      const id = this.articleId++;
      this.articles.set(id, {
        id,
        ...article,
        fetchedAt: new Date()
      });
    });

    // Create activity log
    this.activityLogs.set(this.logId++, {
      id: this.logId,
      message: 'Mock database initialized',
      details: 'Created sample data for testing',
      type: 'info',
      timestamp: new Date()
    });

    console.log('✅ Mock database initialized with sample data');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Article methods
  async getArticles(): Promise<Article[]> {
    return Array.from(this.articles.values()).sort((a, b) => 
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.articleId++;
    const article: Article = { 
      id,
      title: insertArticle.title,
      content: insertArticle.content || null,
      source: insertArticle.source,
      url: insertArticle.url,
      publishedDate: insertArticle.publishedDate || new Date(),
      selected: insertArticle.selected || false,
      fetchedAt: new Date()
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticleSelection(id: number, selected: boolean): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (article) {
      article.selected = selected;
      this.articles.set(id, article);
      return article;
    }
    return undefined;
  }

  async clearArticles(): Promise<void> {
    this.articles.clear();
    this.articleId = 1;
  }

  // Newsletter methods
  async getNewsletters(): Promise<Newsletter[]> {
    return Array.from(this.newsletters.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getNewsletter(id: number): Promise<Newsletter | undefined> {
    return this.newsletters.get(id);
  }

  async getLatestNewsletter(): Promise<Newsletter | undefined> {
    const newsletters = Array.from(this.newsletters.values());
    if (newsletters.length === 0) return undefined;
    return newsletters.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }

  async createNewsletter(insertNewsletter: InsertNewsletter): Promise<Newsletter> {
    const id = this.newsletterId++;
    const newsletter: Newsletter = {
      id,
      issueNumber: insertNewsletter.issueNumber,
      title: insertNewsletter.title,
      content: insertNewsletter.content,
      htmlContent: insertNewsletter.htmlContent || null,
      date: insertNewsletter.date,
      status: insertNewsletter.status || 'draft',
      frequency: insertNewsletter.frequency || 'manual',
      scheduleTime: insertNewsletter.scheduleTime || null,
      approvalRequired: insertNewsletter.approvalRequired || false,
      approvalEmail: insertNewsletter.approvalEmail || null,
      approvedBy: insertNewsletter.approvedBy || null,
      approvedAt: insertNewsletter.approvedAt || null,
      publishedAt: insertNewsletter.publishedAt || null,
      beehiivPostId: insertNewsletter.beehiivPostId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.newsletters.set(id, newsletter);
    return newsletter;
  }

  async updateNewsletter(id: number, updates: Partial<Newsletter>): Promise<Newsletter | undefined> {
    const newsletter = this.newsletters.get(id);
    if (newsletter) {
      const updated = { ...newsletter, ...updates, updatedAt: new Date() };
      this.newsletters.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getNextIssueNumber(): Promise<number> {
    const newsletters = Array.from(this.newsletters.values());
    if (newsletters.length === 0) return 1;
    return Math.max(...newsletters.map(n => n.issueNumber)) + 1;
  }

  // Settings methods
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    this.settings = {
      id: 1,
      ...insertSettings,
      createdAt: this.settings?.createdAt || new Date(),
      updatedAt: new Date()
    };
    return this.settings;
  }

  // Activity log methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.logId++;
    const log: ActivityLog = {
      id,
      message: insertLog.message,
      details: insertLog.details || null,
      type: insertLog.type,
      timestamp: new Date()
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async clearActivityLogs(): Promise<void> {
    this.activityLogs.clear();
    this.logId = 1;
  }

  // Schedule methods
  async getSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleId++;
    const schedule: Schedule = {
      id,
      name: insertSchedule.name,
      frequency: insertSchedule.frequency,
      time: insertSchedule.time,
      newsSource: insertSchedule.newsSource,
      autoSelectArticles: insertSchedule.autoSelectArticles || false,
      autoApprove: insertSchedule.autoApprove || false,
      enabled: insertSchedule.enabled !== false,
      lastRun: insertSchedule.lastRun || null,
      nextRun: insertSchedule.nextRun,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (schedule) {
      const updated = { ...schedule, ...updates, updatedAt: new Date() };
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

  // Social media methods
  async getSocialMediaPosts(): Promise<SocialMediaPost[]> {
    return Array.from(this.socialMediaPosts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getSocialMediaPostsByNewsletter(newsletterId: number): Promise<SocialMediaPost[]> {
    return Array.from(this.socialMediaPosts.values())
      .filter(post => post.newsletterId === newsletterId);
  }

  async createSocialMediaPost(insertPost: InsertSocialMediaPost): Promise<SocialMediaPost> {
    const id = this.socialMediaPostId++;
    const post: SocialMediaPost = {
      id,
      platform: insertPost.platform,
      content: insertPost.content,
      hashtags: insertPost.hashtags || [],
      scheduledFor: insertPost.scheduledFor,
      status: insertPost.status || 'scheduled',
      newsletterId: insertPost.newsletterId,
      engagementHook: insertPost.engagementHook,
      callToAction: insertPost.callToAction,
      createdAt: new Date()
    };
    this.socialMediaPosts.set(id, post);
    return post;
  }

  async updateSocialMediaPost(id: number, updates: Partial<SocialMediaPost>): Promise<SocialMediaPost | undefined> {
    const post = this.socialMediaPosts.get(id);
    if (post) {
      const updated = { ...post, ...updates };
      this.socialMediaPosts.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteSocialMediaPost(id: number): Promise<boolean> {
    return this.socialMediaPosts.delete(id);
  }

  async getScheduledSocialMediaPosts(): Promise<SocialMediaPost[]> {
    return Array.from(this.socialMediaPosts.values())
      .filter(post => post.status === 'scheduled' && post.scheduledFor <= new Date());
  }

  // Feed source methods
  async getFeedSources(): Promise<FeedSource[]> {
    return Array.from(this.feedSources.values());
  }

  async createFeedSource(insertFeedSource: InsertFeedSource): Promise<FeedSource> {
    const id = this.feedSourceId++;
    const feedSource: FeedSource = {
      id,
      name: insertFeedSource.name,
      url: insertFeedSource.url,
      category: insertFeedSource.category,
      description: insertFeedSource.description || null,
      enabled: insertFeedSource.enabled !== false,
      lastFetched: insertFeedSource.lastFetched || null,
      articleCount: insertFeedSource.articleCount || 0,
      errorCount: insertFeedSource.errorCount || 0,
      lastError: insertFeedSource.lastError || null,
      refreshInterval: insertFeedSource.refreshInterval || 60,
      tags: insertFeedSource.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.feedSources.set(id, feedSource);
    return feedSource;
  }

  async updateFeedSource(id: number, updates: Partial<FeedSource>): Promise<FeedSource | undefined> {
    const feedSource = this.feedSources.get(id);
    if (feedSource) {
      const updated = { ...feedSource, ...updates, updatedAt: new Date() };
      this.feedSources.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteFeedSource(id: number): Promise<boolean> {
    return this.feedSources.delete(id);
  }

  async getEnabledFeedSources(): Promise<FeedSource[]> {
    return Array.from(this.feedSources.values()).filter(fs => fs.enabled);
  }

  // Data backup methods
  async createDataBackup(insertBackup: InsertDataBackup): Promise<DataBackup> {
    const id = this.backupId++;
    const backup: DataBackup = {
      id,
      name: insertBackup.name,
      data: insertBackup.data,
      size: insertBackup.size,
      recordCount: insertBackup.recordCount,
      createdAt: new Date()
    };
    this.dataBackups.set(id, backup);
    return backup;
  }

  async getDataBackups(): Promise<DataBackup[]> {
    return Array.from(this.dataBackups.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async deleteDataBackup(id: number): Promise<boolean> {
    return this.dataBackups.delete(id);
  }

  async purgeAllData(): Promise<void> {
    this.articles.clear();
    this.newsletters.clear();
    this.activityLogs.clear();
    this.schedules.clear();
    this.socialMediaPosts.clear();
    this.dataBackups.clear();
    
    // Reset IDs
    this.articleId = 1;
    this.newsletterId = 1;
    this.logId = 1;
    this.scheduleId = 1;
    this.socialMediaPostId = 1;
    this.backupId = 1;
  }

  async exportAllData(): Promise<any> {
    return {
      articles: Array.from(this.articles.values()),
      newsletters: Array.from(this.newsletters.values()),
      settings: this.settings,
      activityLogs: Array.from(this.activityLogs.values()),
      schedules: Array.from(this.schedules.values()),
      socialMediaPosts: Array.from(this.socialMediaPosts.values()),
      feedSources: Array.from(this.feedSources.values()),
      dataBackups: Array.from(this.dataBackups.values()),
      exportedAt: new Date().toISOString()
    };
  }
}

export const mockDb = new MockDatabase();