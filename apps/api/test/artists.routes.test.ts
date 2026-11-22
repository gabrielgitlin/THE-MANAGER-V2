import { InMemoryArtistRepository, makeArtistUseCases } from '@the-manager/application';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';

const WS = '11111111-1111-4111-8111-111111111111';
const headers = { 'x-workspace-id': WS };

describe('artists routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let dbUp = true;

  beforeEach(async () => {
    app = await buildApp({
      artists: makeArtistUseCases(new InMemoryArtistRepository()),
      checkDatabase: async () => {
        if (!dbUp) throw new Error('down');
      },
    });
  });
  afterEach(() => app.close());

  it('creates, fetches and lists artists', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/v1/artists',
      headers,
      payload: { name: ' Natalia Lafourcade ' },
    });
    expect(created.statusCode).toBe(201);
    const artist = created.json();
    expect(artist).toMatchObject({ name: 'Natalia Lafourcade', workspaceId: WS });

    const fetched = await app.inject({ method: 'GET', url: `/v1/artists/${artist.id}`, headers });
    expect(fetched.json()).toEqual(artist);

    const list = await app.inject({ method: 'GET', url: '/v1/artists?search=natalia', headers });
    expect(list.json()).toMatchObject({ total: 1, items: [{ id: artist.id }] });
  });

  it('maps domain errors to HTTP status codes', async () => {
    const blank = await app.inject({
      method: 'POST',
      url: '/v1/artists',
      headers,
      payload: { name: '   ' },
    });
    expect(blank.statusCode).toBe(422);
    expect(blank.json()).toEqual({
      error: { code: 'VALIDATION', message: 'Artist name is required' },
    });

    const missing = await app.inject({
      method: 'GET',
      url: '/v1/artists/00000000-0000-4000-8000-000000000000',
      headers,
    });
    expect(missing.statusCode).toBe(404);
  });

  it('rejects malformed requests with 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/artists/not-a-uuid', headers });
    expect(res.statusCode).toBe(400);
  });

  it('requires a workspace', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/artists' });
    expect(res.statusCode).toBe(400);
  });

  it('reports readiness from the database check', async () => {
    expect((await app.inject('/ready')).statusCode).toBe(200);
    dbUp = false;
    expect((await app.inject('/ready')).statusCode).toBe(503);
  });

  it('serves an OpenAPI document', async () => {
    const res = await app.inject('/openapi.json');
    expect(res.json().paths).toHaveProperty('/v1/artists/');
  });
});
