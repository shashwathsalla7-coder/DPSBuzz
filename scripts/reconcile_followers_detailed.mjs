import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function reconcileFollowers() {
  const { data: follows, error: fErr } = await supabase.from('follows').select('*');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');

  if (fErr || pErr) {
    console.error('Error:', fErr || pErr);
    return;
  }

  console.log('=== FOLLOWER & FOLLOWING RECONCILIATION ===');
  let mismatchCount = 0;
  for (const p of profiles) {
    const u = (p.username || '').toLowerCase().trim();
    const realFollowers = follows.filter(f => (f.following || '').toLowerCase().trim() === u).length;
    const realFollowing = follows.filter(f => (f.follower || '').toLowerCase().trim() === u).length;

    const followerDiff = realFollowers - (p.follower_count || 0);
    const followingDiff = realFollowing - (p.following_count || 0);

    if (followerDiff !== 0 || followingDiff !== 0) {
      mismatchCount++;
      console.log(`❌ @${p.username}: Stored [${p.follower_count} fers, ${p.following_count} fing] vs Real [${realFollowers} fers, ${realFollowing} fing] -> Diff: [${followerDiff > 0 ? '+' + followerDiff : followerDiff} fers, ${followingDiff > 0 ? '+' + followingDiff : followingDiff} fing]`);
    } else {
      console.log(`✅ @${p.username}: Matches [${realFollowers} fers, ${realFollowing} fing]`);
    }
  }
  console.log(`\nTotal mismatches: ${mismatchCount} / ${profiles.length}`);
}

reconcileFollowers();
