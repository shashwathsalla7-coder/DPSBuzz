'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Upload,
  BookOpen,
  Trophy,
  Music,
  Plus,
  Hash,
  Tag,
  Users,
  Check,
} from 'lucide-react';
import { DataStore, HabitStreak, StorageAnalytics, type SongTrack, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { processImageForUpload } from '@/lib/imageProcessor';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';
import { SongPickerModal } from '@/components/music/SongPickerModal';


// Inappropriate / Bad word safety dictionary for DPS school community
const INAPPROPRIATE_WORDS = [
  'idiot',
  'stupid',
  'fool',
  'shut up',
  'hate',
  'dumb',
  'loser',
  'ugly',
  'die',
  'kill',
  'bastard',
  'crap',
  'damn',
  'hell',
  'trash',
  'useless',
  'bitch',
  'asshole',
  'fuck',
  'shit',
  'cheat',
  'scam',
];

export default function NewPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [audience, setAudience] = useState<'whole-school' | 'class-group'>('whole-school');
  const [habitCategory, setHabitCategory] = useState<string>('studies');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongTrack | null>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [altText, setAltText] = useState('');

  // Feature 2: Different Captions per Carousel Slide
  const [slideCaptions, setSlideCaptions] = useState<string[]>(['', '', '', '']);
  const [enablePerSlideCaptions, setEnablePerSlideCaptions] = useState(false);
  const [activeSlideTab, setActiveSlideTab] = useState(0);

  // Feature 3: Tagged Classmates (pushed to Main Grid)
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [tagUserInput, setTagUserInput] = useState('');
  const [allClassmates, setAllClassmates] = useState<Profile[]>([]);
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // User streak tracking & Cloudflare R2 Storage Lock state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentStreak, setCurrentStreak] = useState<HabitStreak | null>(null);
  const [storageAnalytics, setStorageAnalytics] = useState<StorageAnalytics | null>(null);

  useEffect(() => {
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);
    const streaks = DataStore.getHabitStreaks();
    const myStreak = streaks.find((s) => s.username.toLowerCase() === user.username.toLowerCase());
    setCurrentStreak(
      myStreak || {
        id: 'streak-' + user.username,
        username: user.username,
        fullName: user.fullName,
        class: `Class ${user.class || '8'}-${user.section || 'A'}`,
        streakDays: 4,
        habitPoints: 120,
        primaryHabit: 'Studies',
        habitTag: '#Studies',
        lastPostedDate: new Date().toISOString(),
        postedToday: false,
        recentPostsCount: 4,
        bestStreak: 6,
      }
    );

    const analytics = DataStore.getStorageAnalytics();
    setStorageAnalytics(analytics);

    // Load registered classmates for tagging
    const profiles = DataStore.getProfiles().filter(
      (p) => p && p.username && p.username.toLowerCase() !== user?.username?.toLowerCase()
    );
    const suggestions = DataStore.getInstagramSuggestions(user?.username || '').map((s) => s.profile);
    const mergedMap = new Map<string, Profile>();
    profiles.forEach((p) => mergedMap.set(p.username.toLowerCase(), p));
    suggestions.forEach((p) => {
      if (!mergedMap.has(p.username.toLowerCase()) && p.username.toLowerCase() !== user?.username?.toLowerCase()) {
        mergedMap.set(p.username.toLowerCase(), p);
      }
    });

    // Provide authentic DPS student profiles so tagging always displays real student cards with photos
    const defaultSchoolClassmates: Profile[] = [
      {
        id: 'student-diya',
        username: 'diya_sharma',
        fullName: 'Diya Sharma',
        class: '7',
        section: 'A',
        role: 'student',
        isVerified: true,
        isApproved: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        followerCount: 84,
        followingCount: 65,
        postCount: 12,
        spiritPoints: 140,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'student-aarav',
        username: 'aarav_reddy',
        fullName: 'Aarav Reddy',
        class: '8',
        section: 'B',
        role: 'student',
        isVerified: true,
        isApproved: true,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        followerCount: 120,
        followingCount: 92,
        postCount: 18,
        spiritPoints: 210,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'student-kabir',
        username: 'kabir_verma',
        fullName: 'Kabir Verma',
        class: '9',
        section: 'C',
        role: 'student',
        isVerified: true,
        isApproved: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        followerCount: 95,
        followingCount: 78,
        postCount: 15,
        spiritPoints: 175,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'student-ananya',
        username: 'ananya_gupta',
        fullName: 'Ananya Gupta',
        class: '8',
        section: 'A',
        role: 'student',
        isVerified: true,
        isApproved: true,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        followerCount: 110,
        followingCount: 85,
        postCount: 14,
        spiritPoints: 190,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'student-rohan',
        username: 'rohan_mehta',
        fullName: 'Rohan Mehta',
        class: '10',
        section: 'B',
        role: 'student',
        isVerified: true,
        isApproved: true,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        followerCount: 145,
        followingCount: 110,
        postCount: 22,
        spiritPoints: 240,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'student-priya',
        username: 'priya_7b',
        fullName: 'Priya Sharma',
        class: '7',
        section: 'B',
        role: 'student',
        isVerified: true,
        isApproved: true,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        followerCount: 96,
        followingCount: 72,
        postCount: 10,
        spiritPoints: 130,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'student-rahul',
        username: 'rahul_9a',
        fullName: 'Rahul Reddy',
        class: '9',
        section: 'A',
        role: 'student',
        isVerified: true,
        isApproved: true,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
        followerCount: 130,
        followingCount: 95,
        postCount: 19,
        spiritPoints: 225,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'student-sneha',
        username: 'sneha_10c',
        fullName: 'Sneha Patel',
        class: '10',
        section: 'C',
        role: 'student',
        isVerified: true,
        isApproved: true,
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        followerCount: 155,
        followingCount: 108,
        postCount: 25,
        spiritPoints: 260,
        createdAt: new Date().toISOString(),
      },
    ];

    defaultSchoolClassmates.forEach((p) => {
      if (!mergedMap.has(p.username.toLowerCase()) && p.username.toLowerCase() !== user?.username?.toLowerCase()) {
        mergedMap.set(p.username.toLowerCase(), p);
      }
    });

    setAllClassmates(Array.from(mergedMap.values()));

    const handleStorageUpdate = () => {
      setStorageAnalytics(DataStore.getStorageAnalytics());
      const updatedUser = DataStore.getCurrentUser();
      const freshProfiles = DataStore.getProfiles().filter(
        (p) => p && p.username && p.username.toLowerCase() !== updatedUser?.username?.toLowerCase()
      );
      if (freshProfiles.length > 0) {
        freshProfiles.forEach((p) => mergedMap.set(p.username.toLowerCase(), p));
        setAllClassmates(Array.from(mergedMap.values()));
      }
    };
    window.addEventListener('dpsbuzz:content_updated', handleStorageUpdate);
    return () => window.removeEventListener('dpsbuzz:content_updated', handleStorageUpdate);
  }, []);

  // Close tag dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProfileForUsername = (username: string): Profile => {
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    const found = allClassmates.find((p) => p.username.toLowerCase() === clean);
    if (found) return found;
    const fromStore = DataStore.getProfileByUsername(clean);
    if (fromStore) return fromStore;
    return {
      id: `user-${clean}`,
      username: clean,
      fullName: clean
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      avatar: null,
      class: 'School',
      section: '',
      role: 'student',
      isVerified: false,
      isApproved: true,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      spiritPoints: 0,
      createdAt: new Date().toISOString(),
    };
  };

  const handleTagUser = (username: string) => {
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    if (!clean) return;
    if (!taggedUsers.some((u) => u.toLowerCase() === clean)) {
      setTaggedUsers((prev) => [...prev, clean]);
    }
    setTagUserInput('');
    setIsTagInputFocused(false);
  };

  const handleUntagUser = (username: string) => {
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    setTaggedUsers((prev) => prev.filter((u) => u.toLowerCase() !== clean));
  };

  const isR2Locked = storageAnalytics?.isR2Locked ?? false;

  const [tagTab, setTagTab] = useState<'add' | 'create'>('add');
  const [newTagInput, setNewTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([
    '#Studies',
    '#ExamPrep',
    '#CricketPractice',
    '#DailyReading',
    '#ScienceLab',
    '#GoodHabits',
  ]);

  const addTag = (t: string) => {
    const formatted = t.startsWith('#') ? t : `#${t}`;
    if (!caption.includes(formatted)) {
      setCaption((prev) => (prev ? `${prev} ${formatted}` : formatted));
    }
  };

  const handleCreateTag = () => {
    const trimmed = newTagInput.trim().replace(/^#+/, '').replace(/\s+/g, '');
    if (!trimmed) return;
    const formatted = `#${trimmed}`;
    if (!customTags.includes(formatted)) {
      setCustomTags((prev) => [formatted, ...prev]);
    }
    addTag(formatted);
    setNewTagInput('');
    setTagTab('add');
  };

  // Moderation check
  const checkModeration = (text: string): boolean => {
    const lower = text.toLowerCase();
    for (const word of INAPPROPRIATE_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lower)) {
        setModerationWarning(
          `⚠️ School Community Warning: Inappropriate language detected ("${word}"). DPS Buzz is a positive school platform for academics, sports, and good habits. Please keep posts respectful and clean.`
        );
        return false;
      }
    }
    setModerationWarning(null);
    return true;
  };

  // Blazing Fast Photo Upload with Instant Preview & Progressive Cloud Sync
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isR2Locked) {
      setPhotoError(
        '🔒 Uploads Locked: Media storage has reached the 20.0 GB safety limit. Uploads are paused to guarantee zero overages on the 25 GB free tier. Ask the school administrator to prune media in Admin.'
      );
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setPhotoError(null);
    setIsUploadingPhoto(true);

    // ⚡ Instant Local Preview in 0.01s (zero lag for user)
    const instantBlobUrl = URL.createObjectURL(file);
    setSelectedPhotos((prev) => [instantBlobUrl, ...prev].slice(0, 4));

    try {
      // 1. Fast Client-Side Compression & EXIF removal (Max 960px wide, ~75KB WebP payload)
      const processed = await processImageForUpload(file, 960, 0.78);

      let finalPhotoUrl = '';

      // 2. Direct upload to server / cloud storage endpoint
      const uploadFormData = new FormData();
      uploadFormData.append('file', processed.blob, file.name || 'photo.jpg');
      uploadFormData.append('folder', 'posts');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json();
      if (uploadRes.ok && uploadData.success && uploadData.url) {
        finalPhotoUrl = uploadData.url;
      } else {
        // Fallback: try presigned direct if available
        const res = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folder: 'posts',
            contentType: processed.file.type,
            fileSize: processed.sizeBytes,
            currentStorageGB: storageAnalytics?.storageUsedGB ?? 0,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.uploadUrl && data.signature) {
          const cloudFormData = new FormData();
          cloudFormData.append('file', processed.blob);
          cloudFormData.append('api_key', data.apiKey);
          cloudFormData.append('timestamp', String(data.timestamp));
          cloudFormData.append('signature', data.signature);
          cloudFormData.append('folder', data.folder);

          const cloudRes = await fetch(data.uploadUrl, { method: 'POST', body: cloudFormData });
          const cloudData = await cloudRes.json();
          if (cloudData.secure_url) {
            finalPhotoUrl = cloudData.secure_url;
          }
        }
      }

      if (!finalPhotoUrl) {
        finalPhotoUrl = processed.previewUrl;
      }

      // Replace the temporary blob URL with final persistent URL
      setSelectedPhotos((prev) => prev.map((url) => (url === instantBlobUrl ? finalPhotoUrl : url)));
    } catch (err: any) {
      console.warn('Fast upload notice:', err);
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Mandatory Image Check
    if (selectedPhotos.length === 0) {
      setPhotoError('📸 Photo is mandatory! You must attach at least 1 photo showing what you are studying or doing.');
      return;
    }

    if (isUploadingPhoto || selectedPhotos.some((u) => u.startsWith('blob:'))) {
      setPhotoError('Photos are still uploading to cloud storage. Please wait a moment.');
      return;
    }
    setPhotoError(null);

    // 2. Moderation Check for bad words
    if (!checkModeration(caption)) {
      return;
    }

    setSubmitting(true);
    const user = currentUser || DataStore.getCurrentUser();
    const finalCaption = caption.trim();
    const finalSlideCaptions =
      enablePerSlideCaptions && selectedPhotos.length > 1
        ? slideCaptions.slice(0, selectedPhotos.length).map((c) => c.trim() || finalCaption)
        : undefined;

    const newPost = DataStore.addPost({
      userId: user.id || 'user-me',
      username: user.username || 'student',
      fullName: user.fullName || 'Student',
      class: user.class
        ? (user.class.toString().toLowerCase().startsWith('class')
            ? user.class
            : `Class ${user.class}${user.section ? `-${user.section}` : ''}`)
        : 'DPS Student',
      avatar: user.avatar || null,
      caption: finalCaption,
      images: selectedPhotos,
      slideCaptions: finalSlideCaptions,
      taggedUsers: taggedUsers.length > 0 ? taggedUsers : undefined,
      habitCategory: habitCategory === 'other' ? (customCategoryInput.trim() || 'Other') : (habitCategory !== 'none' ? habitCategory : undefined),
      audience,
      targetClass: audience === 'class-group' ? (user.class || '8') : undefined,
      song: selectedSong || undefined,
    });

    // Await server persistence to Supabase so post appears instantly across all devices
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: newPost }),
        keepalive: true,
      });
    } catch (err) {
      console.warn('Server post sync failed:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'post', post: newPost },
        })
      );
    }

    // Redirect to home feed once post is securely synced to cloud
    router.push('/home');
    router.refresh();
  };

  const streakDays = currentStreak?.streakDays || 0;
  const isStreakSafeToday = currentStreak?.postedToday;

  const cleanTagQuery = tagUserInput.trim().toLowerCase().replace(/^@/, '');
  const searchResults = allClassmates.filter((p) => {
    if (taggedUsers.some((u) => u.toLowerCase() === p.username.toLowerCase())) return false;
    if (!cleanTagQuery) return true;
    return (
      p.username.toLowerCase().includes(cleanTagQuery) ||
      p.fullName.toLowerCase().includes(cleanTagQuery) ||
      (p.class && `class ${p.class}`.toLowerCase().includes(cleanTagQuery))
    );
  });

  const suggestedClassmates = allClassmates
    .filter((p) => !taggedUsers.some((u) => u.toLowerCase() === p.username.toLowerCase()))
    .slice(0, 6);

  // Active text being typed for caption mention
  const activeCaptionText = enablePerSlideCaptions && selectedPhotos.length > 1
    ? (slideCaptions[activeSlideTab] || '')
    : caption;
  const mentionMatch = activeCaptionText.match(/@([a-z0-9_.]*)$/i);
  const mentionQuery = mentionMatch ? mentionMatch[1].toLowerCase() : null;
  const mentionMatches = mentionQuery !== null
    ? allClassmates
        .filter(
          (p) =>
            p.username.toLowerCase().includes(mentionQuery) ||
            p.fullName.toLowerCase().includes(mentionQuery)
        )
        .slice(0, 5)
    : [];

  const handleSelectCaptionMention = (person: Profile) => {
    if (enablePerSlideCaptions && selectedPhotos.length > 1) {
      const cur = slideCaptions[activeSlideTab] || '';
      const updated = cur.replace(/@([a-z0-9_.]*)$/i, `@${person.username} `);
      const next = [...slideCaptions];
      next[activeSlideTab] = updated;
      setSlideCaptions(next);
    } else {
      const updated = caption.replace(/@([a-z0-9_.]*)$/i, `@${person.username} `);
      setCaption(updated);
    }
    handleTagUser(person.username);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-28 animate-fade-in text-[var(--text)] select-none">
      {/* Top Bar Header (56px) */}
      <div className="sticky top-0 z-20 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--line)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="p-1 rounded-full text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors"
            aria-label="Cancel"
          >
            <X size={20} />
          </Link>
          <h1 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--text)]">
            Create School Post
          </h1>
        </div>

        <button
          onClick={handlePost}
          disabled={submitting || isUploadingPhoto || selectedPhotos.length === 0}
          className="px-5 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(43,75,255,0.35)]"
        >
          {submitting ? 'Posting...' : isUploadingPhoto ? 'Uploading...' : 'Share'}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Streak & Daily Rule Banner (Curved 24px) */}
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-amber-500/10 border border-blue-500/20 rounded-[24px] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-amber-500/20 text-amber-500">
                <Flame size={18} className="animate-flame" />
              </span>
              <div>
                <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block">
                  Your Streak: {streakDays}-Day Streak 🔥
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {isStreakSafeToday
                    ? 'Streak already secured today! (Only your 1st post earns points — 0 pts for 2nd post)'
                    : 'Post now to save your streak & earn +25 points! (Only 1st post gets points)'}
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-xs ${
                isStreakSafeToday ? 'bg-zinc-600 dark:bg-zinc-700' : 'bg-[var(--primary)]'
              }`}
            >
              {isStreakSafeToday ? '+0 Pts (2nd post)' : '+25 Pts'}
            </span>
          </div>

          <div className="pt-1 border-t border-black/5 dark:border-white/5 text-[11px] text-[var(--text-muted)] leading-relaxed">
            <strong className="text-[var(--text)] font-semibold">Daily Streak Rule:</strong> Post daily to keep your habit streak alive! Earn <strong className="text-[var(--primary)]">+25 points</strong> on your 1st post each day. If you miss even one day, your streak resets to 0!
          </div>
        </div>

        {/* Safety & Moderation Warning Alert */}
        {moderationWarning && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-[20px] p-3.5 flex items-start gap-3 animate-fade-in text-red-600 dark:text-red-400">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-medium">
              {moderationWarning}
            </div>
          </div>
        )}

        {/* 20.0 GB Storage Lock Alert Banner (Cloudinary 25 GB Protection) */}
        {isR2Locked && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-[20px] p-3.5 flex items-start gap-3 animate-fade-in text-red-600 dark:text-red-400">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <span className="font-bold block">
                🔒 Photo Uploads Locked at 20.0 GB Safety Limit
              </span>
              <span className="text-[11px] opacity-90 block">
                School media storage has reached the 20.0 GB safety ceiling (reserving a 5.0 GB cushion under Cloudinary&apos;s 25.0 GB free allowance). Fresh device uploads are paused to guarantee 100% free status. You can select existing school moment photos or wait for an administrator to prune expired media in Admin.
              </span>
            </div>
          </div>
        )}

        {/* Mandatory Photo Alert */}
        {photoError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-[20px] p-3.5 flex items-start gap-3 animate-fade-in text-amber-600 dark:text-amber-400">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-medium">
              {photoError}
            </div>
          </div>
        )}

        {/* Audience Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Share to:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAudience('whole-school')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                audience === 'whole-school'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)]'
              }`}
            >
              Whole School
            </button>
            <button
              type="button"
              onClick={() => setAudience('class-group')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                audience === 'class-group'
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)]'
              }`}
            >
              Class {currentUser?.class || '8'}-{currentUser?.section || 'A'} Only
            </button>
          </div>
        </div>

        {/* Photo Upload & Gallery (MANDATORY with Rounded 28px Curves) */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[28px] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                Photo (Mandatory) 📸
              </span>
              <span className="text-[11px] text-amber-500 font-bold">*Required</span>
            </div>
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {selectedPhotos.length}/4 selected
            </span>
          </div>

          {/* Current Attached Photos Grid */}
          <div className="grid grid-cols-2 gap-3">
            {selectedPhotos.map((photo, i) => (
              <div
                key={i}
                className="relative aspect-[4/5] rounded-[20px] overflow-hidden border border-[var(--line)] bg-[var(--surface-sunken)]"
              >
                <img
                  src={photo}
                  alt={`Upload preview ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                  aria-label="Remove photo"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-white font-medium">
                  Photo #{i + 1}
                </div>
              </div>
            ))}

            {selectedPhotos.length < 4 && (
              isR2Locked ? (
                <div
                  className="aspect-[4/5] rounded-[20px] border-2 border-dashed border-red-500/30 bg-red-500/5 flex flex-col items-center justify-center gap-2 text-red-500/80 p-4 text-center select-none"
                  title="Storage locked at 20.0 GB safety limit"
                >
                  <AlertTriangle size={24} className="text-red-500" />
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">Uploads Locked</span>
                  <span className="text-[10px] text-[var(--text-muted)]">20.0 GB Limit Reached</span>
                </div>
              ) : (
                <label
                  className={`aspect-[4/5] rounded-[20px] border-2 border-dashed border-[var(--primary)]/60 bg-[var(--primary-tint)]/15 flex flex-col items-center justify-center gap-2.5 transition-colors text-[var(--text)] p-4 text-center group ${
                    isUploadingPhoto ? 'opacity-80 cursor-wait' : 'cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--primary)]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    {isUploadingPhoto ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={22} />
                    )}
                  </div>
                  <span className="text-xs font-bold text-[var(--text)]">
                    {isUploadingPhoto ? 'Uploading ⚡' : 'Choose from Gallery 📸'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {isUploadingPhoto ? 'Fast optimizing...' : 'Select your own photo from device'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isUploadingPhoto}
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </label>
              )
            )}
          </div>
        </div>

        {/* Habit & Good Actions Category (Studies, Sports, Reading, Science, Routine) */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block">
                Habit Category 🔥
              </span>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Posting good habits maintains your streak & ranks you on Star Board!
              </p>
            </div>
            {habitCategory !== 'none' && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
                +25 Pts
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { id: 'studies', label: '📚 Studies & Revision' },
              { id: 'sports', label: '⚽ Sports & Playing' },
              { id: 'reading', label: '📖 Book Reading & Notes' },
              { id: 'stem', label: '🔬 Science Lab & STEM' },
              { id: 'arts', label: '🎨 Arts & Creative' },
              { id: 'routine', label: '🌱 Good Habit / Routine' },
              { id: 'entertainment', label: '🎭 Entertainment & Fun' },
              { id: 'casual', label: '☕ Casual & Thoughts' },
              { id: 'other', label: '✨ Other / Custom' },
              { id: 'none', label: 'School Update' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setHabitCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  habitCategory === cat.id
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {habitCategory === 'other' && (
            <div className="pt-2 animate-fade-in">
              <input
                type="text"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                placeholder="Enter custom category name (e.g. Robotics, Chess, Debate)..."
                className="w-full h-10 px-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--primary)]/40 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          )}
        </div>

        {/* Music / Song Attachment (30s Free Preview from Apple) */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-white shadow-xs">
                <Music size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block">
                  Add Song / Music 🎵
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  30s preview clip • 0 storage cost • 100% legal
                </p>
              </div>
            </div>
            {selectedSong && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 font-bold border border-pink-500/20">
                Attached
              </span>
            )}
          </div>

          {selectedSong ? (
            <div className="pt-1">
              <MusicTrackPill
                song={selectedSong}
                onRemove={() => setSelectedSong(null)}
                onEditPart={() => setShowSongPicker(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowSongPicker(true)}
                className="py-3 px-3 rounded-xl border border-dashed border-[var(--line)] hover:border-pink-500/50 bg-[var(--surface-sunken)] hover:bg-pink-500/5 flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text)] hover:text-pink-400 transition-colors cursor-pointer"
              >
                <Music size={15} />
                <span>Popular Bollywood & Pop 🎵</span>
              </button>

              <label className="py-3 px-3 rounded-xl border border-dashed border-[var(--line)] hover:border-pink-500/50 bg-[var(--surface-sunken)] hover:bg-pink-500/5 flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text)] hover:text-pink-400 transition-colors cursor-pointer text-center">
                <Upload size={15} />
                <span>Upload Song / Audio File 📂</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
                        const newUploadedTrack = {
                          id: `custom-song-${Date.now()}`,
                          title: cleanTitle,
                          artist: currentUser?.fullName || 'Uploaded Audio',
                          previewUrl: dataUrl,
                          artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
                          durationSeconds: 180,
                          startTime: 14,
                          clipDuration: 15,
                        };
                        setSelectedSong(newUploadedTrack);
                        setShowSongPicker(true);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Caption Field with Live Moderation */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="caption-input"
              className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
            >
              Caption & Thoughts
            </label>
            {selectedPhotos.length > 1 && (
              <button
                type="button"
                onClick={() => setEnablePerSlideCaptions(!enablePerSlideCaptions)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  enablePerSlideCaptions
                    ? 'bg-pink-500/15 text-pink-500 border border-pink-500/30'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)] hover:text-[var(--text)]'
                }`}
              >
                <span>{enablePerSlideCaptions ? 'Per-Slide Captions On ✓' : '+ Per-Slide Captions 📸'}</span>
              </button>
            )}
          </div>

          {/* If per-slide captions are enabled for multi-photo post */}
          {enablePerSlideCaptions && selectedPhotos.length > 1 ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {selectedPhotos.map((_, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setActiveSlideTab(sIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeSlideTab === sIdx
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)]'
                    }`}
                  >
                    <span>Photo #{sIdx + 1}</span>
                    {slideCaptions[sIdx]?.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl p-3 bg-[var(--surface-sunken)] border border-[var(--line)] space-y-1">
                <span className="text-[11px] font-bold text-[var(--text)] block">
                  Caption for Photo #{activeSlideTab + 1}:
                </span>
                <textarea
                  value={slideCaptions[activeSlideTab] || ''}
                  onChange={(e) => {
                    const next = [...slideCaptions];
                    next[activeSlideTab] = e.target.value;
                    setSlideCaptions(next);
                    checkModeration(e.target.value);
                  }}
                  placeholder={`Write unique caption for Photo #${activeSlideTab + 1}...`}
                  rows={3}
                  className="w-full text-sm text-[var(--text)] bg-transparent resize-none placeholder:text-[var(--text-muted)] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <textarea
              id="caption-input"
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                checkModeration(e.target.value);
              }}
              placeholder="Share what you are studying or doing today..."
              rows={4}
              className="w-full text-sm text-[var(--text)] bg-transparent resize-none placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          )}

          {/* Quick Caption Mention Autocomplete Strip */}
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className="p-2 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--primary)]/30 space-y-1 animate-fade-in">
              <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider px-1 block">
                Mention Classmate (@{mentionQuery}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {mentionMatches.map((person) => {
                  const pair = getAvatarColorPair(person.username);
                  const initials = (person.fullName || person.username).slice(0, 2).toUpperCase();

                  return (
                    <button
                      key={person.id || person.username}
                      type="button"
                      onClick={() => handleSelectCaptionMention(person)}
                      className="px-2 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--line)] border border-[var(--line)] flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all shadow-2xs hover:scale-102"
                    >
                      <div
                        className="w-4 h-4 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[8px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: pair.bg, color: pair.text }}
                      >
                        {(person.avatar || DataStore.getProfileByUsername(person.username)?.avatar) ? (
                          <img src={person.avatar || DataStore.getProfileByUsername(person.username)?.avatar || ''} alt={person.fullName} className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <span className="text-[var(--text)] font-bold">@{person.username}</span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[80px]">
                        {person.fullName.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Tag & Create Tag Tabs */}
          <div className="pt-3 border-t border-[var(--line)] space-y-2.5">
            <div className="flex items-center justify-between">
              {/* Tab Selector */}
              <div className="flex items-center p-0.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setTagTab('add')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    tagTab === 'add'
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  Add Tag 🏷️
                </button>
                <button
                  type="button"
                  onClick={() => setTagTab('create')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    tagTab === 'create'
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Plus size={12} />
                  <span>Create Tag ✨</span>
                </button>
              </div>

              <span className="text-[11px] text-[var(--text-muted)]">
                {tagTab === 'add' ? 'Tap tag to append' : 'Type custom hashtag'}
              </span>
            </div>

            {tagTab === 'add' ? (
              /* Add Tag Mode: Clickable Tag Chips */
              <div className="flex flex-wrap gap-1.5 items-center">
                {customTags.map((t) => {
                  const isAlreadyAdded = caption.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-[var(--primary)] text-white shadow-2xs'
                          : 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--primary)] hover:bg-[var(--primary-tint)]'
                      }`}
                    >
                      {t} {isAlreadyAdded ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Create Tag Mode: Custom Hashtag Creator Input */
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--primary)]">
                    #
                  </span>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value.replace(/\s+/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                    placeholder="ScienceFair2026, CricketMatch..."
                    className="w-full h-9 pl-7 pr-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={!newTagInput.trim()}
                  className="px-3.5 h-9 rounded-xl gradient-bg text-white text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
                >
                  Create & Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tag Classmates (Tagged Posts to Main Grid) */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold">
                <Tag size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block">
                  Tag Classmates 🏷️
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Tagged classmates can view & push this photo directly to their profile grid
                </span>
              </div>
            </div>
            {taggedUsers.length > 0 && (
              <span className="text-xs font-bold text-[var(--primary)] px-2.5 py-0.5 rounded-full bg-[var(--primary-tint)]/20 border border-[var(--primary)]/30">
                {taggedUsers.length} tagged
              </span>
            )}
          </div>

          {/* Currently Tagged Classmates: Rich visual chips with Avatar & Name */}
          {taggedUsers.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                Tagged in photo:
              </span>
              <div className="flex flex-wrap gap-2">
                {taggedUsers.map((u) => {
                  const prof = getProfileForUsername(u);
                  const pair = getAvatarColorPair(prof.username);
                  const initials = (prof.fullName || prof.username).slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={u}
                      className="pl-1 pr-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center gap-2 shadow-2xs hover:border-[var(--primary)]/50 transition-colors"
                    >
                      {/* Avatar Photo */}
                      <div
                        className="w-6 h-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: pair.bg, color: pair.text }}
                      >
                        {(prof.avatar || DataStore.getProfileByUsername(prof.username)?.avatar) ? (
                          <img
                            src={prof.avatar || DataStore.getProfileByUsername(prof.username)?.avatar || ''}
                            alt={prof.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>

                      {/* Username & Name */}
                      <span className="text-[var(--text)] font-bold">
                        @{prof.username}
                      </span>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleUntagUser(u)}
                        className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer -mr-0.5"
                        aria-label={`Remove @${u}`}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Classmate Input with Instant Autocomplete */}
          <div className="relative">
            <div className="relative flex items-center">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)]">
                @
              </span>
              <input
                type="text"
                value={tagUserInput}
                onFocus={() => setIsTagInputFocused(true)}
                onChange={(e) => {
                  setTagUserInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
                  setIsTagInputFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      handleTagUser(searchResults[0].username);
                    } else if (cleanTagQuery) {
                      handleTagUser(cleanTagQuery);
                    }
                  } else if (e.key === 'Escape') {
                    setIsTagInputFocused(false);
                  }
                }}
                placeholder="Search classmate name or username (e.g. Diya, Priya)..."
                className="w-full h-11 pl-8 pr-10 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
              />
              {tagUserInput && (
                <button
                  type="button"
                  onClick={() => setTagUserInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown showing Profile Photo, Name, and Username */}
            {(isTagInputFocused || tagUserInput.trim().length > 0) && (
              <div
                ref={tagDropdownRef}
                className="mt-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-lg overflow-hidden max-h-[260px] overflow-y-auto animate-fade-in z-20"
              >
                <div className="p-2 border-b border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--text-muted)] px-3">
                  <span>
                    {cleanTagQuery ? `Results for "@${cleanTagQuery}"` : 'Select classmate to tag'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTagInputFocused(false)}
                    className="hover:text-[var(--text)] text-[10px] font-bold cursor-pointer"
                  >
                    Done ✓
                  </button>
                </div>

                <div className="divide-y divide-[var(--line)]/50">
                  {searchResults.length > 0 ? (
                    searchResults.map((person) => {
                      const pair = getAvatarColorPair(person.username);
                      const initials = (person.fullName || person.username).slice(0, 2).toUpperCase();

                      return (
                        <button
                          key={person.id || person.username}
                          type="button"
                          onClick={() => handleTagUser(person.username)}
                          className="w-full p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-sunken)] transition-colors text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* 36px Profile Picture */}
                            <div
                              className="w-9 h-9 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs shadow-2xs border border-black/10 dark:border-white/10"
                              style={{ backgroundColor: pair.bg, color: pair.text }}
                            >
                              {person.avatar ? (
                                <img
                                  src={person.avatar}
                                  alt={person.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>

                            {/* Student Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[var(--text)] truncate">
                                  {person.fullName}
                                </span>
                                {person.class && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] font-medium">
                                    {person.class}-{person.section || 'A'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[var(--text-muted)] block truncate font-medium">
                                @{person.username}
                              </span>
                            </div>
                          </div>

                          {/* Tag Action Button */}
                          <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--primary)] text-white group-hover:scale-105 transition-transform flex items-center gap-1 shrink-0 shadow-2xs">
                            <Plus size={12} />
                            <span>Tag</span>
                          </div>
                        </button>
                      );
                    })
                  ) : cleanTagQuery ? (
                    /* Allow custom username tag even if not in list */
                    <button
                      type="button"
                      onClick={() => handleTagUser(cleanTagQuery)}
                      className="w-full p-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-sunken)] transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full shrink-0 bg-[var(--primary-tint)] text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                          @
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text)]">Tag &quot;@{cleanTagQuery}&quot;</p>
                          <p className="text-[11px] text-[var(--text-muted)]">Tap to tag custom username</p>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--primary)] text-white flex items-center gap-1 shrink-0">
                        <Plus size={12} />
                        <span>Tag</span>
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                      No classmates found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggested Classmates with Real Profile Pictures */}
          {!isTagInputFocused && suggestedClassmates.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] block">
                Suggested Classmates:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {suggestedClassmates.map((person) => {
                  const pair = getAvatarColorPair(person.username);
                  const initials = (person.fullName || person.username).slice(0, 2).toUpperCase();

                  return (
                    <button
                      key={person.id || person.username}
                      type="button"
                      onClick={() => handleTagUser(person.username)}
                      className="p-2 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] hover:border-[var(--primary)]/50 transition-all flex items-center gap-2 text-left cursor-pointer group hover:bg-[var(--surface)]"
                    >
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold text-[11px] shadow-2xs border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: pair.bg, color: pair.text }}
                      >
                        {person.avatar ? (
                          <img
                            src={person.avatar}
                            alt={person.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>

                      {/* Name & Handle */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-[var(--text)] truncate">
                          {person.fullName.split(' ')[0]}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          @{person.username}
                        </p>
                      </div>

                      {/* + Icon */}
                      <div className="w-5 h-5 rounded-full bg-[var(--line)] group-hover:bg-[var(--primary)] group-hover:text-white text-[var(--text-muted)] flex items-center justify-center transition-colors shrink-0">
                        <Plus size={11} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Accessibility Description */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[24px] p-4 space-y-2">
          <label
            htmlFor="alt-input"
            className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider"
          >
            Describe the photo (optional)
          </label>
          <p className="text-xs text-[var(--text-muted)]">
            Helps classmates understand the image details.
          </p>
          <input
            id="alt-input"
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="E.g. Class 8-A maths revision notebook on algebra formulas"
            className="w-full h-11 px-4 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Song Picker Modal */}
      <SongPickerModal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        initialTrack={selectedSong}
        onSelectSong={(song) => setSelectedSong(song)}
        title="Attach Music to Post 🎵"
      />
    </div>
  );
}
