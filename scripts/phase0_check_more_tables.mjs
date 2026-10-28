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

async function testMoreTables() {
  const tableList = [
    'app_settings', 'server_store', 'connect4_games', 'connect4_sessions',
    'game_invites', 'chats', 'system_settings', 'users'
  ];

  for (const t of tableList) {
    const res = await supabase.from(t).select('*').limit(1);
    if (res.error) {
      console.log(`Table '${t}': ERROR -> code: ${res.error.code}, msg: ${res.error.message}`);
    } else {
      console.log(`Table '${t}': OK -> returned ${res.data.length} sample row(s)`);
    }
  }
}

testMoreTables();
