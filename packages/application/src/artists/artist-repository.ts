import type { Artist, ArtistLinks } from '@the-manager/domain';

export interface ListArtistsQuery {
  limit: number;
  offset: number;
  search?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface CreateArtistData {
  name: string;
  bio: string;
  genre: string;
  imageUrl: string | null;
  links: ArtistLinks;
}

/** Port: how the application reads and stores artists. Implemented in infrastructure. */
export interface ArtistRepository {
  findById(id: string): Promise<Artist | null>;
  list(query: ListArtistsQuery): Promise<Page<Artist>>;
  create(data: CreateArtistData): Promise<Artist>;
}
