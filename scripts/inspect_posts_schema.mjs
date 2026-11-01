import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectPosts() {
  const { data, count, error } = await sb.from('posts').select('id, username, caption, image_url, created_at', { count: 'exact' });
  console.log('Posts query error:', error);
  console.log('Total posts in Supabase:', count);
  for (const p of (data || [])) {
    console.log(`- [${p.id}] by @${p.username}: "${p.caption?.slice(0, 40)}" | image: ${p.image_url ? 'YES' : 'NO'}`);
  }
}
inspectPosts();
