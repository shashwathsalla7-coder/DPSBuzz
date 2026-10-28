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

async function inspectPolicies() {
  // Let's test an update with anon key
  const probeId = `probe-${Date.now()}`;
  await supabase.from('messages').insert({ client_id: probeId, chat_id: 'probe', sender_id: 'probe', text: 'test' });
  
  // Try update
  const { data: upData, error: upError } = await supabase.from('messages').update({ text: 'updated' }).eq('client_id', probeId).select();
  console.log('Update with anon key:', { upData, upError });

  // Cleanup
  await supabase.from('messages').delete().eq('client_id', probeId);
}

inspectPolicies();
