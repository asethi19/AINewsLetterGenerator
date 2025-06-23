import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface AppConfig {
  app: {
    name: string;
    port: number;
    environment: string;
  };
  database: {
    type: 'postgresql' | 'mock';
    url?: string;
    mock: boolean;
  };
  ai: {
    anthropic: {
      apiKey?: string;
      model: string;
      maxTokens: number;
      temperature: number;
    };
  };
  publishing: {
    beehiiv: {
      apiKey?: string;
      publicationId?: string;
    };
  };
  email: {
    sendgrid: {
      apiKey?: string;
      fromEmail: string;
      fromName: string;
    };
  };
  newsletter: {
    title: string;
    defaultSource: string;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  scheduling: {
    enabled: boolean;
    timezone: string;
    dailyTime: string;
  };
  socialMedia: {
    enabled: boolean;
    platforms: string[];
    autoPost: boolean;
  };
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    // Default configuration
    const defaultConfig: AppConfig = {
      app: {
        name: process.env.APP_NAME || 'AI Newsletter Automation Hub',
        port: parseInt(process.env.PORT || '5000'),
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        type: process.env.USE_MOCK_DB === 'true' ? 'mock' : 'postgresql',
        url: process.env.DATABASE_URL,
        mock: process.env.USE_MOCK_DB === 'true'
      },
      ai: {
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
          maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096'),
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7')
        }
      },
      publishing: {
        beehiiv: {
          apiKey: process.env.BEEHIIV_API_KEY,
          publicationId: process.env.BEEHIIV_PUBLICATION_ID
        }
      },
      email: {
        sendgrid: {
          apiKey: process.env.SENDGRID_API_KEY,
          fromEmail: process.env.FROM_EMAIL || 'noreply@example.com',
          fromName: process.env.FROM_NAME || 'AI Newsletter Bot'
        }
      },
      newsletter: {
        title: process.env.NEWSLETTER_TITLE || 'AI Weekly Newsletter',
        defaultSource: process.env.DEFAULT_NEWS_SOURCE || 'https://www.inoreader.com/stream/user/1003985272/tag/AI/view/json',
        autoRefresh: process.env.AUTO_REFRESH_NEWS !== 'false',
        refreshInterval: parseInt(process.env.REFRESH_INTERVAL || '300000')
      },
      scheduling: {
        enabled: process.env.ENABLE_SCHEDULING !== 'false',
        timezone: process.env.TIMEZONE || 'UTC',
        dailyTime: process.env.DAILY_SCHEDULE_TIME || '09:00'
      },
      socialMedia: {
        enabled: process.env.ENABLE_SOCIAL_MEDIA !== 'false',
        platforms: ['twitter', 'instagram', 'youtube'],
        autoPost: process.env.AUTO_POST_SOCIAL === 'true'
      }
    };

    // Try to load config.json if it exists
    const configPath = join(process.cwd(), 'config.json');
    if (existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(readFileSync(configPath, 'utf8'));
        return this.mergeConfigs(defaultConfig, fileConfig);
      } catch (error) {
        console.warn('Failed to parse config.json, using environment variables:', error);
      }
    }

    return defaultConfig;
  }

  private mergeConfigs(defaultConfig: AppConfig, fileConfig: any): AppConfig {
    const merged = { ...defaultConfig };

    // Deep merge configuration objects
    Object.keys(fileConfig).forEach(key => {
      if (typeof fileConfig[key] === 'object' && !Array.isArray(fileConfig[key])) {
        merged[key as keyof AppConfig] = { 
          ...merged[key as keyof AppConfig], 
          ...fileConfig[key] 
        };
      } else {
        merged[key as keyof AppConfig] = fileConfig[key];
      }
    });

    return merged;
  }

  get(): AppConfig {
    return this.config;
  }

  get app() {
    return this.config.app;
  }

  get database() {
    return this.config.database;
  }

  get ai() {
    return this.config.ai;
  }

  get publishing() {
    return this.config.publishing;
  }

  get email() {
    return this.config.email;
  }

  get newsletter() {
    return this.config.newsletter;
  }

  get scheduling() {
    return this.config.scheduling;
  }

  get socialMedia() {
    return this.config.socialMedia;
  }

  // Validation methods
  validateRequiredKeys(): string[] {
    const missing: string[] = [];

    if (!this.ai.anthropic.apiKey) {
      missing.push('ANTHROPIC_API_KEY');
    }

    return missing;
  }

  isConfigured(): boolean {
    return this.validateRequiredKeys().length === 0;
  }
}

export const config = new ConfigManager();