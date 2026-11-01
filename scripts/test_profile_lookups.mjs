import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const testUsernames = [
  'shashwath71845', '@shashwath71845', 'Shashwath71845', ' shashwath71845 ',
  'rohan728', '@rohan728', 'ROHAN728',
  'rishi_one9', '@rishi_one9', 'RISHI_ONE9',
  'sahana_3009', '@sahana_3009',
  'mokshith7b', 'Mokshith7b',
  'ashwith', 'ASHWITH',
  'ishanvi', 'Ishanvi',
  'chandan', 'Chandan',
  'sreekrishna', 'Sreekrishna',
  'vignesh', 'Vignesh',
  'vignesh_7___49__',
  '7___49__',
  'vig_7___49__',
  'dpsbuzz', '@dpsbuzz', 'DPSBUZZ',
  'kvsishaan', 'Kvsishaan',
  'non_existent_student_12345'
];

async function testProfileLookups() {
  console.log('=== TESTING SUPABASE PROFILE LOOKUPS FOR REAL USERNAMES ===');
  for (const raw of testUsernames) {
    const clean = raw.toLowerCase().trim().replace(/^@+/, '');
    
    // Test 1: Current code using ilike('username', clean)
    let query1 = supabase.from('profiles').select('*');
    if (clean.length === 36 && clean.includes('-')) {
      query1 = query1.or(`id.eq.${clean},username.ilike.${clean}`);
    } else {
      query1 = query1.ilike('username', clean);
    }
    const { data: d1, error: e1 } = await query1.maybeSingle();

    // Test 2: Exact lowercase query eq('username', clean)
    const { data: d2, error: e2 } = await supabase.from('profiles').select('*').eq('username', clean).maybeSingle();

    console.log(`Query "${raw}":`);
    console.log(`   ilike maybeSingle -> ${d1 ? 'FOUND: @' + d1.username : 'NOT FOUND'} ${e1 ? '(Error: ' + e1.message + ')' : ''}`);
    console.log(`   eq maybeSingle    -> ${d2 ? 'FOUND: @' + d2.username : 'NOT FOUND'} ${e2 ? '(Error: ' + e2.message + ')' : ''}`);
  }
}

testProfileLookups();
