import axios from 'axios';
import { type InsertArticle } from '@shared/schema';

export interface NewsArticle {
  title: string;
  content?: string;
  source: string;
  url: string;
  publishedDate: Date;
}

export class NewsService {
  async fetchNewsFromUrl(url: string): Promise<NewsArticle[]> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'AI Newsletter Bot/1.0',
        },
      });

      const data = response.data;
      
      // Handle different feed formats
      if (data.items) {
        // Inoreader JSON format
        return this.parseInoreaderFeed(data.items);
      } else if (data.feed?.entry) {
        // Atom feed format
        return this.parseAtomFeed(data.feed.entry);
      } else if (data.rss?.channel?.item) {
        // RSS feed format
        return this.parseRSSFeed(data.rss.channel.item);
      } else if (Array.isArray(data)) {
        // Direct JSON array
        return this.parseJSONArray(data);
      }

      throw new Error('Unsupported feed format');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch news: ${error.message}`);
      }
      throw error;
    }
  }

  private parseInoreaderFeed(items: any[]): NewsArticle[] {
    return items.map((item: any) => ({
      title: item.title || 'Untitled',
      content: item.summary?.content || item.content?.content || '',
      source: item.origin?.title || 'Unknown Source',
      url: item.canonical?.[0]?.href || item.alternate?.[0]?.href || '',
      publishedDate: new Date(item.published * 1000),
    }));
  }

  private parseAtomFeed(entries: any[]): NewsArticle[] {
    return entries.map((entry: any) => ({
      title: entry.title || 'Untitled',
      content: entry.summary || entry.content || '',
      source: entry.source?.title || 'Unknown Source',
      url: entry.link?.href || entry.id || '',
      publishedDate: new Date(entry.published || entry.updated),
    }));
  }

  private parseRSSFeed(items: any[]): NewsArticle[] {
    return items.map((item: any) => ({
      title: item.title || 'Untitled',
      content: item.description || item.content || '',
      source: item.source || 'Unknown Source',
      url: item.link || item.guid || '',
      publishedDate: new Date(item.pubDate || item.date),
    }));
  }

  private parseJSONArray(items: any[]): NewsArticle[] {
    return items.map((item: any) => ({
      title: item.title || 'Untitled',
      content: item.content || item.description || item.summary || '',
      source: item.source || item.publisher || 'Unknown Source',
      url: item.url || item.link || '',
      publishedDate: new Date(item.publishedDate || item.date || item.published),
    }));
  }
}

export const newsService = new NewsService();
