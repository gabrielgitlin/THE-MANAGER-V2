import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { AppDeps } from '../app.ts';

export const healthRoutes =
  (deps: AppDeps): FastifyPluginAsyncZod =>
  async (app) => {
    app.get(
      '/health',
      { schema: { response: { 200: z.object({ status: z.literal('ok') }) } } },
      () => ({
        status: 'ok' as const,
      }),
    );

    app.get(
      '/ready',
      {
        schema: {
          response: {
            200: z.object({ status: z.literal('ready') }),
            503: z.object({ status: z.literal('unavailable') }),
          },
        },
      },
      async (_req, reply) => {
        try {
          await deps.checkDatabase();
          return { status: 'ready' as const };
        } catch {
          return reply.status(503).send({ status: 'unavailable' as const });
        }
      },
    );
  };
