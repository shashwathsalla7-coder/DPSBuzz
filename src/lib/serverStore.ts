import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import type { Post, Story, Profile, ChatNote, Notice, NotificationItem, CallSession } from './dataStore';

export interface ServerStoreData {
  posts: Post[];
  stories: Story[];
  profiles: Profile[];
  chatNotes: ChatNote[];
  chatMessages: Record<string, Array<{ id: string; conversationId?: string; text: string; sender: 'me' | 'them'; senderUsername?: string; time: string; createdAt?: string }>>;
  comments: Record<string, Array<{ id: string; username: string; text: string; timeAgo: string; image?: string; userAvatar?: string | null }>>;
  likes: Record<string, string[]>; // postId -> array of usernames who liked
  notices: Notice[];
  deletedPostIds?: string[]; // IDs of posts deleted permanently
  deletedUsernames?: string[]; // Usernames deleted permanently - NEVER re-add to profiles/posts/leaderboard
  notifications?: NotificationItem[];
  activeCalls?: Record<string, CallSession>;
  follows?: Array<{ follower: string; following: string }>;
  followRequests?: Array<{ requester: string; target: string }>;
  lastUpdated: number;
}

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ogfaxmjw';
const API_KEY = process.env.CLOUDINARY_API_KEY || '585871931796836';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'Fpudf-0uhRPjKpFdmQzOiXZTh1M';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'server_store.json');
const CLOUD_STORE_PUBLIC_ID = 'dpsbuzz_store.json';

const DEFAULT_ADMIN: Profile = {
  id: 'admin-shashwath-id',
  username: 'shashwath71845',
  fullName: 'Shashwath Salla',
  role: 'admin',
  isVerified: true,
  isApproved: true,
  avatar: null,
  bio: 'DPS Buzz Super Administrator 🛡️ • Full Systems & Moderation Access',
  class: 'Staff',
  section: 'Admin',
  followerCount: 0,
  followingCount: 0,
  postCount: 0,
  spiritPoints: 0,
  createdAt: '2026-10-01T00:00:00.000Z',
};

function createInitialStore(): ServerStoreData {
  return {
    posts: [],
    stories: [],
    profiles: [DEFAULT_ADMIN],
    chatNotes: [],
    chatMessages: {},
    comments: {},
    likes: {},
    notices: [],
    deletedPostIds: [],
    deletedUsernames: [],
    notifications: [],
    activeCalls: {},
    follows: [],
    followRequests: [],
    lastUpdated: Date.now(),
  };
}

let memoryCache: ServerStoreData | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1500; // 1.5 seconds TTL for rapid serverless polling

