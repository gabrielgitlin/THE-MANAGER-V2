import { describe, expect, it } from 'vitest';
import { ValidationError, normalizeArtistName, prepareNewArtist } from '../src/index.ts';

describe('artist rules', () => {
  it('trims and collapses whitespace in the name', () => {
    expect(normalizeArtistName('  Led   Zeppelin ')).toBe('Led Zeppelin');
  });

  it('rejects empty and overly long names', () => {
    expect(() => normalizeArtistName('   ')).toThrow(ValidationError);
    expect(() => normalizeArtistName('x'.repeat(201))).toThrow(ValidationError);
  });

  it('fills optional fields with defaults', () => {
    expect(prepareNewArtist({ name: 'Björk' })).toEqual({
      name: 'Björk',
      bio: '',
      genre: '',
      imageUrl: null,
      links: { spotify: null, appleMusic: null, instagram: null },
    });
  });
});
