import { d1Execute, d1Query, isD1Configured } from '../src/lib/cloudflare/d1.ts';

async function initWhatsAppHubTables() {
  console.log('Initializing WhatsApp School Hub tables in Cloudflare D1...');
  if (!isD1Configured()) {
    console.error('D1 not configured in environment!');
    process.exit(1);
  }

  // 1. Create channels table
  await d1Execute(`
    CREATE TABLE IF NOT EXISTS campus_whatsapp_channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT DEFAULT 'All',
      avatar TEXT DEFAULT '',
      is_locked INTEGER DEFAULT 0,
      admin_usernames TEXT DEFAULT '["shashwath71845", "madam_principal"]',
      member_count INTEGER DEFAULT 42,
      last_message TEXT DEFAULT '',
      last_message_time TEXT DEFAULT 'Just now',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Create messages table
  await d1Execute(`
    CREATE TABLE IF NOT EXISTS campus_whatsapp_messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      sender_username TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT DEFAULT 'student',
      sender_class TEXT DEFAULT 'Class 10',
      text TEXT NOT NULL,
      template_type TEXT DEFAULT 'none',
      timestamp INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tables campus_whatsapp_channels & campus_whatsapp_messages ready!');

  // Seed default school channels
  const count = await d1Query('SELECT count(*) as c FROM campus_whatsapp_channels;');
  if (count[0].c === 0) {
    console.log('Seeding official school WhatsApp channels...');
    await d1Execute(`
      INSERT INTO campus_whatsapp_channels (id, name, grade, section, is_locked, member_count, last_message, last_message_time)
      VALUES
      (
        'channel-school-broadcast',
        'DPS Official Principal Dispatches 📢',
        'All',
        'All',
        1,
        5500,
        'Welcome to the DPS Digital Campus. ID cards mandatory every day.',
        '08:15 AM'
      ),
      (
        'channel-class-10a',
        'Class 10-A Official Classroom 🎓',
        'Class 10',
        'A',
        0,
        44,
        'Mr. Sharma: Complete Exercise 8.4 Q5 proofs for tomorrow.',
        '03:45 PM'
      ),
      (
        'channel-class-9b',
        'Class 9-B Official Classroom 📘',
        'Class 9',
        'B',
        0,
        42,
        'Rohan Kumar: Does anyone have the chemistry practical record sheet?',
        '04:10 PM'
      ),
      (
        'channel-science-club',
        'DPS Ramanujan & Aryabhatta Science Club 🔬',
        'Class 8-10',
        'Club',
        0,
        68,
        'Science Exhibition model submissions close on Friday.',
        'Yesterday'
      );
    `);

    // Seed initial messages
    await d1Execute(`
      INSERT INTO campus_whatsapp_messages (id, channel_id, sender_username, sender_name, sender_role, sender_class, text, template_type, timestamp)
      VALUES
      (
        'wmsg-1001',
        'channel-school-broadcast',
        'shashwath71845',
        'Principal Madam (Office)',
        'admin',
        'Faculty',
        '📢 OFFICIAL CIRCULAR: Half-Yearly practical examinations commence next Monday. Students must report in formal school uniform with verified admit cards.',
        'exam',
        ${Date.now() - 3600000}
      ),
      (
        'wmsg-1002',
        'channel-class-10a',
        'shashwath71845',
        'Mr. Sharma (Math Faculty)',
        'teacher',
        'Faculty',
        '📝 HOMEWORK REMINDER: Class 10-A, please complete Exercise 8.4 Trigonometric Identities in your fair notebooks before tomorrow 8:30 AM.',
        'homework',
        ${Date.now() - 1800000}
      ),
      (
        'wmsg-1003',
        'channel-class-10a',
        'rohan728',
        'Rohan Kumar',
        'student',
        'Class 10-A',
        'Sir, should we write the step-by-step LHS = RHS derivations for all 5 sub-questions?',
        'none',
        ${Date.now() - 900000}
      );
    `);
    console.log('Seeded initial channels and messages.');
  }

  const channels = await d1Query('SELECT id, name, is_locked, member_count FROM campus_whatsapp_channels;');
  console.log('Channels verified:', channels);
}

initWhatsAppHubTables().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
