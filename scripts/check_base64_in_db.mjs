import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkBase64() {
  console.log('--- Checking Supabase tables for base64 ---');
  const { data: msgs, error: mErr } = await sb.from('messages').select('id, text, post_preview').ilike('text', '%data:image%');
  console.log('Messages with data:image in text:', msgs?.length || 0, mErr || '');

  const { data: posts, error: pErr } = await sb.from('posts').select('id, image_url, caption').ilike('image_url', '%data:image%');
  console.log('Posts with data:image in image_url:', posts?.length || 0, pErr || '');

  const { data: profs, error: prErr } = await sb.from('profiles').select('id, username, avatar_url').ilike('avatar_url', '%data:image%');
  console.log('Profiles with data:image in avatar_url:', profs?.length || 0, prErr || '');
  if (profs && profs.length > 0) {
    for (const p of profs) {
      console.log(`- @${p.username}: avatar_url length = ${p.avatar_url?.length}, preview: ${p.avatar_url?.slice(0, 50)}...`);
    }
  }

  const { data: stories, error: sErr } = await sb.from('stories').select('id, media_url').ilike('media_url', '%data:image%');
  console.log('Stories with data:image in media_url:', stories?.length || 0, sErr || '');
}

checkBase64();
