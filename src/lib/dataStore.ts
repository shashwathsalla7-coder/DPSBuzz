// =====================================================
// DPS BUZZ - Centralized Production Data Store
// Manages real-time state, official account auto-follow,
// roster CSV upload, class group auto-generation, and test data wipe.
// =====================================================

export interface Profile {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  bio?: string;
  class?: string;
  section?: string;
  admissionNumber?: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  isApproved: boolean;
  isPrivate?: boolean; // If true: Private account (must accept follow before chatting and exchanging photos/posts)
  avatarR2Key?: string;
  avatarDominantColor?: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  spiritPoints: number;
  song?: SongTrack;
  referredBy?: string;
  referralCount?: number;
  createdAt: string;
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  previewUrl: string; // 30-second legal audio preview from Apple iTunes CDN
  durationSeconds?: number;
  startTime?: number; // Starting offset in seconds (e.g. 5, 10, 15s)
  clipDuration?: number; // Clip length in seconds (e.g. 15s or 30s)
}

export interface PostImageItem {
  id?: string;
  r2Key: string;
  width: number;
  height: number;
  dominantColor: string;
  fileSizeBytes?: number;
  signedUrl?: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  class: string;
  avatar: string | null;
  caption: string;
  images: string[];
  imageUrl?: string; // Real high-res photo URL for Instagram-style explore grid
  postImages?: PostImageItem[]; // Cloudflare R2 images metadata
  isReel?: boolean; // If true: displays video/reel play icon in top right corner
  stickerText?: string; // Bold graphic sticker hook on thumbnail (e.g. "WAIT FOR IT! 😱", "ROOM FOR MY STARTUP")
  stickerColor?: string; // Color badge for sticker overlay
  likes: number;
  comments: number;
  views?: number;
  song?: SongTrack;
  createdAt: string;
  timeAgo: string;
  habitCategory?: 'studies' | 'sports' | 'reading' | 'stem' | 'arts' | 'routine';
  habitTag?: string;
  habitPointsAwarded?: number;
  isRepost?: boolean;
  repostCount?: number;
  repostedFrom?: {
    postId: string;
    username: string;
    fullName: string;
    avatar?: string | null;
    caption?: string;
  };
}

export interface HabitStreak {
  id: string;
  username: string;
  fullName: string;
  class: string;
  streakDays: number;
  habitPoints: number;
  primaryHabit: 'Studies' | 'Sports' | 'Reading' | 'STEM' | 'Arts' | 'Routine';
  habitTag: string;
  lastPostedDate: string;
  postedToday: boolean;
  recentPostsCount: number;
  bestStreak: number;
  quote?: string;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  fullName?: string;
  avatar: string | null;
  mediaUrl?: string;
  mediaR2Key?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  mediaDominantColor?: string;
  /** Uploaded/linked photo URL (full-bleed image story) */
  imageUrl?: string;
  text?: string;
  background?: string;
  textColor?: string;
  /** Story template key — renders a pre-designed card */
  template?: 'birthday' | 'goodluck' | 'congrats' | 'topscorer' | null;
  /** Dynamic data injected into the template */
  templateData?: { name: string; extra?: string };
  song?: SongTrack;
  filter?: string;
  stickers?: Array<{
    type: 'countdown' | 'doubt' | 'streak' | 'location' | 'emoji';
    title: string;
    subtitle?: string;
    color?: string;
  }>;
  textStyle?: {
    color: string;
    bgStyle: 'none' | 'fill' | 'semi';
    font: 'classic' | 'bold' | 'neon' | 'typewriter';
  };
  createdAt: string;
  expiresAt: string;
  hasStory: boolean;
  isSeen?: boolean;
  isNew?: boolean;
  isOwn?: boolean;
  isRepost?: boolean;
  repostedFrom?: {
    postId: string;
    username: string;
    fullName: string;
    avatar?: string | null;
  };
  viewsCount?: number;
  viewers?: string[]; // Usernames who saw the story
  likesCount?: number;
  likers?: string[]; // Usernames who liked the story
}

export interface ChatNote {
  id: string;
  userId?: string;
  username: string;
  fullName: string;
  avatar: string | null;
  text: string;
  song?: SongTrack;
  colorTheme?: string;
  createdAt: string;
  expiresAt: string;
}

export interface UserStoryGroup {
  username: string;
  fullName: string;
  avatar: string | null;
  stories: Story[];
  hasUnseen: boolean;
  isOwn?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: 'Exam' | 'Holiday' | 'Sports' | 'Assembly' | 'Festival' | 'Academic';
  description: string;
  createdBy?: string;
  isImportant?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  body?: string;
  content?: string;
  category: 'exams' | 'holidays' | 'events' | 'sports' | 'fees' | 'urgent';
  date: string;
  isUrgent?: boolean;
  author?: string;
  pinned?: boolean;
  seenBy?: number;
  hasAttachment?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  class?: string;
  section?: string;
  category: 'class' | 'house' | 'club' | 'activity' | string;
  memberCount: number;
  isOfficial: boolean;
  members?: string[];
  color?: string;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  groupName: string;
  username: string;
  fullName: string;
  studentClass?: string;
  avatar?: string | null;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined';
  acceptedBy?: string;
}

export interface RosterEntry {
  id: string;
  name: string;
  class: string;
  section: string;
  admissionNumber: string;
  isClaimed: boolean;
  claimedBy?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'notice' | 'badge' | 'system';
  title: string;
  body: string;
  timeAgo: string;
  isRead: boolean;
  link?: string;
}

export interface UserWarning {
  id: string;
  username: string;
  reason: string;
  date: string;
  adminName: string;
  acknowledged: boolean;
}

export interface BroadcastAlert {
  id: string;
  title: string;
  text: string;
  active: boolean;
  isUrgent?: boolean;
  updatedAt?: string;
}

// Fixed Official Account Details
export const DPS_OFFICIAL_ACCOUNT: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'dpsbuzz_official',
  fullName: 'DPS Buzz Official 🐝',
  bio: 'The official pulse of Dilsukhnagar Public School. News, notices, events & campus highlights.',
  avatar: null,
  role: 'admin',
  isVerified: true,
  isApproved: true,
  followerCount: 0,
  followingCount: 0,
  postCount: 0,
  spiritPoints: 1000,
  createdAt: '2026-10-01T00:00:00.000Z',
};

// Fixed Admin Account Details
export const ADMIN_ACCOUNT: Profile = {
  id: 'admin-owner-id',
  username: 'admin',
  fullName: 'School Principal & Office',
  bio: 'Official Administrative Announcements • Dilsukhnagar Public School',
  avatar: null,
  role: 'admin',
  isVerified: true,
  isApproved: true,
  followerCount: 0,
  followingCount: 0,
  postCount: 0,
  spiritPoints: 0,
  createdAt: '2026-10-01T00:00:00.000Z',
};

// Super Admin Account for Shashwath
export const SHASHWATH_ADMIN_ACCOUNT: Profile = {
  id: 'admin-shashwath-id',
  username: 'shashwath71845',
  fullName: 'Shashwath (Admin)',
  bio: 'DPS Buzz Super Administrator 🛡️ • Full Systems & Moderation Access',
  avatar: null,
  role: 'admin',
  isVerified: true,
  isApproved: true,
  class: '8',
  section: 'G',
  followerCount: 0,
  followingCount: 0,
  postCount: 0,
  spiritPoints: 0,
  createdAt: '2026-10-01T00:00:00.000Z',
};

// Safe Guest Profile for unauthenticated sessions (NEVER leak admin or student accounts)
export const GUEST_USER: Profile = {
  id: 'guest',
  username: 'guest',
  fullName: 'Guest',
  bio: '',
  avatar: null,
  role: 'student',
  isVerified: false,
  isApproved: false,
  class: '',
  section: '',
  followerCount: 0,
  followingCount: 0,
  postCount: 0,
  spiritPoints: 0,
  createdAt: '2026-10-01T00:00:00.000Z',
};

// Purged fake groups list to automatically filter out legacy local storage items
export const FAKE_GROUP_IDS = new Set([
  'group-class-8a', 'group-class-9b', 'group-class-10c', 'group-class-8g',
  'group-class-7g', 'group-class-9g', 'group-class-10g', 'group-class-6f',
  'group-robotics', 'group-science-expo', 'group-sports', 'group-choir',
  'house-lions', 'house-tigers', 'house-eagles', 'house-cheetahs',
  'g-8g', 'g-8a', 'g-7g', 'g-9g', 'g-9a', 'g-10g', 'g-10a', 'g-6f',
]);

export const FAKE_NOTICE_IDS = new Set([
  'notice-1', 'notice-2', 'notice-3', 'notice-4',
]);

// Clean starter groups (starts empty - only real student/admin created groups exist)
const DEFAULT_HOUSE_GROUPS: Group[] = [];

const STORAGE_KEYS = {
  PROFILES: 'dpsbuzz_profiles_v2',
  POSTS: 'dpsbuzz_posts_v3',
  STORIES: 'dpsbuzz_stories_v3',
  ROSTER: 'dpsbuzz_roster_v2',
  GROUPS: 'dpsbuzz_groups_v2',
  NOTICES: 'dpsbuzz_notices_v2',
  NOTIFICATIONS: 'dpsbuzz_notifications_v2',
  FOLLOWS: 'dpsbuzz_follows_v2',
  FOLLOW_REQUESTS: 'dpsbuzz_follow_requests_v2',
  INVITE_CODE: 'dpsbuzz_invite_code_v2',
  CALENDAR: 'dpsbuzz_calendar_v1',
  BANNED_USERS: 'dpsbuzz_banned_users_v1',
  MUTED_USERS: 'dpsbuzz_muted_users_v1',
  WARNINGS: 'dpsbuzz_warnings_v1',
  BAN_REASONS: 'dpsbuzz_ban_reasons_v1',
  BROADCAST_ALERT: 'dpsbuzz_broadcast_alert_v1',
  READ_NOTICES: 'dpsbuzz_read_notices_v1',
  GROUP_JOIN_REQUESTS: 'dpsbuzz_group_join_requests_v1',
  GROUP_MEMBERS: 'dpsbuzz_group_members_v1',
  HABIT_STREAKS: 'dpsbuzz_habit_streaks_v1',
  STORAGE_SETTINGS: 'dpsbuzz_storage_settings_v1',
  CHAT_MESSAGES: 'dpsbuzz_chat_messages_v1',
  CHAT_NOTES: 'dpsbuzz_chat_notes_v2',
  MAINTENANCE_DATES: 'dpsbuzz_maintenance_dates_v1',
  MAINTENANCE_MODE: 'dpsbuzz_maintenance_mode_v1',
  SAVED_POSTS: 'dpsbuzz_saved_posts_v1',
};

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// Set of mock/test usernames to purge and exclude from all public feeds and screens
export const DUMMY_TEST_USERNAMES = new Set([
  'arjun_8a', 'rohan_8a', 'ananya_8a', 'aditya_8a', 'priya_8a', 'karthik_8a',
  'tanvi_8a', 'dev_6a', 'kavya_7b', 'sneha_10c', 'rahul_9b', 'tanvi_10a',
  'vikram_9a', 'siddharth_8g', 'meera_8g', 'aarav_8g', 'diya_8g', 'ishaan_8g',
  'riya_7g', 'varun_7g', 'priya_10a', 'arjun_9b', 'karthik_8b', 'aarav_8b',
  'kabir_9g', 'neha_9g', 'rohit_10g', 'vihaan_6f', 'tanya_6f',
  'demo-user-1', 'ravi', 'test_ravi', 'testravi', 'test_user', 'testuser',
  'dpsbuzz_official', 'dps_official', 'dpsbuzz',
  'admin', 'principal', 'school_principal', 'school principal & office', 'school principal',
]);

// Automatic Client-Side Storage Purge: automatically sanitizes browser and app localStorage on boot
if (typeof window !== 'undefined') {
  try {
    // 1. Purge legacy mock conversations
    const conv1 = localStorage.getItem('dpsbuzz_conversations_v1');
    if (conv1) {
      const parsed = JSON.parse(conv1);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (c: any) =>
            c &&
            c.username &&
            !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase()) &&
            !c.id?.includes('conv-rohan') &&
            !c.id?.includes('conv-priya') &&
            !c.id?.includes('conv-sneha') &&
            !c.id?.includes('conv-rahul') &&
            !c.id?.includes('conv-class-8a')
        );
        localStorage.setItem('dpsbuzz_conversations_v1', JSON.stringify(cleaned));
      }
    }

    const conv2 = localStorage.getItem('dpsbuzz_chat_conversations_v2');
    if (conv2) {
      const parsed = JSON.parse(conv2);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (c: any) =>
            c &&
            c.username &&
            !DUMMY_TEST_USERNAMES.has(c.username.toLowerCase()) &&
            !c.id?.includes('conv-rohan') &&
            !c.id?.includes('conv-priya') &&
            !c.id?.includes('conv-sneha') &&
            !c.id?.includes('conv-rahul') &&
            !c.id?.includes('conv-class-8a')
        );
        localStorage.setItem('dpsbuzz_chat_conversations_v2', JSON.stringify(cleaned));
      }
    }

    // 2. Purge mock posts
    const storedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (storedPosts) {
      const parsed = JSON.parse(storedPosts);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (p: any) =>
            p &&
            p.id !== 'post-welcome-music' &&
            p.id !== 'post-sync-test-1' &&
            !DUMMY_TEST_USERNAMES.has(p.username?.toLowerCase())
        );
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(cleaned));
      }
    }

    // 3. Purge mock notifications
    const storedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (storedNotifs) {
      const parsed = JSON.parse(storedNotifs);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (n: any) =>
            n &&
            n.id !== 'n1' &&
            n.id !== 'n2' &&
            n.id !== 'n3' &&
            !n.userId?.includes('priya') &&
            !n.userId?.includes('arjun')
        );
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleaned));
      }
    }

    // 4. Purge mock calendar events
    const storedCal = localStorage.getItem(STORAGE_KEYS.CALENDAR);
    if (storedCal) {
      const parsed = JSON.parse(storedCal);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((e: any) => e && !e.id?.startsWith('cal-'));
        localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(cleaned));
      }
    }

    // 5. Purge mock habit streaks
    const storedStreaks = localStorage.getItem(STORAGE_KEYS.HABIT_STREAKS);
    if (storedStreaks) {
      const parsed = JSON.parse(storedStreaks);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (s: any) =>
            s &&
            s.username &&
            !DUMMY_TEST_USERNAMES.has(s.username.toLowerCase()) &&
            s.username.toLowerCase() !== 'admin'
        );
        localStorage.setItem(STORAGE_KEYS.HABIT_STREAKS, JSON.stringify(cleaned));
      }
    }

    // 6. Purge mock profiles
    const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (storedProfiles) {
      const parsed = JSON.parse(storedProfiles);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (p: any) =>
            p &&
            p.username &&
            !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase()) &&
            p.username.toLowerCase() !== 'admin'
        );
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(cleaned));
      }
    }
  } catch {}
}

