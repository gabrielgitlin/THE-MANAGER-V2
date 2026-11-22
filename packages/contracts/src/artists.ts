import { z } from 'zod';

export const ArtistSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  name: z.string(),
  bio: z.string(),
  genre: z.string(),
  imageUrl: z.url().nullable(),
  links: z.object({
    spotify: z.url().nullable(),
    appleMusic: z.url().nullable(),
    instagram: z.url().nullable(),
  }),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type ArtistDto = z.infer<typeof ArtistSchema>;

export const ListArtistsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().min(1).max(200).optional(),
});

export const ListArtistsResponseSchema = z.object({
  items: z.array(ArtistSchema),
  total: z.number().int().nonnegative(),
});

export const CreateArtistBodySchema = z.object({
  name: z.string().min(1).max(200),
  bio: z.string().max(5000).optional(),
  genre: z.string().max(200).optional(),
  imageUrl: z.url().nullable().optional(),
  links: z
    .object({
      spotify: z.url().nullable().optional(),
      appleMusic: z.url().nullable().optional(),
      instagram: z.url().nullable().optional(),
    })
    .optional(),
});
export type CreateArtistBody = z.infer<typeof CreateArtistBodySchema>;

export const ArtistParamsSchema = z.object({ id: z.uuid() });

/**
 * Temporary tenant selector until authentication lands (migration step 3):
 * the workspace will then come from the session, not from the client.
 */
export const WorkspaceHeadersSchema = z.object({ 'x-workspace-id': z.uuid() });
