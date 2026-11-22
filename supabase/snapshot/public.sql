-- ===== sequences =====

create sequence public._health_id_seq as integer;
create sequence public.email_drafts_id_seq as integer;

-- ===== tables =====

create table public._deprecated_performance_rights_organizations (
  id uuid default gen_random_uuid() not null,
  name text not null,
  country text,
  ipi_number text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid
);

create table public._deprecated_personnel (
  id uuid default gen_random_uuid() not null,
  name text not null,
  role text not null,
  email text default ''::text,
  phone text default ''::text,
  company text default ''::text,
  rate numeric(10,2) default 0,
  rate_type text default 'Fixed'::text,
  notes text default ''::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public._deprecated_personnel_profiles (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  type text,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  date_of_birth date,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  bio text,
  website text,
  social_links jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public._deprecated_personnel_pros (
  id uuid default gen_random_uuid() not null,
  personnel_id uuid,
  pro_id uuid,
  ipi_number text not null,
  is_primary boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public._deprecated_personnel_publishers (
  id uuid default gen_random_uuid() not null,
  personnel_id uuid,
  publisher_id uuid,
  ipi_number text not null,
  is_primary boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public._deprecated_publishers (
  id uuid default gen_random_uuid() not null,
  name text not null,
  ipi_number text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid
);

create table public._health (
  id integer default nextval('_health_id_seq'::regclass) not null,
  count integer default 1
);

create table public.accommodations (
  id uuid default gen_random_uuid() not null,
  show_id uuid not null,
  hotel_name text not null,
  address text not null,
  check_in_date date not null,
  check_out_date date not null,
  rooms integer default 1,
  cost numeric(10,2) default 0,
  confirmation_number text default ''::text,
  notes text default ''::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.album_tracks (
  id uuid default gen_random_uuid() not null,
  album_id uuid not null,
  track_id uuid not null,
  track_number integer not null,
  disc_number integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.albums (
  id uuid default gen_random_uuid() not null,
  title text not null,
  artist text not null,
  release_date date,
  format text,
  label text,
  distributor text,
  status text default 'draft'::text,
  genres text[],
  upc text,
  artwork_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid,
  spotify_id text,
  spotify_url text default ''::text,
  total_tracks integer default 0,
  genres_array text[] default ARRAY[]::text[],
  artist_id uuid,
  notes text,
  hold_until date,
  demo_status text,
  artist_contacts jsonb default '[]'::jsonb,
  artist_projects jsonb default '[]'::jsonb not null
);

create table public.analytics_integrations (
  id uuid default gen_random_uuid() not null,
  artist_id uuid not null,
  platform text not null,
  enabled boolean default true,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  platform_user_id text,
  platform_username text,
  channel_id text,
  last_sync timestamp with time zone,
  sync_enabled boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.artists (
  id uuid default gen_random_uuid() not null,
  name text not null,
  bio text default ''::text,
  genre text default ''::text,
  image_url text default ''::text,
  spotify_url text default ''::text,
  apple_music_url text default ''::text,
  instagram_url text default ''::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  spotify_id text,
  spotify_followers integer default 0,
  spotify_popularity integer default 0,
  bandsintown_url text,
  songkick_url text,
  youtube_url text,
  tiktok_url text,
  twitter_url text,
  website_url text,
  country text,
  city text,
  label text,
  management_company text,
  booking_agency text,
  booking_agent text,
  publicist text,
  workspace_id uuid not null
);

create table public.budget_items (
  id uuid default gen_random_uuid() not null,
  budget_id uuid,
  date date not null,
  description text not null,
  type text,
  amount numeric not null,
  category text,
  status text,
  notes text,
  attachments text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid
);

create table public.budgets (
  id uuid default gen_random_uuid() not null,
  type text,
  title text not null,
  artist text not null,
  status text default 'planning'::text,
  release_type text,
  release_date date,
  show_date date,
  venue text,
  city text,
  start_date date,
  end_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid,
  booking_agent_commission_rate numeric default 10.0,
  management_commission_rate numeric default 20.0,
  apply_commissions boolean default false,
  artist_id uuid
);

create table public.calendar_connections (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  provider text not null,
  provider_account_id text,
  account_name text not null,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  ical_url text,
  sync_enabled boolean default true not null,
  two_way_sync boolean default false not null,
  notifications_enabled boolean default true not null,
  last_synced_at timestamp with time zone,
  sync_error text,
  color text default '#4285F4'::text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.calendar_events (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  title text not null,
  description text,
  event_type text default 'show'::text not null,
  start_date date not null,
  start_time time without time zone,
  end_date date,
  end_time time without time zone,
  location text,
  color text default '#3B82F6'::text,
  tags text[] default ARRAY[]::text[],
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.contact_affiliations (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  contact_id uuid not null,
  organization_id uuid not null,
  role text not null,
  role_custom text,
  title text,
  start_date date,
  end_date date,
  is_primary boolean default false not null,
  notes text,
  created_at timestamp with time zone default now() not null
);

create table public.contact_files (
  id uuid default gen_random_uuid() not null,
  contact_id uuid not null,
  user_id uuid not null,
  file_name text not null,
  file_type text default ''::text not null,
  file_path text not null,
  file_size integer,
  description text,
  uploaded_at timestamp with time zone default now() not null
);

create table public.contact_payment_info (
  id uuid default gen_random_uuid() not null,
  contact_id uuid not null,
  user_id uuid not null,
  bank_name text,
  account_holder_name text,
  routing_number text,
  account_number text,
  account_type text,
  swift_code text,
  iban text,
  bank_address text,
  paypal_email text,
  venmo_handle text,
  zelle_contact text,
  tax_id text,
  w9_on_file boolean default false not null,
  w9_file_url text,
  updated_at timestamp with time zone default now() not null
);

create table public.contacts (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  category text not null,
  role text,
  first_name text default ''::text not null,
  last_name text default ''::text not null,
  profile_photo_url text,
  email text,
  phone text,
  website text,
  home_airport text,
  seating_preference text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  social_links jsonb default '{}'::jsonb not null,
  pro_affiliations jsonb default '[]'::jsonb not null,
  publisher_affiliations jsonb default '[]'::jsonb not null,
  bio text,
  notes text,
  tags text[] default '{}'::text[] not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  date_of_birth date,
  workspace_id uuid not null,
  visibility text default 'workspace'::text not null
);

create table public.contract_analyses (
  id uuid default gen_random_uuid() not null,
  document_id uuid,
  title text not null,
  summary text not null,
  key_terms jsonb not null,
  risks jsonb not null,
  recommendations jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid
);

create table public.credits (
  id uuid default gen_random_uuid() not null,
  entity_id uuid not null,
  entity_type text,
  name text not null,
  role text,
  master_percentage numeric,
  publishing_percentage numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid,
  contact_id uuid
);

create table public.digital_assets (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  name text not null,
  category text default 'other'::text not null,
  source_type text default 'upload'::text not null,
  file_url text,
  file_size bigint,
  mime_type text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.email_drafts (
  id integer default nextval('email_drafts_id_seq'::regclass) not null,
  created_at timestamp with time zone default now(),
  from_email text default 'ggitlin@h-h.com.mx'::text not null,
  to_email text not null,
  to_name text not null,
  subject text not null,
  body_html text not null,
  status text default 'pending'::text not null,
  run_date date default CURRENT_DATE not null
);

create table public.finances (
  id uuid default gen_random_uuid() not null,
  artist_id uuid,
  show_id uuid,
  type text not null,
  category text not null,
  description text not null,
  amount numeric(10,2) not null,
  date date not null,
  status text default 'Pending'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.guest_list (
  id uuid default gen_random_uuid() not null,
  show_id uuid not null,
  name text not null,
  type text not null,
  quantity integer default 1,
  requested_by text default ''::text,
  status text default 'pending'::text,
  contact_info text default ''::text,
  notes text default ''::text,
  tickets_sent boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.legal_document_notes (
  id uuid default gen_random_uuid() not null,
  document_id uuid not null,
  content text not null,
  author_id uuid not null,
  created_at timestamp with time zone default now()
);

create table public.legal_documents (
  id uuid default gen_random_uuid() not null,
  title text not null,
  type text,
  status text,
  parties text[] not null,
  effective_date timestamp with time zone not null,
  expiration_date timestamp with time zone,
  description text,
  file_name text not null,
  last_modified timestamp with time zone default now(),
  tags text[],
  version text,
  signed_by text[],
  pending_signatures text[],
  ai_analysis jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid,
  file_size bigint default 0,
  created_by uuid,
  artist_id uuid,
  file_url text,
  source_type text default 'upload'::text not null
);

create table public.marketing_campaigns (
  id uuid default gen_random_uuid() not null,
  artist_id uuid,
  album_id uuid,
  title text not null,
  type text not null,
  platform text default ''::text,
  start_date date not null,
  end_date date,
  budget numeric(10,2) default 0,
  status text default 'Planning'::text,
  notes text default ''::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.marketing_files (
  id uuid default gen_random_uuid() not null,
  artist_id uuid,
  name text not null,
  type text default ''::text not null,
  size bigint default 0 not null,
  category text default 'other'::text not null,
  description text default ''::text,
  file_url text default ''::text,
  shared boolean default false,
  shared_with jsonb default '[]'::jsonb,
  uploaded_by uuid,
  created_at timestamp with time zone default now(),
  source_type text default 'upload'::text not null
);

create table public.marketing_posts (
  id uuid default gen_random_uuid() not null,
  artist_id uuid,
  title text not null,
  content text default ''::text not null,
  platform text not null,
  scheduled_date date not null,
  scheduled_time time without time zone default '12:00:00'::time without time zone not null,
  status text default 'draft'::text not null,
  media_url text default ''::text,
  tags jsonb default '[]'::jsonb,
  author_id uuid,
  done boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.marketing_tasks (
  id uuid default gen_random_uuid() not null,
  show_id uuid not null,
  task_key text not null,
  label text not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  completed_by text default ''::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.notes (
  id uuid default gen_random_uuid() not null,
  content text not null,
  category text,
  color text,
  minimized boolean default false,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid,
  grid_x integer default 0,
  grid_y integer default 0,
  grid_width integer default 1,
  grid_height integer default 1,
  title text default ''::text,
  artist_id uuid,
  show_id uuid
);

create table public.onboarding (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  completed boolean default false,
  current_step integer default 1,
  steps_completed jsonb default '[]'::jsonb,
  artist_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.organizations (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  created_by uuid not null,
  name text not null,
  type text not null,
  parent_org_id uuid,
  website text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  logo_url text,
  bio text,
  notes text,
  tags text[] default '{}'::text[] not null,
  social_links jsonb default '{}'::jsonb not null,
  visibility text default 'workspace'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.platform_accounts (
  id uuid default gen_random_uuid() not null,
  platform text not null,
  account_name text not null,
  account_id text not null,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_connected boolean default false,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid
);

create table public.platform_integrations (
  id uuid default gen_random_uuid() not null,
  artist_id uuid not null,
  platform text not null,
  enabled boolean default true,
  api_key text,
  artist_name text,
  platform_artist_id text,
  last_sync timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.platform_metrics (
  id uuid default gen_random_uuid() not null,
  platform_account_id uuid,
  date date not null,
  metric_type text not null,
  value numeric not null,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  user_id uuid
);

create table public.playlist_tracks (
  id uuid default gen_random_uuid() not null,
  playlist_id uuid not null,
  track_id uuid not null,
  "position" integer default 0 not null,
  added_at timestamp with time zone default now(),
  added_by uuid
);

create table public.playlists (
  id uuid default gen_random_uuid() not null,
  title text not null,
  description text,
  user_id uuid not null,
  is_public boolean default false,
  password_hash text,
  share_token uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  cover_url text,
  creator_contacts jsonb default '[]'::jsonb,
  creator_projects jsonb default '[]'::jsonb not null
);

create table public.production_files (
  id uuid default gen_random_uuid() not null,
  show_id uuid not null,
  name text not null,
  type text not null,
  file_url text default ''::text,
  version text default '1.0'::text,
  uploaded_at timestamp with time zone default now(),
  uploaded_by text default ''::text,
  notes text default ''::text,
  created_at timestamp with time zone default now(),
  source_type text default 'upload'::text not null
);

create table public.profiles (
  id uuid not null,
  full_name text,
  avatar_url text,
  role text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.project_members (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  project_id uuid not null,
  user_id uuid not null,
  access text default 'edit'::text not null,
  created_at timestamp with time zone default now() not null
);

create table public.project_relations (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid not null,
  project_id uuid not null,
  contact_id uuid,
  organization_id uuid,
  role text not null,
  role_custom text,
  is_primary boolean default false not null,
  notes text,
  created_at timestamp with time zone default now() not null
);

create table public.projects (
  id uuid default gen_random_uuid() not null,
  title text not null,
  description text,
  status text default 'planning'::text,
  due_date timestamp with time zone,
  owner_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.setlist_songs (
  id uuid default gen_random_uuid() not null,
  setlist_id uuid not null,
  "position" integer not null,
  song_title text not null,
  duration text default ''::text,
  key text default ''::text,
  is_encore boolean default false,
  notes text default ''::text,
  created_at timestamp with time zone default now()
);

create table public.setlists (
  id uuid default gen_random_uuid() not null,
  show_id uuid not null,
  status text default 'draft'::text,
  notes text default ''::text,
  last_updated timestamp with time zone default now(),
  updated_by text default ''::text,
  created_at timestamp with time zone default now()
);

create table public.show_advances (
  id uuid default gen_random_uuid() not null,
  show_id uuid,
  production_manager jsonb,
  venue_contact jsonb,
  schedule jsonb,
  catering jsonb,
  parking jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid
);

create table public.show_deals (
  id uuid default gen_random_uuid() not null,
  show_id uuid,
  deal_type text,
  guarantee numeric,
  percentage numeric,
  expenses jsonb,
  settlement jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid
);

create table public.show_personnel (
  id uuid default gen_random_uuid() not null,
  show_id uuid not null,
  personnel_id uuid not null,
  fee numeric(10,2) default 0,
  status text default 'Pending'::text,
  created_at timestamp with time zone default now()
);

create table public.show_types (
  id uuid default gen_random_uuid() not null,
  name text not null,
  description text default ''::text,
  created_at timestamp with time zone default now()
);

create table public.shows (
  id uuid default gen_random_uuid() not null,
  title text,
  date date,
  show_time time without time zone,
  venue_name text,
  venue_city text,
  venue_country text,
  status text default 'pending'::text,
  capacity integer,
  tickets_sold integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid,
  venue_address text default ''::text,
  venue_state text default ''::text,
  venue_latitude numeric(10,7),
  venue_longitude numeric(10,7),
  google_place_id text default ''::text,
  venue_id uuid,
  artist_id uuid,
  show_type text default 'Concert'::text,
  tour_id uuid
);

create table public.signing_audit_logs (
  id uuid default gen_random_uuid() not null,
  signing_request_id uuid not null,
  recipient_id uuid,
  event text not null,
  ip_address text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null
);

create table public.signing_field_responses (
  id uuid default gen_random_uuid() not null,
  field_id uuid not null,
  recipient_id uuid not null,
  value text,
  signature_data text,
  completed_at timestamp with time zone default now() not null
);

create table public.signing_fields (
  id uuid default gen_random_uuid() not null,
  signing_request_id uuid not null,
  recipient_id uuid not null,
  type text not null,
  page integer not null,
  x numeric not null,
  y numeric not null,
  width numeric not null,
  height numeric not null,
  required boolean default true not null,
  label text
);

create table public.signing_recipients (
  id uuid default gen_random_uuid() not null,
  signing_request_id uuid not null,
  name text not null,
  email text not null,
  role text,
  order_index integer default 0 not null,
  status text default 'pending'::text not null,
  access_token uuid default gen_random_uuid() not null,
  otp_code text,
  otp_expires_at timestamp with time zone,
  otp_verified boolean default false not null,
  otp_attempts integer default 0 not null,
  signed_at timestamp with time zone,
  ip_address text,
  user_agent text,
  user_id uuid
);

create table public.signing_requests (
  id uuid default gen_random_uuid() not null,
  document_id uuid not null,
  status text default 'draft'::text not null,
  signing_order text default 'parallel'::text not null,
  current_order_step integer default 0,
  subject text not null,
  message text,
  expires_at timestamp with time zone,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone,
  signed_pdf_path text
);

create table public.songwriter_pros (
  songwriter_id uuid not null,
  pro_id uuid not null,
  created_at timestamp with time zone default now()
);

create table public.songwriter_publishers (
  songwriter_id uuid not null,
  publisher_id uuid not null,
  created_at timestamp with time zone default now()
);

create table public.subscription_plans (
  id uuid default gen_random_uuid() not null,
  type text not null,
  name text not null,
  description text,
  price numeric not null,
  features text[],
  modules jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.synced_events (
  id uuid default gen_random_uuid() not null,
  calendar_connection_id uuid not null,
  provider_event_id text not null,
  title text not null,
  description text,
  start_date date not null,
  start_time time without time zone,
  end_date date,
  end_time time without time zone,
  location text,
  attendees jsonb default '[]'::jsonb,
  timezone text default 'UTC'::text,
  is_all_day boolean default false not null,
  recurring_rule text,
  raw_data jsonb default '{}'::jsonb,
  last_modified_at timestamp with time zone,
  synced_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.task_comments (
  id uuid default gen_random_uuid() not null,
  task_id uuid not null,
  author_id uuid not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create table public.tasks (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  artist_id uuid,
  show_id uuid,
  title text not null,
  description text default ''::text,
  due_date date,
  priority text default 'Medium'::text,
  status text default 'Todo'::text,
  assigned_to uuid,
  created_by uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  completed boolean default false,
  completed_at timestamp with time zone,
  notes text
);

create table public.team_invitations (
  id uuid default gen_random_uuid() not null,
  email text not null,
  role text default 'team_member'::text not null,
  invited_by uuid,
  status text default 'pending'::text not null,
  expires_at timestamp with time zone default (now() + '7 days'::interval),
  created_at timestamp with time zone default now()
);

create table public.team_members (
  team_id uuid not null,
  user_id uuid not null,
  role text,
  created_at timestamp with time zone default now(),
  seat_role text default 'owner'::text not null,
  joined_at timestamp with time zone default now() not null
);

create table public.teams (
  id uuid default gen_random_uuid() not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  owner_id uuid
);

create table public.tour_days (
  id uuid default gen_random_uuid() not null,
  tour_id uuid not null,
  date date not null,
  day_type text not null,
  show_id uuid,
  title text,
  notes text,
  city text,
  country text,
  created_at timestamp with time zone default now()
);

create table public.tours (
  id uuid default gen_random_uuid() not null,
  artist_id uuid,
  name text not null,
  description text,
  status text default 'planning'::text not null,
  start_date date,
  end_date date,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid
);

create table public.tracks (
  id uuid default gen_random_uuid() not null,
  album_id uuid,
  disc_number integer default 1,
  track_number integer not null,
  title text not null,
  duration text,
  isrc text,
  isrc_atmos text,
  isrc_video text,
  upc text,
  upc_atmos text,
  spotify_uri text,
  apple_id text,
  official_video_url text,
  lyric_video_url text,
  visualizer_url text,
  lyrics text,
  lyrics_url text,
  audio_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid,
  spotify_id text,
  spotify_url text default ''::text,
  preview_url text default ''::text,
  popularity integer default 0,
  explicit boolean default false,
  notes text,
  audio_versions jsonb default '[]'::jsonb,
  demo_status text,
  hold_until date
);

create table public.transportation (
  id uuid default gen_random_uuid() not null,
  show_id uuid not null,
  type text not null,
  departure_location text not null,
  arrival_location text not null,
  departure_time timestamp with time zone not null,
  arrival_time timestamp with time zone not null,
  cost numeric(10,2) default 0,
  confirmation_number text default ''::text,
  notes text default ''::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.user_permissions (
  user_id uuid not null,
  module text not null,
  access_level text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.user_subscriptions (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  plan_id uuid,
  status text not null,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.users (
  id uuid not null,
  email text not null,
  full_name text default ''::text,
  role text default 'viewer'::text,
  avatar_url text default ''::text,
  permissions jsonb default '["view_catalog", "view_finance", "view_legal", "view_live", "view_marketing", "view_personnel", "view_sensitive_info", "edit_catalog", "edit_finance", "edit_legal", "edit_live", "edit_marketing", "edit_personnel"]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.venues (
  id uuid default gen_random_uuid() not null,
  name text not null,
  address text default ''::text,
  city text not null,
  state text default ''::text,
  country text not null,
  postal_code text default ''::text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  google_place_id text,
  capacity integer default 0,
  website text default ''::text,
  phone text default ''::text,
  is_verified boolean default false,
  usage_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  email text,
  contacts jsonb default '[]'::jsonb,
  technical_rider_url text,
  hospitality_rider_url text,
  stage_plot_url text,
  notes text,
  tags text[] default '{}'::text[],
  parking_info text,
  load_in_info text,
  wifi_info text,
  last_played date
);

create table public.youtube_channel_analytics (
  id uuid default gen_random_uuid() not null,
  integration_id uuid not null,
  date date not null,
  subscribers bigint default 0,
  views bigint default 0,
  videos integer default 0,
  average_view_duration interval,
  watch_time_minutes bigint default 0,
  likes bigint default 0,
  comments bigint default 0,
  shares bigint default 0,
  estimated_revenue numeric(10,2) default 0,
  created_at timestamp with time zone default now()
);

create table public.youtube_video_analytics (
  id uuid default gen_random_uuid() not null,
  integration_id uuid not null,
  video_id text not null,
  title text not null,
  published_at timestamp with time zone,
  views bigint default 0,
  likes bigint default 0,
  comments bigint default 0,
  shares bigint default 0,
  watch_time_minutes bigint default 0,
  average_view_duration interval,
  thumbnail_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ===== primary keys, unique, check =====

alter table public._deprecated_performance_rights_organizations add constraint performance_rights_organizations_ipi_number_key UNIQUE (ipi_number);
alter table public._deprecated_performance_rights_organizations add constraint performance_rights_organizations_pkey PRIMARY KEY (id);
alter table public._deprecated_personnel add constraint personnel_pkey PRIMARY KEY (id);
alter table public._deprecated_personnel_profiles add constraint personnel_profiles_pkey PRIMARY KEY (id);
alter table public._deprecated_personnel_profiles add constraint personnel_profiles_type_check CHECK ((type = ANY (ARRAY['songwriter'::text, 'producer'::text, 'artist'::text, 'mix_engineer'::text, 'mastering_engineer'::text])));
alter table public._deprecated_personnel_pros add constraint personnel_pros_personnel_id_pro_id_key UNIQUE (personnel_id, pro_id);
alter table public._deprecated_personnel_pros add constraint personnel_pros_pkey PRIMARY KEY (id);
alter table public._deprecated_personnel_publishers add constraint personnel_publishers_personnel_id_publisher_id_key UNIQUE (personnel_id, publisher_id);
alter table public._deprecated_personnel_publishers add constraint personnel_publishers_pkey PRIMARY KEY (id);
alter table public._deprecated_publishers add constraint publishers_ipi_number_key UNIQUE (ipi_number);
alter table public._deprecated_publishers add constraint publishers_pkey PRIMARY KEY (id);
alter table public._health add constraint _health_pkey PRIMARY KEY (id);
alter table public.accommodations add constraint accommodations_pkey PRIMARY KEY (id);
alter table public.album_tracks add constraint album_tracks_album_id_track_id_disc_number_track_number_key UNIQUE (album_id, track_id, disc_number, track_number);
alter table public.album_tracks add constraint album_tracks_pkey PRIMARY KEY (id);
alter table public.albums add constraint albums_demo_status_check CHECK ((demo_status = ANY (ARRAY['demo'::text, 'mix'::text, 'master'::text, 'on_hold'::text])));
alter table public.albums add constraint albums_format_check CHECK ((format = ANY (ARRAY['Single'::text, 'EP'::text, 'Album'::text])));
alter table public.albums add constraint albums_pkey PRIMARY KEY (id);
alter table public.albums add constraint albums_spotify_id_key UNIQUE (spotify_id);
alter table public.analytics_integrations add constraint analytics_integrations_artist_id_platform_key UNIQUE (artist_id, platform);
alter table public.analytics_integrations add constraint analytics_integrations_pkey PRIMARY KEY (id);
alter table public.analytics_integrations add constraint analytics_integrations_platform_check CHECK ((platform = ANY (ARRAY['youtube'::text, 'spotify'::text, 'instagram'::text, 'twitter'::text, 'facebook'::text, 'tiktok'::text])));
alter table public.artists add constraint artists_pkey PRIMARY KEY (id);
alter table public.artists add constraint artists_spotify_id_key UNIQUE (spotify_id);
alter table public.budget_items add constraint budget_items_category_check CHECK ((category = ANY (ARRAY['Art'::text, 'Digital'::text, 'Marketing'::text, 'Music'::text, 'Press'::text, 'Other'::text])));
alter table public.budget_items add constraint budget_items_pkey PRIMARY KEY (id);
alter table public.budget_items add constraint budget_items_status_check CHECK ((status = ANY (ARRAY['received'::text, 'pending'::text, 'paid'::text, 'unpaid'::text])));
alter table public.budget_items add constraint budget_items_type_check CHECK ((type = ANY (ARRAY['Expense'::text, 'Income'::text])));
alter table public.budgets add constraint budgets_booking_agent_commission_rate_check CHECK (((booking_agent_commission_rate >= (0)::numeric) AND (booking_agent_commission_rate <= (100)::numeric)));
alter table public.budgets add constraint budgets_management_commission_rate_check CHECK (((management_commission_rate >= (0)::numeric) AND (management_commission_rate <= (100)::numeric)));
alter table public.budgets add constraint budgets_pkey PRIMARY KEY (id);
alter table public.budgets add constraint budgets_release_type_check CHECK ((release_type = ANY (ARRAY['single'::text, 'ep'::text, 'album'::text])));
alter table public.budgets add constraint budgets_status_check CHECK ((status = ANY (ARRAY['planning'::text, 'in_progress'::text, 'completed'::text])));
alter table public.budgets add constraint budgets_type_check CHECK ((type = ANY (ARRAY['release'::text, 'show'::text, 'tour'::text])));
alter table public.calendar_connections add constraint calendar_connections_pkey PRIMARY KEY (id);
alter table public.calendar_connections add constraint calendar_connections_provider_check CHECK ((provider = ANY (ARRAY['google'::text, 'ical'::text, 'outlook'::text])));
alter table public.calendar_connections add constraint calendar_connections_user_id_provider_provider_account_id_key UNIQUE (user_id, provider, provider_account_id);
alter table public.calendar_connections add constraint valid_google_config CHECK (((provider <> 'google'::text) OR ((access_token IS NOT NULL) AND (refresh_token IS NOT NULL))));
alter table public.calendar_connections add constraint valid_ical_config CHECK (((provider <> 'ical'::text) OR (ical_url IS NOT NULL)));
alter table public.calendar_connections add constraint valid_outlook_config CHECK (((provider <> 'outlook'::text) OR ((access_token IS NOT NULL) AND (refresh_token IS NOT NULL))));
alter table public.calendar_events add constraint calendar_events_event_type_check CHECK ((event_type = ANY (ARRAY['show'::text, 'release'::text, 'other'::text, 'task'::text, 'travel_accommodation'::text])));
alter table public.calendar_events add constraint calendar_events_pkey PRIMARY KEY (id);
alter table public.contact_affiliations add constraint contact_affiliations_pkey PRIMARY KEY (id);
alter table public.contact_files add constraint contact_files_pkey PRIMARY KEY (id);
alter table public.contact_payment_info add constraint contact_payment_info_account_type_check CHECK ((account_type = ANY (ARRAY['checking'::text, 'savings'::text])));
alter table public.contact_payment_info add constraint contact_payment_info_contact_id_key UNIQUE (contact_id);
alter table public.contact_payment_info add constraint contact_payment_info_pkey PRIMARY KEY (id);
alter table public.contacts add constraint contacts_category_check CHECK ((category = ANY (ARRAY['collaborator'::text, 'crew'::text, 'business'::text, 'other'::text])));
alter table public.contacts add constraint contacts_pkey PRIMARY KEY (id);
alter table public.contacts add constraint contacts_seating_preference_check CHECK ((seating_preference = ANY (ARRAY['window'::text, 'aisle'::text, 'middle'::text, 'no_preference'::text])));
alter table public.contacts add constraint contacts_visibility_check CHECK ((visibility = ANY (ARRAY['workspace'::text, 'private'::text])));
alter table public.contract_analyses add constraint contract_analyses_pkey PRIMARY KEY (id);
alter table public.credits add constraint credits_entity_type_check CHECK ((entity_type = ANY (ARRAY['album'::text, 'track'::text])));
alter table public.credits add constraint credits_pkey PRIMARY KEY (id);
alter table public.credits add constraint credits_role_check CHECK ((role = ANY (ARRAY['artist'::text, 'producer'::text, 'songwriter'::text, 'mix_engineer'::text, 'mastering_engineer'::text])));
alter table public.digital_assets add constraint digital_assets_entity_type_check CHECK ((entity_type = ANY (ARRAY['album'::text, 'track'::text])));
alter table public.digital_assets add constraint digital_assets_pkey PRIMARY KEY (id);
alter table public.digital_assets add constraint digital_assets_source_type_check CHECK ((source_type = ANY (ARRAY['upload'::text, 'gdrive'::text, 'dropbox'::text, 'sharepoint'::text, 'onedrive'::text, 'url'::text])));
alter table public.email_drafts add constraint email_drafts_pkey PRIMARY KEY (id);
alter table public.finances add constraint finances_pkey PRIMARY KEY (id);
alter table public.guest_list add constraint guest_list_pkey PRIMARY KEY (id);
alter table public.guest_list add constraint guest_list_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text])));
alter table public.guest_list add constraint guest_list_type_check CHECK ((type = ANY (ARRAY['vip'::text, 'industry'::text, 'friends_family'::text, 'media'::text, 'other'::text])));
alter table public.legal_document_notes add constraint legal_document_notes_pkey PRIMARY KEY (id);
alter table public.legal_documents add constraint legal_documents_pkey PRIMARY KEY (id);
alter table public.legal_documents add constraint legal_documents_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'pending_signature'::text, 'active'::text, 'expired'::text, 'terminated'::text])));
alter table public.legal_documents add constraint legal_documents_type_check CHECK ((type = ANY (ARRAY['contract'::text, 'license'::text, 'release'::text, 'agreement'::text, 'other'::text])));
alter table public.marketing_campaigns add constraint marketing_campaigns_pkey PRIMARY KEY (id);
alter table public.marketing_files add constraint marketing_files_category_check CHECK ((category = ANY (ARRAY['press_kit'::text, 'brand_assets'::text, 'campaign'::text, 'analytics'::text, 'other'::text])));
alter table public.marketing_files add constraint marketing_files_pkey PRIMARY KEY (id);
alter table public.marketing_posts add constraint marketing_posts_pkey PRIMARY KEY (id);
alter table public.marketing_posts add constraint marketing_posts_platform_check CHECK ((platform = ANY (ARRAY['instagram'::text, 'twitter'::text, 'facebook'::text, 'youtube'::text, 'tiktok'::text])));
alter table public.marketing_posts add constraint marketing_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'failed'::text])));
alter table public.marketing_tasks add constraint marketing_tasks_pkey PRIMARY KEY (id);
alter table public.notes add constraint notes_category_check CHECK ((category = ANY (ARRAY['todo'::text, 'meeting'::text, 'idea'::text, 'other'::text])));
alter table public.notes add constraint notes_pkey PRIMARY KEY (id);
alter table public.onboarding add constraint onboarding_pkey PRIMARY KEY (id);
alter table public.onboarding add constraint onboarding_user_id_key UNIQUE (user_id);
alter table public.organizations add constraint organizations_pkey PRIMARY KEY (id);
alter table public.organizations add constraint organizations_type_check CHECK ((type = ANY (ARRAY['label'::text, 'publisher'::text, 'management'::text, 'booking'::text, 'distributor'::text, 'pr'::text, 'marketing'::text, 'law'::text, 'accounting'::text, 'studio'::text, 'venue'::text, 'festival'::text, 'promoter'::text, 'sync'::text, 'pro'::text, 'mech_rights'::text, 'merch'::text, 'brand'::text, 'other'::text])));
alter table public.organizations add constraint organizations_visibility_check CHECK ((visibility = ANY (ARRAY['workspace'::text, 'private'::text])));
alter table public.platform_accounts add constraint platform_accounts_pkey PRIMARY KEY (id);
alter table public.platform_accounts add constraint platform_accounts_platform_check CHECK ((platform = ANY (ARRAY['spotify'::text, 'apple_music'::text, 'youtube'::text, 'instagram'::text, 'facebook'::text, 'twitter'::text, 'tiktok'::text])));
alter table public.platform_integrations add constraint platform_integrations_artist_id_platform_key UNIQUE (artist_id, platform);
alter table public.platform_integrations add constraint platform_integrations_pkey PRIMARY KEY (id);
alter table public.platform_integrations add constraint platform_integrations_platform_check CHECK ((platform = ANY (ARRAY['bandsintown'::text, 'songkick'::text])));
alter table public.platform_metrics add constraint platform_metrics_metric_type_check CHECK ((metric_type = ANY (ARRAY['followers'::text, 'monthly_listeners'::text, 'plays'::text, 'views'::text, 'subscribers'::text, 'likes'::text, 'comments'::text, 'shares'::text, 'reach'::text, 'engagement_rate'::text, 'mentions'::text])));
alter table public.platform_metrics add constraint platform_metrics_pkey PRIMARY KEY (id);
alter table public.playlist_tracks add constraint playlist_tracks_pkey PRIMARY KEY (id);
alter table public.playlist_tracks add constraint playlist_tracks_playlist_id_track_id_key UNIQUE (playlist_id, track_id);
alter table public.playlists add constraint playlists_pkey PRIMARY KEY (id);
alter table public.playlists add constraint playlists_share_token_key UNIQUE (share_token);
alter table public.production_files add constraint production_files_pkey PRIMARY KEY (id);
alter table public.production_files add constraint production_files_type_check CHECK ((type = ANY (ARRAY['tech_rider'::text, 'hospitality_rider'::text, 'stage_plot'::text, 'input_list'::text, 'backline'::text, 'contract'::text, 'other'::text])));
alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'artist_manager'::text, 'artist'::text, 'team_member'::text])));
alter table public.project_members add constraint project_members_access_check CHECK ((access = ANY (ARRAY['view'::text, 'edit'::text])));
alter table public.project_members add constraint project_members_pkey PRIMARY KEY (id);
alter table public.project_members add constraint project_members_project_id_user_id_key UNIQUE (project_id, user_id);
alter table public.project_relations add constraint exactly_one_target CHECK ((((contact_id IS NOT NULL) AND (organization_id IS NULL)) OR ((contact_id IS NULL) AND (organization_id IS NOT NULL))));
alter table public.project_relations add constraint project_relations_pkey PRIMARY KEY (id);
alter table public.projects add constraint projects_pkey PRIMARY KEY (id);
alter table public.projects add constraint projects_status_check CHECK ((status = ANY (ARRAY['planning'::text, 'in_progress'::text, 'completed'::text])));
alter table public.setlist_songs add constraint setlist_songs_pkey PRIMARY KEY (id);
alter table public.setlists add constraint setlists_pkey PRIMARY KEY (id);
alter table public.setlists add constraint setlists_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'proposed'::text, 'final'::text, 'archived'::text])));
alter table public.show_advances add constraint show_advances_pkey PRIMARY KEY (id);
alter table public.show_deals add constraint show_deals_deal_type_check CHECK ((deal_type = ANY (ARRAY['guarantee'::text, 'percentage'::text, 'guarantee_vs_percentage'::text])));
alter table public.show_deals add constraint show_deals_pkey PRIMARY KEY (id);
alter table public.show_personnel add constraint show_personnel_pkey PRIMARY KEY (id);
alter table public.show_personnel add constraint show_personnel_show_id_personnel_id_key UNIQUE (show_id, personnel_id);
alter table public.show_types add constraint show_types_name_key UNIQUE (name);
alter table public.show_types add constraint show_types_pkey PRIMARY KEY (id);
alter table public.shows add constraint shows_pkey PRIMARY KEY (id);
alter table public.shows add constraint shows_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'pending'::text, 'cancelled'::text])));
alter table public.signing_audit_logs add constraint signing_audit_logs_event_check CHECK ((event = ANY (ARRAY['created'::text, 'sent'::text, 'viewed'::text, 'otp_verified'::text, 'field_completed'::text, 'signed'::text, 'completed'::text, 'voided'::text, 'reminder_sent'::text, 'expired'::text])));
alter table public.signing_audit_logs add constraint signing_audit_logs_pkey PRIMARY KEY (id);
alter table public.signing_field_responses add constraint signing_field_responses_pkey PRIMARY KEY (id);
alter table public.signing_fields add constraint signing_fields_pkey PRIMARY KEY (id);
alter table public.signing_fields add constraint signing_fields_type_check CHECK ((type = ANY (ARRAY['signature'::text, 'initial'::text, 'date'::text, 'text'::text, 'checkbox'::text])));
alter table public.signing_recipients add constraint signing_recipients_pkey PRIMARY KEY (id);
alter table public.signing_recipients add constraint signing_recipients_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'notified'::text, 'viewed'::text, 'signed'::text, 'declined'::text])));
alter table public.signing_requests add constraint signing_requests_pkey PRIMARY KEY (id);
alter table public.signing_requests add constraint signing_requests_signing_order_check CHECK ((signing_order = ANY (ARRAY['parallel'::text, 'sequential'::text])));
alter table public.signing_requests add constraint signing_requests_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'completed'::text, 'voided'::text, 'expired'::text])));
alter table public.songwriter_pros add constraint songwriter_pros_pkey PRIMARY KEY (songwriter_id, pro_id);
alter table public.songwriter_publishers add constraint songwriter_publishers_pkey PRIMARY KEY (songwriter_id, publisher_id);
alter table public.subscription_plans add constraint subscription_plans_pkey PRIMARY KEY (id);
alter table public.subscription_plans add constraint subscription_plans_type_check CHECK ((type = ANY (ARRAY['artist'::text, 'manager'::text, 'label'::text, 'publisher'::text, 'producer'::text])));
alter table public.synced_events add constraint synced_events_calendar_connection_id_provider_event_id_key UNIQUE (calendar_connection_id, provider_event_id);
alter table public.synced_events add constraint synced_events_pkey PRIMARY KEY (id);
alter table public.task_comments add constraint task_comments_pkey PRIMARY KEY (id);
alter table public.tasks add constraint tasks_pkey PRIMARY KEY (id);
alter table public.team_invitations add constraint team_invitations_pkey PRIMARY KEY (id);
alter table public.team_invitations add constraint team_invitations_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'artist_manager'::text, 'artist'::text, 'attorney'::text, 'tour_manager'::text, 'marketing_manager'::text, 'finance_manager'::text, 'team_member'::text])));
alter table public.team_invitations add constraint team_invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text])));
alter table public.team_members add constraint team_members_pkey PRIMARY KEY (team_id, user_id);
alter table public.team_members add constraint team_members_role_check CHECK ((role = ANY (ARRAY['leader'::text, 'member'::text])));
alter table public.team_members add constraint team_members_seat_role_check CHECK ((seat_role = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'viewer'::text])));
alter table public.teams add constraint teams_pkey PRIMARY KEY (id);
alter table public.tour_days add constraint tour_days_day_type_check CHECK ((day_type = ANY (ARRAY['show'::text, 'travel'::text, 'off'::text, 'rehearsal'::text])));
alter table public.tour_days add constraint tour_days_pkey PRIMARY KEY (id);
alter table public.tour_days add constraint tour_days_tour_id_date_key UNIQUE (tour_id, date);
alter table public.tours add constraint tours_pkey PRIMARY KEY (id);
alter table public.tours add constraint tours_status_check CHECK ((status = ANY (ARRAY['planning'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])));
alter table public.tracks add constraint tracks_demo_status_check CHECK ((demo_status = ANY (ARRAY['demo'::text, 'mix'::text, 'master'::text, 'on_hold'::text])));
alter table public.tracks add constraint tracks_pkey PRIMARY KEY (id);
alter table public.tracks add constraint tracks_spotify_id_key UNIQUE (spotify_id);
alter table public.transportation add constraint transportation_pkey PRIMARY KEY (id);
alter table public.user_permissions add constraint user_permissions_access_level_check CHECK ((access_level = ANY (ARRAY['view'::text, 'comment'::text, 'edit'::text, 'full'::text])));
alter table public.user_permissions add constraint user_permissions_module_check CHECK ((module = ANY (ARRAY['catalog'::text, 'finance'::text, 'legal'::text, 'live'::text, 'marketing'::text, 'personnel'::text, 'info'::text, 'dashboard'::text])));
alter table public.user_permissions add constraint user_permissions_pkey PRIMARY KEY (user_id, module);
alter table public.user_subscriptions add constraint user_subscriptions_pkey PRIMARY KEY (id);
alter table public.user_subscriptions add constraint user_subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'trialing'::text, 'past_due'::text, 'canceled'::text, 'incomplete'::text])));
alter table public.users add constraint users_pkey PRIMARY KEY (id);
alter table public.venues add constraint venues_google_place_id_key UNIQUE (google_place_id);
alter table public.venues add constraint venues_pkey PRIMARY KEY (id);
alter table public.youtube_channel_analytics add constraint youtube_channel_analytics_integration_id_date_key UNIQUE (integration_id, date);
alter table public.youtube_channel_analytics add constraint youtube_channel_analytics_pkey PRIMARY KEY (id);
alter table public.youtube_video_analytics add constraint youtube_video_analytics_integration_id_video_id_key UNIQUE (integration_id, video_id);
alter table public.youtube_video_analytics add constraint youtube_video_analytics_pkey PRIMARY KEY (id);

