import fs from 'fs';
import path from 'path';
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
const TEST_USERS = ['testaccount', 'testing', 'test_insert_probe', 'test_uuid5_user'];

async function backupAndRemove() {
  console.log('=== Step 1: Exporting Full Backup of Test Accounts ===');
  const backup = {
    timestamp: new Date().toISOString(),
    profiles: [],
    follows: [],
    follow_requests: [],
    likes: [],
    messages: [],
  };

  for (const u of TEST_USERS) {
    const { data: p } = await supabase.from('profiles').select('*').eq('username', u);
    if (p) backup.profiles.push(...p);

    const { data: f1 } = await supabase.from('follows').select('*').eq('follower', u);
    const { data: f2 } = await supabase.from('follows').select('*').eq('following', u);
    if (f1) backup.follows.push(...f1);
    if (f2) backup.follows.push(...f2);

    const { data: r1 } = await supabase.from('follow_requests').select('*').eq('requester', u);
    const { data: r2 } = await supabase.from('follow_requests').select('*').eq('target', u);
    if (r1) backup.follow_requests.push(...r1);
    if (r2) backup.follow_requests.push(...r2);

    const { data: l } = await supabase.from('likes').select('*').eq('username', u);
    if (l) backup.likes.push(...l);

    const { data: m } = await supabase.from('messages').select('*').eq('sender_id', u);
    if (m) backup.messages.push(...m);
  }

  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, 'test_accounts_backup.json');
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`Backup saved to ${backupFile}`);

  console.log('=== Step 2: Removing Test Accounts from Supabase ===');
  for (const u of TEST_USERS) {
    await supabase.from('follows').delete().eq('follower', u);
    await supabase.from('follows').delete().eq('following', u);
    await supabase.from('follow_requests').delete().eq('requester', u);
    await supabase.from('follow_requests').delete().eq('target', u);
    await supabase.from('likes').delete().eq('username', u);
    await supabase.from('messages').delete().eq('sender_id', u);
    await supabase.from('profiles').delete().eq('username', u);
    console.log(`Removed @${u} from Supabase.`);
  }

  console.log('=== Step 3: Reconciling Real Student Follower Counts ===');
  const { data: profiles } = await supabase.from('profiles').select('username');
  if (Array.isArray(profiles)) {
    for (const p of profiles) {
      const u = p.username;
      const { count: followersCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following', u);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower', u);

      await supabase.from('profiles').update({
        follower_count: followersCount || 0,
        following_count: followingCount || 0,
      }).eq('username', u);

      console.log(`@${u}: follower_count=${followersCount || 0}, following_count=${followingCount || 0}`);
    }
  }

  // Also clean data/server_store.json
  try {
    if (fs.existsSync('data/server_store.json')) {
      const content = fs.readFileSync('data/server_store.json', 'utf8');
      const store = JSON.parse(content);
      const testSet = new Set(TEST_USERS);
      store.profiles = (store.profiles || []).filter((p) => p && !testSet.has(p.username.toLowerCase()) && p.fullName !== 'Ab');
      store.follows = (store.follows || []).filter((f) => f && !testSet.has(f.follower.toLowerCase()) && !testSet.has(f.following.toLowerCase()));
      store.followRequests = (store.followRequests || []).filter((r) => r && !testSet.has(r.requester.toLowerCase()) && !testSet.has(r.target.toLowerCase()));
      delete store.chatMessages?.['shashwath71845__testaccount'];
      delete store.chatMessages?.['shashwath71845__testing'];
      fs.writeFileSync('data/server_store.json', JSON.stringify(store, null, 2), 'utf8');
      console.log('Cleaned test accounts from data/server_store.json');
    }
  } catch (err) {
    console.warn('server_store clean notice:', err);
  }

  console.log('=== Test Account Removal Complete! ===');
}

backupAndRemove();
