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

async function testPostUpsert() {
  const testPostId = `probe-post-${Date.now()}`;
  const row = {
    id: testPostId,
    user_id: 'shashwath71845',
    username: 'shashwath71845',
    full_name: 'Shashwath Salla',
    caption: 'Probe test post',
    likes_count: 0,
    comments_count: 0,
  };
  const { data, error } = await supabase.from('posts').upsert(row, { onConflict: 'id' }).select();
  console.log('Post upsert result:', { data, error });

  // Cleanup
  await supabase.from('posts').delete().eq('id', testPostId);
}

testPostUpsert();
