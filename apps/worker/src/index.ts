import { PgBoss } from 'pg-boss';
import { z } from 'zod';
import { QUEUES, SCHEDULES } from './jobs.ts';

const env = z.object({ DATABASE_URL: z.url() }).parse(process.env);

const boss = new PgBoss({ connectionString: env.DATABASE_URL, schema: 'pgboss' });
boss.on('error', (error) => console.error('[worker] pg-boss error', error));

await boss.start();

for (const queue of Object.values(QUEUES)) await boss.createQueue(queue);
for (const { queue, cron } of SCHEDULES) await boss.schedule(queue, cron);

await boss.work(QUEUES.heartbeat, async () => {
  console.info(`[worker] heartbeat ${new Date().toISOString()}`);
});

console.info('[worker] started');

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await boss.stop({ graceful: true });
    process.exit(0);
  });
}
