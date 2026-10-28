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

async function inspectAppSettings() {
  const { data, error } = await supabase.from('app_settings').select('key, updated_at');
  if (error) {
    console.log('Error inspecting app_settings:', error);
  } else {
    console.log(`app_settings has ${data.length} keys:`);
    for (const row of data) {
      console.log(` - ${row.key} (updated: ${row.updated_at})`);
    }
  }
}

inspectAppSettings();
