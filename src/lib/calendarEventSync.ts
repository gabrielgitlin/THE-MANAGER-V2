import { supabase } from './supabase';
import { CalendarIcon, Disc, Plane, Building, CheckCircle, Scale, Cake } from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'show' | 'release' | 'other' | 'task' | 'travel_accommodation';
  date: string;
  time?: string;
  location?: string;
  description?: string;
  color: string;
  icon: any;
  tags?: string[];
  source: 'internal' | 'database';
  relatedId?: string;
}

export const calendarEventSyncService = {
  async syncAllEvents(): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return events;

      const [
        showEvents,
        releaseEvents,
        taskEvents,
        contractEvents,
        userCalendarEvents
      ] = await Promise.all([
        this.getShowEvents(),
        this.getReleaseEvents(),
        this.getTaskEvents(),
        this.getContractEvents(),
        this.getUserCalendarEvents()
      ]);

      events.push(
        ...showEvents,
        ...releaseEvents,
        ...taskEvents,
        ...contractEvents,
        ...userCalendarEvents
      );

      return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error syncing calendar events:', error);
      return events;
    }
  },

  async getShowEvents(): Promise<CalendarEvent[]> {
    try {
      const { data: shows, error } = await supabase
        .from('shows')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      return (shows || []).map((show: any) => ({
        id: `show-${show.id}`,
        title: show.title || `${show.venue_name || 'Show'}`,
        type: 'show' as const,
        date: show.date,
        time: show.show_time || undefined,
        location: show.venue_city && show.venue_country
          ? `${show.venue_name || ''}, ${show.venue_city}, ${show.venue_country}`.trim()
          : show.venue_name || undefined,
        description: show.notes || `Status: ${show.status || 'Unknown'}`,
        color: 'bg-black text-white',
        icon: CalendarIcon,
        tags: ['show', 'live', show.status?.toLowerCase() || 'pending'],
        source: 'database' as const,
        relatedId: show.id
      }));
    } catch (error) {
      console.error('Error fetching show events:', error);
      return [];
    }
  },

  async getReleaseEvents(): Promise<CalendarEvent[]> {
    try {
      const { data: albums, error } = await supabase
        .from('albums')
        .select(`
          id,
          title,
          release_date,
          format,
          status,
          artists (name)
        `)
        .order('release_date', { ascending: true });

      if (error) throw error;

      return (albums || []).map((album: any) => ({
        id: `release-${album.id}`,
        title: `${album.title} (${album.format})`,
        type: 'release' as const,
        date: album.release_date,
        description: `${album.artists?.name || 'Unknown Artist'} - ${album.format} Release`,
        color: 'bg-[#009C55] text-white',
        icon: Disc,
        tags: ['release', album.format?.toLowerCase() || 'album', album.status?.toLowerCase() || 'upcoming'],
        source: 'database' as const,
        relatedId: album.id
      }));
    } catch (error) {
      console.error('Error fetching release events:', error);
      return [];
    }
  },

  async getTaskEvents(): Promise<CalendarEvent[]> {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return (tasks || []).map((task: any) => ({
        id: `task-${task.id}`,
        title: task.title,
        type: 'task' as const,
        date: task.due_date,
        description: task.description || `Priority: ${task.priority || 'Medium'}`,
        color: 'bg-[#CCDBE2] text-black',
        icon: CheckCircle,
        tags: ['task', task.priority?.toLowerCase() || 'medium', task.status?.toLowerCase() || 'pending'],
        source: 'database' as const,
        relatedId: task.id
      }));
    } catch (error) {
      console.error('Error fetching task events:', error);
      return [];
    }
  },

  async getContractEvents(): Promise<CalendarEvent[]> {
    try {
      const { data: contracts, error } = await supabase
        .from('legal_documents')
        .select('*')
        .not('expiry_date', 'is', null)
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      const events: CalendarEvent[] = [];

      (contracts || []).forEach((contract: any) => {
        if (contract.signed_date) {
          events.push({
            id: `contract-signed-${contract.id}`,
            title: `${contract.title} - Signed`,
            type: 'other' as const,
            date: contract.signed_date,
            description: `Contract signed: ${contract.type || 'Document'}`,
            color: 'bg-[#EEF2EA] text-black',
            icon: Scale,
            tags: ['contract', 'signed', contract.type?.toLowerCase() || 'document'],
            source: 'database' as const,
            relatedId: contract.id
          });
        }

        if (contract.expiry_date) {
          events.push({
            id: `contract-expiry-${contract.id}`,
            title: `${contract.title} - Expires`,
            type: 'other' as const,
            date: contract.expiry_date,
            description: `Contract expires: ${contract.type || 'Document'}`,
            color: 'bg-[#EEF2EA] text-black',
            icon: Scale,
            tags: [
              'contract',
              'expiry',
              contract.type?.toLowerCase() || 'document'
            ],
            source: 'database' as const,
            relatedId: contract.id
          });
        }
      });

      return events;
    } catch (error) {
      console.error('Error fetching contract events:', error);
      return [];
    }
  },

  async getUserCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      return (events || []).map((event: any) => {
        let mappedType: CalendarEvent['type'] = 'other';
        let color = 'bg-[#EEF2EA] text-black';

        switch (event.event_type) {
          case 'show':
            mappedType = 'show';
            color = 'bg-black text-white';
            break;
          case 'release':
            mappedType = 'release';
            color = 'bg-[#009C55] text-white';
            break;
          case 'task':
            mappedType = 'task';
            color = 'bg-[#CCDBE2] text-black';
            break;
          case 'travel':
          case 'accommodation':
          case 'travel_accommodation':
            mappedType = 'travel_accommodation';
            color = 'bg-[#90928F] text-white';
            break;
          default:
            mappedType = 'other';
            color = 'bg-[#EEF2EA] text-black';
        }

        return {
          id: `cal-${event.id}`,
          title: event.title,
          type: mappedType,
          date: event.start_date,
          time: event.start_time || undefined,
          location: event.location || undefined,
          description: event.description || undefined,
          color: color,
          icon: CalendarIcon,
          tags: event.tags || [],
          source: 'database' as const
        };
      });
    } catch (error) {
      console.error('Error fetching user calendar events:', error);
      return [];
    }
  },

  async createTaskEvent(task: {
    title: string;
    description?: string;
    due_date: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('title', task.title)
        .eq('due_date', task.due_date)
        .maybeSingle();

      if (existingTask) {
        console.log('Task already exists, skipping creation');
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          priority: task.priority || 'medium',
          status: 'pending'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating task event:', error);
      throw error;
    }
  },

  async updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string, eventType: CalendarEvent['type']): Promise<void> {
    try {
      if (eventType === 'task') {
        const taskId = eventId.replace('task-', '');
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', eventId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
};
