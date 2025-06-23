import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { newsService } from "./services/newsService";
import { ClaudeService } from "./services/claudeService";
import { BeehiivService } from "./services/beehiivService";
import { EmailService } from "./services/emailService";
import { schedulerService } from "./services/schedulerService";
import { insertArticleSchema, insertNewsletterSchema, insertSettingsSchema, insertActivityLogSchema, insertScheduleSchema, insertSocialMediaPostSchema, insertFeedSourceSchema, insertDataBackupSchema, type SocialMediaPost, type FeedSource, type DataBackup } from "@shared/schema";
import { SocialMediaService } from "./services/socialMediaService";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // News fetching endpoint
  app.get("/api/news/fetch", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      await storage.createActivityLog({
        message: "Fetching news articles",
        details: `Fetching from URL: ${url}`,
        type: "info"
      });

      // For testing/demo purposes, provide sample data if URL contains 'test' or 'example'
      let articles;
      if (url.includes('test') || url.includes('example')) {
        articles = [
          {
            title: "Sample AI News Article",
            content: "This is a sample article about recent AI developments. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            source: "AI News Daily",
            url: "https://example.com/ai-news-1",
            publishedDate: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            title: "Machine Learning Breakthrough",
            content: "Scientists have made a significant breakthrough in machine learning algorithms. This development promises to revolutionize how we approach artificial intelligence.",
            source: "Tech Research Journal",
            url: "https://example.com/ml-breakthrough",
            publishedDate: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
          },
          {
            title: "OpenAI Releases New Model",
            content: "OpenAI has announced the release of their latest language model with improved capabilities and better safety features.",
            source: "OpenAI Blog",
            url: "https://example.com/openai-new-model",
            publishedDate: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
          }
        ];
      } else {
        articles = await newsService.fetchNewsFromUrl(url);
      }
      
      // Clear existing articles and add new ones
      await storage.clearArticles();
      
      const savedArticles = [];
      for (const article of articles) {
        try {
          const validatedArticle = insertArticleSchema.parse({
            title: article.title || 'Untitled',
            content: article.content || null,
            source: article.source || 'Unknown Source',
            url: article.url || '',
            publishedDate: article.publishedDate,
            selected: false
          });
          const saved = await storage.createArticle(validatedArticle);
          savedArticles.push(saved);
        } catch (error) {
          console.warn(`Failed to create article: ${article.title}`, error);
          // Continue with other articles even if one fails
        }
      }

      await storage.createActivityLog({
        message: "News articles fetched successfully",
        details: `Retrieved ${savedArticles.length} articles`,
        type: "success"
      });

      res.json({ articles: savedArticles });
    } catch (error) {
      await storage.createActivityLog({
        message: "Failed to fetch news articles",
        details: error instanceof Error ? error.message : "Unknown error",
        type: "error"
      });

      res.status(500).json({ 
        message: "Failed to fetch news", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get articles
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      res.json({ articles });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch articles", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Update article selection
  app.patch("/api/articles/:id/select", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { selected } = req.body;

      if (typeof selected !== 'boolean') {
        return res.status(400).json({ message: "Selected must be a boolean" });
      }

      const article = await storage.updateArticleSelection(id, selected);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json({ article });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update article selection", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Newsletter generation
  app.post("/api/newsletter/generate", async (req, res) => {
    try {
      const { issueNumber, date, customPrompt } = req.body;
      
      const settings = await storage.getSettings();
      if (!settings?.claudeApiKey) {
        return res.status(400).json({ message: "Claude API key not configured" });
      }

      const articles = await storage.getArticles();
      const selectedArticles = articles.filter(article => article.selected);

      if (selectedArticles.length === 0) {
        return res.status(400).json({ message: "No articles selected for newsletter generation" });
      }

      await storage.createActivityLog({
        message: "Generating newsletter",
        details: `Using ${selectedArticles.length} selected articles`,
        type: "info"
      });

      const claudeService = new ClaudeService(settings.claudeApiKey);
      
      const content = await claudeService.generateNewsletter({
        articles: selectedArticles.map(article => ({
          title: article.title,
          content: article.content || undefined,
          source: article.source,
          publishedDate: article.publishedDate,
        })),
        issueNumber: issueNumber || await storage.getNextIssueNumber(),
        date: new Date(date || Date.now()),
        newsletterTitle: settings.newsletterTitle || "AI Weekly",
        temperature: parseFloat(settings.claudeTemperature || "0.7"),
        maxTokens: settings.claudeMaxTokens || 4000,
        model: settings.claudeModel || "claude-sonnet-4-20250514"
      });

      const wordCount = content.split(/\s+/).length;
      const actualIssueNumber = issueNumber || await storage.getNextIssueNumber();

      const newsletter = await storage.createNewsletter({
        issueNumber: actualIssueNumber,
        title: `${settings.newsletterTitle || "AI Weekly"} #${actualIssueNumber}`,
        content,
        htmlContent: null,
        date: new Date(date || Date.now()),
        status: settings.approvalRequired ? "generated" : "approved",
        frequency: "manual",
        scheduleTime: null,
        approvalRequired: settings.approvalRequired || false,
        approvalEmail: settings.approvalEmail || null,
        approvedBy: null,
        wordCount,
        beehiivId: null,
        beehiivUrl: null
      });

      // Send approval email if required
      if (settings.approvalRequired && settings.sendgridApiKey && settings.approvalEmail) {
        try {
          const emailService = new EmailService(settings.sendgridApiKey);
          await emailService.sendApprovalEmail(
            settings.approvalEmail,
            newsletter.title,
            content,
            newsletter.id
          );
          
          await storage.createActivityLog({
            message: "Approval email sent",
            details: `Sent to ${settings.approvalEmail}`,
            type: "info"
          });
        } catch (emailError) {
          await storage.createActivityLog({
            message: "Failed to send approval email",
            details: emailError instanceof Error ? emailError.message : "Unknown error",
            type: "warning"
          });
        }
      }

      await storage.createActivityLog({
        message: "Newsletter generated successfully",
        details: `Generated ${wordCount} words from ${selectedArticles.length} articles using ${settings.claudeModel}`,
        type: "success"
      });

      res.json({ newsletter });
    } catch (error) {
      await storage.createActivityLog({
        message: "Newsletter generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
        type: "error"
      });

      res.status(500).json({ 
        message: "Failed to generate newsletter", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Beehiiv publishing
  app.post("/api/newsletter/publish", async (req, res) => {
    try {
      const { newsletterId, draft = false } = req.body;

      const settings = await storage.getSettings();
      if (!settings?.beehiivApiKey || !settings?.beehiivPublicationId) {
        return res.status(400).json({ message: "Beehiiv API credentials not configured" });
      }

      const newsletter = await storage.getNewsletter(newsletterId);
      if (!newsletter) {
        return res.status(404).json({ message: "Newsletter not found" });
      }

      await storage.createActivityLog({
        message: draft ? "Creating Beehiiv draft" : "Publishing newsletter to Beehiiv",
        details: `Newsletter: ${newsletter.title}`,
        type: "info"
      });

      const beehiivService = new BeehiivService(settings.beehiivApiKey);
      
      const result = draft 
        ? await beehiivService.createDraft(settings.beehiivPublicationId, newsletter.title, newsletter.content)
        : await beehiivService.publishNewsletter(settings.beehiivPublicationId, newsletter.title, newsletter.content);

      const updatedNewsletter = await storage.updateNewsletter(newsletterId, {
        status: draft ? "draft" : "published",
        beehiivId: result.id,
        beehiivUrl: result.web_url,
        publishedAt: draft ? null : new Date()
      });

      await storage.createActivityLog({
        message: draft ? "Draft created successfully" : "Newsletter published successfully",
        details: `Beehiiv ID: ${result.id}${result.web_url ? `, URL: ${result.web_url}` : ''}`,
        type: "success"
      });

      res.json({ newsletter: updatedNewsletter, beehiivPost: result });
    } catch (error) {
      await storage.createActivityLog({
        message: "Failed to publish newsletter",
        details: error instanceof Error ? error.message : "Unknown error",
        type: "error"
      });

      res.status(500).json({ 
        message: "Failed to publish newsletter", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get newsletters
  app.get("/api/newsletters", async (req, res) => {
    try {
      const newsletters = await storage.getNewsletters();
      res.json({ newsletters });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch newsletters", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get single newsletter
  app.get("/api/newsletters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newsletter = await storage.getNewsletter(id);
      
      if (!newsletter) {
        return res.status(404).json({ message: "Newsletter not found" });
      }

      res.json({ newsletter });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch newsletter", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      
      // Don't expose sensitive information
      if (settings) {
        const safeSettings = {
          ...settings,
          claudeApiKey: settings.claudeApiKey ? '***masked***' : null,
          beehiivApiKey: settings.beehiivApiKey ? '***masked***' : null,
          sendgridApiKey: settings.sendgridApiKey ? '***masked***' : null,
        };
        res.json({ settings: safeSettings });
      } else {
        res.json({ settings: null });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch settings", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedSettings = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedSettings);

      await storage.createActivityLog({
        message: "Settings updated",
        details: "Configuration settings have been updated",
        type: "success"
      });

      // Don't expose sensitive information
      const safeSettings = {
        ...settings,
        claudeApiKey: settings.claudeApiKey ? '***masked***' : null,
        beehiivApiKey: settings.beehiivApiKey ? '***masked***' : null,
        sendgridApiKey: settings.sendgridApiKey ? '***masked***' : null,
      };

      res.json({ settings: safeSettings });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update settings", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Test API connections
  app.post("/api/test-connection/:service", async (req, res) => {
    try {
      const service = req.params.service;
      const { apiKey, publicationId } = req.body;

      let isConnected = false;
      let error = null;

      if (service === 'claude') {
        if (!apiKey) {
          return res.status(400).json({ message: "API key is required" });
        }
        const claudeService = new ClaudeService(apiKey);
        isConnected = await claudeService.testConnection();
        if (!isConnected) error = "Failed to connect to Claude API";
      } else if (service === 'beehiiv') {
        if (!apiKey) {
          return res.status(400).json({ message: "API key is required" });
        }
        const beehiivService = new BeehiivService(apiKey);
        isConnected = await beehiivService.testConnection();
        if (!isConnected) error = "Failed to connect to Beehiiv API";
      } else if (service === 'sendgrid') {
        if (!apiKey) {
          return res.status(400).json({ message: "API key is required" });
        }
        const emailService = new EmailService(apiKey);
        isConnected = await emailService.testConnection();
        if (!isConnected) error = "Failed to connect to SendGrid API";
      } else {
        return res.status(400).json({ message: "Invalid service" });
      }

      res.json({ connected: isConnected, error });
    } catch (error) {
      res.status(500).json({ 
        message: "Connection test failed", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Activity logs
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch activity logs", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.delete("/api/activity-logs", async (req, res) => {
    try {
      await storage.clearActivityLogs();
      res.json({ message: "Activity logs cleared" });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to clear activity logs", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get next issue number
  app.get("/api/next-issue-number", async (req, res) => {
    try {
      const nextNumber = await storage.getNextIssueNumber();
      res.json({ issueNumber: nextNumber });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get next issue number", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Social Media Posts routes
  app.get("/api/social-media-posts", async (req, res) => {
    try {
      const posts = await storage.getSocialMediaPosts();
      res.json({ posts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/social-media-posts/newsletter/:id", async (req, res) => {
    try {
      const newsletterId = parseInt(req.params.id);
      const posts = await storage.getSocialMediaPostsByNewsletter(newsletterId);
      res.json({ posts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/social-media-posts/generate", async (req, res) => {
    try {
      const { newsletterId } = req.body;
      
      if (!newsletterId) {
        return res.status(400).json({ error: "Newsletter ID is required" });
      }

      const newsletter = await storage.getNewsletter(newsletterId);
      if (!newsletter) {
        return res.status(404).json({ error: "Newsletter not found" });
      }

      const settings = await storage.getSettings();
      if (!settings?.claudeApiKey) {
        return res.status(400).json({ error: "Claude API key not configured" });
      }

      const socialMediaService = new SocialMediaService(settings.claudeApiKey);
      
      // Generate social media content
      const socialContent = await socialMediaService.generateSocialMediaContent(
        newsletter.content,
        newsletter.title,
        newsletter.issueNumber
      );

      // Generate random posting times
      const postingTimes = socialMediaService.generateRandomPostingTimes(3);

      const createdPosts: SocialMediaPost[] = [];

      // Create Twitter post
      const twitterPost = await storage.createSocialMediaPost({
        platform: "twitter",
        content: socialContent.twitter.content,
        hashtags: socialContent.twitter.hashtags,
        scheduledFor: postingTimes[0],
        newsletterId: newsletter.id,
        engagementHook: socialContent.twitter.hook,
        callToAction: socialContent.twitter.cta,
        status: "scheduled"
      });
      createdPosts.push(twitterPost);

      // Create Instagram post
      const instagramPost = await storage.createSocialMediaPost({
        platform: "instagram",
        content: socialContent.instagram.content,
        hashtags: socialContent.instagram.hashtags,
        scheduledFor: postingTimes[1],
        newsletterId: newsletter.id,
        engagementHook: socialContent.instagram.hook,
        callToAction: socialContent.instagram.cta,
        status: "scheduled"
      });
      createdPosts.push(instagramPost);

      // Create YouTube Shorts post
      const youtubePost = await storage.createSocialMediaPost({
        platform: "youtube",
        content: `${socialContent.youtube.title}\n\n${socialContent.youtube.description}`,
        hashtags: socialContent.youtube.hashtags,
        scheduledFor: postingTimes[2],
        newsletterId: newsletter.id,
        engagementHook: socialContent.youtube.hook,
        callToAction: socialContent.youtube.cta,
        status: "scheduled"
      });
      createdPosts.push(youtubePost);

      await storage.createActivityLog({
        type: "info",
        message: `Generated social media posts for newsletter #${newsletter.issueNumber}`,
        details: `Created ${createdPosts.length} posts across Twitter, Instagram, and YouTube`
      });

      res.json({ 
        posts: createdPosts,
        message: "Social media posts generated and scheduled successfully"
      });
    } catch (error: any) {
      console.error("Error generating social media posts:", error);
      await storage.createActivityLog({
        type: "error",
        message: "Failed to generate social media posts",
        details: error.message
      });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/social-media-posts", async (req, res) => {
    try {
      const validatedData = insertSocialMediaPostSchema.parse(req.body);
      const post = await storage.createSocialMediaPost(validatedData);
      res.status(201).json({ post });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/social-media-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const post = await storage.updateSocialMediaPost(id, updates);
      
      if (!post) {
        return res.status(404).json({ error: "Social media post not found" });
      }
      
      res.json({ post });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/social-media-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSocialMediaPost(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Social media post not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Schedule management endpoints
  app.get("/api/schedules", async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json({ schedules });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch schedules", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const validatedSchedule = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validatedSchedule);
      
      // Restart scheduler to include new schedule
      await schedulerService.scheduleJob(schedule);
      
      await storage.createActivityLog({
        message: "Schedule created",
        details: `New schedule "${schedule.name}" created for ${schedule.frequency} at ${schedule.time}`,
        type: "success"
      });

      res.json({ schedule });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to create schedule", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.patch("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const schedule = await storage.updateSchedule(id, updates);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Update the scheduled job
      await schedulerService.unscheduleJob(id);
      if (schedule.enabled) {
        await schedulerService.scheduleJob(schedule);
      }

      res.json({ schedule });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to update schedule", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await schedulerService.unscheduleJob(id);
      const deleted = await storage.deleteSchedule(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      await storage.createActivityLog({
        message: "Schedule deleted",
        details: `Schedule with ID ${id} has been deleted`,
        type: "info"
      });

      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete schedule", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Newsletter approval endpoints
  app.get("/api/newsletter/approve/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newsletter = await storage.updateNewsletter(id, {
        status: "approved",
        approvedBy: "Email Approval",
        approvedAt: new Date()
      });

      if (!newsletter) {
        return res.status(404).json({ message: "Newsletter not found" });
      }

      await storage.createActivityLog({
        message: "Newsletter approved via email",
        details: `Newsletter "${newsletter.title}" has been approved`,
        type: "success"
      });

      // Auto-publish if configured
      const settings = await storage.getSettings();
      if (settings?.beehiivApiKey && settings?.beehiivPublicationId) {
        const beehiivService = new BeehiivService(settings.beehiivApiKey);
        const result = await beehiivService.publishNewsletter(
          settings.beehiivPublicationId, 
          newsletter.title, 
          newsletter.content
        );

        await storage.updateNewsletter(id, {
          status: "published",
          beehiivId: result.id,
          beehiivUrl: result.web_url,
          publishedAt: new Date()
        });
      }

      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
            <h2 style="color: #10b981;">Newsletter Approved Successfully!</h2>
            <p>The newsletter "${newsletter.title}" has been approved and published.</p>
            <p style="color: #666; margin-top: 30px;">You can close this window now.</p>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
            <h2 style="color: #ef4444;">Error</h2>
            <p>Failed to approve newsletter: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          </body>
        </html>
      `);
    }
  });

  app.get("/api/newsletter/reject/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newsletter = await storage.updateNewsletter(id, {
        status: "rejected",
        approvedBy: "Email Rejection"
      });

      if (!newsletter) {
        return res.status(404).json({ message: "Newsletter not found" });
      }

      await storage.createActivityLog({
        message: "Newsletter rejected via email",
        details: `Newsletter "${newsletter.title}" has been rejected`,
        type: "warning"
      });

      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
            <h2 style="color: #ef4444;">Newsletter Rejected</h2>
            <p>The newsletter "${newsletter.title}" has been rejected.</p>
            <p style="color: #666; margin-top: 30px;">You can close this window now.</p>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
            <h2 style="color: #ef4444;">Error</h2>
            <p>Failed to reject newsletter: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          </body>
        </html>
      `);
    }
  });

  // Start the scheduler service
  schedulerService.start().catch(console.error);

  const httpServer = createServer(app);
  return httpServer;
}
