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

async function checkColumns() {
  const { data, error } = await supabase.from('messages').select('*').limit(1);
  if (error) {
    console.error('Error fetching sample row:', error);
    return;
  }
  console.log('Columns in messages table:');
  if (data && data[0]) {
    console.log(Object.keys(data[0]));
    console.log('Sample row:', data[0]);
  } else {
    console.log('No rows in messages table');
  }
}

checkColumns();