-- ===== foreign keys =====

alter table public._deprecated_performance_rights_organizations add constraint performance_rights_organizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public._deprecated_personnel_profiles add constraint personnel_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public._deprecated_personnel_pros add constraint personnel_pros_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES _deprecated_personnel_profiles(id) ON DELETE CASCADE;
alter table public._deprecated_personnel_pros add constraint personnel_pros_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES _deprecated_performance_rights_organizations(id) ON DELETE CASCADE;
alter table public._deprecated_personnel_publishers add constraint personnel_publishers_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES _deprecated_personnel_profiles(id) ON DELETE CASCADE;
alter table public._deprecated_personnel_publishers add constraint personnel_publishers_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES _deprecated_publishers(id) ON DELETE CASCADE;
alter table public._deprecated_publishers add constraint publishers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.accommodations add constraint accommodations_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
alter table public.album_tracks add constraint album_tracks_album_id_fkey FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE;
alter table public.album_tracks add constraint album_tracks_track_id_fkey FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE;
alter table public.albums add constraint albums_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.albums add constraint albums_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.analytics_integrations add constraint analytics_integrations_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.artists add constraint artists_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES teams(id) ON DELETE CASCADE;
alter table public.budget_items add constraint budget_items_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES budgets(id);
alter table public.budget_items add constraint budget_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.budgets add constraint budgets_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.budgets add constraint budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.calendar_connections add constraint calendar_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.calendar_events add constraint calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.contact_affiliations add constraint contact_affiliations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.contact_affiliations add constraint contact_affiliations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.contact_affiliations add constraint contact_affiliations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES teams(id) ON DELETE CASCADE;
alter table public.contact_files add constraint contact_files_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.contact_files add constraint contact_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.contact_payment_info add constraint contact_payment_info_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.contact_payment_info add constraint contact_payment_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.contacts add constraint contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.contacts add constraint contacts_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES teams(id) ON DELETE CASCADE;
alter table public.contract_analyses add constraint contract_analyses_document_id_fkey FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE;
alter table public.contract_analyses add constraint contract_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.credits add constraint credits_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
alter table public.credits add constraint credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.digital_assets add constraint digital_assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.finances add constraint finances_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.finances add constraint finances_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE SET NULL;
alter table public.guest_list add constraint guest_list_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
alter table public.legal_document_notes add constraint legal_document_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);
alter table public.legal_document_notes add constraint legal_document_notes_document_id_fkey FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE;
alter table public.legal_documents add constraint legal_documents_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id);
alter table public.legal_documents add constraint legal_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.legal_documents add constraint legal_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.marketing_campaigns add constraint marketing_campaigns_album_id_fkey FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL;
alter table public.marketing_campaigns add constraint marketing_campaigns_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.marketing_files add constraint marketing_files_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id);
alter table public.marketing_files add constraint marketing_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
alter table public.marketing_posts add constraint marketing_posts_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id);
alter table public.marketing_posts add constraint marketing_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);
alter table public.marketing_tasks add constraint marketing_tasks_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
alter table public.notes add constraint notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.onboarding add constraint onboarding_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id);
alter table public.onboarding add constraint onboarding_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.organizations add constraint organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.organizations add constraint organizations_parent_org_id_fkey FOREIGN KEY (parent_org_id) REFERENCES organizations(id) ON DELETE SET NULL;
alter table public.organizations add constraint organizations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES teams(id) ON DELETE CASCADE;
alter table public.platform_accounts add constraint platform_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.platform_integrations add constraint platform_integrations_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.platform_metrics add constraint platform_metrics_platform_account_id_fkey FOREIGN KEY (platform_account_id) REFERENCES platform_accounts(id);
alter table public.platform_metrics add constraint platform_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.playlist_tracks add constraint playlist_tracks_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.playlist_tracks add constraint playlist_tracks_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE;
alter table public.playlist_tracks add constraint playlist_tracks_track_id_fkey FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE;
alter table public.playlists add constraint playlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.production_files add constraint production_files_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.project_members add constraint project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.project_members add constraint project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.project_members add constraint project_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES teams(id) ON DELETE CASCADE;
alter table public.project_relations add constraint project_relations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.project_relations add constraint project_relations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
alter table public.project_relations add constraint project_relations_project_id_fkey FOREIGN KEY (project_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.project_relations add constraint project_relations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES teams(id) ON DELETE CASCADE;
alter table public.projects add constraint projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.setlist_songs add constraint setlist_songs_setlist_id_fkey FOREIGN KEY (setlist_id) REFERENCES setlists(id) ON DELETE CASCADE;
alter table public.setlists add constraint setlists_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
alter table public.show_advances add constraint show_advances_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id);
alter table public.show_advances add constraint show_advances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.show_deals add constraint show_deals_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id);
alter table public.show_deals add constraint show_deals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.show_personnel add constraint show_personnel_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES _deprecated_personnel(id) ON DELETE CASCADE;
alter table public.show_personnel add constraint show_personnel_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
alter table public.shows add constraint shows_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.shows add constraint shows_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL;
alter table public.shows add constraint shows_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.shows add constraint shows_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;
alter table public.signing_audit_logs add constraint signing_audit_logs_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES signing_recipients(id);
alter table public.signing_audit_logs add constraint signing_audit_logs_signing_request_id_fkey FOREIGN KEY (signing_request_id) REFERENCES signing_requests(id) ON DELETE CASCADE;
alter table public.signing_field_responses add constraint signing_field_responses_field_id_fkey FOREIGN KEY (field_id) REFERENCES signing_fields(id) ON DELETE CASCADE;
alter table public.signing_field_responses add constraint signing_field_responses_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES signing_recipients(id) ON DELETE CASCADE;
alter table public.signing_fields add constraint signing_fields_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES signing_recipients(id) ON DELETE CASCADE;
alter table public.signing_fields add constraint signing_fields_signing_request_id_fkey FOREIGN KEY (signing_request_id) REFERENCES signing_requests(id) ON DELETE CASCADE;
alter table public.signing_recipients add constraint signing_recipients_signing_request_id_fkey FOREIGN KEY (signing_request_id) REFERENCES signing_requests(id) ON DELETE CASCADE;
alter table public.signing_recipients add constraint signing_recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.signing_requests add constraint signing_requests_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.signing_requests add constraint signing_requests_document_id_fkey FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE;
alter table public.songwriter_pros add constraint songwriter_pros_pro_id_fkey FOREIGN KEY (pro_id) REFERENCES _deprecated_performance_rights_organizations(id) ON DELETE CASCADE;
alter table public.songwriter_pros add constraint songwriter_pros_songwriter_id_fkey FOREIGN KEY (songwriter_id) REFERENCES credits(id) ON DELETE CASCADE;
alter table public.songwriter_publishers add constraint songwriter_publishers_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES _deprecated_publishers(id) ON DELETE CASCADE;
alter table public.songwriter_publishers add constraint songwriter_publishers_songwriter_id_fkey FOREIGN KEY (songwriter_id) REFERENCES credits(id) ON DELETE CASCADE;
alter table public.synced_events add constraint synced_events_calendar_connection_id_fkey FOREIGN KEY (calendar_connection_id) REFERENCES calendar_connections(id) ON DELETE CASCADE;
alter table public.task_comments add constraint task_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);
alter table public.task_comments add constraint task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
alter table public.tasks add constraint tasks_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.tasks add constraint tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
alter table public.tasks add constraint tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.tasks add constraint tasks_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
alter table public.tasks add constraint tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.team_invitations add constraint team_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE;
alter table public.team_members add constraint team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
alter table public.team_members add constraint team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.teams add constraint teams_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.tour_days add constraint tour_days_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE SET NULL;
alter table public.tour_days add constraint tour_days_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE;
alter table public.tours add constraint tours_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;
alter table public.tours add constraint tours_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.tracks add constraint tracks_album_id_fkey FOREIGN KEY (album_id) REFERENCES albums(id);
alter table public.tracks add constraint tracks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.transportation add constraint transportation_show_id_fkey FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
alter table public.user_permissions add constraint user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.user_subscriptions add constraint user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
alter table public.user_subscriptions add constraint user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.users add constraint users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.youtube_channel_analytics add constraint youtube_channel_analytics_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES analytics_integrations(id) ON DELETE CASCADE;
alter table public.youtube_video_analytics add constraint youtube_video_analytics_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES analytics_integrations(id) ON DELETE CASCADE;

