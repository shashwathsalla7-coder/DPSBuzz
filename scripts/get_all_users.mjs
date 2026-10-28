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

async function listAllUsers() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, class, section, is_verified, is_private, is_approved, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`=== ALL PROFILES IN SUPABASE (${profiles.length}) ===`);
  for (const p of profiles) {
    console.log(`Username: @${p.username} | Name: ${p.full_name} | Class: ${p.class}-${p.section} | Role: ${p.role} | Private: ${p.is_private} | Approved: ${p.is_approved}`);
  }
}

listAllUsers();
