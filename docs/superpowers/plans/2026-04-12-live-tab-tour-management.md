# LIVE Tab — Tour & Show Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the LIVE tab into a full tour & show management system with Tours as the top-level container, a venue database, tour calendar/map visualization, and a signature vintage ticket generator with social sharing.

**Architecture:** The LIVE tab gets restructured with 4 subtabs: TOURS, SHOWS, VENUES, CALENDAR. Tours are the primary container holding "tour days" (show days, travel days, off days, rehearsal days). Shows can exist standalone or within a tour. A new vintage ticket renderer generates shareable PNG assets from show data using HTML Canvas. All financial features are deferred to a later phase.

**Tech Stack:** React 18 + TypeScript, Supabase (Postgres + Edge Functions), Tailwind CSS, Zustand, html-to-image (ticket PNG generation), Mapbox GL JS or Leaflet (tour route map), Web Share API + download fallback.

---

## Phase Overview

| Phase | Scope | Estimated Tasks |
|-------|-------|-----------------|
| **Phase 1** | Database schema + Tour CRUD + Tab restructure | Tasks 1–5 |
| **Phase 2** | Shows within Tours + Day Types + Itinerary | Tasks 6–10 |
| **Phase 3** | Venue Database Tab | Tasks 11–13 |
| **Phase 4** | Tour Calendar + Map Visualization | Tasks 14–16 |
| **Phase 5** | Vintage Ticket Generator | Tasks 17–19 |
| **Phase 6** | Social Sharing Integration | Tasks 20–21 |

---

## File Structure

### New Files
```
src/types/tour.ts                          — Tour, TourDay, TourStatus types
src/types/venue.ts                         — Enhanced Venue type with contacts, docs, notes
src/lib/tourService.ts                     — Tour CRUD + tour day management
src/lib/venueService.ts                    — Venue CRUD + search + dedup
src/lib/ticketGenerator.ts                 — Vintage ticket canvas rendering + PNG export
src/pages/live/Tours.tsx                   — Tours list page (subtab)
src/pages/live/TourDetails.tsx             — Single tour detail view with days
src/pages/live/TourItinerary.tsx           — Day sheet / itinerary view for a tour
src/pages/live/Venues.tsx                  — Venues list page (subtab)
src/pages/live/VenueDetails.tsx            — Single venue detail view
src/pages/live/TourCalendar.tsx            — Calendar + map view for tours
src/components/live/TourCard.tsx           — Tour card for list views
src/components/live/TourDayRow.tsx         — Row component for a tour day (show/travel/off/rehearsal)
src/components/live/TourDayModal.tsx       — Add/edit tour day modal
src/components/live/TourModal.tsx          — Create/edit tour modal
src/components/live/VintageTicket.tsx      — Vintage ticket React component (visual)
src/components/live/TicketShareModal.tsx   — Share/download modal for ticket images
src/components/live/VenueCard.tsx          — Venue card for list views
src/components/live/VenueModal.tsx         — Create/edit venue modal
src/components/live/TourMap.tsx            — Map component showing tour route
```

### Modified Files
```
src/pages/live/Live.tsx                    — Restructure navigation: Tours, Shows, Venues, Calendar subtabs
src/App.tsx                                — Add new routes for tours, venues, tour details, etc.
src/types/index.ts                         — Add tour_id to Show type, import new types
src/pages/live/AllShows.tsx                — Add tour filter, link to tour context
src/pages/live/Overview.tsx                — Update to show tours + shows combined overview
src/components/shows/ShowModal.tsx         — Add optional tour_id selector
```

### Database Migrations (Supabase)
```
supabase/migrations/XXXX_create_tours.sql
supabase/migrations/XXXX_create_tour_days.sql
supabase/migrations/XXXX_enhance_venues.sql
supabase/migrations/XXXX_add_tour_id_to_shows.sql
```

---

## PHASE 1: Database Schema + Tour CRUD + Tab Restructure

### Task 1: Database Schema — Tours & Tour Days

**Files:**
- Create: Supabase migration for `tours` and `tour_days` tables

**Context:** Tours are the top-level container. Each tour has a name, artist, start/end dates, status, and optional description/image. Tour days represent individual calendar days within a tour and have a `day_type` (show, travel, off, rehearsal). Show-type days link to the existing `shows` table. The `shows` table gets a nullable `tour_id` FK so shows can exist independently.

- [ ] **Step 1: Create tours table migration**

```sql
-- Migration: create_tours_table
CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tours for their artists"
  ON tours FOR SELECT
  USING (artist_id IN (
    SELECT artist_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage tours for their artists"
  ON tours FOR ALL
  USING (artist_id IN (
    SELECT artist_id FROM team_members WHERE user_id = auth.uid()
  ));
```

- [ ] **Step 2: Create tour_days table migration**

```sql
-- Migration: create_tour_days_table
CREATE TABLE tour_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN ('show', 'travel', 'off', 'rehearsal')),
  show_id UUID REFERENCES shows(id) ON DELETE SET NULL,
  title TEXT, -- For non-show days: "Travel to NYC", "Day Off - Berlin", "Rehearsal"
  notes TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tour_id, date) -- One day type per date per tour
);

ALTER TABLE tour_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tour days via tour access"
  ON tour_days FOR SELECT
  USING (tour_id IN (SELECT id FROM tours));

CREATE POLICY "Users can manage tour days via tour access"
  ON tour_days FOR ALL
  USING (tour_id IN (SELECT id FROM tours));
```

- [ ] **Step 3: Add tour_id to shows table**

```sql
-- Migration: add_tour_id_to_shows
ALTER TABLE shows ADD COLUMN tour_id UUID REFERENCES tours(id) ON DELETE SET NULL;
CREATE INDEX idx_shows_tour_id ON shows(tour_id);
```

- [ ] **Step 4: Apply migrations via Supabase dashboard or CLI**

Run each migration in order. Verify tables exist with:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('tours', 'tour_days');
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(live): add tours and tour_days database schema"
```

---

### Task 2: TypeScript Types for Tours

**Files:**
- Create: `src/types/tour.ts`
- Modify: `src/types/index.ts` (add tour_id to Show, re-export tour types)

- [ ] **Step 1: Create tour types file**

```typescript
// src/types/tour.ts

export type TourStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type DayType = 'show' | 'travel' | 'off' | 'rehearsal';

export interface Tour {
  id: string;
  artist_id: string;
  artist_name?: string; // joined from artists table
  name: string;
  description?: string;
  status: TourStatus;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Computed/joined
  total_shows?: number;
  total_days?: number;
  cities?: string[];
}

export interface TourDay {
  id: string;
  tour_id: string;
  date: string;
  day_type: DayType;
  show_id?: string;
  title?: string;
  notes?: string;
  city?: string;
  country?: string;
  // Joined show data (when day_type === 'show')
  show?: {
    id: string;
    title: string;
    venue_name: string;
    venue_city: string;
    venue_country: string;
    show_time?: string;
    status: string;
    capacity?: number;
  };
}

export interface TourFormData {
  name: string;
  description?: string;
  status: TourStatus;
  start_date?: string;
  end_date?: string;
  artist_id: string;
}