function ensureDataDirectory(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function normalizeStore(parsed: any): ServerStoreData {
  if (!parsed || typeof parsed !== 'object') {
    return createInitialStore();
  }
  const now = Date.now();
  const activeStories = (Array.isArray(parsed.stories) ? parsed.stories : []).filter((s: Story) => {
    if (!s || !s.username) return false;
    if (s.expiresAt && new Date(s.expiresAt).getTime() <= now) return false;
    if (s.createdAt && now - new Date(s.createdAt).getTime() > 24 * 60 * 60 * 1000) return false;
    return true;
  });

  return {
    posts: Array.isArray(parsed.posts) ? parsed.posts : [],
    stories: activeStories,
    profiles: Array.isArray(parsed.profiles) && parsed.profiles.length > 0 ? parsed.profiles : [DEFAULT_ADMIN],
    chatNotes: Array.isArray(parsed.chatNotes) ? parsed.chatNotes : [],
    chatMessages: (() => {
      const sanitized: Record<string, any[]> = {};
      if (parsed.chatMessages && typeof parsed.chatMessages === 'object') {
        for (const [key, msgs] of Object.entries(parsed.chatMessages)) {
          if (!Array.isArray(msgs)) continue;
          if (key.includes('__')) {
            const parts = key.split('__').map((p) => p.trim().toLowerCase()).filter(Boolean);
            if (parts.length === 2 && parts[0] !== parts[1]) {
              sanitized[parts.sort().join('__')] = msgs;
            }
          } else if (key.startsWith('conv-group-')) {
            sanitized[key] = msgs;
          }
        }
      }
      return sanitized;
    })(),
    comments: parsed.comments && typeof parsed.comments === 'object' ? parsed.comments : {},
    likes: parsed.likes && typeof parsed.likes === 'object' ? parsed.likes : {},
    notices: Array.isArray(parsed.notices) ? parsed.notices : [],
    deletedPostIds: Array.isArray(parsed.deletedPostIds) ? parsed.deletedPostIds : [],
    deletedUsernames: Array.isArray(parsed.deletedUsernames) ? parsed.deletedUsernames : [],
    notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    activeCalls: (() => {
      const calls: Record<string, CallSession> = {};
      if (parsed.activeCalls && typeof parsed.activeCalls === 'object') {
        for (const [id, call] of Object.entries(parsed.activeCalls)) {
          if (call && typeof call === 'object' && (call as any).callId) {
            const c = call as CallSession;
            // Purge calls older than 60s if ended/rejected, or older than 90s if ringing
            if ((c.status === 'ended' || c.status === 'rejected') && now - (c.endedAt || c.createdAt) > 60000) {
              continue;
            }
            if (c.status === 'ringing' && now - c.createdAt > 90000) {
              continue;
            }
            calls[id] = c;
          }
        }
      }
      return calls;
    })(),
    follows: Array.isArray(parsed.follows) ? parsed.follows : [],
    followRequests: Array.isArray(parsed.followRequests) ? parsed.followRequests : [],
    lastUpdated: typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : Date.now(),
  };
}

function readLocalStore(): ServerStoreData | null {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      return normalizeStore(JSON.parse(content));
    }
  } catch {}
  return null;
}

function writeLocalStore(data: ServerStoreData): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

async function fetchCloudStore(): Promise<ServerStoreData | null> {
  try {
    const url = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${CLOUD_STORE_PUBLIC_ID}?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return normalizeStore(data);
    }
  } catch (e) {
    console.warn('Could not read store from Cloudinary raw storage:', e);
  }
  return null;
}

async function uploadCloudStore(data: ServerStoreData): Promise<void> {
  try {
    const jsonStr = JSON.stringify(data);
    const base64Data = 'data:application/json;base64,' + Buffer.from(jsonStr).toString('base64');
    await cloudinary.uploader.upload(base64Data, {
      resource_type: 'raw',
      public_id: CLOUD_STORE_PUBLIC_ID,
      overwrite: true,
      invalidate: true,
    });
  } catch (e) {
    console.error('Error uploading store to Cloudinary:', e);
  }
}

export async function getServerStore(options?: { forceRefresh?: boolean }): Promise<ServerStoreData> {
  const now = Date.now();
  if (!options?.forceRefresh && memoryCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  // 1. Fetch from Cloudinary
  const cloudData = await fetchCloudStore();
  if (cloudData) {
    memoryCache = cloudData;
    lastFetchTime = Date.now();
    writeLocalStore(cloudData);
    return memoryCache;
  }

  // 2. Fall back to local file if available
  const localData = readLocalStore();
  if (localData) {
    memoryCache = localData;
    lastFetchTime = Date.now();
    return memoryCache;
  }

  // 3. Fall back to memoryCache or default
  if (!memoryCache) {
    memoryCache = createInitialStore();
    lastFetchTime = Date.now();
    writeLocalStore(memoryCache);
    uploadCloudStore(memoryCache).catch(() => {});
  }

  return memoryCache;
}

export function getServerStoreSync(): ServerStoreData {
  if (memoryCache) return memoryCache;
  const local = readLocalStore();
  if (local) {
    memoryCache = local;
    return local;
  }
  return createInitialStore();
}

export async function saveServerStore(data: Partial<ServerStoreData>): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const updated: ServerStoreData = {
    ...current,
    ...data,
    lastUpdated: Date.now(),
  };

  memoryCache = updated;
  lastFetchTime = Date.now();

  writeLocalStore(updated);
  await uploadCloudStore(updated);

  return updated;
}

