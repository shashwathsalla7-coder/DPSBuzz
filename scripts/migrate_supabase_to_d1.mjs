#!/usr/bin/env node
// Copies every row from the old Supabase tables into Cloudflare D1 (sb_* tables).
// Safe to run more than once: rows are upserted by primary key.
//
// Usage (from the project folder):
//   node scripts/migrate_supabase_to_d1.mjs            (reads .env.local)
//   node scripts/migrate_supabase_to_d1.mjs --dry-run  (counts only)

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dryRun = process.argv.includes('--dry-run');
const env = { ...process.env };
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
}

const { TABLES, tableName, createTableSql } = await import(
  pathToFileURL(path.resolve('src/lib/db/schema.ts')).href
);

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-')
    ? env.SUPABASE_SERVICE_ROLE_KEY
    : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`;

async function d1(sql, params = []) {
  const res = await fetch(D1_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result[0].results;
}

async function readAll(table) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${SB_URL}/rest/v1/${table}?select=*&order=${TABLES[table].primaryKey}&limit=1000&offset=${offset}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

function encode(table, col, v) {
  const def = TABLES[table];
  if (v === undefined || v === null) return null;
  if (def.json?.includes(col)) return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

let total = 0;
for (const table of Object.keys(TABLES)) {
  let rows;
  try {
    rows = await readAll(table);
  } catch (err) {
    console.log(`  skip  ${table}: ${String(err.message).slice(0, 90)}`);
    continue;
  }
  if (dryRun) {
    console.log(`  ${String(rows.length).padStart(5)}  ${table}`);
    continue;
  }
  for (const sql of createTableSql(table)) await d1(sql);
  const cols = TABLES[table].columns;
  const pk = TABLES[table].primaryKey;
  const perStmt = Math.max(1, Math.floor(90 / cols.length));
  for (let i = 0; i < rows.length; i += perStmt) {
    const chunk = rows.slice(i, i + perStmt);
    const params = [];
    for (const r of chunk) for (const c of cols) params.push(encode(table, c, r[c]));
    const values = chunk.map(() => `(${cols.map(() => '?').join(', ')})`).join(', ');
    const updates = cols.filter((c) => c !== pk).map((c) => `"${c}" = excluded."${c}"`).join(', ');
    await d1(
      `INSERT INTO ${tableName(table)} (${cols.map((c) => `"${c}"`).join(', ')}) VALUES ${values}
       ON CONFLICT("${pk}") DO UPDATE SET ${updates};`,
      params
    );
  }
  const [{ n }] = await d1(`SELECT COUNT(*) AS n FROM ${tableName(table)};`);
  total += rows.length;
  console.log(`  ok    ${table}: copied ${rows.length}, now ${n} in D1 (${tableName(table)})`);
}
console.log(dryRun ? '\nDry run only, nothing written.' : `\nDone. ${total} rows copied.`);
