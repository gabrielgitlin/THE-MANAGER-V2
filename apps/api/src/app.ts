import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import type { ArtistUseCases } from '@the-manager/application';
import { DomainError } from '@the-manager/domain';
import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { artistRoutes } from './routes/artists.ts';
import { healthRoutes } from './routes/health.ts';

/** Everything the HTTP layer needs, wired in server.ts (the composition root). */
export interface AppDeps {
  artists: ArtistUseCases;
  checkDatabase: () => Promise<void>;
}

export interface AppOptions {
  logger?: FastifyServerOptions['logger'];
  corsOrigin?: string | string[];
}

const STATUS_BY_CODE: Record<string, number> = { VALIDATION: 422, NOT_FOUND: 404 };

export async function buildApp(deps: AppDeps, options: AppOptions = {}) {
  const app = Fastify({ logger: options.logger ?? false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, { origin: options.corsOrigin ?? false, credentials: true });
  await app.register(sensible);
  await app.register(swagger, {
    openapi: { info: { title: 'The Manager API', version: '0.1.0' } },
    transform: jsonSchemaTransform,
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof DomainError) {
      return reply
        .status(STATUS_BY_CODE[error.code] ?? 400)
        .send({ error: { code: error.code, message: error.message } });
    }
    const err = error as { validation?: unknown; statusCode?: number; message?: string };
    if (err.validation) {
      return reply
        .status(400)
        .send({ error: { code: 'BAD_REQUEST', message: err.message ?? 'Invalid request' } });
    }
    const status = err.statusCode ?? 500;
    if (status >= 500) request.log.error(error);
    return reply.status(status).send({
      error: {
        code: status >= 500 ? 'INTERNAL' : 'ERROR',
        message: status >= 500 ? 'Internal server error' : (err.message ?? 'Error'),
      },
    });
  });

  await app.register(healthRoutes(deps));
  await app.register(artistRoutes(deps), { prefix: '/v1/artists' });
  app.get('/openapi.json', { schema: { hide: true } }, () => app.swagger());

  return app;
}
