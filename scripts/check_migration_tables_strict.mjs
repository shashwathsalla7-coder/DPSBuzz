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

async function checkAllMigrationTablesStrict() {
  console.log('=== STRICT CHECK OF ALL 30 MIGRATION TABLES (with .select(*).limit(1)) ===');
  const existing = [];
  const missing = [];
  const rlsBlocked = [];

  for (const t of migrationTables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(1);
      if (error) {
        if (error.code === 'PGRST205') {
          missing.push(t);
        } else {
          // Table exists but RLS error or custom error
          rlsBlocked.push({ table: t, code: error.code, message: error.message });
        }
      } else {
        existing.push({ table: t, rowsReturned: data.length });
      }
    } catch (err) {
      missing.push(`${t} (exception: ${err.message})`);
    }
  }

  console.log(`\n✅ CONFIRMED EXISTING & ACCESSIBLE TABLES (${existing.length}):`);
  for (const e of existing) {
    console.log(`- ${e.table.padEnd(25)} (rows in query: ${e.rowsReturned})`);
  }

  if (rlsBlocked.length > 0) {
    console.log(`\n🔒 RLS-RESTRICTED (TABLE EXISTS BUT BLOCKED BY POLICY) (${rlsBlocked.length}):`);
    for (const r of rlsBlocked) {
      console.log(`- ${r.table.padEnd(25)} (code: ${r.code}, error: ${r.message})`);
    }
  }

  console.log(`\n❌ MISSING TABLES IN LIVE SUPABASE DATABASE (${missing.length}):`);
  for (const m of missing) {
    console.log(`- ${m}`);
  }
}

checkAllMigrationTablesStrict();
