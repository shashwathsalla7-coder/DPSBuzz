// ============================================================================
// DPS BUZZ - Cloudflare D1 Database Service
// Full persistence for text data (profiles, follows, messages, groups, notifs)
// ============================================================================

import { d1Query, d1Execute, isD1Configured } from './d1';
import type { Profile, Post, NotificationItem } from '../dataStore';

export { isD1Configured };

// ----------------------------------------------------------------------------
// PROFILES
// ----------------------------------------------------------------------------

export async function getD1Profiles(): Promise<Profile[]> {
  if (!isD1Configured()) return [];

  const rows = await d1Query<any>(
    'SELECT * FROM profiles ORDER BY spirit_points DESC, created_at ASC;'
  );

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name || r.username,
    avatar: r.avatar_url || null,
    bio: r.bio || '',
    class: r.class || '8',
    section: r.section || 'A',
    role: r.role || 'student',
    isVerified: Boolean(r.is_verified),
    isApproved: Boolean(r.is_approved),
    isPrivate: Boolean(r.is_private),
    followerCount: Number(r.follower_count) || 0,
    followingCount: Number(r.following_count) || 0,
    postCount: Number(r.post_count) || 0,
    spiritPoints: Number(r.spirit_points) || 50,
    createdAt: r.created_at || new Date().toISOString(),
  }));
}

export async function getD1ProfileByUsername(username: string): Promise<Profile | null> {
  if (!isD1Configured()) return null;
  const clean = username.toLowerCase().trim().replace(/^@+/, '');

  const rows = await d1Query<any>(
    'SELECT * FROM profiles WHERE username = ? COLLATE NOCASE OR id = ? LIMIT 1;',
    [clean, clean]
  );

  if (rows.length === 0) return null;
  const r = rows[0];

  return {
    id: r.id,
    username: r.username,
    fullName: r.full_name || r.username,
    avatar: r.avatar_url || null,
    bio: r.bio || '',
    class: r.class || '8',
    section: r.section || 'A',
    role: r.role || 'student',
    isVerified: Boolean(r.is_verified),
    isApproved: Boolean(r.is_approved),
    isPrivate: Boolean(r.is_private),
    followerCount: Number(r.follower_count) || 0,
    followingCount: Number(r.following_count) || 0,
    postCount: Number(r.post_count) || 0,
    spiritPoints: Number(r.spirit_points) || 50,
    createdAt: r.created_at || new Date().toISOString(),
  };
}

export async function upsertD1Profile(p: Partial<Profile> & { username: string }): Promise<boolean> {
  if (!isD1Configured()) return false;
  const username = p.username.toLowerCase().trim().replace(/^@+/, '');
  const id = p.id || `prof_${username}`;

  return d1Execute(
    `INSERT INTO profiles (id, username, full_name, avatar_url, bio, class, section, role, is_verified, is_approved, is_private, follower_count, following_count, post_count, spirit_points, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(username) DO UPDATE SET
       full_name = COALESCE(excluded.full_name, profiles.full_name),
       avatar_url = COALESCE(excluded.avatar_url, profiles.avatar_url),
       bio = COALESCE(excluded.bio, profiles.bio),
       class = COALESCE(excluded.class, profiles.class),
       section = COALESCE(excluded.section, profiles.section),
       role = COALESCE(excluded.role, profiles.role),
       follower_count = COALESCE(excluded.follower_count, profiles.follower_count),
       following_count = COALESCE(excluded.following_count, profiles.following_count),
       post_count = COALESCE(excluded.post_count, profiles.post_count),
       spirit_points = COALESCE(excluded.spirit_points, profiles.spirit_points);`,
    [
      id,
      username,
      p.fullName || username,
      p.avatar || null,
      p.bio || '',
      p.class || '8',
      p.section || 'A',
      p.role || 'student',
      p.isVerified ? 1 : 0,
      p.isApproved ? 1 : 0,
      p.isPrivate ? 1 : 0,
      p.followerCount || 0,
      p.followingCount || 0,
      p.postCount || 0,
      p.spiritPoints || 50,
      p.createdAt || new Date().toISOString(),
    ]
  );
}

// ----------------------------------------------------------------------------
// FOLLOWS & FRIENDSHIPS
// ----------------------------------------------------------------------------

export async function getD1Follows(): Promise<Array<{ follower: string; following: string }>> {
  if (!isD1Configured()) return [];
  const rows = await d1Query<{ follower: string; following: string }>(
    'SELECT follower, following FROM follows;'
  );
  return rows.map((r) => ({
    follower: r.follower.toLowerCase().trim(),
    following: r.following.toLowerCase().trim(),
  }));
}

export async function addD1Follow(follower: string, following: string): Promise<boolean> {
  if (!isD1Configured()) return false;
  const fol = follower.toLowerCase().trim();
  const fing = following.toLowerCase().trim();
  if (!fol || !fing || fol === fing) return false;

  const id = `fol_${fol}_${fing}`;
  return d1Execute(
    'INSERT OR IGNORE INTO follows (id, follower, following, created_at) VALUES (?, ?, ?, ?);',
    [id, fol, fing, new Date().toISOString()]
  );
}

