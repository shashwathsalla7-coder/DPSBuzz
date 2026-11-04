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
  const { data: profiles } = await supabase.from('profiles').select('id, username, follower_count, following_count');
  const { data: follows } = await supabase.from('follows').select('*');
  const { data: posts } = await supabase.from('posts').select('id, image_url, images');

  console.log('Posts count:', posts ? posts.length : 0);
  for (const post of posts || []) {
    console.log('Post:', post.id, 'image_url:', post.image_url ? post.image_url.substring(0, 30) : null, 'images:', post.images);
    if (post.image_url && post.image_url.startsWith('data:')) {
      console.log('BASE64 POST FOUND:', post.id);
    }
  }

  console.log('\n--- Profiles Mismatch Check ---');
  for (const p of profiles || []) {
    const u = (p.username || '').toLowerCase().trim();
    const realFers = (follows || []).filter(f => (f.following || '').toLowerCase().trim() === u).length;
    const realFing = (follows || []).filter(f => (f.follower || '').toLowerCase().trim() === u).length;
    if (p.follower_count !== realFers || p.following_count !== realFing) {
      console.log(`MISMATCH: @${p.username} stored [${p.follower_count} fers, ${p.following_count} fing] vs real [${realFers} fers, ${realFing} fing]`);
    }
  }

  // Check uploadRouteCode & chatRouteCode
  const uploadRouteCode = fs.readFileSync('src/app/api/upload/route.ts', 'utf8');
  const chatRouteCode = fs.readFileSync('src/app/api/chats/route.ts', 'utf8');
  console.log('uploadRouteCode has cloudinary:', uploadRouteCode.includes('cloudinary.uploader.upload'));
  console.log('chatRouteCode has cloudinary:', chatRouteCode.includes('cloudinary.uploader.upload'));
}

main().catch(console.error);
