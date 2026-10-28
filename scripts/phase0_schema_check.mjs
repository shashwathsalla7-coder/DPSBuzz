import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTables() {
  const tableList = [
    'profiles', 'posts', 'comments', 'likes', 'messages', 'conversations',
    'follows', 'follow_requests', 'stories', 'story_views', 'notifications',
    'roster', 'games', 'game_moves', 'game_sessions', 'four_in_a_row',
    'habit_streaks', 'audit_logs', 'reports', 'post_shares', 'media_uploads',
    'chats', 'room_participants'
  ];
  console.log('=== SUPABASE TABLES CHECK ===');
  for (const t of tableList) {
    const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`TABLE ${t}: ${error.code} - ${error.message}`);
    } else {
      console.log(`TABLE ${t}: EXISTS (rows: ${count})`);
    }
  }

  console.log('\n=== CHECKING PROFILES COLUMNS & DATA ===');
  const { data: sampleProfile, error: profErr } = await supabase.from('profiles').select('*').limit(1);
  if (profErr) {
    console.log('Profiles select error:', profErr.message);
  } else if (sampleProfile && sampleProfile.length > 0) {
    console.log('Profiles columns:', Object.keys(sampleProfile[0]).join(', '));
  }

  console.log('\n=== CHECKING POSTS COLUMNS & DATA ===');
  const { data: samplePost, error: postErr } = await supabase.from('posts').select('*').limit(1);
  if (postErr) {
    console.log('Posts select error:', postErr.message);
  } else if (samplePost && samplePost.length > 0) {
    console.log('Posts columns:', Object.keys(samplePost[0]).join(', '));
  }

  console.log('\n=== CHECKING MESSAGES COLUMNS & DATA ===');
  const { data: sampleMsg, error: msgErr } = await supabase.from('messages').select('*').limit(1);
  if (msgErr) {
    console.log('Messages select error:', msgErr.message);
  } else if (sampleMsg && sampleMsg.length > 0) {
    console.log('Messages columns:', Object.keys(sampleMsg[0]).join(', '));
  }

  console.log('\n=== CHECKING FOLLOWS COLUMNS & DATA ===');
  const { data: sampleFollow, error: followErr } = await supabase.from('follows').select('*').limit(1);
  if (followErr) {
    console.log('Follows select error:', followErr.message);
  } else if (sampleFollow && sampleFollow.length > 0) {
    console.log('Follows columns:', Object.keys(sampleFollow[0]).join(', '));
  }
}

checkTables();
