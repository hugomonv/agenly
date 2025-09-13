import { FirebaseUserService } from './FirebaseUserService';
import GoogleCalendarService from './GoogleCalendarService';
import GoogleGmailService from './GoogleGmailService';
import { User } from '../firebase-models';

export interface GoogleIntegrationConfig {
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
}

export interface IntegrationStatus {
  calendar: boolean;
  gmail: boolean;
  drive: boolean;
  contacts: boolean;
}

export class GoogleIntegrationService {
  private static instance: GoogleIntegrationService;
  private userService: FirebaseUserService;
  private calendarService: GoogleCalendarService;
  private gmailService: GoogleGmailService;

  private constructor() {
    this.userService = FirebaseUserService.getInstance();
    this.calendarService = new GoogleCalendarService();
    this.gmailService = new GoogleGmailService();
  }

  public static getInstance(): GoogleIntegrationService {
    if (!GoogleIntegrationService.instance) {
      GoogleIntegrationService.instance = new GoogleIntegrationService();
    }
    return GoogleIntegrationService.instance;
  }

  /**
   * Obtenir le statut des intégrations pour un utilisateur
   */
  async getIntegrationStatus(userId: string): Promise<IntegrationStatus> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user || !user.integrations?.google) {
        return { calendar: false, gmail: false, drive: false, contacts: false };
      }

      const googleIntegrations = user.integrations.google;
      return {
        calendar: !!googleIntegrations.calendar?.accessToken,
        gmail: !!googleIntegrations.gmail?.accessToken,
        drive: !!googleIntegrations.drive?.accessToken,
        contacts: !!googleIntegrations.contacts?.accessToken,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des intégrations:', error);
      return { calendar: false, gmail: false, drive: false, contacts: false };
    }
  }

  /**
   * Tester les intégrations Google avec les vrais services
   */
  async testIntegrations(userId: string): Promise<IntegrationStatus> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user || !user.integrations?.google) {
        return { calendar: false, gmail: false, drive: false, contacts: false };
      }

      const googleIntegrations = user.integrations.google;
      const status: IntegrationStatus = {
        calendar: false,
        gmail: false,
        drive: false,
        contacts: false,
      };

      // Test Calendar
      if (googleIntegrations.calendar?.accessToken) {
        try {
          const calendarTest = await this.calendarService.getEvents(googleIntegrations.calendar.accessToken);
          status.calendar = calendarTest.success;
        } catch (error) {
          console.warn('Erreur test Calendar:', error);
        }
      }

      // Test Gmail
      if (googleIntegrations.gmail?.accessToken) {
        try {
          const gmailTest = await this.gmailService.getMessages(googleIntegrations.gmail.accessToken, 1);
          status.gmail = gmailTest.success;
        } catch (error) {
          console.warn('Erreur test Gmail:', error);
        }
      }

      // Drive et Contacts (pas encore implémentés)
      status.drive = !!googleIntegrations.drive?.accessToken;
      status.contacts = !!googleIntegrations.contacts?.accessToken;

      return status;
    } catch (error) {
      console.error('Erreur lors du test des intégrations:', error);
      return { calendar: false, gmail: false, drive: false, contacts: false };
    }
  }

  /**
   * Connecter un service Google pour un utilisateur
   */
  async connectService(userId: string, serviceName: 'calendar' | 'gmail' | 'drive' | 'contacts', accessToken: string, refreshToken?: string): Promise<User> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedIntegrations = { ...user.integrations?.google };
      updatedIntegrations[serviceName] = {
        accessToken,
        refreshToken,
        expiryDate: Date.now() + (3600 * 1000), // 1 heure
      };

      await this.userService.updateUser(userId, {
        integrations: {
          ...user.integrations,
          google: updatedIntegrations,
        },
      });

      return { ...user, integrations: { ...user.integrations, google: updatedIntegrations } };
    } catch (error) {
      console.error('Erreur lors de la connexion du service:', error);
      throw error;
    }
  }

  /**
   * Déconnecter un service Google pour un utilisateur
   */
  async disconnectService(userId: string, serviceName: 'calendar' | 'gmail' | 'drive' | 'contacts'): Promise<User> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedIntegrations = { ...user.integrations?.google };
      delete updatedIntegrations[serviceName];

      await this.userService.updateUser(userId, {
        integrations: {
          ...user.integrations,
          google: updatedIntegrations,
        },
      });

      return { ...user, integrations: { ...user.integrations, google: updatedIntegrations } };
    } catch (error) {
      console.error('Erreur lors de la déconnexion du service:', error);
      throw error;
    }
  }

  /**
   * Générer l'URL d'autorisation OAuth2 (version simplifiée)
   */
  generateAuthUrl(scopes: string[], state?: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';
    
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Échanger le code d'autorisation contre des tokens (version simplifiée)
   */
  async exchangeCodeForTokens(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtenir les informations de l'utilisateur Google
   */
  async getUserInfo(accessToken: string) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Rafraîchir les tokens d'accès
   */
  async refreshAccessToken(refreshToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Instance singleton
export const googleIntegrationService = GoogleIntegrationService.getInstance();



