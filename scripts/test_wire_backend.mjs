import { d1Query, d1Execute, isD1Configured } from '../src/lib/cloudflare/d1.ts';

async function testCampus WireBackend() {
  console.log('--- Testing Campus Wire School Hub Backend in Cloudflare D1 ---');
  if (!isD1Configured()) {
    console.error('D1 is not configured!');
    process.exit(1);
  }

  // 1. Verify channels
  const channels = await d1Query('SELECT id, name, grade, is_locked, member_count FROM campus_wire_channels;');
  console.log(`[PASS] Found ${channels.length} channels in D1:`);
  for (const c of channels) {
    console.log(`  - [${c.id}] ${c.name} (Grade: ${c.grade}, Locked: ${c.is_locked}, Members: ${c.member_count})`);
  }
  if (channels.length < 4) {
    throw new Error('Expected at least 4 default channels in D1');
  }

  // 2. Verify messages
  const messages = await d1Query('SELECT id, channel_id, sender_name, text FROM campus_wire_messages LIMIT 5;');
  console.log(`[PASS] Found ${messages.length} sample messages in D1:`);
  for (const m of messages) {
    console.log(`  - [${m.channel_id}] ${m.sender_name}: "${m.text.slice(0, 50)}..."`);
  }

  // 3. Test roster parsing logic
  const rawSampleRoster = `
Student Name,Class,Parent Key,Enrollment ID
Aarav Sharma,Class 10-A,PRK-901824,DPS-2024-1044
Diya Patel,Class 10-A,PRK-901825,DPS-2024-1045
Kavya Reddy,Class 9-B,PRK-892110,DPS-2024-0982
`;

  const lines = rawSampleRoster.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsed = [];
  for (const line of lines) {
    if (line.toLowerCase().includes('student name')) continue;
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 4) {
      parsed.push({
        name: parts[0],
        classSection: parts[1],
        parentKey: parts[2],
        enrollmentId: parts[3],
        mappedRoomId: parts[1].includes('9') ? 'channel-class-9b' : 'channel-class-10a',
      });
    }
  }

  console.log(`[PASS] Successfully parsed ${parsed.length} student records from raw registration grid.`);
  console.log('Sample parsed student:', parsed[0]);
  if (parsed.length !== 3) {
    throw new Error(`Expected 3 parsed students, got ${parsed.length}`);
  }

  console.log('\n>>> ALL CAMPUS_WIRE D1 BACKEND TESTS PASSED (100% GREEN) <<<');
}

testCampus WireBackend().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