-- ===== indexes =====

CREATE INDEX pro_name_idx ON public._deprecated_performance_rights_organizations USING btree (name);
CREATE INDEX personnel_profiles_type_idx ON public._deprecated_personnel_profiles USING btree (type);
CREATE INDEX personnel_profiles_user_id_idx ON public._deprecated_personnel_profiles USING btree (user_id);
CREATE INDEX personnel_pros_personnel_id_idx ON public._deprecated_personnel_pros USING btree (personnel_id);
CREATE INDEX personnel_pros_pro_id_idx ON public._deprecated_personnel_pros USING btree (pro_id);
CREATE INDEX personnel_publishers_personnel_id_idx ON public._deprecated_personnel_publishers USING btree (personnel_id);
CREATE INDEX personnel_publishers_publisher_id_idx ON public._deprecated_personnel_publishers USING btree (publisher_id);
CREATE INDEX publisher_name_idx ON public._deprecated_publishers USING btree (name);
CREATE INDEX idx_accommodations_show_id ON public.accommodations USING btree (show_id);
CREATE INDEX album_tracks_album_id_idx ON public.album_tracks USING btree (album_id);
CREATE INDEX album_tracks_track_id_idx ON public.album_tracks USING btree (track_id);
CREATE INDEX idx_albums_artist_id ON public.albums USING btree (artist_id);
CREATE INDEX idx_albums_spotify_id ON public.albums USING btree (spotify_id);
CREATE INDEX idx_analytics_integrations_artist_platform ON public.analytics_integrations USING btree (artist_id, platform);
CREATE INDEX artists_workspace_idx ON public.artists USING btree (workspace_id);
CREATE INDEX idx_calendar_connections_provider ON public.calendar_connections USING btree (provider) WHERE (sync_enabled = true);
CREATE INDEX idx_calendar_connections_user_id ON public.calendar_connections USING btree (user_id);
CREATE INDEX idx_calendar_events_date_range ON public.calendar_events USING btree (start_date, end_date);
CREATE INDEX idx_calendar_events_start_date ON public.calendar_events USING btree (start_date);
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events USING btree (user_id);
CREATE INDEX caff_contact_idx ON public.contact_affiliations USING btree (contact_id);
CREATE INDEX caff_org_idx ON public.contact_affiliations USING btree (organization_id);
CREATE INDEX caff_ws_idx ON public.contact_affiliations USING btree (workspace_id);
CREATE INDEX contact_files_contact_id_idx ON public.contact_files USING btree (contact_id);
CREATE INDEX contact_payment_info_contact_id_idx ON public.contact_payment_info USING btree (contact_id);
CREATE INDEX contacts_user_id_idx ON public.contacts USING btree (user_id);
CREATE INDEX contacts_workspace_idx ON public.contacts USING btree (workspace_id);
CREATE INDEX contract_analyses_document_id_idx ON public.contract_analyses USING btree (document_id);
CREATE INDEX contract_analyses_user_id_idx ON public.contract_analyses USING btree (user_id);
CREATE INDEX credits_entity_id_idx ON public.credits USING btree (entity_id);
CREATE INDEX credits_entity_type_idx ON public.credits USING btree (entity_type);
CREATE INDEX credits_role_idx ON public.credits USING btree (role);
CREATE INDEX idx_digital_assets_entity ON public.digital_assets USING btree (entity_type, entity_id);
CREATE INDEX idx_digital_assets_user ON public.digital_assets USING btree (user_id);
CREATE INDEX idx_finances_artist_id ON public.finances USING btree (artist_id);
CREATE INDEX idx_finances_show_id ON public.finances USING btree (show_id);
CREATE INDEX idx_guest_list_show_id ON public.guest_list USING btree (show_id);
CREATE INDEX idx_legal_document_notes_author_id ON public.legal_document_notes USING btree (author_id);
CREATE INDEX idx_legal_document_notes_document_id ON public.legal_document_notes USING btree (document_id);
CREATE INDEX idx_legal_documents_artist_id ON public.legal_documents USING btree (artist_id);
CREATE INDEX idx_legal_documents_created_by ON public.legal_documents USING btree (created_by);
CREATE INDEX idx_marketing_campaigns_artist_id ON public.marketing_campaigns USING btree (artist_id);
CREATE INDEX idx_marketing_files_artist_id ON public.marketing_files USING btree (artist_id);
CREATE INDEX idx_marketing_files_uploaded_by ON public.marketing_files USING btree (uploaded_by);
CREATE INDEX idx_marketing_posts_artist_id ON public.marketing_posts USING btree (artist_id);
CREATE INDEX idx_marketing_posts_author_id ON public.marketing_posts USING btree (author_id);
CREATE INDEX idx_marketing_posts_scheduled_date ON public.marketing_posts USING btree (scheduled_date);
CREATE INDEX idx_marketing_tasks_show_id ON public.marketing_tasks USING btree (show_id);
CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);
CREATE INDEX organizations_parent_idx ON public.organizations USING btree (parent_org_id);
CREATE INDEX organizations_type_idx ON public.organizations USING btree (type);
CREATE INDEX organizations_workspace_idx ON public.organizations USING btree (workspace_id);
CREATE INDEX idx_platform_integrations_artist_platform ON public.platform_integrations USING btree (artist_id, platform);
CREATE INDEX platform_metrics_date_idx ON public.platform_metrics USING btree (date);
CREATE INDEX platform_metrics_platform_account_id_idx ON public.platform_metrics USING btree (platform_account_id);
CREATE INDEX idx_playlist_tracks_playlist ON public.playlist_tracks USING btree (playlist_id);
CREATE INDEX idx_playlists_user ON public.playlists USING btree (user_id);
CREATE INDEX idx_production_files_show_id ON public.production_files USING btree (show_id);
CREATE INDEX pm_project_idx ON public.project_members USING btree (project_id);
CREATE INDEX pm_user_idx ON public.project_members USING btree (user_id);
CREATE INDEX pr_contact_idx ON public.project_relations USING btree (contact_id);
CREATE INDEX pr_org_idx ON public.project_relations USING btree (organization_id);
CREATE INDEX pr_project_idx ON public.project_relations USING btree (project_id);
CREATE INDEX pr_ws_idx ON public.project_relations USING btree (workspace_id);
CREATE INDEX idx_setlist_songs_setlist_id ON public.setlist_songs USING btree (setlist_id);
CREATE INDEX idx_setlists_show_id ON public.setlists USING btree (show_id);
CREATE INDEX idx_show_advances_show_id ON public.show_advances USING btree (show_id);
CREATE INDEX idx_show_deals_show_id ON public.show_deals USING btree (show_id);
CREATE INDEX idx_shows_artist_id ON public.shows USING btree (artist_id);
CREATE INDEX idx_shows_date ON public.shows USING btree (date);
CREATE INDEX idx_shows_tour_id ON public.shows USING btree (tour_id);
CREATE INDEX idx_shows_venue_id ON public.shows USING btree (venue_id);
CREATE INDEX idx_signing_audit_logs_event ON public.signing_audit_logs USING btree (event);
CREATE INDEX idx_signing_audit_logs_request_id ON public.signing_audit_logs USING btree (signing_request_id);
CREATE INDEX idx_signing_field_responses_field_id ON public.signing_field_responses USING btree (field_id);
CREATE INDEX idx_signing_fields_recipient_id ON public.signing_fields USING btree (recipient_id);
CREATE INDEX idx_signing_fields_request_id ON public.signing_fields USING btree (signing_request_id);
CREATE UNIQUE INDEX idx_signing_recipients_access_token ON public.signing_recipients USING btree (access_token);
CREATE INDEX idx_signing_recipients_email ON public.signing_recipients USING btree (email);
CREATE INDEX idx_signing_recipients_request_id ON public.signing_recipients USING btree (signing_request_id);
CREATE INDEX idx_signing_requests_created_by ON public.signing_requests USING btree (created_by);
CREATE INDEX idx_signing_requests_document_id ON public.signing_requests USING btree (document_id);
CREATE INDEX idx_signing_requests_status ON public.signing_requests USING btree (status);
CREATE INDEX songwriter_pros_pro_id_idx ON public.songwriter_pros USING btree (pro_id);
CREATE INDEX songwriter_pros_songwriter_id_idx ON public.songwriter_pros USING btree (songwriter_id);
CREATE INDEX songwriter_publishers_publisher_id_idx ON public.songwriter_publishers USING btree (publisher_id);
CREATE INDEX songwriter_publishers_songwriter_id_idx ON public.songwriter_publishers USING btree (songwriter_id);
CREATE INDEX subscription_plans_type_idx ON public.subscription_plans USING btree (type);
CREATE INDEX idx_synced_events_calendar_connection ON public.synced_events USING btree (calendar_connection_id);
CREATE INDEX idx_synced_events_date_range ON public.synced_events USING btree (start_date, end_date);
CREATE INDEX idx_synced_events_provider_event_id ON public.synced_events USING btree (provider_event_id);
CREATE INDEX idx_synced_events_start_date ON public.synced_events USING btree (start_date);
CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);
CREATE UNIQUE INDEX team_members_team_user_uniq ON public.team_members USING btree (team_id, user_id);
CREATE INDEX idx_tracks_spotify_id ON public.tracks USING btree (spotify_id);
CREATE INDEX tracks_isrc_idx ON public.tracks USING btree (isrc) WHERE ((isrc IS NOT NULL) AND (isrc <> ''::text));
CREATE UNIQUE INDEX tracks_isrc_unique_idx ON public.tracks USING btree (isrc) WHERE ((isrc IS NOT NULL) AND (isrc <> ''::text));
CREATE INDEX idx_transportation_show_id ON public.transportation USING btree (show_id);
CREATE INDEX user_subscriptions_plan_id_idx ON public.user_subscriptions USING btree (plan_id);
CREATE INDEX user_subscriptions_status_idx ON public.user_subscriptions USING btree (status);
CREATE INDEX user_subscriptions_user_id_idx ON public.user_subscriptions USING btree (user_id);
CREATE INDEX idx_venues_city ON public.venues USING btree (city);
CREATE INDEX idx_venues_country ON public.venues USING btree (country);
CREATE INDEX idx_venues_google_place_id ON public.venues USING btree (google_place_id);
CREATE INDEX idx_venues_name ON public.venues USING btree (name);
CREATE INDEX idx_youtube_channel_analytics_integration_date ON public.youtube_channel_analytics USING btree (integration_id, date DESC);
CREATE INDEX idx_youtube_video_analytics_integration ON public.youtube_video_analytics USING btree (integration_id);
CREATE INDEX idx_youtube_video_analytics_video_id ON public.youtube_video_analytics USING btree (video_id);

