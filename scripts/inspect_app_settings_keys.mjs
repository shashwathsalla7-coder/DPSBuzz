import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectAppSettings() {
  const { data, error } = await supabase.from('app_settings').select('key, updated_at');
  if (error) {
    console.error('Error querying app_settings:', error);
    return;
  }
  console.log(`Found ${data.length} keys in app_settings:`);
  for (const row of data) {
    console.log(`- ${row.key} (updated: ${row.updated_at})`);
  }
}

inspectAppSettings();
