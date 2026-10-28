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

async function testUpsert() {
  const row = {
    client_id: `test-${Date.now()}`,
    chat_id: 'test__user',
    sender_id: 'test_user',
    text: 'probe test message',
  };
  const { data, error } = await supabase.from('messages').upsert(row, { onConflict: 'client_id' });
  console.log('Upsert with onConflict client_id result:', { data, error });
}

testUpsert();
