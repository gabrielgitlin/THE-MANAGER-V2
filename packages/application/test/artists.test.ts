import { NotFoundError, ValidationError } from '@the-manager/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryArtistRepository, makeArtistUseCases } from '../src/index.ts';

const WS = '11111111-1111-4111-8111-111111111111';
const OTHER_WS = '22222222-2222-4222-8222-222222222222';

describe('artist use cases', () => {
  let repo: InMemoryArtistRepository;
  let uc: ReturnType<typeof makeArtistUseCases>;

  beforeEach(() => {
    repo = new InMemoryArtistRepository();
    uc = makeArtistUseCases(repo);
  });

  it('creates an artist with a normalised name in the workspace', async () => {
    const artist = await uc.createArtist(WS, { name: '  Rosalía ' });
    expect(artist).toMatchObject({ name: 'Rosalía', workspaceId: WS });
    expect(await uc.getArtist(WS, artist.id)).toEqual(artist);
  });

  it('rejects invalid input before touching the repository', async () => {
    await expect(uc.createArtist(WS, { name: '' })).rejects.toBeInstanceOf(ValidationError);
    expect(repo.artists.size).toBe(0);
  });

  it('throws NotFoundError for unknown ids', async () => {
    await expect(uc.getArtist(WS, 'missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('never returns artists from another workspace', async () => {
    const theirs = await uc.createArtist(OTHER_WS, { name: 'Bon Iver' });
    await expect(uc.getArtist(WS, theirs.id)).rejects.toBeInstanceOf(NotFoundError);
    expect((await uc.listArtists(WS)).total).toBe(0);
  });

  it('clamps page size and filters by search', async () => {
    await uc.createArtist(WS, { name: 'Bad Bunny' });
    await uc.createArtist(WS, { name: 'Bon Iver' });
    const page = await uc.listArtists(WS, { limit: 1000, search: 'bon' });
    expect(page.total).toBe(1);
    expect(page.items[0]?.name).toBe('Bon Iver');
  });
});
