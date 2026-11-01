import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runPhase0Counts() {
  console.log('=== PHASE 0 STEP 4: READ-ONLY COUNTS ===');

  const { data: profiles, error: pErr } = await sb.from('profiles').select('*');
  if (pErr) {
    console.error('Error fetching profiles:', pErr);
    return;
  }

  console.log(`Total profiles in DB: ${profiles.length}`);

  const usernameCounts = {};
  for (const p of profiles) {
    const u = (p.username || '').toLowerCase().trim();
    usernameCounts[u] = (usernameCounts[u] || 0) + 1;
  }
  const duplicates = Object.entries(usernameCounts).filter(([u, count]) => count > 1);
  console.log(`Duplicate usernames (case-insensitive): ${duplicates.length > 0 ? JSON.stringify(duplicates) : '0 (None)'}`);

  const statusCounts = { approved: 0, pending: 0, active: 0, deactivated: 0 };
  for (const p of profiles) {
    if (p.is_approved === true) statusCounts.approved++;
    else if (p.is_approved === false) statusCounts.pending++;

    if (p.is_active === true || p.is_active === undefined) statusCounts.active++;
    else if (p.is_active === false) statusCounts.deactivated++;
  }
  console.log('Status counts:', statusCounts);

  const BLOCKED_TEST_USERNAMES = new Set(['testaccount', 'testing', 'ab', 'test_insert_probe', 'test_uuid5_user']);
  const visibleInSearch = profiles.filter(p => !BLOCKED_TEST_USERNAMES.has((p.username || '').toLowerCase().trim()));
  console.log(`Users visible in search: ${visibleInSearch.length} / ${profiles.length}`);
  console.log(`Users visible on home screen: ${visibleInSearch.length} / ${profiles.length}`);

  if (env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service')) {
    try {
      const sbAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: authData, error: authErr } = await sbAdmin.auth.admin.listUsers();
      if (!authErr && authData) {
        console.log(`Total Auth users: ${authData.users.length}`);
      } else {
        console.log('Auth users list error:', authErr?.message || authErr);
      }
    } catch (e) {
      console.log('Auth admin exception:', e.message);
    }
  } else {
    console.log('SUPABASE_SERVICE_ROLE_KEY is placeholder or not configured with admin service privileges.');
  }
}

runPhase0Counts();
