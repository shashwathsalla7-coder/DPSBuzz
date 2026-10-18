import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Post, Story, Profile, ChatNote, Notice, NotificationItem, NotificationType, CallSession } from './dataStore';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  return createSupabaseClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_KEY || 'placeholder_key',
    {
      auth: { persistSession: false },
    }
  );
}

export interface ServerReportItem {
  id: string;
  type: 'post' | 'comment' | 'message' | 'call' | 'user';
  targetUser: string;
  reporterUsername: string;
  reporterReason: string;
  contentSnippet?: string;
  reportCount?: number;
  urgency: 'urgent' | 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'pending' | 'hidden' | 'deleted' | 'warned' | 'banned' | 'resolved';
}

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
  unsentMessageIds?: string[]; // IDs of permanently unsent chat messages across all devices
  notifications?: NotificationItem[];
  reports?: ServerReportItem[];
  activeCalls?: Record<string, CallSession>;
  follows?: Array<{ follower: string; following: string }>;
  followRequests?: Array<{ requester: string; target: string }>;
  groups?: any[];
  groupMembers?: Record<string, string[]>;
  groupJoinRequests?: any[];
  lastUpdated: number;
}

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

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
    unsentMessageIds: [],
    notifications: [],
    activeCalls: {},
    follows: [],
    followRequests: [],
    groups: [],
    groupMembers: {},
    groupJoinRequests: [],
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

