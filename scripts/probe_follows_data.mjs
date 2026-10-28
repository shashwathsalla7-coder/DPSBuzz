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

async function probeFollows() {
  console.log('--- FOLLOWS SAMPLE ---');
  const { data: fData, error: fErr } = await supabase.from('follows').select('*').limit(5);
  console.log('follows data:', fData, 'error:', fErr);

  console.log('--- FOLLOW_REQUESTS SAMPLE ---');
  const { data: frData, error: frErr } = await supabase.from('follow_requests').select('*').limit(5);
  console.log('follow_requests data:', frData, 'error:', frErr);
}

probeFollows().catch(console.error);
