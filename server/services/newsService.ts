import axios from 'axios';
import * as xml2js from 'xml2js';
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
      console.log(`Fetching news from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'AI Newsletter Bot/1.0',
          'Accept': 'application/json, application/xml, text/xml, */*'
        },
      });

      const contentType = response.headers['content-type'] || '';
      console.log(`Content-Type: ${contentType}`);

      let data = response.data;

      // If the response is a string (XML), parse it
      if (typeof data === 'string') {
        if (contentType.includes('json') || url.includes('.json')) {
          data = JSON.parse(data);
        } else {
          // Parse XML
          const parser = new xml2js.Parser({ 
            explicitArray: false,
            mergeAttrs: true,
            trim: true,
            normalizeTags: true
          });
          data = await parser.parseStringPromise(data);
        }
      }

      if (!data) {
        throw new Error('Empty response from feed URL');
      }
      
      console.log(`Response data type: ${typeof data}, keys: ${Object.keys(data || {}).join(', ')}`);
      
      // Handle different feed formats
      if (data.items) {
        // Inoreader JSON format
        return this.parseInoreaderFeed(data.items);
      } else if (data.feed?.entry) {
        // Atom feed format
        const entries = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];
        return this.parseAtomFeed(entries);
      } else if (data.rss?.channel?.item) {
        // RSS feed format
        const items = Array.isArray(data.rss.channel.item) ? data.rss.channel.item : [data.rss.channel.item];
        return this.parseRSSFeed(items);
      } else if (data.channel?.item) {
        // RSS feed without rss wrapper
        const items = Array.isArray(data.channel.item) ? data.channel.item : [data.channel.item];
        return this.parseRSSFeed(items);
      } else if (Array.isArray(data)) {
        // Direct JSON array
        return this.parseJSONArray(data);
      }

      // Log the data structure to help debug
      console.log('Unsupported feed format. Data structure:', JSON.stringify(data, null, 2).substring(0, 500));
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
      publishedDate: this.parseDate(item.published ? item.published * 1000 : Date.now()),
    }));
  }

  private parseAtomFeed(entries: any[]): NewsArticle[] {
    return entries.map((entry: any) => ({
      title: entry.title?._text || entry.title || 'Untitled',
      content: entry.summary?._text || entry.content?._text || entry.summary || entry.content || '',
      source: 'Atom Feed',
      url: entry.link?._attributes?.href || entry.link?.href || entry.id?._text || entry.id || '',
      publishedDate: this.parseDate(entry.published?._text || entry.updated?._text || entry.published || entry.updated),
    }));
  }

  private parseRSSFeed(items: any[]): NewsArticle[] {
    return items.map((item: any) => ({
      title: item.title?._text || item.title || 'Untitled',
      content: item.description?._text || item.description || item['content:encoded']?._text || item['content:encoded'] || '',
      source: 'RSS Feed',
      url: item.link?._text || item.link || item.guid?._text || item.guid || '',
      publishedDate: this.parseDate(item.pubDate?._text || item.pubDate || item.date?._text || item.date),
    }));
  }

  private parseJSONArray(items: any[]): NewsArticle[] {
    return items.map((item: any) => ({
      title: item.title || 'Untitled',
      content: item.content || item.description || item.summary || '',
      source: item.source || item.publisher || 'Unknown Source',
      url: item.url || item.link || '',
      publishedDate: this.parseDate(item.publishedDate || item.date || item.published),
    }));
  }

  private parseDate(dateInput: any): Date {
    if (!dateInput) {
      return new Date();
    }

    // If it's already a Date object
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? new Date() : dateInput;
    }

    // If it's a number (timestamp)
    if (typeof dateInput === 'number') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? new Date() : date;
    }

    // If it's a string
    if (typeof dateInput === 'string') {
      // Clean up common date string issues
      const cleanedDate = dateInput.trim();
      
      // Handle empty strings
      if (!cleanedDate) {
        return new Date();
      }

      // Try to parse the date
      const date = new Date(cleanedDate);
      
      // If parsing failed, return current date
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${cleanedDate}, using current date`);
        return new Date();
      }
      
      return date;
    }

    // Fallback to current date
    return new Date();
  }
}

export const newsService = new NewsService();
