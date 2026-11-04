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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

async function checkSchema() {
  console.log('=== INSPECTING LIVE SUPABASE TABLES & SCHEMA ===');

  const { data: msg, error: msgErr } = await supabase.from('messages').select('*').limit(1);
  if (msgErr) console.log('Messages error:', msgErr.message);
  else if (msg && msg[0]) console.log('Messages columns:', Object.keys(msg[0]));

  const { data: prof, error: profErr } = await supabase.from('profiles').select('*').limit(1);
  if (profErr) console.log('Profiles error:', profErr.message);
  else if (prof && prof[0]) console.log('Profiles columns:', Object.keys(prof[0]));

  const { data: post, error: postErr } = await supabase.from('posts').select('*').limit(1);
  if (postErr) console.log('Posts error:', postErr.message);
  else if (post && post[0]) console.log('Posts columns:', Object.keys(post[0]));

  const { data: fol, error: folErr } = await supabase.from('follows').select('*').limit(1);
  if (folErr) console.log('Follows error:', folErr.message);
  else if (fol && fol[0]) console.log('Follows columns:', Object.keys(fol[0]));

  // Check the jellavarshith and shashwath71845 avatar sizes in profiles table
  const { data: jella } = await supabase.from('profiles').select('id, username, avatar').eq('username', 'jellavarshith').maybeSingle();
  if (jella) {
    console.log(`\n@jellavarshith avatar in Supabase: length=${jella.avatar?.length || 0}, isBase64=${jella.avatar?.startsWith('data:')}`);
  }

  const { data: varshith } = await supabase.from('profiles').select('id, username, avatar').eq('username', 'varshithjella').maybeSingle();
  if (varshith) {
    console.log(`@varshithjella avatar in Supabase: length=${varshith.avatar?.length || 0}, isBase64=${varshith.avatar?.startsWith('data:')}`);
  }

  const { data: shash } = await supabase.from('profiles').select('id, username, avatar').eq('username', 'shashwath71845').maybeSingle();
  if (shash) {
    console.log(`@shashwath71845 avatar in Supabase: length=${shash.avatar?.length || 0}, isBase64=${shash.avatar?.startsWith('data:')}`);
  }
}

checkSchema();
