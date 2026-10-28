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

async function checkAllMessages() {
  const { data: messages, error } = await supabase.from('messages').select('id, text, post_preview');
  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  let base64Count = 0;
  for (const m of messages) {
    const raw = JSON.stringify(m);
    if (raw.includes('data:image/') || raw.includes(';base64,')) {
      base64Count++;
      console.log('Found base64 in message ID:', m.id);
    }
  }

  console.log(`Scan complete: ${base64Count} messages contain base64 out of ${messages.length} total messages.`);
}

checkAllMessages();
