#!/usr/bin/env node
// Checks that the environment variables DPS Buzz needs in production are set
// and look valid. Never prints secret values.
//
// Usage:
//   node scripts/check-production-env.mjs            (reads .env.local)
//   node scripts/check-production-env.mjs path/to/.env
//   vercel env pull .env.production.local && node scripts/check-production-env.mjs .env.production.local

import fs from 'node:fs';

const file = process.argv[2] || '.env.local';
if (process.argv[2] && !fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  console.error('Run this from the project folder. To download your Vercel settings first:');
  console.error('  npx vercel login');
  console.error('  npx vercel link');
  console.error(`  npx vercel env pull ${file}`);
  process.exit(2);
}
const env = { ...process.env };
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '');
  }
}

const jwtRole = (v) => {
  try {
    return JSON.parse(Buffer.from(v.split('.')[1], 'base64url').toString()).role;
  } catch {
    return null;
  }
};
const placeholder = (v) => /your[-_]|placeholder|changeme|choose-a/i.test(v || '');

const checks = [
  ['SESSION_SECRET', (v) => v.length >= 32 || 'must be at least 32 characters'],
  ['ADMIN_PASSWORD', (v) => (v.length >= 8 && v !== '71845shashwath123') || 'must be 8+ characters and not the old leaked password'],
  ['ADMIN_USERNAME', (v) => v.length > 0 || 'missing'],
  ['SCHOOL_INVITE_CODE', (v) => (v.length >= 4 ? (v.toUpperCase() === 'DPS71845' ? 'WARN: still the old public code' : true) : 'missing')],
  ['NEXT_PUBLIC_SUPABASE_URL', (v) => /^https:\/\/.+\.supabase\.co$/.test(v) || 'must look like https://<id>.supabase.co'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', (v) => jwtRole(v) === 'anon' || 'must be the anon (public) key'],
  ['SUPABASE_SERVICE_ROLE_KEY', (v) => jwtRole(v) === 'service_role' || 'must be the service_role key (Supabase → Settings → API)'],
  ['CLOUDFLARE_ACCOUNT_ID', (v) => /^[0-9a-f]{32}$/i.test(v) || 'must be a 32-character account id'],
  ['CLOUDFLARE_D1_DATABASE_ID', (v) => /^[0-9a-f-]{36}$/i.test(v) || 'must be the D1 database UUID'],
  ['CLOUDFLARE_API_TOKEN', (v) => v.length >= 30 || 'missing or too short'],
  ['CLOUDINARY_CLOUD_NAME', (v) => v.length > 0 || 'missing'],
  ['CLOUDINARY_API_KEY', (v) => v.length > 0 || 'missing'],
  ['CLOUDINARY_API_SECRET', (v) => v.length > 0 || 'missing'],
  ['GEMINI_API_KEY', (v) => v.length > 20 || 'missing (AI Diary will not answer)'],
  ['ZEGO_SERVER_SECRET', (v) => v.length === 32 || 'WARN: not set, voice/video calls stay off'],
  ['NEXT_PUBLIC_ZEGO_APP_ID', (v) => /^\d+$/.test(v) || 'WARN: not set, voice/video calls stay off'],
  ['CRON_SECRET', (v) => v.length >= 16 || 'WARN: not set, cleanup job can only be run by an admin'],
];

const mustNotExist = ['NEXT_PUBLIC_ZEGO_SERVER_SECRET', 'NEXT_PUBLIC_GEMINI_API_KEY'];

let failures = 0;
let warnings = 0;
console.log(`Checking ${fs.existsSync(file) ? file : 'process environment'}\n`);
for (const [name, test] of checks) {
  const v = env[name] || '';
  const optional = /WARN/.test(String(test('')));
  let result = v && !placeholder(v) ? test(v) : optional ? String(test('')) : 'missing or still a placeholder';
  if (result === true) {
    console.log(`  ok    ${name}`);
  } else if (String(result).startsWith('WARN')) {
    warnings++;
    console.log(`  warn  ${name}: ${String(result).replace(/^WARN:\s*/, '')}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}: ${result}`);
  }
}
for (const name of mustNotExist) {
  if (env[name]) {
    failures++;
    console.log(`  FAIL  ${name}: remove it, NEXT_PUBLIC_ values are sent to every browser`);
  }
}
console.log(`\n${failures} problem(s), ${warnings} warning(s).`);
process.exit(failures ? 1 : 0);
