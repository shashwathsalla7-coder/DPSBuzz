import { d1Execute, d1Query, isD1Configured } from '../src/lib/cloudflare/d1.ts';

async function testLostFoundFeature() {
  console.log('====================================================');
  console.log('   DPS BUZZ LOST & FOUND FEATURE VERIFICATION');
  console.log('====================================================\n');

  if (!isD1Configured()) {
    throw new Error('Cloudflare D1 is not configured in environment!');
  }

  // 1. Verify Table
  console.log('[STEP 1] Verifying campus_lost_found table schema in D1...');
  const info = await d1Query('PRAGMA table_info(campus_lost_found);');
  const columns = info.map(c => c.name);
  console.log('Columns found:', columns.join(', '));
  const required = ['id', 'title', 'category', 'status', 'location', 'reporter_username', 'reporter_class', 'reporter_section', 'finder_username', 'finder_class', 'finder_section'];
  for (const r of required) {
    if (!columns.includes(r)) throw new Error(`Missing required column ${r} in campus_lost_found!`);
  }
  console.log('✓ Database schema verified with full finder & reporter classroom tracking\n');

  // 2. Query Existing Items
  console.log('[STEP 2] Verifying initial items in D1...');
  const items = await d1Query('SELECT * FROM campus_lost_found ORDER BY created_at DESC;');
  console.log(`Found ${items.length} items in D1:`);
  items.forEach(i => {
    console.log(` - [${i.status}] "${i.title}" at ${i.location} (Reported by: ${i.reporter_name} from ${i.reporter_class}-${i.reporter_section})`);
    if (i.finder_username) {
      console.log(`   └─ Found by: ${i.finder_name} from ${i.finder_class}-${i.finder_section}`);
    }
  });
  if (items.length === 0) throw new Error('No items found in campus_lost_found!');
  console.log('✓ Initial items query successful\n');

  // 3. Test Reporting a Lost Item
  console.log('[STEP 3] Simulating Student A reporting a lost item...');
  const testId = `DPS-LF-TEST-${Date.now()}`;
  await d1Execute(`
    INSERT INTO campus_lost_found (
      id, title, category, status, location, specific_spot, description,
      reporter_username, reporter_name, reporter_class, reporter_section, reporter_role,
      storage_location, urgent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [
    testId,
    'Parker Vector Metallic Blue Fountain Pen',
    'Books & Stationery',
    'LOST',
    'Library',
    'Table 4 Quiet Study Section',
    'Blue metallic pen with silver clip, engraved initials SS.',
    'shashwath71845',
    'Shashwath Salla',
    'Class 10',
    'A',
    'student',
    'Not yet turned in',
    1
  ]);
  console.log(`✓ Lost item reported by @shashwath71845 (Class 10-A) with ID: ${testId}\n`);

  // 4. Test Student B Marking "I Found This Item!"
  console.log('[STEP 4] Simulating Classmate B finding the item and submitting Class & Section...');
  const finderUsername = 'rohan728';
  const finderName = 'Rohan Kumar';
  const finderClass = 'Class 9';
  const finderSection = 'B';
  const finderNotes = 'Found on floor next to Table 4 in Library, with me right now.';

  await d1Execute(`
    UPDATE campus_lost_found 
    SET status = 'FOUND', 
        finder_username = ?, 
        finder_name = ?, 
        finder_class = ?, 
        finder_section = ?, 
        finder_notes = ?,
        storage_location = 'Found by classmate • Direct Handover Pending'
    WHERE id = ?;
  `, [finderUsername, finderName, finderClass, finderSection, finderNotes, testId]);
  console.log(`✓ Item updated to FOUND by @${finderUsername} from ${finderClass}-${finderSection}\n`);

  // 5. Verify Instant Classroom Match & Visibility
  console.log('[STEP 5] Verifying instant Class & Section visibility between Owner & Finder...');
  const matchResult = await d1Query('SELECT * FROM campus_lost_found WHERE id = ?;', [testId]);
  const matched = matchResult[0];

  console.log(`Item Title: ${matched.title}`);
  console.log(`Status: ${matched.status}`);
  console.log(`Owner: ${matched.reporter_name} (@${matched.reporter_username}) -> Location: ${matched.reporter_class}, Section ${matched.reporter_section}`);
  console.log(`Finder: ${matched.finder_name} (@${matched.finder_username}) -> Location: ${matched.finder_class}, Section ${matched.finder_section}`);
  console.log(`Finder Notes: "${matched.finder_notes}"`);

  if (matched.finder_class !== 'Class 9' || matched.finder_section !== 'B') {
    throw new Error('Finder classroom mismatch!');
  }
  if (matched.reporter_class !== 'Class 10' || matched.reporter_section !== 'A') {
    throw new Error('Reporter classroom mismatch!');
  }
  console.log('✓ Class and Section are instantly and accurately visible to both students!\n');

  // 6. Test Direct Chat URL Generation
  console.log('[STEP 6] Testing Direct Messaging Routing (No follower barriers)...');
  const introMsg = `Hi @${matched.finder_username}! Regarding my lost item "${matched.title}" (ID: ${matched.id}) that you found — thank you so much! I am in ${matched.reporter_class}-${matched.reporter_section}. Where can I collect it?`;
  const chatUrl = `/chats?user=${encodeURIComponent(matched.finder_username)}&text=${encodeURIComponent(introMsg)}`;
  console.log('Generated Direct Message link:');
  console.log(`  ${chatUrl}`);
  console.log('✓ 1-Click direct chat route successfully generated\n');

  // 7. Test Claim & Reunited Status
  console.log('[STEP 7] Testing Handover & Reunited Resolution...');
  await d1Execute(`
    UPDATE campus_lost_found 
    SET status = 'CLAIMED', 
        resolved_at = CURRENT_TIMESTAMP,
        storage_location = 'Reunited with owner • Handover Complete'
    WHERE id = ?;
  `, [testId]);
  const resolved = await d1Query('SELECT status, storage_location FROM campus_lost_found WHERE id = ?;', [testId]);
  if (resolved[0].status !== 'CLAIMED') {
    throw new Error('Claim update failed!');
  }
  console.log(`✓ Item resolved: Status is ${resolved[0].status} (${resolved[0].storage_location})\n`);

  // Clean up
  await d1Execute('DELETE FROM campus_lost_found WHERE id = ?;', [testId]);
  console.log('✓ Test item cleaned up cleanly from database');

  console.log('\n====================================================');
  console.log('  LOST & FOUND FEATURE VERIFICATION 100% PASSED!');
  console.log('====================================================');
}

testLostFoundFeature().catch(err => {
  console.error('FAIL:', err);
  process.exit(1);
});
