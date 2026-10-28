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

async function testFetchAll() {
  const { data, count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact' });
  console.log('Total messages in messages table:', count, 'Error:', error);
  if (data) {
    console.log(`Fetched ${data.length} messages. First 5:`);
    for (const d of data.slice(0, 5)) {
      console.log(`- [${d.chat_id}] ${d.sender_id}: "${d.text}" (${d.created_at})`);
    }
  }
}

testFetchAll();
