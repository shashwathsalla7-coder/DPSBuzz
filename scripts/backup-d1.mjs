#!/usr/bin/env node
// Nightly database backup, no npm packages needed.
// Exports every Cloudflare D1 table to one gzipped JSON file and uploads it to
// Cloudinary as a PRIVATE raw file: dpsbuzz/backups/d1-YYYY-MM-DD.json.gz.
// Keeps the last 14 days. Run by .github/workflows/nightly.yml, or locally:
//   node scripts/backup-d1.mjs            (reads .env.local if present)

import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const env = { ...process.env };
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
}
const need = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_D1_DATABASE_ID', 'CLOUDFLARE_API_TOKEN', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = need.filter((k) => !env[k]);
if (missing.length) {
  console.error('Missing settings: ' + missing.join(', '));
  process.exit(1);
}

const KEEP_DAYS = 14;
const FOLDER = 'dpsbuzz/backups';
const D1 = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`;
const CLD = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}`;
const basicAuth = 'Basic ' + Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString('base64');

async function d1(sql, params = []) {
  const res = await fetch(D1, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result[0].results;
}

const tables = (
  await d1("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name != 'd1_migrations' ORDER BY name;")
).map((r) => r.name);

const out = {};
let rows = 0;
for (const name of tables) {
  const all = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await d1(`SELECT * FROM "${name.replace(/"/g, '')}" LIMIT 1000 OFFSET ${offset};`);
    all.push(...page);
    if (page.length < 1000) break;
  }
  out[name] = all;
  rows += all.length;
}

const payload = gzipSync(Buffer.from(JSON.stringify({ createdAt: new Date().toISOString(), source: 'cloudflare-d1', tables: out })));
const publicId = `${FOLDER}/d1-${new Date().toISOString().slice(0, 10)}.json.gz`;

// Signed upload (private raw file)
const timestamp = Math.floor(Date.now() / 1000);
const signed = { overwrite: 'true', public_id: publicId, timestamp: String(timestamp), type: 'private' };
const toSign = Object.keys(signed).sort().map((k) => `${k}=${signed[k]}`).join('&');
const signature = createHash('sha1').update(toSign + env.CLOUDINARY_API_SECRET).digest('hex');
const form = new FormData();
form.append('file', new Blob([payload]), 'backup.json.gz');
for (const [k, v] of Object.entries(signed)) form.append(k, v);
form.append('api_key', env.CLOUDINARY_API_KEY);
form.append('signature', signature);
const up = await fetch(`${CLD}/raw/upload`, { method: 'POST', body: form });
const upJson = await up.json();
if (!up.ok) {
  console.error('Upload failed:', JSON.stringify(upJson).slice(0, 300));
  process.exit(1);
}
console.log(`Backup saved: ${publicId} (${tables.length} tables, ${rows} rows, ${(payload.length / 1024 / 1024).toFixed(1)} MB)`);

// Retention: delete backups older than KEEP_DAYS
const list = await fetch(`${CLD}/resources/raw/private?prefix=${encodeURIComponent(FOLDER + '/d1-')}&max_results=100`, {
  headers: { Authorization: basicAuth },
}).then((r) => r.json());
const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
const old = (list.resources || []).filter((r) => new Date(r.created_at).getTime() < cutoff).map((r) => r.public_id);
if (old.length) {
  const qs = old.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join('&');
  await fetch(`${CLD}/resources/raw/private?${qs}`, { method: 'DELETE', headers: { Authorization: basicAuth } });
  console.log(`Deleted ${old.length} old backup(s).`);
}
