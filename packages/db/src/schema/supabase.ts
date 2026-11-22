// Generated from the Supabase snapshot (supabase/snapshot/public.sql) — see scripts/fix-pulled-schema.ts.
import {
  pgTable,
  index,
  foreignKey,
  unique,
  pgPolicy,
  uuid,
  text,
  boolean,
  timestamp,
  numeric,
  date,
  integer,
  check,
  jsonb,
  time,
  bigint,
  uniqueIndex,
  interval,
  primaryKey,
  pgSequence,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { pgSchema } from 'drizzle-orm/pg-core';

// Supabase Auth users. TODO(auth): replace with the Better Auth user table (migration step 3).
export const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', { id: uuid().primaryKey() });

export const healthIdSeq = pgSequence('_health_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '2147483647',
  cache: '1',
  cycle: false,
});
export const emailDraftsIdSeq = pgSequence('email_drafts_id_seq', {
  startWith: '1',
  increment: '1',
  minValue: '1',
  maxValue: '2147483647',
  cache: '1',
  cycle: false,
});

export const deprecatedPersonnelPros = pgTable(
  '_deprecated_personnel_pros',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    personnelId: uuid('personnel_id'),
    proId: uuid('pro_id'),
    ipiNumber: text('ipi_number').notNull(),
    isPrimary: boolean('is_primary').default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('personnel_pros_personnel_id_idx').using(
      'btree',
      table.personnelId.asc().nullsLast().op('uuid_ops'),
    ),
    index('personnel_pros_pro_id_idx').using('btree', table.proId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.personnelId],
      foreignColumns: [deprecatedPersonnelProfiles.id],
      name: 'personnel_pros_personnel_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.proId],
      foreignColumns: [deprecatedPerformanceRightsOrganizations.id],
      name: 'personnel_pros_pro_id_fkey',
    }).onDelete('cascade'),
    unique('personnel_pros_personnel_id_pro_id_key').on(table.personnelId, table.proId),
    pgPolicy('Users can delete their own personnel PROs', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_pros.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid()))))`,
    }),
    pgPolicy('Users can insert their own personnel PROs', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own personnel PROs', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view personnel PROs', { as: 'permissive', for: 'select', to: ['public'] }),
  ],
);

export const deprecatedPersonnelPublishers = pgTable(
  '_deprecated_personnel_publishers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    personnelId: uuid('personnel_id'),
    publisherId: uuid('publisher_id'),
    ipiNumber: text('ipi_number').notNull(),
    isPrimary: boolean('is_primary').default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('personnel_publishers_personnel_id_idx').using(
      'btree',
      table.personnelId.asc().nullsLast().op('uuid_ops'),
    ),
    index('personnel_publishers_publisher_id_idx').using(
      'btree',
      table.publisherId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.personnelId],
      foreignColumns: [deprecatedPersonnelProfiles.id],
      name: 'personnel_publishers_personnel_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.publisherId],
      foreignColumns: [deprecatedPublishers.id],
      name: 'personnel_publishers_publisher_id_fkey',
    }).onDelete('cascade'),
    unique('personnel_publishers_personnel_id_publisher_id_key').on(
      table.personnelId,
      table.publisherId,
    ),
    pgPolicy('Users can delete their own personnel publishers', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(EXISTS ( SELECT 1
   FROM _deprecated_personnel_profiles
  WHERE ((_deprecated_personnel_profiles.id = _deprecated_personnel_publishers.personnel_id) AND (_deprecated_personnel_profiles.user_id = auth.uid()))))`,
    }),
    pgPolicy('Users can insert their own personnel publishers', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own personnel publishers', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view personnel publishers', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
  ],
);

export const deprecatedPersonnel = pgTable(
  '_deprecated_personnel',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    role: text().notNull(),
    email: text().default(sql`''::text`),
    phone: text().default(sql`''::text`),
    company: text().default(sql`''::text`),
    rate: numeric({ precision: 10, scale: 2 }).default('0'),
    rateType: text('rate_type').default('Fixed'),
    notes: text().default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    pgPolicy('auth_all_personnel', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const deprecatedPublishers = pgTable(
  '_deprecated_publishers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    ipiNumber: text('ipi_number'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
  },
  (table) => [
    index('publisher_name_idx').using('btree', table.name.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'publishers_user_id_fkey',
    }),
    unique('publishers_ipi_number_key').on(table.ipiNumber),
    pgPolicy('Users can insert their own publishers', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own publishers', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view publishers', { as: 'permissive', for: 'select', to: ['public'] }),
  ],
);

export const accommodations = pgTable(
  'accommodations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id').notNull(),
    hotelName: text('hotel_name').notNull(),
    address: text().notNull(),
    checkInDate: date('check_in_date').notNull(),
    checkOutDate: date('check_out_date').notNull(),
    rooms: integer().default(1),
    cost: numeric({ precision: 10, scale: 2 }).default('0'),
    confirmationNumber: text('confirmation_number').default(sql`''::text`),
    notes: text().default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_accommodations_show_id').using(
      'btree',
      table.showId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'accommodations_show_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('auth_all_accommodations', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const albumTracks = pgTable(
  'album_tracks',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    albumId: uuid('album_id').notNull(),
    trackId: uuid('track_id').notNull(),
    trackNumber: integer('track_number').notNull(),
    discNumber: integer('disc_number').default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('album_tracks_album_id_idx').using(
      'btree',
      table.albumId.asc().nullsLast().op('uuid_ops'),
    ),
    index('album_tracks_track_id_idx').using(
      'btree',
      table.trackId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.albumId],
      foreignColumns: [albums.id],
      name: 'album_tracks_album_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.trackId],
      foreignColumns: [tracks.id],
      name: 'album_tracks_track_id_fkey',
    }).onDelete('cascade'),
    unique('album_tracks_album_id_track_id_disc_number_track_number_key').on(
      table.albumId,
      table.trackId,
      table.trackNumber,
      table.discNumber,
    ),
    pgPolicy('Anyone can view album tracks', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
    pgPolicy('Authenticated users can delete album tracks', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    pgPolicy('Authenticated users can insert album tracks', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Authenticated users can update album tracks', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
  ],
);

export const health = pgTable(
  '_health',
  {
    id: integer()
      .default(sql`nextval('_health_id_seq'::regclass)`)
      .primaryKey()
      .notNull(),
    count: integer().default(1),
  },
  (table) => [
    pgPolicy('Health check is readable by everyone', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
  ],
);

export const analyticsIntegrations = pgTable(
  'analytics_integrations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    artistId: uuid('artist_id').notNull(),
    platform: text().notNull(),
    enabled: boolean().default(true),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true, mode: 'date' }),
    platformUserId: text('platform_user_id'),
    platformUsername: text('platform_username'),
    channelId: text('channel_id'),
    lastSync: timestamp('last_sync', { withTimezone: true, mode: 'date' }),
    syncEnabled: boolean('sync_enabled').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_analytics_integrations_artist_platform').using(
      'btree',
      table.artistId.asc().nullsLast().op('text_ops'),
      table.platform.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'analytics_integrations_artist_id_fkey',
    }).onDelete('cascade'),
    unique('analytics_integrations_artist_id_platform_key').on(table.artistId, table.platform),
    pgPolicy('Users can update their own analytics integrations', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy('Users can view their own analytics integrations', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    pgPolicy('Users can create analytics integrations', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Users can delete their own analytics integrations', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    check(
      'analytics_integrations_platform_check',
      sql`platform = ANY (ARRAY['youtube'::text, 'spotify'::text, 'instagram'::text, 'twitter'::text, 'facebook'::text, 'tiktok'::text])`,
    ),
  ],
);

export const budgetItems = pgTable(
  'budget_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    budgetId: uuid('budget_id'),
    date: date().notNull(),
    description: text().notNull(),
    type: text(),
    amount: numeric().notNull(),
    category: text(),
    status: text(),
    notes: text(),
    attachments: text().array(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.budgetId],
      foreignColumns: [budgets.id],
      name: 'budget_items_budget_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'budget_items_user_id_fkey',
    }),
    pgPolicy('Users can insert their own budget items', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own budget items', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own budget items', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'budget_items_category_check',
      sql`category = ANY (ARRAY['Art'::text, 'Digital'::text, 'Marketing'::text, 'Music'::text, 'Press'::text, 'Other'::text])`,
    ),
    check(
      'budget_items_status_check',
      sql`status = ANY (ARRAY['received'::text, 'pending'::text, 'paid'::text, 'unpaid'::text])`,
    ),
    check('budget_items_type_check', sql`type = ANY (ARRAY['Expense'::text, 'Income'::text])`),
  ],
);

export const deprecatedPersonnelProfiles = pgTable(
  '_deprecated_personnel_profiles',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id'),
    type: text(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text(),
    phone: text(),
    dateOfBirth: date('date_of_birth'),
    address: text(),
    city: text(),
    state: text(),
    country: text(),
    postalCode: text('postal_code'),
    bio: text(),
    website: text(),
    socialLinks: jsonb('social_links'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('personnel_profiles_type_idx').using(
      'btree',
      table.type.asc().nullsLast().op('text_ops'),
    ),
    index('personnel_profiles_user_id_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'personnel_profiles_user_id_fkey',
    }),
    pgPolicy('Users can delete their own personnel profiles', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can insert their own personnel profiles', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own personnel profiles', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view personnel profiles', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'personnel_profiles_type_check',
      sql`type = ANY (ARRAY['songwriter'::text, 'producer'::text, 'artist'::text, 'mix_engineer'::text, 'mastering_engineer'::text])`,
    ),
  ],
);

