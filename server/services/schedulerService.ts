import * as cron from 'node-cron';
import { storage } from '../storage';
import { newsService } from './newsService';
import { ClaudeService } from './claudeService';
import { EmailService } from './emailService';

export class SchedulerService {
  private jobs: Map<number, cron.ScheduledTask> = new Map();

  async start() {
    console.log('Starting scheduler service...');
    
    // Load existing schedules
    const schedules = await storage.getEnabledSchedules();
    
    for (const schedule of schedules) {
      this.scheduleJob(schedule);
    }

    // Check for daily schedules every minute
    cron.schedule('* * * * *', async () => {
      await this.checkDailySchedules();
    });

    console.log(`Loaded ${schedules.length} scheduled jobs`);
  }

  async scheduleJob(schedule: any) {
    const cronPattern = this.getCronPattern(schedule.frequency, schedule.time);
    
    const task = cron.schedule(cronPattern, async () => {
      await this.executeSchedule(schedule);
    }, {
      scheduled: true,
      timezone: "America/New_York" // This should be configurable
    });

    this.jobs.set(schedule.id, task);
    
    await storage.createActivityLog({
      message: `Scheduled job created: ${schedule.name}`,
      details: `Frequency: ${schedule.frequency}, Time: ${schedule.time}`,
      type: 'info'
    });
  }

  async unscheduleJob(scheduleId: number) {
    const task = this.jobs.get(scheduleId);
    if (task) {
      task.stop();
      this.jobs.delete(scheduleId);
    }
  }

  private getCronPattern(frequency: string, time: string): string {
    const [hours, minutes] = time.split(':');
    
    switch (frequency) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
      case 'weekly':
        return `${minutes} ${hours} * * 1`; // Monday
      case 'monthly':
        return `${minutes} ${hours} 1 * *`; // 1st of month
      default:
        return `${minutes} ${hours} * * *`;
    }
  }

  private async checkDailySchedules() {
    const settings = await storage.getSettings();
    if (!settings?.dailyScheduleEnabled) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime === settings.dailyScheduleTime) {
      await this.executeDailyGeneration();
    }
  }

  private async executeDailyGeneration() {
    try {
      const settings = await storage.getSettings();
      if (!settings?.defaultNewsSource) return;

      await storage.createActivityLog({
        message: 'Starting daily newsletter generation',
        details: 'Automated daily generation triggered',
        type: 'info'
      });

      // Fetch news articles
      const articles = await newsService.fetchNewsFromUrl(settings.defaultNewsSource);
      
      // Clear existing articles and add new ones
      await storage.clearArticles();
      
      // Auto-select articles based on settings
      const selectedArticles = articles.slice(0, settings.maxDailyArticles || 5);
      
      for (const article of selectedArticles) {
        await storage.createArticle({
          ...article,
          selected: settings.autoSelectArticles || false
        });
      }

      // Generate newsletter if auto-approval is enabled or approval is not required
      if (!settings.approvalRequired) {
        await this.generateAndProcessNewsletter(settings);
      } else {
        await storage.createActivityLog({
          message: 'Daily articles fetched, awaiting manual generation',
          details: `Fetched ${selectedArticles.length} articles`,
          type: 'info'
        });
      }

    } catch (error) {
      await storage.createActivityLog({
        message: 'Daily generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'error'
      });
    }
  }

  private async executeSchedule(schedule: any) {
    try {
      await storage.createActivityLog({
        message: `Executing scheduled job: ${schedule.name}`,
        details: `Fetching from: ${schedule.newsSourceUrl}`,
        type: 'info'
      });

      // Fetch articles from scheduled source
      const articles = await newsService.fetchNewsFromUrl(schedule.newsSourceUrl);
      
      // Clear existing articles and add new ones
      await storage.clearArticles();
      
      const selectedArticles = articles.slice(0, schedule.maxArticles || 5);
      
      for (const article of selectedArticles) {
        await storage.createArticle({
          ...article,
          selected: true // Auto-select for scheduled jobs
        });
      }

      // Update last run time
      await storage.updateSchedule(schedule.id, {
        lastRun: new Date(),
        nextRun: this.calculateNextRun(schedule.frequency, schedule.time)
      });

      // Generate newsletter if auto-approval is enabled
      if (schedule.autoApprove) {
        const settings = await storage.getSettings();
        if (settings) {
          await this.generateAndProcessNewsletter(settings);
        }
      }

      await storage.createActivityLog({
        message: `Schedule executed successfully: ${schedule.name}`,
        details: `Processed ${selectedArticles.length} articles`,
        type: 'success'
      });

    } catch (error) {
      await storage.createActivityLog({
        message: `Schedule execution failed: ${schedule.name}`,
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'error'
      });
    }
  }

  private async generateAndProcessNewsletter(settings: any) {
    if (!settings.claudeApiKey) return;

    const articles = await storage.getArticles();
    const selectedArticles = articles.filter(article => article.selected);

    if (selectedArticles.length === 0) return;

    const claudeService = new ClaudeService(settings.claudeApiKey);
    const nextIssueNumber = await storage.getNextIssueNumber();

    const content = await claudeService.generateNewsletter({
      articles: selectedArticles.map(article => ({
        title: article.title,
        content: article.content || undefined,
        source: article.source,
        publishedDate: article.publishedDate,
      })),
      issueNumber: nextIssueNumber,
      date: new Date(),
      newsletterTitle: settings.newsletterTitle || "AI Weekly",
      temperature: parseFloat(settings.claudeTemperature || "0.7"),
      maxTokens: settings.claudeMaxTokens || 4000,
      model: settings.claudeModel || "claude-sonnet-4-20250514"
    });

    const wordCount = content.split(/\s+/).length;

    const newsletter = await storage.createNewsletter({
      issueNumber: nextIssueNumber,
      title: `${settings.newsletterTitle || "AI Weekly"} #${nextIssueNumber}`,
      content,
      htmlContent: null,
      date: new Date(),
      status: settings.approvalRequired ? "generated" : "approved",
      frequency: "daily",
      scheduleTime: settings.dailyScheduleTime,
      approvalRequired: settings.approvalRequired || false,
      approvalEmail: settings.approvalEmail,
      approvedBy: null,
      wordCount,
      beehiivId: null,
      beehiivUrl: null
    });

    // Send approval email if required
    if (settings.approvalRequired && settings.sendgridApiKey && settings.approvalEmail) {
      const emailService = new EmailService(settings.sendgridApiKey);
      await emailService.sendApprovalEmail(
        settings.approvalEmail,
        newsletter.title,
        content,
        newsletter.id
      );
    }
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

export const schedulerService = new SchedulerService();