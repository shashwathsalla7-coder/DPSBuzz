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

async function testGroupsInsert() {
  // Let's probe groups by inserting an invalid row or checking the error response
  const { data, error } = await supabase.from('groups').insert([{ invalid_column_probe: '123' }]);
  console.log('Probe groups insert error:', error);
}

testGroupsInsert().catch(console.error);
