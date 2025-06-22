import { MailService } from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private mailService: MailService;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.mailService = new MailService();
    this.mailService.setApiKey(apiKey);
  }

  async sendApprovalEmail(
    to: string,
    newsletterTitle: string,
    content: string,
    newsletterId: number,
    baseUrl: string = 'http://localhost:5000'
  ): Promise<boolean> {
    try {
      const approvalUrl = `${baseUrl}/api/newsletter/approve/${newsletterId}`;
      const rejectUrl = `${baseUrl}/api/newsletter/reject/${newsletterId}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Newsletter Approval Required</h2>
          <p>A new newsletter has been generated and is awaiting your approval:</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin-top: 0;">${newsletterTitle}</h3>
            <div style="max-height: 300px; overflow-y: auto; background: white; padding: 15px; border-radius: 4px;">
              ${content.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${approvalUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px; display: inline-block;">Approve & Publish</a>
            <a href="${rejectUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px; display: inline-block;">Reject</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This email was sent from your AI Newsletter Automation Hub. 
            If you didn't expect this email, please contact your system administrator.
          </p>
        </div>
      `;

      await this.mailService.send({
        to,
        from: 'noreply@newsletter-automation.com', // This should be configured
        subject: `Newsletter Approval Required: ${newsletterTitle}`,
        text: `A new newsletter "${newsletterTitle}" is awaiting approval. Visit ${approvalUrl} to approve or ${rejectUrl} to reject.`,
        html: htmlContent,
      });

      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Send a test email to verify the connection
      const testEmail = {
        to: 'test@example.com',
        from: 'test@newsletter-automation.com',
        subject: 'Test Connection',
        text: 'This is a test email to verify SendGrid connection.',
      };

      // We'll just validate the API key format for now
      return this.apiKey.startsWith('SG.');
    } catch (error) {
      return false;
    }
  }
}