export const artists = pgTable(
  'artists',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    bio: text().default(sql`''::text`),
    genre: text().default(sql`''::text`),
    imageUrl: text('image_url').default(sql`''::text`),
    spotifyUrl: text('spotify_url').default(sql`''::text`),
    appleMusicUrl: text('apple_music_url').default(sql`''::text`),
    instagramUrl: text('instagram_url').default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    spotifyId: text('spotify_id'),
    spotifyFollowers: integer('spotify_followers').default(0),
    spotifyPopularity: integer('spotify_popularity').default(0),
    bandsintownUrl: text('bandsintown_url'),
    songkickUrl: text('songkick_url'),
    youtubeUrl: text('youtube_url'),
    tiktokUrl: text('tiktok_url'),
    twitterUrl: text('twitter_url'),
    websiteUrl: text('website_url'),
    country: text(),
    city: text(),
    label: text(),
    managementCompany: text('management_company'),
    bookingAgency: text('booking_agency'),
    bookingAgent: text('booking_agent'),
    publicist: text(),
    workspaceId: uuid('workspace_id').notNull(),
  },
  (table) => [
    index('artists_workspace_idx').using(
      'btree',
      table.workspaceId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [teams.id],
      name: 'artists_workspace_id_fkey',
    }).onDelete('cascade'),
    unique('artists_spotify_id_key').on(table.spotifyId),
    pgPolicy('artists_delete', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`((EXISTS ( SELECT 1
   FROM teams
  WHERE ((teams.id = artists.workspace_id) AND (teams.owner_id = auth.uid())))) OR (workspace_id IS NULL))`,
    }),
    pgPolicy('artists_insert', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('artists_select', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('artists_update', { as: 'permissive', for: 'update', to: ['public'] }),
  ],
);

export const albums = pgTable(
  'albums',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    artist: text().notNull(),
    releaseDate: date('release_date'),
    format: text(),
    label: text(),
    distributor: text(),
    status: text().default('draft'),
    genres: text().array(),
    upc: text(),
    artworkUrl: text('artwork_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
    spotifyId: text('spotify_id'),
    spotifyUrl: text('spotify_url').default(sql`''::text`),
    totalTracks: integer('total_tracks').default(0),
    genresArray: text('genres_array')
      .array()
      .default(sql`ARRAY[]::text[]`),
    artistId: uuid('artist_id'),
    notes: text(),
    holdUntil: date('hold_until'),
    demoStatus: text('demo_status'),
    artistContacts: jsonb('artist_contacts').default(sql`'[]'::jsonb`),
    artistProjects: jsonb('artist_projects')
      .default(sql`'[]'::jsonb`)
      .notNull(),
  },
  (table) => [
    index('idx_albums_artist_id').using('btree', table.artistId.asc().nullsLast().op('uuid_ops')),
    index('idx_albums_spotify_id').using('btree', table.spotifyId.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'albums_artist_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'albums_user_id_fkey',
    }),
    unique('albums_spotify_id_key').on(table.spotifyId),
    pgPolicy('Anonymous users can view albums in public playlists', {
      as: 'permissive',
      for: 'select',
      to: ['anon'],
      using: sql`(EXISTS ( SELECT 1
   FROM ((album_tracks at2
     JOIN playlist_tracks pt ON ((pt.track_id = at2.track_id)))
     JOIN playlists p ON ((p.id = pt.playlist_id)))
  WHERE ((at2.album_id = albums.id) AND (p.is_public = true))))`,
    }),
    pgPolicy('Users can delete their own albums', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
    }),
    pgPolicy('Users can insert their own albums', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own albums', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own albums', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'albums_demo_status_check',
      sql`demo_status = ANY (ARRAY['demo'::text, 'mix'::text, 'master'::text, 'on_hold'::text])`,
    ),
    check(
      'albums_format_check',
      sql`format = ANY (ARRAY['Single'::text, 'EP'::text, 'Album'::text])`,
    ),
  ],
);

export const contactFiles = pgTable(
  'contact_files',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    contactId: uuid('contact_id').notNull(),
    userId: uuid('user_id').notNull(),
    fileName: text('file_name').notNull(),
    fileType: text('file_type')
      .default(sql`''::text`)
      .notNull(),
    filePath: text('file_path').notNull(),
    fileSize: integer('file_size'),
    description: text(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('contact_files_contact_id_idx').using(
      'btree',
      table.contactId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.contactId],
      foreignColumns: [contacts.id],
      name: 'contact_files_contact_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'contact_files_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('contact_files_all', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
      withCheck: sql`(auth.uid() = user_id)`,
    }),
  ],
);

export const contactAffiliations = pgTable(
  'contact_affiliations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    workspaceId: uuid('workspace_id').notNull(),
    contactId: uuid('contact_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    role: text().notNull(),
    roleCustom: text('role_custom'),
    title: text(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    notes: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('caff_contact_idx').using('btree', table.contactId.asc().nullsLast().op('uuid_ops')),
    index('caff_org_idx').using('btree', table.organizationId.asc().nullsLast().op('uuid_ops')),
    index('caff_ws_idx').using('btree', table.workspaceId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.contactId],
      foreignColumns: [contacts.id],
      name: 'contact_affiliations_contact_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'contact_affiliations_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [teams.id],
      name: 'contact_affiliations_workspace_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('caff_delete', { as: 'permissive', for: 'delete', to: ['public'], using: sql`true` }),
    pgPolicy('caff_insert', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('caff_select', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('caff_update', { as: 'permissive', for: 'update', to: ['public'] }),
  ],
);

export const calendarConnections = pgTable(
  'calendar_connections',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    provider: text().notNull(),
    providerAccountId: text('provider_account_id'),
    accountName: text('account_name').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true, mode: 'date' }),
    icalUrl: text('ical_url'),
    syncEnabled: boolean('sync_enabled').default(true).notNull(),
    twoWaySync: boolean('two_way_sync').default(false).notNull(),
    notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true, mode: 'date' }),
    syncError: text('sync_error'),
    color: text().default('#4285F4'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_calendar_connections_provider')
      .using('btree', table.provider.asc().nullsLast().op('text_ops'))
      .where(sql`(sync_enabled = true)`),
    index('idx_calendar_connections_user_id').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'calendar_connections_user_id_fkey',
    }).onDelete('cascade'),
    unique('calendar_connections_user_id_provider_provider_account_id_key').on(
      table.userId,
      table.provider,
      table.providerAccountId,
    ),
    pgPolicy('Users can delete own calendar connections', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can insert own calendar connections', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update own calendar connections', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view own calendar connections', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'calendar_connections_provider_check',
      sql`provider = ANY (ARRAY['google'::text, 'ical'::text, 'outlook'::text])`,
    ),
    check(
      'valid_google_config',
      sql`(provider <> 'google'::text) OR ((access_token IS NOT NULL) AND (refresh_token IS NOT NULL))`,
    ),
    check('valid_ical_config', sql`(provider <> 'ical'::text) OR (ical_url IS NOT NULL)`),
    check(
      'valid_outlook_config',
      sql`(provider <> 'outlook'::text) OR ((access_token IS NOT NULL) AND (refresh_token IS NOT NULL))`,
    ),
  ],
);

