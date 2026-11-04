import { d1Execute, d1Query, isD1Configured } from '../src/lib/cloudflare/d1.ts';

async function setupGroupInvitesTable() {
  console.log('--- Setting up campus_group_invites in Cloudflare D1 ---');
  if (!isD1Configured()) {
    console.error('D1 not configured!');
    process.exit(1);
  }

  await d1Execute(`
    CREATE TABLE IF NOT EXISTS campus_group_invites (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      group_name TEXT NOT NULL,
      invitee_username TEXT NOT NULL,
      invitee_role TEXT DEFAULT 'teacher',
      subject TEXT DEFAULT 'English',
      invited_by TEXT DEFAULT 'madam_principal',
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Table campus_group_invites is ready in D1 SQL.');

  // Ensure Class 8-G exists in campus_whatsapp_channels
  const check8g = await d1Query("SELECT id FROM campus_whatsapp_channels WHERE id = 'channel-class-8g';");
  if (check8g.length === 0) {
    await d1Execute(`
      INSERT INTO campus_whatsapp_channels (
        id, name, grade, section, is_locked, admin_usernames, member_count, last_message, last_message_time, enrolled_usernames
      ) VALUES (
        'channel-class-8g',
        'Class 8-G Official Classroom 📘',
        'Class 8',
        'G',
        0,
        '["shashwath71845", "madam_principal"]',
        38,
        'Madam Principal assigned new English faculty to Class 8-G.',
        '10:30 AM',
        '["madam_principal"]'
      );
    `);
    console.log('Created Class 8-G in campus_whatsapp_channels.');
  }

  // Check existing invites
  const existing = await d1Query('SELECT count(*) as c FROM campus_group_invites;');
  if (existing[0]?.c === 0) {
    // Seed sample invite from Madam to English teacher for Class 8-G
    await d1Execute(`
      INSERT INTO campus_group_invites (
        id, group_id, group_name, invitee_username, invitee_role, subject, invited_by, status
      ) VALUES 
      (
        'invite-eng-8g',
        'channel-class-8g',
        'Class 8-G Official Classroom 📘',
        'teacher_english',
        'teacher',
        'English Faculty',
        'madam_principal',
        'pending'
      ),
      (
        'invite-shashwath-8g',
        'channel-class-8g',
        'Class 8-G Official Classroom 📘',
        'shashwath71845',
        'teacher',
        'Senior English Faculty',
        'madam_principal',
        'pending'
      );
    `);
    console.log('Seeded pending invite for English teacher in Class 8-G.');
  }

  const invites = await d1Query('SELECT * FROM campus_group_invites LIMIT 5;');
  console.log('Current invites in D1:', invites);
}

setupGroupInvitesTable().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
