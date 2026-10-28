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

async function testProfileUpdate() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ updated_at: new Date().toISOString() })
    .eq('username', 'shashwath71845')
    .select();
  console.log('Update profile with anon key:', { data: data?.length, error });
}

testProfileUpdate();
