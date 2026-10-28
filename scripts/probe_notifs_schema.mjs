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

async function probeNotifications() {
  const candidateCols = [
    'id', 'user_id', 'username', 'type', 'title', 'body', 'link', 'is_read', 'read', 'created_at', 'actor', 'data'
  ];
  for (const c of candidateCols) {
    const { error } = await supabase.from('notifications').select(c).limit(1);
    if (error) {
      console.log(`Notification col '${c}': NOT FOUND (${error.message})`);
    } else {
      console.log(`Notification col '${c}': EXISTS`);
    }
  }

  // Probe insert with an explicit id
  const probeId = 'probe_' + Date.now();
  const ins = await supabase.from('notifications').insert({
    id: probeId,
    user_id: 'probe_test',
    type: 'follow',
    title: 'Test',
    body: 'Test'
  }).select();
  console.log('Insert with explicit id result:', ins);
  if (!ins.error) {
    await supabase.from('notifications').delete().eq('id', probeId);
  }
}

probeNotifications().catch(console.error);
