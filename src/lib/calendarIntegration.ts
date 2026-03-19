import { supabase } from './supabase';

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: 'google' | 'ical' | 'outlook';
  provider_account_id?: string;
  account_name: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  ical_url?: string;
  sync_enabled: boolean;
  two_way_sync: boolean;
  notifications_enabled: boolean;
  last_synced_at?: string;
  sync_error?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface SyncedEvent {
  id: string;
  calendar_connection_id: string;
  provider_event_id: string;
  title: string;
  description?: string;
  start_date: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  attendees?: any[];
  timezone?: string;
  is_all_day: boolean;
  recurring_rule?: string;
  raw_data?: any;
  last_modified_at?: string;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export const calendarIntegrationService = {
  // Get all calendar connections for the current user
  async getConnections(): Promise<CalendarConnection[]> {
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calendar connections:', error);
      throw error;
    }

    return data || [];
  },

  // Create a new calendar connection
  async createConnection(connection: Omit<CalendarConnection, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CalendarConnection> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('calendar_connections')
      .insert({
        ...connection,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar connection:', error);
      throw error;
    }

    return data;
  },

  // Update an existing calendar connection
  async updateConnection(id: string, updates: Partial<CalendarConnection>): Promise<CalendarConnection> {
    const { data, error } = await supabase
      .from('calendar_connections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar connection:', error);
      throw error;
    }

    return data;
  },

  // Delete a calendar connection
  async deleteConnection(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar connection:', error);
      throw error;
    }
  },

  // Get synced events for a specific connection
  async getEvents(connectionId: string, startDate?: string, endDate?: string): Promise<SyncedEvent[]> {
    let query = supabase
      .from('synced_events')
      .select('*')
      .eq('calendar_connection_id', connectionId)
      .order('start_date', { ascending: true });

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching synced events:', error);
      throw error;
    }

    return data || [];
  },

  // Get all synced events for all user's connections
  async getAllSyncedEvents(startDate?: string, endDate?: string): Promise<SyncedEvent[]> {
    let query = supabase
      .from('synced_events')
      .select(`
        *,
        calendar_connections!inner(provider, color, account_name)
      `)
      .order('start_date', { ascending: true });

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all synced events:', error);
      throw error;
    }

    return data || [];
  },

  // Sync events from Google Calendar
  async syncGoogleCalendar(connectionId: string): Promise<void> {
    const { data: connection, error: fetchError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      throw new Error('Calendar connection not found');
    }

    try {
      // Check if token is expired and refresh if needed
      if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
        await this.refreshGoogleToken(connectionId);
        const { data: refreshedConnection } = await supabase
          .from('calendar_connections')
          .select('*')
          .eq('id', connectionId)
          .single();
        if (refreshedConnection) {
          connection.access_token = refreshedConnection.access_token;
        }
      }

      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 6);

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${connection.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.items || [];

      for (const event of events) {
        const startDateTime = event.start.dateTime || event.start.date;
        const endDateTime = event.end?.dateTime || event.end?.date;
        const isAllDay = !event.start.dateTime;

        const startDate = new Date(startDateTime);
        const endDate = endDateTime ? new Date(endDateTime) : startDate;

        await supabase.from('synced_events').upsert(
          {
            calendar_connection_id: connectionId,
            provider_event_id: event.id,
            title: event.summary || 'Untitled Event',
            description: event.description,
            start_date: startDate.toISOString().split('T')[0],
            start_time: isAllDay ? null : startDate.toISOString().split('T')[1].substring(0, 5),
            end_date: endDate.toISOString().split('T')[0],
            end_time: isAllDay ? null : endDate.toISOString().split('T')[1].substring(0, 5),
            location: event.location,
            attendees: event.attendees,
            timezone: event.start.timeZone,
            is_all_day: isAllDay,
            recurring_rule: event.recurrence ? event.recurrence.join(';') : null,
            raw_data: event,
            last_modified_at: event.updated,
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: 'calendar_connection_id,provider_event_id',
          }
        );
      }

      await supabase
        .from('calendar_connections')
        .update({
          last_synced_at: new Date().toISOString(),
          sync_error: null,
        })
        .eq('id', connectionId);

    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      await supabase
        .from('calendar_connections')
        .update({
          sync_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', connectionId);
      throw error;
    }
  },

  // Refresh Google OAuth token
  async refreshGoogleToken(connectionId: string): Promise<void> {
    const { data: connection } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection || !connection.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/google-refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: connection.refresh_token,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const { access_token, expires_in } = await response.json();
      const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      await supabase
        .from('calendar_connections')
        .update({
          access_token,
          token_expires_at: expiresAt,
        })
        .eq('id', connectionId);

    } catch (error) {
      console.error('Error refreshing Google token:', error);
      throw error;
    }
  },

  // Sync events from iCal feed
  async syncICalFeed(connectionId: string): Promise<void> {
    const { data: connection, error: fetchError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection || !connection.ical_url) {
      throw new Error('Invalid iCal connection');
    }

    try {
      const response = await fetch(connection.ical_url);

      if (!response.ok) {
        throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
      }

      const icalData = await response.text();

      const events = this.parseICalData(icalData);

      for (const event of events) {
        await supabase.from('synced_events').upsert(
          {
            calendar_connection_id: connectionId,
            provider_event_id: event.uid,
            title: event.summary || 'Untitled Event',
            description: event.description,
            start_date: event.startDate,
            start_time: event.startTime,
            end_date: event.endDate,
            end_time: event.endTime,
            location: event.location,
            timezone: event.timezone,
            is_all_day: event.isAllDay,
            recurring_rule: event.recurrence,
            raw_data: event.raw,
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: 'calendar_connection_id,provider_event_id',
          }
        );
      }

      await supabase
        .from('calendar_connections')
        .update({
          last_synced_at: new Date().toISOString(),
          sync_error: null,
        })
        .eq('id', connectionId);

    } catch (error) {
      console.error('Error syncing iCal feed:', error);
      await supabase
        .from('calendar_connections')
        .update({
          sync_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', connectionId);
      throw error;
    }
  },

  // Parse iCal data
  parseICalData(icalData: string): any[] {
    const events: any[] = [];
    const lines = icalData.split(/\r?\n/);
    let currentEvent: any = null;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = { raw: {} };
      } else if (line.startsWith('END:VEVENT') && currentEvent) {
        if (currentEvent.uid && currentEvent.startDate) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        let key = line.substring(0, colonIndex);
        let value = line.substring(colonIndex + 1);

        const semicolonIndex = key.indexOf(';');
        const params: any = {};
        if (semicolonIndex !== -1) {
          const paramString = key.substring(semicolonIndex + 1);
          key = key.substring(0, semicolonIndex);
          paramString.split(';').forEach(param => {
            const [paramKey, paramValue] = param.split('=');
            if (paramKey && paramValue) {
              params[paramKey] = paramValue;
            }
          });
        }

        if (key === 'UID') {
          currentEvent.uid = value;
        } else if (key === 'SUMMARY') {
          currentEvent.summary = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        } else if (key === 'DESCRIPTION') {
          currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        } else if (key === 'LOCATION') {
          currentEvent.location = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        } else if (key === 'DTSTART') {
          const { date, time, isAllDay } = this.parseICalDateTime(value, params);
          currentEvent.startDate = date;
          currentEvent.startTime = time;
          currentEvent.isAllDay = isAllDay;
          currentEvent.timezone = params.TZID;
        } else if (key === 'DTEND') {
          const { date, time } = this.parseICalDateTime(value, params);
          currentEvent.endDate = date;
          currentEvent.endTime = time;
        } else if (key === 'RRULE') {
          currentEvent.recurrence = value;
        }

        currentEvent.raw[key] = value;
      }
    }

    return events;
  },

  // Parse iCal date/time format
  parseICalDateTime(value: string, params: any): { date: string; time: string | null; isAllDay: boolean } {
    if (value.length === 8) {
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      return {
        date: `${year}-${month}-${day}`,
        time: null,
        isAllDay: true
      };
    } else if (value.length >= 15) {
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      const hour = value.substring(9, 11);
      const minute = value.substring(11, 13);
      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}`,
        isAllDay: false
      };
    }

    return {
      date: new Date().toISOString().split('T')[0],
      time: null,
      isAllDay: true
    };
  },

  // Sync all enabled connections
  async syncAllConnections(): Promise<void> {
    const connections = await this.getConnections();
    const enabledConnections = connections.filter(c => c.sync_enabled);

    const syncPromises = enabledConnections.map(connection => {
      switch (connection.provider) {
        case 'google':
          return this.syncGoogleCalendar(connection.id);
        case 'ical':
          return this.syncICalFeed(connection.id);
        case 'outlook':
          // Implement Outlook sync
          return Promise.resolve();
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(syncPromises);
  },

  // Generate OAuth URL for Google Calendar
  getGoogleOAuthUrl(): string {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    const redirectUri = `${window.location.origin}/calendar`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  // Handle OAuth callback
  async handleOAuthCallback(code: string, provider: 'google' | 'outlook'): Promise<CalendarConnection> {
    if (provider !== 'google') {
      throw new Error('Only Google OAuth is currently supported');
    }

    const redirectUri = `${window.location.origin}/calendar`;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const response = await fetch(`${supabaseUrl}/functions/v1/google-oauth-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to authenticate with Google');
    }

    const { access_token, refresh_token, expires_at, user_info } = await response.json();

    const connection = await this.createConnection({
      provider: 'google',
      provider_account_id: user_info.id,
      account_name: user_info.email,
      access_token,
      refresh_token,
      token_expires_at: expires_at,
      sync_enabled: true,
      two_way_sync: false,
      notifications_enabled: true,
      color: '#4285f4',
    });

    await this.syncGoogleCalendar(connection.id);

    return connection;
  },
};
