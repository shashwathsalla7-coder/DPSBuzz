import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service')
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

async function inspectSupabaseNotices() {
  const { data, error } = await sb.from('notices').select('*');
  console.log(`Supabase NOTICES (${data?.length || 0}):`, error ? error.message : '');
  for (const r of data || []) {
    console.log(`- [${r.id}] ${r.title} (${r.category}) date: ${r.date}`);
  }
}

inspectSupabaseNotices().catch(console.error);
