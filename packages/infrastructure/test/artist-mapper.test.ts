import type { schema } from '@the-manager/db';
import { describe, expect, it } from 'vitest';
import { toArtist } from '../src/index.ts';

const now = new Date('2026-01-01T00:00:00Z');
const baseRow: schema.ArtistRow = {
  id: '00000000-0000-4000-8000-000000000000',
  workspaceId: '11111111-1111-4111-8111-111111111111',
  name: 'Café Tacvba',
  bio: null,
  genre: 'Rock',
  imageUrl: '',
  spotifyUrl: 'https://open.spotify.com/artist/x',
  appleMusicUrl: '',
  instagramUrl: null,
  createdAt: now,
  updatedAt: null,
  spotifyId: null,
  spotifyFollowers: 0,
  spotifyPopularity: 0,
  bandsintownUrl: null,
  songkickUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  twitterUrl: null,
  websiteUrl: null,
  country: null,
  city: null,
  label: null,
  managementCompany: null,
  bookingAgency: null,
  bookingAgent: null,
  publicist: null,
};

describe('toArtist', () => {
  it('maps legacy empty strings to null links and keeps the workspace', () => {
    expect(toArtist(baseRow)).toMatchObject({
      workspaceId: '11111111-1111-4111-8111-111111111111',
      bio: '',
      imageUrl: null,
      links: { spotify: 'https://open.spotify.com/artist/x', appleMusic: null, instagram: null },
      updatedAt: now,
    });
  });
});
