import { NotFoundError, ValidationError } from '@the-manager/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryArtistRepository, makeArtistUseCases } from '../src/index.ts';

describe('artist use cases', () => {
  let repo: InMemoryArtistRepository;
  let uc: ReturnType<typeof makeArtistUseCases>;

  beforeEach(() => {
    repo = new InMemoryArtistRepository();
    uc = makeArtistUseCases(repo);
  });

  it('creates an artist with a normalised name', async () => {
    const artist = await uc.createArtist({ name: '  Rosalía ' });
    expect(artist.name).toBe('Rosalía');
    expect(await uc.getArtist(artist.id)).toEqual(artist);
  });

  it('rejects invalid input before touching the repository', async () => {
    await expect(uc.createArtist({ name: '' })).rejects.toBeInstanceOf(ValidationError);
    expect(repo.artists.size).toBe(0);
  });

  it('throws NotFoundError for unknown ids', async () => {
    await expect(uc.getArtist('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('clamps page size and filters by search', async () => {
    await uc.createArtist({ name: 'Bad Bunny' });
    await uc.createArtist({ name: 'Bon Iver' });
    const page = await uc.listArtists({ limit: 1000, search: 'bon' });
    expect(page.total).toBe(1);
    expect(page.items[0]?.name).toBe('Bon Iver');
  });
});
