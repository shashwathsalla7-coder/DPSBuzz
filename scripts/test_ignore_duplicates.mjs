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

async function testIgnoreDuplicates() {
  const probeId = `ignore-probe-${Date.now()}`;
  // 1. First insert
  const { error: insErr } = await supabase.from('messages').insert({ client_id: probeId, chat_id: 'probe', sender_id: 'probe', text: 'initial' });
  console.log('Initial insert:', { insErr });

  // 2. Insert with ignoreDuplicates: true on existing client_id
  const { data, error } = await supabase.from('messages').insert({ client_id: probeId, chat_id: 'probe', sender_id: 'probe', text: 'duplicate_ignored' }, { ignoreDuplicates: true }).select();
  console.log('Insert with ignoreDuplicates result:', { data, error });

  // Cleanup
  await supabase.from('messages').delete().eq('client_id', probeId);
}

testIgnoreDuplicates();
