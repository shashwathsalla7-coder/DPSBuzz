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

async function inspectMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, client_id, chat_id, sender_id, text, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  console.log(`=== RECENT 20 MESSAGES IN SUPABASE ===`);
  for (const m of data) {
    console.log(`[${m.chat_id}] ${m.sender_id}: "${m.text}" (${m.created_at})`);
  }
}

inspectMessages();