-- ===== functions =====

CREATE OR REPLACE FUNCTION public.contacts_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_team_members()
 RETURNS TABLE(id uuid, email text, full_name text, role text, avatar_url text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.avatar_url,
    u.created_at
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'artist_manager')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.healthcheck()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_venue_usage()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.venue_id IS NOT NULL THEN
    UPDATE venues
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = NEW.venue_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END $function$
;

CREATE OR REPLACE FUNCTION public.update_playlist_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE playlists
  SET updated_at = now()
  WHERE id = NEW.playlist_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_venues_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

-- ===== triggers =====

CREATE TRIGGER set_pros_updated_at BEFORE UPDATE ON public._deprecated_performance_rights_organizations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_personnel_profiles_updated_at BEFORE UPDATE ON public._deprecated_personnel_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_personnel_pros_updated_at BEFORE UPDATE ON public._deprecated_personnel_pros FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_personnel_publishers_updated_at BEFORE UPDATE ON public._deprecated_personnel_publishers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_publishers_updated_at BEFORE UPDATE ON public._deprecated_publishers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_albums_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_budget_items_updated_at BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_calendar_connections_updated_at BEFORE UPDATE ON public.calendar_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER payment_info_updated_at BEFORE UPDATE ON public.contact_payment_info FOR EACH ROW EXECUTE FUNCTION contacts_set_updated_at();
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION contacts_set_updated_at();
CREATE TRIGGER set_contract_analyses_updated_at BEFORE UPDATE ON public.contract_analyses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_credits_updated_at BEFORE UPDATE ON public.credits FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_legal_documents_updated_at BEFORE UPDATE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER organizations_touch BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER set_platform_accounts_updated_at BEFORE UPDATE ON public.platform_accounts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_playlist_timestamp AFTER INSERT OR DELETE OR UPDATE ON public.playlist_tracks FOR EACH ROW EXECUTE FUNCTION update_playlist_updated_at();
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_show_advances_updated_at BEFORE UPDATE ON public.show_advances FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_show_deals_updated_at BEFORE UPDATE ON public.show_deals FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_shows_updated_at BEFORE UPDATE ON public.shows FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_increment_venue_usage AFTER INSERT ON public.shows FOR EACH ROW EXECUTE FUNCTION increment_venue_usage();
CREATE TRIGGER set_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_synced_events_updated_at BEFORE UPDATE ON public.synced_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_tracks_updated_at BEFORE UPDATE ON public.tracks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_update_venues_timestamp BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION update_venues_updated_at();

