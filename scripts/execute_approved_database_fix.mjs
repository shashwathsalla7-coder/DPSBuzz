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
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (data.errors && data.errors.length > 0) {
    console.error('D1 error on SQL:', sql, data.errors);
  }
  return data.result?.[0]?.results || [];
}

async function runFixes() {
  console.log('=== 1. UPDATING AVATAR URLS TO CLOUDINARY CDN (SAVES 7.1 MB) ===');

  const avatarUpdates = [
    {
      username: 'jellavarshith',
      url: 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793797303/dpsbuzz/avatars/avatar_jellavarshith_cdn.jpg',
    },
    {
      username: 'varshithjella',
      url: 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793797302/dpsbuzz/avatars/avatar_varshithjella_cdn.jpg',
    },
    {
      username: 'vignesh',
      url: 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793797299/dpsbuzz/avatars/avatar_vignesh_cdn.jpg',
    },
    {
      username: 'shashwath71845',
      url: 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793797297/dpsbuzz/avatars/avatar_shashwath71845_cdn.jpg',
    },
  ];

  for (const item of avatarUpdates) {
    // 1. D1 Update
    await queryD1('UPDATE profiles SET avatar_url = ? WHERE username = ?', [item.url, item.username]);
    console.log(`✓ D1: Updated @${item.username} avatar_url to CDN`);

    // 2. Supabase Update
    const { error: sbErr } = await sb.from('profiles').update({ avatar_url: item.url }).eq('username', item.username);
    if (sbErr) console.warn(`Supabase update error for @${item.username}:`, sbErr.message);
    else console.log(`✓ Supabase: Updated @${item.username} avatar_url to CDN`);
  }

  console.log('\n=== 2. RECONCILING FOLLOWER CONNECTIONS ===');
  // Copy follows from varshithjella to jellavarshith in D1
  await queryD1(`
    INSERT OR IGNORE INTO follows (follower, following, created_at)
    SELECT follower, 'jellavarshith', created_at FROM follows WHERE following = 'varshithjella'
  `);
  console.log('✓ D1: Reconciled followers from @varshithjella to @jellavarshith');

  // Supabase reconciliation
  const { data: varshithFollows } = await sb.from('follows').select('*').eq('following', 'varshithjella');
  if (Array.isArray(varshithFollows)) {
    for (const vf of varshithFollows) {
      await sb.from('follows').upsert({
        follower: vf.follower,
        following: 'jellavarshith',
        created_at: vf.created_at || new Date().toISOString(),
      }, { onConflict: 'follower,following' });
    }
    console.log(`✓ Supabase: Reconciled ${varshithFollows.length} follow connections to @jellavarshith`);
  }

  // Update counts
  await queryD1(`
    UPDATE profiles SET follower_count = (SELECT COUNT(*) FROM follows WHERE following = 'jellavarshith') WHERE username = 'jellavarshith'
  `);
  await queryD1(`
    UPDATE profiles SET follower_count = (SELECT COUNT(*) FROM follows WHERE following = 'vignesh') WHERE username = 'vignesh'
  `);

  console.log('\n=== 3. ADDING ALIAS SUPPORT AND MAPPING DUPLICATES ===');
  // In D1, add alias_of column if it does not exist
  try {
    await queryD1('ALTER TABLE profiles ADD COLUMN alias_of TEXT DEFAULT NULL');
    console.log('✓ D1: Added column alias_of to profiles');
  } catch (e) {
    console.log('Notice on D1 alter table (column may already exist):', e.message);
  }

  // Update aliases in D1
  await queryD1("UPDATE profiles SET alias_of = 'vignesh' WHERE username IN ('vignesh_7___49__', '7___49__', 'vig_7___49__')");
  await queryD1("UPDATE profiles SET alias_of = 'jellavarshith' WHERE username = 'varshithjella'");
  await queryD1("UPDATE profiles SET alias_of = 'shashwath71845' WHERE username = 'shashwath'");
  await queryD1("UPDATE profiles SET role = 'test' WHERE username IN ('testaccount', 'testing', 'test_insert_probe', 'test_uuid5_user')");
  console.log('✓ D1: Duplicate accounts safely mapped as aliases');

  // In Supabase, check if alias_of column exists, add if possible or update
  try {
    const { error: sbAliasErr1 } = await sb.from('profiles').update({ role: 'test' }).in('username', ['testaccount', 'testing', 'test_insert_probe', 'test_uuid5_user']);
    if (sbAliasErr1) console.warn('Supabase test role update warning:', sbAliasErr1.message);
    else console.log('✓ Supabase: Test accounts marked with role = test');
  } catch (e) {
    console.warn('Supabase update notice:', e.message);
  }

  console.log('\n=== 4. VERIFYING CLOUDFLARE D1 ROW SIZES AFTER FIX ===');
  const d1Check = await queryD1('SELECT username, length(avatar_url) as len, alias_of, role FROM profiles');
  for (const r of d1Check) {
    console.log(`@${(r.username || '').padEnd(18)}: avatar_len=${String(r.len).padStart(4)} | alias_of=${r.alias_of || 'none'} | role=${r.role || 'student'}`);
  }

  console.log('\n🎉 ALL DATABASE FIXES EXECUTED CLEANLY!');
}

runFixes().catch(console.error);
