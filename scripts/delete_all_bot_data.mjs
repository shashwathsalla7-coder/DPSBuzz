import fs from 'fs';

// Load environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const CF_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const CF_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID;
const CF_API_TOKEN = env.CLOUDFLARE_API_TOKEN;

async function queryD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`D1 Query Error: ${JSON.stringify(json.errors)}`);
  }
  return json.result?.[0]?.results || [];
}

async function executeD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
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

async function getTableColumns(tableName) {
  try {
    const cols = await queryD1(`PRAGMA table_info(${tableName});`);
    return cols.map(c => c.name);
  } catch {
    return [];
  }
}

// EXACT AUTHENTIC PRODUCTION USERNAMES TO PRESERVE (NEVER DELETE)
const AUTHENTIC_USERNAMES = [
  'shashwath71845',
  'madam_principal',
  'dpsbuzz',
  'sahana_3009',
  'rishi_one9',
  'rohan728',
  'kvsishaan',
  'mokshith7b',
  'ishanvi',
  'ashwith',
  'chandan',
  'sreekrishna',
  'vignesh',
  'varshithjella',
];

const AUTHENTIC_SET = new Set(AUTHENTIC_USERNAMES.map(u => u.toLowerCase()));

async function deleteAllBotData() {
  console.log('================================================================================');
  console.log('  PURGING ALL 6,000 BOTS DATA AND TRANSIENT RECORDS FROM DPS BUZZ');
  console.log('================================================================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    d1Deletions: {},
    serverStoreCleaned: false,
    remainingAuthenticAccounts: [],
  };

  // 1. Inspect existing tables in D1
  const tables = await queryD1("SELECT name FROM sqlite_master WHERE type='table';");
  const tableNames = tables.map(t => t.name);
  console.log('Detected D1 tables:', tableNames.join(', '));

  const placeholders = AUTHENTIC_USERNAMES.map(() => '?').join(',');

  // 2. Clean Profiles Table
  if (tableNames.includes('profiles')) {
    const totalBefore = await queryD1('SELECT COUNT(*) as c FROM profiles;');
    await executeD1(
      `DELETE FROM profiles WHERE LOWER(username) NOT IN (${placeholders});`,
      AUTHENTIC_USERNAMES.map(u => u.toLowerCase())
    );
    const totalAfter = await queryD1('SELECT COUNT(*) as c FROM profiles;');
    const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
    console.log(`✓ profiles: Deleted ${deletedCount} non-authentic/bot accounts. ${totalAfter[0]?.c} authentic profiles remaining.`);
    report.d1Deletions.profiles = deletedCount;
  }

  // 3. Clean Posts Table
  if (tableNames.includes('posts')) {
    const totalBefore = await queryD1('SELECT COUNT(*) as c FROM posts;');
    await executeD1(
      `DELETE FROM posts WHERE LOWER(author_username) NOT IN (${placeholders}) OR id LIKE 'sim-%' OR id LIKE 'test-%';`,
      AUTHENTIC_USERNAMES.map(u => u.toLowerCase())
    );
    const totalAfter = await queryD1('SELECT COUNT(*) as c FROM posts;');
    const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
    console.log(`✓ posts: Deleted ${deletedCount} bot/simulation posts. ${totalAfter[0]?.c} authentic posts remaining.`);
    report.d1Deletions.posts = deletedCount;
  }

  // 4. Clean Likes Table
  if (tableNames.includes('likes')) {
    const totalBefore = await queryD1('SELECT COUNT(*) as c FROM likes;');
    await executeD1(
      `DELETE FROM likes WHERE LOWER(username) NOT IN (${placeholders});`,
      AUTHENTIC_USERNAMES.map(u => u.toLowerCase())
    );
    const totalAfter = await queryD1('SELECT COUNT(*) as c FROM likes;');
    const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
    console.log(`✓ likes: Deleted ${deletedCount} bot likes. ${totalAfter[0]?.c} authentic likes remaining.`);
    report.d1Deletions.likes = deletedCount;
  }

  // 5. Clean Comments Table
  if (tableNames.includes('comments')) {
    const cols = await getTableColumns('comments');
    console.log('Columns in comments table:', cols.join(', '));
    const userCol = cols.find(c => ['username', 'author_username', 'user_id', 'author_id'].includes(c.toLowerCase()));
    if (userCol) {
      const totalBefore = await queryD1('SELECT COUNT(*) as c FROM comments;');
      await executeD1(
        `DELETE FROM comments WHERE LOWER(${userCol}) NOT IN (${placeholders});`,
        AUTHENTIC_USERNAMES.map(u => u.toLowerCase())
      );
      const totalAfter = await queryD1('SELECT COUNT(*) as c FROM comments;');
      const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
      console.log(`✓ comments: Deleted ${deletedCount} bot comments. ${totalAfter[0]?.c} authentic comments remaining.`);
      report.d1Deletions.comments = deletedCount;
    } else {
      console.log('ℹ comments: No username column found in comments table.');
    }
  }

  // 6. Clean Messages Table
  if (tableNames.includes('messages')) {
    const cols = await getTableColumns('messages');
    console.log('Columns in messages table:', cols.join(', '));
    const senderCol = cols.find(c => ['sender_id', 'sender_username', 'sender'].includes(c.toLowerCase()));
    const recipCol = cols.find(c => ['recipient_id', 'recipient_username', 'recipient'].includes(c.toLowerCase()));
    if (senderCol && recipCol) {
      const totalBefore = await queryD1('SELECT COUNT(*) as c FROM messages;');
      await executeD1(
        `DELETE FROM messages WHERE LOWER(${senderCol}) NOT IN (${placeholders}) OR LOWER(${recipCol}) NOT IN (${placeholders}) OR id LIKE 'dm-sim-%' OR id LIKE 'msg-gif-test-%';`,
        [...AUTHENTIC_USERNAMES.map(u => u.toLowerCase()), ...AUTHENTIC_USERNAMES.map(u => u.toLowerCase())]
      );
      const totalAfter = await queryD1('SELECT COUNT(*) as c FROM messages;');
      const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
      console.log(`✓ messages: Deleted ${deletedCount} bot messages. ${totalAfter[0]?.c} authentic messages remaining.`);
      report.d1Deletions.messages = deletedCount;
    }
  }

  // 7. Clean Follows Table
  if (tableNames.includes('follows')) {
    const cols = await getTableColumns('follows');
    console.log('Columns in follows table:', cols.join(', '));
    const followerCol = cols.find(c => ['follower', 'follower_id', 'follower_username'].includes(c.toLowerCase()));
    const followingCol = cols.find(c => ['following', 'following_id', 'following_username'].includes(c.toLowerCase()));
    if (followerCol && followingCol) {
      const totalBefore = await queryD1('SELECT COUNT(*) as c FROM follows;');
      await executeD1(
        `DELETE FROM follows WHERE LOWER(${followerCol}) NOT IN (${placeholders}) OR LOWER(${followingCol}) NOT IN (${placeholders});`,
        [...AUTHENTIC_USERNAMES.map(u => u.toLowerCase()), ...AUTHENTIC_USERNAMES.map(u => u.toLowerCase())]
      );
      const totalAfter = await queryD1('SELECT COUNT(*) as c FROM follows;');
      const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
      console.log(`✓ follows: Deleted ${deletedCount} bot follows. ${totalAfter[0]?.c} authentic follows remaining.`);
      report.d1Deletions.follows = deletedCount;
    }
  }

  // 8. Clean Stories Table
  if (tableNames.includes('stories')) {
    const cols = await getTableColumns('stories');
    console.log('Columns in stories table:', cols.join(', '));
    const userCol = cols.find(c => ['username', 'author_username', 'user_id'].includes(c.toLowerCase()));
    if (userCol) {
      const totalBefore = await queryD1('SELECT COUNT(*) as c FROM stories;');
      await executeD1(
        `DELETE FROM stories WHERE LOWER(${userCol}) NOT IN (${placeholders}) OR id LIKE 'story-sim-%' OR id LIKE 'story-6k-%';`,
        AUTHENTIC_USERNAMES.map(u => u.toLowerCase())
      );
      const totalAfter = await queryD1('SELECT COUNT(*) as c FROM stories;');
      const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
      console.log(`✓ stories: Deleted ${deletedCount} bot stories. ${totalAfter[0]?.c} authentic stories remaining.`);
      report.d1Deletions.stories = deletedCount;
    }
  }

  // 9. Clean Campus Diary Entries
  if (tableNames.includes('campus_diary_entries')) {
    const totalBefore = await queryD1('SELECT COUNT(*) as c FROM campus_diary_entries;');
    await executeD1(
      `DELETE FROM campus_diary_entries WHERE id LIKE 'diary-test-%' OR id LIKE 'diary-sim-%' OR uploaded_by_username = 'student' OR LOWER(uploaded_by_username) NOT IN (${placeholders});`,
      AUTHENTIC_USERNAMES.map(u => u.toLowerCase())
    );
    const totalAfter = await queryD1('SELECT COUNT(*) as c FROM campus_diary_entries;');
    const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
    console.log(`✓ campus_diary_entries: Deleted ${deletedCount} bot/test diary entries. ${totalAfter[0]?.c} authentic entries remaining.`);
    report.d1Deletions.campusDiary = deletedCount;
  }

  // 10. Clean Campus Campus Wire Messages
  if (tableNames.includes('campus_wire_messages')) {
    const totalBefore = await queryD1('SELECT COUNT(*) as c FROM campus_wire_messages;');
    await executeD1(
      `DELETE FROM campus_wire_messages WHERE text LIKE '%OFFICIAL NOTICE: Complete Exercise%' OR text LIKE '%Understood, teacher%' OR (LOWER(sender_username) NOT IN (${placeholders}) AND sender_username != 'system');`,
      AUTHENTIC_USERNAMES.map(u => u.toLowerCase())
    );
    const totalAfter = await queryD1('SELECT COUNT(*) as c FROM campus_wire_messages;');
    const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
    console.log(`✓ campus_wire_messages: Deleted ${deletedCount} bot messages. ${totalAfter[0]?.c} authentic messages remaining.`);
    report.d1Deletions.wireMessages = deletedCount;
  }

  // 11. Clean Campus Lost and Found
  if (tableNames.includes('campus_lost_found')) {
    const totalBefore = await queryD1('SELECT COUNT(*) as c FROM campus_lost_found;');
    await executeD1(
      `DELETE FROM campus_lost_found WHERE id LIKE '%SIM%' OR title LIKE '%Titan Fastrack%' OR title LIKE '%test%';`
    );
    const totalAfter = await queryD1('SELECT COUNT(*) as c FROM campus_lost_found;');
    const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
    console.log(`✓ campus_lost_found: Deleted ${deletedCount} bot/test items. ${totalAfter[0]?.c} authentic items remaining.`);
    report.d1Deletions.lostAndFound = deletedCount;
  }

  // 12. Clean Campus Broadcasts
  if (tableNames.includes('campus_broadcasts')) {
    const totalBefore = await queryD1('SELECT COUNT(*) as c FROM campus_broadcasts;');
    await executeD1(
      `DELETE FROM campus_broadcasts WHERE title = 'Winter Uniform Mandatory Notice' OR id LIKE 'bcast-test-%';`
    );
    const totalAfter = await queryD1('SELECT COUNT(*) as c FROM campus_broadcasts;');
    const deletedCount = (totalBefore[0]?.c || 0) - (totalAfter[0]?.c || 0);
    console.log(`✓ campus_broadcasts: Deleted ${deletedCount} test broadcasts. ${totalAfter[0]?.c} authentic broadcasts remaining.`);
    report.d1Deletions.broadcasts = deletedCount;
  }

  // 13. Clean Local Server Store (data/server_store.json)
  if (fs.existsSync('data/server_store.json')) {
    const rawStore = fs.readFileSync('data/server_store.json', 'utf8');
    try {
      const s = JSON.parse(rawStore);
      if (Array.isArray(s.profiles)) {
        s.profiles = s.profiles.filter(p => AUTHENTIC_SET.has((p.username || '').toLowerCase()));
      }
      if (s.users && typeof s.users === 'object') {
        for (const k of Object.keys(s.users)) {
          if (!AUTHENTIC_SET.has(k.toLowerCase())) delete s.users[k];
        }
      }
      if (Array.isArray(s.posts)) {
        s.posts = s.posts.filter(p => AUTHENTIC_SET.has((p.username || '').toLowerCase()) && !p.id.startsWith('sim-'));
      }
      if (Array.isArray(s.stories)) {
        s.stories = s.stories.filter(st => AUTHENTIC_SET.has((st.username || '').toLowerCase()) && !st.id.startsWith('story-sim-'));
      }
      if (s.comments && typeof s.comments === 'object') {
        for (const k of Object.keys(s.comments)) {
          if (Array.isArray(s.comments[k])) {
            s.comments[k] = s.comments[k].filter(c => AUTHENTIC_SET.has((c.username || '').toLowerCase()));
          }
        }
      }
      if (Array.isArray(s.messages)) {
        s.messages = s.messages.filter(m => AUTHENTIC_SET.has((m.senderId || '').toLowerCase()) && AUTHENTIC_SET.has((m.recipientId || '').toLowerCase()));
      }
      fs.writeFileSync('data/server_store.json', JSON.stringify(s, null, 2), 'utf8');
      console.log('✓ data/server_store.json: Cleaned all in-memory bot traces.');
      report.serverStoreCleaned = true;
    } catch (err) {
      console.warn('Error cleaning server_store.json:', err.message);
    }
  }

  // 14. Verify Final State of D1 Profiles
  const finalProfiles = await queryD1('SELECT id, username, full_name, role, is_verified FROM profiles ORDER BY created_at DESC;');
  console.log('\n================================================================================');
  console.log(`  VERIFIED FINAL PRODUCTION PROFILES (${finalProfiles.length} TOTAL):`);
  console.log('================================================================================');
  finalProfiles.forEach(p => {
    console.log(` - @${p.username.padEnd(16)} | ${p.full_name.padEnd(24)} | ${p.role.toUpperCase()}`);
  });

  report.remainingAuthenticAccounts = finalProfiles.map(p => `@${p.username}`);
  fs.writeFileSync('scripts/bot_purge_summary.json', JSON.stringify(report, null, 2), 'utf8');

  console.log('\n✓ ALL 6,000 BOTS DATA AND SIMULATION RECORDS HAVE BEEN FULLY PURGED.');
}

deleteAllBotData().catch(console.error);