export async function addServerPost(post: Post): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  if (current.deletedPostIds && current.deletedPostIds.includes(post.id)) {
    return current;
  }
  const filtered = current.posts.filter((p) => p.id !== post.id);
  filtered.unshift(post);

  const updatedProfiles = current.profiles.map((p) =>
    p.username.toLowerCase() === post.username.toLowerCase()
      ? { ...p, postCount: (p.postCount || 0) + 1 }
      : p
  );

  return await saveServerStore({
    posts: filtered,
    profiles: updatedProfiles,
  });
}

export async function deleteServerPost(postId: string): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const deletedPost = current.posts.find((p) => p.id === postId);
  const filtered = current.posts.filter((p) => p.id !== postId);

  const deletedIds = new Set(current.deletedPostIds || []);
  deletedIds.add(postId);

  const updatedLikes = { ...current.likes };
  delete updatedLikes[postId];
  const updatedComments = { ...current.comments };
  delete updatedComments[postId];

  let updatedProfiles = current.profiles;
  if (deletedPost) {
    updatedProfiles = current.profiles.map((p) =>
      p.username.toLowerCase() === deletedPost.username.toLowerCase()
        ? { ...p, postCount: Math.max(0, (p.postCount || 1) - 1) }
        : p
    );
  }

  return await saveServerStore({
    posts: filtered,
    likes: updatedLikes,
    comments: updatedComments,
    profiles: updatedProfiles,
    deletedPostIds: Array.from(deletedIds),
  });
}

export async function addServerStory(story: Story): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const filtered = current.stories.filter((s) => s.id !== story.id);
  filtered.unshift(story);
  return await saveServerStore({ stories: filtered });
}

export async function upsertServerProfile(profile: Profile): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const clean = profile.username.toLowerCase().trim();
  const filtered = current.profiles.filter((p) => p.username.toLowerCase().trim() !== clean);
  filtered.unshift(profile);
  return await saveServerStore({ profiles: filtered });
}

export async function toggleServerLike(postId: string, username: string): Promise<{ isLiked: boolean; likesCount: number }> {
  const current = await getServerStore({ forceRefresh: true });
  const cleanUser = username.toLowerCase().trim();
  const currentLikes = current.likes[postId] || [];
  const hasLiked = currentLikes.includes(cleanUser);

  let nextLikes: string[];
  if (hasLiked) {
    nextLikes = currentLikes.filter((u) => u !== cleanUser);
  } else {
    nextLikes = [...currentLikes, cleanUser];
  }

  const updatedPosts = current.posts.map((p) => {
    if (p.id === postId) {
      return { ...p, likes: nextLikes.length };
    }
    return p;
  });

  await saveServerStore({
    likes: { ...current.likes, [postId]: nextLikes },
    posts: updatedPosts,
  });

  return { isLiked: !hasLiked, likesCount: nextLikes.length };
}

export async function addServerComment(
  postId: string,
  comment: { id: string; username: string; text: string; timeAgo: string; image?: string; userAvatar?: string | null }
): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const existingComments = current.comments[postId] || [];
  const updatedComments = [...existingComments, comment];

  const updatedPosts = current.posts.map((p) => {
    if (p.id === postId) {
      return { ...p, comments: updatedComments.length };
    }
    return p;
  });

  return await saveServerStore({
    comments: { ...current.comments, [postId]: updatedComments },
    posts: updatedPosts,
  });
}

export async function addServerChatMessage(
  conversationId: string,
  message: { id: string; conversationId?: string; text: string; sender: 'me' | 'them'; senderUsername?: string; time: string; createdAt?: string }
): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  
  // Normalize canonical ID if possible (e.g. userA__userB sorted)
  let targetKey = conversationId;
  if (conversationId.includes('__')) {
    const parts = conversationId.split('__').map((p) => p.trim().toLowerCase());
    targetKey = parts.sort().join('__');
  }

  const existing = current.chatMessages[targetKey] || current.chatMessages[conversationId] || [];
  const filtered = existing.filter((m) => m.id !== message.id);
  filtered.push({ ...message, conversationId: targetKey });

  const updatedChatMessages = {
    ...current.chatMessages,
    [targetKey]: filtered,
  };
  // Prevent cross-user chat leaks: Remove legacy loose conv-xxx single user key if direct chat
  if (targetKey !== conversationId && !conversationId.startsWith('conv-group-')) {
    delete updatedChatMessages[conversationId];
  }

  return await saveServerStore({
    chatMessages: updatedChatMessages,
  });
}

