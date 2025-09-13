import { google } from 'googleapis';
import { logger } from '../../utils/logger';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
}

export interface CalendarListResponse {
  success: boolean;
  events: CalendarEvent[];
  error?: string;
}

export class GoogleCalendarService {
  private oauth2Client: any;

  constructor(accessToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback/google'
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken
    });
  }

  /**
   * Créer un événement dans Google Calendar
   */
  async createEvent(event: CalendarEvent): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      logger.info('Creating Google Calendar event', { summary: event.summary });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      logger.info('Google Calendar event created', { eventId: (response as any).data.id });

      return {
        success: true,
        eventId: (response as any).data.id
      };
    } catch (error) {
      logger.error('Error creating Google Calendar event', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Lister les événements à venir
   */
  async listUpcomingEvents(maxResults: number = 10): Promise<CalendarListResponse> {
    try {
      logger.info('Listing upcoming Google Calendar events', { maxResults });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events: CalendarEvent[] = response.data.items?.map(item => ({
        id: item.id || undefined,
        summary: item.summary || '',
        description: item.description || undefined,
        start: {
          dateTime: item.start?.dateTime || item.start?.date || '',
          timeZone: item.start?.timeZone || 'Europe/Paris'
        },
        end: {
          dateTime: item.end?.dateTime || item.end?.date || '',
          timeZone: item.end?.timeZone || 'Europe/Paris'
        },
        attendees: item.attendees?.map(attendee => ({
          email: attendee.email || '',
          displayName: attendee.displayName || undefined
        })),
        location: item.location || undefined
      })) || [];

      logger.info('Google Calendar events retrieved', { count: events.length });

      return {
        success: true,
        events
      };
    } catch (error) {
      logger.error('Error listing Google Calendar events', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mettre à jour un événement
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Updating Google Calendar event', { eventId });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event
      });

      logger.info('Google Calendar event updated', { eventId });

      return { success: true };
    } catch (error) {
      logger.error('Error updating Google Calendar event', { 
        eventId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Supprimer un événement
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Deleting Google Calendar event', { eventId });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId
      });

      logger.info('Google Calendar event deleted', { eventId });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting Google Calendar event', { 
        eventId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Vérifier la disponibilité
   */
  async checkAvailability(startTime: string, endTime: string): Promise<{ success: boolean; available: boolean; error?: string }> {
    try {
      logger.info('Checking Google Calendar availability', { startTime, endTime });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startTime,
          timeMax: endTime,
          items: [{ id: 'primary' }]
        }
      });

      const busyTimes = (response as any).data.calendars?.primary?.busy || [];
      const available = busyTimes.length === 0;

      logger.info('Google Calendar availability checked', { available, busyCount: busyTimes.length });

      return {
        success: true,
        available
      };
    } catch (error) {
      logger.error('Error checking Google Calendar availability', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}




