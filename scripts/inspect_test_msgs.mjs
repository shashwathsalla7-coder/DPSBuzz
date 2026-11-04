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
  const { data: msgs } = await sb.from('messages').select('*').or('sender_id.eq.testaccount,sender_id.eq.testing,chat_id.ilike.%testaccount%,chat_id.ilike.%testing%');
  for (const m of msgs || []) {
    console.log(m.id, '| chat:', m.chat_id, '| sender:', m.sender_id, '| text:', m.text);
  }
}

check().catch(console.error);