export async function getServerChatMessages(conversationId: string): Promise<any[]> {
  const current = await getServerStore();
  if (conversationId.includes('__')) {
    const parts = conversationId.split('__').map((p) => p.trim().toLowerCase());
    const canonicalKey = parts.sort().join('__');
    if (current.chatMessages[canonicalKey]) {
      return current.chatMessages[canonicalKey];
    }
    const reversedKey = [parts[1], parts[0]].join('__');
    if (current.chatMessages[reversedKey]) {
      return current.chatMessages[reversedKey];
    }
  }
  if (current.chatMessages[conversationId]) {
    return current.chatMessages[conversationId];
  }
  return [];
}

export async function unsendServerChatMessage(
  conversationId: string,
  messageId: string
): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  let targetKey = conversationId;
  if (conversationId.includes('__')) {
    const parts = conversationId.split('__').map((p) => p.trim().toLowerCase());
    targetKey = parts.sort().join('__');
  }

  const existing = current.chatMessages[targetKey] || current.chatMessages[conversationId] || [];
  const filtered = existing.filter((m) => m.id !== messageId);

  const updatedChatMessages = {
    ...current.chatMessages,
    [targetKey]: filtered,
  };
  if (targetKey !== conversationId && !conversationId.startsWith('conv-group-')) {
    delete updatedChatMessages[conversationId];
  }

  return await saveServerStore({
    chatMessages: updatedChatMessages,
  });
}

export async function purgeVanishServerChatMessages(
  conversationId: string
): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  let targetKey = conversationId;
  if (conversationId.includes('__')) {
    const parts = conversationId.split('__').map((p) => p.trim().toLowerCase());
    targetKey = parts.sort().join('__');
  }

  const existing = current.chatMessages[targetKey] || current.chatMessages[conversationId] || [];
  const filtered = existing.filter((m: any) => !m.is_vanish_mode_message && !m.isVanishMode);

  const updatedChatMessages = {
    ...current.chatMessages,
    [targetKey]: filtered,
  };
  if (targetKey !== conversationId && !conversationId.startsWith('conv-group-')) {
    delete updatedChatMessages[conversationId];
  }

  return await saveServerStore({
    chatMessages: updatedChatMessages,
  });
}

export async function markServerChatMessagesRead(
  conversationId: string,
  readerUsername: string
): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  let targetKey = conversationId;
  if (conversationId.includes('__')) {
    const parts = conversationId.split('__').map((p) => p.trim().toLowerCase());
    targetKey = parts.sort().join('__');
  }

  const cleanReader = readerUsername.toLowerCase().trim();
  const existing = current.chatMessages[targetKey] || current.chatMessages[conversationId] || [];
  let updatedAny = false;

  const marked = existing.map((m: any) => {
    const sender = (m.senderUsername || '').toLowerCase().trim();
    if (sender && sender !== cleanReader && !m.is_read && !m.isSeen && !m.readAt) {
      updatedAny = true;
      return {
        ...m,
        is_read: true,
        isSeen: true,
        readAt: Date.now(),
      };
    }
    return m;
  });

  if (!updatedAny) return current;

  const updatedChatMessages = {
    ...current.chatMessages,
    [targetKey]: marked,
  };
  if (targetKey !== conversationId && !conversationId.startsWith('conv-group-')) {
    delete updatedChatMessages[conversationId];
  }

  return await saveServerStore({
    chatMessages: updatedChatMessages,
  });
}

export async function addServerChatNote(note: ChatNote): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const filtered = current.chatNotes.filter(
    (n) => n.username.toLowerCase() !== note.username.toLowerCase()
  );
  filtered.unshift(note);
  return await saveServerStore({ chatNotes: filtered });
}

export async function deleteServerChatNote(username: string): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const clean = username.toLowerCase().trim();
  const filtered = current.chatNotes.filter((n) => n.username.toLowerCase() !== clean);
  return await saveServerStore({ chatNotes: filtered });
}

