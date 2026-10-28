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

async function testUpsertExisting() {
  const probeId = `upsert-probe-${Date.now()}`;
  // 1. First insert
  const { error: insErr } = await supabase.from('messages').insert({ client_id: probeId, chat_id: 'probe', sender_id: 'probe', text: 'initial' });
  console.log('Initial insert:', { insErr });

  // 2. Upsert same client_id with new text
  const { data: upData, error: upErr } = await supabase.from('messages').upsert({ client_id: probeId, chat_id: 'probe', sender_id: 'probe', text: 'modified' }, { onConflict: 'client_id' }).select();
  console.log('Upsert on conflict:', { upData, upErr });

  // 3. Select to see what's in the DB
  const { data: selData } = await supabase.from('messages').select('*').eq('client_id', probeId);
  console.log('Selected row:', selData);

  // Cleanup
  await supabase.from('messages').delete().eq('client_id', probeId);
}

testUpsertExisting();
