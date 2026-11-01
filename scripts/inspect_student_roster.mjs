import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectRoster() {
  const { data, error } = await supabase.from('student_roster').select('*').limit(20);
  if (error) {
    console.error('Error querying student_roster:', error);
    return;
  }
  console.log(`Found ${data.length} students in student_roster:`);
  for (const s of data) {
    console.log(`- Admission: ${s.admission_number} | ${s.full_name || s.name} | Class: ${s.class}-${s.section} | Claimed: ${s.is_claimed || s.claimed}`);
  }
}

inspectRoster();
