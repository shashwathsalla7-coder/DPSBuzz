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

async function inspectSchema() {
  const tables = [
    'profiles', 'friends', 'friendships', 'friend_requests', 'follows', 'follow_requests',
    'groups', 'group_members', 'group_invitations', 'group_join_requests',
    'messages', 'chats', 'conversations', 'notifications', 'blocks', 'user_blocks',
    'app_settings'
  ];

  for (const t of tables) {
    const res = await supabase.from(t).select('*', { count: 'exact' }).limit(1);
    if (res.error) {
      console.log(`Table [${t}]: ERROR ${res.error.code} - ${res.error.message}`);
    } else {
      console.log(`Table [${t}]: EXISTS (count: ${res.count}, rowsReturned: ${res.data.length})`);
      if (res.data.length > 0) {
        console.log(`   Sample cols: ${Object.keys(res.data[0]).join(', ')}`);
      }
    }
  }
}

inspectSchema().catch(console.error);
