import { google } from 'googleapis';

export interface CalendarEvent {
  id: string;
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
}

export interface CalendarEventsResponse {
  success: boolean;
  events?: CalendarEvent[];
  error?: string;
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private calendar: any;

  private constructor() {
    // Initialiser le service Calendar
    this.calendar = google.calendar('v3');
  }

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  /**
   * Obtenir les événements du calendrier
   */
  async getEvents(accessToken: string, calendarId: string = 'primary'): Promise<CalendarEventsResponse> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const response = await this.calendar.events.list({
        auth: auth,
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      return {
        success: true,
        events: events.map((event: any) => ({
          id: event.id,
          summary: event.summary || 'Sans titre',
          description: event.description,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
        })),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Créer un événement dans le calendrier
   */
  async createEvent(accessToken: string, event: Omit<CalendarEvent, 'id'>, calendarId: string = 'primary'): Promise<{ success: boolean; event?: CalendarEvent; error?: string }> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const response = await this.calendar.events.insert({
        auth: auth,
        calendarId: calendarId,
        resource: event,
      });

      return {
        success: true,
        event: {
          id: response.data.id,
          summary: response.data.summary,
          description: response.data.description,
          start: response.data.start,
          end: response.data.end,
          attendees: response.data.attendees,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Mettre à jour un événement
   */
  async updateEvent(accessToken: string, eventId: string, event: Partial<CalendarEvent>, calendarId: string = 'primary'): Promise<{ success: boolean; event?: CalendarEvent; error?: string }> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const response = await this.calendar.events.update({
        auth: auth,
        calendarId: calendarId,
        eventId: eventId,
        resource: event,
      });

      return {
        success: true,
        event: {
          id: response.data.id,
          summary: response.data.summary,
          description: response.data.description,
          start: response.data.start,
          end: response.data.end,
          attendees: response.data.attendees,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Supprimer un événement
   */
  async deleteEvent(accessToken: string, eventId: string, calendarId: string = 'primary'): Promise<{ success: boolean; error?: string }> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      await this.calendar.events.delete({
        auth: auth,
        calendarId: calendarId,
        eventId: eventId,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Obtenir les calendriers disponibles
   */
  async getCalendars(accessToken: string): Promise<{ success: boolean; calendars?: any[]; error?: string }> {
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const response = await this.calendar.calendarList.list({
        auth: auth,
      });

      return {
        success: true,
        calendars: response.data.items || [],
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des calendriers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}

export default GoogleCalendarService;




