import { ValidationError } from '../shared/errors.ts';

export interface ArtistLinks {
  spotify: string | null;
  appleMusic: string | null;
  instagram: string | null;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  genre: string;
  imageUrl: string | null;
  links: ArtistLinks;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewArtist {
  name: string;
  bio?: string;
  genre?: string;
  imageUrl?: string | null;
  links?: Partial<ArtistLinks>;
}

export const ARTIST_NAME_MAX = 200;

/** Business rule: an artist name is trimmed, non-empty and at most 200 characters. */
export function normalizeArtistName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length === 0) throw new ValidationError('Artist name is required');
  if (name.length > ARTIST_NAME_MAX) {
    throw new ValidationError(`Artist name must be at most ${ARTIST_NAME_MAX} characters`);
  }
  return name;
}

/** Validates and normalises the input for a new artist. */
export function prepareNewArtist(
  input: NewArtist,
): Required<Omit<NewArtist, 'links'>> & { links: ArtistLinks } {
  return {
    name: normalizeArtistName(input.name),
    bio: input.bio?.trim() ?? '',
    genre: input.genre?.trim() ?? '',
    imageUrl: input.imageUrl ?? null,
    links: {
      spotify: input.links?.spotify ?? null,
      appleMusic: input.links?.appleMusic ?? null,
      instagram: input.links?.instagram ?? null,
    },
  };
}