export async function recordServerNewUserAlert(profile: Profile): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const existing = current.notifications || [];
  const clean = profile.username.toLowerCase().trim();

  const adminAlert: NotificationItem = {
    id: `notif-srv-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: 'shashwath71845',
    type: 'system',
    title: '🎉 New Student Signed Up!',
    body: `@${clean} (${profile.fullName}) from Class ${profile.class || ''}-${profile.section || ''} just joined DPS Buzz.`,
    timeAgo: 'Just now',
    isRead: false,
    link: `/u/${clean}`,
  };

  const schoolAlert: NotificationItem = {
    id: `notif-srv-school-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: 'admin',
    type: 'system',
    title: '🎉 New Student Signed Up!',
    body: `@${clean} (${profile.fullName}) from Class ${profile.class || ''}-${profile.section || ''} just joined DPS Buzz.`,
    timeAgo: 'Just now',
    isRead: false,
    link: `/u/${clean}`,
  };

  const welcomeAlert: NotificationItem = {
    id: `notif-srv-welcome-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: clean,
    type: 'system',
    title: '🐝 Welcome to DPS Buzz!',
    body: `Hi ${profile.fullName}, welcome to the DPS campus social network! Your profile is live.`,
    timeAgo: 'Just now',
    isRead: false,
    link: '/home',
  };

  const merged = [adminAlert, schoolAlert, welcomeAlert, ...existing].slice(0, 100);
  return await saveServerStore({ notifications: merged });
}

export async function deleteServerAccount(username: string): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const clean = username.toLowerCase().trim();

  // 1. Filter out profile
  const profiles = (current.profiles || []).filter(
    (p) => p && p.username && p.username.toLowerCase().trim() !== clean
  );

  // 2. Filter out posts (authored by user or reposted from user)
  const posts = (current.posts || []).filter(
    (p) =>
      p &&
      p.username &&
      p.username.toLowerCase().trim() !== clean &&
      (!p.repostedFrom || (p.repostedFrom.username || '').toLowerCase().trim() !== clean)
  );

  // 3. Filter out stories
  const stories = (current.stories || []).filter(
    (s) => s && s.username && s.username.toLowerCase().trim() !== clean
  );

  // 4. Remove comments made by user across all posts
  const updatedComments: Record<string, any[]> = {};
  for (const [postId, commentList] of Object.entries(current.comments || {})) {
    if (Array.isArray(commentList)) {
      updatedComments[postId] = commentList.filter(
        (c) => c && c.username && c.username.toLowerCase().trim() !== clean
      );
    }
  }

  // 5. Remove likes made by user across all posts and decrement post likes count
  const updatedLikes: Record<string, string[]> = {};
  for (const [postId, likers] of Object.entries(current.likes || {})) {
    if (Array.isArray(likers)) {
      updatedLikes[postId] = likers.filter((u) => u && u.toLowerCase().trim() !== clean);
    }
  }

  // Recalculate likes and comments on remaining posts
  const updatedPosts = posts.map((post) => {
    const postLikes = Array.isArray(updatedLikes[post.id]) ? updatedLikes[post.id].length : post.likes || 0;
    const postComments = Array.isArray(updatedComments[post.id]) ? updatedComments[post.id].length : post.comments || 0;
    return { ...post, likes: postLikes, comments: postComments };
  });

  // 6. Remove chats & direct messages involving user
  const updatedChatMessages: Record<string, any[]> = {};
  for (const [convId, msgs] of Object.entries(current.chatMessages || {})) {
    if (convId.includes('__')) {
      const parts = convId.split('__').map((p) => p.toLowerCase().trim());
      if (parts.includes(clean)) {
        continue; // drop entire private DM with deleted user
      }
    } else if (convId === `conv-${clean}` || convId === clean) {
      continue;
    }
    if (Array.isArray(msgs)) {
      // For any remaining group conversations, filter out messages sent by this user
      updatedChatMessages[convId] = msgs.filter(
        (m) => (m.senderUsername || '').toLowerCase().trim() !== clean
      );
    }
  }

  // 7. Remove chat notes
  const chatNotes = (current.chatNotes || []).filter(
    (n) => n && n.username && n.username.toLowerCase().trim() !== clean
  );

  // 8. Remove notifications sent to or related to user
  const notifications = (current.notifications || []).filter(
    (n) =>
      n &&
      n.userId &&
      n.userId.toLowerCase().trim() !== clean &&
      !(n.link && n.link.toLowerCase().includes(`/u/${clean}`)) &&
      !(n.body && n.body.toLowerCase().includes(`@${clean}`))
  );

  // 9. Add to deletedUsernames list so account cannot be resurrected by sync
  const deletedUsernames = Array.isArray(current.deletedUsernames) ? [...current.deletedUsernames] : [];
  if (!deletedUsernames.includes(clean)) {
    deletedUsernames.push(clean);
  }

  return await saveServerStore({
    profiles,
    posts: updatedPosts,
    stories,
    comments: updatedComments,
    likes: updatedLikes,
    chatMessages: updatedChatMessages,
    chatNotes,
    notifications,
    deletedUsernames,
  });
}

// ==========================================
// ACTIVE CALLS & WEBRTC SIGNALING STORE
// Dedicated sub-second store (isolated 1KB file)
// ==========================================

const CLOUD_CALLS_PUBLIC_ID = 'dpsbuzz_active_calls.json';
const CALLS_LOCAL_FILE = path.join(DATA_DIR, 'active_calls.json');

let callsCache: Record<string, CallSession> = {};
let lastCallsFetchTime = 0;
const CALLS_CACHE_TTL_MS = 600; // 600ms TTL for low-latency WebRTC polling

function cleanCallsMap(calls: Record<string, CallSession>): Record<string, CallSession> {
  const cleaned: Record<string, CallSession> = {};
  const now = Date.now();
  for (const [id, c] of Object.entries(calls)) {
    if (!c || !c.callId) continue;
    // Prune ended or rejected calls after 15 seconds
    if ((c.status === 'ended' || c.status === 'rejected') && now - (c.endedAt || c.createdAt) > 15000) {
      continue;
    }
    // Prune unanswered ringing calls after 45 seconds
    if (c.status === 'ringing' && now - c.createdAt > 45000) {
      continue;
    }
    // Prune stale connected calls after 30 minutes to prevent zombie locks
    if (c.status === 'connected' && now - (c.connectedAt || c.createdAt) > 30 * 60 * 1000) {
      continue;
    }
    cleaned[id] = c;
  }
  return cleaned;
}

function readLocalCalls(): Record<string, CallSession> | null {
  try {
    if (fs.existsSync(CALLS_LOCAL_FILE)) {
      const content = fs.readFileSync(CALLS_LOCAL_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return cleanCallsMap(parsed);
      }
    }
  } catch {}
  return null;
}

function writeLocalCalls(calls: Record<string, CallSession>): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(CALLS_LOCAL_FILE, JSON.stringify(calls, null, 2), 'utf-8');
  } catch {}
}

async function fetchCloudCalls(): Promise<Record<string, CallSession> | null> {
  try {
    // Use v${Date.now()} in URL path to completely bypass Cloudflare/Cloudinary 30-day edge cache
    const url = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/v${Date.now()}/${CLOUD_CALLS_PUBLIC_ID}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const cleaned = cleanCallsMap(data);
        writeLocalCalls(cleaned);
        return cleaned;
      }
    }
  } catch {}

  const local = readLocalCalls();
  if (local) return local;

  return null;
}

async function uploadCloudCalls(calls: Record<string, CallSession>): Promise<void> {
  try {
    writeLocalCalls(calls);
    const jsonStr = JSON.stringify(calls);
    const base64Data = 'data:application/json;base64,' + Buffer.from(jsonStr).toString('base64');
    await cloudinary.uploader.upload(base64Data, {
      resource_type: 'raw',
      public_id: CLOUD_CALLS_PUBLIC_ID,
      overwrite: true,
      invalidate: true,
    });
  } catch (e) {
    console.error('Error uploading calls to Cloudinary:', e);
  }
}

export async function getServerActiveCalls(force = false): Promise<Record<string, CallSession>> {
  const now = Date.now();
  if (!force && Object.keys(callsCache).length > 0 && now - lastCallsFetchTime < CALLS_CACHE_TTL_MS) {
    return callsCache;
  }

  const cloud = await fetchCloudCalls();
  if (cloud) {
    callsCache = cloud;
    lastCallsFetchTime = now;
    return callsCache;
  }

  return callsCache;
}

export async function getServerCall(callId: string): Promise<CallSession | null> {
  const calls = await getServerActiveCalls(true);
  return calls[callId] || callsCache[callId] || (readLocalCalls() || {})[callId] || null;
}

export async function findUserActiveCall(username: string): Promise<CallSession | null> {
  const clean = username.toLowerCase().trim();
  const calls = await getServerActiveCalls(true);
  const now = Date.now();
  for (const call of Object.values(calls)) {
    if (
      (call.receiverUsername.toLowerCase().trim() === clean ||
        call.callerUsername.toLowerCase().trim() === clean) &&
      call.status !== 'ended' &&
      call.status !== 'rejected'
    ) {
      if (call.status === 'ringing' && now - (call.createdAt || now) > 45000) {
        continue;
      }
      if (call.status === 'connected' && now - (call.connectedAt || call.createdAt || now) > 30 * 60 * 1000) {
        continue;
      }
      return call;
    }
  }
  return null;
}

export async function saveServerCall(call: CallSession): Promise<CallSession> {
  const current = await getServerActiveCalls(true);
  const updated = { ...current, [call.callId]: call };
  callsCache = updated;
  lastCallsFetchTime = Date.now();

  await uploadCloudCalls(updated);
  return call;
}

export async function updateServerCall(
  callId: string,
  updates: Partial<CallSession>
): Promise<CallSession | null> {
  const current = await getServerActiveCalls(true);
  const existing = current[callId] || callsCache[callId] || (readLocalCalls() || {})[callId];

  const callerUsername = updates.callerUsername || existing?.callerUsername || '';
  const receiverUsername = updates.receiverUsername || existing?.receiverUsername || '';

  // Guard: NEVER create or save a session with blank usernames
  if (!callerUsername && !receiverUsername) {
    console.warn('[serverStore] updateServerCall skipped: missing usernames for callId', callId);
    return existing || null;
  }

  const baseCall: CallSession = existing || {
    callId,
    callerUsername,
    callerName: updates.callerName || '',
    callerAvatar: updates.callerAvatar || null,
    receiverUsername,
    receiverName: updates.receiverName || '',
    receiverAvatar: updates.receiverAvatar || null,
    isVideo: updates.isVideo ?? false,
    status: (updates.status as any) || 'ringing',
    createdAt: updates.createdAt || Date.now(),
  };

  // Merge iceCandidates if present without duplicates
  let mergedCandidates = baseCall.iceCandidates ? [...baseCall.iceCandidates] : [];
  if (updates.iceCandidates) {
    const candMap = new Map<string, any>();
    mergedCandidates.forEach((c) => {
      if (c && c.candidate) candMap.set(JSON.stringify(c.candidate), c);
    });
    updates.iceCandidates.forEach((c) => {
      if (c && c.candidate) candMap.set(JSON.stringify(c.candidate), c);
    });
    mergedCandidates = Array.from(candMap.values());
  }

  const updatedCall: CallSession = {
    ...baseCall,
    ...updates,
    callerUsername: callerUsername || baseCall.callerUsername,
    receiverUsername: receiverUsername || baseCall.receiverUsername,
    callerName: updates.callerName || baseCall.callerName,
    receiverName: updates.receiverName || baseCall.receiverName,
    ...(mergedCandidates.length > 0 ? { iceCandidates: mergedCandidates } : {}),
  };
  const updatedMap = { ...current, [callId]: updatedCall };
  callsCache = updatedMap;
  lastCallsFetchTime = Date.now();

  await uploadCloudCalls(updatedMap);
  return updatedCall;
}

export async function deleteServerCall(callId: string): Promise<void> {
  const current = await getServerActiveCalls(true);
  if (current[callId]) {
    delete current[callId];
    callsCache = current;
    lastCallsFetchTime = Date.now();
    await uploadCloudCalls(current);
  }
}


