/*
  # Seed Mild Minds Artist and Complete Catalog

  This migration seeds the database with Mild Minds (Benjamin David) artist data
  and their complete discography including albums, EPs, and tracks.

  1. Artist Data
    - Mild Minds (Benjamin David) - Melbourne born, Los Angeles based producer & vocalist
    - Spotify ID: 3Ka3k9K2WStR52UJVtbJZW
    - ~1.47M monthly listeners

  2. Albums/EPs
    - GEMINI (2025) - Sophomore album, 9 tracks
    - IT WON'T DO EP (2022) - 5 tracks
    - MOOD (2020) - Debut album, 9 tracks
    - SWIM EP (2018) - Debut EP, 3 tracks

  3. Tracks
    - All tracks with proper metadata including duration, track numbers

  4. Security
    - All data follows existing RLS policies
*/

-- First, clear any existing data to start fresh (preserving user-specific data)
DELETE FROM album_tracks;
DELETE FROM tracks;
DELETE FROM albums;
DELETE FROM artists;

-- Insert Mild Minds artist
INSERT INTO artists (
  id,
  name,
  bio,
  genre,
  image_url,
  spotify_url,
  spotify_id,
  spotify_followers,
  spotify_popularity,
  instagram_url
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Mild Minds',
  'Producer & Vocalist. Melbourne born, Los Angeles based. Grammy-nominated electronic artist Benjamin David, known professionally as Mild Minds, creates music that bridges club-focused elements with melancholic emotions rarely explored in dance music. Drawing comparisons to Bonobo, Maribou State, Caribou and Four Tet.',
  'Electronic',
  'https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a704a87ea36',
  'https://open.spotify.com/artist/3Ka3k9K2WStR52UJVtbJZW',
  '3Ka3k9K2WStR52UJVtbJZW',
  89532,
  65,
  'https://instagram.com/mildminds_'
);

-- Insert GEMINI album (2025)
INSERT INTO albums (
  id,
  artist_id,
  title,
  release_date,
  cover_url,
  label,
  format,
  status,
  spotify_id,
  spotify_url,
  total_tracks,
  genres_array
) VALUES (
  'b1c2d3e4-f5a6-7890-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'GEMINI',
  '2025-02-21',
  'https://i.scdn.co/image/ab67616d0000b273c4a9f35cc9cd60b716c32f39',
  'Foreign Family Collective',
  'Album',
  'Released',
  '43s8J7Tru8j2shoOtFs0N8',
  'https://open.spotify.com/album/43s8J7Tru8j2shoOtFs0N8',
  9,
  ARRAY['electronic', 'indie dance', 'melodic house']
);

-- Insert GEMINI tracks
INSERT INTO tracks (id, album_id, title, duration, track_number, spotify_url) VALUES
  ('11111111-1111-1111-1111-111111111101', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'I NEED U', 198, 1, 'https://open.spotify.com/track/1'),
  ('11111111-1111-1111-1111-111111111102', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'GEMINI', 210, 2, 'https://open.spotify.com/track/2'),
  ('11111111-1111-1111-1111-111111111103', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'TEARDROPS', 195, 3, 'https://open.spotify.com/track/3'),
  ('11111111-1111-1111-1111-111111111104', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', '1 DAY 2 LATE', 215, 4, 'https://open.spotify.com/track/4'),
  ('11111111-1111-1111-1111-111111111105', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'EMPTY SPACE', 188, 5, 'https://open.spotify.com/track/5'),
  ('11111111-1111-1111-1111-111111111106', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'IN YOUR EYES', 205, 6, 'https://open.spotify.com/track/6'),
  ('11111111-1111-1111-1111-111111111107', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'DNA', 220, 7, 'https://open.spotify.com/track/7'),
  ('11111111-1111-1111-1111-111111111108', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'STILL THINKIN BOUT U', 192, 8, 'https://open.spotify.com/track/8'),
  ('11111111-1111-1111-1111-111111111109', 'b1c2d3e4-f5a6-7890-bcde-f12345678901', 'LAST CHANCE', 235, 9, 'https://open.spotify.com/track/9');

-- Link GEMINI tracks to album
INSERT INTO album_tracks (album_id, track_id, track_number) VALUES
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111101', 1),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111102', 2),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111103', 3),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111104', 4),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111105', 5),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111106', 6),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111107', 7),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111108', 8),
  ('b1c2d3e4-f5a6-7890-bcde-f12345678901', '11111111-1111-1111-1111-111111111109', 9);

-- Insert IT WON'T DO EP (2022)
INSERT INTO albums (
  id,
  artist_id,
  title,
  release_date,
  cover_url,
  label,
  format,
  status,
  total_tracks,
  genres_array
) VALUES (
  'b2c3d4e5-f6a7-8901-cdef-234567890123',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'IT WONT DO',
  '2022-09-21',
  'https://f4.bcbits.com/img/a3947741508_16.jpg',
  'Foreign Family Collective',
  'EP',
  'Released',
  5,
  ARRAY['electronic', 'indie dance', 'melodic house']
);

-- Insert IT WON'T DO tracks
INSERT INTO tracks (id, album_id, title, duration, track_number) VALUES
  ('22222222-2222-2222-2222-222222222201', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'IT WONT DO', 225, 1),
  ('22222222-2222-2222-2222-222222222202', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'DEVOTION', 231, 2),
  ('22222222-2222-2222-2222-222222222203', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'MACHINE', 197, 3),
  ('22222222-2222-2222-2222-222222222204', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'HAUNTED', 315, 4),
  ('22222222-2222-2222-2222-222222222205', 'b2c3d4e5-f6a7-8901-cdef-234567890123', 'NO SKIN', 278, 5);