export const budgets = pgTable(
  'budgets',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    type: text(),
    title: text().notNull(),
    artist: text().notNull(),
    status: text().default('planning'),
    releaseType: text('release_type'),
    releaseDate: date('release_date'),
    showDate: date('show_date'),
    venue: text(),
    city: text(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
    bookingAgentCommissionRate: numeric('booking_agent_commission_rate').default('10.0'),
    managementCommissionRate: numeric('management_commission_rate').default('20.0'),
    applyCommissions: boolean('apply_commissions').default(false),
    artistId: uuid('artist_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'budgets_artist_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'budgets_user_id_fkey',
    }),
    pgPolicy('Users can insert their own budgets', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own budgets', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own budgets', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'budgets_booking_agent_commission_rate_check',
      sql`(booking_agent_commission_rate >= (0)::numeric) AND (booking_agent_commission_rate <= (100)::numeric)`,
    ),
    check(
      'budgets_management_commission_rate_check',
      sql`(management_commission_rate >= (0)::numeric) AND (management_commission_rate <= (100)::numeric)`,
    ),
    check(
      'budgets_release_type_check',
      sql`release_type = ANY (ARRAY['single'::text, 'ep'::text, 'album'::text])`,
    ),
    check(
      'budgets_status_check',
      sql`status = ANY (ARRAY['planning'::text, 'in_progress'::text, 'completed'::text])`,
    ),
    check(
      'budgets_type_check',
      sql`type = ANY (ARRAY['release'::text, 'show'::text, 'tour'::text])`,
    ),
  ],
);

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    title: text().notNull(),
    description: text(),
    eventType: text('event_type').default('show').notNull(),
    startDate: date('start_date').notNull(),
    startTime: time('start_time'),
    endDate: date('end_date'),
    endTime: time('end_time'),
    location: text(),
    color: text().default('#3B82F6'),
    tags: text()
      .array()
      .default(sql`ARRAY[]::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_calendar_events_date_range').using(
      'btree',
      table.startDate.asc().nullsLast().op('date_ops'),
      table.endDate.asc().nullsLast().op('date_ops'),
    ),
    index('idx_calendar_events_start_date').using(
      'btree',
      table.startDate.asc().nullsLast().op('date_ops'),
    ),
    index('idx_calendar_events_user_id').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'calendar_events_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can delete own calendar events', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can insert own calendar events', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update own calendar events', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view own calendar events', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'calendar_events_event_type_check',
      sql`event_type = ANY (ARRAY['show'::text, 'release'::text, 'other'::text, 'task'::text, 'travel_accommodation'::text])`,
    ),
  ],
);

export const contactPaymentInfo = pgTable(
  'contact_payment_info',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    contactId: uuid('contact_id').notNull(),
    userId: uuid('user_id').notNull(),
    bankName: text('bank_name'),
    accountHolderName: text('account_holder_name'),
    routingNumber: text('routing_number'),
    accountNumber: text('account_number'),
    accountType: text('account_type'),
    swiftCode: text('swift_code'),
    iban: text(),
    bankAddress: text('bank_address'),
    paypalEmail: text('paypal_email'),
    venmoHandle: text('venmo_handle'),
    zelleContact: text('zelle_contact'),
    taxId: text('tax_id'),
    w9OnFile: boolean('w9_on_file').default(false).notNull(),
    w9FileUrl: text('w9_file_url'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('contact_payment_info_contact_id_idx').using(
      'btree',
      table.contactId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.contactId],
      foreignColumns: [contacts.id],
      name: 'contact_payment_info_contact_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'contact_payment_info_user_id_fkey',
    }).onDelete('cascade'),
    unique('contact_payment_info_contact_id_key').on(table.contactId),
    pgPolicy('payment_info_all', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    check(
      'contact_payment_info_account_type_check',
      sql`account_type = ANY (ARRAY['checking'::text, 'savings'::text])`,
    ),
  ],
);

export const contacts = pgTable(
  'contacts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    category: text().notNull(),
    role: text(),
    firstName: text('first_name')
      .default(sql`''::text`)
      .notNull(),
    lastName: text('last_name')
      .default(sql`''::text`)
      .notNull(),
    profilePhotoUrl: text('profile_photo_url'),
    email: text(),
    phone: text(),
    website: text(),
    homeAirport: text('home_airport'),
    seatingPreference: text('seating_preference'),
    address: text(),
    city: text(),
    state: text(),
    country: text(),
    postalCode: text('postal_code'),
    socialLinks: jsonb('social_links')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    proAffiliations: jsonb('pro_affiliations')
      .default(sql`'[]'::jsonb`)
      .notNull(),
    publisherAffiliations: jsonb('publisher_affiliations')
      .default(sql`'[]'::jsonb`)
      .notNull(),
    bio: text(),
    notes: text(),
    tags: text()
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    dateOfBirth: date('date_of_birth'),
    workspaceId: uuid('workspace_id').notNull(),
    visibility: text().default('workspace').notNull(),
  },
  (table) => [
    index('contacts_user_id_idx').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    index('contacts_workspace_idx').using(
      'btree',
      table.workspaceId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'contacts_user_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [teams.id],
      name: 'contacts_workspace_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('contacts_delete', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('contacts_insert', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('contacts_select', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('contacts_update', { as: 'permissive', for: 'update', to: ['public'] }),
    check(
      'contacts_category_check',
      sql`category = ANY (ARRAY['collaborator'::text, 'crew'::text, 'business'::text, 'other'::text])`,
    ),
    check(
      'contacts_seating_preference_check',
      sql`seating_preference = ANY (ARRAY['window'::text, 'aisle'::text, 'middle'::text, 'no_preference'::text])`,
    ),
    check(
      'contacts_visibility_check',
      sql`visibility = ANY (ARRAY['workspace'::text, 'private'::text])`,
    ),
  ],
);

export const digitalAssets = pgTable(
  'digital_assets',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    name: text().notNull(),
    category: text().default('other').notNull(),
    sourceType: text('source_type').default('upload').notNull(),
    fileUrl: text('file_url'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    fileSize: bigint('file_size', { mode: 'number' }),
    mimeType: text('mime_type'),
    description: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_digital_assets_entity').using(
      'btree',
      table.entityType.asc().nullsLast().op('text_ops'),
      table.entityId.asc().nullsLast().op('text_ops'),
    ),
    index('idx_digital_assets_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'digital_assets_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users delete their own assets', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users insert their own assets', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Users update their own assets', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users view their own assets', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'digital_assets_entity_type_check',
      sql`entity_type = ANY (ARRAY['album'::text, 'track'::text])`,
    ),
    check(
      'digital_assets_source_type_check',
      sql`source_type = ANY (ARRAY['upload'::text, 'gdrive'::text, 'dropbox'::text, 'sharepoint'::text, 'onedrive'::text, 'url'::text])`,
    ),
  ],
);

export const finances = pgTable(
  'finances',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    artistId: uuid('artist_id'),
    showId: uuid('show_id'),
    type: text().notNull(),
    category: text().notNull(),
    description: text().notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    date: date().notNull(),
    status: text().default('Pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_finances_artist_id').using('btree', table.artistId.asc().nullsLast().op('uuid_ops')),
    index('idx_finances_show_id').using('btree', table.showId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'finances_artist_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'finances_show_id_fkey',
    }).onDelete('set null'),
    pgPolicy('auth_all_finances', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const guestList = pgTable(
  'guest_list',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id').notNull(),
    name: text().notNull(),
    type: text().notNull(),
    quantity: integer().default(1),
    requestedBy: text('requested_by').default(sql`''::text`),
    status: text().default('pending'),
    contactInfo: text('contact_info').default(sql`''::text`),
    notes: text().default(sql`''::text`),
    ticketsSent: boolean('tickets_sent').default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_guest_list_show_id').using('btree', table.showId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'guest_list_show_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can manage guest list', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    check(
      'guest_list_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text])`,
    ),
    check(
      'guest_list_type_check',
      sql`type = ANY (ARRAY['vip'::text, 'industry'::text, 'friends_family'::text, 'media'::text, 'other'::text])`,
    ),
  ],
);

export const emailDrafts = pgTable('email_drafts', {
  id: integer()
    .default(sql`nextval('email_drafts_id_seq'::regclass)`)
    .primaryKey()
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  fromEmail: text('from_email').default('ggitlin@h-h.com.mx').notNull(),
  toEmail: text('to_email').notNull(),
  toName: text('to_name').notNull(),
  subject: text().notNull(),
  bodyHtml: text('body_html').notNull(),
  status: text().default('pending').notNull(),
  runDate: date('run_date')
    .default(sql`CURRENT_DATE`)
    .notNull(),
});

