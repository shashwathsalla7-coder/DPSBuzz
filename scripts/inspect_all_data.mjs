import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service')
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

const CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID || env.R2_ACCOUNT_ID || '';
const CF_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID || '';
const CF_API_TOKEN = env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_D1_TOKEN || '';

async function queryD1(sql, params = []) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  return data.result?.[0]?.results || [];
}

async function inspect() {
  console.log('=== CLOUDFLARE D1 PROFILES ===');
  const d1Profs = await queryD1('SELECT username, full_name, role, alias_of FROM profiles');
  for (const p of d1Profs) {
    console.log(`- @${p.username} (${p.full_name}) [role: ${p.role}, alias_of: ${p.alias_of}]`);
  }

  console.log('\n=== SUPABASE PROFILES ===');
  const { data: profs } = await sb.from('profiles').select('id, username, full_name, role');
  for (const p of profs || []) {
    console.log(`- @${p.username} (${p.full_name}) [role: ${p.role}]`);
  }

  console.log('\n=== SUPABASE POSTS ===');
  const { data: posts } = await sb.from('posts').select('*');
  for (const p of posts || []) {
    console.log(`- Post ${p.id} [by @${p.username || p.user_id}]: "${p.caption?.substring(0, 50)}"`);
  }

  console.log('\n=== SERVERSTORE DATA ===');
  try {
    const store = JSON.parse(fs.readFileSync('serverStore.json', 'utf8'));
    console.log('Notices:', store.notices?.map((n) => n.title));
    console.log('Profiles in store:', store.profiles?.map((p) => p.username));
    console.log('Posts in store:', store.posts?.length);
  } catch (e) {
    console.log('serverStore.json:', e.message);
  }
}

inspect().catch(console.error);
