import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const migrationTables = [
  'app_settings', 'badges', 'banned_words', 'blocks', 'chat_send_failures',
  'comments', 'conversation_participants', 'conversations', 'follow_requests',
  'follows', 'friend_requests', 'friendships', 'group_invitations', 'group_members',
  'groups', 'hidden_content', 'likes', 'message_receipts', 'messages',
  'music_blocklist', 'music_library_tracks', 'music_reports', 'notifications',
  'post_images', 'posts', 'profiles', 'reports', 'stories', 'student_roster',
  'user_badges'
];

async function checkAllMigrationTables() {
  console.log('=== CHECKING ALL 30 MIGRATION TABLES IN LIVE SUPABASE ===');
  const existing = [];
  const missing = [];

  for (const t of migrationTables) {
    const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      if (error.code === 'PGRST205') {
        missing.push(t);
      } else {
        // Exists but RLS or permission error
        existing.push({ table: t, count: 'RLS/Protected', status: error.message });
      }
    } else {
      existing.push({ table: t, count: count !== null ? count : 'unknown', status: 'Accessible' });
    }
  }

  console.log(`\n✅ EXISTING TABLES IN LIVE DATABASE (${existing.length}):`);
  for (const e of existing) {
    console.log(`- ${e.table.padEnd(25)}: Count = ${e.count} (${e.status})`);
  }

  console.log(`\n❌ MISSING TABLES IN LIVE DATABASE (${missing.length}):`);
  for (const m of missing) {
    console.log(`- ${m}`);
  }
}

checkAllMigrationTables();
