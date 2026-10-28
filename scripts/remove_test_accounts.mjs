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

const TEST_USERNAMES = ['testaccount', 'testing', 'test_insert_probe', 'test_uuid5_user', 'ab'];

async function cleanupTestAccounts() {
  console.log('=== Cleaning up test accounts from Supabase ===');

  for (const u of TEST_USERNAMES) {
    // 1. Delete from follows
    await supabase.from('follows').delete().eq('follower', u);
    await supabase.from('follows').delete().eq('following', u);

    // 2. Delete from follow_requests
    await supabase.from('follow_requests').delete().eq('requester', u);
    await supabase.from('follow_requests').delete().eq('target', u);

    // 3. Delete from likes
    await supabase.from('likes').delete().eq('username', u);

    // 4. Delete from posts
    await supabase.from('posts').delete().eq('username', u);

    // 5. Delete from profiles
    const { error } = await supabase.from('profiles').delete().eq('username', u);
    if (error) console.error(`Error deleting profile ${u}:`, error.message);
    else console.log(`Deleted profile @${u} from Supabase`);
  }

  // Also check if any profile has full_name = 'Ab'
  const { data: abProfiles } = await supabase.from('profiles').select('username, full_name').ilike('full_name', 'Ab');
  if (Array.isArray(abProfiles) && abProfiles.length > 0) {
    for (const ab of abProfiles) {
      console.log(`Found profile with name Ab: @${ab.username}, deleting...`);
      await supabase.from('follows').delete().eq('follower', ab.username);
      await supabase.from('follows').delete().eq('following', ab.username);
      await supabase.from('profiles').delete().eq('username', ab.username);
    }
  }

  console.log('\n=== Recalculating Follower & Following Counts for All Profiles ===');
  const { data: profiles } = await supabase.from('profiles').select('username');
  if (Array.isArray(profiles)) {
    for (const p of profiles) {
      const u = p.username;
      // Real follower count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following', u);

      // Real following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower', u);

      // Real post count
      const { count: postCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('username', u);

      await supabase.from('profiles').update({
        follower_count: followersCount || 0,
        following_count: followingCount || 0,
        post_count: postCount || 0,
      }).eq('username', u);

      console.log(`@${u}: followers=${followersCount || 0}, following=${followingCount || 0}, posts=${postCount || 0}`);
    }
  }

  // 4. Clean server_store.json
  try {
    if (fs.existsSync('data/server_store.json')) {
      const storeContent = fs.readFileSync('data/server_store.json', 'utf8');
      const store = JSON.parse(storeContent);
      const testSet = new Set(TEST_USERNAMES);
      store.profiles = (store.profiles || []).filter((p) => p && !testSet.has(p.username.toLowerCase()) && p.fullName !== 'Ab');
      store.follows = (store.follows || []).filter((f) => f && !testSet.has(f.follower.toLowerCase()) && !testSet.has(f.following.toLowerCase()));
      store.followRequests = (store.followRequests || []).filter((r) => r && !testSet.has(r.requester.toLowerCase()) && !testSet.has(r.target.toLowerCase()));
      fs.writeFileSync('data/server_store.json', JSON.stringify(store, null, 2), 'utf8');
      console.log('Cleaned test accounts from data/server_store.json');
    }
  } catch (err) {
    console.error('Error cleaning server_store.json:', err);
  }

  console.log('\n=== Clean-up complete! ===');
}

cleanupTestAccounts();
