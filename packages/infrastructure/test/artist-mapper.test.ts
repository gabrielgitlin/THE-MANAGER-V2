import { describe, expect, it } from 'vitest';
import { toArtist } from '../src/index.ts';

describe('toArtist', () => {
  it('maps legacy empty strings to null links', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const artist = toArtist({
      id: '00000000-0000-4000-8000-000000000000',
      name: 'Café Tacvba',
      bio: null,
      genre: 'Rock',
      imageUrl: '',
      spotifyUrl: 'https://open.spotify.com/artist/x',
      appleMusicUrl: '',
      instagramUrl: null,
      createdAt: now,
      updatedAt: null,
    });
    expect(artist).toMatchObject({
      bio: '',
      imageUrl: null,
      links: { spotify: 'https://open.spotify.com/artist/x', appleMusic: null, instagram: null },
      updatedAt: now,
    });
  });
});
