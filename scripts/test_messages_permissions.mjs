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

async function testPermissions() {
  const testClientId = `perm-check-${Date.now()}`;
  
  // 1. Insert test
  const { data: insData, error: insErr } = await supabase.from('messages').insert([
    {
      client_id: testClientId,
      chat_id: 'test__perm',
      sender_id: 'perm_tester',
      text: 'Permission probe',
    }
  ]).select();
  console.log('Insert result:', { insData: insData?.length, insErr });

  // 2. Select test
  const { data: selData, error: selErr } = await supabase.from('messages').select('*').eq('client_id', testClientId);
  console.log('Select result:', { selData: selData?.length, selErr });

  // 3. Update test
  const { data: updData, error: updErr } = await supabase.from('messages').update({ status: 'delivered' }).eq('client_id', testClientId).select();
  console.log('Update result:', { updData: updData?.length, updErr });

  // Cleanup test row
  const { error: delErr } = await supabase.from('messages').delete().eq('client_id', testClientId);
  console.log('Delete cleanup result:', { delErr });
}

testPermissions();
