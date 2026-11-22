import { NotFoundError, prepareNewArtist, type Artist, type NewArtist } from '@the-manager/domain';
import type { ArtistRepository, ListArtistsQuery, Page } from './artist-repository.ts';

export const MAX_PAGE_SIZE = 100;

export function makeListArtists(repo: ArtistRepository) {
  return (
    workspaceId: string,
    query: Partial<Omit<ListArtistsQuery, 'workspaceId'>> = {},
  ): Promise<Page<Artist>> => {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), MAX_PAGE_SIZE);
    const offset = Math.max(query.offset ?? 0, 0);
    const search = query.search?.trim() || undefined;
    return repo.list({ workspaceId, limit, offset, search });
  };
}

export function makeGetArtist(repo: ArtistRepository) {
  return async (workspaceId: string, id: string): Promise<Artist> => {
    const artist = await repo.findById(workspaceId, id);
    if (!artist) throw new NotFoundError('Artist', id);
    return artist;
  };
}

export function makeCreateArtist(repo: ArtistRepository) {
  return async (workspaceId: string, input: NewArtist): Promise<Artist> =>
    repo.create({ workspaceId, ...prepareNewArtist(input) });
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