export const legalDocumentNotes = pgTable(
  'legal_document_notes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    documentId: uuid('document_id').notNull(),
    content: text().notNull(),
    authorId: uuid('author_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_legal_document_notes_author_id').using(
      'btree',
      table.authorId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_legal_document_notes_document_id').using(
      'btree',
      table.documentId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [authUsers.id],
      name: 'legal_document_notes_author_id_fkey',
    }),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [legalDocuments.id],
      name: 'legal_document_notes_document_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Authors can delete their own document notes', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`(auth.uid() = author_id)`,
    }),
    pgPolicy('Authors can update their own document notes', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Team members can create document notes', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Team members can view all document notes', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const legalDocuments = pgTable(
  'legal_documents',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    type: text(),
    status: text(),
    parties: text().array().notNull(),
    effectiveDate: timestamp('effective_date', { withTimezone: true, mode: 'date' }).notNull(),
    expirationDate: timestamp('expiration_date', { withTimezone: true, mode: 'date' }),
    description: text(),
    fileName: text('file_name').notNull(),
    lastModified: timestamp('last_modified', { withTimezone: true, mode: 'date' }).defaultNow(),
    tags: text().array(),
    version: text(),
    signedBy: text('signed_by').array(),
    pendingSignatures: text('pending_signatures').array(),
    aiAnalysis: jsonb('ai_analysis'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    fileSize: bigint('file_size', { mode: 'number' }).default(0),
    createdBy: uuid('created_by'),
    artistId: uuid('artist_id'),
    fileUrl: text('file_url'),
    sourceType: text('source_type').default('upload').notNull(),
  },
  (table) => [
    index('idx_legal_documents_artist_id').using(
      'btree',
      table.artistId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_legal_documents_created_by').using(
      'btree',
      table.createdBy.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'legal_documents_artist_id_fkey',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [authUsers.id],
      name: 'legal_documents_created_by_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'legal_documents_user_id_fkey',
    }),
    pgPolicy('Team members can create legal documents', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(auth.uid() IS NOT NULL)`,
    }),
    pgPolicy('Team members can delete legal documents', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    pgPolicy('Team members can update legal documents', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Team members can view all legal documents', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    pgPolicy('Users can insert their own legal documents', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own legal documents', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own legal documents', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'legal_documents_status_check',
      sql`status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'pending_signature'::text, 'active'::text, 'expired'::text, 'terminated'::text])`,
    ),
    check(
      'legal_documents_type_check',
      sql`type = ANY (ARRAY['contract'::text, 'license'::text, 'release'::text, 'agreement'::text, 'other'::text])`,
    ),
  ],
);

export const marketingFiles = pgTable(
  'marketing_files',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    artistId: uuid('artist_id'),
    name: text().notNull(),
    type: text()
      .default(sql`''::text`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    size: bigint({ mode: 'number' }).default(0).notNull(),
    category: text().default('other').notNull(),
    description: text().default(sql`''::text`),
    fileUrl: text('file_url').default(sql`''::text`),
    shared: boolean().default(false),
    sharedWith: jsonb('shared_with').default(sql`'[]'::jsonb`),
    uploadedBy: uuid('uploaded_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    sourceType: text('source_type').default('upload').notNull(),
  },
  (table) => [
    index('idx_marketing_files_artist_id').using(
      'btree',
      table.artistId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_marketing_files_uploaded_by').using(
      'btree',
      table.uploadedBy.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'marketing_files_artist_id_fkey',
    }),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [authUsers.id],
      name: 'marketing_files_uploaded_by_fkey',
    }),
    pgPolicy('Team members can delete marketing files', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`true`,
    }),
    pgPolicy('Team members can update marketing files', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Team members can upload marketing files', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Team members can view all marketing files', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'marketing_files_category_check',
      sql`category = ANY (ARRAY['press_kit'::text, 'brand_assets'::text, 'campaign'::text, 'analytics'::text, 'other'::text])`,
    ),
  ],
);

export const credits = pgTable(
  'credits',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    entityId: uuid('entity_id').notNull(),
    entityType: text('entity_type'),
    name: text().notNull(),
    role: text(),
    masterPercentage: numeric('master_percentage'),
    publishingPercentage: numeric('publishing_percentage'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
    contactId: uuid('contact_id'),
  },
  (table) => [
    index('credits_entity_id_idx').using('btree', table.entityId.asc().nullsLast().op('uuid_ops')),
    index('credits_entity_type_idx').using(
      'btree',
      table.entityType.asc().nullsLast().op('text_ops'),
    ),
    index('credits_role_idx').using('btree', table.role.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.contactId],
      foreignColumns: [contacts.id],
      name: 'credits_contact_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'credits_user_id_fkey',
    }),
    pgPolicy('Users can view their own credits', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Anyone can view credits', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('Authenticated users can delete credits', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    pgPolicy('Authenticated users can insert credits', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Authenticated users can update credits', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can insert their own credits', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own credits', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    check(
      'credits_entity_type_check',
      sql`entity_type = ANY (ARRAY['album'::text, 'track'::text])`,
    ),
    check(
      'credits_role_check',
      sql`role = ANY (ARRAY['artist'::text, 'producer'::text, 'songwriter'::text, 'mix_engineer'::text, 'mastering_engineer'::text])`,
    ),
  ],
);

export const marketingCampaigns = pgTable(
  'marketing_campaigns',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    artistId: uuid('artist_id'),
    albumId: uuid('album_id'),
    title: text().notNull(),
    type: text().notNull(),
    platform: text().default(sql`''::text`),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    budget: numeric({ precision: 10, scale: 2 }).default('0'),
    status: text().default('Planning'),
    notes: text().default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_marketing_campaigns_artist_id').using(
      'btree',
      table.artistId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.albumId],
      foreignColumns: [albums.id],
      name: 'marketing_campaigns_album_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'marketing_campaigns_artist_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('auth_all_marketing_campaigns', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const onboarding = pgTable(
  'onboarding',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    completed: boolean().default(false),
    currentStep: integer('current_step').default(1),
    stepsCompleted: jsonb('steps_completed').default(sql`'[]'::jsonb`),
    artistId: uuid('artist_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'onboarding_artist_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'onboarding_user_id_fkey',
    }).onDelete('cascade'),
    unique('onboarding_user_id_key').on(table.userId),
    pgPolicy('Users can insert own onboarding', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update own onboarding', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view own onboarding', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const platformMetrics = pgTable(
  'platform_metrics',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    platformAccountId: uuid('platform_account_id'),
    date: date().notNull(),
    metricType: text('metric_type').notNull(),
    value: numeric().notNull(),
    metadata: jsonb(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
  },
  (table) => [
    index('platform_metrics_date_idx').using('btree', table.date.asc().nullsLast().op('date_ops')),
    index('platform_metrics_platform_account_id_idx').using(
      'btree',
      table.platformAccountId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.platformAccountId],
      foreignColumns: [platformAccounts.id],
      name: 'platform_metrics_platform_account_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'platform_metrics_user_id_fkey',
    }),
    pgPolicy('Users can insert their own platform metrics', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can view their own platform metrics', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'platform_metrics_metric_type_check',
      sql`metric_type = ANY (ARRAY['followers'::text, 'monthly_listeners'::text, 'plays'::text, 'views'::text, 'subscribers'::text, 'likes'::text, 'comments'::text, 'shares'::text, 'reach'::text, 'engagement_rate'::text, 'mentions'::text])`,
    ),
  ],
);

export const platformIntegrations = pgTable(
  'platform_integrations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    artistId: uuid('artist_id').notNull(),
    platform: text().notNull(),
    enabled: boolean().default(true),
    apiKey: text('api_key'),
    artistName: text('artist_name'),
    platformArtistId: text('platform_artist_id'),
    lastSync: timestamp('last_sync', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_platform_integrations_artist_platform').using(
      'btree',
      table.artistId.asc().nullsLast().op('text_ops'),
      table.platform.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'platform_integrations_artist_id_fkey',
    }).onDelete('cascade'),
    unique('platform_integrations_artist_id_platform_key').on(table.artistId, table.platform),
    pgPolicy('Authenticated users can create platform integrations', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`true`,
    }),
    pgPolicy('Authenticated users can delete platform integrations', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    pgPolicy('Authenticated users can update platform integrations', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Authenticated users can view platform integrations', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'platform_integrations_platform_check',
      sql`platform = ANY (ARRAY['bandsintown'::text, 'songkick'::text])`,
    ),
  ],
);

export const marketingTasks = pgTable(
  'marketing_tasks',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id').notNull(),
    taskKey: text('task_key').notNull(),
    label: text().notNull(),
    completed: boolean().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    completedBy: text('completed_by').default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_marketing_tasks_show_id').using(
      'btree',
      table.showId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'marketing_tasks_show_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can manage marketing tasks', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const playlistTracks = pgTable(
  'playlist_tracks',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    playlistId: uuid('playlist_id').notNull(),
    trackId: uuid('track_id').notNull(),
    position: integer().default(0).notNull(),
    addedAt: timestamp('added_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    addedBy: uuid('added_by'),
  },
  (table) => [
    index('idx_playlist_tracks_playlist').using(
      'btree',
      table.playlistId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.addedBy],
      foreignColumns: [authUsers.id],
      name: 'playlist_tracks_added_by_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.playlistId],
      foreignColumns: [playlists.id],
      name: 'playlist_tracks_playlist_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.trackId],
      foreignColumns: [tracks.id],
      name: 'playlist_tracks_track_id_fkey',
    }).onDelete('cascade'),
    unique('playlist_tracks_playlist_id_track_id_key').on(table.playlistId, table.trackId),
    pgPolicy('Anonymous users can view tracks in public playlists', {
      as: 'permissive',
      for: 'select',
      to: ['anon'],
      using: sql`(EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.is_public = true))))`,
    }),
    pgPolicy('Anyone can view tracks in public playlists', {
      as: 'permissive',
      for: 'select',
      to: ['anon', 'authenticated'],
    }),
    pgPolicy('Users can add tracks to own playlists', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Users can remove tracks from own playlists', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update tracks in own playlists', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view tracks in own playlists', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const playlists = pgTable(
  'playlists',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    userId: uuid('user_id').notNull(),
    isPublic: boolean('is_public').default(false),
    passwordHash: text('password_hash'),
    shareToken: uuid('share_token').defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    coverUrl: text('cover_url'),
    creatorContacts: jsonb('creator_contacts').default(sql`'[]'::jsonb`),
    creatorProjects: jsonb('creator_projects')
      .default(sql`'[]'::jsonb`)
      .notNull(),
  },
  (table) => [
    index('idx_playlists_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'playlists_user_id_fkey',
    }).onDelete('cascade'),
    unique('playlists_share_token_key').on(table.shareToken),
    pgPolicy('Anonymous users can view public playlists', {
      as: 'permissive',
      for: 'select',
      to: ['anon'],
      using: sql`(is_public = true)`,
    }),
    pgPolicy('Public playlists viewable by all', {
      as: 'permissive',
      for: 'select',
      to: ['anon', 'authenticated'],
    }),
    pgPolicy('Users can create own playlists', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Users can delete own playlists', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update own playlists', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view own playlists', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const platformAccounts = pgTable(
  'platform_accounts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    platform: text().notNull(),
    accountName: text('account_name').notNull(),
    accountId: text('account_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true, mode: 'date' }),
    isConnected: boolean('is_connected').default(false),
    metadata: jsonb(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'platform_accounts_user_id_fkey',
    }),
    pgPolicy('Users can insert their own platform accounts', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own platform accounts', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own platform accounts', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'platform_accounts_platform_check',
      sql`platform = ANY (ARRAY['spotify'::text, 'apple_music'::text, 'youtube'::text, 'instagram'::text, 'facebook'::text, 'twitter'::text, 'tiktok'::text])`,
    ),
  ],
);

export const marketingPosts = pgTable(
  'marketing_posts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    artistId: uuid('artist_id'),
    title: text().notNull(),
    content: text()
      .default(sql`''::text`)
      .notNull(),
    platform: text().notNull(),
    scheduledDate: date('scheduled_date').notNull(),
    scheduledTime: time('scheduled_time').default('12:00:00').notNull(),
    status: text().default('draft').notNull(),
    mediaUrl: text('media_url').default(sql`''::text`),
    tags: jsonb().default(sql`'[]'::jsonb`),
    authorId: uuid('author_id'),
    done: boolean().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_marketing_posts_artist_id').using(
      'btree',
      table.artistId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_marketing_posts_author_id').using(
      'btree',
      table.authorId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_marketing_posts_scheduled_date').using(
      'btree',
      table.scheduledDate.asc().nullsLast().op('date_ops'),
    ),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'marketing_posts_artist_id_fkey',
    }),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [authUsers.id],
      name: 'marketing_posts_author_id_fkey',
    }),
    pgPolicy('Team members can create marketing posts', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(auth.uid() IS NOT NULL)`,
    }),
    pgPolicy('Team members can delete marketing posts', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    pgPolicy('Team members can update marketing posts', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Team members can view all marketing posts', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'marketing_posts_platform_check',
      sql`platform = ANY (ARRAY['instagram'::text, 'twitter'::text, 'facebook'::text, 'youtube'::text, 'tiktok'::text])`,
    ),
    check(
      'marketing_posts_status_check',
      sql`status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'failed'::text])`,
    ),
  ],
);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    workspaceId: uuid('workspace_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    name: text().notNull(),
    type: text().notNull(),
    parentOrgId: uuid('parent_org_id'),
    website: text(),
    email: text(),
    phone: text(),
    address: text(),
    city: text(),
    state: text(),
    country: text(),
    postalCode: text('postal_code'),
    logoUrl: text('logo_url'),
    bio: text(),
    notes: text(),
    tags: text()
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    socialLinks: jsonb('social_links')
      .default(sql`'{}'::jsonb`)
      .notNull(),
    visibility: text().default('workspace').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('organizations_parent_idx').using(
      'btree',
      table.parentOrgId.asc().nullsLast().op('uuid_ops'),
    ),
    index('organizations_type_idx').using('btree', table.type.asc().nullsLast().op('text_ops')),
    index('organizations_workspace_idx').using(
      'btree',
      table.workspaceId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [authUsers.id],
      name: 'organizations_created_by_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.parentOrgId],
      foreignColumns: [table.id],
      name: 'organizations_parent_org_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [teams.id],
      name: 'organizations_workspace_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('orgs_delete', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(created_by = auth.uid())`,
    }),
    pgPolicy('orgs_insert', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('orgs_select', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('orgs_update', { as: 'permissive', for: 'update', to: ['public'] }),
    check(
      'organizations_type_check',
      sql`type = ANY (ARRAY['label'::text, 'publisher'::text, 'management'::text, 'booking'::text, 'distributor'::text, 'pr'::text, 'marketing'::text, 'law'::text, 'accounting'::text, 'studio'::text, 'venue'::text, 'festival'::text, 'promoter'::text, 'sync'::text, 'pro'::text, 'mech_rights'::text, 'merch'::text, 'brand'::text, 'other'::text])`,
    ),
    check(
      'organizations_visibility_check',
      sql`visibility = ANY (ARRAY['workspace'::text, 'private'::text])`,
    ),
  ],
);

