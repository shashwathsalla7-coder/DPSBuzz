import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = val;
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
  if (!json.success) {
    throw new Error(json.errors?.[0]?.message || 'D1 query failed');
  }
  return json.result?.[0]?.results || [];
}

async function main() {
  console.log('Setting up campus_diary_entries table in Cloudflare D1...');

  await queryD1(`
    CREATE TABLE IF NOT EXISTS campus_diary_entries (
      id TEXT PRIMARY KEY,
      class_grade TEXT NOT NULL,
      section TEXT DEFAULT 'All',
      date_str TEXT NOT NULL,
      image_url TEXT NOT NULL,
      homework_summary TEXT DEFAULT '',
      uploaded_by_username TEXT NOT NULL,
      uploaded_by_name TEXT NOT NULL,
      is_first_submission INTEGER DEFAULT 0,
      points_awarded INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  console.log('✓ Table campus_diary_entries verified / created.');

  await queryD1(`
    CREATE INDEX IF NOT EXISTS idx_campus_diary_class_date ON campus_diary_entries(class_grade, date_str);
  `);
  console.log('✓ Index idx_campus_diary_class_date created.');

  // Check existing count
  const count = await queryD1('SELECT count(*) as count FROM campus_diary_entries;');
  console.log('Existing diary entries count:', count[0].count);

  // If 0, seed initial real entries for Class 8 and Class 10
  if (count[0].count === 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    await queryD1(`
      INSERT INTO campus_diary_entries (
        id, class_grade, section, date_str, image_url, homework_summary,
        uploaded_by_username, uploaded_by_name, is_first_submission, points_awarded, created_at
      ) VALUES (
        'diary-seed-8',
        '8',
        'G',
        '${todayStr}',
        'https://res.cloudinary.com/ogfaxmjw/image/upload/v1730000000/dpsbuzz/diary/sample_diary_class8.jpg',
        '• Maths: Ex 4.2 Q1 to Q6\n• Physics: Write laws of reflection in lab journal\n• English: Read Ch 5 vocab words',
        'shashwath71845',
        'Shashwath Salla',
        1,
        50,
        '${new Date().toISOString()}'
      ), (
        'diary-seed-10',
        '10',
        'A',
        '${todayStr}',
        'https://res.cloudinary.com/ogfaxmjw/image/upload/v1730000000/dpsbuzz/diary/sample_diary_class10.jpg',
        '• Maths: CBSE Sample Paper Section B & C\n• Physics: Ohm''s law circuit problems\n• Chemistry: Chemical equations worksheet',
        'aarav_sharma',
        'Aarav Sharma',
        1,
        50,
        '${new Date().toISOString()}'
      );
    `);
    console.log('✓ Seeded initial Class 8 & Class 10 diary entries.');
  }

  const finalCheck = await queryD1('SELECT id, class_grade, uploaded_by_name, points_awarded FROM campus_diary_entries;');
  console.log('Current diary entries in D1:', finalCheck);
}

main().catch(console.error);
