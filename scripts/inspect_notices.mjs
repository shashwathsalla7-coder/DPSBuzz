import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

async function inspectNotices() {
  const CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID || env.R2_ACCOUNT_ID || '';
  const CF_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID || '';
  const CF_API_TOKEN = env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_D1_TOKEN || '';

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: 'SELECT * FROM notices', params: [] }),
  });
  const data = await res.json();
  const rows = data.result?.[0]?.results || [];
  console.log(`D1 NOTICES (${rows.length}):`);
  for (const r of rows) {
    console.log(`- [${r.id}] ${r.title} (${r.category}) date: ${r.date}`);
  }
}

inspectNotices().catch(console.error);
