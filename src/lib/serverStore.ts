import fs from 'fs';
import path from 'path';
import type { Post, Story, Profile, ChatNote, Notice } from './dataStore';

export interface ServerStoreData {
  posts: Post[];
  stories: Story[];
  profiles: Profile[];
  chatNotes: ChatNote[];
  chatMessages: Record<string, Array<{ id: string; conversationId?: string; text: string; sender: 'me' | 'them'; senderUsername?: string; time: string; createdAt?: string }>>;
  comments: Record<string, Array<{ id: string; username: string; text: string; timeAgo: string }>>;
  likes: Record<string, string[]>; // postId -> array of usernames who liked
  notices: Notice[];
  deletedPostIds?: string[]; // IDs of posts deleted permanently
  lastUpdated: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'server_store.json');

const DEFAULT_ADMIN: Profile = {
  id: 'admin-shashwath-id',
  username: 'shashwath71845',
  fullName: 'Shashwath (Admin)',
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

function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getServerStore(): ServerStoreData {
  ensureDataDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initialData: ServerStoreData = {
      posts: [],
      stories: [],
      profiles: [DEFAULT_ADMIN],
      chatNotes: [],
      chatMessages: {},
      comments: {},
      likes: {},
      notices: [],
      lastUpdated: Date.now(),
    };
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error initializing server store file:', e);
    }
    return initialData;
  }

  try {
    const content = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(content) as ServerStoreData;
    if (!parsed.posts) parsed.posts = [];
    if (!parsed.stories) parsed.stories = [];
    if (!parsed.profiles) parsed.profiles = [DEFAULT_ADMIN];
    if (!parsed.chatNotes) parsed.chatNotes = [];
    if (!parsed.chatMessages) parsed.chatMessages = {};
    if (!parsed.comments) parsed.comments = {};
    if (!parsed.likes) parsed.likes = {};
    if (!parsed.deletedPostIds) parsed.deletedPostIds = [];
    return parsed;
  } catch (e) {
    console.error('Error reading server store file:', e);
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
      lastUpdated: Date.now(),
    };
  }
}

export function saveServerStore(data: Partial<ServerStoreData>): ServerStoreData {
  ensureDataDirectory();
  const current = getServerStore();
  const updated: ServerStoreData = {
    ...current,
    ...data,
    lastUpdated: Date.now(),
  };

  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing server store file:', e);
  }

  return updated;
}

export function addServerPost(post: Post): ServerStoreData {
  const current = getServerStore();
  if (current.deletedPostIds && current.deletedPostIds.includes(post.id)) {
    return current;
  }
  // Filter out any existing post with same ID
  const filtered = current.posts.filter((p) => p.id !== post.id);
  filtered.unshift(post);

  // Update profile post count
  const updatedProfiles = current.profiles.map((p) =>
    p.username.toLowerCase() === post.username.toLowerCase()
      ? { ...p, postCount: (p.postCount || 0) + 1 }
      : p
  );

  return saveServerStore({
    posts: filtered,
    profiles: updatedProfiles,
  });
}

export function deleteServerPost(postId: string): ServerStoreData {
  const current = getServerStore();
  const deletedPost = current.posts.find((p) => p.id === postId);
  const filtered = current.posts.filter((p) => p.id !== postId);

  // Keep a permanent record of deleted post IDs so sync can never resurrect it
  const deletedIds = new Set(current.deletedPostIds || []);
  deletedIds.add(postId);

  // Clean up likes and comments
  const updatedLikes = { ...current.likes };
  delete updatedLikes[postId];
  const updatedComments = { ...current.comments };
  delete updatedComments[postId];

  // Update profile post count if found
  let updatedProfiles = current.profiles;
  if (deletedPost) {
    updatedProfiles = current.profiles.map((p) =>
      p.username.toLowerCase() === deletedPost.username.toLowerCase()
        ? { ...p, postCount: Math.max(0, (p.postCount || 1) - 1) }
        : p
    );
  }

  return saveServerStore({
    posts: filtered,
    likes: updatedLikes,
    comments: updatedComments,
    profiles: updatedProfiles,
    deletedPostIds: Array.from(deletedIds),
  });
}

export function addServerStory(story: Story): ServerStoreData {
  const current = getServerStore();
  const filtered = current.stories.filter((s) => s.id !== story.id);
  filtered.unshift(story);
  return saveServerStore({ stories: filtered });
}

export function upsertServerProfile(profile: Profile): ServerStoreData {
  const current = getServerStore();
  const clean = profile.username.toLowerCase().trim();
  const filtered = current.profiles.filter((p) => p.username.toLowerCase().trim() !== clean);
  filtered.unshift(profile);
  return saveServerStore({ profiles: filtered });
}

export function toggleServerLike(postId: string, username: string): { isLiked: boolean; likesCount: number } {
  const current = getServerStore();
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

  saveServerStore({
    likes: { ...current.likes, [postId]: nextLikes },
    posts: updatedPosts,
  });

  return { isLiked: !hasLiked, likesCount: nextLikes.length };
}

export function addServerComment(
  postId: string,
  comment: { id: string; username: string; text: string; timeAgo: string }
): ServerStoreData {
  const current = getServerStore();
  const existingComments = current.comments[postId] || [];
  const updatedComments = [...existingComments, comment];

  const updatedPosts = current.posts.map((p) => {
    if (p.id === postId) {
      return { ...p, comments: updatedComments.length };
    }
    return p;
  });

  return saveServerStore({
    comments: { ...current.comments, [postId]: updatedComments },
    posts: updatedPosts,
  });
}

export function addServerChatMessage(
  conversationId: string,
  message: { id: string; conversationId?: string; text: string; sender: 'me' | 'them'; senderUsername?: string; time: string; createdAt?: string }
): ServerStoreData {
  const current = getServerStore();
  const existing = current.chatMessages[conversationId] || [];
  const filtered = existing.filter((m) => m.id !== message.id);
  filtered.push(message);

  return saveServerStore({
    chatMessages: { ...current.chatMessages, [conversationId]: filtered },
  });
}

export function getServerChatMessages(conversationId: string): any[] {
  const current = getServerStore();
  return current.chatMessages[conversationId] || [];
}

export function addServerChatNote(note: ChatNote): ServerStoreData {
  const current = getServerStore();
  const filtered = current.chatNotes.filter(
    (n) => n.username.toLowerCase() !== note.username.toLowerCase()
  );
  filtered.unshift(note);
  return saveServerStore({ chatNotes: filtered });
}

export function deleteServerChatNote(username: string): ServerStoreData {
  const current = getServerStore();
  const clean = username.toLowerCase().trim();
  const filtered = current.chatNotes.filter((n) => n.username.toLowerCase() !== clean);
  return saveServerStore({ chatNotes: filtered });
}
