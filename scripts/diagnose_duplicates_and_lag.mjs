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

const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service')
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

async function diagnose() {
  console.log('=== 1. CHECKING LIVE PRODUCTION RESPONSE ===');
  const t0 = Date.now();
  try {
    const res = await fetch('https://dpsbuzz.in/login');
    const duration = Date.now() - t0;
    console.log(`Live site status: ${res.status} in ${duration}ms, server: ${res.headers.get('x-vercel-id') || 'unknown'}`);
  } catch (err) {
    console.error('Error fetching live site:', err.message);
  }

  console.log('\n=== 2. CHECKING SUPABASE LATENCY & PROFILES ===');
  const t1 = Date.now();
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  const dbDuration = Date.now() - t1;

  if (pError) {
    console.error('Database Error:', pError.message);
    return;
  }

  console.log(`Supabase responded in ${dbDuration}ms. Total profiles: ${profiles.length}`);

  // Analyze duplicates
  const usernameMap = new Map();
  const lowerUsernameMap = new Map();
  const nameMap = new Map();

  for (const p of profiles) {
    const rawU = (p.username || '').trim();
    const lowU = rawU.toLowerCase();
    const name = (p.full_name || p.name || '').trim().toLowerCase();

    // Raw match
    if (!usernameMap.has(rawU)) usernameMap.set(rawU, []);
    usernameMap.get(rawU).push(p);

    // Case-insensitive match
    if (!lowerUsernameMap.has(lowU)) lowerUsernameMap.set(lowU, []);
    lowerUsernameMap.get(lowU).push(p);

    // Name match
    if (name) {
      if (!nameMap.has(name)) nameMap.set(name, []);
      nameMap.get(name).push(p);
    }
  }

  console.log('\n--- EXACT USERNAME DUPLICATES ---');
  let exactDupes = 0;
  for (const [u, list] of usernameMap.entries()) {
    if (list.length > 1) {
      exactDupes++;
      console.log(`Duplicate username: "${u}" (${list.length} rows):`);
      list.forEach(p => console.log(`   id: ${p.id}, created_at: ${p.created_at}, class: ${p.class}-${p.section}, role: ${p.role}`));
    }
  }
  if (!exactDupes) console.log('None found.');

  console.log('\n--- CASE-INSENSITIVE USERNAME DUPLICATES ---');
  let caseDupes = 0;
  for (const [u, list] of lowerUsernameMap.entries()) {
    if (list.length > 1) {
      caseDupes++;
      console.log(`Case variation for "${u}" (${list.length} rows):`);
      list.forEach(p => console.log(`   username: "${p.username}", id: ${p.id}, created_at: ${p.created_at}`));
    }
  }
  if (!caseDupes) console.log('None found.');

  console.log('\n--- SAME FULL NAME ACCOUNTS ---');
  let nameDupes = 0;
  for (const [n, list] of nameMap.entries()) {
    if (list.length > 1) {
      nameDupes++;
      console.log(`Full name "${n}" appears ${list.length} times:`);
      list.forEach(p => console.log(`   username: "${p.username}", id: ${p.id}, class: ${p.class}-${p.section}, created_at: ${p.created_at}`));
    }
  }
  if (!nameDupes) console.log('None found.');

  console.log('\n--- ALL USERNAMES IN DATABASE ---');
  profiles.forEach((p, idx) => {
    console.log(`${idx + 1}. @${p.username} (id: ${p.id}, created: ${p.created_at}, role: ${p.role})`);
  });

  console.log('\n=== 3. CHECKING ACTIVE CALLS / MESSAGES / RECENT ACTIVITY ===');
  const { data: recentMsgs, error: mErr } = await supabase.from('messages').select('id, created_at, sender_id, receiver_id').order('created_at', { ascending: false }).limit(5);
  if (mErr) console.log('Messages error:', mErr.message);
  else console.log(`Recent 5 messages:`, recentMsgs);

  // Check calls table if exists
  const { data: calls, error: cErr } = await supabase.from('calls').select('id, status, caller_id, receiver_id, created_at').order('created_at', { ascending: false }).limit(5);
  if (cErr) console.log('Calls table check:', cErr.message);
  else console.log(`Recent 5 calls:`, calls);
}

diagnose();
