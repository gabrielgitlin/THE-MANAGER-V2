import { NotFoundError, prepareNewArtist, type Artist, type NewArtist } from '@the-manager/domain';
import type { ArtistRepository, ListArtistsQuery, Page } from './artist-repository.ts';

export const MAX_PAGE_SIZE = 100;

export function makeListArtists(repo: ArtistRepository) {
  return (query: Partial<ListArtistsQuery> = {}): Promise<Page<Artist>> => {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), MAX_PAGE_SIZE);
    const offset = Math.max(query.offset ?? 0, 0);
    const search = query.search?.trim() || undefined;
    return repo.list({ limit, offset, search });
  };
}

export function makeGetArtist(repo: ArtistRepository) {
  return async (id: string): Promise<Artist> => {
    const artist = await repo.findById(id);
    if (!artist) throw new NotFoundError('Artist', id);
    return artist;
  };
}

export function makeCreateArtist(repo: ArtistRepository) {
  return async (input: NewArtist): Promise<Artist> => repo.create(prepareNewArtist(input));
}

export type ArtistUseCases = {
  listArtists: ReturnType<typeof makeListArtists>;
  getArtist: ReturnType<typeof makeGetArtist>;
  createArtist: ReturnType<typeof makeCreateArtist>;
};

export function makeArtistUseCases(repo: ArtistRepository): ArtistUseCases {
  return {
    listArtists: makeListArtists(repo),
    getArtist: makeGetArtist(repo),
    createArtist: makeCreateArtist(repo),
  };
}
