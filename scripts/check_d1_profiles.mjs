import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID || env.R2_ACCOUNT_ID || '';
const CF_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID || '';
const CF_API_TOKEN = env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_D1_TOKEN || '';

async function queryD1(sql, params = []) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (data.errors && data.errors.length > 0) {
    console.error('D1 errors:', data.errors);
  }
  return data.result?.[0]?.results || [];
}

async function run() {
  console.log('=== CHECKING CLOUDFLARE D1 PROFILES ===');
  const rows = await queryD1('SELECT * FROM profiles');
  console.log(`Total profiles in D1: ${rows.length}`);
  for (const r of rows) {
    const av = r.avatar_url || r.avatar || '';
    console.log(`@${(r.username || '').padEnd(18)}: av_len=${av.length}, class=${r.class}-${r.section}`);
  }
}

run().catch(console.error);