export function normalizeStore(parsed: any): ServerStoreData {
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

  const deletedUsernamesList: string[] = Array.isArray(parsed.deletedUsernames) ? parsed.deletedUsernames : [];
  const deletedUsernamesSet = new Set(deletedUsernamesList.map((u: string) => (u || '').toLowerCase().trim()));
  const TEST_DUMMIES = new Set(['arjun_8a', 'priya_7b', 'arjun', 'priya', 'demo-user-1', 'test_user', 'testuser']);

  // Clean follows (exclude deleted users and test dummies)
  const rawFollows = Array.isArray(parsed.follows) ? parsed.follows : [];
  const seenFollowKeys = new Set<string>();
  const validFollows: Array<{ follower: string; following: string }> = [];
  for (const f of rawFollows) {
    if (!f || !f.follower || !f.following) continue;
    const fol = (f.follower || '').toLowerCase().trim();
    const fing = (f.following || '').toLowerCase().trim();
    if (!fol || !fing || fol === fing) continue;
    if (deletedUsernamesSet.has(fol) || deletedUsernamesSet.has(fing)) continue;
    if (TEST_DUMMIES.has(fol) || TEST_DUMMIES.has(fing)) continue;
    const key = `${fol}->${fing}`;
    if (!seenFollowKeys.has(key)) {
      seenFollowKeys.add(key);
      validFollows.push({ follower: fol, following: fing });
    }
  }

  // Dynamic profiles with accurate follower/following counts
  const rawProfiles = Array.isArray(parsed.profiles) && parsed.profiles.length > 0 ? parsed.profiles : [DEFAULT_ADMIN];
  const validProfiles: Profile[] = rawProfiles
    .filter((p: Profile) => {
      if (!p || !p.username) return false;
      const u = p.username.toLowerCase().trim();
      return !deletedUsernamesSet.has(u) && !TEST_DUMMIES.has(u);
    })
    .map((p: Profile) => {
      const u = p.username.toLowerCase().trim();
      const followerCount = validFollows.filter((f) => f.following.toLowerCase().trim() === u).length;
      const followingCount = validFollows.filter((f) => f.follower.toLowerCase().trim() === u).length;
      return {
        ...p,
        followerCount,
        followingCount,
      };
    });
  if (validProfiles.length === 0) validProfiles.push(DEFAULT_ADMIN);

  return {
    posts: Array.isArray(parsed.posts) ? parsed.posts.filter((p: Post) => {
      if (!p || !p.username) return false;
      const u = p.username.toLowerCase().trim();
      return !deletedUsernamesSet.has(u) && !TEST_DUMMIES.has(u);
    }) : [],
    stories: activeStories,
    profiles: validProfiles,
    chatNotes: Array.isArray(parsed.chatNotes) ? parsed.chatNotes.filter((n: ChatNote) => {
      if (!n || !n.username) return false;
      const u = n.username.toLowerCase().trim();
      return !deletedUsernamesSet.has(u) && !TEST_DUMMIES.has(u);
    }) : [],
    chatMessages: (() => {
      const sanitized: Record<string, any[]> = {};
      if (parsed.chatMessages && typeof parsed.chatMessages === 'object') {
        for (const [key, msgs] of Object.entries(parsed.chatMessages)) {
          if (!Array.isArray(msgs)) continue;
          if (key.includes('__')) {
            const parts = key.split('__').map((p) => p.trim().toLowerCase()).filter(Boolean);
            if (parts.length === 2 && parts[0] !== parts[1]) {
              if (deletedUsernamesSet.has(parts[0]) || deletedUsernamesSet.has(parts[1])) continue;
              if (TEST_DUMMIES.has(parts[0]) || TEST_DUMMIES.has(parts[1])) continue;
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
    unsentMessageIds: Array.isArray(parsed.unsentMessageIds) ? parsed.unsentMessageIds : [],
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
    follows: validFollows,
    followRequests: Array.isArray(parsed.followRequests) ? parsed.followRequests.filter((r: any) => {
      const req = (r.requester || '').toLowerCase().trim();
      const tar = (r.target || '').toLowerCase().trim();
      return req && tar && !deletedUsernamesSet.has(req) && !deletedUsernamesSet.has(tar) && !TEST_DUMMIES.has(req) && !TEST_DUMMIES.has(tar);
    }) : [],
    groups: Array.isArray(parsed.groups) ? parsed.groups : [],
    groupMembers: parsed.groupMembers && typeof parsed.groupMembers === 'object' ? parsed.groupMembers : {},
    groupJoinRequests: Array.isArray(parsed.groupJoinRequests) ? parsed.groupJoinRequests : [],
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

let lastCloudFetchFailure = 0;
let cloudUploadTimer: NodeJS.Timeout | null = null;
let pendingCloudData: ServerStoreData | null = null;
let isUploadingCloud = false;

async function fetchCloudStore(): Promise<ServerStoreData | null> {
  // Circuit breaker: skip if failed within the last 2 minutes
  if (Date.now() - lastCloudFetchFailure < 120000) {
    return null;
  }
  try {
    const url = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${CLOUD_STORE_PUBLIC_ID}?t=${Date.now()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return normalizeStore(data);
    }
  } catch {
    lastCloudFetchFailure = Date.now();
  }
  return null;
}

function scheduleCloudUpload(data: ServerStoreData): void {
  // Debounce background backup so user requests and serverless routes never wait for Cloudinary
  pendingCloudData = data;
  if (cloudUploadTimer) return;

  cloudUploadTimer = setTimeout(async () => {
    cloudUploadTimer = null;
    if (!pendingCloudData || isUploadingCloud) return;
    const toUpload = pendingCloudData;
    pendingCloudData = null;
    isUploadingCloud = true;

    try {
      const jsonStr = JSON.stringify(toUpload);
      const base64Data = 'data:application/json;base64,' + Buffer.from(jsonStr).toString('base64');
      await Promise.race([
        cloudinary.uploader.upload(base64Data, {
          resource_type: 'raw',
          public_id: CLOUD_STORE_PUBLIC_ID,
          overwrite: true,
          invalidate: true,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud upload timeout')), 3500)),
      ]);
    } catch {
      // Non-blocking background sync error
    } finally {
      isUploadingCloud = false;
    }
  }, 3000);
}

export async function getServerStore(options?: { forceRefresh?: boolean }): Promise<ServerStoreData> {
  const now = Date.now();
  if (!options?.forceRefresh && memoryCache && (now - lastFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  // 1. Check local file store FIRST (instant 0.1ms read, zero network lag)
  const localData = readLocalStore();
  if (localData) {
    memoryCache = localData;
    lastFetchTime = Date.now();
    return memoryCache;
  }

  // 2. Return memory cache if available
  if (memoryCache) {
    return memoryCache;
  }

  // 3. Fall back to cloud store on cold boot with tight timeout
  const cloudData = await fetchCloudStore();
  if (cloudData) {
    memoryCache = cloudData;
    lastFetchTime = Date.now();
    writeLocalStore(cloudData);
    return memoryCache;
  }

  // 4. Fall back to fresh initial store
  memoryCache = createInitialStore();
  lastFetchTime = Date.now();
  writeLocalStore(memoryCache);
  scheduleCloudUpload(memoryCache);

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
  const current = await getServerStore({ forceRefresh: false });
  const rawUpdated: ServerStoreData = {
    ...current,
    ...data,
    lastUpdated: Date.now(),
  };

  const updated = normalizeStore(rawUpdated);
  memoryCache = updated;
  lastFetchTime = Date.now();

  writeLocalStore(updated);
  scheduleCloudUpload(updated); // Non-blocking background sync

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
  const existing = current.profiles.find((p) => p.username.toLowerCase().trim() === clean);
  const resolvedProfile: Profile = {
    ...existing,
    ...profile,
    avatar: (profile.avatar !== undefined && profile.avatar !== null) ? profile.avatar : (existing?.avatar || profile.avatar || null),
    class: (profile.class && profile.class.trim() && profile.class !== '8') ? profile.class : (existing?.class || profile.class || '8'),
    section: (profile.section && profile.section.trim()) ? profile.section : (existing?.section || profile.section || 'A'),
  };
  const filtered = current.profiles.filter((p) => p.username.toLowerCase().trim() !== clean);
  filtered.unshift(resolvedProfile);

  // Propagate updated avatar to posts authored by this student
  let updatedPosts = current.posts;
  if (resolvedProfile.avatar !== undefined) {
    updatedPosts = current.posts.map((p) => {
      if ((p.username || '').toLowerCase().trim() === clean) {
        return { ...p, userAvatar: resolvedProfile.avatar || null };
      }
      return p;
    });
  }

  return await saveServerStore({ profiles: filtered, posts: updatedPosts });
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

  // Guard: if message was already unsent permanently, refuse to resurrect it
  if (current.unsentMessageIds && current.unsentMessageIds.includes(message.id)) {
    return current;
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
  const unsentSet = new Set(current.unsentMessageIds || []);
  let msgs: any[] = [];
  if (conversationId.includes('__')) {
    const parts = conversationId.split('__').map((p) => p.trim().toLowerCase());
    const canonicalKey = parts.sort().join('__');
    if (current.chatMessages[canonicalKey]) {
      msgs = current.chatMessages[canonicalKey];
    } else {
      const reversedKey = [parts[1], parts[0]].join('__');
      if (current.chatMessages[reversedKey]) {
        msgs = current.chatMessages[reversedKey];
      }
    }
  } else if (current.chatMessages[conversationId]) {
    msgs = current.chatMessages[conversationId];
  }
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  return msgs.filter((m) => {
    if (!m || !m.id || unsentSet.has(m.id)) return false;
    if (m.is_vanish_mode_message || m.isVanishMode) {
      const timestamp = m.createdAt ? new Date(m.createdAt).getTime() : (m.timestamp || 0);
      if (timestamp && (now - timestamp > DAY_MS)) {
        return false;
      }
    }
    return true;
  });
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

  const unsentSet = new Set(current.unsentMessageIds || []);
  unsentSet.add(messageId);
  const updatedUnsentIds = Array.from(unsentSet).slice(-2000);

  return await saveServerStore({
    chatMessages: updatedChatMessages,
    unsentMessageIds: updatedUnsentIds,
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
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  // Vanish mode rule: Messages only disappear after 24 hours
  const filtered = existing.filter((m: any) => {
    if (m.is_vanish_mode_message || m.isVanishMode) {
      const timestamp = m.createdAt ? new Date(m.createdAt).getTime() : (m.timestamp || 0);
      if (timestamp && (now - timestamp > DAY_MS)) {
        return false;
      }
    }
    return true;
  });

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

/**
 * 10-Day Retention Policy: Prunes chat photos older than retention days (default 10 days).
 * Completely purges heavy image data while preserving text logs.
 * Post photos in feed remain permanent and are NOT affected.
 */
export async function pruneExpiredServerChatPhotos(
  retentionDays = 10
): Promise<{ prunedCount: number; updated: ServerStoreData }> {
  const current = await getServerStore({ forceRefresh: true });
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let prunedCount = 0;

  const nextChatMessages: Record<string, any[]> = {};

  for (const [convId, msgs] of Object.entries(current.chatMessages || {})) {
    if (!Array.isArray(msgs)) continue;
    nextChatMessages[convId] = msgs.map((m: any) => {
      const isChatPhoto =
        m.isChatPhoto ||
        m.sharedPost?.id?.startsWith('chat-photo-') ||
        m.sharedPost?.id?.startsWith('img-') ||
        m.sharedPost?.caption === 'Chat photo' ||
        m.sharedPost?.caption === 'Shared a photo';

      if (!isChatPhoto) return m;

      const msgTime =
        m.timestamp ||
        (m.createdAt ? new Date(m.createdAt).getTime() : null) ||
        (m.id && m.id.startsWith('msg-') ? parseInt(m.id.split('-')[1]) : null);

      if (msgTime && now - msgTime > maxAgeMs) {
        if (m.sharedPost?.imageUrl) {
          prunedCount++;
          return {
            ...m,
            text: '📸 Photo expired (10 days limit)',
            isPhotoExpired: true,
            sharedPost: {
              ...m.sharedPost,
              imageUrl: null,
            },
          };
        }
      }
      return m;
    });
  }

  const updated = await saveServerStore({ chatMessages: nextChatMessages });
  return { prunedCount, updated };
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

  // 10. Clean follows (remove user as follower or following)
  const updatedFollows = (current.follows || []).filter((f) => {
    const fol = (f.follower || '').toLowerCase().trim();
    const fing = (f.following || '').toLowerCase().trim();
    return fol !== clean && fing !== clean;
  });

  // 11. Clean follow requests
  const updatedFollowRequests = (current.followRequests || []).filter((r) => {
    const req = (r.requester || '').toLowerCase().trim();
    const tar = (r.target || '').toLowerCase().trim();
    return req !== clean && tar !== clean;
  });

  // 12. Recalculate follower and following counts for remaining profiles
  const updatedProfiles = profiles.map((p) => {
    const u = (p.username || '').toLowerCase().trim();
    return {
      ...p,
      followerCount: updatedFollows.filter((f) => (f.following || '').toLowerCase().trim() === u).length,
      followingCount: updatedFollows.filter((f) => (f.follower || '').toLowerCase().trim() === u).length,
    };
  });

  return await saveServerStore({
    profiles: updatedProfiles,
    posts: updatedPosts,
    stories,
    comments: updatedComments,
    likes: updatedLikes,
    chatMessages: updatedChatMessages,
    chatNotes,
    notifications,
    deletedUsernames,
    follows: updatedFollows,
    followRequests: updatedFollowRequests,
  });
}

/**
 * Dispatch server-level in-app notification to a user
 */
export async function addServerNotification(notif: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}): Promise<ServerStoreData> {
  const current = await getServerStore({ forceRefresh: true });
  const existing = current.notifications || [];
  const fullNotif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: notif.userId.toLowerCase().trim(),
    type: notif.type,
    title: notif.title,
    body: notif.body,
    timeAgo: 'Just now',
    isRead: false,
    link: notif.link || '/home',
    createdAt: new Date().toISOString(),
  };
  return await saveServerStore({
    notifications: [fullNotif, ...existing].slice(0, 100),
  });
}

/**
 * Update cricket game invite status inside chatMessages across all conversations
 */
export async function updateCricketInviteInChat(
  gameId: string,
  newStatus: 'selecting' | 'in_progress' | 'completed' | 'declined',
  extra?: { winner?: string; winningGuess?: string; forfeitedBy?: string }
): Promise<void> {
  const current = await getServerStore({ forceRefresh: true });
  const chatMessages = { ...(current.chatMessages || {}) };
  let modified = false;

  for (const [key, msgs] of Object.entries(chatMessages)) {
    if (!Array.isArray(msgs)) continue;
    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];
      if (msg && msg.text && msg.text.startsWith('🎮 [CRICKET_GAME]:')) {
        try {
          const inviteData = JSON.parse(msg.text.replace('🎮 [CRICKET_GAME]:', ''));
          if (inviteData.gameId === gameId) {
            inviteData.status = newStatus;
            if (extra?.winner) inviteData.winner = extra.winner;
            if (extra?.winningGuess) inviteData.winningGuess = extra.winningGuess;
            if (extra?.forfeitedBy) inviteData.forfeitedBy = extra.forfeitedBy;
            msgs[i] = {
              ...msg,
              text: '🎮 [CRICKET_GAME]:' + JSON.stringify(inviteData),
            };
            modified = true;
          }
        } catch {}
      }
    }
  }

  if (modified) {
    await saveServerStore({ chatMessages });
  }
}

/**
 * Update Connect 4 game invite status inside chatMessages across all conversations
 */
export async function updateConnect4InviteInChat(
  gameId: string,
  newStatus: 'in_progress' | 'completed' | 'declined',
  extra?: { winner?: string; forfeitedBy?: string }
): Promise<void> {
  const current = await getServerStore({ forceRefresh: true });
  const chatMessages = { ...(current.chatMessages || {}) };
  let modified = false;

  for (const [key, msgs] of Object.entries(chatMessages)) {
    if (!Array.isArray(msgs)) continue;
    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];
      if (msg && msg.text && msg.text.startsWith('🔴 [CONNECT4_GAME]:')) {
        try {
          const inviteData = JSON.parse(msg.text.replace('🔴 [CONNECT4_GAME]:', ''));
          if (inviteData.gameId === gameId) {
            inviteData.status = newStatus;
            if (extra?.winner) inviteData.winner = extra.winner;
            if (extra?.forfeitedBy) inviteData.forfeitedBy = extra.forfeitedBy;
            msgs[i] = {
              ...msg,
              text: '🔴 [CONNECT4_GAME]:' + JSON.stringify(inviteData),
            };
            modified = true;
          }
        } catch {}
      }
    }
  }

  if (modified) {
    await saveServerStore({ chatMessages });
  }
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

export async function getServerActiveCalls(force = false): Promise<Record<string, CallSession>> {
  const local = readLocalCalls() || {};
  callsCache = { ...local, ...callsCache };
  return callsCache;
}

export async function getServerCall(callId: string): Promise<CallSession | null> {
  // 1. Check in-memory cache
  if (callsCache[callId]) {
    return callsCache[callId];
  }

  // 2. Fetch from Supabase app_settings
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `call_${callId}`)
      .maybeSingle();

    if (data?.value) {
      const parsed = JSON.parse(data.value);
      callsCache[callId] = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('[serverStore] Failed to fetch call from Supabase:', err);
  }

  // 3. Fallback to local file
  const local = readLocalCalls() || {};
  return local[callId] || null;
}

export async function findUserActiveCall(username: string): Promise<CallSession | null> {
  const clean = username.toLowerCase().trim();
  const now = Date.now();

  // 1. Check Supabase active call pointer for this user
  try {
    const supabase = getSupabase();
    const { data: ptrData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `call_user_${clean}`)
      .maybeSingle();

    if (ptrData?.value) {
      const activeCallId = ptrData.value;
      const call = await getServerCall(activeCallId);
      if (call && call.status !== 'ended' && call.status !== 'rejected') {
        const isFreshRinging = call.status === 'ringing' && now - (call.createdAt || now) <= 45000;
        const isFreshConnected = call.status === 'connected' && now - (call.connectedAt || call.createdAt || now) <= 7200000;
        if (isFreshRinging || isFreshConnected) {
          callsCache[call.callId] = call;
          return call;
        } else {
          // Stale pointer cleanup
          Promise.resolve(supabase.from('app_settings').delete().eq('key', `call_user_${clean}`)).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('[serverStore] Failed to find user active call in Supabase:', err);
  }

  // 2. Fallback to in-memory cache and local file
  const local = readLocalCalls() || {};
  const calls = { ...local, ...callsCache };
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
  callsCache[call.callId] = call;
  writeLocalCalls(callsCache);

  try {
    const supabase = getSupabase();
    const cleanReceiver = (call.receiverUsername || '').toLowerCase().trim();
    const cleanCaller = (call.callerUsername || '').toLowerCase().trim();
    const nowIso = new Date().toISOString();

    const rows = [
      { key: `call_${call.callId}`, value: JSON.stringify(call), updated_at: nowIso },
    ];
    if (cleanReceiver) {
      rows.push({ key: `call_user_${cleanReceiver}`, value: call.callId, updated_at: nowIso });
    }
    if (cleanCaller) {
      rows.push({ key: `call_user_${cleanCaller}`, value: call.callId, updated_at: nowIso });
    }

    await supabase.from('app_settings').upsert(rows);
  } catch (err) {
    console.warn('[serverStore] Failed to save call to Supabase:', err);
  }

  return call;
}

export async function updateServerCall(
  callId: string,
  updates: Partial<CallSession>
): Promise<CallSession | null> {
  const existing = await getServerCall(callId);

  const callerUsername = (updates.callerUsername || existing?.callerUsername || '').toLowerCase().trim();
  const receiverUsername = (updates.receiverUsername || existing?.receiverUsername || '').toLowerCase().trim();

  if (!callerUsername && !receiverUsername && !existing) {
    return null;
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

  const updatedCall: CallSession = {
    ...baseCall,
    ...updates,
    callerUsername: callerUsername || baseCall.callerUsername,
    receiverUsername: receiverUsername || baseCall.receiverUsername,
    callerName: updates.callerName || baseCall.callerName,
    receiverName: updates.receiverName || baseCall.receiverName,
  };

  if (updatedCall.status === 'ended' || updatedCall.status === 'rejected') {
    updatedCall.endedAt = updatedCall.endedAt || Date.now();
  }

  callsCache[callId] = updatedCall;
  const local = readLocalCalls() || {};
  local[callId] = updatedCall;
  writeLocalCalls(local);

  try {
    const supabase = getSupabase();
    const nowIso = new Date().toISOString();

    if (updatedCall.status === 'ended' || updatedCall.status === 'rejected') {
      await supabase.from('app_settings').upsert({
        key: `call_${callId}`,
        value: JSON.stringify(updatedCall),
        updated_at: nowIso,
      });

      const keysToDelete: string[] = [];
      if (callerUsername) keysToDelete.push(`call_user_${callerUsername}`);
      if (receiverUsername) keysToDelete.push(`call_user_${receiverUsername}`);
      if (keysToDelete.length > 0) {
        await supabase.from('app_settings').delete().in('key', keysToDelete);
      }
    } else {
      await supabase.from('app_settings').upsert({
        key: `call_${callId}`,
        value: JSON.stringify(updatedCall),
        updated_at: nowIso,
      });
    }
  } catch (err) {
    console.warn('[serverStore] Failed to update call in Supabase:', err);
  }

  return updatedCall;
}

export async function deleteServerCall(callId: string): Promise<void> {
  const existing = await getServerCall(callId);
  const callerUsername = (existing?.callerUsername || '').toLowerCase().trim();
  const receiverUsername = (existing?.receiverUsername || '').toLowerCase().trim();

  delete callsCache[callId];
  const local = readLocalCalls() || {};
  delete local[callId];
  writeLocalCalls(local);

  try {
    const supabase = getSupabase();
    const keysToDelete = [`call_${callId}`];
    if (callerUsername) keysToDelete.push(`call_user_${callerUsername}`);
    if (receiverUsername) keysToDelete.push(`call_user_${receiverUsername}`);
    await supabase.from('app_settings').delete().in('key', keysToDelete);
  } catch (err) {
    console.warn('[serverStore] Failed to delete call from Supabase:', err);
  }
}

export async function upsertServerGroup(group: any): Promise<ServerStoreData> {
  const store = await getServerStore({ forceRefresh: true });
  const groups = Array.isArray(store.groups) ? [...store.groups] : [];
  const idx = groups.findIndex((g) => g.id === group.id);
  if (idx >= 0) {
    groups[idx] = { ...groups[idx], ...group };
  } else {
    groups.unshift(group);
  }
  store.groups = groups;

  if (!store.groupMembers) store.groupMembers = {};
  if (Array.isArray(group.members) && group.members.length > 0) {
    const existing = store.groupMembers[group.id] || [];
    const set = new Set([...existing, ...group.members.map((m: string) => m.toLowerCase().trim())]);
    store.groupMembers[group.id] = Array.from(set);
  }

  await saveServerStore(store);
  return store;
}

export async function addServerGroupMember(groupId: string, username: string): Promise<ServerStoreData> {
  const store = await getServerStore({ forceRefresh: true });
  if (!store.groupMembers) store.groupMembers = {};
  const clean = username.toLowerCase().trim();
  const existing = store.groupMembers[groupId] || [];
  if (!existing.map((m) => m.toLowerCase()).includes(clean)) {
    store.groupMembers[groupId] = [...existing, clean];
  }
  if (Array.isArray(store.groups)) {
    store.groups = store.groups.map((g) => {
      if (g.id === groupId) {
        const mems = Array.isArray(g.members) ? [...g.members] : [];
        if (!mems.map((m) => m.toLowerCase()).includes(clean)) {
          mems.push(clean);
        }
        return { ...g, members: mems, memberCount: mems.length };
      }
      return g;
    });
  }
  await saveServerStore(store);
  return store;
}

export async function removeServerGroupMember(groupId: string, username: string): Promise<ServerStoreData> {
  const store = await getServerStore({ forceRefresh: true });
  if (!store.groupMembers) store.groupMembers = {};
  const clean = username.toLowerCase().trim();
  if (store.groupMembers[groupId]) {
    store.groupMembers[groupId] = store.groupMembers[groupId].filter((m) => m.toLowerCase() !== clean);
  }
  if (Array.isArray(store.groups)) {
    store.groups = store.groups.map((g) => {
      if (g.id === groupId && Array.isArray(g.members)) {
        const mems = g.members.filter((m: string) => m.toLowerCase() !== clean);
        return { ...g, members: mems, memberCount: Math.max(1, mems.length) };
      }
      return g;
    });
  }
  await saveServerStore(store);
  return store;
}

export async function addServerReport(report: Omit<ServerReportItem, 'id' | 'createdAt' | 'status'>): Promise<ServerReportItem> {
  const store = await getServerStore({ forceRefresh: true });
  if (!store.reports) store.reports = [];

  const newReport: ServerReportItem = {
    ...report,
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    reportCount: 1,
  };

  store.reports.unshift(newReport);
  await saveServerStore(store);
  return newReport;
}

export async function getServerReports(): Promise<ServerReportItem[]> {
  const store = await getServerStore();
  return store.reports || [];
}

export async function pruneExpiredServerStories(): Promise<number> {
  const store = await getServerStore({ forceRefresh: true });
  const now = Date.now();
  const initialCount = (store.stories || []).length;
  // Expire after 24 hours
  store.stories = (store.stories || []).filter((s) => {
    const created = new Date(s.createdAt).getTime();
    return now - created < 24 * 60 * 60 * 1000;
  });
  const pruned = initialCount - store.stories.length;
  if (pruned > 0) {
    await saveServerStore(store);
  }
  return pruned;
}

export async function upsertServerGroupJoinRequest(req: any): Promise<ServerStoreData> {
  const store = await getServerStore({ forceRefresh: true });
  const list = Array.isArray(store.groupJoinRequests) ? [...store.groupJoinRequests] : [];
  const idx = list.findIndex((r) => r.id === req.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...req };
  } else {
    list.unshift(req);
  }
  store.groupJoinRequests = list;
  await saveServerStore(store);
  return store;
}