export const notes = pgTable(
  'notes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    content: text().notNull(),
    category: text(),
    color: text(),
    minimized: boolean().default(false),
    tags: text().array(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
    gridX: integer('grid_x').default(0),
    gridY: integer('grid_y').default(0),
    gridWidth: integer('grid_width').default(1),
    gridHeight: integer('grid_height').default(1),
    title: text().default(sql`''::text`),
    artistId: uuid('artist_id'),
    showId: uuid('show_id'),
  },
  (table) => [
    index('idx_notes_user_id').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'notes_user_id_fkey',
    }),
    pgPolicy('Users can delete their own notes', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can insert their own notes', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own notes', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own notes', { as: 'permissive', for: 'select', to: ['public'] }),
    check(
      'notes_category_check',
      sql`category = ANY (ARRAY['todo'::text, 'meeting'::text, 'idea'::text, 'other'::text])`,
    ),
  ],
);

export const productionFiles = pgTable(
  'production_files',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id').notNull(),
    name: text().notNull(),
    type: text().notNull(),
    fileUrl: text('file_url').default(sql`''::text`),
    version: text().default('1.0'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    uploadedBy: text('uploaded_by').default(sql`''::text`),
    notes: text().default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    sourceType: text('source_type').default('upload').notNull(),
  },
  (table) => [
    index('idx_production_files_show_id').using(
      'btree',
      table.showId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'production_files_show_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can manage production files', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    check(
      'production_files_type_check',
      sql`type = ANY (ARRAY['tech_rider'::text, 'hospitality_rider'::text, 'stage_plot'::text, 'input_list'::text, 'backline'::text, 'contract'::text, 'other'::text])`,
    ),
  ],
);

export const setlists = pgTable(
  'setlists',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id').notNull(),
    status: text().default('draft'),
    notes: text().default(sql`''::text`),
    lastUpdated: timestamp('last_updated', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedBy: text('updated_by').default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_setlists_show_id').using('btree', table.showId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'setlists_show_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can manage setlists', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    check(
      'setlists_status_check',
      sql`status = ANY (ARRAY['draft'::text, 'proposed'::text, 'final'::text, 'archived'::text])`,
    ),
  ],
);

export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    workspaceId: uuid('workspace_id').notNull(),
    projectId: uuid('project_id').notNull(),
    userId: uuid('user_id').notNull(),
    access: text().default('edit').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('pm_project_idx').using('btree', table.projectId.asc().nullsLast().op('uuid_ops')),
    index('pm_user_idx').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [artists.id],
      name: 'project_members_project_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'project_members_user_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [teams.id],
      name: 'project_members_workspace_id_fkey',
    }).onDelete('cascade'),
    unique('project_members_project_id_user_id_key').on(table.projectId, table.userId),
    pgPolicy('pm_owner_write', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = project_members.workspace_id) AND (t.owner_id = auth.uid()))))`,
      withCheck: sql`(EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = project_members.workspace_id) AND (t.owner_id = auth.uid()))))`,
    }),
    pgPolicy('pm_self_or_owner_select', { as: 'permissive', for: 'select', to: ['public'] }),
    check('project_members_access_check', sql`access = ANY (ARRAY['view'::text, 'edit'::text])`),
  ],
);

export const projectRelations = pgTable(
  'project_relations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    workspaceId: uuid('workspace_id').notNull(),
    projectId: uuid('project_id').notNull(),
    contactId: uuid('contact_id'),
    organizationId: uuid('organization_id'),
    role: text().notNull(),
    roleCustom: text('role_custom'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    notes: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('pr_contact_idx').using('btree', table.contactId.asc().nullsLast().op('uuid_ops')),
    index('pr_org_idx').using('btree', table.organizationId.asc().nullsLast().op('uuid_ops')),
    index('pr_project_idx').using('btree', table.projectId.asc().nullsLast().op('uuid_ops')),
    index('pr_ws_idx').using('btree', table.workspaceId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.contactId],
      foreignColumns: [contacts.id],
      name: 'project_relations_contact_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: 'project_relations_organization_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [artists.id],
      name: 'project_relations_project_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [teams.id],
      name: 'project_relations_workspace_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('pr_delete', { as: 'permissive', for: 'delete', to: ['public'], using: sql`true` }),
    pgPolicy('pr_insert', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('pr_select', { as: 'permissive', for: 'select', to: ['public'] }),
    pgPolicy('pr_update', { as: 'permissive', for: 'update', to: ['public'] }),
    check(
      'exactly_one_target',
      sql`((contact_id IS NOT NULL) AND (organization_id IS NULL)) OR ((contact_id IS NULL) AND (organization_id IS NOT NULL))`,
    ),
  ],
);

export const projects = pgTable(
  'projects',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    status: text().default('planning'),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
    ownerId: uuid('owner_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [profiles.id],
      name: 'projects_owner_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Project owners can update their projects', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
      using: sql`(auth.uid() = owner_id)`,
    }),
    pgPolicy('Projects are viewable by team members', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'projects_status_check',
      sql`status = ANY (ARRAY['planning'::text, 'in_progress'::text, 'completed'::text])`,
    ),
  ],
);

export const showDeals = pgTable(
  'show_deals',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id'),
    dealType: text('deal_type'),
    guarantee: numeric(),
    percentage: numeric(),
    expenses: jsonb(),
    settlement: jsonb(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
  },
  (table) => [
    index('idx_show_deals_show_id').using('btree', table.showId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'show_deals_show_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'show_deals_user_id_fkey',
    }),
    pgPolicy('Users can manage show deals', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy('Users can update their own show deals', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own show deals', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    pgPolicy('Users can insert their own show deals', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    check(
      'show_deals_deal_type_check',
      sql`deal_type = ANY (ARRAY['guarantee'::text, 'percentage'::text, 'guarantee_vs_percentage'::text])`,
    ),
  ],
);

export const signingRequests = pgTable(
  'signing_requests',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    documentId: uuid('document_id').notNull(),
    status: text().default('draft').notNull(),
    signingOrder: text('signing_order').default('parallel').notNull(),
    currentOrderStep: integer('current_order_step').default(0),
    subject: text().notNull(),
    message: text(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    signedPdfPath: text('signed_pdf_path'),
  },
  (table) => [
    index('idx_signing_requests_created_by').using(
      'btree',
      table.createdBy.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_signing_requests_document_id').using(
      'btree',
      table.documentId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_signing_requests_status').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [authUsers.id],
      name: 'signing_requests_created_by_fkey',
    }),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [legalDocuments.id],
      name: 'signing_requests_document_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can create signing requests', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(created_by = auth.uid())`,
    }),
    pgPolicy('Users can update their signing requests', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view signing requests they created', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'signing_requests_signing_order_check',
      sql`signing_order = ANY (ARRAY['parallel'::text, 'sequential'::text])`,
    ),
    check(
      'signing_requests_status_check',
      sql`status = ANY (ARRAY['draft'::text, 'pending'::text, 'completed'::text, 'voided'::text, 'expired'::text])`,
    ),
  ],
);

export const shows = pgTable(
  'shows',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text(),
    date: date(),
    showTime: time('show_time'),
    venueName: text('venue_name'),
    venueCity: text('venue_city'),
    venueCountry: text('venue_country'),
    status: text().default('pending'),
    capacity: integer(),
    ticketsSold: integer('tickets_sold'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
    venueAddress: text('venue_address').default(sql`''::text`),
    venueState: text('venue_state').default(sql`''::text`),
    venueLatitude: numeric('venue_latitude', { precision: 10, scale: 7 }),
    venueLongitude: numeric('venue_longitude', { precision: 10, scale: 7 }),
    googlePlaceId: text('google_place_id').default(sql`''::text`),
    venueId: uuid('venue_id'),
    artistId: uuid('artist_id'),
    showType: text('show_type').default('Concert'),
    tourId: uuid('tour_id'),
  },
  (table) => [
    index('idx_shows_artist_id').using('btree', table.artistId.asc().nullsLast().op('uuid_ops')),
    index('idx_shows_date').using('btree', table.date.asc().nullsLast().op('date_ops')),
    index('idx_shows_tour_id').using('btree', table.tourId.asc().nullsLast().op('uuid_ops')),
    index('idx_shows_venue_id').using('btree', table.venueId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'shows_artist_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.tourId],
      foreignColumns: [tours.id],
      name: 'shows_tour_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'shows_user_id_fkey',
    }),
    foreignKey({
      columns: [table.venueId],
      foreignColumns: [venues.id],
      name: 'shows_venue_id_fkey',
    }).onDelete('set null'),
    pgPolicy('Users can insert their own shows', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own shows', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own shows', { as: 'permissive', for: 'select', to: ['public'] }),
    check(
      'shows_status_check',
      sql`status = ANY (ARRAY['confirmed'::text, 'pending'::text, 'cancelled'::text])`,
    ),
  ],
);

