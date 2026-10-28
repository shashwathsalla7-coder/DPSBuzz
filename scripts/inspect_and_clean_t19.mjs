import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = (rawKey && !rawKey.includes('your-service')) ? rawKey : (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function testChatQuery() {
  const username = 'rohan728';
  console.log(`Testing query for username: ${username}`);
  const { data: dbRows, error: dbErr } = await supabase
    .from('messages')
    .select('id, chat_id, sender_id')
    .or(`sender_id.eq.${username},chat_id.ilike.%${username}%`)
    .limit(10);

  console.log('Error:', dbErr);
  console.log('Result count:', dbRows?.length);
  if (dbRows && dbRows.length > 0) {
    console.log('First row:', dbRows[0]);
  }
}

testChatQuery();