export interface TourDayFormData {
  date: string;
  day_type: DayType;
  show_id?: string;
  title?: string;
  notes?: string;
  city?: string;
  country?: string;
}
```

- [ ] **Step 2: Update Show type in index.ts to include tour_id**

In `src/types/index.ts`, add `tour_id` to the `Show` interface:

```typescript
export interface Show {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  venue_address?: string;
  venue_state?: string;
  venue_latitude?: number;
  venue_longitude?: number;
  google_place_id?: string;
  venue_id?: number;
  tour_id?: string; // <-- ADD THIS
  status: 'confirmed' | 'pending' | 'cancelled';
  capacity: number;
  ticketsSold?: number;
  deal?: ShowDeal;
  advances?: ShowAdvances;
  setlist?: Setlist;
  guestList?: GuestListEntry[];
}
```

Also add at the bottom of `src/types/index.ts`:

```typescript
export type { Tour, TourDay, TourStatus, DayType, TourFormData, TourDayFormData } from './tour';
```

- [ ] **Step 3: Commit**

```bash
git add src/types/tour.ts src/types/index.ts
git commit -m "feat(live): add Tour and TourDay TypeScript types"
```

---

### Task 3: Tour Service (CRUD)

**Files:**
- Create: `src/lib/tourService.ts`

- [ ] **Step 1: Create the tour service**

```typescript
// src/lib/tourService.ts
import { supabase } from './supabase';
import type { Tour, TourDay, TourFormData, TourDayFormData } from '../types/tour';

// ── Tours ──

export async function getTours(): Promise<Tour[]> {
  const { data, error } = await supabase
    .from('tours')
    .select(`
      *,
      artists(name),
      tour_days(id, day_type, date)
    `)
    .order('start_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(tour => ({
    ...tour,
    artist_name: tour.artists?.name,
    total_days: tour.tour_days?.length || 0,
    total_shows: tour.tour_days?.filter((d: any) => d.day_type === 'show').length || 0,
  }));
}

export async function getTour(id: string): Promise<Tour | null> {
  const { data, error } = await supabase
    .from('tours')
    .select(`
      *,
      artists(name)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    artist_name: data.artists?.name,
  };
}

export async function createTour(formData: TourFormData): Promise<Tour> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tours')
    .insert({
      ...formData,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTour(id: string, formData: Partial<TourFormData>): Promise<Tour> {
  const { data, error } = await supabase
    .from('tours')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTour(id: string): Promise<void> {
  const { error } = await supabase
    .from('tours')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Tour Days ──

export async function getTourDays(tourId: string): Promise<TourDay[]> {
  const { data, error } = await supabase
    .from('tour_days')
    .select(`
      *,
      shows(id, title, venue_name, venue_city, venue_country, show_time, status, capacity)
    `)
    .eq('tour_id', tourId)
    .order('date', { ascending: true });

  if (error) throw error;

  return (data || []).map(day => ({
    ...day,
    show: day.shows || undefined,
  }));
}

export async function addTourDay(tourId: string, formData: TourDayFormData): Promise<TourDay> {
  const { data, error } = await supabase
    .from('tour_days')
    .insert({ ...formData, tour_id: tourId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTourDay(id: string, formData: Partial<TourDayFormData>): Promise<TourDay> {
  const { data, error } = await supabase
    .from('tour_days')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTourDay(id: string): Promise<void> {
  const { error } = await supabase
    .from('tour_days')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Helpers ──

export async function addShowToTour(tourId: string, showId: string, date: string): Promise<void> {
  // Update the show's tour_id
  await supabase.from('shows').update({ tour_id: tourId }).eq('id', showId);

  // Create a tour_day entry
  await addTourDay(tourId, {
    date,
    day_type: 'show',
    show_id: showId,
  });
}

export async function removeShowFromTour(showId: string, tourDayId: string): Promise<void> {
  // Clear the show's tour_id
  await supabase.from('shows').update({ tour_id: null }).eq('id', showId);

  // Delete the tour_day entry
  await deleteTourDay(tourDayId);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/tourService.ts
git commit -m "feat(live): add tour service with CRUD operations"
```

---

### Task 4: Restructure LIVE Tab Navigation

**Files:**
- Modify: `src/pages/live/Live.tsx`

**Context:** Replace the current 4-tab navigation (Overview, Logistics, Marketing, Production) with the new primary subtabs: TOURS, SHOWS, VENUES, CALENDAR. The old sub-pages (logistics, marketing, production) become accessible from within individual show detail views, not as top-level tabs.

- [ ] **Step 1: Update Live.tsx with new navigation**

```typescript
// src/pages/live/Live.tsx
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Tours', path: '/live' },
  { name: 'Shows', path: '/live/shows' },
  { name: 'Venues', path: '/live/venues' },
  { name: 'Calendar', path: '/live/calendar' },
];

export default function Live() {
  const location = useLocation();

  return (
    <div>
      {/* Navigation */}
      <div className="mb-4 md:mb-8 scroll-row">
        <div className="inline-flex p-1" style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--border-2)' }}>
          <nav className="flex gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/live' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    px-4 md:px-6 py-2 text-sm font-medium uppercase transition-colors whitespace-nowrap
                    ${isActive ? 'text-brand-1' : ''}
                  `}
                  style={!isActive ? { color: 'var(--t2)' } : {}}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sub-page content */}
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/live/Live.tsx
git commit -m "refactor(live): restructure tab navigation to Tours/Shows/Venues/Calendar"
```

---

### Task 5: Tours List Page + Tour Card + Tour Modal + Routing

**Files:**
- Create: `src/pages/live/Tours.tsx`
- Create: `src/components/live/TourCard.tsx`
- Create: `src/components/live/TourModal.tsx`
- Modify: `src/App.tsx` (add new routes)

- [ ] **Step 1: Create TourCard component**

A card showing tour name, status badge, date range, number of shows, cities list.

```typescript
// src/components/live/TourCard.tsx
import React from 'react';
import { MapPin, Calendar, Music, ChevronRight } from 'lucide-react';
import type { Tour } from '../../types/tour';
import { formatDate } from '../../lib/utils';

const statusColors: Record<string, string> = {
  planning: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-green-500/20 text-green-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-gray-500/20 text-gray-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface TourCardProps {
  tour: Tour;
  onClick: () => void;
}

export default function TourCard({ tour, onClick }: TourCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 md:p-5 rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate" style={{ color: 'var(--t1)' }}>
              {tour.name}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tour.status]}`}>
              {statusLabels[tour.status]}
            </span>
          </div>

          {tour.artist_name && (
            <p className="text-sm mb-2" style={{ color: 'var(--t2)' }}>{tour.artist_name}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--t3)' }}>
            {tour.start_date && tour.end_date && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(tour.start_date)} — {formatDate(tour.end_date)}
              </span>
            )}
            {tour.total_shows !== undefined && (
              <span className="flex items-center gap-1">
                <Music size={12} />
                {tour.total_shows} show{tour.total_shows !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={18} style={{ color: 'var(--t3)' }} className="mt-1 flex-shrink-0" />
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Create TourModal component**

A modal for creating/editing tours with fields: name, artist, status, start/end dates, description.

```typescript
// src/components/live/TourModal.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Tour, TourFormData, TourStatus } from '../../types/tour';
import { supabase } from '../../lib/supabase';

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TourFormData) => Promise<void>;
  tour?: Tour;
}