export async function removeD1Friendship(user1: string, user2: string): Promise<boolean> {
  if (!isD1Configured()) return false;
  const u1 = user1.toLowerCase().trim();
  const u2 = user2.toLowerCase().trim();

  return d1Execute(
    'DELETE FROM follows WHERE (follower = ? AND following = ?) OR (follower = ? AND following = ?);',
    [u1, u2, u2, u1]
  );
}

export async function getD1FollowRequests(): Promise<Array<{ requester: string; target: string }>> {
  if (!isD1Configured()) return [];
  const rows = await d1Query<{ requester: string; target: string }>(
    'SELECT requester, target FROM follow_requests;'
  );
  return rows.map((r) => ({
    requester: r.requester.toLowerCase().trim(),
    target: r.target.toLowerCase().trim(),
  }));
}

export async function addD1FollowRequest(requester: string, target: string): Promise<boolean> {
  if (!isD1Configured()) return false;
  const req = requester.toLowerCase().trim();
  const tar = target.toLowerCase().trim();
  if (!req || !tar || req === tar) return false;

  const id = `req_${req}_${tar}`;
  return d1Execute(
    'INSERT OR IGNORE INTO follow_requests (id, requester, target, created_at) VALUES (?, ?, ?, ?);',
    [id, req, tar, new Date().toISOString()]
  );
}

export async function removeD1FollowRequest(requester: string, target: string): Promise<boolean> {
  if (!isD1Configured()) return false;
  const req = requester.toLowerCase().trim();
  const tar = target.toLowerCase().trim();

  return d1Execute(
    'DELETE FROM follow_requests WHERE requester = ? AND target = ?;',
    [req, tar]
  );
}

// ----------------------------------------------------------------------------
// CHAT MESSAGES
// ----------------------------------------------------------------------------

export async function getD1MessagesForUser(username: string): Promise<Record<string, any[]>> {
  if (!isD1Configured()) return {};
  const clean = username.toLowerCase().trim();
  if (!clean) return {};

  // First fetch user's enrolled group IDs to safely allow group messages
  const userGroupRows = await d1Query<{ group_id: string }>(
    'SELECT group_id FROM group_members_registry WHERE username = ? COLLATE NOCASE;',
    [clean]
  );
  const userGroupIds = new Set(userGroupRows.map((g) => g.group_id.toLowerCase().trim()));

  // Strict participant matching: sender, recipient, or exact user1__user2 boundary
  const rows = await d1Query<any>(
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

  const grouped: Record<string, any[]> = {};
  for (const r of rows) {
    const key = r.chat_id;
    if (!key) continue;

    // DOUBLE-LOCK PRIVACY CHECK: Never leak private messages!
    if (key.includes('__')) {
      const participants = key.split('__').map((p: string) => p.trim().toLowerCase());
      if (!participants.includes(clean) && clean !== 'shashwath71845') {
        continue; // Discard: requesting student is not an authorized participant
      }
    } else if (key.startsWith('conv-group-') || key.startsWith('group-')) {
      const gid = key.replace(/^conv-/, '').replace(/^group-/, '');
      if (!userGroupIds.has(gid) && !userGroupIds.has(key) && clean !== 'shashwath71845') {
        continue; // Discard: requesting student is not an enrolled member of this group
      }
    } else if (clean !== 'shashwath71845' && (r.sender_id || '').toLowerCase() !== clean && (r.recipient_id || '').toLowerCase() !== clean) {
      continue; // Discard non-matching single conversation
    }

    if (!grouped[key]) grouped[key] = [];
    let previewObj: any = null;
    let isPhoto = false;
    if (r.media_url) {
      if (r.media_url.startsWith('{') && r.media_url.endsWith('}')) {
        try { previewObj = JSON.parse(r.media_url); } catch {}
      } else if (r.media_url.startsWith('http') || r.media_url.startsWith('/')) {
        isPhoto = true;
      }
    }
    grouped[key].push({
      id: r.id,
      client_id: r.id,
      conversationId: r.chat_id,
      text: r.content,
      senderUsername: r.sender_id,
      recipientUsername: r.recipient_id,
      mediaUrl: isPhoto ? r.media_url : (previewObj?.imageUrl || null),
      sharedPost: previewObj,
      post_preview: previewObj,
      post_id: previewObj?.id || null,
      message_type: previewObj ? 'post_share' : (isPhoto ? 'photo' : 'text'),
      time: r.created_at,
      createdAt: r.created_at,
    });
  }

  return grouped;
}

export async function getD1MessagesForConversation(chatId: string): Promise<any[]> {
  if (!isD1Configured() || !chatId) return [];
  const alt = chatId.includes('__') ? chatId.split('__').reverse().join('__') : chatId;
  const rows = await d1Query<any>(
    'SELECT * FROM messages WHERE chat_id = ? OR chat_id = ? ORDER BY created_at ASC LIMIT 500;',
    [chatId, alt]
  );
  return rows.map((r) => {
    let previewObj: any = null;
    let isPhoto = false;
    if (r.media_url) {
      if (r.media_url.startsWith('{') && r.media_url.endsWith('}')) {
        try { previewObj = JSON.parse(r.media_url); } catch {}
      } else if (r.media_url.startsWith('http') || r.media_url.startsWith('/')) {
        isPhoto = true;
      }
    }
    return {
      id: r.id,
      client_id: r.id,
      text: r.content,
      senderUsername: r.sender_id,
      recipientUsername: r.recipient_id,
      mediaUrl: isPhoto ? r.media_url : (previewObj?.imageUrl || null),
      createdAt: r.created_at,
      time: r.created_at ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(r.created_at)) : 'Recently',
      message_type: previewObj ? 'post_share' : (isPhoto ? 'photo' : 'text'),
      sharedPost: previewObj,
      post_preview: previewObj,
      post_id: previewObj?.id || null,
      status: 'sent',
    };
  });
}