-- ===== row level security =====

alter table public._deprecated_performance_rights_organizations enable row level security;
alter table public._deprecated_personnel enable row level security;
alter table public._deprecated_personnel_profiles enable row level security;
alter table public._deprecated_personnel_pros enable row level security;
alter table public._deprecated_personnel_publishers enable row level security;
alter table public._deprecated_publishers enable row level security;
alter table public.accommodations enable row level security;
alter table public.album_tracks enable row level security;
alter table public.albums enable row level security;
alter table public.analytics_integrations enable row level security;
alter table public.artists enable row level security;
alter table public.budget_items enable row level security;
alter table public.budgets enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_events enable row level security;
alter table public.contact_affiliations enable row level security;
alter table public.contact_files enable row level security;
alter table public.contact_payment_info enable row level security;
alter table public.contacts enable row level security;
alter table public.contract_analyses enable row level security;
alter table public.credits enable row level security;
alter table public.digital_assets enable row level security;
alter table public.finances enable row level security;
alter table public.guest_list enable row level security;
alter table public.legal_document_notes enable row level security;
alter table public.legal_documents enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_files enable row level security;
alter table public.marketing_posts enable row level security;
alter table public.marketing_tasks enable row level security;
alter table public.notes enable row level security;
alter table public.onboarding enable row level security;
alter table public.organizations enable row level security;
alter table public.platform_accounts enable row level security;
alter table public.platform_integrations enable row level security;
alter table public.platform_metrics enable row level security;
alter table public.playlist_tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.production_files enable row level security;
alter table public.profiles enable row level security;
alter table public.project_members enable row level security;
alter table public.project_relations enable row level security;
alter table public.projects enable row level security;
alter table public.setlist_songs enable row level security;
alter table public.setlists enable row level security;
alter table public.show_advances enable row level security;
alter table public.show_deals enable row level security;
alter table public.show_personnel enable row level security;
alter table public.show_types enable row level security;
alter table public.shows enable row level security;
alter table public.signing_audit_logs enable row level security;
alter table public.signing_field_responses enable row level security;
alter table public.signing_fields enable row level security;
alter table public.signing_recipients enable row level security;
alter table public.signing_requests enable row level security;
alter table public.songwriter_pros enable row level security;
alter table public.songwriter_publishers enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.synced_events enable row level security;
alter table public.task_comments enable row level security;
alter table public.tasks enable row level security;
alter table public.team_invitations enable row level security;
alter table public.team_members enable row level security;
alter table public.teams enable row level security;
alter table public.tour_days enable row level security;
alter table public.tours enable row level security;
alter table public.tracks enable row level security;
alter table public.transportation enable row level security;
alter table public.user_permissions enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.users enable row level security;
alter table public.venues enable row level security;
alter table public.youtube_channel_analytics enable row level security;
alter table public.youtube_video_analytics enable row level security;

