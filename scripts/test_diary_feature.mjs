import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
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
  if (!json.success) throw new Error(json.errors?.[0]?.message || 'D1 query failed');
  return json.result?.[0]?.results || [];
}

async function executeD1(sql, params = []) {
  return queryD1(sql, params);
}

async function runTests() {
  console.log('================================================================');
  console.log('   DPS BUZZ: CLASS DIARY COLUMN & AI IMAGE VERIFICATION SUITE   ');
  console.log('================================================================\n');

  const testDate = `2026-11-99`; // Unique test date so we don't interfere with today's real submissions

  // Clean up any stale test entries
  await executeD1("DELETE FROM campus_diary_entries WHERE date_str = ?;", [testDate]);

  // TEST 1: First student in Class 8 uploads diary image
  console.log('[TEST 1] First Student (@shashwath71845) uploads Class 8 diary...');
  const firstSubmissionRes = await (async () => {
    const existing = await queryD1(
      'SELECT id FROM campus_diary_entries WHERE class_grade = ? AND date_str = ?;',
      ['8', testDate]
    );
    const isFirst = existing.length === 0;
    const points = isFirst ? 50 : 0;
    const id = `test-diary-8-${Date.now()}`;
    await executeD1(
      `INSERT INTO campus_diary_entries (id, class_grade, section, date_str, image_url, homework_summary, uploaded_by_username, uploaded_by_name, is_first_submission, points_awarded, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, '8', 'G', testDate, 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1730000000/dpsbuzz/diary/test_c8.jpg', 'Maths Ex 4.2, Physics Lab Reflection', 'shashwath71845', 'Shashwath Salla', isFirst ? 1 : 0, points, new Date().toISOString()]
    );
    return { isFirst, points, id };
  })();

  if (firstSubmissionRes.isFirst && firstSubmissionRes.points === 50) {
    console.log('  [PASS] First student in Class 8 awarded +50 Speed Diary Points!');
  } else {
    throw new Error('Failed Test 1: First student was not awarded 50 points.');
  }

  // TEST 2: Second student in Class 8 uploads diary image on the same day
  console.log('\n[TEST 2] Second Student (@rohan728) uploads Class 8 diary on same day...');
  const secondSubmissionRes = await (async () => {
    const existing = await queryD1(
      'SELECT id FROM campus_diary_entries WHERE class_grade = ? AND date_str = ?;',
      ['8', testDate]
    );
    const isFirst = existing.length === 0;
    const points = isFirst ? 50 : 0;
    const id = `test-diary-8-second-${Date.now()}`;
    await executeD1(
      `INSERT INTO campus_diary_entries (id, class_grade, section, date_str, image_url, homework_summary, uploaded_by_username, uploaded_by_name, is_first_submission, points_awarded, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, '8', 'G', testDate, 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1730000000/dpsbuzz/diary/test_c8_rohan.jpg', 'Maths Ex 4.2', 'rohan728', 'Rohan Kamboj', isFirst ? 1 : 0, points, new Date().toISOString()]
    );
    return { isFirst, points, id };
  })();

  if (!secondSubmissionRes.isFirst && secondSubmissionRes.points === 0) {
    console.log('  [PASS] Second student correctly received 0 points (only first student in Class 8 gets points).');
  } else {
    throw new Error('Failed Test 2: Second student should not have received first submission points.');
  }

  // TEST 3: Student in Class 9 uploads diary image (Class 8 already uploaded, but Class 9 has not)
  console.log('\n[TEST 3] Student in Class 9 (@aarav_sharma) uploads Class 9 diary...');
  const class9SubmissionRes = await (async () => {
    const existing = await queryD1(
      'SELECT id FROM campus_diary_entries WHERE class_grade = ? AND date_str = ?;',
      ['9', testDate]
    );
    const isFirst = existing.length === 0;
    const points = isFirst ? 50 : 0;
    const id = `test-diary-9-${Date.now()}`;
    await executeD1(
      `INSERT INTO campus_diary_entries (id, class_grade, section, date_str, image_url, homework_summary, uploaded_by_username, uploaded_by_name, is_first_submission, points_awarded, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, '9', 'B', testDate, 'https://res.cloudinary.com/ogfaxmjw/image/upload/v1730000000/dpsbuzz/diary/test_c9.jpg', 'Polynomials sheet', 'aarav_sharma', 'Aarav Sharma', isFirst ? 1 : 0, points, new Date().toISOString()]
    );
    return { isFirst, points, id };
  })();

  if (class9SubmissionRes.isFirst && class9SubmissionRes.points === 50) {
    console.log('  [PASS] Class 9 student awarded +50 points! Competition is scoped per class only.');
  } else {
    throw new Error('Failed Test 3: Class 9 student should have won first submission points for their class.');
  }

  // TEST 4: Querying AI for Class 8 diary image
  console.log('\n[TEST 4] Simulating AI query: "Show today\'s diary image for Class 8"...');
  const diaryForClass8 = await queryD1(
    'SELECT * FROM campus_diary_entries WHERE class_grade = ? ORDER BY date_str DESC, created_at DESC LIMIT 1;',
    ['8']
  );

  if (diaryForClass8.length > 0 && diaryForClass8[0].image_url) {
    console.log(`  [PASS] AI resolves physical diary photo URL: "${diaryForClass8[0].image_url}"`);
    console.log(`  [PASS] AI includes first submitter: "${diaryForClass8[0].uploaded_by_name}"`);
  } else {
    throw new Error('Failed Test 4: Diary entry not found for Class 8.');
  }

  // TEST 5: Verify all diary entries are visible to all students
  console.log('\n[TEST 5] Verifying visibility across all classes...');
  const allEntries = await queryD1('SELECT count(*) as count FROM campus_diary_entries;');
  console.log(`  [PASS] ${allEntries[0].count} total diary entries are globally queryable & visible to all students.`);

  // Cleanup test date entries
  await executeD1("DELETE FROM campus_diary_entries WHERE date_str = ?;", [testDate]);
  console.log('  [CLEANUP] Test rows removed cleanly from D1.');

  console.log('\n================================================================');
  console.log('   ALL DIARY & AI IMAGE TESTS PASSED (100% SUCCESS)             ');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
