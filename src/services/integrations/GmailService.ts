import { google } from 'googleapis';
import { logger } from '../../utils/logger';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface InboxMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
}

export interface InboxResponse {
  success: boolean;
  messages: InboxMessage[];
  error?: string;
}

export class GmailService {
  private oauth2Client: any;

  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/google'
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken
    });
  }

  /**
   * Envoyer un email
   */
  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    try {
      logger.info('Sending email via Gmail', { to: message.to, subject: message.subject });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Construire le message
      const messageBody = [
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        message.body
      ].join('\n');

      const encodedMessage = Buffer.from(messageBody).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      logger.info('Email sent via Gmail', { messageId: response.data.id });

      return {
        success: true,
        messageId: response.data.id || undefined
      };
    } catch (error) {
      logger.error('Error sending email via Gmail', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Lire les emails de la boîte de réception
   */
  async getInboxMessages(maxResults: number = 10): Promise<InboxResponse> {
    try {
      logger.info('Getting Gmail inbox messages', { maxResults });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Récupérer la liste des messages
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      });

      const messages: InboxMessage[] = [];

      if (listResponse.data.messages) {
        for (const message of listResponse.data.messages) {
          try {
            // Récupérer les détails du message
            const messageResponse = await gmail.users.messages.get({
              userId: 'me',
              id: message.id!,
              format: 'full'
            });

            const headers = messageResponse.data.payload?.headers || [];
            const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

            messages.push({
              id: message.id!,
              threadId: message.threadId!,
              subject: getHeader('Subject'),
              from: getHeader('From'),
              to: getHeader('To'),
              date: getHeader('Date'),
              snippet: messageResponse.data.snippet || '',
              body: this.extractMessageBody(messageResponse.data.payload)
            });
          } catch (error) {
            logger.warn('Error getting message details', { messageId: message.id, error });
          }
        }
      }

      logger.info('Gmail inbox messages retrieved', { count: messages.length });

      return {
        success: true,
        messages
      };
    } catch (error) {
      logger.error('Error getting Gmail inbox messages', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        messages: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Répondre à un email
   */
  async replyToEmail(threadId: string, message: EmailMessage): Promise<EmailResponse> {
    try {
      logger.info('Replying to Gmail message', { threadId, subject: message.subject });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Construire le message de réponse
      const messageBody = [
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        message.body
      ].join('\n');

      const encodedMessage = Buffer.from(messageBody).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId
        }
      });

      logger.info('Gmail reply sent', { messageId: response.data.id, threadId });

      return {
        success: true,
        messageId: response.data.id || undefined
      };
    } catch (error) {
      logger.error('Error replying to Gmail message', { 
        threadId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Marquer un email comme lu
   */
  async markAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Marking Gmail message as read', { messageId });

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });

      logger.info('Gmail message marked as read', { messageId });

      return { success: true };
    } catch (error) {
      logger.error('Error marking Gmail message as read', { 
        messageId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extraire le corps du message
   */
  private extractMessageBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString();
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString();
        }
      }
    }

    return '';
  }
}