-- ===== policies =====

create policy "Users can insert their own PROs" on public._deprecated_performance_rights_organizations as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own PROs" on public._deprecated_performance_rights_organizations as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view PROs" on public._deprecated_performance_rights_organizations as PERMISSIVE for SELECT to public using (true);
create policy auth_all_personnel on public._deprecated_personnel as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Users can delete their own personnel profiles" on public._deprecated_personnel_profiles as PERMISSIVE for DELETE to public using ((auth.uid() = user_id));
create policy "Users can insert their own personnel profiles" on public._deprecated_personnel_profiles as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own personnel profiles" on public._deprecated_personnel_profiles as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view personnel profiles" on public._deprecated_personnel_profiles as PERMISSIVE for SELECT to public using (true);
create policy "Users can delete their own personnel PROs" on public._deprecated_personnel_pros as PERMISSIVE for DELETE to public using ((EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_pros.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid())))));
create policy "Users can insert their own personnel PROs" on public._deprecated_personnel_pros as PERMISSIVE for INSERT to public with check ((EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_pros.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid())))));
create policy "Users can update their own personnel PROs" on public._deprecated_personnel_pros as PERMISSIVE for UPDATE to public using ((EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_pros.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid())))));
create policy "Users can view personnel PROs" on public._deprecated_personnel_pros as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_pros.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid())))));
create policy "Users can delete their own personnel publishers" on public._deprecated_personnel_publishers as PERMISSIVE for DELETE to public using ((EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_publishers.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid())))));
create policy "Users can insert their own personnel publishers" on public._deprecated_personnel_publishers as PERMISSIVE for INSERT to public with check ((EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_publishers.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid())))));
create policy "Users can update their own personnel publishers" on public._deprecated_personnel_publishers as PERMISSIVE for UPDATE to public using ((EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_publishers.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid())))));
create policy "Users can view personnel publishers" on public._deprecated_personnel_publishers as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_publishers.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid())))));
create policy "Users can insert their own publishers" on public._deprecated_publishers as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own publishers" on public._deprecated_publishers as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view publishers" on public._deprecated_publishers as PERMISSIVE for SELECT to public using (true);
create policy "Health check is readable by everyone" on public._health as PERMISSIVE for SELECT to public using (true);
create policy auth_all_accommodations on public.accommodations as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Anyone can view album tracks" on public.album_tracks as PERMISSIVE for SELECT to public using (true);
create policy "Authenticated users can delete album tracks" on public.album_tracks as PERMISSIVE for DELETE to authenticated using (true);
create policy "Authenticated users can insert album tracks" on public.album_tracks as PERMISSIVE for INSERT to authenticated with check (true);
create policy "Authenticated users can update album tracks" on public.album_tracks as PERMISSIVE for UPDATE to authenticated using (true) with check (true);
create policy "Anonymous users can view albums in public playlists" on public.albums as PERMISSIVE for SELECT to anon using ((EXISTS ( SELECT 1
   FROM ((album_tracks at2
     JOIN playlist_tracks pt ON ((pt.track_id = at2.track_id)))
     JOIN playlists p ON ((p.id = pt.playlist_id)))
  WHERE ((at2.album_id = albums.id) AND (p.is_public = true)))));
