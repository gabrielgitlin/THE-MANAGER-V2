import type { Artist } from '@the-manager/domain';
import {
  ArtistParamsSchema,
  ArtistSchema,
  CreateArtistBodySchema,
  ErrorResponseSchema,
  ListArtistsQuerySchema,
  ListArtistsResponseSchema,
  type ArtistDto,
} from '@the-manager/contracts';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { AppDeps } from '../app.ts';

export function toArtistDto(a: Artist): ArtistDto {
  return { ...a, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString() };
}

export const artistRoutes =
  ({ artists }: AppDeps): FastifyPluginAsyncZod =>
  async (app) => {
    app.get(
      '/',
      {
        schema: {
          tags: ['artists'],
          querystring: ListArtistsQuerySchema,
          response: { 200: ListArtistsResponseSchema },
        },
      },
      async (req) => {
        const page = await artists.listArtists(req.query);
        return { items: page.items.map(toArtistDto), total: page.total };
      },
    );

    app.get(
      '/:id',
      {
        schema: {
          tags: ['artists'],
          params: ArtistParamsSchema,
          response: { 200: ArtistSchema, 404: ErrorResponseSchema },
        },
      },
      async (req) => toArtistDto(await artists.getArtist(req.params.id)),
    );

    app.post(
      '/',
      {
        schema: {
          tags: ['artists'],
          body: CreateArtistBodySchema,
          response: { 201: ArtistSchema, 422: ErrorResponseSchema },
        },
      },
      async (req, reply) => {
        const artist = await artists.createArtist(req.body);
        return reply.status(201).send(toArtistDto(artist));
      },
    );
  };
