import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function listAllProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  console.log(`=== LIVE PROFILES (${data.length} total) ===`);
  for (const p of data) {
    console.log(`[${p.id}] @${p.username} | ${p.full_name} | Class: ${p.class}-${p.section} | Role: ${p.role} | Approved: ${p.is_approved} | Follower: ${p.follower_count} | Following: ${p.following_count} | Created: ${p.created_at}`);
  }
}

listAllProfiles();