create policy "Users can delete their own albums" on public.albums as PERMISSIVE for DELETE to public using ((auth.uid() = user_id));
create policy "Users can insert their own albums" on public.albums as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own albums" on public.albums as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own albums" on public.albums as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Users can create analytics integrations" on public.analytics_integrations as PERMISSIVE for INSERT to authenticated with check (true);
create policy "Users can delete their own analytics integrations" on public.analytics_integrations as PERMISSIVE for DELETE to authenticated using (true);
create policy "Users can update their own analytics integrations" on public.analytics_integrations as PERMISSIVE for UPDATE to authenticated using (true) with check (true);
create policy "Users can view their own analytics integrations" on public.analytics_integrations as PERMISSIVE for SELECT to authenticated using (true);
create policy artists_delete on public.artists as PERMISSIVE for DELETE to public using (((EXISTS ( SELECT 1
   FROM teams
  WHERE ((teams.id = artists.workspace_id) AND (teams.owner_id = auth.uid())))) OR (workspace_id IS NULL)));
create policy artists_insert on public.artists as PERMISSIVE for INSERT to public with check (true);
create policy artists_select on public.artists as PERMISSIVE for SELECT to public using (((EXISTS ( SELECT 1
   FROM teams
  WHERE ((teams.id = artists.workspace_id) AND (teams.owner_id = auth.uid())))) OR (workspace_id IS NULL)));
create policy artists_update on public.artists as PERMISSIVE for UPDATE to public using (((EXISTS ( SELECT 1
   FROM teams
  WHERE ((teams.id = artists.workspace_id) AND (teams.owner_id = auth.uid())))) OR (workspace_id IS NULL)));
create policy "Users can insert their own budget items" on public.budget_items as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own budget items" on public.budget_items as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own budget items" on public.budget_items as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Users can insert their own budgets" on public.budgets as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own budgets" on public.budgets as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own budgets" on public.budgets as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Users can delete own calendar connections" on public.calendar_connections as PERMISSIVE for DELETE to authenticated using ((auth.uid() = user_id));
create policy "Users can insert own calendar connections" on public.calendar_connections as PERMISSIVE for INSERT to authenticated with check ((auth.uid() = user_id));
create policy "Users can update own calendar connections" on public.calendar_connections as PERMISSIVE for UPDATE to authenticated using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "Users can view own calendar connections" on public.calendar_connections as PERMISSIVE for SELECT to authenticated using ((auth.uid() = user_id));
create policy "Users can delete own calendar events" on public.calendar_events as PERMISSIVE for DELETE to authenticated using ((auth.uid() = user_id));
create policy "Users can insert own calendar events" on public.calendar_events as PERMISSIVE for INSERT to authenticated with check ((auth.uid() = user_id));
create policy "Users can update own calendar events" on public.calendar_events as PERMISSIVE for UPDATE to authenticated using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "Users can view own calendar events" on public.calendar_events as PERMISSIVE for SELECT to authenticated using ((auth.uid() = user_id));
create policy caff_delete on public.contact_affiliations as PERMISSIVE for DELETE to public using (true);
create policy caff_insert on public.contact_affiliations as PERMISSIVE for INSERT to public with check (true);
create policy caff_select on public.contact_affiliations as PERMISSIVE for SELECT to public using (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_affiliations.contact_id) AND (c.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM organizations o
  WHERE ((o.id = contact_affiliations.organization_id) AND (o.created_by = auth.uid()))))));
create policy caff_update on public.contact_affiliations as PERMISSIVE for UPDATE to public using (true);
create policy contact_files_all on public.contact_files as PERMISSIVE for ALL to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy payment_info_all on public.contact_payment_info as PERMISSIVE for ALL to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy contacts_delete on public.contacts as PERMISSIVE for DELETE to public using ((auth.uid() = user_id));
create policy contacts_insert on public.contacts as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy contacts_select on public.contacts as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy contacts_update on public.contacts as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can insert their own contract analyses" on public.contract_analyses as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own contract analyses" on public.contract_analyses as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own contract analyses" on public.contract_analyses as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Anyone can view credits" on public.credits as PERMISSIVE for SELECT to public using (true);
create policy "Authenticated users can delete credits" on public.credits as PERMISSIVE for DELETE to authenticated using (true);
create policy "Authenticated users can insert credits" on public.credits as PERMISSIVE for INSERT to authenticated with check (true);
create policy "Authenticated users can update credits" on public.credits as PERMISSIVE for UPDATE to authenticated using (true);
create policy "Users can insert their own credits" on public.credits as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own credits" on public.credits as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own credits" on public.credits as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Users delete their own assets" on public.digital_assets as PERMISSIVE for DELETE to authenticated using ((auth.uid() = user_id));
create policy "Users insert their own assets" on public.digital_assets as PERMISSIVE for INSERT to authenticated with check ((auth.uid() = user_id));
create policy "Users update their own assets" on public.digital_assets as PERMISSIVE for UPDATE to authenticated using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "Users view their own assets" on public.digital_assets as PERMISSIVE for SELECT to authenticated using ((auth.uid() = user_id));
create policy auth_all_finances on public.finances as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Users can manage guest list" on public.guest_list as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Authors can delete their own document notes" on public.legal_document_notes as PERMISSIVE for DELETE to authenticated using ((auth.uid() = author_id));
create policy "Authors can update their own document notes" on public.legal_document_notes as PERMISSIVE for UPDATE to authenticated using ((auth.uid() = author_id)) with check ((auth.uid() = author_id));
create policy "Team members can create document notes" on public.legal_document_notes as PERMISSIVE for INSERT to authenticated with check ((auth.uid() = author_id));
create policy "Team members can view all document notes" on public.legal_document_notes as PERMISSIVE for SELECT to authenticated using (true);
create policy "Team members can create legal documents" on public.legal_documents as PERMISSIVE for INSERT to authenticated with check ((auth.uid() IS NOT NULL));
create policy "Team members can delete legal documents" on public.legal_documents as PERMISSIVE for DELETE to authenticated using (true);
create policy "Team members can update legal documents" on public.legal_documents as PERMISSIVE for UPDATE to authenticated using (true) with check (true);
create policy "Team members can view all legal documents" on public.legal_documents as PERMISSIVE for SELECT to authenticated using (true);
create policy "Users can insert their own legal documents" on public.legal_documents as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own legal documents" on public.legal_documents as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own legal documents" on public.legal_documents as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy auth_all_marketing_campaigns on public.marketing_campaigns as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Team members can delete marketing files" on public.marketing_files as PERMISSIVE for DELETE to authenticated using (true);
create policy "Team members can update marketing files" on public.marketing_files as PERMISSIVE for UPDATE to authenticated using (true) with check (true);
create policy "Team members can upload marketing files" on public.marketing_files as PERMISSIVE for INSERT to authenticated with check ((auth.uid() IS NOT NULL));
create policy "Team members can view all marketing files" on public.marketing_files as PERMISSIVE for SELECT to authenticated using (true);
create policy "Team members can create marketing posts" on public.marketing_posts as PERMISSIVE for INSERT to authenticated with check ((auth.uid() IS NOT NULL));
create policy "Team members can delete marketing posts" on public.marketing_posts as PERMISSIVE for DELETE to authenticated using (true);
create policy "Team members can update marketing posts" on public.marketing_posts as PERMISSIVE for UPDATE to authenticated using (true) with check (true);
create policy "Team members can view all marketing posts" on public.marketing_posts as PERMISSIVE for SELECT to authenticated using (true);
create policy "Users can manage marketing tasks" on public.marketing_tasks as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Users can delete their own notes" on public.notes as PERMISSIVE for DELETE to public using ((auth.uid() = user_id));
create policy "Users can insert their own notes" on public.notes as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own notes" on public.notes as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own notes" on public.notes as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Users can insert own onboarding" on public.onboarding as PERMISSIVE for INSERT to authenticated with check ((auth.uid() = user_id));
create policy "Users can update own onboarding" on public.onboarding as PERMISSIVE for UPDATE to authenticated using ((auth.uid() = user_id));
create policy "Users can view own onboarding" on public.onboarding as PERMISSIVE for SELECT to authenticated using ((auth.uid() = user_id));
create policy orgs_delete on public.organizations as PERMISSIVE for DELETE to public using ((created_by = auth.uid()));
create policy orgs_insert on public.organizations as PERMISSIVE for INSERT to public with check ((created_by = auth.uid()));
create policy orgs_select on public.organizations as PERMISSIVE for SELECT to public using ((created_by = auth.uid()));
create policy orgs_update on public.organizations as PERMISSIVE for UPDATE to public using ((created_by = auth.uid()));
create policy "Users can insert their own platform accounts" on public.platform_accounts as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own platform accounts" on public.platform_accounts as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own platform accounts" on public.platform_accounts as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Authenticated users can create platform integrations" on public.platform_integrations as PERMISSIVE for INSERT to authenticated with check (true);
create policy "Authenticated users can delete platform integrations" on public.platform_integrations as PERMISSIVE for DELETE to authenticated using (true);
create policy "Authenticated users can update platform integrations" on public.platform_integrations as PERMISSIVE for UPDATE to authenticated using (true) with check (true);
create policy "Authenticated users can view platform integrations" on public.platform_integrations as PERMISSIVE for SELECT to authenticated using (true);
create policy "Users can insert their own platform metrics" on public.platform_metrics as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can view their own platform metrics" on public.platform_metrics as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Anonymous users can view tracks in public playlists" on public.playlist_tracks as PERMISSIVE for SELECT to anon using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.is_public = true)))));
create policy "Anyone can view tracks in public playlists" on public.playlist_tracks as PERMISSIVE for SELECT to anon, authenticated using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.is_public = true)))));
create policy "Users can add tracks to own playlists" on public.playlist_tracks as PERMISSIVE for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))));
create policy "Users can remove tracks from own playlists" on public.playlist_tracks as PERMISSIVE for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))));
create policy "Users can update tracks in own playlists" on public.playlist_tracks as PERMISSIVE for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))));
create policy "Users can view tracks in own playlists" on public.playlist_tracks as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))));
create policy "Anonymous users can view public playlists" on public.playlists as PERMISSIVE for SELECT to anon using ((is_public = true));
create policy "Public playlists viewable by all" on public.playlists as PERMISSIVE for SELECT to anon, authenticated using ((is_public = true));
create policy "Users can create own playlists" on public.playlists as PERMISSIVE for INSERT to authenticated with check ((auth.uid() = user_id));
create policy "Users can delete own playlists" on public.playlists as PERMISSIVE for DELETE to authenticated using ((auth.uid() = user_id));
create policy "Users can update own playlists" on public.playlists as PERMISSIVE for UPDATE to authenticated using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "Users can view own playlists" on public.playlists as PERMISSIVE for SELECT to authenticated using ((auth.uid() = user_id));
create policy "Users can manage production files" on public.production_files as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Public profiles are viewable by everyone" on public.profiles as PERMISSIVE for SELECT to public using (true);
create policy "Users can update their own profile" on public.profiles as PERMISSIVE for UPDATE to public using ((auth.uid() = id));
create policy pm_owner_write on public.project_members as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = project_members.workspace_id) AND (t.owner_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = project_members.workspace_id) AND (t.owner_id = auth.uid())))));
create policy pm_self_or_owner_select on public.project_members as PERMISSIVE for SELECT to public using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = project_members.workspace_id) AND (t.owner_id = auth.uid()))))));
create policy pr_delete on public.project_relations as PERMISSIVE for DELETE to public using (true);
create policy pr_insert on public.project_relations as PERMISSIVE for INSERT to public with check (true);
create policy pr_select on public.project_relations as PERMISSIVE for SELECT to public using (((EXISTS ( SELECT 1
   FROM artists a
  WHERE ((a.id = project_relations.project_id) AND (a.workspace_id IN ( SELECT team_members.team_id
           FROM team_members
          WHERE (team_members.user_id = auth.uid())))))) OR (EXISTS ( SELECT 1
   FROM organizations o
  WHERE ((o.id = project_relations.organization_id) AND (o.created_by = auth.uid()))))));
