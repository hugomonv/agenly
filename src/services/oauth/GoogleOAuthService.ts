import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { logger } from '../../utils/logger';
import { config } from '../../config/environment';

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;
  private calendar: any;
  private gmail: any;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      `${config.app.baseUrl}/api/auth/callback/google`
    );
  }

  /**
   * Génère l'URL d'autorisation OAuth2
   */
  generateAuthUrl(scopes: string[], state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state || 'default',
    });
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        scope: tokens.scope || '',
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date || undefined,
      };
    } catch (error) {
      logger.error('Failed to exchange code for tokens', { error: (error as Error).message });
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Récupère les informations utilisateur Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      if (!data.id || !data.email) {
        throw new Error('Invalid user data received from Google');
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name || '',
        picture: data.picture || undefined,
        verified_email: data.verified_email || false,
      };
    } catch (error) {
      logger.error('Failed to get user info', { error: (error as Error).message });
      throw new Error('Failed to retrieve user information from Google');
    }
  }

  /**
   * Rafraîchit un token d'accès expiré
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('No access token received after refresh');
      }

      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken,
        scope: credentials.scope || '',
        token_type: credentials.token_type || 'Bearer',
        expiry_date: credentials.expiry_date || undefined,
      };
    } catch (error) {
      logger.error('Failed to refresh access token', { error: (error as Error).message });
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Vérifie si un token est valide
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      await this.oauth2Client.getAccessToken();
      return true;
    } catch (error) {
      logger.debug('Token validation failed', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Configure les services Google avec les tokens
   */
  private setupServices(tokens: GoogleTokens) {
    this.oauth2Client.setCredentials(tokens);
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Crée un événement dans Google Calendar
   */
  async createCalendarEvent(tokens: GoogleTokens, eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees?: { email: string }[];
  }): Promise<any> {
    try {
      this.setupServices(tokens);
      
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: eventData,
      });

      logger.info('Calendar event created', { eventId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Failed to create calendar event', { error: (error as Error).message });
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Liste les événements du calendrier
   */
  async listCalendarEvents(tokens: GoogleTokens, options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  } = {}): Promise<any[]> {
    try {
      this.setupServices(tokens);
      
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        maxResults: options.maxResults || 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Failed to list calendar events', { error: (error as Error).message });
      throw new Error('Failed to list calendar events');
    }
  }

  /**
   * Envoie un email via Gmail
   */
  async sendEmail(tokens: GoogleTokens, emailData: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<any> {
    try {
      this.setupServices(tokens);
      
      const message = {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        isHtml: emailData.isHtml || false,
      };

      const raw = this.createEmailRaw(message);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: raw,
        },
      });

      logger.info('Email sent via Gmail', { messageId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Failed to send email', { error: (error as Error).message });
      throw new Error('Failed to send email via Gmail');
    }
  }

  /**
   * Liste les emails Gmail
   */
  async listEmails(tokens: GoogleTokens, options: {
    maxResults?: number;
    query?: string;
  } = {}): Promise<any[]> {
    try {
      this.setupServices(tokens);
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: options.maxResults || 10,
        q: options.query,
      });

      const messages = response.data.messages || [];
      const detailedMessages = [];

      for (const message of messages.slice(0, 5)) { // Limiter à 5 pour éviter les quotas
        try {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });
          detailedMessages.push(detail.data);
        } catch (error) {
          logger.warn('Failed to get message details', { messageId: message.id });
        }
      }

      return detailedMessages;
    } catch (error) {
      logger.error('Failed to list emails', { error: (error as Error).message });
      throw new Error('Failed to list emails');
    }
  }

  /**
   * Crée le format raw pour l'email Gmail
   */
  private createEmailRaw(message: {
    to: string;
    subject: string;
    body: string;
    isHtml: boolean;
  }): string {
    const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9);
    const contentType = message.isHtml ? 'text/html' : 'text/plain';
    
    const raw = [
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: ${contentType}; charset=UTF-8`,
      'Content-Transfer-Encoding: 7bit',
      '',
      message.body,
      `--${boundary}--`,
    ].join('\n');

    return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Révocation des tokens
   */
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
      logger.info('Tokens revoked successfully');
    } catch (error) {
      logger.error('Failed to revoke tokens', { error: (error as Error).message });
      throw new Error('Failed to revoke tokens');
    }
  }
}

export default GoogleOAuthService;




