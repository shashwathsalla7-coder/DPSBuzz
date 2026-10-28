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

async function printAllMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  console.log(`Fetched ${data.length} messages:`);
  const byChat = {};
  for (const m of data) {
    if (!byChat[m.chat_id]) byChat[m.chat_id] = [];
    byChat[m.chat_id].push(m);
  }

  for (const [chatId, msgs] of Object.entries(byChat)) {
    console.log(`\n--- Chat: ${chatId} (${msgs.length} messages) ---`);
    for (const m of msgs) {
      console.log(`  [${m.created_at}] ${m.sender_id}: "${m.text}" (client_id: ${m.client_id})`);
    }
  }
}

printAllMessages();
