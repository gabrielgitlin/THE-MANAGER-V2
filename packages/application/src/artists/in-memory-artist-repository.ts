import { randomUUID } from 'node:crypto';
import type { Artist } from '@the-manager/domain';
import type {
  ArtistRepository,
  CreateArtistData,
  ListArtistsQuery,
  Page,
} from './artist-repository.ts';

/** In-memory adapter for tests and local prototyping. */
export class InMemoryArtistRepository implements ArtistRepository {
  readonly artists = new Map<string, Artist>();

  async findById(workspaceId: string, id: string): Promise<Artist | null> {
    const artist = this.artists.get(id);
    return artist && artist.workspaceId === workspaceId ? artist : null;
  }

  async list({ workspaceId, limit, offset, search }: ListArtistsQuery): Promise<Page<Artist>> {
    const needle = search?.toLowerCase();
    const all = [...this.artists.values()]
      .filter((a) => a.workspaceId === workspaceId)
      .filter((a) => !needle || a.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  async create(data: CreateArtistData): Promise<Artist> {
    const now = new Date();
    const artist: Artist = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.artists.set(artist.id, artist);
    return artist;
  }
}
