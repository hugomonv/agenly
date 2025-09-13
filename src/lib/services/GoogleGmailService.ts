import { google } from 'googleapis';

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
}

export interface GmailMessagesResponse {
  success: boolean;
  messages?: GmailMessage[];
  error?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export class GoogleGmailService {
  private static instance: GoogleGmailService;
  private gmail: any;

  private constructor() {
    // Initialiser le service Gmail
    this.gmail = google.gmail('v1');
  }

  public static getInstance(): GoogleGmailService {
    if (!GoogleGmailService.instance) {
      GoogleGmailService.instance = new GoogleGmailService();
    }
    return GoogleGmailService.instance;
  }

  /**
   * Obtenir les messages Gmail
   */
  async getMessages(accessToken: string, maxResults: number = 10): Promise<GmailMessagesResponse> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const response = await this.gmail.users.messages.list({
        auth: auth,
        userId: 'me',
        maxResults: maxResults,
      });

      const messages = response.data.messages || [];
      const messageDetails = await Promise.all(
        messages.map(async (message: any) => {
          const detail = await this.gmail.users.messages.get({
            auth: auth,
            userId: 'me',
            id: message.id,
          });

          const headers = detail.data.payload.headers;
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sans objet';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu';
          const to = headers.find((h: any) => h.name === 'To')?.value || 'Inconnu';
          const date = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();

          return {
            id: message.id,
            threadId: message.threadId,
            subject,
            from,
            to,
            date,
            snippet: detail.data.snippet,
          };
        })
      );

      return {
        success: true,
        messages: messageDetails,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Envoyer un email
   */
  async sendEmail(accessToken: string, emailRequest: SendEmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const email = [
        `To: ${emailRequest.to}`,
        `Subject: ${emailRequest.subject}`,
        `Content-Type: text/html; charset=utf-8`,
        '',
        emailRequest.body,
      ].join('\n');

      const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        auth: auth,
        userId: 'me',
        resource: {
          raw: encodedEmail,
        },
      });

      return {
        success: true,
        messageId: response.data.id,
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Marquer un message comme lu
   */
  async markAsRead(accessToken: string, messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      await this.gmail.users.messages.modify({
        auth: auth,
        userId: 'me',
        id: messageId,
        resource: {
          removeLabelIds: ['UNREAD'],
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur lors du marquage du message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(accessToken: string, messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      await this.gmail.users.messages.delete({
        auth: auth,
        userId: 'me',
        id: messageId,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Obtenir les labels Gmail
   */
  async getLabels(accessToken: string): Promise<{ success: boolean; labels?: any[]; error?: string }> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const response = await this.gmail.users.labels.list({
        auth: auth,
        userId: 'me',
      });

      return {
        success: true,
        labels: response.data.labels || [],
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des labels:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}

export default GoogleGmailService;




