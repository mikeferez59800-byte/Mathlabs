#!/usr/bin/env node
// Writes migrations/NNNN_name.sql from src/championship/schema.mjs (for `wrangler d1 migrations apply`).
// The API also applies the same schema by itself on its first request, so this is optional.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIGRATIONS, migrationSql } from '../src/championship/schema.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
fs.mkdirSync(dir, { recursive: true });
for (const m of MIGRATIONS) {
  const f = path.join(dir, `${String(m.version).padStart(4, '0')}_${m.name}.sql`);
  fs.writeFileSync(f, migrationSql(m));
  console.log('wrote', path.relative(process.cwd(), f));
}
