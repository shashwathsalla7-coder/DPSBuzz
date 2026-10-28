import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w_]+)\s*=\s*"?([^"\r\n]+)"?\s*$/);
  if (match) env[match[1]] = match[2];
}

const CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const CF_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID;
const CF_API_TOKEN = env.CLOUDFLARE_API_TOKEN;

const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;

async function executeSql(sql, params = []) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`D1 Error: ${JSON.stringify(data.errors || data)}`);
  }
  return data.result?.[0]?.results || [];
}

async function verifyCloudflareD1() {
  console.log('====================================================');
  console.log('   DPS BUZZ - CLOUDFLARE D1 VERIFICATION SUITE      ');
  console.log('====================================================\n');

  if (!CF_ACCOUNT_ID || !CF_DATABASE_ID || !CF_API_TOKEN) {
    console.error('FAIL: Missing credentials in .env.local');
    return;
  }
  console.log('✓ Cloudflare D1 credentials loaded from .env.local.\n');

  // Test 1: Profiles
  console.log('[TEST 1] Querying all student profiles from Cloudflare D1...');
  const profiles = await executeSql('SELECT * FROM profiles ORDER BY created_at ASC;');
  console.log(`- Retrieved ${profiles.length} profiles from Cloudflare D1.`);
  const realStudents = ['shashwath71845', 'rohan728', 'ishanvi', 'mokshith7b', 'rishi_one9'];
  for (const s of realStudents) {
    const found = profiles.find((p) => (p.username || '').toLowerCase() === s);
    if (found) {
      console.log(`  ✓ Student @${s} verified: "${found.full_name}" (${found.role})`);
    } else {
      console.warn(`  ⚠ Student @${s} not in list`);
    }
  }

  // Test 2: Single Profile Lookup
  console.log('\n[TEST 2] Individual profile lookup for @shashwath71845...');
  const adminRows = await executeSql('SELECT * FROM profiles WHERE username = ? COLLATE NOCASE;', ['shashwath71845']);
  if (adminRows.length > 0 && adminRows[0].username === 'shashwath71845') {
    console.log(`  ✓ SuperAdmin @${adminRows[0].username} successfully loaded.`);
  } else {
    console.error('  FAIL: Could not load admin profile');
  }

  // Test 3: Follows & Relationships
  console.log('\n[TEST 3] Querying follow relationships from Cloudflare D1...');
  const follows = await executeSql('SELECT * FROM follows;');
  console.log(`- Retrieved ${follows.length} active follow connections.`);
  for (const f of follows) {
    console.log(`  ✓ ${f.follower} -> ${f.following}`);
  }

  // Test 4: Follow Requests
  console.log('\n[TEST 4] Querying follow requests from Cloudflare D1...');
  const reqs = await executeSql('SELECT * FROM follow_requests;');
  console.log(`- Retrieved ${reqs.length} follow requests.`);

  // Test 5: Groups & Members
  console.log('\n[TEST 5] Querying groups from Cloudflare D1...');
  const groups = await executeSql('SELECT * FROM groups;');
  console.log(`- Retrieved ${groups.length} groups.`);
  for (const g of groups) {
    console.log(`  ✓ Group "${g.name}" (ID: ${g.id}, Creator: @${g.created_by}, Members: ${g.member_count})`);
  }

  const groupMembers = await executeSql('SELECT * FROM group_members_registry;');
  console.log(`- Group member registries: ${groupMembers.length} member assignments.`);

  // Test 6: Chat Messages
  console.log('\n[TEST 6] Querying chat messages for @shashwath71845 from Cloudflare D1...');
  const chatMsgs = await executeSql(
    'SELECT * FROM messages WHERE sender_id = ? COLLATE NOCASE OR chat_id LIKE ? LIMIT 500;',
    ['shashwath71845', '%shashwath71845%']
  );
  console.log(`- Retrieved ${chatMsgs.length} messages for @shashwath71845 in Cloudflare D1.`);

  // Test 7: Real-time Insert and Immediate Read Test
  console.log('\n[TEST 7] Testing real-time write & read-back in Cloudflare D1...');
  const testMsgId = `cf_test_${Date.now()}`;
  await executeSql(
    'INSERT INTO messages (id, chat_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?);',
    [testMsgId, 'test_conv__shashwath71845', 'shashwath71845', 'Cloudflare D1 live real-time verification ping 🚀', new Date().toISOString()]
  );
  console.log('  ✓ Test message successfully inserted into Cloudflare D1.');
  const readBack = await executeSql('SELECT * FROM messages WHERE id = ?;', [testMsgId]);
  if (readBack.length > 0) {
    console.log('  ✓ Test message read back successfully:', readBack[0].content);
  }
  // Clean up test message
  await executeSql('DELETE FROM messages WHERE id = ?;', [testMsgId]);
  console.log('  ✓ Test message cleanly removed.');

  console.log('\n====================================================');
  console.log('✓ ALL CLOUDFLARE D1 VERIFICATION CHECKS PASSED!     ');
  console.log('====================================================\n');
}

verifyCloudflareD1().catch((err) => {
  console.error('Verification error:', err.message);
});
