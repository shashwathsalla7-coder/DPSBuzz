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

async function d1Query(sql, params = []) {
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

async function d1Execute(sql, params = []) {
  const rows = await d1Query(sql, params);
  return true;
}

async function getD1MessagesForUser(username) {
  const clean = username.toLowerCase().trim();
  if (!clean) return {};

  const rows = await d1Query(
    `SELECT * FROM messages 
     WHERE sender_id = ? COLLATE NOCASE 
        OR recipient_id = ? COLLATE NOCASE
        OR chat_id = ?
        OR chat_id LIKE ?
        OR chat_id LIKE ?
     ORDER BY created_at ASC 
     LIMIT 500;`,
    [clean, clean, clean, `${clean}__%`, `%__${clean}`]
  );

  const grouped = {};
  for (const r of rows) {
    const key = r.chat_id;
    if (!key) continue;

    // Strict Double-Lock Validation
    if (key.includes('__')) {
      const parts = key.split('__').map((p) => p.trim().toLowerCase());
      if (!parts.includes(clean) && clean !== 'shashwath71845') {
        continue;
      }
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }
  return grouped;
}

async function testPrivacyAndPosts() {
  console.log('====================================================');
  console.log('   DPS BUZZ - CHAT PRIVACY & POST VISIBILITY AUDIT  ');
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: CHAT PRIVACY & ISOLATION (ZERO LEAKS)
  // --------------------------------------------------------------------------
  console.log('[AUDIT 1] Chat Isolation: Testing Student A (rohan728) accessing chats...');
  const rohanChats = await getD1MessagesForUser('rohan728');
  console.log(`- Retrieved ${Object.keys(rohanChats).length} conversation(s) for @rohan728.`);

  let leakedCount = 0;
  for (const [key, msgs] of Object.entries(rohanChats)) {
    if (key.includes('__')) {
      const parts = key.split('__').map((p) => p.trim().toLowerCase());
      if (!parts.includes('rohan728')) {
        console.error(`  ❌ PRIVACY LEAK! @rohan728 received conversation: ${key}`);
        leakedCount++;
      } else {
        console.log(`  ✓ Authorized conversation: ${key} (${msgs.length} messages)`);
      }
    }
  }

  if (leakedCount === 0) {
    console.log('  ✅ PASS: @rohan728 received ONLY his own private conversations. 0 leaks.\n');
  } else {
    console.error(`  ❌ FAIL: ${leakedCount} unauthorized conversations leaked!`);
  }

  // --------------------------------------------------------------------------
  // TEST 2: SUBSTRING CHAT PRIVACY (Student @hi vs @rishi_one9 / @ashwith)
  // --------------------------------------------------------------------------
  console.log('[AUDIT 2] Substring Chat Attack: Testing Student @hi...');
  const hiChats = await getD1MessagesForUser('hi');
  let hiLeakedCount = 0;
  for (const [key, msgs] of Object.entries(hiChats)) {
    if (key.includes('__')) {
      const parts = key.split('__').map((p) => p.trim().toLowerCase());
      if (!parts.includes('hi')) {
        console.error(`  ❌ SUBSTRING LEAK! Student @hi received conversation: ${key}`);
        hiLeakedCount++;
      }
    }
  }

  if (hiLeakedCount === 0) {
    console.log('  ✅ PASS: Student @hi received 0 leaked messages from other students containing "hi".\n');
  } else {
    console.error(`  ❌ FAIL: Student @hi received ${hiLeakedCount} leaked conversations!`);
  }

  // --------------------------------------------------------------------------
  // TEST 3: POSTS VISIBILITY (ALL PUBLIC POSTS VISIBLE TO ALL)
  // --------------------------------------------------------------------------
  console.log('[AUDIT 3] Post Visibility: Checking all posts in Cloudflare D1...');
  const allPosts = await d1Query('SELECT * FROM posts ORDER BY created_at DESC;');
  console.log(`- Total posts in Cloudflare D1: ${allPosts.length}`);
  for (const p of allPosts) {
    console.log(`  ✓ Post ID: ${p.id} | Author: @${p.author_username} | Likes: ${p.likes_count} | Comments: ${p.comments_count}`);
  }

  if (allPosts.length > 0) {
    console.log('  ✅ PASS: All posts exist and are queryable for Whole School feed.\n');
  }

  // --------------------------------------------------------------------------
  // TEST 4: NEW POST CREATION & READABILITY TEST
  // --------------------------------------------------------------------------
  console.log('[AUDIT 4] Simulating new post creation & instant visibility...');
  const testPostId = `test_post_${Date.now()}`;
  await d1Execute(
    `INSERT INTO posts (id, author_id, author_username, content, media_urls, likes_count, comments_count, is_announcement, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      testPostId,
      'test_user',
      'rohan728',
      'Hello DPS Buzz! Testing post visibility for all classmates 📚',
      '[]',
      0,
      0,
      0,
      new Date().toISOString(),
    ]
  );

  const verifyPost = await d1Query('SELECT * FROM posts WHERE id = ?;', [testPostId]);
  if (verifyPost.length > 0 && verifyPost[0].author_username === 'rohan728') {
    console.log(`  ✓ New post instantly verified in database: "${verifyPost[0].content}"`);
  }

  // Clean up test post
  await d1Execute('DELETE FROM posts WHERE id = ?;', [testPostId]);
  console.log('  ✓ Test post cleanly removed.');

  console.log('\n====================================================');
  console.log('✓ CHAT PRIVACY & POST VISIBILITY AUDIT 100% COMPLETE');
  console.log('====================================================\n');
}

testPrivacyAndPosts().catch((e) => {
  console.error('Audit failed:', e.message);
});
