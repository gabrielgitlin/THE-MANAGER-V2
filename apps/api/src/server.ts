// Composition root: the only place that knows about concrete adapters.
import { makeArtistUseCases } from '@the-manager/application';
import { createDb } from '@the-manager/db';
import { DrizzleArtistRepository } from '@the-manager/infrastructure';
import { buildApp } from './app.ts';
import { loadEnv } from './config/env.ts';

const env = loadEnv();
const database = createDb(env.DATABASE_URL);

const app = await buildApp(
  {
    artists: makeArtistUseCases(new DrizzleArtistRepository(database.db)),
    checkDatabase: database.ping,
  },
  { logger: { level: env.LOG_LEVEL }, corsOrigin: env.CORS_ORIGIN.split(',') },
);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    await database.close();
    process.exit(0);
  });
}

await app.listen({ host: env.API_HOST, port: env.API_PORT });