export const subscriptionPlans = pgTable(
  'subscription_plans',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    type: text().notNull(),
    name: text().notNull(),
    description: text(),
    price: numeric().notNull(),
    features: text().array(),
    modules: jsonb().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('subscription_plans_type_idx').using(
      'btree',
      table.type.asc().nullsLast().op('text_ops'),
    ),
    pgPolicy('Subscription plans are viewable by everyone', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
    check(
      'subscription_plans_type_check',
      sql`type = ANY (ARRAY['artist'::text, 'manager'::text, 'label'::text, 'publisher'::text, 'producer'::text])`,
    ),
  ],
);

export const signingRecipients = pgTable(
  'signing_recipients',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    signingRequestId: uuid('signing_request_id').notNull(),
    name: text().notNull(),
    email: text().notNull(),
    role: text(),
    orderIndex: integer('order_index').default(0).notNull(),
    status: text().default('pending').notNull(),
    accessToken: uuid('access_token').defaultRandom().notNull(),
    otpCode: text('otp_code'),
    otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true, mode: 'date' }),
    otpVerified: boolean('otp_verified').default(false).notNull(),
    otpAttempts: integer('otp_attempts').default(0).notNull(),
    signedAt: timestamp('signed_at', { withTimezone: true, mode: 'date' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id'),
  },
  (table) => [
    uniqueIndex('idx_signing_recipients_access_token').using(
      'btree',
      table.accessToken.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_signing_recipients_email').using(
      'btree',
      table.email.asc().nullsLast().op('text_ops'),
    ),
    index('idx_signing_recipients_request_id').using(
      'btree',
      table.signingRequestId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.signingRequestId],
      foreignColumns: [signingRequests.id],
      name: 'signing_recipients_signing_request_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'signing_recipients_user_id_fkey',
    }),
    pgPolicy('Users can add recipients to their requests', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(signing_request_id IN ( SELECT signing_requests.id
   FROM signing_requests
  WHERE (signing_requests.created_by = auth.uid())))`,
    }),
    pgPolicy('Users can update recipients for their requests', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view recipients for their requests', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'signing_recipients_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'notified'::text, 'viewed'::text, 'signed'::text, 'declined'::text])`,
    ),
  ],
);

export const showAdvances = pgTable(
  'show_advances',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id'),
    productionManager: jsonb('production_manager'),
    venueContact: jsonb('venue_contact'),
    schedule: jsonb(),
    catering: jsonb(),
    parking: jsonb(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
  },
  (table) => [
    index('idx_show_advances_show_id').using(
      'btree',
      table.showId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'show_advances_show_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'show_advances_user_id_fkey',
    }),
    pgPolicy('Users can insert their own show advances', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can manage show advances', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update their own show advances', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own show advances', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
  ],
);

export const signingFields = pgTable(
  'signing_fields',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    signingRequestId: uuid('signing_request_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    type: text().notNull(),
    page: integer().notNull(),
    x: numeric().notNull(),
    y: numeric().notNull(),
    width: numeric().notNull(),
    height: numeric().notNull(),
    required: boolean().default(true).notNull(),
    label: text(),
  },
  (table) => [
    index('idx_signing_fields_recipient_id').using(
      'btree',
      table.recipientId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_signing_fields_request_id').using(
      'btree',
      table.signingRequestId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [signingRecipients.id],
      name: 'signing_fields_recipient_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.signingRequestId],
      foreignColumns: [signingRequests.id],
      name: 'signing_fields_signing_request_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can add fields to their requests', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(signing_request_id IN ( SELECT signing_requests.id
   FROM signing_requests
  WHERE (signing_requests.created_by = auth.uid())))`,
    }),
    pgPolicy('Users can view fields for their requests', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'signing_fields_type_check',
      sql`type = ANY (ARRAY['signature'::text, 'initial'::text, 'date'::text, 'text'::text, 'checkbox'::text])`,
    ),
  ],
);

export const signingFieldResponses = pgTable(
  'signing_field_responses',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    fieldId: uuid('field_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    value: text(),
    signatureData: text('signature_data'),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_signing_field_responses_field_id').using(
      'btree',
      table.fieldId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.fieldId],
      foreignColumns: [signingFields.id],
      name: 'signing_field_responses_field_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [signingRecipients.id],
      name: 'signing_field_responses_recipient_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can view responses for their requests', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(field_id IN ( SELECT sf.id
   FROM (signing_fields sf
     JOIN signing_requests sr ON ((sf.signing_request_id = sr.id)))
  WHERE (sr.created_by = auth.uid())))`,
    }),
  ],
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    artistId: uuid('artist_id'),
    showId: uuid('show_id'),
    title: text().notNull(),
    description: text().default(sql`''::text`),
    dueDate: date('due_date'),
    priority: text().default('Medium'),
    status: text().default('Todo'),
    assignedTo: uuid('assigned_to'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    completed: boolean().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    notes: text(),
  },
  (table) => [
    index('idx_tasks_user_id').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'tasks_artist_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [authUsers.id],
      name: 'tasks_assigned_to_fkey',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [authUsers.id],
      name: 'tasks_created_by_fkey',
    }),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'tasks_show_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'tasks_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('auth_all_tasks', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const syncedEvents = pgTable(
  'synced_events',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    calendarConnectionId: uuid('calendar_connection_id').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    title: text().notNull(),
    description: text(),
    startDate: date('start_date').notNull(),
    startTime: time('start_time'),
    endDate: date('end_date'),
    endTime: time('end_time'),
    location: text(),
    attendees: jsonb().default(sql`'[]'::jsonb`),
    timezone: text().default('UTC'),
    isAllDay: boolean('is_all_day').default(false).notNull(),
    recurringRule: text('recurring_rule'),
    rawData: jsonb('raw_data').default(sql`'{}'::jsonb`),
    lastModifiedAt: timestamp('last_modified_at', { withTimezone: true, mode: 'date' }),
    syncedAt: timestamp('synced_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_synced_events_calendar_connection').using(
      'btree',
      table.calendarConnectionId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_synced_events_date_range').using(
      'btree',
      table.startDate.asc().nullsLast().op('date_ops'),
      table.endDate.asc().nullsLast().op('date_ops'),
    ),
    index('idx_synced_events_provider_event_id').using(
      'btree',
      table.providerEventId.asc().nullsLast().op('text_ops'),
    ),
    index('idx_synced_events_start_date').using(
      'btree',
      table.startDate.asc().nullsLast().op('date_ops'),
    ),
    foreignKey({
      columns: [table.calendarConnectionId],
      foreignColumns: [calendarConnections.id],
      name: 'synced_events_calendar_connection_id_fkey',
    }).onDelete('cascade'),
    unique('synced_events_calendar_connection_id_provider_event_id_key').on(
      table.calendarConnectionId,
      table.providerEventId,
    ),
    pgPolicy('Users can delete own synced events', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`(EXISTS ( SELECT 1
   FROM calendar_connections
  WHERE ((calendar_connections.id = synced_events.calendar_connection_id) AND (calendar_connections.user_id = auth.uid()))))`,
    }),
    pgPolicy('Users can insert own synced events', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update own synced events', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view own synced events', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const showTypes = pgTable(
  'show_types',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    description: text().default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    unique('show_types_name_key').on(table.name),
    pgPolicy('auth_all_show_types', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const showPersonnel = pgTable(
  'show_personnel',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id').notNull(),
    personnelId: uuid('personnel_id').notNull(),
    fee: numeric({ precision: 10, scale: 2 }).default('0'),
    status: text().default('Pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.personnelId],
      foreignColumns: [deprecatedPersonnel.id],
      name: 'show_personnel_personnel_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'show_personnel_show_id_fkey',
    }).onDelete('cascade'),
    unique('show_personnel_show_id_personnel_id_key').on(table.showId, table.personnelId),
    pgPolicy('auth_all_show_personnel', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const taskComments = pgTable(
  'task_comments',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    taskId: uuid('task_id').notNull(),
    authorId: uuid('author_id').notNull(),
    content: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [authUsers.id],
      name: 'task_comments_author_id_fkey',
    }),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: 'task_comments_task_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('auth_all_task_comments', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const tours = pgTable(
  'tours',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    artistId: uuid('artist_id'),
    name: text().notNull(),
    description: text(),
    status: text().default('planning').notNull(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    createdBy: uuid('created_by'),
  },
  (table) => [
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: 'tours_artist_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [authUsers.id],
      name: 'tours_created_by_fkey',
    }),
    pgPolicy('Authenticated users can manage tours', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`,
    }),
    pgPolicy('Users can view all tours', { as: 'permissive', for: 'select', to: ['public'] }),
    check(
      'tours_status_check',
      sql`status = ANY (ARRAY['planning'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])`,
    ),
  ],
);

export const tracks = pgTable(
  'tracks',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    albumId: uuid('album_id'),
    discNumber: integer('disc_number').default(1),
    trackNumber: integer('track_number').notNull(),
    title: text().notNull(),
    duration: text(),
    isrc: text(),
    isrcAtmos: text('isrc_atmos'),
    isrcVideo: text('isrc_video'),
    upc: text(),
    upcAtmos: text('upc_atmos'),
    spotifyUri: text('spotify_uri'),
    appleId: text('apple_id'),
    officialVideoUrl: text('official_video_url'),
    lyricVideoUrl: text('lyric_video_url'),
    visualizerUrl: text('visualizer_url'),
    lyrics: text(),
    lyricsUrl: text('lyrics_url'),
    audioUrl: text('audio_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
    spotifyId: text('spotify_id'),
    spotifyUrl: text('spotify_url').default(sql`''::text`),
    previewUrl: text('preview_url').default(sql`''::text`),
    popularity: integer().default(0),
    explicit: boolean().default(false),
    notes: text(),
    audioVersions: jsonb('audio_versions').default(sql`'[]'::jsonb`),
    demoStatus: text('demo_status'),
    holdUntil: date('hold_until'),
  },
  (table) => [
    index('idx_tracks_spotify_id').using('btree', table.spotifyId.asc().nullsLast().op('text_ops')),
    index('tracks_isrc_idx')
      .using('btree', table.isrc.asc().nullsLast().op('text_ops'))
      .where(sql`((isrc IS NOT NULL) AND (isrc <> ''::text))`),
    uniqueIndex('tracks_isrc_unique_idx')
      .using('btree', table.isrc.asc().nullsLast().op('text_ops'))
      .where(sql`((isrc IS NOT NULL) AND (isrc <> ''::text))`),
    foreignKey({
      columns: [table.albumId],
      foreignColumns: [albums.id],
      name: 'tracks_album_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'tracks_user_id_fkey',
    }),
    unique('tracks_spotify_id_key').on(table.spotifyId),
    pgPolicy('Anonymous users can view tracks in public playlists', {
      as: 'permissive',
      for: 'select',
      to: ['anon'],
      using: sql`(EXISTS ( SELECT 1
   FROM (playlist_tracks pt
     JOIN playlists p ON ((p.id = pt.playlist_id)))
  WHERE ((pt.track_id = tracks.id) AND (p.is_public = true))))`,
    }),
    pgPolicy('Users can delete their own tracks', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
    }),
    pgPolicy('Users can insert their own tracks', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can update their own tracks', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own tracks', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'tracks_demo_status_check',
      sql`demo_status = ANY (ARRAY['demo'::text, 'mix'::text, 'master'::text, 'on_hold'::text])`,
    ),
  ],
);

export const youtubeChannelAnalytics = pgTable(
  'youtube_channel_analytics',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    integrationId: uuid('integration_id').notNull(),
    date: date().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    subscribers: bigint({ mode: 'number' }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    views: bigint({ mode: 'number' }).default(0),
    videos: integer().default(0),
    averageViewDuration: interval('average_view_duration'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    watchTimeMinutes: bigint('watch_time_minutes', { mode: 'number' }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    likes: bigint({ mode: 'number' }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    comments: bigint({ mode: 'number' }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    shares: bigint({ mode: 'number' }).default(0),
    estimatedRevenue: numeric('estimated_revenue', { precision: 10, scale: 2 }).default('0'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_youtube_channel_analytics_integration_date').using(
      'btree',
      table.integrationId.asc().nullsLast().op('date_ops'),
      table.date.desc().nullsFirst().op('date_ops'),
    ),
    foreignKey({
      columns: [table.integrationId],
      foreignColumns: [analyticsIntegrations.id],
      name: 'youtube_channel_analytics_integration_id_fkey',
    }).onDelete('cascade'),
    unique('youtube_channel_analytics_integration_id_date_key').on(table.integrationId, table.date),
    pgPolicy('Users can create YouTube channel analytics', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_channel_analytics.integration_id)))`,
    }),
    pgPolicy('Users can update YouTube channel analytics', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view their YouTube channel analytics', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const tourDays = pgTable(
  'tour_days',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tourId: uuid('tour_id').notNull(),
    date: date().notNull(),
    dayType: text('day_type').notNull(),
    showId: uuid('show_id'),
    title: text(),
    notes: text(),
    city: text(),
    country: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'tour_days_show_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.tourId],
      foreignColumns: [tours.id],
      name: 'tour_days_tour_id_fkey',
    }).onDelete('cascade'),
    unique('tour_days_tour_id_date_key').on(table.tourId, table.date),
    pgPolicy('Authenticated users can manage tour days', {
      as: 'permissive',
      for: 'all',
      to: ['public'],
      using: sql`(auth.uid() IS NOT NULL)`,
    }),
    pgPolicy('Users can view all tour days', { as: 'permissive', for: 'select', to: ['public'] }),
    check(
      'tour_days_day_type_check',
      sql`day_type = ANY (ARRAY['show'::text, 'travel'::text, 'off'::text, 'rehearsal'::text])`,
    ),
  ],
);

