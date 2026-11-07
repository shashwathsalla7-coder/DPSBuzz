import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
}

async function executeD1(sql, params = []) {
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
  if (!json.success) {
    throw new Error(`D1 Execute Error: ${JSON.stringify(json.errors)}`);
  }
  return json.success;
}

const SECTION_CONFIGS = [
  { grade: 'Nursery', sections: ['A', 'B', 'C', 'D'], count: 35 },
  { grade: 'LKG', sections: ['A', 'B', 'C', 'D'], count: 38 },
  { grade: 'UKG', sections: ['A', 'B', 'C', 'D'], count: 40 },
  { grade: 'Class 1', sections: ['A', 'B', 'C', 'D', 'E', 'F'], count: 42 },
  { grade: 'Class 2', sections: ['A', 'B', 'C', 'D', 'E', 'F'], count: 44 },
  { grade: 'Class 3', sections: ['A', 'B', 'C', 'D', 'E', 'F'], count: 45 },
  { grade: 'Class 4', sections: ['A', 'B', 'C', 'D', 'E', 'F'], count: 45 },
  { grade: 'Class 5', sections: ['A', 'B', 'C', 'D', 'E', 'F'], count: 46 },
  { grade: 'Class 6', sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], count: 48 },
  { grade: 'Class 7', sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], count: 50 },
  { grade: 'Class 8', sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], count: 50 },
  { grade: 'Class 9', sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], count: 52 },
  { grade: 'Class 10', sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], count: 54 },
  { grade: 'Class 11', sections: ['A', 'B', 'C', 'D', 'E', 'F'], count: 50 },
  { grade: 'Class 12', sections: ['A', 'B', 'C', 'D', 'E', 'F'], count: 48 },
];

async function main() {
  console.log('=== SEEDING 91 OFFICIAL CLASSROOM CHANNELS IN CLOUDFLARE D1 ===');
  let totalChannels = 0;

  for (const item of SECTION_CONFIGS) {
    for (const sec of item.sections) {
      const cleanGrade = item.grade.toLowerCase().replace(/\s+/g, '');
      const channelId = `channel-${cleanGrade}-${sec.toLowerCase()}`;
      const channelName = `${item.grade}-${sec} Official Classroom`;
      const isLocked = 0; // Open for class discussions
      const adminUsers = JSON.stringify(['madam_principal', `teacher_${cleanGrade}_${sec.toLowerCase()}`]);
      const lastMsg = `Welcome to ${item.grade}-${sec} Official Classroom. Daily homework and verified announcements.`;

      await executeD1(`
        INSERT OR REPLACE INTO campus_whatsapp_channels (
          id, name, grade, section, is_locked, admin_usernames, member_count, last_message, last_message_time, created_at, enrolled_usernames
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '08:00 AM', ?, '[]');
      `, [channelId, channelName, item.grade, sec, isLocked, adminUsers, item.count, lastMsg, new Date().toISOString()]);

      totalChannels++;
      process.stdout.write(`.`);
    }
  }

  console.log(`\n✓ Successfully registered all ${totalChannels} official classroom channels into Cloudflare D1!`);
}

main().catch(console.error);