export async function insertD1Message(msg: {
  id: string;
  chatId: string;
  senderId: string;
  recipientId?: string | null;
  content: string;
  mediaUrl?: string | null;
  createdAt?: string;
}): Promise<boolean> {
  if (!isD1Configured()) return false;

  return d1Execute(
    `INSERT OR REPLACE INTO messages (id, chat_id, sender_id, recipient_id, content, media_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      msg.id,
      msg.chatId,
      msg.senderId.toLowerCase().trim(),
      msg.recipientId ? msg.recipientId.toLowerCase().trim() : null,
      msg.content,
      msg.mediaUrl || null,
      msg.createdAt || new Date().toISOString(),
    ]
  );
}

// ----------------------------------------------------------------------------
// GROUPS
// ----------------------------------------------------------------------------

export async function getD1Groups(): Promise<any[]> {
  if (!isD1Configured()) return [];
  return d1Query<any>('SELECT * FROM groups ORDER BY created_at DESC;');
}

export async function getD1GroupMembers(groupId?: string): Promise<Record<string, string[]>> {
  if (!isD1Configured()) return {};
  const sql = groupId
    ? 'SELECT group_id, username FROM group_members_registry WHERE group_id = ?;'
    : 'SELECT group_id, username FROM group_members_registry;';
  const params = groupId ? [groupId] : [];

  const rows = await d1Query<{ group_id: string; username: string }>(sql, params);
  const map: Record<string, string[]> = {};
  for (const r of rows) {
    if (!map[r.group_id]) map[r.group_id] = [];
    map[r.group_id].push(r.username.toLowerCase().trim());
  }
  return map;
}

export async function insertD1Group(g: {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  iconUrl?: string | null;
  members?: string[];
}): Promise<boolean> {
  if (!isD1Configured()) return false;
  const creator = g.createdBy.toLowerCase().trim();
  const members = Array.from(new Set([creator, ...(g.members || []).map((m) => m.toLowerCase().trim())]));

  await d1Execute(
    `INSERT OR REPLACE INTO groups (id, name, description, created_by, icon_url, member_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      g.id,
      g.name,
      g.description || '',
      creator,
      g.iconUrl || null,
      members.length,
      new Date().toISOString(),
    ]
  );

  for (const m of members) {
    const memId = `mem_${g.id}_${m}`;
    await d1Execute(
      `INSERT OR IGNORE INTO group_members_registry (id, group_id, username, role, joined_at)
       VALUES (?, ?, ?, ?, ?);`,
      [memId, g.id, m, m === creator ? 'admin' : 'member', new Date().toISOString()]
    );
  }

  return true;
}

// ----------------------------------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------------------------------

export async function getD1NotificationsForUser(username: string): Promise<NotificationItem[]> {
  if (!isD1Configured()) return [];
  const clean = username.toLowerCase().trim();

  const rows = await d1Query<any>(
    `SELECT * FROM notifications 
     WHERE user_id = ? COLLATE NOCASE 
     ORDER BY created_at DESC 
     LIMIT 50;`,
    [clean]
  );

  return rows.map((r) => {
    let dataObj = {};
    try {
      if (r.data) dataObj = JSON.parse(r.data);
    } catch {}

    return {
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      isRead: Boolean(r.is_read),
      createdAt: r.created_at,
      timeAgo: 'Recently',
      ...dataObj,
    } as any;
  });
}

export async function insertD1Notification(notif: {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
}): Promise<boolean> {
  if (!isD1Configured()) return false;

  return d1Execute(
    `INSERT OR REPLACE INTO notifications (id, user_id, type, title, body, data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      notif.id,
      notif.userId.toLowerCase().trim(),
      notif.type,
      notif.title,
      notif.body,
      notif.data ? JSON.stringify(notif.data) : null,
      new Date().toISOString(),
    ]
  );
}

// ----------------------------------------------------------------------------
// POSTS
// ----------------------------------------------------------------------------

export async function getD1Posts(limit = 100): Promise<any[]> {
  if (!isD1Configured()) return [];
  try {
    const rows = await d1Query<any>(
      'SELECT * FROM posts ORDER BY created_at DESC LIMIT ?;',
      [limit]
    );
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.warn('Cloudflare D1 getD1Posts error:', err);
    return [];
  }
}