export const youtubeVideoAnalytics = pgTable(
  'youtube_video_analytics',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    integrationId: uuid('integration_id').notNull(),
    videoId: text('video_id').notNull(),
    title: text().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    views: bigint({ mode: 'number' }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    likes: bigint({ mode: 'number' }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    comments: bigint({ mode: 'number' }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    shares: bigint({ mode: 'number' }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    watchTimeMinutes: bigint('watch_time_minutes', { mode: 'number' }).default(0),
    averageViewDuration: interval('average_view_duration'),
    thumbnailUrl: text('thumbnail_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_youtube_video_analytics_integration').using(
      'btree',
      table.integrationId.asc().nullsLast().op('uuid_ops'),
    ),
    index('idx_youtube_video_analytics_video_id').using(
      'btree',
      table.videoId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.integrationId],
      foreignColumns: [analyticsIntegrations.id],
      name: 'youtube_video_analytics_integration_id_fkey',
    }).onDelete('cascade'),
    unique('youtube_video_analytics_integration_id_video_id_key').on(
      table.integrationId,
      table.videoId,
    ),
    pgPolicy('Users can create YouTube video analytics', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(EXISTS ( SELECT 1
   FROM analytics_integrations
  WHERE (analytics_integrations.id = youtube_video_analytics.integration_id)))`,
    }),
    pgPolicy('Users can update YouTube video analytics', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view their YouTube video analytics', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const userSubscriptions = pgTable(
  'user_subscriptions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id'),
    planId: uuid('plan_id'),
    status: text().notNull(),
    currentPeriodStart: timestamp('current_period_start', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('user_subscriptions_plan_id_idx').using(
      'btree',
      table.planId.asc().nullsLast().op('uuid_ops'),
    ),
    index('user_subscriptions_status_idx').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops'),
    ),
    index('user_subscriptions_user_id_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.planId],
      foreignColumns: [subscriptionPlans.id],
      name: 'user_subscriptions_plan_id_fkey',
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'user_subscriptions_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can update their own subscriptions', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can view their own subscriptions', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
    check(
      'user_subscriptions_status_check',
      sql`status = ANY (ARRAY['active'::text, 'trialing'::text, 'past_due'::text, 'canceled'::text, 'incomplete'::text])`,
    ),
  ],
);

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().notNull(),
    email: text().notNull(),
    fullName: text('full_name').default(sql`''::text`),
    role: text().default('viewer'),
    avatarUrl: text('avatar_url').default(sql`''::text`),
    permissions: jsonb().default(
      sql`'["view_catalog", "view_finance", "view_legal", "view_live", "view_marketing", "view_personnel", "view_sensitive_info", "edit_catalog", "edit_finance", "edit_legal", "edit_live", "edit_marketing", "edit_personnel"]'::jsonb`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [authUsers.id],
      name: 'users_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Admins can delete users', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`(EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.id = auth.uid()) AND (users_1.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])))))`,
    }),
    pgPolicy('Admins can insert users directly', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Admins can update any user', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Allow insert for new users', { as: 'permissive', for: 'insert', to: ['public'] }),
    pgPolicy('Authenticated users can view all users', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update own profile', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update their own profile', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view all users', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const transportation = pgTable(
  'transportation',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    showId: uuid('show_id').notNull(),
    type: text().notNull(),
    departureLocation: text('departure_location').notNull(),
    arrivalLocation: text('arrival_location').notNull(),
    departureTime: timestamp('departure_time', { withTimezone: true, mode: 'date' }).notNull(),
    arrivalTime: timestamp('arrival_time', { withTimezone: true, mode: 'date' }).notNull(),
    cost: numeric({ precision: 10, scale: 2 }).default('0'),
    confirmationNumber: text('confirmation_number').default(sql`''::text`),
    notes: text().default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_transportation_show_id').using(
      'btree',
      table.showId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.showId],
      foreignColumns: [shows.id],
      name: 'transportation_show_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('auth_all_transportation', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const teams = pgTable(
  'teams',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    ownerId: uuid('owner_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [authUsers.id],
      name: 'teams_owner_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('teams: owner can insert', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(owner_id = auth.uid())`,
    }),
    pgPolicy('teams: owner can update', { as: 'permissive', for: 'update', to: ['public'] }),
    pgPolicy('teams: owner or member can select', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
  ],
);