// Clean starter datasets (empty so no test users, posts, stories or streaks clutter real accounts)
export const STARTER_HABIT_STREAKS: HabitStreak[] = [];
export const STARTER_POSTS: Post[] = [];
export const STARTER_STUDENTS: Profile[] = [];
export const DEFAULT_FOLLOWS: Array<{ follower: string; following: string }> = [];
export const STARTER_STORIES: Story[] = [];

// Clean school notices (starts empty - only real admin circulars exist)
export const STARTER_NOTICES: Notice[] = [];

// Academic & School Calendar Events (Strictly real school calendar events created by admin)
export const STARTER_CALENDAR: CalendarEvent[] = [];

let lastServerSyncTime = 0;

export const DataStore = {
  // Cross-device synchronization between Web and Android App
  async syncWithServer(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.success) return false;

      let changed = false;

      // 1. Merge posts (exclude any permanently deleted posts)
      const deletedIds = new Set<string>();
      try {
        const localDeleted = JSON.parse(localStorage.getItem('dpsbuzz_deleted_post_ids_v1') || '[]');
        if (Array.isArray(localDeleted)) localDeleted.forEach((id: string) => deletedIds.add(id));
      } catch {}
      if (Array.isArray(data.deletedPostIds)) {
        data.deletedPostIds.forEach((id: string) => deletedIds.add(id));
        try {
          localStorage.setItem('dpsbuzz_deleted_post_ids_v1', JSON.stringify(Array.from(deletedIds)));
        } catch {}
      }

      if (Array.isArray(data.posts)) {
        const localPosts = getStorage<Post[]>(STORAGE_KEYS.POSTS, []);
        const postMap = new Map<string, Post>();
        for (const p of localPosts) {
          if (p && p.id && !DUMMY_TEST_USERNAMES.has(p.username?.toLowerCase()) && !deletedIds.has(p.id)) {
            postMap.set(p.id, p);
          } else if (p && p.id && deletedIds.has(p.id)) {
            changed = true;
          }
        }
        for (const p of data.posts) {
          if (p && p.id && !DUMMY_TEST_USERNAMES.has(p.username?.toLowerCase()) && !deletedIds.has(p.id)) {
            if (!postMap.has(p.id)) changed = true;
            postMap.set(p.id, p);
          }
        }
        const merged = Array.from(postMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setStorage(STORAGE_KEYS.POSTS, merged);
      }

      // 2. Merge stories
      if (Array.isArray(data.stories)) {
        const localStories = getStorage<Story[]>(STORAGE_KEYS.STORIES, []);
        const storyMap = new Map<string, Story>();
        for (const s of localStories) {
          if (s && s.id) storyMap.set(s.id, s);
        }
        for (const s of data.stories) {
          if (s && s.id) {
            if (!storyMap.has(s.id)) changed = true;
            storyMap.set(s.id, s);
          }
        }
        setStorage(STORAGE_KEYS.STORIES, Array.from(storyMap.values()));
      }

      // 3. Merge profiles
      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        const localProfiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
        const profileMap = new Map<string, Profile>();
        for (const p of localProfiles) {
          if (p && p.username && !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase())) {
            profileMap.set(p.username.toLowerCase(), p);
          }
        }
        for (const p of data.profiles) {
          const u = p.username?.toLowerCase();
          if (u && !DUMMY_TEST_USERNAMES.has(u)) {
            if (!profileMap.has(u)) changed = true;
            profileMap.set(u, p);
          }
        }
        setStorage(STORAGE_KEYS.PROFILES, Array.from(profileMap.values()));
      }

      // 4. Merge comments
      if (data.comments && typeof data.comments === 'object') {
        const localComments = getStorage<Record<string, any[]>>('dpsbuzz_comments_v1', {});
        const mergedComments = { ...localComments, ...data.comments };
        setStorage('dpsbuzz_comments_v1', mergedComments);
      }

      // 5. Merge chat notes
      if (Array.isArray(data.chatNotes)) {
        const localNotes = getStorage<ChatNote[]>(STORAGE_KEYS.CHAT_NOTES, []);
        const noteMap = new Map<string, ChatNote>();
        for (const n of localNotes) {
          if (n && n.username && !DUMMY_TEST_USERNAMES.has(n.username.toLowerCase())) {
            noteMap.set(n.username.toLowerCase(), n);
          }
        }
        for (const n of data.chatNotes) {
          if (n && n.username && !DUMMY_TEST_USERNAMES.has(n.username.toLowerCase())) {
            if (!noteMap.has(n.username.toLowerCase())) changed = true;
            noteMap.set(n.username.toLowerCase(), n);
          }
        }
        setStorage(STORAGE_KEYS.CHAT_NOTES, Array.from(noteMap.values()));
      }

      // 6. Merge chat messages
      if (data.chatMessages && typeof data.chatMessages === 'object') {
        const localMessages = getStorage<Record<string, any[]>>(STORAGE_KEYS.CHAT_MESSAGES, {});
        const mergedMessages = { ...localMessages };
        for (const [convId, list] of Object.entries(data.chatMessages)) {
          if (Array.isArray(list)) {
            const currentList = mergedMessages[convId] || [];
            const msgMap = new Map<string, any>();
            for (const m of currentList) {
              if (m && m.id) msgMap.set(m.id, m);
            }
            for (const m of list as any[]) {
              if (m && m.id) {
                if (!msgMap.has(m.id)) changed = true;
                msgMap.set(m.id, m);
              }
            }
            mergedMessages[convId] = Array.from(msgMap.values());
          }
        }
        setStorage(STORAGE_KEYS.CHAT_MESSAGES, mergedMessages);
      }

      if (changed) {
        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
      }
      return true;
    } catch (e) {
      console.warn('Sync error:', e);
      return false;
    }
  },

  // Profiles (Only real registered students and admins - with strictly accurate real follower counts)
  getProfiles(): Profile[] {
    const saved = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const cleanProfiles = saved
      .filter((p) => {
        if (!p || !p.username) return false;
        const clean = p.username.toLowerCase().trim();
        return !DUMMY_TEST_USERNAMES.has(clean);
      });

    // Always guarantee shashwath super admin account exists
    const hasShashwath = cleanProfiles.some((p) => p.username === 'shashwath71845');

    const result = [...cleanProfiles];
    if (!hasShashwath) result.unshift(SHASHWATH_ADMIN_ACCOUNT);

    // If there is an active logged-in user in localStorage, ensure they are in the profiles list
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dpsbuzz_user');
        if (stored) {
          const activeUser = JSON.parse(stored);
          if (activeUser && activeUser.username && !DUMMY_TEST_USERNAMES.has(activeUser.username.toLowerCase())) {
            if (!result.some((p) => p.username.toLowerCase() === activeUser.username.toLowerCase())) {
              result.push(activeUser);
            }
          }
        }
      } catch {}
    }

    // Dynamic real follower & posts calculation: 100% genuine stats, NO fake data
    const follows = getStorage<Array<{ follower: string; following: string }>>(STORAGE_KEYS.FOLLOWS, []);
    const validFollows = Array.isArray(follows)
      ? follows.filter((f) => {
          if (!f || !f.follower || !f.following) return false;
          const fol = f.follower.toLowerCase().trim();
          const fing = f.following.toLowerCase().trim();
          return fol !== fing && !DUMMY_TEST_USERNAMES.has(fol) && !DUMMY_TEST_USERNAMES.has(fing);
        })
      : [];

    const posts = getStorage<Post[]>(STORAGE_KEYS.POSTS, []);
    const validPosts = Array.isArray(posts)
      ? posts.filter((post) => post && post.username && !DUMMY_TEST_USERNAMES.has(post.username.toLowerCase()))
      : [];

    return result.map((p) => {
      const u = p.username.toLowerCase().trim();
      const realFollowers = validFollows.filter((f) => f.following.toLowerCase().trim() === u).length;
      const realFollowing = validFollows.filter((f) => f.follower.toLowerCase().trim() === u).length;
      const realPosts = validPosts.filter((post) => post.username.toLowerCase().trim() === u).length;
      return {
        ...p,
        followerCount: realFollowers,
        followingCount: realFollowing,
        postCount: realPosts,
      };
    });
  },

  // Total registered real students and users in the app
  getRegisteredUserCount(): number {
    return this.getProfiles().filter(
      (p) => p && p.username && !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase()) && p.username.toLowerCase() !== 'admin'
    ).length;
  },

  getCurrentUser(): Profile {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        try {
          let parsed = JSON.parse(stored);
          if (parsed && parsed.username && !DUMMY_TEST_USERNAMES.has(parsed.username.toLowerCase())) {
            // Protect Shashwath Admin account: require explicit login authentication flag
            if (parsed.username.toLowerCase() === 'shashwath71845') {
              const isAuth = localStorage.getItem('dpsbuzz_shashwath_authenticated');
              if (!isAuth) {
                // Clear leaked session from visitor device
                localStorage.removeItem('dpsbuzz_user');
                document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
                return GUEST_USER;
              }
              if (parsed.followerCount === 145 || parsed.spiritPoints === 999) {
                parsed = { ...parsed, followerCount: 0, followingCount: 0, postCount: 0, spiritPoints: 0 };
                localStorage.setItem('dpsbuzz_user', JSON.stringify(parsed));
              }
            }
            return parsed;
          }
        } catch {}
      }
    }
    return GUEST_USER;
  },

  getProfileByUsername(username: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.username.toLowerCase() === username.toLowerCase()) || null;
  },

  updateProfile(username: string, updates: Partial<Profile>): Profile | null {
    const clean = username.toLowerCase().trim();
    const profiles = this.getProfiles();
    let updatedProfile: Profile | null = null;
    const nextProfiles = profiles.map((p) => {
      if (p.username.toLowerCase() === clean) {
        updatedProfile = { ...p, ...updates };
        return updatedProfile;
      }
      return p;
    });

    if (updatedProfile) {
      setStorage(STORAGE_KEYS.PROFILES, nextProfiles);
      if (typeof window !== 'undefined') {
        try {
          const storedUser = localStorage.getItem('dpsbuzz_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.username.toLowerCase() === clean) {
              localStorage.setItem('dpsbuzz_user', JSON.stringify({ ...parsed, ...updates }));
            }
          }
        } catch {}
        window.dispatchEvent(
          new CustomEvent('dpsbuzz:content_updated', {
            detail: { type: 'profile_updated', username: clean, updates },
          })
        );
        fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: updatedProfile }),
        }).catch(() => {});
      }
    }
    return updatedProfile;
  },

  // Posts (Start completely empty)
  // Posts (Defaults to rich explore posts across grades 6-10)
  getPosts(includeBanned = false): Post[] {
    if (typeof window !== 'undefined' && Date.now() - lastServerSyncTime > 3000) {
      lastServerSyncTime = Date.now();
      DataStore.syncWithServer().catch(() => {});
    }

    const stored = getStorage<Post[]>(STORAGE_KEYS.POSTS, []);
    const banned = this.getBannedUsers();
    const filtered = stored.filter((p) => {
      if (!p || !p.username) return false;
      const clean = p.username.toLowerCase().trim();
      if (DUMMY_TEST_USERNAMES.has(clean)) return false;
      if (!includeBanned && banned.includes(clean)) return false;
      return true;
    });

    return filtered;
  },

  addPost(post: Omit<Post, 'id' | 'createdAt' | 'timeAgo' | 'likes' | 'comments'>): Post {
    const posts = this.getPosts(true);
    const firstImage = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : undefined);
    const newPost: Post = {
      ...post,
      id: 'post-' + Date.now(),
      createdAt: new Date().toISOString(),
      timeAgo: 'Just now',
      likes: 0,
      comments: 0,
      views: 0,
      imageUrl: firstImage,
      images: post.images && post.images.length > 0 ? post.images : (firstImage ? [firstImage] : []),
    };
    posts.unshift(newPost);
    setStorage(STORAGE_KEYS.POSTS, posts);

    // Update user post count
    const profiles = this.getProfiles().map((p) =>
      p.username === post.username ? { ...p, postCount: p.postCount + 1 } : p
    );
    setStorage(STORAGE_KEYS.PROFILES, profiles);

    // Record habit streak & evaluate good habits vs nonsense (Rule: only 1st post of the day earns points!)
    const habitResult = this.recordHabitPost(post.username, post.caption, post.habitCategory);
    newPost.habitPointsAwarded = habitResult.awarded ? habitResult.points : 0;
    newPost.habitCategory = (post as any).habitCategory || 'studies';
    newPost.habitTag = this.evaluateHabitPost(post.caption, post.habitCategory).habitTag;

    // Sync post to server so it is immediately visible to Android App & all devices
    if (typeof window !== 'undefined') {
      fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: newPost }),
      }).catch((e) => console.warn('Failed to sync post to server:', e));

      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'post', post: newPost, habitResult } }));
    }
    return newPost;
  },

  incrementPostViews(postId: string): number {
    const posts = this.getPosts(true);
    let newViews = 1;
    let found = false;
    const nextPosts = posts.map((p) => {
      if (p.id === postId) {
        found = true;
        newViews = (p.views || 0) + 1;
        return { ...p, views: newViews };
      }
      return p;
    });
    if (found) {
      setStorage(STORAGE_KEYS.POSTS, nextPosts);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dpsbuzz:content_updated', {
            detail: { type: 'post_views', postId, views: newViews },
          })
        );
      }
    }
    return newViews;
  },

  repostPost(postId: string, currentUsername: string): Post | null {
    const posts = this.getPosts(true);
    const originalPost = posts.find((p) => p.id === postId);
    if (!originalPost) return null;

    const user = this.getProfileByUsername(currentUsername) || this.getCurrentUser();
    const cleanUser = user?.username || currentUsername;
    const originalAuthor = originalPost.username;

    // Increment repostCount on original post
    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        return { ...p, repostCount: (p.repostCount || 0) + 1 };
      }
      return p;
    });

    const repostedPost: Post = {
      id: 'post-repost-' + Date.now(),
      userId: user?.id || 'user-' + cleanUser,
      username: cleanUser,
      fullName: user?.fullName || cleanUser,
      class: user?.class ? `Class ${user.class}-${user.section || 'A'}` : originalPost.class,
      avatar: user?.avatar || null,
      caption: originalPost.caption,
      images: originalPost.images || [],
      imageUrl: originalPost.imageUrl || (originalPost.images && originalPost.images.length > 0 ? originalPost.images[0] : undefined),
      postImages: originalPost.postImages,
      isReel: originalPost.isReel,
      stickerText: originalPost.stickerText,
      stickerColor: originalPost.stickerColor,
      song: originalPost.song,
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: new Date().toISOString(),
      timeAgo: 'Just now',
      isRepost: true,
      repostCount: 0,
      repostedFrom: {
        postId: originalPost.repostedFrom?.postId || originalPost.id,
        username: originalPost.repostedFrom?.username || originalPost.username,
        fullName: originalPost.repostedFrom?.fullName || originalPost.fullName,
        avatar: originalPost.repostedFrom?.avatar || originalPost.avatar,
        caption: originalPost.repostedFrom?.caption || originalPost.caption,
      },
    };

    updatedPosts.unshift(repostedPost);
    setStorage(STORAGE_KEYS.POSTS, updatedPosts);

    // Update reposting user's post count
    const profiles = this.getProfiles().map((p) =>
      p.username.toLowerCase() === cleanUser.toLowerCase()
        ? { ...p, postCount: (p.postCount || 0) + 1 }
        : p
    );
    setStorage(STORAGE_KEYS.PROFILES, profiles);

    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('dpsbuzz_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.username.toLowerCase() === cleanUser.toLowerCase()) {
            localStorage.setItem(
              'dpsbuzz_user',
              JSON.stringify({ ...parsed, postCount: (parsed.postCount || 0) + 1 })
            );
          }
        }
      } catch {}
    }

    // Notify original author
    if (originalAuthor.toLowerCase() !== cleanUser.toLowerCase()) {
      const notifs = this.getNotifications();
      notifs.unshift({
        id: 'notif-' + Date.now(),
        userId: originalPost.userId || originalAuthor,
        type: 'like',
        title: '🔄 Post Reposted',
        body: `@${cleanUser} reposted your post to their feed!`,
        timeAgo: 'Just now',
        isRead: false,
      });
      setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'repost_feed', post: repostedPost, originalPostId: postId },
        })
      );
    }

    return repostedPost;
  },

  repostToStory(postId: string, currentUsername: string): Story | null {
    const posts = this.getPosts(true);
    const originalPost = posts.find((p) => p.id === postId);
    if (!originalPost) return null;

    const user = this.getProfileByUsername(currentUsername) || this.getCurrentUser();
    const cleanUser = user?.username || currentUsername;
    const storyImage = originalPost.imageUrl || (originalPost.images && originalPost.images[0]) || '';

    const newStory: Story = {
      id: `story-repost-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.id || 'user-' + cleanUser,
      username: cleanUser,
      fullName: user?.fullName || cleanUser,
      avatar: user?.avatar || null,
      imageUrl: storyImage,
      text: originalPost.caption
        ? `Shared @${originalPost.username}'s post: "${originalPost.caption.slice(0, 70)}..."`
        : `Shared @${originalPost.username}'s post`,
      song: originalPost.song,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      hasStory: true,
      isSeen: false,
      isNew: true,
      isRepost: true,
      repostedFrom: {
        postId: originalPost.id,
        username: originalPost.username,
        fullName: originalPost.fullName,
        avatar: originalPost.avatar,
      },
    };

    const stories = this.getStories();
    stories.unshift(newStory);
    setStorage(STORAGE_KEYS.STORIES, stories);

    // Increment original post repost count
    const updatedPosts = posts.map((p) => {
      if (p.id === postId) {
        return { ...p, repostCount: (p.repostCount || 0) + 1 };
      }
      return p;
    });
    setStorage(STORAGE_KEYS.POSTS, updatedPosts);

    // Notify original author
    if (originalPost.username.toLowerCase() !== cleanUser.toLowerCase()) {
      const notifs = this.getNotifications();
      notifs.unshift({
        id: 'notif-' + Date.now(),
        userId: originalPost.userId || originalPost.username,
        type: 'like',
        title: '⚡ Post Shared to Story',
        body: `@${cleanUser} added your post to their 24h story!`,
        timeAgo: 'Just now',
        isRead: false,
      });
      setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'repost_story', story: newStory, originalPostId: postId },
        })
      );
    }

    return newStory;
  },

  getRepostsByUser(username: string): Post[] {
    const clean = username.toLowerCase().trim();
    return this.getPosts(true).filter(
      (p) => p.username.toLowerCase() === clean && Boolean(p.isRepost)
    );
  },

  // Unrepost (Undo Repost from feed)
  unrepostPost(postId: string, currentUsername: string): boolean {
    const posts = this.getPosts(true);
    const cleanUser = currentUsername.toLowerCase().trim();

    // Find the repost to remove (matches either the repost post ID or the original post ID)
    const repostPost = posts.find(
      (p) =>
        p.username.toLowerCase() === cleanUser &&
        Boolean(p.isRepost) &&
        (p.id === postId || p.repostedFrom?.postId === postId)
    );

    if (!repostPost) return false;

    const originalPostId = repostPost.repostedFrom?.postId;

    // Filter out the reposted post and decrement repostCount on the original
    const updatedPosts = posts
      .filter((p) => p.id !== repostPost.id)
      .map((p) => {
        if (originalPostId && p.id === originalPostId) {
          return { ...p, repostCount: Math.max(0, (p.repostCount || 1) - 1) };
        }
        return p;
      });

    setStorage(STORAGE_KEYS.POSTS, updatedPosts);

    // Decrement reposting user's post count
    const profiles = this.getProfiles().map((p) =>
      p.username.toLowerCase() === cleanUser
        ? { ...p, postCount: Math.max(0, (p.postCount || 1) - 1) }
        : p
    );
    setStorage(STORAGE_KEYS.PROFILES, profiles);

    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('dpsbuzz_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.username.toLowerCase() === cleanUser) {
            localStorage.setItem(
              'dpsbuzz_user',
              JSON.stringify({ ...parsed, postCount: Math.max(0, (parsed.postCount || 1) - 1) })
            );
          }
        }
      } catch {}

      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'unrepost_feed', repostId: repostPost.id, originalPostId },
        })
      );
    }

    return true;
  },

  hasUserReposted(postId: string, currentUsername: string): boolean {
    const cleanUser = currentUsername.toLowerCase().trim();
    return this.getPosts(true).some(
      (p) =>
        p.username.toLowerCase() === cleanUser &&
        Boolean(p.isRepost) &&
        (p.id === postId || p.repostedFrom?.postId === postId)
    );
  },

  // Stories
  getStories(includeBanned = false): Story[] {
    if (typeof window !== 'undefined' && Date.now() - lastServerSyncTime > 2500) {
      lastServerSyncTime = Date.now();
      DataStore.syncWithServer().catch(() => {});
    }

    const stored = getStorage<Story[]>(STORAGE_KEYS.STORIES, []);
    const banned = this.getBannedUsers();
    return stored.filter((s) => {
      if (!s || !s.username) return false;
      const clean = s.username.toLowerCase().trim();
      if (DUMMY_TEST_USERNAMES.has(clean)) return false;
      if (!includeBanned && banned.includes(clean)) return false;
      return true;
    });
  },

  addStory(newStory: Omit<Story, 'id' | 'createdAt' | 'expiresAt' | 'hasStory'>): Story {
    const stories = this.getStories();
    const created: Story = {
      ...newStory,
      id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      hasStory: true,
      isSeen: false,
      isNew: true,
    };
    stories.unshift(created);
    setStorage(STORAGE_KEYS.STORIES, stories);

    // Sync story to server so it is immediately visible to Android App & all devices
    if (typeof window !== 'undefined') {
      fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: created }),
      }).catch((e) => console.warn('Failed to sync story to server:', e));

      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'story', story: created } }));
    }
    return created;
  },

  markStorySeen(storyId: string, viewerUsername?: string): void {
    const stories = this.getStories();
    const cur = (viewerUsername || this.getCurrentUser()?.username || '').toLowerCase().trim();
    const updated = stories.map((s) => {
      if (s.id === storyId) {
        const viewers = Array.isArray(s.viewers) ? [...s.viewers] : [];
        if (cur && !viewers.includes(cur)) {
          viewers.push(cur);
        }
        const viewsCount = Math.max(viewers.length, s.viewsCount || 0);
        return {
          ...s,
          isSeen: true,
          isNew: false,
          viewers,
          viewsCount,
        };
      }
      return s;
    });
    setStorage(STORAGE_KEYS.STORIES, updated);

    if (typeof window !== 'undefined') {
      const target = updated.find((s) => s.id === storyId);
      if (target) {
        fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: target }),
        }).catch((e) => console.warn('Failed to sync story view:', e));
      }
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'story_seen', storyId } })
      );
    }
  },

  toggleLikeStory(storyId: string, likerUsername?: string): { liked: boolean; likesCount: number } {
    const stories = this.getStories();
    const cur = (likerUsername || this.getCurrentUser()?.username || '').toLowerCase().trim();
    let isLikedNow = false;
    let newCount = 0;

    const updated = stories.map((s) => {
      if (s.id === storyId) {
        const likers = Array.isArray(s.likers) ? [...s.likers] : [];
        const idx = likers.indexOf(cur);
        if (idx >= 0) {
          likers.splice(idx, 1);
          isLikedNow = false;
        } else {
          likers.push(cur);
          isLikedNow = true;
        }
        newCount = likers.length;
        return {
          ...s,
          likers,
          likesCount: newCount,
        };
      }
      return s;
    });

    setStorage(STORAGE_KEYS.STORIES, updated);

    if (isLikedNow) {
      const targetStory = stories.find((s) => s.id === storyId);
      if (targetStory && targetStory.username.toLowerCase() !== cur) {
        const notifs = this.getNotifications();
        notifs.unshift({
          id: `notif-slike-${Date.now()}`,
          userId: cur,
          type: 'like',
          title: `@${cur} liked your story ❤️`,
          body: targetStory.text ? `"${targetStory.text.slice(0, 40)}"` : 'Photo story',
          timeAgo: 'Just now',
          isRead: false,
        });
        setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
      }
    }

    if (typeof window !== 'undefined') {
      const target = updated.find((s) => s.id === storyId);
      if (target) {
        fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: target }),
        }).catch((e) => console.warn('Failed to sync story like:', e));
      }
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'story_liked', storyId, liked: isLikedNow },
        })
      );
    }

    return { liked: isLikedNow, likesCount: newCount };
  },

  // Group stories by user profile (Instagram Architecture)
  getUserStoryGroups(currentUsername?: string): {
    myGroup: UserStoryGroup | null;
    peerGroups: UserStoryGroup[];
    allGroups: UserStoryGroup[];
  } {
    const stories = this.getStories();
    const map = new Map<string, Story[]>();

    for (const story of stories) {
      const u = story.username;
      if (!map.has(u)) {
        map.set(u, []);
      }
      map.get(u)!.push(story);
    }

    const cleanMe = (currentUsername || '').toLowerCase();
    let myGroup: UserStoryGroup | null = null;
    const peerGroups: UserStoryGroup[] = [];

    map.forEach((userStories, username) => {
      // Sort stories for this user chronologically (oldest first)
      userStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const first = userStories[0];
      const hasUnseen = userStories.some((s) => !s.isSeen);
      const isOwn = username.toLowerCase() === cleanMe;

      const group: UserStoryGroup = {
        username,
        fullName: first.fullName || username,
        avatar: first.avatar,
        stories: userStories,
        hasUnseen,
        isOwn,
      };

      if (isOwn) {
        myGroup = group;
      } else {
        peerGroups.push(group);
      }
    });

    const allGroups = myGroup ? [myGroup, ...peerGroups] : peerGroups;
    return { myGroup, peerGroups, allGroups };
  },

  // 24-Hour Chat & Profile Thought Notes with Music Stickers
  getChatNotes(): ChatNote[] {
    const stored = getStorage<ChatNote[]>(STORAGE_KEYS.CHAT_NOTES, []);
    const now = new Date().toISOString();
    return stored.filter(
      (n) => n && n.expiresAt > now && !DUMMY_TEST_USERNAMES.has(n.username.toLowerCase())
    );
  },

  saveChatNote(data: { text: string; song?: SongTrack; colorTheme?: string }): ChatNote {
    const user = this.getCurrentUser();
    const notes = this.getChatNotes().filter((n) => n.username.toLowerCase() !== user.username.toLowerCase());
    const newNote: ChatNote = {
      id: 'note-' + Date.now(),
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      text: data.text.trim(),
      song: data.song,
      colorTheme: data.colorTheme || 'sunset',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
    notes.unshift(newNote);
    setStorage(STORAGE_KEYS.CHAT_NOTES, notes);
    if (typeof window !== 'undefined') {
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
    }
    return newNote;
  },

  deleteChatNote(username: string): void {
    const clean = username.toLowerCase().trim();
    const notes = this.getChatNotes().filter((n) => n.username.toLowerCase() !== clean);
    setStorage(STORAGE_KEYS.CHAT_NOTES, notes);
    if (typeof window !== 'undefined') {
      fetch(`/api/notes?username=${encodeURIComponent(clean)}`, {
        method: 'DELETE',
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
    }
  },

  // Notices (Strictly real school notices, starts empty)
  getNotices(): Notice[] {
    const stored = getStorage<Notice[]>(STORAGE_KEYS.NOTICES, []);
    return stored.filter((n) => n && n.id && !FAKE_NOTICE_IDS.has(n.id));
  },

  addNotice(newNotice: Omit<Notice, 'id'>): Notice {
    const list = this.getNotices();
    const created: Notice = {
      ...newNotice,
      id: `notice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    list.unshift(created);
    setStorage(STORAGE_KEYS.NOTICES, list);

    // If marked as Urgent: dispatch instant alert messages and high-priority notifications to ALL students
    if (created.isUrgent) {
      const allProfiles = this.getProfiles();
      const notifications = this.getNotifications();
      const noticeBody = created.content ? created.content.slice(0, 160) : created.title;
      const fullNoticeContent = created.content || created.title;

      for (const p of allProfiles) {
        notifications.unshift({
          id: `notif-urgent-notice-${Date.now()}-${p.username}`,
          userId: p.username,
          type: 'notice',
          title: `🚨 NOTICE URGENT: ${created.title}`,
          body: noticeBody,
          timeAgo: 'Just now',
          isRead: false,
          link: `/notices/${created.id}`,
        });
      }
      setStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

      // Pin an urgent top banner across home screen for all students
      this.setBroadcastAlert({
        title: `🚨 NOTICE URGENT: ${created.title}`,
        text: fullNoticeContent,
        isUrgent: true,
      });

      // Post urgent alert message into class chats
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('dpsbuzz_chat_messages_v1');
          const chatMap: Record<string, any[]> = stored ? JSON.parse(stored) : {};
          const urgentMsg = {
            id: `msg-urgent-notice-${Date.now()}`,
            text: `🚨 [NOTICE URGENT]: ${created.title}\n\n${fullNoticeContent}`,
            sender: 'them' as const,
            time: 'Just now',
          };
          for (const convId of Object.keys(chatMap)) {
            if (Array.isArray(chatMap[convId])) {
              chatMap[convId].push(urgentMsg);
            }
          }
          if (!chatMap['conv-class-8a']) chatMap['conv-class-8a'] = [];
          chatMap['conv-class-8a'].push(urgentMsg);
          localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(chatMap));
        } catch {}
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'notice', notice: created } }));
    }
    return created;
  },

  deleteNotice(id: string): void {
    const list = this.getNotices();
    const filtered = list.filter((n) => n.id !== id);
    setStorage(STORAGE_KEYS.NOTICES, filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'notice', deletedId: id } }));
    }
  },

  getReadNoticeIds(): string[] {
    return getStorage<string[]>(STORAGE_KEYS.READ_NOTICES, []);
  },

  markNoticeAsRead(noticeId: string): void {
    const list = this.getReadNoticeIds();
    if (!list.includes(noticeId)) {
      list.push(noticeId);
      setStorage(STORAGE_KEYS.READ_NOTICES, list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dpsbuzz:content_updated', {
            detail: { type: 'notice_read', noticeId },
          })
        );
      }
    }
  },

  isNoticeRead(noticeId: string): boolean {
    const list = this.getReadNoticeIds();
    return list.includes(noticeId);
  },

  markAllNoticesAsRead(): void {
    const notices = this.getNotices();
    const ids = notices.map((n) => n.id);
    setStorage(STORAGE_KEYS.READ_NOTICES, ids);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'notices_all_read', ids },
        })
      );
    }
  },

  // Academic & School Calendar
  getCalendarEvents(): CalendarEvent[] {
    return getStorage<CalendarEvent[]>(STORAGE_KEYS.CALENDAR, STARTER_CALENDAR);
  },

  addCalendarEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const list = this.getCalendarEvents();
    const created: CalendarEvent = {
      ...event,
      id: `cal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    list.push(created);
    // Sort chronologically
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setStorage(STORAGE_KEYS.CALENDAR, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'calendar', event: created } }));
    }
    return created;
  },

  deleteCalendarEvent(id: string): void {
    const list = this.getCalendarEvents();
    const filtered = list.filter((e) => e.id !== id);
    setStorage(STORAGE_KEYS.CALENDAR, filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'calendar', deletedId: id } }));
    }
  },

  // Student Ban Controls & Reasons
  getBannedUsers(): string[] {
    return getStorage<string[]>(STORAGE_KEYS.BANNED_USERS, []);
  },

  getBanReasons(): Record<string, string> {
    return getStorage<Record<string, string>>(STORAGE_KEYS.BAN_REASONS, {});
  },

  getBanReason(username: string): string {
    const reasons = this.getBanReasons();
    return reasons[username.toLowerCase().trim()] || 'Severe misconduct or community standard violation.';
  },

  isUserBanned(username: string): boolean {
    const list = this.getBannedUsers();
    return list.some((u) => u.toLowerCase() === username.toLowerCase().trim());
  },

  banUser(username: string, reason = 'Account suspended by school administration.'): void {
    const list = this.getBannedUsers();
    const clean = username.toLowerCase().trim();
    if (!list.includes(clean)) {
      list.push(clean);
      setStorage(STORAGE_KEYS.BANNED_USERS, list);
    }
    const reasons = this.getBanReasons();
    reasons[clean] = reason;
    setStorage(STORAGE_KEYS.BAN_REASONS, reasons);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'ban', username: clean, isBanned: true, reason },
        })
      );
    }
  },

  unbanUser(username: string): void {
    let list = this.getBannedUsers();
    const clean = username.toLowerCase().trim();
    list = list.filter((u) => u !== clean);
    setStorage(STORAGE_KEYS.BANNED_USERS, list);

    const reasons = this.getBanReasons();
    delete reasons[clean];
    setStorage(STORAGE_KEYS.BAN_REASONS, reasons);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'ban', username: clean, isBanned: false },
        })
      );
    }
  },

  toggleBanUser(username: string, reason?: string): boolean {
    const clean = username.toLowerCase().trim();
    if (this.isUserBanned(clean)) {
      this.unbanUser(clean);
      return false;
    } else {
      this.banUser(clean, reason || 'Account suspended by school administration.');
      return true;
    }
  },

  // Student Warnings System
  getWarnings(): UserWarning[] {
    return getStorage<UserWarning[]>(STORAGE_KEYS.WARNINGS, []);
  },

  getUserWarnings(username: string): UserWarning[] {
    const list = this.getWarnings();
    const clean = username.toLowerCase().trim();
    return list.filter((w) => w.username.toLowerCase().trim() === clean);
  },

  getUnacknowledgedWarning(username: string): UserWarning | null {
    const list = this.getUserWarnings(username);
    return list.find((w) => !w.acknowledged) || null;
  },

  warnUser(username: string, reason: string, adminName = 'DPS Administration'): UserWarning {
    const list = this.getWarnings();
    const clean = username.toLowerCase().trim();
    const warning: UserWarning = {
      id: `warn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: clean,
      reason: reason.trim(),
      date: 'Just now',
      adminName,
      acknowledged: false,
    };
    list.unshift(warning);
    setStorage(STORAGE_KEYS.WARNINGS, list);

    // 1. Send system notification to user
    const notifications = this.getNotifications();
    notifications.unshift({
      id: `notif-warn-${Date.now()}`,
      userId: clean,
      type: 'system',
      title: '⚠️ Official Warning from Administration',
      body: `Reason: "${reason.trim()}". Please follow DPS Buzz community standards. Repeated violations lead to account suspension.`,
      timeAgo: 'Just now',
      isRead: false,
    });
    setStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

    // 2. Add system message in chat conversation
    if (typeof window !== 'undefined') {
      try {
        const storedMap = JSON.parse(localStorage.getItem('dpsbuzz_chat_messages_v1') || '{}');
        const convId = `conv-${clean}`;
        const existing = storedMap[convId] || [];
        existing.push({
          id: `msg-warn-${Date.now()}`,
          text: `⚠️ [ADMINISTRATIVE WARNING]: You have received an official disciplinary warning: "${reason.trim()}". Please adhere to school community rules.`,
          sender: 'them',
          time: 'Just now',
        });
        storedMap[convId] = existing;
        localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(storedMap));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'user_warned', username: clean, warning },
        })
      );
    }
    return warning;
  },

  acknowledgeWarning(warningId: string): void {
    const list = this.getWarnings().map((w) =>
      w.id === warningId ? { ...w, acknowledged: true } : w
    );
    setStorage(STORAGE_KEYS.WARNINGS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'warning_acknowledged', warningId },
        })
      );
    }
  },

  // Broadcast Announcement Banner (visible to all users across app)
  getBroadcastAlert(): BroadcastAlert | null {
    return getStorage<BroadcastAlert | null>(STORAGE_KEYS.BROADCAST_ALERT, null);
  },

  setBroadcastAlert(alert: { title: string; text: string; isUrgent?: boolean } | null): void {
    if (!alert) {
      setStorage(STORAGE_KEYS.BROADCAST_ALERT, null);
    } else {
      const data: BroadcastAlert = {
        id: `alert-${Date.now()}`,
        title: alert.title,
        text: alert.text,
        active: true,
        isUrgent: alert.isUrgent ?? true,
        updatedAt: new Date().toISOString(),
      };
      setStorage(STORAGE_KEYS.BROADCAST_ALERT, data);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'broadcast_alert' } })
      );
    }
  },

  deleteUser(username: string): void {
    const clean = username.toLowerCase().trim();
    const profiles = this.getProfiles().filter((p) => p.username.toLowerCase() !== clean);
    setStorage(STORAGE_KEYS.PROFILES, profiles);
    const posts = this.getPosts().filter((p) => p.username.toLowerCase() !== clean);
    setStorage(STORAGE_KEYS.POSTS, posts);
    const stories = this.getStories().filter((s) => s.username.toLowerCase() !== clean);
    setStorage(STORAGE_KEYS.STORIES, stories);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'user_deleted', username: clean } })
      );
    }
  },

  // Chat Mute Controls
  getMutedUsers(): string[] {
    return getStorage<string[]>(STORAGE_KEYS.MUTED_USERS, []);
  },

  isUserMutedInChat(username: string): boolean {
    const list = this.getMutedUsers();
    return list.some((u) => u.toLowerCase() === username.toLowerCase().trim());
  },

  toggleMuteUserInChat(username: string): boolean {
    let list = this.getMutedUsers();
    const clean = username.toLowerCase().trim();
    let isMuted = false;
    if (list.includes(clean)) {
      list = list.filter((u) => u !== clean);
      isMuted = false;
    } else {
      list.push(clean);
      isMuted = true;
    }
    setStorage(STORAGE_KEYS.MUTED_USERS, list);
    return isMuted;
  },

  // Post Deletion (by author or admin)
  deletePost(postId: string, currentUsername?: string): boolean {
    const posts = this.getPosts(true);
    const postToDelete = posts.find((p) => p.id === postId);
    if (!postToDelete) return false;

    const cur = (currentUsername || this.getCurrentUser().username).toLowerCase().trim();
    const isAuthor = postToDelete.username.toLowerCase().trim() === cur;
    const isAdmin = cur === 'shashwath71845' || this.getCurrentUser().role === 'admin';

    if (!isAuthor && !isAdmin) {
      console.warn('Unauthorized attempt to delete post:', postId);
      return false;
    }

    // Filter out this post
    const updatedPosts = posts.filter((p) => p.id !== postId);

    // If the post being deleted was a repost of another post, decrement repostCount on original post
    if (postToDelete.isRepost && postToDelete.repostedFrom?.postId) {
      const origId = postToDelete.repostedFrom.postId;
      const idx = updatedPosts.findIndex((p) => p.id === origId);
      if (idx !== -1) {
        updatedPosts[idx] = {
          ...updatedPosts[idx],
          repostCount: Math.max(0, (updatedPosts[idx].repostCount || 1) - 1),
        };
      }
    }

    setStorage(STORAGE_KEYS.POSTS, updatedPosts);

    // Decrement author's postCount
    const authorUsername = postToDelete.username.toLowerCase().trim();
    const profiles = this.getProfiles().map((p) =>
      p.username.toLowerCase().trim() === authorUsername
        ? { ...p, postCount: Math.max(0, (p.postCount || 1) - 1) }
        : p
    );
    setStorage(STORAGE_KEYS.PROFILES, profiles);

    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('dpsbuzz_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.username.toLowerCase().trim() === authorUsername) {
            localStorage.setItem(
              'dpsbuzz_user',
              JSON.stringify({ ...parsed, postCount: Math.max(0, (parsed.postCount || 1) - 1) })
            );
          }
        }
      } catch {}

      // Clean up saved posts mapping if this post was saved
      try {
        const savedMap = getStorage<Record<string, string[]>>(STORAGE_KEYS.SAVED_POSTS, {});
        let changed = false;
        Object.keys(savedMap).forEach((u) => {
          if (savedMap[u].includes(postId)) {
            savedMap[u] = savedMap[u].filter((id) => id !== postId);
            changed = true;
          }
        });
        if (changed) setStorage(STORAGE_KEYS.SAVED_POSTS, savedMap);
      } catch {}

      // Add to permanent local deleted blacklist
      try {
        const deletedIds = JSON.parse(localStorage.getItem('dpsbuzz_deleted_post_ids_v1') || '[]');
        if (Array.isArray(deletedIds) && !deletedIds.includes(postId)) {
          deletedIds.push(postId);
          localStorage.setItem('dpsbuzz_deleted_post_ids_v1', JSON.stringify(deletedIds));
        }
      } catch {}

      // Permanently delete on the server
      fetch('/api/posts?id=' + encodeURIComponent(postId), {
        method: 'DELETE',
      }).catch((e) => console.warn('Failed to delete post on server:', e));

      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'post_deleted', postId } })
      );
    }

    return true;
  },

  // Saved Posts (Bookmarks)
  getSavedPostIds(username?: string): string[] {
    const cur = (username || this.getCurrentUser().username).toLowerCase().trim();
    const map = getStorage<Record<string, string[]>>(STORAGE_KEYS.SAVED_POSTS, {});
    return map[cur] || [];
  },

  isPostSaved(postId: string, username?: string): boolean {
    const saved = this.getSavedPostIds(username);
    return saved.includes(postId);
  },

  toggleSavePost(postId: string, username?: string): boolean {
    const cur = (username || this.getCurrentUser().username).toLowerCase().trim();
    const map = getStorage<Record<string, string[]>>(STORAGE_KEYS.SAVED_POSTS, {});
    const userSaved = map[cur] || [];
    const isSaved = userSaved.includes(postId);
    const updated = isSaved ? userSaved.filter((id) => id !== postId) : [...userSaved, postId];
    map[cur] = updated;
    setStorage(STORAGE_KEYS.SAVED_POSTS, map);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: isSaved ? 'post_unsaved' : 'post_saved', postId, isSaved: !isSaved },
        })
      );
    }
    return !isSaved; // returns true if now saved, false if unsaved
  },

  unsavePost(postId: string, username?: string): boolean {
    const cur = (username || this.getCurrentUser().username).toLowerCase().trim();
    const map = getStorage<Record<string, string[]>>(STORAGE_KEYS.SAVED_POSTS, {});
    const userSaved = map[cur] || [];
    if (userSaved.includes(postId)) {
      map[cur] = userSaved.filter((id) => id !== postId);
      setStorage(STORAGE_KEYS.SAVED_POSTS, map);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dpsbuzz:content_updated', {
            detail: { type: 'post_unsaved', postId, isSaved: false },
          })
        );
      }
      return true;
    }
    return false;
  },

  getSavedPosts(username?: string): Post[] {
    const savedIds = new Set(this.getSavedPostIds(username));
    return this.getPosts().filter((p) => savedIds.has(p.id));
  },

  deleteStory(storyId: string): void {
    const stories = this.getStories().filter((s) => s.id !== storyId);
    setStorage(STORAGE_KEYS.STORIES, stories);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'story_deleted', storyId } }));
    }
  },

  deleteChatMessage(convId: string, msgId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const messagesMap = JSON.parse(localStorage.getItem('dpsbuzz_chat_messages_v1') || '{}');
      if (messagesMap[convId]) {
        messagesMap[convId] = messagesMap[convId].filter((m: any) => m.id !== msgId);
        localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(messagesMap));
      }
    } catch {}
  },

  // Notifications (Start completely empty)
  getNotifications(): NotificationItem[] {
    return getStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  // Groups (Strictly real student and school groups created in the app)
  getGroups(): Group[] {
    const list = getStorage<Group[]>(STORAGE_KEYS.GROUPS, []);
    return list.filter((g) => g && g.id && !FAKE_GROUP_IDS.has(g.id));
  },

  createGroup(data: {
    name: string;
    description?: string;
    category?: string;
    class?: string;
    section?: string;
    members?: string[];
  }): Group {
    const list = this.getGroups();
    const currentUser = this.getCurrentUser();
    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      description: data.description?.trim() || `Student study group created by @${currentUser.username}`,
      category: data.category || 'club',
      class: data.class,
      section: data.section,
      memberCount: (data.members?.length || 0) + 1,
      members: data.members || [],
      isOfficial: false,
    };
    list.unshift(newGroup);
    setStorage(STORAGE_KEYS.GROUPS, list);

    // Also register group members
    const membersMap = getStorage<Record<string, string[]>>(STORAGE_KEYS.GROUP_MEMBERS, {});
    membersMap[newGroup.id] = [currentUser.username, ...(data.members || [])];
    setStorage(STORAGE_KEYS.GROUP_MEMBERS, membersMap);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'group_created', group: newGroup },
        })
      );
    }
    return newGroup;
  },

  // Group Memberships & Team Join Requests ("if anyone want to join it should accepted by the members of the team")
  getGroupMembers(groupId: string): string[] {
    const defaultMembersMap: Record<string, string[]> = {};
    const stored = getStorage<Record<string, string[]>>(STORAGE_KEYS.GROUP_MEMBERS, defaultMembersMap);
    return stored[groupId] || defaultMembersMap[groupId] || [];
  },

  isGroupMember(groupId: string, username: string): boolean {
    const members = this.getGroupMembers(groupId);
    return members.some((m) => m.toLowerCase() === username.toLowerCase().trim());
  },

  getGroupJoinRequests(groupId?: string): GroupJoinRequest[] {
    const list = getStorage<GroupJoinRequest[]>(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);
    const valid = list.filter(
      (r) =>
        r &&
        r.status === 'pending' &&
        !FAKE_GROUP_IDS.has(r.groupId) &&
        !DUMMY_TEST_USERNAMES.has(r.username.toLowerCase())
    );
    if (!groupId) return valid;
    return valid.filter((r) => r.groupId === groupId);
  },

  hasRequestedToJoinGroup(groupId: string, username: string): boolean {
    const list = getStorage<GroupJoinRequest[]>(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);
    return list.some(
      (r) =>
        r.groupId === groupId &&
        r.username.toLowerCase() === username.toLowerCase().trim() &&
        r.status === 'pending'
    );
  },

  requestToJoinGroup(groupId: string, username: string): GroupJoinRequest {
    const cleanUser = username.toLowerCase().trim();
    const profile = this.getProfileByUsername(cleanUser) || this.getCurrentUser();
    const group = this.getGroups().find((g) => g.id === groupId);
    const groupName = group ? group.name : 'Team';

    const list = getStorage<GroupJoinRequest[]>(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);
    const existing = list.find((r) => r.groupId === groupId && r.username.toLowerCase() === cleanUser && r.status === 'pending');
    if (existing) return existing;

    const newReq: GroupJoinRequest = {
      id: `greq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      groupId,
      groupName,
      username: cleanUser,
      fullName: profile.fullName,
      studentClass: profile.class ? `Class ${profile.class}-${profile.section || ''}` : 'Student',
      avatar: profile.avatar,
      requestedAt: 'Just now',
      status: 'pending',
    };
    list.unshift(newReq);
    setStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, list);

    const notifs = this.getNotifications();
    notifs.unshift({
      id: `notif-greq-${Date.now()}`,
      userId: cleanUser,
      type: 'system',
      title: `${profile.fullName} requested to join ${groupName}`,
      body: `Pending approval for team ${groupName}`,
      timeAgo: 'Just now',
      isRead: false,
    });
    setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'group_join_requested', request: newReq },
        })
      );
    }
    return newReq;
  },

  acceptGroupJoinRequest(requestId: string, acceptedByUsername: string): { success: boolean; request?: GroupJoinRequest } {
    const list = getStorage<GroupJoinRequest[]>(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);
    const req = list.find((r) => r.id === requestId);
    if (!req) return { success: false };

    req.status = 'accepted';
    req.acceptedBy = acceptedByUsername;
    setStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, list);

    // Add to members map
    const defaultMembersMap: Record<string, string[]> = {};
    const storedMembers = getStorage<Record<string, string[]>>(STORAGE_KEYS.GROUP_MEMBERS, defaultMembersMap);
    const currentMembers = storedMembers[req.groupId] || [];
    if (!currentMembers.includes(req.username.toLowerCase())) {
      currentMembers.push(req.username.toLowerCase());
      storedMembers[req.groupId] = currentMembers;
      setStorage(STORAGE_KEYS.GROUP_MEMBERS, storedMembers);
    }

    // Increment memberCount on group
    const groups = this.getGroups().map((g) =>
      g.id === req.groupId ? { ...g, memberCount: g.memberCount + 1 } : g
    );
    setStorage(STORAGE_KEYS.GROUPS, groups);

    // Send notification to accepted user
    const notifications = this.getNotifications();
    notifications.unshift({
      id: `notif-gaccept-${Date.now()}`,
      userId: req.username,
      type: 'system',
      title: '🎉 Joined Team Successfully!',
      body: `Your request to join ${req.groupName} was accepted by team member @${acceptedByUsername}!`,
      timeAgo: 'Just now',
      isRead: false,
    });
    setStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'group_join_accepted', request: req },
        })
      );
    }
    return { success: true, request: req };
  },

  declineGroupJoinRequest(requestId: string): { success: boolean } {
    const list = getStorage<GroupJoinRequest[]>(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);
    const req = list.find((r) => r.id === requestId);
    if (!req) return { success: false };

    req.status = 'declined';
    setStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, list);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'group_join_declined', requestId },
        })
      );
    }
    return { success: true };
  },

  // Student Roster (Starts completely empty)
  getRoster(): RosterEntry[] {
    return getStorage<RosterEntry[]>(STORAGE_KEYS.ROSTER, []);
  },

  // Invite Code / School Code
  getInviteCode(): string {
    const code = getStorage<string>(STORAGE_KEYS.INVITE_CODE, 'DPS71845');
    if (!code || code === 'DPSBUZZ2026') {
      setStorage(STORAGE_KEYS.INVITE_CODE, 'DPS71845');
      return 'DPS71845';
    }
    return code;
  },

  setInviteCode(code: string): void {
    setStorage(STORAGE_KEYS.INVITE_CODE, code.toUpperCase().trim());
  },

  // CSV Roster Upload with Auto-Class Group Generation (Requirement #5)
  uploadRosterCSV(csvText: string): { success: boolean; count: number; groupsCreated: number } {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { success: false, count: 0, groupsCreated: 0 };

    // Detect header
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('name') || firstLine.includes('admission') || firstLine.includes('class')) {
      startIndex = 1;
    }

    const currentRoster = this.getRoster();
    const currentGroups = this.getGroups();
    const newGroupsMap = new Map<string, Group>();
    let addedCount = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        // Expected format: Name, Class, Section, AdmissionNumber
        const [name, className, section, admissionNumber] = parts;
        if (admissionNumber && name) {
          // Check if admission number exists
          const existing = currentRoster.find(
            (r) => r.admissionNumber.toUpperCase() === admissionNumber.toUpperCase()
          );
          if (!existing) {
            currentRoster.push({
              id: 'roster-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
              name,
              class: className,
              section: section.toUpperCase(),
              admissionNumber: admissionNumber.toUpperCase(),
              isClaimed: false,
            });
            addedCount++;

            // Auto-create class group (e.g. "Class 8-A")
            const groupName = `Class ${className}-${section.toUpperCase()}`;
            const groupExists = currentGroups.some((g) => g.name === groupName) || newGroupsMap.has(groupName);
            if (!groupExists) {
              newGroupsMap.set(groupName, {
                id: 'group-' + className + '-' + section.toLowerCase(),
                name: groupName,
                description: `Official class group for Class ${className}-${section.toUpperCase()} • Dilsukhnagar Public School`,
                class: className,
                section: section.toUpperCase(),
                category: 'class',
                memberCount: 0,
                isOfficial: true,
              });
            }
          }
        }
      }
    }

    const updatedGroups = [...currentGroups, ...Array.from(newGroupsMap.values())];
    setStorage(STORAGE_KEYS.ROSTER, currentRoster);
    setStorage(STORAGE_KEYS.GROUPS, updatedGroups);

    return {
      success: true,
      count: addedCount,
      groupsCreated: newGroupsMap.size,
    };
  },

  // Student Sign-Up with Public/Private setting and 0 following
  registerStudent(params: {
    admissionNumber?: string;
    fullName: string;
    inviteCode?: string;
    username: string;
    className?: string;
    section?: string;
    isPrivate?: boolean;
    song?: SongTrack;
    referredBy?: string;
  }): { success: boolean; profile?: Profile; error?: string } {
    const roster = this.getRoster();
    const cleanAdm = (params.admissionNumber || '').toUpperCase().trim();
    const rosterMatch = cleanAdm ? roster.find((r) => r.admissionNumber === cleanAdm) : null;

    let isVerified = true;
    let className = params.className || '8';
    let section = params.section || 'A';

    if (rosterMatch) {
      if (rosterMatch.isClaimed) {
        return { success: false, error: 'This student record has already been registered.' };
      }
      className = rosterMatch.class;
      section = rosterMatch.section;
      rosterMatch.isClaimed = true;
      setStorage(STORAGE_KEYS.ROSTER, roster);
    }

    const profiles = this.getProfiles();
    const cleanUsername = params.username.toLowerCase().trim();
    const existingUsername = profiles.find(
      (p) => p.username.toLowerCase() === cleanUsername
    );
    if (existingUsername) {
      return { success: false, error: 'Username is already taken. Please choose another.' };
    }

    // 2. Handle Referral (+25 Points to Referrer, +25 Bonus to new student)
    let referrerUsername: string | undefined = undefined;
    let welcomeBonusPoints = 0;
    if (params.referredBy && params.referredBy.trim()) {
      const cleanRef = params.referredBy.toLowerCase().trim().replace(/^@/, '');
      if (cleanRef && cleanRef !== cleanUsername) {
        const referrer = profiles.find((p) => p.username.toLowerCase() === cleanRef);
        if (referrer) {
          referrerUsername = referrer.username;
          welcomeBonusPoints = 25;

          // Award +25 points to the referrer
          referrer.spiritPoints = (referrer.spiritPoints || 0) + 25;
          referrer.referralCount = (referrer.referralCount || 0) + 1;

          // Also reward referrer's habit streak points
          const streaks = this.getHabitStreaks();
          const refStreak = streaks.find((s) => s.username.toLowerCase() === cleanRef);
          if (refStreak) {
            refStreak.habitPoints = (refStreak.habitPoints || 0) + 25;
            setStorage(STORAGE_KEYS.HABIT_STREAKS, streaks);
          }

          // Send in-app notification to the referrer
          const notifications = this.getNotifications();
          notifications.unshift({
            id: `notif-ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: referrer.username,
            type: 'system',
            title: '🎉 +25 Referral Points Earned!',
            body: `@${cleanUsername} joined DPS Buzz using your referral code! You earned 25 points.`,
            timeAgo: 'Just now',
            isRead: false,
          });
          setStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
        }
      }
    }

    const newProfile: Profile = {
      id: 'student-' + Date.now(),
      username: cleanUsername,
      fullName: params.fullName.trim(),
      avatar: null,
      bio: `Class ${className}-${section} • DPS Student 🐝`,
      class: className,
      section,
      admissionNumber: cleanAdm || undefined,
      role: 'student',
      isVerified: true,
      isApproved: true, // Auto-approved for easy student onboarding
      isPrivate: Boolean(params.isPrivate),
      followerCount: 0,
      followingCount: 0, // Starts at 0
      postCount: 0,
      spiritPoints: 50 + welcomeBonusPoints, // 50 base points + 25 if referred = 75 points
      song: params.song || undefined,
      referredBy: referrerUsername,
      referralCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedProfiles = [...profiles, newProfile];
    setStorage(STORAGE_KEYS.PROFILES, updatedProfiles);

    // Save as current user
    if (typeof window !== 'undefined') {
      localStorage.setItem('dpsbuzz_user', JSON.stringify(newProfile));
      document.cookie = `dpsbuzz_user=${encodeURIComponent(JSON.stringify(newProfile))}; path=/; max-age=31536000; SameSite=Lax`;
      fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: newProfile }),
      }).catch(() => {});
    }

    return { success: true, profile: newProfile };
  },

  // Wipe Test Data Function (Requirement #2)

  // Clean all mock/test data from storage, keeping only current user and real data
  cleanTestData(): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: true, message: 'Server clean completed' };

    let activeUser: Profile | null = null;
    const stored = localStorage.getItem('dpsbuzz_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.username && !DUMMY_TEST_USERNAMES.has(parsed.username.toLowerCase())) {
          activeUser = parsed;
        }
      } catch {}
    }

    const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const cleanProfiles: Profile[] = [];
    if (activeUser) {
      cleanProfiles.push(activeUser);
    }
    // Always keep Shashwath Super Admin in directory so students can find and message him, but NEVER auto-login visitors as Shashwath
    if (!cleanProfiles.some((cp) => cp.username.toLowerCase() === 'shashwath71845')) {
      cleanProfiles.push(SHASHWATH_ADMIN_ACCOUNT);
    }
    for (const p of profiles) {
      if (p && p.username && !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase())) {
        if (!cleanProfiles.some((cp) => cp.username.toLowerCase() === p.username.toLowerCase())) {
          cleanProfiles.push(p);
        }
      }
    }
    setStorage(STORAGE_KEYS.PROFILES, cleanProfiles);

    const posts = getStorage<Post[]>(STORAGE_KEYS.POSTS, []).filter(
      (p) => p && p.username && !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase())
    );
    setStorage(STORAGE_KEYS.POSTS, posts);

    const stories = getStorage<Story[]>(STORAGE_KEYS.STORIES, []).filter(
      (s) => s && s.username && !DUMMY_TEST_USERNAMES.has(s.username.toLowerCase())
    );
    setStorage(STORAGE_KEYS.STORIES, stories);

    const follows = getStorage<Array<{ follower: string; following: string }>>(STORAGE_KEYS.FOLLOWS, []).filter(
      (f) => f && !DUMMY_TEST_USERNAMES.has(f.follower.toLowerCase()) && !DUMMY_TEST_USERNAMES.has(f.following.toLowerCase())
    );
    setStorage(STORAGE_KEYS.FOLLOWS, follows);

    const streaks = getStorage<HabitStreak[]>(STORAGE_KEYS.HABIT_STREAKS, []).filter(
      (s) => s && s.username && !DUMMY_TEST_USERNAMES.has(s.username.toLowerCase())
    );
    setStorage(STORAGE_KEYS.HABIT_STREAKS, streaks);

    localStorage.removeItem('dpsbuzz_recent_searches_v1');
    localStorage.removeItem('dpsbuzz_comments_v1');
    localStorage.removeItem('dpsbuzz_chat_conversations_v1');
    localStorage.removeItem('dpsbuzz_chat_messages_v1');

    window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'test_data_cleaned' } }));

    return {
      success: true,
      message: `Test data cleaned. Preserved active user @${activeUser?.username || 'guest'}.`,
    };
  },

  wipeTestData(): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: true, message: 'Server wipe completed' };

    // 1. Reset roster claim status
    const roster = this.getRoster().map((r) => ({ ...r, isClaimed: false, claimedBy: undefined }));
    setStorage(STORAGE_KEYS.ROSTER, roster);

    // 2. Reset posts, stories, notifications, notices, calendar
    setStorage(STORAGE_KEYS.POSTS, []);
    setStorage(STORAGE_KEYS.STORIES, []);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    setStorage(STORAGE_KEYS.NOTICES, []);
    setStorage(STORAGE_KEYS.CALENDAR, STARTER_CALENDAR);
    setStorage(STORAGE_KEYS.BANNED_USERS, []);
    setStorage(STORAGE_KEYS.MUTED_USERS, []);

    // 3. Clear follows
    setStorage(STORAGE_KEYS.FOLLOWS, []);

    // 4. Reset profiles: KEEP ONLY Shashwath Super Admin
    const cleanShashwath: Profile = {
      ...SHASHWATH_ADMIN_ACCOUNT,
    };
    setStorage(STORAGE_KEYS.PROFILES, [cleanShashwath]);

    // 5. Reset groups and requests to empty (no fake items)
    setStorage(STORAGE_KEYS.GROUPS, []);
    setStorage(STORAGE_KEYS.GROUP_JOIN_REQUESTS, []);
    setStorage(STORAGE_KEYS.HABIT_STREAKS, []);
    setStorage(STORAGE_KEYS.CHAT_NOTES, []);

    // 6. Clear chat messages, conversations and comments
    localStorage.removeItem('dpsbuzz_conversations_v1');
    localStorage.removeItem('dpsbuzz_chat_conversations_v2');
    localStorage.removeItem('dpsbuzz_chat_messages_v1');
    localStorage.removeItem('dpsbuzz_comments_v1');
    localStorage.removeItem('dpsbuzz_recent_searches_v1');
    localStorage.removeItem('dpsbuzz_saved_posts_v1');

    // 7. Reset current active session to shashwath admin
    localStorage.setItem('dpsbuzz_user', JSON.stringify(cleanShashwath));

    // Notify server to clean sync file
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts: [], stories: [], comments: {}, likes: {} }),
    }).catch(() => {});

    window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'test_data_wiped' } }));

    return {
      success: true,
      message: 'All test data wiped successfully. Preserved: Shashwath Super Admin and School Settings.',
    };
  },

  // Follows and Mutuals
  getFollows(): Array<{ follower: string; following: string }> {
    const saved = getStorage<Array<{ follower: string; following: string }>>(
      STORAGE_KEYS.FOLLOWS,
      []
    );
    return saved.filter((f) => {
      if (!f || !f.follower || !f.following) return false;
      const fol = f.follower.toLowerCase().trim();
      const fing = f.following.toLowerCase().trim();
      if (fol === fing) return false; // Rule: Users can NEVER follow themselves!
      return !DUMMY_TEST_USERNAMES.has(fol) && !DUMMY_TEST_USERNAMES.has(fing);
    });
  },

  isFollowing(follower: string, following: string): boolean {
    if (!follower || !following) return false;
    if (follower.toLowerCase().trim() === following.toLowerCase().trim()) return false;
    const list = this.getFollows();
    return list.some(
      (f) =>
        f.follower.toLowerCase() === follower.toLowerCase() &&
        f.following.toLowerCase() === following.toLowerCase()
    );
  },

  isFollowedBy(targetUsername: string, followerUsername: string): boolean {
    return this.isFollowing(followerUsername, targetUsername);
  },

  areMutuals(userA: string, userB: string): boolean {
    if (!userA || !userB || userA.toLowerCase().trim() === userB.toLowerCase().trim()) return false;
    return this.isFollowing(userA, userB) && this.isFollowing(userB, userA);
  },

  toggleFollow(follower: string, following: string): boolean {
    const cleanFollower = follower.toLowerCase().trim();
    const cleanFollowing = following.toLowerCase().trim();

    // Rule: Users can NEVER follow themselves!
    if (!cleanFollower || !cleanFollowing || cleanFollower === cleanFollowing) {
      return false;
    }

    let list = this.getFollows();
    const exists = list.some(
      (f) =>
        f.follower.toLowerCase() === cleanFollower &&
        f.following.toLowerCase() === cleanFollowing
    );

    let isNowFollowing = false;
    if (exists) {
      list = list.filter(
        (f) =>
          !(
            f.follower.toLowerCase() === cleanFollower &&
            f.following.toLowerCase() === cleanFollowing
          )
      );
      isNowFollowing = false;
    } else {
      list.push({ follower: cleanFollower, following: cleanFollowing });
      isNowFollowing = true;
    }
    setStorage(STORAGE_KEYS.FOLLOWS, list);

    // Update followerCount on target profile and followingCount on user profile
    const profiles = this.getProfiles().map((p) => {
      if (p.username.toLowerCase() === cleanFollowing) {
        return {
          ...p,
          followerCount: Math.max(0, p.followerCount + (isNowFollowing ? 1 : -1)),
        };
      }
      if (p.username.toLowerCase() === cleanFollower) {
        return {
          ...p,
          followingCount: Math.max(0, p.followingCount + (isNowFollowing ? 1 : -1)),
        };
      }
      return p;
    });
    setStorage(STORAGE_KEYS.PROFILES, profiles);

    return isNowFollowing;
  },

  // Follow Requests (for Private Accounts)
  getFollowRequests(): Array<{ requester: string; target: string }> {
    return getStorage<Array<{ requester: string; target: string }>>(
      STORAGE_KEYS.FOLLOW_REQUESTS,
      []
    );
  },

  isFollowRequested(requester: string, target: string): boolean {
    const list = this.getFollowRequests();
    return list.some(
      (r) =>
        r.requester.toLowerCase() === requester.toLowerCase() &&
        r.target.toLowerCase() === target.toLowerCase()
    );
  },

  requestFollow(requester: string, target: string): void {
    const cleanReq = requester.toLowerCase().trim();
    const cleanTar = target.toLowerCase().trim();
    if (!cleanReq || !cleanTar || cleanReq === cleanTar) return; // Cannot request self

    let list = this.getFollowRequests();
    if (!list.some((r) => r.requester.toLowerCase() === cleanReq && r.target.toLowerCase() === cleanTar)) {
      list.push({ requester: cleanReq, target: cleanTar });
      setStorage(STORAGE_KEYS.FOLLOW_REQUESTS, list);
    }
  },

  cancelFollowRequest(requester: string, target: string): void {
    const cleanReq = requester.toLowerCase().trim();
    const cleanTar = target.toLowerCase().trim();
    let list = this.getFollowRequests();
    list = list.filter(
      (r) => !(r.requester.toLowerCase() === cleanReq && r.target.toLowerCase() === cleanTar)
    );
    setStorage(STORAGE_KEYS.FOLLOW_REQUESTS, list);
  },

  acceptFollowRequest(target: string, requester: string): void {
    const cleanTar = target.toLowerCase().trim();
    const cleanReq = requester.toLowerCase().trim();
    if (!cleanReq || !cleanTar || cleanReq === cleanTar) return;

    this.cancelFollowRequest(requester, target);
    let list = this.getFollows();
    if (!list.some((f) => f.follower.toLowerCase() === cleanReq && f.following.toLowerCase() === cleanTar)) {
      list.push({ follower: cleanReq, following: cleanTar });
      setStorage(STORAGE_KEYS.FOLLOWS, list);

      const profiles = this.getProfiles().map((p) => {
        if (p.username.toLowerCase() === cleanTar) {
          return { ...p, followerCount: p.followerCount + 1 };
        }
        if (p.username.toLowerCase() === cleanReq) {
          return { ...p, followingCount: p.followingCount + 1 };
        }
        return p;
      });
      setStorage(STORAGE_KEYS.PROFILES, profiles);
    }
  },

  // Privacy Rule: Public accounts can chat immediately; Private accounts must be followed & accepted first!
  canChatAndShare(requester: string, targetUsername: string): { allowed: boolean; isPrivate: boolean; reason?: string } {
    const targetProfile = this.getProfileByUsername(targetUsername);
    if (!targetProfile) return { allowed: true, isPrivate: false };
    const isPrivate = Boolean(targetProfile.isPrivate);
    if (!isPrivate) {
      return { allowed: true, isPrivate: false };
    }
    const isFollowing = this.isFollowing(requester, targetUsername);
    if (isFollowing) {
      return { allowed: true, isPrivate: true };
    }
    const isRequested = this.isFollowRequested(requester, targetUsername);
    return {
      allowed: false,
      isPrivate: true,
      reason: isRequested
        ? `@${targetUsername}'s account is private. Your follow request is waiting for them to accept.`
        : `@${targetUsername}'s account is private. Send a follow request and wait for them to accept before you can chat and send posts or photos.`,
    };
  },

  getMutualFollows(myUsername: string, targetUsername: string): string[] {
    const follows = this.getFollows();
    const cleanMe = myUsername.toLowerCase();
    const cleanTarget = targetUsername.toLowerCase();

    // People I follow
    const myFollowing = follows
      .filter((f) => f.follower.toLowerCase() === cleanMe)
      .map((f) => f.following.toLowerCase());

    // People who follow target
    const targetFollowers = follows
      .filter((f) => f.following.toLowerCase() === cleanTarget)
      .map((f) => f.follower.toLowerCase());

    // Mutuals = people I follow who also follow the target
    return myFollowing.filter((u) => targetFollowers.includes(u));
  },

  // "x person is followed by y and x also followed p and has mutual then recommend to y"
  getMutualBridges(myUsername: string, targetUsername: string): {
    bridges: string[]; // Users X that Y follows and X also follows P
    reverseBridges: string[]; // Users X that P follows and X follows Y
    mutualFollowers: string[]; // Users X who follow both Y and P
    explanation: string;
  } {
    const follows = this.getFollows();
    const cleanY = myUsername.toLowerCase();
    const cleanP = targetUsername.toLowerCase();

    // People Y follows
    const yFollowing = follows
      .filter((f) => f.follower.toLowerCase() === cleanY)
      .map((f) => f.following.toLowerCase());

    // People who follow Target P
    const pFollowers = follows
      .filter((f) => f.following.toLowerCase() === cleanP)
      .map((f) => f.follower.toLowerCase());

    // People Target P follows
    const pFollowing = follows
      .filter((f) => f.follower.toLowerCase() === cleanP)
      .map((f) => f.following.toLowerCase());

    // People who follow Y
    const yFollowers = follows
      .filter((f) => f.following.toLowerCase() === cleanY)
      .map((f) => f.follower.toLowerCase());

    // Bridges: X is followed by Y AND X also follows P!
    const bridges = yFollowing.filter((x) => pFollowers.includes(x));

    // Reverse bridges: P follows X and X follows Y
    const reverseBridges = pFollowing.filter((x) => yFollowers.includes(x));

    // Common followers of both Y and P
    const mutualFollowers = yFollowers.filter((x) => pFollowers.includes(x));

    let explanation = '';
    if (bridges.length > 0) {
      if (bridges.length === 1) {
        explanation = `Followed by @${bridges[0]} (who you follow)`;
      } else {
        explanation = `Followed by @${bridges[0]} +${bridges.length - 1} mutual connection${bridges.length > 2 ? 's' : ''}`;
      }
    } else if (mutualFollowers.length > 0) {
      explanation = `Followed by mutual friend @${mutualFollowers[0]}`;
    }

    return { bridges, reverseBridges, mutualFollowers, explanation };
  },

  // Match class and section keywords (e.g. "8 g", "8g", "8-g", "class 8 g", "7 g", "6 f")
  matchesClassSectionKeyword(
    studentClass: string | undefined,
    studentSection: string | undefined,
    query: string
  ): boolean {
    if (!studentClass) return false;
    const q = query.toLowerCase().trim();
    if (!q) return false;

    const sClass = String(studentClass).toLowerCase().trim();
    const sSec = String(studentSection || '').toLowerCase().trim();

    // Direct string combinations
    const directVariants = [
      `${sClass} ${sSec}`,
      `${sClass}${sSec}`,
      `${sClass}-${sSec}`,
      `class ${sClass} ${sSec}`,
      `class ${sClass}${sSec}`,
      `class ${sClass}-${sSec}`,
      `class ${sClass}`,
      `grade ${sClass} ${sSec}`,
      `grade ${sClass}${sSec}`,
      `grade ${sClass}-${sSec}`,
      `${sClass}th ${sSec}`,
      `${sClass}th-${sSec}`,
      `${sClass}th ${sSec} section`,
    ];

    if (directVariants.some((v) => q === v || q.includes(v) || v.includes(q))) {
      return true;
    }

    // Regex extraction: e.g. "8 g", "8-g", "8g", "class 8 g"
    const match = q.match(/^(\d{1,2})\s*[-_\s/]?\s*([a-gA-G])?$/) ||
                  q.match(/(?:class|grade)?\s*(\d{1,2})\s*[-_\s/]?\s*([a-gA-G])?/);
    if (match) {
      const qClass = match[1];
      const qSec = match[2]?.toLowerCase();
      if (qClass && qClass === sClass) {
        if (!qSec) return true; // e.g. "8" matches all class 8
        if (qSec === sSec) return true; // exact section match (e.g. "8 g" matches 8-G)
      }
    }

    return false;
  },

  getClassmates(classNum = '8', sectionStr = 'A', excludeUsername?: string): Profile[] {
    const profiles = this.getProfiles();
    return profiles.filter((p) => {
      if (p.role !== 'student') return false;
      if (excludeUsername && p.username.toLowerCase() === excludeUsername.toLowerCase()) return false;
      return (
        String(p.class).toLowerCase() === String(classNum).toLowerCase() &&
        String(p.section || '').toUpperCase() === String(sectionStr).toUpperCase()
      );
    });
  },

  getSuggestions(
    myUsername: string,
    keywordFilter?: string
  ): Array<{
    profile: Profile;
    mutuals: string[];
    bridges: string[];
    areMutuals: boolean;
    isClassmate: boolean;
    reason: string;
  }> {
    const me = this.getProfileByUsername(myUsername) || this.getCurrentUser();
    const profiles = this.getProfiles().filter(
      (p) => p.role === 'student' && p.username.toLowerCase() !== myUsername.toLowerCase()
    );

    let candidates = profiles.filter((p) => !this.isFollowing(myUsername, p.username));

    // If a keyword like "8 g" is searched/provided
    if (keywordFilter && keywordFilter.trim()) {
      const q = keywordFilter.trim();
      candidates = candidates.filter((p) =>
        this.matchesClassSectionKeyword(p.class, p.section, q) ||
        p.username.toLowerCase().includes(q.toLowerCase()) ||
        p.fullName.toLowerCase().includes(q.toLowerCase())
      );
    }

    return candidates
      .map((p) => {
        const { bridges, mutualFollowers, explanation } = this.getMutualBridges(myUsername, p.username);
        const mutuals = this.getMutualFollows(myUsername, p.username);
        const isClassmate =
          Boolean(me.class && p.class && String(me.class) === String(p.class) && String(me.section || '').toUpperCase() === String(p.section || '').toUpperCase());
        const isMutualFollow = this.areMutuals(myUsername, p.username);

        let reason = '';
        if (isClassmate) {
          if (explanation) {
            reason = `Classmate in Class ${p.class}-${p.section} • ${explanation}`;
          } else {
            reason = `Your classmate in Class ${p.class}-${p.section}`;
          }
        } else if (explanation) {
          reason = explanation;
        } else if (mutuals.length > 0) {
          const names = mutuals.map((u) => `@${u}`).slice(0, 2).join(', ');
          reason = `Followed by ${names}${mutuals.length > 2 ? ` +${mutuals.length - 2} more` : ''}`;
        } else if (p.class) {
          reason = `Student in Class ${p.class}-${p.section || ''}`;
        } else {
          reason = 'Active on DPS Buzz';
        }

        return {
          profile: p,
          mutuals,
          bridges,
          areMutuals: isMutualFollow,
          isClassmate,
          reason,
        };
      })
      .sort((a, b) => {
        // Classmates first
        if (a.isClassmate && !b.isClassmate) return -1;
        if (!a.isClassmate && b.isClassmate) return 1;
        // Candidates with mutual bridges (e.g. Y follows X and X follows P)
        if (a.bridges.length > 0 && b.bridges.length === 0) return -1;
        if (a.bridges.length === 0 && b.bridges.length > 0) return 1;
        // Most mutual connections
        return (b.bridges.length + b.mutuals.length) - (a.bridges.length + a.mutuals.length);
      });
  },

  // ==========================================
  // HABIT & STUDY STREAKS SYSTEM (Star Board)
  // ==========================================
  getHabitStreaks(): HabitStreak[] {
    const list = getStorage<HabitStreak[]>(STORAGE_KEYS.HABIT_STREAKS, []);
    const cleanList = list.filter((s) => s && s.username && !DUMMY_TEST_USERNAMES.has(s.username.toLowerCase()));
    // Sort descending by streakDays first, then by habitPoints
    return [...cleanList].sort((a, b) => {
      if (b.streakDays !== a.streakDays) {
        return b.streakDays - a.streakDays;
      }
      return b.habitPoints - a.habitPoints;
    });
  },

  getUserHabitStreak(username: string): HabitStreak | null {
    const list = this.getHabitStreaks();
    const clean = username.toLowerCase().trim();
    return list.find((s) => s.username.toLowerCase() === clean) || null;
  },

  evaluateHabitPost(caption: string, category?: string): {
    isHabit: boolean;
    primaryHabit: 'Studies' | 'Sports' | 'Reading' | 'STEM' | 'Arts' | 'Routine';
    habitTag: string;
    points: number;
    reason: string;
  } {
    const text = (caption || '').toLowerCase();

    // Explicit or keyword checks
    const isStudies =
      category === 'studies' ||
      /study|studies|revision|exam|homework|math|physics|chapter|notes|formula|science expo|test|syllabus|prepar|quiz/i.test(
        text
      );
    const isSports =
      category === 'sports' ||
      /sport|sports|cricket|football|badminton|running|jog|drill|match|fitness|pt|play|athletic|ball|practice/i.test(
        text
      );
    const isReading =
      category === 'reading' ||
      /read|reading|book|novel|literature|library|chapter|diary|pages|author/i.test(text);
    const isStem =
      category === 'stem' ||
      /lab|stem|robot|coding|code|circuit|chemistry|biology|experiment|tech|sensor|micro/i.test(text);
    const isArts =
      category === 'arts' ||
      /art|drawing|paint|painting|music|choir|drama|sketch|dance|craft|colour/i.test(text);
    const isRoutine =
      category === 'routine' ||
      /routine|morning|assembly|habit|early|water|clean|punctual|discipline|tiffin/i.test(text);

    // Reject low-effort spam / nonsense (e.g. fewer than 3 words without explicit category)
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1);
    if (words.length < 3 && !category) {
      return {
        isHabit: false,
        primaryHabit: 'Studies',
        habitTag: '#None',
        points: 0,
        reason:
          'Too short to qualify as a study or good habit post. Share your homework, sports, or revision update!',
      };
    }

    if (isStudies) {
      return {
        isHabit: true,
        primaryHabit: 'Studies',
        habitTag: '#Studies & Revision',
        points: 25,
        reason: 'Studies and homework update (+25 pts)',
      };
    }
    if (isSports) {
      return {
        isHabit: true,
        primaryHabit: 'Sports',
        habitTag: '#Sports & Playing',
        points: 25,
        reason: 'Sports and fitness habit (+25 pts)',
      };
    }
    if (isReading) {
      return {
        isHabit: true,
        primaryHabit: 'Reading',
        habitTag: '#Book Reading',
        points: 25,
        reason: 'Reading and literature habit (+25 pts)',
      };
    }
    if (isStem) {
      return {
        isHabit: true,
        primaryHabit: 'STEM',
        habitTag: '#Science & Lab',
        points: 25,
        reason: 'STEM and laboratory practice (+25 pts)',
      };
    }
    if (isArts) {
      return {
        isHabit: true,
        primaryHabit: 'Arts',
        habitTag: '#Creative Arts',
        points: 25,
        reason: 'Arts and cultural habit (+25 pts)',
      };
    }
    if (isRoutine) {
      return {
        isHabit: true,
        primaryHabit: 'Routine',
        habitTag: '#Healthy Routine',
        points: 25,
        reason: 'Daily discipline and routine (+25 pts)',
      };
    }

    // Meaningful school life post default
    if (words.length >= 4) {
      return {
        isHabit: true,
        primaryHabit: 'Studies',
        habitTag: '#School Day Habit',
        points: 25,
        reason: 'School habit update (+25 pts)',
      };
    }

    return {
      isHabit: false,
      primaryHabit: 'Studies',
      habitTag: '#None',
      points: 0,
      reason:
        'Low effort or unrelated post. Share studies, sports, or good habits to earn points and keep your streak!',
    };
  },

  recordHabitPost(
    username: string,
    caption: string,
    category?: string
  ): {
    awarded: boolean;
    streakDays: number;
    points: number;
    reason: string;
  } {
    const evalResult = this.evaluateHabitPost(caption, category);
    const list = this.getHabitStreaks();
    const cleanUser = username.toLowerCase().trim();
    const existingIndex = list.findIndex((s) => s.username.toLowerCase() === cleanUser);

    const userProfile = this.getProfileByUsername(username);
    const fullName = userProfile ? userProfile.fullName : username;
    const userClass = userProfile
      ? `Class ${userProfile.class || '8'}-${userProfile.section || 'A'}`
      : 'Class 8-A';

    if (!evalResult.isHabit) {
      return {
        awarded: false,
        streakDays: existingIndex >= 0 ? list[existingIndex].streakDays : 0,
        points: 0,
        reason: evalResult.reason,
      };
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    if (existingIndex >= 0) {
      const entry = list[existingIndex];
      const lastDate = entry.lastPostedDate ? entry.lastPostedDate.slice(0, 10) : '';
      const alreadyPostedToday = (lastDate === todayStr && entry.postedToday) || (entry.recentPostsCount > 0 && lastDate === todayStr);

      if (alreadyPostedToday) {
        // User already posted today! Only the FIRST post receives points, NOT the second!
        list[existingIndex] = {
          ...entry,
          recentPostsCount: entry.recentPostsCount + 1,
          lastPostedDate: new Date().toISOString(),
        };
        setStorage(STORAGE_KEYS.HABIT_STREAKS, list);

        return {
          awarded: false,
          streakDays: entry.streakDays,
          points: 0,
          reason: 'Only your first post of the day receives points. No points awarded on second posts.',
        };
      }

      // First post of the day: award points!
      const nextStreakDays = entry.streakDays + 1;
      const nextPoints = entry.habitPoints + evalResult.points;
      const nextBest = Math.max(entry.bestStreak, nextStreakDays);

      list[existingIndex] = {
        ...entry,
        streakDays: nextStreakDays,
        habitPoints: nextPoints,
        primaryHabit: evalResult.primaryHabit,
        habitTag: evalResult.habitTag,
        lastPostedDate: new Date().toISOString(),
        postedToday: true,
        recentPostsCount: entry.recentPostsCount + 1,
        bestStreak: nextBest,
      };

      setStorage(STORAGE_KEYS.HABIT_STREAKS, list);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dpsbuzz:content_updated', {
            detail: {
              type: 'streak_updated',
              username: cleanUser,
              streakDays: nextStreakDays,
              habitPoints: nextPoints,
            },
          })
        );
      }

      return {
        awarded: true,
        streakDays: nextStreakDays,
        points: evalResult.points,
        reason: `${evalResult.reason} Streak is now ${nextStreakDays} days!`,
      };
    } else {
      const newStreak: HabitStreak = {
        id: 'streak-' + Date.now(),
        username: cleanUser,
        fullName,
        class: userClass,
        streakDays: 1,
        habitPoints: evalResult.points,
        primaryHabit: evalResult.primaryHabit,
        habitTag: evalResult.habitTag,
        lastPostedDate: new Date().toISOString(),
        postedToday: true,
        recentPostsCount: 1,
        bestStreak: 1,
      };

      list.push(newStreak);
      setStorage(STORAGE_KEYS.HABIT_STREAKS, list);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dpsbuzz:content_updated', {
            detail: {
              type: 'streak_updated',
              username: cleanUser,
              streakDays: 1,
              habitPoints: evalResult.points,
            },
          })
        );
      }

      return {
        awarded: true,
        streakDays: 1,
        points: evalResult.points,
        reason: `New Streak started! 🔥 Day 1 (+${evalResult.points} pts)`,
      };
    }
  },

  // Audit: Row Counts across all entities (Requirement #7)
  getTableCounts(): Record<string, number> {
    const profiles = this.getProfiles();
    // Exclude fixed system accounts for pure "content" counts
    const studentProfiles = profiles.filter((p) => p.role === 'student');
    const posts = this.getPosts();
    const stories = this.getStories();
    const roster = this.getRoster();
    const groups = this.getGroups();
    const notices = this.getNotices();
    const notifications = this.getNotifications();
    const follows = getStorage<any[]>(STORAGE_KEYS.FOLLOWS, []);

    const calendarEvents = this.getCalendarEvents();
    const bannedUsers = this.getBannedUsers();

    return {
      'Profiles (Total)': profiles.length,
      'Student Accounts': studentProfiles.length,
      'Student Roster Rows': roster.length,
      'Posts': posts.length,
      'Stories': stories.length,
      'Calendar Events': calendarEvents.length,
      'Banned Accounts': bannedUsers.length,
      'Warnings Issued': this.getWarnings().length,
      'Follows': follows.length,
      'Notices': notices.length,
      'Notifications': notifications.length,
      'Groups': groups.length,
    };
  },

  // Storage Settings (Cloudinary Media & Retention Lifecycle)
  getStorageSettings(): StorageSettings {
    const defaultSettings: StorageSettings = {
      chatRetentionDays: 90,
      postPhotoRetentionMonths: 0,
      mediaProvider: 'cloudinary',
      storageLockGB: 20.0,
      r2StorageLockGB: 20.0,
      r2BucketName: 'dpsbuzz-media',
    };
    const saved = getStorage<Partial<StorageSettings>>(STORAGE_KEYS.STORAGE_SETTINGS, {});
    const lockGB = typeof saved.storageLockGB === 'number'
      ? saved.storageLockGB
      : typeof saved.r2StorageLockGB === 'number' && saved.r2StorageLockGB !== 9.0
      ? saved.r2StorageLockGB
      : 20.0;
    return {
      ...defaultSettings,
      ...saved,
      storageLockGB: lockGB,
      r2StorageLockGB: lockGB,
    };
  },

  updateStorageSettings(updates: Partial<StorageSettings>): StorageSettings {
    const current = this.getStorageSettings();
    const next = { ...current, ...updates };
    if (updates.storageLockGB && !updates.r2StorageLockGB) {
      next.r2StorageLockGB = updates.storageLockGB;
    } else if (updates.r2StorageLockGB && !updates.storageLockGB) {
      next.storageLockGB = updates.r2StorageLockGB;
    }
    setStorage(STORAGE_KEYS.STORAGE_SETTINGS, next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'storage_settings_updated', settings: next },
        })
      );
    }
    return next;
  },

  // Storage Analytics & Capacity Warnings (Cloudinary 25 GB & 20.0 GB Safety Lock)
  getStorageAnalytics(): StorageAnalytics {
    const posts = this.getPosts();
    const stories = this.getStories();
    const profiles = this.getProfiles();
    const settings = this.getStorageSettings();
    const storageLockGB = settings.storageLockGB ?? 20.0;

    // Count active photos
    let totalPhotos = 0;
    for (const post of posts) {
      totalPhotos += post.postImages ? post.postImages.length : post.images ? post.images.length : 0;
    }
    totalPhotos += stories.filter((s) => s.imageUrl || s.mediaUrl || s.mediaR2Key).length;
    totalPhotos += profiles.filter((p) => p.avatar || p.avatarR2Key).length;

    // Average 180KB per photo with Cloudinary f_auto,q_auto compression
    const storageUsedBytes = totalPhotos * 180 * 1024;
    const storageUsedGB = Number((storageUsedBytes / (1024 * 1024 * 1024)).toFixed(3));
    const remainingToLockGB = Math.max(0, Number((storageLockGB - storageUsedGB).toFixed(3)));
    const isLocked = storageUsedGB >= storageLockGB;

    // Calculate approximate database size in bytes
    const roster = this.getRoster();
    const groups = this.getGroups();
    const notices = this.getNotices();
    const follows = getStorage<any[]>(STORAGE_KEYS.FOLLOWS, []);
    const chatMessages = getStorage<any[]>(STORAGE_KEYS.CHAT_MESSAGES, []);

    const baseDbBytes = 12 * 1024 * 1024; // Base schema & extensions ~12MB
    const rowsDbBytes =
      profiles.length * 1500 +
      roster.length * 500 +
      posts.length * 1200 +
      groups.length * 800 +
      notices.length * 1500 +
      follows.length * 120 +
      chatMessages.length * 450;
    const dbSizeBytes = baseDbBytes + rowsDbBytes;
    const dbSizeMB = Number((dbSizeBytes / (1024 * 1024)).toFixed(2));

    return {
      totalPhotos,
      storageUsedBytes,
      storageUsedGB,
      dbSizeBytes,
      dbSizeMB,
      totalChatMessages: chatMessages.length,
      mediaProvider: 'cloudinary',
      storageLimitGB: 25.0, // Cloudinary Free Allowance
      storageLockGB,
      r2StorageLimitGB: 25.0,
      r2StorageLockGB: storageLockGB,
      remainingToLockGB,
      isStorageLocked: isLocked,
      isR2Locked: isLocked,
      isStorageWarning: storageUsedGB >= 16.0, // Warning at ~80% of 20GB lock
      isR2Warning: storageUsedGB >= 16.0,
      isDbWarning: dbSizeMB >= 400.0, // Warning at 80% (400 MB of Supabase)
    };
  },

  isStorageLocked(): boolean {
    return this.getStorageAnalytics().isStorageLocked;
  },

  setStorageLockThreshold(lockGB: number): StorageSettings {
    return this.updateStorageSettings({ storageLockGB: Number(lockGB), r2StorageLockGB: Number(lockGB) });
  },

  // Auto-prune chat messages older than retention window (Requirement #8)
  pruneOldChatMessages(customDays?: number): { success: boolean; deletedCount: number; message: string } {
    const settings = this.getStorageSettings();
    const days = customDays ?? settings.chatRetentionDays;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const messages = getStorage<any[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
    const remaining = messages.filter((m) => {
      if (!m || !m.timestamp) return true;
      const t = new Date(m.timestamp).getTime();
      return isNaN(t) || t >= cutoffTime;
    });

    const deletedCount = messages.length - remaining.length;
    setStorage(STORAGE_KEYS.CHAT_MESSAGES, remaining);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'chat_messages_pruned', deletedCount, days },
        })
      );
    }

    return {
      success: true,
      deletedCount,
      message: `Pruned ${deletedCount} chat message(s) older than ${days} days.`,
    };
  },

  // Maintenance Mode Calendar & Scheduling
  getMaintenanceDates(): string[] {
    return getStorage<string[]>(STORAGE_KEYS.MAINTENANCE_DATES, []);
  },

  setMaintenanceDates(dates: string[]): void {
    setStorage(STORAGE_KEYS.MAINTENANCE_DATES, dates);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'maintenance_updated' } })
      );
    }
  },

  toggleMaintenanceDate(dateStr: string): boolean {
    const dates = this.getMaintenanceDates();
    let newDates: string[];
    let isNowLocked: boolean;
    if (dates.includes(dateStr)) {
      newDates = dates.filter((d) => d !== dateStr);
      isNowLocked = false;
    } else {
      newDates = [...dates, dateStr].sort();
      isNowLocked = true;
    }
    this.setMaintenanceDates(newDates);
    return isNowLocked;
  },

  isGlobalMaintenanceEnabled(): boolean {
    return getStorage<boolean>(STORAGE_KEYS.MAINTENANCE_MODE, false);
  },

  setGlobalMaintenanceEnabled(enabled: boolean): void {
    setStorage(STORAGE_KEYS.MAINTENANCE_MODE, enabled);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'maintenance_updated' } })
      );
    }
  },

  isMaintenanceActive(): boolean {
    if (this.isGlobalMaintenanceEnabled()) return true;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return this.getMaintenanceDates().includes(todayStr);
  },

  // Share post to chat with friends
  sharePostToChat(post: Post, targetUsernames: string[], senderUsername?: string): void {
    if (!targetUsernames.length || typeof window === 'undefined') return;
    const cur = senderUsername || this.getCurrentUser().username;

    try {
      const storedConv = JSON.parse(localStorage.getItem('dpsbuzz_chat_conversations_v2') || '[]');
      const storedMsgs = JSON.parse(localStorage.getItem('dpsbuzz_chat_messages_v1') || '{}');
      const profiles = this.getProfiles();
      const previewText = `Shared @${post.username}'s post: "${post.caption ? (post.caption.length > 50 ? post.caption.slice(0, 50) + '...' : post.caption) : 'Photo moment'}" 📸`;

      targetUsernames.forEach((tUser) => {
        const cleanT = tUser.toLowerCase().trim();
        const convId = `conv-${cleanT}`;
        const targetProf = profiles.find((p) => p.username.toLowerCase() === cleanT);
        const targetName = targetProf ? targetProf.fullName : tUser;
        const timeNow = 'Just now';

        const existingIdx = storedConv.findIndex((c: any) => c.username?.toLowerCase() === cleanT || c.id === convId);
        if (existingIdx >= 0) {
          storedConv[existingIdx].lastMessage = `You: ${previewText}`;
          storedConv[existingIdx].timeAgo = timeNow;
        } else {
          storedConv.unshift({
            id: convId,
            name: targetName,
            username: cleanT,
            studentClass: targetProf?.class ? `${targetProf.class}-${targetProf.section || ''}` : '8-A',
            lastMessage: `You: ${previewText}`,
            timeAgo: timeNow,
            isUnread: false,
          });
        }

        const newMsg = {
          id: `msg-share-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text: previewText,
          sender: 'me' as const,
          time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
          sharedPost: {
            id: post.id,
            username: post.username,
            imageUrl: post.imageUrl || (post.images && post.images[0]),
            caption: post.caption,
          },
        };

        storedMsgs[convId] = [...(storedMsgs[convId] || []), newMsg];
      });

      localStorage.setItem('dpsbuzz_chat_conversations_v2', JSON.stringify(storedConv));
      localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(storedMsgs));

      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'post_shared_to_chat' } })
      );
    } catch (e) {
      console.error('Error sharing post to chat:', e);
    }
  },

  // Story reply directly into chat with story author
  sendStoryReplyToChat(story: Story, replyText: string, senderUsername?: string): void {
    if (typeof window === 'undefined') return;
    const cur = senderUsername || this.getCurrentUser().username;
    const authorUsername = story.username.toLowerCase().trim();

    try {
      const convId = `conv-${authorUsername}`;
      const storedConv = JSON.parse(localStorage.getItem('dpsbuzz_chat_conversations_v2') || '[]');
      const storedMsgs = JSON.parse(localStorage.getItem('dpsbuzz_chat_messages_v1') || '{}');
      const profiles = this.getProfiles();
      const targetProf = profiles.find((p) => p.username.toLowerCase() === authorUsername);
      const targetName = story.fullName || targetProf?.fullName || authorUsername;
      const formattedMsg = `Replied to your story: "${replyText}" 💬`;
      const timeNow = 'Just now';

      const existingIdx = storedConv.findIndex((c: any) => c.username?.toLowerCase() === authorUsername || c.id === convId);
      if (existingIdx >= 0) {
        storedConv[existingIdx].lastMessage = `You: ${formattedMsg}`;
        storedConv[existingIdx].timeAgo = timeNow;
      } else {
        storedConv.unshift({
          id: convId,
          name: targetName,
          username: authorUsername,
          studentClass: targetProf?.class ? `${targetProf.class}-${targetProf.section || ''}` : '8-A',
          lastMessage: `You: ${formattedMsg}`,
          timeAgo: timeNow,
          isUnread: false,
        });
      }

      const newMsg = {
        id: `msg-story-${Date.now()}`,
        text: formattedMsg,
        sender: 'me' as const,
        time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
      };

      storedMsgs[convId] = [...(storedMsgs[convId] || []), newMsg];

      localStorage.setItem('dpsbuzz_chat_conversations_v2', JSON.stringify(storedConv));
      localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(storedMsgs));

      // Also create a notification for the story owner
      const notifs = this.getNotifications();
      notifs.unshift({
        id: `notif-sreply-${Date.now()}`,
        userId: cur,
        type: 'comment',
        title: `@${cur} replied to your story`,
        body: `"${replyText}"`,
        timeAgo: 'Just now',
        isRead: false,
      });
      setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);

      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', { detail: { type: 'story_reply_sent' } })
      );
    } catch (e) {
      console.error('Error sending story reply to chat:', e);
    }
  },
};

export interface StorageSettings {
  chatRetentionDays: number;
  postPhotoRetentionMonths: number;
  mediaProvider?: 'cloudinary' | 'r2';
  storageLockGB: number;
  r2StorageLockGB?: number;
  r2BucketName?: string;
}

export interface StorageAnalytics {
  totalPhotos: number;
  storageUsedBytes: number;
  storageUsedGB: number;
  dbSizeBytes: number;
  dbSizeMB: number;
  totalChatMessages: number;
  mediaProvider?: 'cloudinary' | 'r2';
  storageLimitGB: number;
  storageLockGB: number;
  r2StorageLimitGB: number;
  r2StorageLockGB: number;
  remainingToLockGB: number;
  isStorageLocked: boolean;
  isR2Locked: boolean;
  isStorageWarning: boolean;
  isR2Warning: boolean;
  isDbWarning: boolean;
}

// Auto-run cleanup on client-side initialization so old test data is immediately purged
// and any accidental Shashwath session leaks on visitor devices are completely cleared
if (typeof window !== 'undefined') {
  try {
    const isCleanedV3 = localStorage.getItem('dpsbuzz_cleaned_v3_session_fix');
    if (!isCleanedV3) {
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.username && parsed.username.toLowerCase() === 'shashwath71845') {
            const isAuth = localStorage.getItem('dpsbuzz_shashwath_authenticated');
            if (!isAuth) {
              // Clear leaked Shashwath session from visitor device
              localStorage.removeItem('dpsbuzz_user');
              document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
            }
          }
        } catch {}
      }
      DataStore.cleanTestData();
      localStorage.setItem('dpsbuzz_cleaned_v3_session_fix', 'true');
    }
  } catch {}
}
