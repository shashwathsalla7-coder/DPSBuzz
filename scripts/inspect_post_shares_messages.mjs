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

async function checkPostShares() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, client_id, chat_id, sender_id, text, message_type, post_id, post_preview')
    .or('message_type.eq.post_share,post_id.not.is.null,text.ilike.%shared%');

  if (error) {
    console.error('Error fetching post share messages:', error);
    return;
  }

  console.log(`Found ${data.length} post share message rows in Supabase:`);
  for (const m of data) {
    console.log(m);
  }
}

checkPostShares();
