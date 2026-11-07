import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
}

async function queryD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  return json.result?.[0]?.results || [];
}

async function main() {
  const tables = [
    'profiles',
    'posts',
    'comments',
    'likes',
    'messages',
    'groups',
    'group_members_registry',
    'follows',
    'notifications',
    'campus_broadcasts',
    'campus_study_notes',
    'campus_questions',
    'campus_quiz_progress',
    'campus_study_schedules',
    'campus_homework',
    'campus_lost_found',
    'campus_wire_channels',
    'campus_wire_messages',
    'campus_group_invites',
    'campus_diary_entries'
  ];

  console.log('=== D1 DATABASE ROW COUNTS ===');
  for (const t of tables) {
    try {
      const res = await queryD1(`SELECT COUNT(*) as c FROM ${t};`);
      console.log(` - ${t}: ${res[0]?.c ?? 0}`);
    } catch (e) {
      console.log(` - ${t}: ERROR ${e.message}`);
    }
  }
}

main().catch(console.error);
