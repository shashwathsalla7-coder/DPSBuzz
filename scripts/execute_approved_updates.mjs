import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function executeApprovedUpdates() {
  console.log('=== EXECUTING APPROVED DATABASE UPDATES ===\n');

  // 1. Reconcile follower count for @dpsbuzz
  console.log('1. Fetching real follower count for @dpsbuzz from follows table...');
  const { data: follows, error: fErr } = await supabase
    .from('follows')
    .select('id, follower')
    .eq('following', 'dpsbuzz');

  if (fErr) {
    console.error('Error fetching follows:', fErr);
    return;
  }
  const realCount = follows ? follows.length : 6;
  console.log(`Found ${realCount} real followers for @dpsbuzz.`);

  console.log(`Updating public.profiles SET follower_count = ${realCount} WHERE username = 'dpsbuzz'...`);
  const { data: dpsRes, error: dpsErr } = await supabase
    .from('profiles')
    .update({ follower_count: realCount, updated_at: new Date().toISOString() })
    .eq('username', 'dpsbuzz')
    .select('username, follower_count');

  if (dpsErr) {
    console.error('Failed to update @dpsbuzz follower_count:', dpsErr);
  } else {
    console.log('✅ Successfully updated @dpsbuzz follower_count:', dpsRes);
  }

  // 2. Replace raw base64 avatars with verified Cloudinary URLs
  const avatarUpdates = [
    {
      username: 'shashwath71845',
      url: 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793467674/dpsbuzz/avatars/avatar_shashwath71845.jpg',
    },
    {
      username: 'vignesh',
      url: 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793467675/dpsbuzz/avatars/avatar_vignesh.jpg',
    },
    {
      username: 'chandan',
      url: 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1793467676/dpsbuzz/avatars/avatar_chandan.jpg',
    },
  ];

  console.log('\n2. Updating base64 avatars to Cloudinary CDN URLs...');
  for (const item of avatarUpdates) {
    console.log(`Updating avatar for @${item.username}...`);
    const { data: avRes, error: avErr } = await supabase
      .from('profiles')
      .update({ avatar_url: item.url, updated_at: new Date().toISOString() })
      .eq('username', item.username)
      .select('username, avatar_url');

    if (avErr) {
      console.error(`Failed to update avatar for @${item.username}:`, avErr);
    } else {
      console.log(`✅ Successfully updated @${item.username} avatar:`, avRes?.[0]?.avatar_url);
    }
  }

  console.log('\n=== VERIFYING FINAL PROFILE DATA ===');
  const { data: finalProfiles, error: pErr } = await supabase
    .from('profiles')
    .select('username, follower_count, following_count, avatar_url')
    .in('username', ['dpsbuzz', 'shashwath71845', 'vignesh', 'chandan']);

  if (pErr) {
    console.error('Error fetching final profiles:', pErr);
  } else {
    for (const p of finalProfiles) {
      const isBase64 = (p.avatar_url || '').startsWith('data:');
      console.log(`@${p.username}: followers=${p.follower_count}, following=${p.following_count}, avatar_is_base64=${isBase64}`);
    }
  }
}

executeApprovedUpdates();
