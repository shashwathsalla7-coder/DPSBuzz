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

async function testUpsert() {
  const testKey = 'test_probe_key_' + Date.now();
  const { data, error } = await supabase.from('app_settings').upsert({
    key: testKey,
    value: 'probe_value',
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.log('app_settings upsert error:', error);
  } else {
    console.log('app_settings upsert SUCCESS!');
    // clean up
    await supabase.from('app_settings').delete().eq('key', testKey);
  }
}

testUpsert();
