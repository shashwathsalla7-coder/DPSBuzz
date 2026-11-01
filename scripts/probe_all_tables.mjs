import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const candidateTables = [
  'profiles', 'posts', 'stories', 'messages', 'follows', 'follow_requests',
  'groups', 'group_members', 'group_join_requests', 'notices', 'app_settings',
  'reports', 'games', 'connect4_games', 'music_tracks', 'chat_notes', 'roster',
  'habit_posts', 'post_comments', 'post_likes', 'call_sessions'
];

async function probeDetails() {
  console.log('--- Probing Supabase Tables in Detail ---');
  for (const table of candidateTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(2);
      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message} (code: ${error.code})`);
      } else {
        console.log(`✅ ${table}: SELECT OK (returned ${data.length} rows)`);
        if (data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`❌ ${table}: EXCEPTION - ${e.message}`);
    }
  }
}

probeDetails();
