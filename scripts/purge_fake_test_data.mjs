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
  return data;
}

const TEST_USERNAMES = ['testaccount', 'testing', 'test_insert_probe', 'test_uuid5_user'];
const DUPLICATE_POST_ID = 'post-1793629371356';

async function purge() {
  console.log('🚀 Starting safe fake test data purge...');

  // 1. Supabase: Delete test game messages
  console.log('\n--- 1. Supabase Messages ---');
  const { data: testMsgs, error: msgErr1 } = await sb
    .from('messages')
    .select('id, chat_id, sender_id')
    .or('sender_id.eq.testaccount,sender_id.eq.testing,chat_id.ilike.%testaccount%,chat_id.ilike.%testing%');
  
  console.log(`Found ${testMsgs?.length || 0} test messages to delete in Supabase:`, testMsgs?.map((m) => m.id));
  if (testMsgs && testMsgs.length > 0) {
    const ids = testMsgs.map((m) => m.id);
    const { error: delMsgErr } = await sb.from('messages').delete().in('id', ids);
    if (delMsgErr) console.error('Error deleting test messages:', delMsgErr);
    else console.log('✅ Successfully deleted test messages from Supabase.');
  }

  // 2. Supabase: Delete duplicate post
  console.log('\n--- 2. Supabase Duplicate Post ---');
  const { data: dupPost } = await sb.from('posts').select('id, caption, user_id').eq('id', DUPLICATE_POST_ID);
  console.log('Duplicate post check:', dupPost);
  if (dupPost && dupPost.length > 0) {
    const { error: delPostErr } = await sb.from('posts').delete().eq('id', DUPLICATE_POST_ID);
    if (delPostErr) console.error('Error deleting duplicate post:', delPostErr);
    else console.log(`✅ Successfully deleted duplicate post ${DUPLICATE_POST_ID} from Supabase.`);
  } else {
    console.log('Duplicate post not found or already deleted.');
  }

  // 3. Supabase: Delete test profiles
  console.log('\n--- 3. Supabase Test Profiles ---');
  const { error: delProfsErr } = await sb.from('profiles').delete().in('username', TEST_USERNAMES);
  if (delProfsErr) {
    console.error('Error deleting Supabase test profiles:', delProfsErr);
  } else {
    console.log(`✅ Successfully deleted ${TEST_USERNAMES.join(', ')} from Supabase profiles.`);
  }

  // 4. Cloudflare D1: Delete test profiles & duplicate post
  console.log('\n--- 4. Cloudflare D1 Cleanup ---');
  try {
    const d1Res = await queryD1(
      `DELETE FROM profiles WHERE username IN (?, ?, ?, ?)`,
      TEST_USERNAMES
    );
    console.log('D1 profiles delete response:', d1Res?.success ? '✅ Success' : d1Res);

    const d1PostRes = await queryD1(
      `DELETE FROM posts WHERE id = ?`,
      [DUPLICATE_POST_ID]
    );
    console.log('D1 duplicate post delete response:', d1PostRes?.success ? '✅ Success' : d1PostRes);
  } catch (e) {
    console.error('D1 error:', e.message);
  }

  // 5. Verification
  console.log('\n--- 5. Verification After Purge ---');
  const { data: remainingProfs } = await sb.from('profiles').select('username').in('username', TEST_USERNAMES);
  console.log('Remaining test profiles in Supabase:', remainingProfs);

  const { data: remainingPosts } = await sb.from('posts').select('id, caption');
  console.log('Remaining posts in Supabase:', remainingPosts?.map((p) => `${p.id}: "${p.caption?.substring(0, 30)}"`));

  const d1Remaining = await queryD1('SELECT username FROM profiles WHERE username IN (?, ?, ?, ?)', TEST_USERNAMES);
  console.log('Remaining test profiles in D1:', d1Remaining?.result?.[0]?.results || []);

  console.log('\n🎉 Purge complete!');
}

purge().catch(console.error);
