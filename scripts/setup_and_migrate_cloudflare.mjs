import fs from 'fs';
import path from 'path';

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'a674b4cebe06334d4a0e284e138cc6a1';
const CF_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || 'a88d4fa9-4472-4876-bf32-045b966b0f77';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.argv[2] || '';

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
    throw new Error(`SQL Failed: ${JSON.stringify(data.errors || data)} (SQL: ${sql.substring(0, 100)})`);
  }
  return data.result?.[0]?.results || [];
}

async function runMigration() {
  console.log('====================================================');
  console.log('   DPS BUZZ -> CLOUDFLARE D1 AUTOMATED MIGRATION   ');
  console.log('====================================================\n');

  console.log('1. Creating tables in Cloudflare D1...');
  const schemaPath = path.join(process.cwd(), 'cloudflare', 'schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Split into individual statements
  const statements = schemaContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await executeSql(stmt);
    } catch (e) {
      console.warn('Notice creating schema item:', e.message);
    }
  }
  console.log(`✓ All ${statements.length} table and index definitions executed in Cloudflare D1.\n`);

  console.log('2. Reading backup data...');
  const backupFile = path.join(process.cwd(), 'data', 'backups', 'friends_groups_phase0_backup_2026-10-28T15-35-29-276Z.json');
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  const profiles = backup.supabase?.profiles || backup.serverStore?.profiles || [];
  const follows = backup.supabase?.follows || backup.serverStore?.follows || [];
  const followRequests = backup.supabase?.follow_requests || backup.serverStore?.followRequests || [];
  const groups = backup.supabase?.groups || backup.serverStore?.groups || [];
  const groupMembers = backup.serverStore?.groupMembers || {};
  const posts = backup.serverStore?.posts || [];
  const comments = backup.serverStore?.comments || {};
  const likes = backup.serverStore?.likes || {};
  const chatMessages = backup.serverStore?.chatMessages || {};
  const appSettings = backup.supabase?.app_settings || [];

  console.log(`- Profiles to migrate: ${profiles.length}`);
  console.log(`- Posts to migrate: ${posts.length}`);
  console.log(`- Groups to migrate: ${groups.length}`);
  console.log(`- Follow relationships: ${follows.length}`);

  // 3. Migrate Profiles
  console.log('\n3. Inserting Profiles...');
  for (const p of profiles) {
    const id = p.id || `prof_${p.username}`;
    const username = (p.username || '').toLowerCase().trim();
    if (!username) continue;

    await executeSql(
      `INSERT INTO profiles (id, username, full_name, avatar_url, bio, class, section, role, is_verified, is_approved, is_private, follower_count, following_count, post_count, spirit_points, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(username) DO UPDATE SET
         full_name = excluded.full_name,
         avatar_url = excluded.avatar_url,
         bio = excluded.bio,
         class = excluded.class,
         section = excluded.section,
         role = excluded.role,
         follower_count = excluded.follower_count,
         following_count = excluded.following_count,
         post_count = excluded.post_count,
         spirit_points = excluded.spirit_points;`,
      [
        id,
        username,
        p.fullName || p.full_name || username,
        p.avatar || p.avatar_url || null,
        p.bio || '',
        p.class || '8',
        p.section || 'A',
        p.role || 'student',
        p.isVerified ?? p.is_verified ? 1 : 0,
        p.isApproved ?? p.is_approved ? 1 : 0,
        p.isPrivate ?? p.is_private ? 1 : 0,
        p.followerCount ?? p.follower_count ?? 0,
        p.followingCount ?? p.following_count ?? 0,
        p.postCount ?? p.post_count ?? 0,
        p.spiritPoints ?? p.spirit_points ?? 50,
        p.createdAt || p.created_at || new Date().toISOString(),
      ]
    );
  }
  console.log(`✓ Inserted ${profiles.length} profiles.`);

  // 4. Migrate Follows
  console.log('\n4. Inserting Follow relationships...');
  for (const f of follows) {
    const follower = (f.follower || '').toLowerCase().trim();
    const following = (f.following || '').toLowerCase().trim();
    if (!follower || !following || follower === following) continue;

    const id = f.id || `fol_${follower}_${following}`;
    await executeSql(
      `INSERT OR IGNORE INTO follows (id, follower, following, created_at) VALUES (?, ?, ?, ?)`,
      [id, follower, following, f.created_at || new Date().toISOString()]
    );
  }
  console.log(`✓ Inserted follows.`);

  // 5. Migrate Follow Requests
  console.log('\n5. Inserting Follow Requests...');
  for (const r of followRequests) {
    const req = (r.requester || '').toLowerCase().trim();
    const tar = (r.target || '').toLowerCase().trim();
    if (!req || !tar || req === tar) continue;

    const id = r.id || `req_${req}_${tar}`;
    await executeSql(
      `INSERT OR IGNORE INTO follow_requests (id, requester, target, created_at) VALUES (?, ?, ?, ?)`,
      [id, req, tar, r.created_at || new Date().toISOString()]
    );
  }
  console.log(`✓ Inserted follow requests.`);

  // 6. Migrate Groups & Members
  console.log('\n6. Inserting Groups & Group Members...');
  for (const g of groups) {
    await executeSql(
      `INSERT OR REPLACE INTO groups (id, name, description, created_by, icon_url, member_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        g.id,
        g.name || 'Unnamed Group',
        g.description || '',
        g.created_by || 'shashwath71845',
        g.icon_url || null,
        g.member_count || 1,
        g.created_at || new Date().toISOString(),
      ]
    );
  }

  for (const [groupId, members] of Object.entries(groupMembers)) {
    if (!Array.isArray(members)) continue;
    for (const mem of members) {
      const cleanUser = (mem || '').toLowerCase().trim();
      if (!cleanUser) continue;
      const memId = `mem_${groupId}_${cleanUser}`;
      await executeSql(
        `INSERT OR IGNORE INTO group_members_registry (id, group_id, username, role, joined_at)
         VALUES (?, ?, ?, ?, ?)`,
        [memId, groupId, cleanUser, cleanUser === 'shashwath71845' ? 'admin' : 'member', new Date().toISOString()]
      );
    }
  }
  console.log(`✓ Inserted groups and members.`);

  // 7. Migrate Posts, Comments, Likes
  console.log('\n7. Inserting Posts, Comments, Likes...');
  for (const post of posts) {
    await executeSql(
      `INSERT OR REPLACE INTO posts (id, author_id, author_username, content, media_urls, likes_count, comments_count, is_announcement, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post.id,
        post.authorId || post.author_id || post.username,
        (post.username || '').toLowerCase().trim(),
        post.caption || post.content || '',
        post.image || post.mediaUrls ? JSON.stringify([post.image || post.mediaUrls]) : '[]',
        post.likesCount || post.likes || 0,
        post.commentsCount || post.comments || 0,
        post.isAnnouncement ? 1 : 0,
        post.createdAt || post.created_at || new Date().toISOString(),
      ]
    );
  }

  for (const [postId, commentList] of Object.entries(comments)) {
    if (!Array.isArray(commentList)) continue;
    for (const c of commentList) {
      await executeSql(
        `INSERT OR REPLACE INTO comments (id, post_id, author_id, author_username, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          c.id || `cmt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          postId,
          c.authorId || c.username,
          (c.username || '').toLowerCase().trim(),
          c.text || c.content || '',
          c.createdAt || new Date().toISOString(),
        ]
      );
    }
  }

  for (const [postId, likers] of Object.entries(likes)) {
    if (!Array.isArray(likers)) continue;
    for (const u of likers) {
      const cleanUser = (u || '').toLowerCase().trim();
      if (!cleanUser) continue;
      const likeId = `like_${postId}_${cleanUser}`;
      await executeSql(
        `INSERT OR IGNORE INTO likes (id, post_id, user_id, username, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [likeId, postId, cleanUser, cleanUser, new Date().toISOString()]
      );
    }
  }
  console.log(`✓ Inserted posts, comments, and likes.`);

  // 8. Migrate Chat Messages
  console.log('\n8. Inserting Chat Messages...');
  let totalChatMessages = 0;
  for (const [chatKey, msgs] of Object.entries(chatMessages)) {
    if (!Array.isArray(msgs)) continue;
    for (const m of msgs) {
      const msgId = m.id || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const sender = (m.senderUsername || m.sender || '').toLowerCase().trim();
      await executeSql(
        `INSERT OR REPLACE INTO messages (id, chat_id, sender_id, recipient_id, content, media_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          msgId,
          chatKey,
          sender || 'shashwath71845',
          m.recipientUsername || null,
          m.text || m.content || '',
          m.mediaUrl || null,
          m.createdAt || m.time || new Date().toISOString(),
        ]
      );
      totalChatMessages++;
    }
  }
  console.log(`✓ Inserted ${totalChatMessages} chat messages across ${Object.keys(chatMessages).length} conversations.`);

  // 9. Migrate App Settings
  console.log('\n9. Inserting App Settings...');
  for (const s of appSettings) {
    if (!s.key) continue;
    await executeSql(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [s.key, s.value, s.updated_at || new Date().toISOString()]
    );
  }
  console.log(`✓ Inserted app settings.`);

  console.log('\n====================================================');
  console.log('✓ CLOUDFLARE D1 MIGRATION SUCCESSFULLY COMPLETED!   ');
  console.log('====================================================');
}

runMigration().catch((err) => {
  console.error('\nMigration Error:', err.message);
  process.exit(1);
});