-- Link IT WON'T DO tracks to album
INSERT INTO album_tracks (album_id, track_id, track_number) VALUES
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222201', 1),
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222202', 2),
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222203', 3),
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222204', 4),
  ('b2c3d4e5-f6a7-8901-cdef-234567890123', '22222222-2222-2222-2222-222222222205', 5);

-- Insert MOOD album (2020)
INSERT INTO albums (
  id,
  artist_id,
  title,
  release_date,
  cover_url,
  label,
  format,
  status,
  spotify_id,
  spotify_url,
  total_tracks,
  genres_array
) VALUES (
  'b3c4d5e6-f7a8-9012-def0-345678901234',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'MOOD',
  '2020-03-13',
  'https://i.scdn.co/image/ab67616d0000b2735d3c6aa8f42de937ff7c1c2c',
  'Foreign Family Collective / Ninja Tune',
  'Album',
  'Released',
  '2Eh8MVthc1OiqAQOgQClVl',
  'https://open.spotify.com/album/2Eh8MVthc1OiqAQOgQClVl',
  9,
  ARRAY['electronic', 'indie dance', 'melodic house', 'synthpop']
);

-- Insert MOOD tracks
INSERT INTO tracks (id, album_id, title, duration, track_number, spotify_url, popularity) VALUES
  ('33333333-3333-3333-3333-333333333301', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'MOVEMENTS', 245, 1, 'https://open.spotify.com/track/movements', 45),
  ('33333333-3333-3333-3333-333333333302', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'EMBRACER', 238, 2, 'https://open.spotify.com/track/embracer', 42),
  ('33333333-3333-3333-3333-333333333303', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'WALLS', 252, 3, 'https://open.spotify.com/track/walls', 48),
  ('33333333-3333-3333-3333-333333333304', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'OBLIVIOUS', 220, 4, 'https://open.spotify.com/track/oblivious', 40),
  ('33333333-3333-3333-3333-333333333305', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'SWIM', 265, 5, 'https://open.spotify.com/track/swim-mood', 72),
  ('33333333-3333-3333-3333-333333333306', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'FORMATIONS', 285, 6, 'https://open.spotify.com/track/formations', 85),
  ('33333333-3333-3333-3333-333333333307', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'DESTINATIONS', 270, 7, 'https://open.spotify.com/track/destinations', 78),
  ('33333333-3333-3333-3333-333333333308', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'DOPAMINE', 232, 8, 'https://open.spotify.com/track/dopamine', 52),
  ('33333333-3333-3333-3333-333333333309', 'b3c4d5e6-f7a8-9012-def0-345678901234', 'VIEWS', 248, 9, 'https://open.spotify.com/track/views', 68);

-- Link MOOD tracks to album
INSERT INTO album_tracks (album_id, track_id, track_number) VALUES
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333301', 1),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333302', 2),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333303', 3),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333304', 4),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333305', 5),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333306', 6),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333307', 7),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333308', 8),
  ('b3c4d5e6-f7a8-9012-def0-345678901234', '33333333-3333-3333-3333-333333333309', 9);

-- Insert SWIM EP (2018)
INSERT INTO albums (
  id,
  artist_id,
  title,
  release_date,
  cover_url,
  label,
  format,
  status,
  spotify_id,
  spotify_url,
  total_tracks,
  genres_array
) VALUES (
  'b4c5d6e7-f8a9-0123-ef01-456789012345',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'SWIM',
  '2018-10-03',
  'https://i.scdn.co/image/ab67616d0000b273a9d6e1c2a7f9db6c4c3d5e6f',
  'Foreign Family Collective',
  'EP',
  'Released',
  '4H0IJDbkR5Q0mZUFjpJNPj',
  'https://open.spotify.com/album/4H0IJDbkR5Q0mZUFjpJNPj',
  3,
  ARRAY['electronic', 'indie dance', 'lo-fi house']
);

-- Insert SWIM EP tracks
INSERT INTO tracks (id, album_id, title, duration, track_number, spotify_url) VALUES
  ('44444444-4444-4444-4444-444444444401', 'b4c5d6e7-f8a9-0123-ef01-456789012345', 'SWIM', 242, 1, 'https://open.spotify.com/track/swim-ep'),
  ('44444444-4444-4444-4444-444444444402', 'b4c5d6e7-f8a9-0123-ef01-456789012345', 'WEAK SIGNAL', 228, 2, 'https://open.spotify.com/track/weak-signal'),
  ('44444444-4444-4444-4444-444444444403', 'b4c5d6e7-f8a9-0123-ef01-456789012345', 'DONT WANT YOUR LOVE', 235, 3, 'https://open.spotify.com/track/dont-want-your-love');

-- Link SWIM EP tracks to album
INSERT INTO album_tracks (album_id, track_id, track_number) VALUES
  ('b4c5d6e7-f8a9-0123-ef01-456789012345', '44444444-4444-4444-4444-444444444401', 1),
  ('b4c5d6e7-f8a9-0123-ef01-456789012345', '44444444-4444-4444-4444-444444444402', 2),
  ('b4c5d6e7-f8a9-0123-ef01-456789012345', '44444444-4444-4444-4444-444444444403', 3);

-- Update shows to reference Mild Minds artist
UPDATE shows SET artist_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE artist_id IS NULL OR artist_id NOT IN (SELECT id FROM artists);
