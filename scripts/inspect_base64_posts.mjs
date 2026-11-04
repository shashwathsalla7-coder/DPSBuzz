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

async function main() {
  const { data: posts } = await supabase.from('posts').select('id, caption, image_url, images, created_at');
  console.log(`Checking ${posts.length} posts for base64:`);
  for (const post of posts) {
    const isB64Url = post.image_url && post.image_url.startsWith('data:');
    const isB64Arr = Array.isArray(post.images) && post.images.some(u => u && u.startsWith('data:'));
    if (isB64Url || isB64Arr) {
      console.log(`Post ID: ${post.id}, caption: "${post.caption}", created: ${post.created_at}`);
      console.log(`  image_url length: ${post.image_url ? post.image_url.length : 0}`);
      console.log(`  images count: ${post.images ? post.images.length : 0}`);
    }
  }

  const { data: dps } = await supabase.from('profiles').select('id, username, follower_count, following_count').eq('username', 'dpsbuzz');
  console.log('\nDPS profile in Supabase:', dps);

  const { data: follows } = await supabase.from('follows').select('*');
  const dpsFollows = (follows || []).filter(f => (f.following || '').toLowerCase().trim() === 'dpsbuzz');
  console.log('DPS follows in follows table count:', dpsFollows.length);
}

main().catch(console.error);
