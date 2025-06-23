import axios from 'axios';

export interface BeehiivPublication {
  id: string;
  name: string;
}

export interface BeehiivPost {
  id: string;
  subject: string;
  status: string;
  web_url?: string;
  created: string;
  published?: string;
}

import { config } from '../config';

export class BeehiivService {
  private apiKey: string;
  private baseUrl = 'https://api.beehiiv.com/v2';

  constructor(apiKey?: string) {
    const key = apiKey || config.publishing.beehiiv.apiKey;
    if (!key) {
      throw new Error('Beehiiv API key is required. Set BEEHIIV_API_KEY environment variable or provide in config.');
    }
    this.apiKey = key;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/publications`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getPublications(): Promise<BeehiivPublication[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/publications`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });

      return response.data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch publications: ${error.message}`);
      }
      throw error;
    }
  }

  async publishNewsletter(
    publicationId: string,
    subject: string,
    content: string,
    tags?: string[]
  ): Promise<BeehiivPost> {
    try {
      // Convert markdown content to HTML for Beehiiv
      const htmlContent = this.convertMarkdownToHtml(content);

      const payload = {
        subject,
        content: htmlContent,
        status: 'confirmed',
        send_type: 'now',
        tags: tags || [],
      };

      const response = await axios.post(
        `${this.baseUrl}/publications/${publicationId}/posts`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to publish newsletter: ${errorMessage}`);
      }
      throw error;
    }
  }

  async createDraft(
    publicationId: string,
    subject: string,
    content: string,
    tags?: string[]
  ): Promise<BeehiivPost> {
    try {
      const htmlContent = this.convertMarkdownToHtml(content);

      const payload = {
        subject,
        content: htmlContent,
        status: 'draft',
        tags: tags || [],
      };

      const response = await axios.post(
        `${this.baseUrl}/publications/${publicationId}/posts`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to create draft: ${errorMessage}`);
      }
      throw error;
    }
  }

  private convertMarkdownToHtml(markdown: string): string {
    // Basic markdown to HTML conversion
    // In a production app, you might want to use a proper markdown parser
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>')
      .replace(/^(.*)$/gim, '<p>$1</p>')
      .replace(/<p><\/p>/gim, '')
      .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/gim, '$1')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  }
}
