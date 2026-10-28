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

async function cleanTestMessages() {
  const { data: d1, error: e1 } = await supabase.from('messages').delete().eq('chat_id', 'shashwath71845__testaccount').select();
  console.log('Deleted shashwath71845__testaccount:', { d1, e1 });

  const { data: d2, error: e2 } = await supabase.from('messages').delete().eq('chat_id', 'shashwath71845__testing').select();
  console.log('Deleted shashwath71845__testing:', { d2, e2 });

  const { data: d3, error: e3 } = await supabase.from('messages').delete().eq('chat_id', 'test').select();
  console.log('Deleted chat_id=test:', { d3, e3 });
  
  const { data: d4, error: e4 } = await supabase.from('messages').delete().eq('chat_id', 'probe').select();
  console.log('Deleted chat_id=probe:', { d4, e4 });
}

cleanTestMessages();
