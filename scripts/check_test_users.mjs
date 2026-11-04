import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service')
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

async function check() {
  const testUsers = ['testaccount', 'testing', 'test_insert_probe', 'test_uuid5_user'];
  console.log('Checking foreign references for test users...');
  
  for (const u of testUsers) {
    const { data: follows } = await sb.from('follows').select('*').or(`follower.eq.${u},following.eq.${u}`);
    const { data: msgs } = await sb.from('messages').select('id').or(`sender_id.eq.${u},chat_id.ilike.%${u}%`);
    const { data: posts } = await sb.from('posts').select('id').or(`user_id.eq.${u},username.eq.${u}`);
    console.log(`- @${u}: ${follows?.length || 0} follows, ${msgs?.length || 0} msgs, ${posts?.length || 0} posts`);
  }
}

check().catch(console.error);