const statusOptions: { value: TourStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function TourModal({ isOpen, onClose, onSave, tour }: TourModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TourStatus>('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [artistId, setArtistId] = useState('');
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadArtists();
      if (tour) {
        setName(tour.name);
        setDescription(tour.description || '');
        setStatus(tour.status);
        setStartDate(tour.start_date || '');
        setEndDate(tour.end_date || '');
        setArtistId(tour.artist_id);
      } else {
        setName('');
        setDescription('');
        setStatus('planning');
        setStartDate('');
        setEndDate('');
        setArtistId('');
      }
    }
  }, [isOpen, tour]);

  const loadArtists = async () => {
    const { data } = await supabase.from('artists').select('id, name').order('name');
    if (data) setArtists(data);
    if (data && data.length === 1 && !tour) setArtistId(data[0].id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !artistId) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        artist_id: artistId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-2)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>
            {tour ? 'Edit Tour' : 'New Tour'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={18} style={{ color: 'var(--t3)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Artist selector */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Artist</label>
            <select
              value={artistId}
              onChange={e => setArtistId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            >
              <option value="">Select artist...</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Tour name */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Tour Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. North America Summer 2026"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TourStatus)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            >
              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional tour description..."
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim() || !artistId}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand-1 text-white disabled:opacity-50">
              {saving ? 'Saving...' : tour ? 'Update Tour' : 'Create Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Tours list page**

```typescript
// src/pages/live/Tours.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import TourCard from '../../components/live/TourCard';
import TourModal from '../../components/live/TourModal';
import { getTours, createTour, deleteTour } from '../../lib/tourService';
import type { Tour, TourFormData, TourStatus } from '../../types/tour';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Tours() {
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TourStatus>('all');

  useEffect(() => { loadTours(); }, []);

  const loadTours = async () => {
    try {
      setLoading(true);
      const data = await getTours();
      setTours(data);
    } catch (err) {
      console.error('Error loading tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTour = async (formData: TourFormData) => {
    const newTour = await createTour(formData);
    setTours(prev => [newTour, ...prev]);
  };

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tour.artist_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
          <input
            type="text"
            placeholder="Search tours..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-1 text-white"
          >
            <Plus size={16} /> New Tour
          </button>
        </div>
      </div>

      {/* Tour list */}
      {filteredTours.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--t3)' }}>
          <p className="text-lg mb-2">No tours yet</p>
          <p className="text-sm">Create your first tour to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredTours.map(tour => (
            <TourCard
              key={tour.id}
              tour={tour}
              onClick={() => navigate(`/live/tour/${tour.id}`)}
            />
          ))}
        </div>
      )}

      <TourModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateTour}
      />
    </div>
  );
}
```

- [ ] **Step 4: Add new routes to App.tsx**

In `src/App.tsx`, add lazy imports and routes inside the `<Route path="live">` block:

Add at top with other lazy imports:
```typescript
const Tours = React.lazy(() => import('./pages/live/Tours'));
const TourDetails = React.lazy(() => import('./pages/live/TourDetails'));
const Venues = React.lazy(() => import('./pages/live/Venues'));
const VenueDetails = React.lazy(() => import('./pages/live/VenueDetails'));
const TourCalendar = React.lazy(() => import('./pages/live/TourCalendar'));
```

Replace the existing live routes block:
```typescript
<Route path="live" element={
  <ProtectedRoute requiredPermission="view_live">
    <Live />
  </ProtectedRoute>
}>
  <Route index element={<Tours />} />
  <Route path="shows" element={<AllShows />} />
  <Route path="venues" element={<Venues />} />
  <Route path="calendar" element={<TourCalendar />} />
  <Route path="tour/:tourId" element={<TourDetails />} />
  <Route path="tour/:tourId/itinerary" element={<TourItinerary />} />
  <Route path="venue/:venueId" element={<VenueDetails />} />
  <Route path="show/:id" element={<ShowDetails />} />
  <Route path="show/:id/logistics" element={<ShowDetails />} />
  <Route path="show/:id/marketing" element={<ShowDetails />} />
  <Route path="show/:id/production" element={<ShowDetails />} />
  <Route path="show/:id/setlist" element={<ShowDetails />} />
  <Route path="show/:id/guestlist" element={<ShowDetails />} />
</Route>
```

Note: `TourDetails`, `Venues`, `VenueDetails`, `TourCalendar`, and `TourItinerary` pages will be created in later phases. For now, create placeholder files so the app compiles:

```typescript
// src/pages/live/TourDetails.tsx (placeholder)
export default function TourDetails() {
  return <div style={{ color: 'var(--t2)' }}>Tour details — coming in Phase 2</div>;
}

// src/pages/live/Venues.tsx (placeholder)
export default function Venues() {
  return <div style={{ color: 'var(--t2)' }}>Venues — coming in Phase 3</div>;
}

// src/pages/live/VenueDetails.tsx (placeholder)
export default function VenueDetails() {
  return <div style={{ color: 'var(--t2)' }}>Venue details — coming in Phase 3</div>;
}

// src/pages/live/TourCalendar.tsx (placeholder)
export default function TourCalendar() {
  return <div style={{ color: 'var(--t2)' }}>Tour calendar — coming in Phase 4</div>;
}

// src/pages/live/TourItinerary.tsx (placeholder)
export default function TourItinerary() {
  return <div style={{ color: 'var(--t2)' }}>Tour itinerary — coming in Phase 2</div>;
}
```

- [ ] **Step 5: Verify the app compiles and tours tab loads**

Run: `npm run dev`
Navigate to `/live` — should show the Tours list (empty state).
Verify the 4 subtabs render: Tours, Shows, Venues, Calendar.

- [ ] **Step 6: Commit**

```bash
git add src/pages/live/ src/components/live/ src/App.tsx
git commit -m "feat(live): add Tours list page, TourCard, TourModal, and new routing structure"
```

---

## PHASE 2: Tour Details + Day Types + Itinerary

### Task 6: Tour Details Page (Day List)

**Files:**
- Modify: `src/pages/live/TourDetails.tsx` (replace placeholder)
- Create: `src/components/live/TourDayRow.tsx`

**Context:** The tour detail page shows the tour header (name, status, dates) and a chronological list of tour days. Each day row shows the date, day type badge, and either show details or day title. Users can add days from here.

- [ ] **Step 1: Create TourDayRow component**

Renders a single row for a tour day. Show days display venue/city/time; travel/off/rehearsal days display their title. Color-coded by day type.

```typescript
// src/components/live/TourDayRow.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Music, Plane, Coffee, Mic, Pencil, Trash2, Ticket } from 'lucide-react';
import type { TourDay, DayType } from '../../types/tour';
import { formatDate, formatTime } from '../../lib/utils';

const dayTypeConfig: Record<DayType, { label: string; color: string; icon: React.ElementType }> = {
  show: { label: 'Show', color: 'bg-green-500/20 text-green-400', icon: Music },
  travel: { label: 'Travel', color: 'bg-blue-500/20 text-blue-400', icon: Plane },
  off: { label: 'Day Off', color: 'bg-gray-500/20 text-gray-400', icon: Coffee },
  rehearsal: { label: 'Rehearsal', color: 'bg-purple-500/20 text-purple-400', icon: Mic },
};

interface TourDayRowProps {
  day: TourDay;
  onEdit: (day: TourDay) => void;
  onDelete: (day: TourDay) => void;
  onTicket?: (day: TourDay) => void;
}

export default function TourDayRow({ day, onEdit, onDelete, onTicket }: TourDayRowProps) {
  const navigate = useNavigate();
  const config = dayTypeConfig[day.day_type];
  const Icon = config.icon;

  const handleClick = () => {
    if (day.day_type === 'show' && day.show_id) {
      navigate(`/live/show/${day.show_id}`);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 md:p-4 rounded-lg transition-colors ${day.day_type === 'show' ? 'cursor-pointer hover:bg-white/5' : ''}`}
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}
      onClick={handleClick}
    >
      {/* Date */}
      <div className="text-center min-w-[50px]">
        <div className="text-xs font-medium uppercase" style={{ color: 'var(--t3)' }}>
          {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className="text-lg font-bold" style={{ color: 'var(--t1)' }}>
          {new Date(day.date + 'T00:00:00').getDate()}
        </div>
        <div className="text-xs" style={{ color: 'var(--t3)' }}>
          {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
        </div>
      </div>

      {/* Day type badge */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {day.day_type === 'show' && day.show ? (
          <>
            <div className="font-medium truncate" style={{ color: 'var(--t1)' }}>{day.show.title}</div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--t3)' }}>
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {day.show.venue_name}, {day.show.venue_city}
              </span>
              {day.show.show_time && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {formatTime(day.show.show_time)}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="font-medium truncate" style={{ color: 'var(--t1)' }}>
              {day.title || config.label}
            </div>
            {day.city && (
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--t3)' }}>
                <MapPin size={11} /> {day.city}{day.country ? `, ${day.country}` : ''}
              </div>
            )}
          </>
        )}
        {day.notes && (
          <div className="text-xs mt-1 truncate" style={{ color: 'var(--t3)' }}>{day.notes}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        {day.day_type === 'show' && onTicket && (
          <button onClick={() => onTicket(day)} className="p-1.5 rounded hover:bg-white/10" title="Generate Ticket">
            <Ticket size={14} style={{ color: 'var(--t3)' }} />
          </button>
        )}
        <button onClick={() => onEdit(day)} className="p-1.5 rounded hover:bg-white/10">
          <Pencil size={14} style={{ color: 'var(--t3)' }} />
        </button>
        <button onClick={() => onDelete(day)} className="p-1.5 rounded hover:bg-red-500/20">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build TourDetails page**

```typescript
// src/pages/live/TourDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Calendar, MapPin, Music } from 'lucide-react';
import TourDayRow from '../../components/live/TourDayRow';
import TourDayModal from '../../components/live/TourDayModal';
import TourModal from '../../components/live/TourModal';
import { getTour, getTourDays, updateTour, addTourDay, updateTourDay, deleteTourDay } from '../../lib/tourService';
import type { Tour, TourDay, TourFormData, TourDayFormData } from '../../types/tour';
import { formatDate } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TourDetails() {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [days, setDays] = useState<TourDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditTourOpen, setIsEditTourOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<TourDay | undefined>();

  useEffect(() => {
    if (tourId) loadTourData();
  }, [tourId]);

  const loadTourData = async () => {
    try {
      setLoading(true);
      const [tourData, daysData] = await Promise.all([
        getTour(tourId!),
        getTourDays(tourId!),
      ]);
      setTour(tourData);
      setDays(daysData);
    } catch (err) {
      console.error('Error loading tour:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTour = async (formData: TourFormData) => {
    if (!tourId) return;
    const updated = await updateTour(tourId, formData);
    setTour(prev => prev ? { ...prev, ...updated } : null);
  };

  const handleSaveDay = async (formData: TourDayFormData) => {
    if (!tourId) return;
    if (editingDay) {
      await updateTourDay(editingDay.id, formData);
    } else {
      await addTourDay(tourId, formData);
    }
    await loadTourData();
  };

  const handleDeleteDay = async (day: TourDay) => {
    if (!confirm(`Delete this ${day.day_type} day?`)) return;
    await deleteTourDay(day.id);
    setDays(prev => prev.filter(d => d.id !== day.id));
  };

  if (loading) return <LoadingSpinner />;
  if (!tour) return <div style={{ color: 'var(--t2)' }}>Tour not found</div>;

  const showDays = days.filter(d => d.day_type === 'show');
  const uniqueCities = [...new Set(days.map(d => d.city).filter(Boolean))];

  return (
    <div>
      {/* Back + Header */}
      <button onClick={() => navigate('/live')} className="flex items-center gap-1 text-sm mb-4 hover:underline" style={{ color: 'var(--t3)' }}>
        <ArrowLeft size={16} /> Back to Tours
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--t1)' }}>{tour.name}</h1>
          {tour.artist_name && <p className="text-sm mt-1" style={{ color: 'var(--t2)' }}>{tour.artist_name}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2" style={{ color: 'var(--t3)' }}>
            {tour.start_date && tour.end_date && (
              <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(tour.start_date)} — {formatDate(tour.end_date)}</span>
            )}
            <span className="flex items-center gap-1"><Music size={12} />{showDays.length} shows</span>
            {uniqueCities.length > 0 && (
              <span className="flex items-center gap-1"><MapPin size={12} />{uniqueCities.length} cities</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setIsEditTourOpen(true)} className="p-2 rounded-lg hover:bg-white/10" style={{ border: '1px solid var(--border-2)' }}>
            <Pencil size={16} style={{ color: 'var(--t2)' }} />
          </button>
        </div>
      </div>

      {tour.description && (
        <p className="text-sm mb-6 p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)' }}>
          {tour.description}
        </p>
      )}

      {/* Days list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--t2)' }}>
          Tour Days ({days.length})
        </h2>
        <button
          onClick={() => { setEditingDay(undefined); setIsDayModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-1 text-white"
        >
          <Plus size={14} /> Add Day
        </button>
      </div>

      {days.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--t3)' }}>
          <p className="mb-1">No days added yet</p>
          <p className="text-xs">Add show days, travel days, days off, and rehearsal days to build your tour schedule.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {days.map(day => (
            <TourDayRow
              key={day.id}
              day={day}
              onEdit={(d) => { setEditingDay(d); setIsDayModalOpen(true); }}
              onDelete={handleDeleteDay}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TourModal isOpen={isEditTourOpen} onClose={() => setIsEditTourOpen(false)} onSave={handleUpdateTour} tour={tour} />

      <TourDayModal
        isOpen={isDayModalOpen}
        onClose={() => { setIsDayModalOpen(false); setEditingDay(undefined); }}
        onSave={handleSaveDay}
        tourId={tourId!}
        existingDay={editingDay}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/live/TourDetails.tsx src/components/live/TourDayRow.tsx
git commit -m "feat(live): add Tour details page with day list and day row component"
```

---

### Task 7: Tour Day Modal (Add/Edit Days)

**Files:**
- Create: `src/components/live/TourDayModal.tsx`

**Context:** Modal for adding or editing a tour day. User picks the day type, date, and fills in relevant fields. For show days, they can either select an existing show or create a new one. For other day types, they enter a title, city, and notes.

- [ ] **Step 1: Create TourDayModal**

```typescript
// src/components/live/TourDayModal.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { TourDay, TourDayFormData, DayType } from '../../types/tour';
import { supabase } from '../../lib/supabase';

interface TourDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TourDayFormData) => Promise<void>;
  tourId: string;
  existingDay?: TourDay;
}

const dayTypes: { value: DayType; label: string }[] = [
  { value: 'show', label: 'Show Day' },
  { value: 'travel', label: 'Travel Day' },
  { value: 'off', label: 'Day Off' },
  { value: 'rehearsal', label: 'Rehearsal' },
];

export default function TourDayModal({ isOpen, onClose, onSave, tourId, existingDay }: TourDayModalProps) {
  const [dayType, setDayType] = useState<DayType>('show');
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [showId, setShowId] = useState('');
  const [availableShows, setAvailableShows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailableShows();
      if (existingDay) {
        setDayType(existingDay.day_type);
        setDate(existingDay.date);
        setTitle(existingDay.title || '');
        setCity(existingDay.city || '');
        setCountry(existingDay.country || '');
        setNotes(existingDay.notes || '');
        setShowId(existingDay.show_id || '');
      } else {
        setDayType('show');
        setDate('');
        setTitle('');
        setCity('');
        setCountry('');
        setNotes('');
        setShowId('');
      }
    }
  }, [isOpen, existingDay]);

  const loadAvailableShows = async () => {
    // Get shows that aren't already assigned to this tour (or any tour)
    const { data } = await supabase
      .from('shows')
      .select('id, title, date, venue_name, venue_city')
      .or(`tour_id.is.null,tour_id.eq.${tourId}`)
      .order('date', { ascending: true });
    if (data) setAvailableShows(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    try {
      await onSave({
        date,
        day_type: dayType,
        show_id: dayType === 'show' && showId ? showId : undefined,
        title: dayType !== 'show' ? title.trim() || undefined : undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-2)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>
            {existingDay ? 'Edit Day' : 'Add Tour Day'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={18} style={{ color: 'var(--t3)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Day type selector */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--t2)' }}>Day Type</label>
            <div className="grid grid-cols-4 gap-2">
              {dayTypes.map(dt => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setDayType(dt.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    dayType === dt.value ? 'bg-brand-1 text-white' : ''
                  }`}
                  style={dayType !== dt.value ? { backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' } : {}}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            />
          </div>

          {/* Show-specific: select existing show */}
          {dayType === 'show' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Link to Show</label>
              <select
                value={showId}
                onChange={e => setShowId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
              >
                <option value="">Select a show...</option>
                {availableShows.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {s.venue_name}, {s.venue_city} ({s.date})
                  </option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                Select an existing show or leave blank to add one later.
              </p>
            </div>
          )}

          {/* Non-show fields */}
          {dayType !== 'show' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={dayType === 'travel' ? 'e.g. Fly NYC → London' : dayType === 'rehearsal' ? 'e.g. Production Rehearsal' : 'e.g. Rest Day'}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Country</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }} />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !date}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand-1 text-white disabled:opacity-50">
              {saving ? 'Saving...' : existingDay ? 'Update Day' : 'Add Day'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/live/TourDayModal.tsx
git commit -m "feat(live): add TourDayModal for adding/editing tour days with day types"
```

---

### Task 8: Update AllShows with Tour Filter

**Files:**
- Modify: `src/pages/live/AllShows.tsx`

**Context:** Add a tour filter dropdown to the shows list so users can filter shows by tour. Also display the tour name on each show card when applicable.

- [ ] **Step 1: Add tour filter to AllShows**

Add to state:
```typescript
const [tourFilter, setTourFilter] = useState<string>('all');
const [tours, setTours] = useState<{ id: string; name: string }[]>([]);
```

In `loadShows`, also load tours:
```typescript
const { data: toursData } = await supabase.from('tours').select('id, name').order('name');
if (toursData) setTours(toursData);
```

In the query, join tour name:
```typescript
const { data, error } = await supabase
  .from('shows')
  .select('*, tours(id, name)')
  .order('date', { ascending: false });
```

Add tour_name to formatted shows:
```typescript
tour_id: show.tour_id,
tour_name: show.tours?.name || null,
```

Add filter logic:
```typescript
const matchesTour = tourFilter === 'all' || show.tour_id === tourFilter;
```

Add the dropdown in the filter bar (next to status filter):
```typescript
<select value={tourFilter} onChange={e => setTourFilter(e.target.value)}
  className="px-3 py-2 rounded-lg text-sm"
  style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
  <option value="all">All Tours</option>
  <option value="">No Tour</option>
  {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
</select>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/live/AllShows.tsx
git commit -m "feat(live): add tour filter to AllShows page"
```

---

### Task 9: Update ShowModal to Support Tour Assignment

**Files:**
- Modify: `src/components/shows/ShowModal.tsx`

**Context:** When creating or editing a show, add an optional "Tour" dropdown so shows can be assigned to a tour.

- [ ] **Step 1: Add tour selector to ShowModal**

Load tours on mount:
```typescript
const [tours, setTours] = useState<{ id: string; name: string }[]>([]);
const [tourId, setTourId] = useState<string>('');

// In useEffect/load:
const { data: toursData } = await supabase.from('tours').select('id, name').order('name');
if (toursData) setTours(toursData);
```

Add the dropdown field after the status field:
```typescript
<div>
  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t2)' }}>Tour (optional)</label>
  <select value={tourId} onChange={e => setTourId(e.target.value)}
    className="w-full px-3 py-2 rounded-lg text-sm"
    style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}>
    <option value="">No tour</option>
    {tours.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
  </select>
</div>
```

Include `tour_id` in the save payload.

- [ ] **Step 2: Commit**

```bash
git add src/components/shows/ShowModal.tsx
git commit -m "feat(live): add tour assignment to ShowModal"
```

---

### Task 10: Tour Itinerary / Day Sheet View

**Files:**
- Modify: `src/pages/live/TourItinerary.tsx` (replace placeholder)

**Context:** The itinerary is a printable/shareable day-by-day view of the tour. For each day, show: date, day type, venue/city info, schedule times (load-in, soundcheck, doors, showtime), hotel, transportation. This is the "day sheet" that tour managers use daily. Pull data from tour_days + shows + transportation + accommodations.

- [ ] **Step 1: Build the itinerary page**

```typescript
// src/pages/live/TourItinerary.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, MapPin, Clock, Hotel, Plane, Music, Coffee, Mic } from 'lucide-react';
import { getTour, getTourDays } from '../../lib/tourService';
import { supabase } from '../../lib/supabase';
import type { Tour, TourDay, DayType } from '../../types/tour';
import { formatDate, formatTime } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TourItinerary() {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [days, setDays] = useState<TourDay[]>([]);
  const [advances, setAdvances] = useState<Record<string, any>>({});
  const [transport, setTransport] = useState<Record<string, any[]>>({});
  const [hotels, setHotels] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tourId) loadItineraryData();
  }, [tourId]);

  const loadItineraryData = async () => {
    try {
      setLoading(true);
      const [tourData, daysData] = await Promise.all([
        getTour(tourId!),
        getTourDays(tourId!),
      ]);
      setTour(tourData);
      setDays(daysData);

      // Load advances, transport, and hotels for show days
      const showIds = daysData.filter(d => d.show_id).map(d => d.show_id!);
      if (showIds.length > 0) {
        const [advRes, transRes, hotelRes] = await Promise.all([
          supabase.from('show_advances').select('*').in('show_id', showIds),
          supabase.from('transportation').select('*').in('show_id', showIds),
          supabase.from('accommodations').select('*').in('show_id', showIds),
        ]);

        // Index by show_id
        const advMap: Record<string, any> = {};
        (advRes.data || []).forEach(a => { advMap[a.show_id] = a; });
        setAdvances(advMap);

        const transMap: Record<string, any[]> = {};
        (transRes.data || []).forEach(t => {
          if (!transMap[t.show_id]) transMap[t.show_id] = [];
          transMap[t.show_id].push(t);
        });
        setTransport(transMap);

        const hotelMap: Record<string, any[]> = {};
        (hotelRes.data || []).forEach(h => {
          if (!hotelMap[h.show_id]) hotelMap[h.show_id] = [];
          hotelMap[h.show_id].push(h);
        });
        setHotels(hotelMap);
      }
    } catch (err) {
      console.error('Error loading itinerary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!tour) return <div style={{ color: 'var(--t2)' }}>Tour not found</div>;

  const dayIcon: Record<DayType, React.ElementType> = {
    show: Music, travel: Plane, off: Coffee, rehearsal: Mic,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/live/tour/${tourId}`)} className="p-1.5 rounded hover:bg-white/10">
            <ArrowLeft size={18} style={{ color: 'var(--t3)' }} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--t1)' }}>{tour.name} — Itinerary</h1>
            {tour.artist_name && <p className="text-sm" style={{ color: 'var(--t2)' }}>{tour.artist_name}</p>}
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
          <Printer size={14} /> Print
        </button>
      </div>

      <div className="space-y-4 print:space-y-2">
        {days.map(day => {
          const Icon = dayIcon[day.day_type];
          const adv = day.show_id ? advances[day.show_id] : null;
          const trans = day.show_id ? transport[day.show_id] || [] : [];
          const hotel = day.show_id ? hotels[day.show_id] || [] : [];

          return (
            <div key={day.id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-center min-w-[45px]">
                  <div className="text-xs font-medium uppercase" style={{ color: 'var(--t3)' }}>
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--t1)' }}>
                    {formatDate(day.date)}
                  </div>
                </div>
                <Icon size={16} style={{ color: 'var(--brand-1)' }} />
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: 'var(--t1)' }}>
                    {day.day_type === 'show' && day.show ? day.show.title : day.title || day.day_type}
                  </div>
                  {day.day_type === 'show' && day.show && (
                    <div className="text-xs" style={{ color: 'var(--t3)' }}>
                      {day.show.venue_name} — {day.show.venue_city}, {day.show.venue_country}
                    </div>
                  )}
                  {day.day_type !== 'show' && day.city && (
                    <div className="text-xs" style={{ color: 'var(--t3)' }}>
                      {day.city}{day.country ? `, ${day.country}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule (show days with advances) */}
              {adv?.schedule && (
                <div className="grid grid-cols-5 gap-2 text-xs mb-3 p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  {Object.entries(adv.schedule as Record<string, string>).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <div className="font-medium capitalize" style={{ color: 'var(--t2)' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div style={{ color: 'var(--t1)' }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Transport */}
              {trans.length > 0 && (
                <div className="text-xs mb-2" style={{ color: 'var(--t3)' }}>
                  <Plane size={11} className="inline mr-1" />
                  {trans.map(t => `${t.type}: ${t.departure_location} → ${t.arrival_location}`).join(' | ')}
                </div>
              )}

              {/* Hotel */}
              {hotel.length > 0 && (
                <div className="text-xs" style={{ color: 'var(--t3)' }}>
                  <Hotel size={11} className="inline mr-1" />
                  {hotel.map(h => h.hotel_name || h.name).join(', ')}
                </div>
              )}

              {day.notes && (
                <div className="text-xs mt-2 italic" style={{ color: 'var(--t3)' }}>{day.notes}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add itinerary link button to TourDetails page**

In `TourDetails.tsx`, add next to the edit button:
```typescript
<button
  onClick={() => navigate(`/live/tour/${tourId}/itinerary`)}
  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
  style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}
>
  <Calendar size={14} /> View Itinerary
</button>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/live/TourItinerary.tsx src/pages/live/TourDetails.tsx
git commit -m "feat(live): add tour itinerary day-sheet view with schedule, transport, and hotel data"
```

---

## PHASE 3: Venue Database

### Task 11: Enhanced Venue Types + Database Schema

**Files:**
- Create: `src/types/venue.ts`
- Database migration for enhanced venues table

**Context:** Extend the existing `venues` table with contact details, technical documentation links, notes, and category tags. The existing `Venue` interface in `index.ts` has basic fields; we need contacts (multiple), technical rider URL, hospitality rider URL, and notes.

- [ ] **Step 1: Create enhanced venue types**

```typescript
// src/types/venue.ts
export interface VenueContact {
  id: string;
  name: string;
  role: string; // e.g. "Production Manager", "Booking", "Marketing"
  email?: string;
  phone?: string;
}

export interface EnhancedVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  capacity: number;
  website?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  // Enhanced fields
  contacts: VenueContact[];
  technical_rider_url?: string;
  hospitality_rider_url?: string;
  stage_plot_url?: string;
  notes?: string;
  tags?: string[]; // e.g. "club", "theater", "arena", "festival", "outdoor"
  parking_info?: string;
  load_in_info?: string;
  wifi_info?: string;
  // Metadata
  is_verified?: boolean;
  usage_count?: number;
  last_played?: string;
  created_at: string;
  updated_at: string;
}

export interface VenueFormData {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  capacity?: number;
  website?: string;
  phone?: string;
  email?: string;
  contacts?: VenueContact[];
  technical_rider_url?: string;
  hospitality_rider_url?: string;
  stage_plot_url?: string;
  notes?: string;
  tags?: string[];
  parking_info?: string;
  load_in_info?: string;
  wifi_info?: string;
}
```

- [ ] **Step 2: Database migration to enhance venues**

```sql
-- Migration: enhance_venues_table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS technical_rider_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS hospitality_rider_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS stage_plot_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS parking_info TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS load_in_info TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS wifi_info TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS last_played DATE;
```

- [ ] **Step 3: Commit**

```bash
git add src/types/venue.ts
git commit -m "feat(live): add enhanced venue types and database migration"
```

---

### Task 12: Venue Service

**Files:**
- Create: `src/lib/venueService.ts`

- [ ] **Step 1: Create venue CRUD service**

```typescript
// src/lib/venueService.ts
import { supabase } from './supabase';
import type { EnhancedVenue, VenueFormData } from '../types/venue';

export async function getVenues(): Promise<EnhancedVenue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map(v => ({
    ...v,
    contacts: v.contacts || [],
    tags: v.tags || [],
  }));
}

export async function getVenue(id: string): Promise<EnhancedVenue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? { ...data, contacts: data.contacts || [], tags: data.tags || [] } : null;
}

export async function createVenue(formData: VenueFormData): Promise<EnhancedVenue> {
  const { data, error } = await supabase
    .from('venues')
    .insert(formData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVenue(id: string, formData: Partial<VenueFormData>): Promise<EnhancedVenue> {
  const { data, error } = await supabase
    .from('venues')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVenue(id: string): Promise<void> {
  const { error } = await supabase.from('venues').delete().eq('id', id);
  if (error) throw error;
}

export async function searchVenues(query: string): Promise<EnhancedVenue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/venueService.ts
git commit -m "feat(live): add venue service with CRUD and search"
```

---

### Task 13: Venues List Page + Venue Detail Page + Venue Modal

**Files:**
- Modify: `src/pages/live/Venues.tsx` (replace placeholder)
- Modify: `src/pages/live/VenueDetails.tsx` (replace placeholder)
- Create: `src/components/live/VenueCard.tsx`
- Create: `src/components/live/VenueModal.tsx`

These follow the same patterns as Tours (Task 5). The Venues page shows a searchable list of VenueCards. VenueDetails shows full venue info with contacts, docs, and a history of shows played there. VenueModal handles create/edit with fields for name, address, city, country, capacity, contacts (dynamic list), technical/hospitality rider URLs, notes, and tags.

- [ ] **Step 1: Create VenueCard, VenueModal, Venues list, and VenueDetails**

*(Follow the same component patterns established in Tasks 5-6. VenueCard shows name, city, capacity, tags. VenueModal has form fields for all VenueFormData properties with a dynamic contacts list. Venues page has search + tag filter. VenueDetails shows full venue info + list of shows at this venue via `supabase.from('shows').select('*').eq('venue_id', venueId)`.)*

- [ ] **Step 2: Commit**

```bash
git add src/pages/live/Venues.tsx src/pages/live/VenueDetails.tsx src/components/live/VenueCard.tsx src/components/live/VenueModal.tsx
git commit -m "feat(live): add Venues list, detail page, card, and modal components"
```

---

## PHASE 4: Tour Calendar + Map Visualization

### Task 14: Install Map Library

**Files:**
- Modify: `package.json` (add dependency)

- [ ] **Step 1: Install Leaflet (lighter weight than Mapbox, no API key needed)**

```bash
npm install leaflet react-leaflet @types/leaflet
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add leaflet and react-leaflet for tour map visualization"
```

---

### Task 15: Tour Map Component

**Files:**
- Create: `src/components/live/TourMap.tsx`

**Context:** Shows tour route on a map. Each show day gets a marker at its venue coordinates. Markers are connected by lines in chronological order to show the tour route. Clicking a marker shows a popup with show details.

- [ ] **Step 1: Create TourMap component**

```typescript
// src/components/live/TourMap.tsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TourDay } from '../../types/tour';
import { formatDate } from '../../lib/utils';

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface TourMapProps {
  days: TourDay[];
  showCoordinates: Record<string, { lat: number; lng: number; venue: string; city: string }>;
}

export default function TourMap({ days, showCoordinates }: TourMapProps) {
  // Filter days that have coordinates
  const mappableDays = days
    .filter(d => d.show_id && showCoordinates[d.show_id])
    .map(d => ({
      ...d,
      coords: showCoordinates[d.show_id!],
    }));

  if (mappableDays.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-2)' }}>
        <p className="text-sm" style={{ color: 'var(--t3)' }}>No show locations with coordinates to display on map.</p>
      </div>
    );
  }

  // Calculate bounds
  const positions: [number, number][] = mappableDays.map(d => [d.coords.lat, d.coords.lng]);
  const bounds = L.latLngBounds(positions);

  // Route line
  const routeLine: [number, number][] = mappableDays.map(d => [d.coords.lat, d.coords.lng]);

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-2)' }}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [50, 50] }}
        style={{ height: '400px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Route line */}
        <Polyline positions={routeLine} pathOptions={{ color: '#6366f1', weight: 2, dashArray: '8 4' }} />

        {/* Markers */}
        {mappableDays.map((day, idx) => (
          <Marker key={day.id} position={[day.coords.lat, day.coords.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>{day.show?.title}</strong><br />
                {day.coords.venue}<br />
                {day.coords.city}<br />
                {formatDate(day.date)}
                {idx < mappableDays.length - 1 && <span className="text-xs text-gray-400"> — Stop {idx + 1}</span>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/live/TourMap.tsx
git commit -m "feat(live): add TourMap component with route visualization"
```

---

### Task 16: Tour Calendar Page

**Files:**
- Modify: `src/pages/live/TourCalendar.tsx` (replace placeholder)

**Context:** The calendar page shows a monthly calendar view with all tour days color-coded by type, plus the tour route map below it. Users can filter by tour.

- [ ] **Step 1: Build the tour calendar page**

The calendar renders a grid of days for the selected month. Each cell shows tour day entries color-coded by day type. Below the calendar grid, render the TourMap component with show coordinates.

*(Implementation follows standard monthly calendar grid pattern. Load all tour_days for the selected month range. Render cells with colored dots/badges for each day type. Include tour filter dropdown and month navigation. Include TourMap component at bottom of page, passing the filtered tour's show days with coordinates loaded from the shows table.)*

- [ ] **Step 2: Commit**

```bash
git add src/pages/live/TourCalendar.tsx
git commit -m "feat(live): add tour calendar page with monthly grid and route map"
```

---

## PHASE 5: Vintage Ticket Generator

### Task 17: Install Image Generation Library

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install html-to-image for PNG generation**

```bash
npm install html-to-image
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add html-to-image for vintage ticket PNG generation"
```

---

### Task 18: Vintage Ticket Component

**Files:**
- Create: `src/components/live/VintageTicket.tsx`

**Context:** This is the signature feature. A React component that renders a show as a 1960s-style concert ticket. Warm, aged paper colors, serif fonts, ornamental borders, perforated edge styling. Data: artist name, show date & time, venue name, city, country, tour name (if applicable). The component has two modes: display (in-app preview) and export (clean render for PNG generation).

- [ ] **Step 1: Create the VintageTicket component**

```typescript
// src/components/live/VintageTicket.tsx
import React, { forwardRef } from 'react';

export interface VintageTicketData {
  artistName: string;
  date: string;
  time?: string;
  venueName: string;
  city: string;
  country: string;
  tourName?: string;
}

interface VintageTicketProps {
  data: VintageTicketData;
  scale?: number; // 1 = full size for export, 0.5 = preview
}

const VintageTicket = forwardRef<HTMLDivElement, VintageTicketProps>(
  ({ data, scale = 1 }, ref) => {
    const formattedDate = new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: '600px',
          height: '250px',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Main ticket body */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #f5e6c8 0%, #e8d5a3 30%, #f0ddb5 70%, #e5cfa0 100%)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '8px 0 0 8px',
            border: '2px solid #c4a265',
            borderRight: 'none',
            position: 'relative',
          }}
        >
          {/* Decorative border inset */}
          <div style={{
            position: 'absolute',
            inset: '6px',
            border: '1px solid #c4a265',
            borderRadius: '4px',
            borderRight: 'none',
            pointerEvents: 'none',
          }} />

          {/* Top section */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {data.tourName && (
              <div style={{
                fontSize: '10px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#8b6914',
                marginBottom: '4px',
                fontWeight: 600,
              }}>
                {data.tourName}
              </div>
            )}
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#2c1810',
              lineHeight: 1.1,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              {data.artistName}
            </div>
          </div>

          {/* Middle — venue */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '14px', color: '#5a3e1b', fontWeight: 600 }}>
              {data.venueName}
            </div>
            <div style={{ fontSize: '12px', color: '#7a5c2e' }}>
              {data.city}, {data.country}
            </div>
          </div>

          {/* Bottom — date & time */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#2c1810', fontWeight: 600 }}>
                {formattedDate}
              </div>
              {data.time && (
                <div style={{ fontSize: '11px', color: '#7a5c2e' }}>
                  Doors: {data.time}
                </div>
              )}
            </div>
            <div style={{
              fontSize: '8px',
              color: '#a08050',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              ADMIT ONE
            </div>
          </div>

          {/* Subtle texture overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23c4a265\' fill-opacity=\'0.08\'/%3E%3C/svg%3E")',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Perforated edge */}
        <div style={{
          width: '2px',
          background: 'repeating-linear-gradient(to bottom, #c4a265 0px, #c4a265 4px, transparent 4px, transparent 8px)',
          flexShrink: 0,
        }} />

        {/* Stub (right side) */}
        <div
          style={{
            width: '100px',
            background: 'linear-gradient(135deg, #f0ddb5 0%, #e5cfa0 100%)',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: '0 8px 8px 0',
            border: '2px solid #c4a265',
            borderLeft: 'none',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute',
            inset: '6px',
            border: '1px solid #c4a265',
            borderRadius: '4px',
            borderLeft: 'none',
            pointerEvents: 'none',
          }} />

          <div style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#2c1810',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 1,
          }}>
            {data.artistName.length > 15 ? data.artistName.substring(0, 15) + '...' : data.artistName}
          </div>

          <div style={{
            fontSize: '9px',
            color: '#7a5c2e',
            marginTop: '8px',
            position: 'relative',
            zIndex: 1,
          }}>
            {new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    );
  }
);

VintageTicket.displayName = 'VintageTicket';
export default VintageTicket;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/live/VintageTicket.tsx
git commit -m "feat(live): add VintageTicket component with 1960s-style design"
```

---

### Task 19: Ticket Generator Service

**Files:**
- Create: `src/lib/ticketGenerator.ts`

**Context:** Uses html-to-image to render the VintageTicket component to a PNG blob/data URL for download and sharing.

- [ ] **Step 1: Create ticket generator utility**

```typescript
// src/lib/ticketGenerator.ts
import { toPng, toBlob } from 'html-to-image';

export async function generateTicketPng(element: HTMLElement): Promise<string> {
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2, // High-res for social media
    backgroundColor: 'transparent',
  });
  return dataUrl;
}

export async function generateTicketBlob(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: 'transparent',
  });
  if (!blob) throw new Error('Failed to generate ticket image');
  return blob;
}

export function downloadTicketImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ticketGenerator.ts
git commit -m "feat(live): add ticket PNG generator utility using html-to-image"
```

---

## PHASE 6: Social Sharing Integration

### Task 20: Ticket Share Modal

**Files:**
- Create: `src/components/live/TicketShareModal.tsx`

**Context:** Modal that shows a preview of the vintage ticket, with buttons to: download PNG, share via Web Share API (which triggers the native share sheet on mobile for Instagram Stories, Twitter, WhatsApp, etc.), and copy to clipboard.

- [ ] **Step 1: Create TicketShareModal**

```typescript
// src/components/live/TicketShareModal.tsx
import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import VintageTicket, { type VintageTicketData } from './VintageTicket';
import { generateTicketPng, generateTicketBlob, downloadTicketImage, sanitizeFilename } from '../../lib/ticketGenerator';

interface TicketShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: VintageTicketData;
}

export default function TicketShareModal({ isOpen, onClose, ticketData }: TicketShareModalProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await generateTicketPng(ticketRef.current);
      const filename = `ticket-${sanitizeFilename(ticketData.artistName)}-${ticketData.date}.png`;
      downloadTicketImage(dataUrl, filename);
    } catch (err) {
      console.error('Error generating ticket:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!ticketRef.current) return;
    setGenerating(true);
    try {
      const blob = await generateTicketBlob(ticketRef.current);
      const file = new File([blob], `ticket-${sanitizeFilename(ticketData.artistName)}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${ticketData.artistName} — ${ticketData.venueName}`,
          text: `${ticketData.artistName} live at ${ticketData.venueName}, ${ticketData.city}`,
          files: [file],
        });
      } else {
        // Fallback: download
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Error sharing:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!ticketRef.current) return;
    setGenerating(true);
    try {
      const blob = await generateTicketBlob(ticketRef.current);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-xl p-6" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-2)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>Share Ticket</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={18} style={{ color: 'var(--t3)' }} />
          </button>
        </div>

        {/* Ticket preview */}
        <div className="flex justify-center mb-6 overflow-auto">
          <VintageTicket ref={ticketRef} data={ticketData} scale={1} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-brand-1 text-white disabled:opacity-50"
          >
            <Download size={16} />
            {generating ? 'Generating...' : 'Download PNG'}
          </button>

          {canShare && (
            <button
              onClick={handleShare}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
            >
              <Share2 size={16} />
              Share
            </button>
          )}

          <button
            onClick={handleCopyToClipboard}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)', border: '1px solid var(--border-2)' }}
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/live/TicketShareModal.tsx
git commit -m "feat(live): add TicketShareModal with download, Web Share API, and clipboard support"
```

---

### Task 21: Wire Ticket Generation into Show Views

**Files:**
- Modify: `src/pages/live/ShowDetails.tsx` (add "Generate Ticket" button)
- Modify: `src/components/live/TourDayRow.tsx` (ticket icon already wired, need to pass handler from TourDetails)
- Modify: `src/pages/live/TourDetails.tsx` (add ticket modal state and pass handler)

**Context:** Add a "Generate Ticket" button to the ShowDetails page header. When clicked, it opens the TicketShareModal with show data. Also wire the ticket icon on TourDayRow (already added in Task 6) to open the same modal from the Tour Details page.

- [ ] **Step 1: Add ticket generation to ShowDetails**

In `ShowDetails.tsx`, add state and import:
```typescript
import TicketShareModal from '../../components/live/TicketShareModal';
import type { VintageTicketData } from '../../components/live/VintageTicket';

const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
```

Add button in the header actions area:
```typescript
<button
  onClick={() => setIsTicketModalOpen(true)}
  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
  style={{ backgroundColor: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border-2)' }}
>
  <Ticket size={14} /> Generate Ticket
</button>
```

Add modal at the bottom:
```typescript
<TicketShareModal
  isOpen={isTicketModalOpen}
  onClose={() => setIsTicketModalOpen(false)}
  ticketData={{
    artistName: show.artist_name || show.title,
    date: show.date,
    time: show.time,
    venueName: show.venue,
    city: show.city,
    country: show.country,
    tourName: show.tour_name,
  }}
/>
```

- [ ] **Step 2: Wire ticket modal in TourDetails**

In `TourDetails.tsx`, add state and handler:
```typescript
import TicketShareModal from '../../components/live/TicketShareModal';
import type { VintageTicketData } from '../../components/live/VintageTicket';

const [ticketDay, setTicketDay] = useState<TourDay | null>(null);
```

Pass `onTicket` to TourDayRow:
```typescript
<TourDayRow
  key={day.id}
  day={day}
  onEdit={...}
  onDelete={...}
  onTicket={(d) => setTicketDay(d)}
/>
```

Add modal:
```typescript
{ticketDay && ticketDay.show && (
  <TicketShareModal
    isOpen={!!ticketDay}
    onClose={() => setTicketDay(null)}
    ticketData={{
      artistName: tour?.artist_name || '',
      date: ticketDay.date,
      time: ticketDay.show.show_time,
      venueName: ticketDay.show.venue_name,
      city: ticketDay.show.venue_city,
      country: ticketDay.show.venue_country,
      tourName: tour?.name,
    }}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/live/ShowDetails.tsx src/pages/live/TourDetails.tsx
git commit -m "feat(live): wire vintage ticket generation into show and tour detail views"
```

---

## Summary of Deliverables

| Feature | Status |
|---------|--------|
| Tours CRUD (create, edit, delete) | Phase 1 |
| Tab restructure (Tours/Shows/Venues/Calendar) | Phase 1 |
| Tour days with day types (show/travel/off/rehearsal) | Phase 2 |
| Tour itinerary/day sheet (printable) | Phase 2 |
| Shows linked to tours (optional) | Phase 2 |
| Tour filter on Shows list | Phase 2 |
| Venue database with contacts, docs, notes | Phase 3 |
| Tour calendar (monthly grid, color-coded) | Phase 4 |
| Tour route map (Leaflet) | Phase 4 |
| Vintage ticket generator (1960s style) | Phase 5 |
| Social sharing (Web Share API + download + clipboard) | Phase 6 |

## Deferred to Future Phases

- **Financial settlement & deal tracking** per show/tour
- **Advancing templates** (Master Tour style reusable checklists)
- **Promoter/venue portal** (ABOSS style external sharing)
- **Offline sync** for on-the-road access
- **Per diem tracking** for crew
- **Guest list QR codes** for door management
- **Multiple ticket design themes** (70s psychedelic, 80s neon, modern minimal)
