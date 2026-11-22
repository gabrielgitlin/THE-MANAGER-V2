import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.ts';

export type Database = PostgresJsDatabase<typeof schema>;

export interface DbHandle {
  db: Database;
  ping(): Promise<void>;
  close(): Promise<void>;
}

export function createDb(url: string, options: { max?: number } = {}): DbHandle {
  const client = postgres(url, { max: options.max ?? 10 });
  const db = drizzle(client, { schema, casing: 'snake_case' });
  return {
    db,
    ping: async () => {
      await client`select 1`;
    },
    close: () => client.end({ timeout: 5 }),
  };
}