export const venues = pgTable(
  'venues',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    address: text().default(sql`''::text`),
    city: text().notNull(),
    state: text().default(sql`''::text`),
    country: text().notNull(),
    postalCode: text('postal_code').default(sql`''::text`),
    latitude: numeric({ precision: 10, scale: 7 }),
    longitude: numeric({ precision: 10, scale: 7 }),
    googlePlaceId: text('google_place_id'),
    capacity: integer().default(0),
    website: text().default(sql`''::text`),
    phone: text().default(sql`''::text`),
    isVerified: boolean('is_verified').default(false),
    usageCount: integer('usage_count').default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    email: text(),
    contacts: jsonb().default(sql`'[]'::jsonb`),
    technicalRiderUrl: text('technical_rider_url'),
    hospitalityRiderUrl: text('hospitality_rider_url'),
    stagePlotUrl: text('stage_plot_url'),
    notes: text(),
    tags: text()
      .array()
      .default(sql`'{}'::text[]`),
    parkingInfo: text('parking_info'),
    loadInInfo: text('load_in_info'),
    wifiInfo: text('wifi_info'),
    lastPlayed: date('last_played'),
  },
  (table) => [
    index('idx_venues_city').using('btree', table.city.asc().nullsLast().op('text_ops')),
    index('idx_venues_country').using('btree', table.country.asc().nullsLast().op('text_ops')),
    index('idx_venues_google_place_id').using(
      'btree',
      table.googlePlaceId.asc().nullsLast().op('text_ops'),
    ),
    index('idx_venues_name').using('btree', table.name.asc().nullsLast().op('text_ops')),
    unique('venues_google_place_id_key').on(table.googlePlaceId),
    pgPolicy('Authenticated users can delete venues', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`true`,
    }),
    pgPolicy('Authenticated users can insert venues', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Authenticated users can update venues', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    pgPolicy('Authenticated users can view all venues', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const teamInvitations = pgTable(
  'team_invitations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    role: text().default('team_member').notNull(),
    invitedBy: uuid('invited_by'),
    status: text().default('pending').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).default(
      sql`(now() + '7 days'::interval)`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [users.id],
      name: 'team_invitations_invited_by_fkey',
    }).onDelete('cascade'),
    pgPolicy('Admins can manage invitations', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])))))`,
      withCheck: sql`(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])))))`,
    }),
    pgPolicy('Admins can view all invitations', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'team_invitations_role_check',
      sql`role = ANY (ARRAY['admin'::text, 'artist_manager'::text, 'artist'::text, 'attorney'::text, 'tour_manager'::text, 'marketing_manager'::text, 'finance_manager'::text, 'team_member'::text])`,
    ),
    check(
      'team_invitations_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text])`,
    ),
  ],
);

export const contractAnalyses = pgTable(
  'contract_analyses',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    documentId: uuid('document_id'),
    title: text().notNull(),
    summary: text().notNull(),
    keyTerms: jsonb('key_terms').notNull(),
    risks: jsonb().notNull(),
    recommendations: jsonb().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
  },
  (table) => [
    index('contract_analyses_document_id_idx').using(
      'btree',
      table.documentId.asc().nullsLast().op('uuid_ops'),
    ),
    index('contract_analyses_user_id_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [legalDocuments.id],
      name: 'contract_analyses_document_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'contract_analyses_user_id_fkey',
    }),
    pgPolicy('Users can insert their own contract analyses', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own contract analyses', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view their own contract analyses', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
  ],
);

export const profiles = pgTable(
  'profiles',
  {
    id: uuid().primaryKey().notNull(),
    fullName: text('full_name'),
    avatarUrl: text('avatar_url'),
    role: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [authUsers.id],
      name: 'profiles_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Public profiles are viewable by everyone', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
    pgPolicy('Users can update their own profile', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    check(
      'profiles_role_check',
      sql`role = ANY (ARRAY['admin'::text, 'artist_manager'::text, 'artist'::text, 'team_member'::text])`,
    ),
  ],
);

export const setlistSongs = pgTable(
  'setlist_songs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    setlistId: uuid('setlist_id').notNull(),
    position: integer().notNull(),
    songTitle: text('song_title').notNull(),
    duration: text().default(sql`''::text`),
    key: text().default(sql`''::text`),
    isEncore: boolean('is_encore').default(false),
    notes: text().default(sql`''::text`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('idx_setlist_songs_setlist_id').using(
      'btree',
      table.setlistId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.setlistId],
      foreignColumns: [setlists.id],
      name: 'setlist_songs_setlist_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Users can manage setlist songs', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const signingAuditLogs = pgTable(
  'signing_audit_logs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    signingRequestId: uuid('signing_request_id').notNull(),
    recipientId: uuid('recipient_id'),
    event: text().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_signing_audit_logs_event').using(
      'btree',
      table.event.asc().nullsLast().op('text_ops'),
    ),
    index('idx_signing_audit_logs_request_id').using(
      'btree',
      table.signingRequestId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [signingRecipients.id],
      name: 'signing_audit_logs_recipient_id_fkey',
    }),
    foreignKey({
      columns: [table.signingRequestId],
      foreignColumns: [signingRequests.id],
      name: 'signing_audit_logs_signing_request_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('System can insert audit logs', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`true`,
    }),
    pgPolicy('Users can view audit logs for their requests', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'signing_audit_logs_event_check',
      sql`event = ANY (ARRAY['created'::text, 'sent'::text, 'viewed'::text, 'otp_verified'::text, 'field_completed'::text, 'signed'::text, 'completed'::text, 'voided'::text, 'reminder_sent'::text, 'expired'::text])`,
    ),
  ],
);

export const deprecatedPerformanceRightsOrganizations = pgTable(
  '_deprecated_performance_rights_organizations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    country: text(),
    ipiNumber: text('ipi_number'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    userId: uuid('user_id'),
  },
  (table) => [
    index('pro_name_idx').using('btree', table.name.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: 'performance_rights_organizations_user_id_fkey',
    }),
    unique('performance_rights_organizations_ipi_number_key').on(table.ipiNumber),
    pgPolicy('Users can insert their own PROs', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own PROs', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can view PROs', { as: 'permissive', for: 'select', to: ['public'] }),
  ],
);

export const songwriterPros = pgTable(
  'songwriter_pros',
  {
    songwriterId: uuid('songwriter_id').notNull(),
    proId: uuid('pro_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('songwriter_pros_pro_id_idx').using(
      'btree',
      table.proId.asc().nullsLast().op('uuid_ops'),
    ),
    index('songwriter_pros_songwriter_id_idx').using(
      'btree',
      table.songwriterId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.proId],
      foreignColumns: [deprecatedPerformanceRightsOrganizations.id],
      name: 'songwriter_pros_pro_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.songwriterId],
      foreignColumns: [credits.id],
      name: 'songwriter_pros_songwriter_id_fkey',
    }).onDelete('cascade'),
    primaryKey({ columns: [table.songwriterId, table.proId], name: 'songwriter_pros_pkey' }),
    pgPolicy('Users can insert songwriter PROs', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(EXISTS ( SELECT 1
   FROM credits c
  WHERE ((c.id = songwriter_pros.songwriter_id) AND (c.user_id = auth.uid()))))`,
    }),
    pgPolicy('Users can view songwriter PROs', { as: 'permissive', for: 'select', to: ['public'] }),
  ],
);

export const songwriterPublishers = pgTable(
  'songwriter_publishers',
  {
    songwriterId: uuid('songwriter_id').notNull(),
    publisherId: uuid('publisher_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    index('songwriter_publishers_publisher_id_idx').using(
      'btree',
      table.publisherId.asc().nullsLast().op('uuid_ops'),
    ),
    index('songwriter_publishers_songwriter_id_idx').using(
      'btree',
      table.songwriterId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.publisherId],
      foreignColumns: [deprecatedPublishers.id],
      name: 'songwriter_publishers_publisher_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.songwriterId],
      foreignColumns: [credits.id],
      name: 'songwriter_publishers_songwriter_id_fkey',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.songwriterId, table.publisherId],
      name: 'songwriter_publishers_pkey',
    }),
    pgPolicy('Users can insert songwriter publishers', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(EXISTS ( SELECT 1
   FROM credits c
  WHERE ((c.id = songwriter_publishers.songwriter_id) AND (c.user_id = auth.uid()))))`,
    }),
    pgPolicy('Users can view songwriter publishers', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
  ],
);

export const userPermissions = pgTable(
  'user_permissions',
  {
    userId: uuid('user_id').notNull(),
    module: text().notNull(),
    accessLevel: text('access_level').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'user_permissions_user_id_fkey',
    }).onDelete('cascade'),
    primaryKey({ columns: [table.userId, table.module], name: 'user_permissions_pkey' }),
    pgPolicy('Admins can manage permissions', {
      as: 'permissive',
      for: 'all',
      to: ['authenticated'],
      using: sql`(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])))))`,
      withCheck: sql`(EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['admin'::text, 'artist_manager'::text])))))`,
    }),
    pgPolicy('Admins can view all permissions', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    pgPolicy('Users can view their own permissions', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    check(
      'user_permissions_access_level_check',
      sql`access_level = ANY (ARRAY['view'::text, 'comment'::text, 'edit'::text, 'full'::text])`,
    ),
    check(
      'user_permissions_module_check',
      sql`module = ANY (ARRAY['catalog'::text, 'finance'::text, 'legal'::text, 'live'::text, 'marketing'::text, 'personnel'::text, 'info'::text, 'dashboard'::text])`,
    ),
  ],
);

export const teamMembers = pgTable(
  'team_members',
  {
    teamId: uuid('team_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    seatRole: text('seat_role').default('owner').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('team_members_team_user_uniq').using(
      'btree',
      table.teamId.asc().nullsLast().op('uuid_ops'),
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: 'team_members_team_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [profiles.id],
      name: 'team_members_user_id_fkey',
    }).onDelete('cascade'),
    primaryKey({ columns: [table.teamId, table.userId], name: 'team_members_pkey' }),
    pgPolicy('team_members: owner can insert', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
      withCheck: sql`(EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = team_members.team_id) AND (t.owner_id = auth.uid()))))`,
    }),
    pgPolicy('team_members: self can select', { as: 'permissive', for: 'select', to: ['public'] }),
    check('team_members_role_check', sql`role = ANY (ARRAY['leader'::text, 'member'::text])`),
    check(
      'team_members_seat_role_check',
      sql`seat_role = ANY (ARRAY['owner'::text, 'admin'::text, 'editor'::text, 'viewer'::text])`,
    ),
  ],
);
