// Post-processes `drizzle-kit pull` output for the Supabase snapshot (packages/db/pulled/schema.ts):
//  1. Defaults: drizzle-kit drops quotes from '' and emits jsonb/array defaults as JS literals.
//     Every default on those columns is replaced by the exact SQL expression from the catalog.
//  2. Foreign keys to auth.users were introspected as public.users; point them at `authUsers`.
//  3. Timestamps use mode 'date' (JS Date) instead of 'string'.
// Usage: PULL_DATABASE_URL=postgres://... node scripts/fix-pulled-schema.ts pulled/schema.ts src/schema/supabase.ts
import { readFileSync, writeFileSync } from 'node:fs';
import postgres from 'postgres';

const [input, output] = process.argv.slice(2);
if (!input || !output || !process.env.PULL_DATABASE_URL) {
  throw new Error('usage: PULL_DATABASE_URL=... node scripts/fix-pulled-schema.ts <in> <out>');
}

const sqlClient = postgres(process.env.PULL_DATABASE_URL, { max: 1 });
const defaults = await sqlClient<
  { table_name: string; column_name: string; column_default: string }[]
>`
  select table_name, column_name, column_default from information_schema.columns
  where table_schema = 'public' and column_default is not null`;
const authFks = await sqlClient<{ conname: string }[]>`
  select conname from pg_constraint where confrelid = 'auth.users'::regclass`;
await sqlClient.end();

const defaultOf = new Map(
  defaults.map((d) => [`${d.table_name}.${d.column_name}`, d.column_default]),
);
const authFkNames = new Set(authFks.map((f) => f.conname));
const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

let table = '';
let fixedDefaults = 0;
let fixedFks = 0;
const lines = readFileSync(input, 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]!;
  const tableMatch = /= pgTable\("([^"]+)"/.exec(line);
  if (tableMatch) table = tableMatch[1]!;

  // Column line: `\tprop: type("col"...)...default(...)`
  const colMatch = /^\t(\w+): (\w+)\((?:"([^"]+)")?/.exec(line);
  if (colMatch && line.includes('.default(')) {
    const [, prop, type, explicit] = colMatch;
    const column = explicit ?? snake(prop!);
    const needsFix = type === 'jsonb' || line.includes('.array()') || line.includes(".default(')");
    const exact = defaultOf.get(`${table}.${column}`);
    if (needsFix && exact) {
      const start = line.indexOf('.default(');
      let depth = 0;
      let end = start + '.default('.length - 1;
      let inStr: string | null = null;
      for (let j = end; j < line.length; j++) {
        const ch = line[j]!;
        if (inStr) {
          if (ch === inStr) inStr = null;
          continue;
        }
        if (ch === '"' || ch === '`') inStr = ch;
        else if (ch === '(') depth++;
        else if (ch === ')' && --depth === 0) {
          end = j;
          break;
        }
      }
      // An empty-string default ('') breaks the scan above; fall back to the first ")" after it.
      if (line.includes(".default(')"))
        end = line.indexOf(".default(')") + ".default(')".length - 1;
      lines[i] =
        `${line.slice(0, start)}.default(sql\`${exact.replaceAll('`', '\\`')}\`)${line.slice(end + 1)}`;
      fixedDefaults++;
    }
  }

  // foreignKey({ ... name: "<fk>" }) blocks: the name comes two lines after foreignColumns.
  const nameMatch = /name: "([^"]+)"/.exec(line);
  if (nameMatch && authFkNames.has(nameMatch[1]!)) {
    for (let k = i - 1; k >= i - 3; k--) {
      // public.users references auth.users(id) from its own id, which drizzle-kit renders as `table.id`.
      const wrong = table === 'users' ? 'foreignColumns: [table.id]' : 'foreignColumns: [users.id]';
      if (lines[k]!.includes(wrong)) {
        lines[k] = lines[k]!.replace(wrong, 'foreignColumns: [authUsers.id]');
        fixedFks++;
      }
    }
  }
}

let out = lines
  .join('\n')
  .replaceAll('timestamp("', 'timestamp("')
  .replace(/(timestamp\([^)]*?)mode: 'string'/g, "$1mode: 'date'");
out = out.replace(
  'import { sql } from "drizzle-orm"',
  `import { sql } from "drizzle-orm"
import { pgSchema } from "drizzle-orm/pg-core"

// Supabase Auth users. TODO(auth): replace with the Better Auth user table (migration step 3).
export const authSchema = pgSchema("auth")
export const authUsers = authSchema.table("users", { id: uuid().primaryKey() })`,
);
writeFileSync(
  output,
  `// Generated from the Supabase snapshot (supabase/snapshot/public.sql) — see scripts/fix-pulled-schema.ts.\n${out}`,
);
console.log(
  `defaults fixed: ${fixedDefaults}, auth.users foreign keys: ${fixedFks}/${authFkNames.size}`,
);
