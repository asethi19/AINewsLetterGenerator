import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { newsService } from "./services/newsService";
import { ClaudeService } from "./services/claudeService";
import { BeehiivService } from "./services/beehiivService";
import { insertArticleSchema, insertNewsletterSchema, insertSettingsSchema, insertActivityLogSchema } from "@shared/schema";

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

      const articles = await newsService.fetchNewsFromUrl(url);
      
      // Clear existing articles and add new ones
      await storage.clearArticles();
      
      const savedArticles = [];
      for (const article of articles) {
        const validatedArticle = insertArticleSchema.parse(article);
        const saved = await storage.createArticle(validatedArticle);
        savedArticles.push(saved);
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

      const newsletter = await storage.createNewsletter({
        issueNumber: issueNumber || await storage.getNextIssueNumber(),
        title: `${settings.newsletterTitle || "AI Weekly"} #${issueNumber || await storage.getNextIssueNumber()}`,
        content,
        date: new Date(date || Date.now()),
        status: "generated",
        wordCount,
        beehiivId: null,
        beehiivUrl: null
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
