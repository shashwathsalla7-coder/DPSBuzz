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

async function checkFollowerCounts() {
  console.log('=== 1. FETCHING ALL FOLLOWS ROWS FROM SUPABASE ===');
  const { data: follows, error: fErr } = await supabase.from('follows').select('*');
  if (fErr) {
    console.error('Error fetching follows:', fErr);
    return;
  }
  console.log(`Total follows rows in Supabase: ${follows.length}`);
  for (const f of follows) {
    console.log(` - follower: "${f.follower}" -> following: "${f.following}" (id: ${f.id})`);
  }

  console.log('\n=== 2. FETCHING ALL PROFILES FROM SUPABASE ===');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, username, full_name, follower_count, following_count');
  if (pErr) {
    console.error('Error fetching profiles:', pErr);
    return;
  }

  console.log('\n=== 3. RECONCILIATION TABLE: STORED VS REAL FOLLOWS ===');
  console.log('Username'.padEnd(20) + 'Stored Follower'.padEnd(18) + 'Real Follower'.padEnd(16) + 'Stored Following'.padEnd(18) + 'Real Following'.padEnd(16) + 'Status');
  console.log('-'.repeat(100));

  let wrongCount = 0;
  for (const p of profiles) {
    const u = (p.username || '').toLowerCase().trim();
    // Real counts from follows table
    const realFollowers = follows.filter(f => (f.following || '').toLowerCase().trim() === u).length;
    const realFollowing = follows.filter(f => (f.follower || '').toLowerCase().trim() === u).length;

    const storedFollowers = p.follower_count || 0;
    const storedFollowing = p.following_count || 0;

    const isMatch = (storedFollowers === realFollowers) && (storedFollowing === realFollowing);
    if (!isMatch) wrongCount++;

    const status = isMatch ? 'MATCH (OK)' : 'MISMATCH (WRONG)';
    console.log(
      `@${u}`.padEnd(20) +
      String(storedFollowers).padEnd(18) +
      String(realFollowers).padEnd(16) +
      String(storedFollowing).padEnd(18) +
      String(realFollowing).padEnd(16) +
      status
    );
  }

  console.log(`\nTotal profiles checked: ${profiles.length}`);
  console.log(`Total profiles with mismatched counts: ${wrongCount}`);
}

checkFollowerCounts();