create policy pr_update on public.project_relations as PERMISSIVE for UPDATE to public using (true);
create policy "Project owners can update their projects" on public.projects as PERMISSIVE for UPDATE to public using ((auth.uid() = owner_id));
create policy "Projects are viewable by team members" on public.projects as PERMISSIVE for SELECT to public using ((auth.uid() IN ( SELECT tm.user_id
   FROM team_members tm
  WHERE (tm.team_id IN ( SELECT team_members.team_id
           FROM team_members
          WHERE (team_members.user_id = auth.uid()))))));
create policy "Users can manage setlist songs" on public.setlist_songs as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Users can manage setlists" on public.setlists as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Users can insert their own show advances" on public.show_advances as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can manage show advances" on public.show_advances as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Users can update their own show advances" on public.show_advances as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own show advances" on public.show_advances as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Users can insert their own show deals" on public.show_deals as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can manage show deals" on public.show_deals as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Users can update their own show deals" on public.show_deals as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own show deals" on public.show_deals as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy auth_all_show_personnel on public.show_personnel as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy auth_all_show_types on public.show_types as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Users can insert their own shows" on public.shows as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own shows" on public.shows as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own shows" on public.shows as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "System can insert audit logs" on public.signing_audit_logs as PERMISSIVE for INSERT to authenticated with check (true);
create policy "Users can view audit logs for their requests" on public.signing_audit_logs as PERMISSIVE for SELECT to authenticated using ((signing_request_id IN ( SELECT signing_requests.id
   FROM signing_requests
  WHERE (signing_requests.created_by = auth.uid()))));
create policy "Users can view responses for their requests" on public.signing_field_responses as PERMISSIVE for SELECT to authenticated using ((field_id IN ( SELECT sf.id
   FROM (signing_fields sf
     JOIN signing_requests sr ON ((sf.signing_request_id = sr.id)))
  WHERE (sr.created_by = auth.uid()))));
create policy "Users can add fields to their requests" on public.signing_fields as PERMISSIVE for INSERT to authenticated with check ((signing_request_id IN ( SELECT signing_requests.id
   FROM signing_requests
  WHERE (signing_requests.created_by = auth.uid()))));
create policy "Users can view fields for their requests" on public.signing_fields as PERMISSIVE for SELECT to authenticated using ((signing_request_id IN ( SELECT signing_requests.id
   FROM signing_requests
  WHERE (signing_requests.created_by = auth.uid()))));
create policy "Users can add recipients to their requests" on public.signing_recipients as PERMISSIVE for INSERT to authenticated with check ((signing_request_id IN ( SELECT signing_requests.id
   FROM signing_requests
  WHERE (signing_requests.created_by = auth.uid()))));
create policy "Users can update recipients for their requests" on public.signing_recipients as PERMISSIVE for UPDATE to authenticated using ((signing_request_id IN ( SELECT signing_requests.id
   FROM signing_requests
  WHERE (signing_requests.created_by = auth.uid()))));
create policy "Users can view recipients for their requests" on public.signing_recipients as PERMISSIVE for SELECT to authenticated using ((signing_request_id IN ( SELECT signing_requests.id
   FROM signing_requests
  WHERE (signing_requests.created_by = auth.uid()))));
create policy "Users can create signing requests" on public.signing_requests as PERMISSIVE for INSERT to authenticated with check ((created_by = auth.uid()));
create policy "Users can update their signing requests" on public.signing_requests as PERMISSIVE for UPDATE to authenticated using ((created_by = auth.uid()));
create policy "Users can view signing requests they created" on public.signing_requests as PERMISSIVE for SELECT to authenticated using ((created_by = auth.uid()));
create policy "Users can insert songwriter PROs" on public.songwriter_pros as PERMISSIVE for INSERT to public with check ((EXISTS ( SELECT 1
   FROM credits c
  WHERE ((c.id = songwriter_pros.songwriter_id) AND (c.user_id = auth.uid())))));
create policy "Users can view songwriter PROs" on public.songwriter_pros as PERMISSIVE for SELECT to public using (true);
create policy "Users can insert songwriter publishers" on public.songwriter_publishers as PERMISSIVE for INSERT to public with check ((EXISTS ( SELECT 1
   FROM credits c
  WHERE ((c.id = songwriter_publishers.songwriter_id) AND (c.user_id = auth.uid())))));
create policy "Users can view songwriter publishers" on public.songwriter_publishers as PERMISSIVE for SELECT to public using (true);
create policy "Subscription plans are viewable by everyone" on public.subscription_plans as PERMISSIVE for SELECT to public using (true);
create policy "Users can delete own synced events" on public.synced_events as PERMISSIVE for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM calendar_connections
  WHERE ((calendar_connections.id = synced_events.calendar_connection_id) AND (calendar_connections.user_id = auth.uid())))));
create policy "Users can insert own synced events" on public.synced_events as PERMISSIVE for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM calendar_connections
  WHERE ((calendar_connections.id = synced_events.calendar_connection_id) AND (calendar_connections.user_id = auth.uid())))));
create policy "Users can update own synced events" on public.synced_events as PERMISSIVE for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM calendar_connections
  WHERE ((calendar_connections.id = synced_events.calendar_connection_id) AND (calendar_connections.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM calendar_connections
  WHERE ((calendar_connections.id = synced_events.calendar_connection_id) AND (calendar_connections.user_id = auth.uid())))));
create policy "Users can view own synced events" on public.synced_events as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM calendar_connections
  WHERE ((calendar_connections.id = synced_events.calendar_connection_id) AND (calendar_connections.user_id = auth.uid())))));
create policy auth_all_task_comments on public.task_comments as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy auth_all_tasks on public.tasks as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Admins can manage invitations" on public.team_invitations as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])))))) with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text]))))));
create policy "Admins can view all invitations" on public.team_invitations as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text]))))));
create policy "team_members: owner can insert" on public.team_members as PERMISSIVE for INSERT to public with check ((EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = team_members.team_id) AND (t.owner_id = auth.uid())))));
create policy "team_members: self can select" on public.team_members as PERMISSIVE for SELECT to public using ((user_id = auth.uid()));
create policy "teams: owner can insert" on public.teams as PERMISSIVE for INSERT to public with check ((owner_id = auth.uid()));
create policy "teams: owner can update" on public.teams as PERMISSIVE for UPDATE to public using ((owner_id = auth.uid())) with check ((owner_id = auth.uid()));
create policy "teams: owner or member can select" on public.teams as PERMISSIVE for SELECT to public using (((owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM team_members m
  WHERE ((m.team_id = teams.id) AND (m.user_id = auth.uid()))))));
create policy "Authenticated users can manage tour days" on public.tour_days as PERMISSIVE for ALL to public using ((auth.uid() IS NOT NULL));
create policy "Users can view all tour days" on public.tour_days as PERMISSIVE for SELECT to public using (true);
create policy "Authenticated users can manage tours" on public.tours as PERMISSIVE for ALL to public using ((auth.uid() IS NOT NULL));
create policy "Users can view all tours" on public.tours as PERMISSIVE for SELECT to public using (true);
create policy "Anonymous users can view tracks in public playlists" on public.tracks as PERMISSIVE for SELECT to anon using ((EXISTS ( SELECT 1
   FROM (playlist_tracks pt
     JOIN playlists p ON ((p.id = pt.playlist_id)))
  WHERE ((pt.track_id = tracks.id) AND (p.is_public = true)))));
create policy "Users can delete their own tracks" on public.tracks as PERMISSIVE for DELETE to public using ((auth.uid() = user_id));
create policy "Users can insert their own tracks" on public.tracks as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own tracks" on public.tracks as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own tracks" on public.tracks as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy auth_all_transportation on public.transportation as PERMISSIVE for ALL to authenticated using (true) with check (true);
create policy "Admins can manage permissions" on public.user_permissions as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])))))) with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text]))))));
create policy "Admins can view all permissions" on public.user_permissions as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text]))))));
create policy "Users can view their own permissions" on public.user_permissions as PERMISSIVE for SELECT to authenticated using ((user_id = auth.uid()));
create policy "Users can update their own subscriptions" on public.user_subscriptions as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own subscriptions" on public.user_subscriptions as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Admins can delete users" on public.users as PERMISSIVE for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.id = auth.uid()) AND (users_1.role = ANY (ARRAY['admin'::text, 'artist_manager'::text]))))));
create policy "Admins can insert users directly" on public.users as PERMISSIVE for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.id = auth.uid()) AND (users_1.role = ANY (ARRAY['admin'::text, 'artist_manager'::text]))))));
create policy "Admins can update any user" on public.users as PERMISSIVE for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.id = auth.uid()) AND (users_1.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])))))) with check ((EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.id = auth.uid()) AND (users_1.role = ANY (ARRAY['admin'::text, 'artist_manager'::text]))))));
create policy "Allow insert for new users" on public.users as PERMISSIVE for INSERT to public with check (true);
create policy "Authenticated users can view all users" on public.users as PERMISSIVE for SELECT to authenticated using (true);
create policy "Users can update own profile" on public.users as PERMISSIVE for UPDATE to authenticated using ((auth.uid() = id)) with check ((auth.uid() = id));
create policy "Users can update their own profile" on public.users as PERMISSIVE for UPDATE to authenticated using ((id = auth.uid())) with check ((id = auth.uid()));
create policy "Users can view all users" on public.users as PERMISSIVE for SELECT to authenticated using (true);
create policy "Authenticated users can delete venues" on public.venues as PERMISSIVE for DELETE to authenticated using (true);
create policy "Authenticated users can insert venues" on public.venues as PERMISSIVE for INSERT to authenticated with check (true);
create policy "Authenticated users can update venues" on public.venues as PERMISSIVE for UPDATE to authenticated using (true) with check (true);
create policy "Authenticated users can view all venues" on public.venues as PERMISSIVE for SELECT to authenticated using (true);
create policy "Users can create YouTube channel analytics" on public.youtube_channel_analytics as PERMISSIVE for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_channel_analytics.integration_id))));
create policy "Users can update YouTube channel analytics" on public.youtube_channel_analytics as PERMISSIVE for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_channel_analytics.integration_id)))) with check ((EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_channel_analytics.integration_id))));
create policy "Users can view their YouTube channel analytics" on public.youtube_channel_analytics as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_channel_analytics.integration_id))));
create policy "Users can create YouTube video analytics" on public.youtube_video_analytics as PERMISSIVE for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_video_analytics.integration_id))));
create policy "Users can update YouTube video analytics" on public.youtube_video_analytics as PERMISSIVE for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_video_analytics.integration_id)))) with check ((EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_video_analytics.integration_id))));
create policy "Users can view their YouTube video analytics" on public.youtube_video_analytics as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_video_analytics.integration_id))));
