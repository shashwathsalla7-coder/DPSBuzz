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

async function inspectTestAccounts() {
  const { data: allProfiles } = await supabase.from('profiles').select('*');
  const targetProfiles = (allProfiles || []).filter(
    (p) => p.username === 'ab' || p.username === 'testing' || p.username === 'testaccount' || p.full_name?.toLowerCase() === 'ab' || p.username.includes('test')
  );

  console.log('=== TEST ACCOUNT CANDIDATES IN SUPABASE ===');
  for (const p of targetProfiles) {
    console.log(`\nAccount: @${p.username} (${p.full_name})`);
    console.log(`ID: ${p.id}, Class: ${p.class}-${p.section}, Role: ${p.role}, Created: ${p.created_at}`);

    // Follows given
    const { data: given } = await supabase.from('follows').select('following').eq('follower', p.username);
    console.log(`Following (${given?.length || 0}):`, (given || []).map(f => f.following));

    // Follows received
    const { data: received } = await supabase.from('follows').select('follower').eq('following', p.username);
    console.log(`Followers (${received?.length || 0}):`, (received || []).map(f => f.follower));

    // Follow requests
    const { data: reqsOut } = await supabase.from('follow_requests').select('target').eq('requester', p.username);
    const { data: reqsIn } = await supabase.from('follow_requests').select('requester').eq('target', p.username);
    console.log(`Follow Requests Out:`, (reqsOut || []).map(r => r.target));
    console.log(`Follow Requests In:`, (reqsIn || []).map(r => r.requester));

    // Posts
    const { data: posts } = await supabase.from('posts').select('id, caption').eq('username', p.username);
    console.log(`Posts (${posts?.length || 0})`);

    // Likes
    const { data: likes } = await supabase.from('likes').select('post_id').eq('username', p.username);
    console.log(`Likes given (${likes?.length || 0})`);

    // Messages
    const { data: msgs } = await supabase.from('messages').select('id').eq('sender_id', p.username);
    console.log(`Messages sent (${msgs?.length || 0})`);
  }
}

inspectTestAccounts();
