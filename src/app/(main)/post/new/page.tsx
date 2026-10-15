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
} from 'lucide-react';
import { DataStore, HabitStreak, StorageAnalytics, type SongTrack } from '@/lib/dataStore';
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
  const [altText, setAltText] = useState('');
  const [habitCategory, setHabitCategory] = useState<
    'studies' | 'sports' | 'reading' | 'stem' | 'arts' | 'routine' | 'none'
  >('studies');
  const [submitting, setSubmitting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongTrack | null>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Feature 2: Different Captions per Carousel Slide
  const [slideCaptions, setSlideCaptions] = useState<string[]>(['', '', '', '']);
  const [enablePerSlideCaptions, setEnablePerSlideCaptions] = useState(false);
  const [activeSlideTab, setActiveSlideTab] = useState(0);

  // Feature 3: Tagged Classmates (pushed to Main Grid)
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [tagUserInput, setTagUserInput] = useState('');

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

    const handleStorageUpdate = () => {
      setStorageAnalytics(DataStore.getStorageAnalytics());
    };
    window.addEventListener('dpsbuzz:content_updated', handleStorageUpdate);
    return () => window.removeEventListener('dpsbuzz:content_updated', handleStorageUpdate);
  }, []);

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

      // 2. Request Signed Upload Authorization from Server
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
      let finalPhotoUrl = processed.previewUrl;

      // 3. Direct upload to Cloudinary (if configured)
      if (res.ok && data.success && data.provider === 'cloudinary' && !data.isMock && data.uploadUrl && data.signature) {
        const formData = new FormData();
        formData.append('file', processed.blob);
        formData.append('api_key', data.apiKey);
        formData.append('timestamp', String(data.timestamp));
        formData.append('signature', data.signature);
        formData.append('folder', data.folder);

        const cloudRes = await fetch(data.uploadUrl, {
          method: 'POST',
          body: formData,
        });

        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) {
          finalPhotoUrl = cloudData.secure_url;
        }
      } else {
        // Fast local persistent server upload: saves to public/uploads/posts/
        try {
          const localFormData = new FormData();
          localFormData.append('file', processed.blob, processed.file.name);
          localFormData.append('folder', 'posts');

          const localUploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: localFormData,
          });

          if (localUploadRes.ok) {
            const localData = await localUploadRes.json();
            if (localData.success && localData.url) {
              finalPhotoUrl = localData.url;
            }
          }
        } catch {
          finalPhotoUrl = processed.previewUrl;
        }
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

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Mandatory Image Check
    if (selectedPhotos.length === 0) {
      setPhotoError('📸 Photo is mandatory! You must attach at least 1 photo showing what you are studying or doing.');
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
      habitCategory: habitCategory !== 'none' ? habitCategory : undefined,
      song: selectedSong || undefined,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpsbuzz:content_updated', {
          detail: { type: 'post', post: newPost },
        })
      );
    }

    // Instant redirect without artificial delay
    router.push('/home');
    router.refresh();
  };

  const streakDays = currentStreak?.streakDays || 0;
  const isStreakSafeToday = currentStreak?.postedToday;

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
          disabled={submitting || selectedPhotos.length === 0}
          className="px-5 py-2 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(43,75,255,0.35)]"
        >
          {submitting ? 'Posting...' : 'Share'}
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
            <strong className="text-[var(--text)] font-semibold">1st Post Points Rule:</strong> Only the first post you share each day earns streak points. Second and subsequent posts will keep your feed active but will not add extra points.
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
              Class 8-G Only
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
              { id: 'none', label: 'School Update' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setHabitCategory(cat.id as any)}
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
                        setSelectedSong({
                          id: `custom-song-${Date.now()}`,
                          title: cleanTitle,
                          artist: currentUser?.fullName || 'Uploaded Audio',
                          previewUrl: dataUrl,
                          artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
                        });
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
                  Tagged classmates can push this photo directly to their primary profile grid
                </span>
              </div>
            </div>
            {taggedUsers.length > 0 && (
              <span className="text-xs font-bold text-[var(--primary)]">
                {taggedUsers.length} tagged
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)]">
                @
              </span>
              <input
                type="text"
                value={tagUserInput}
                onChange={(e) => setTagUserInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const clean = tagUserInput.trim();
                    if (clean && !taggedUsers.includes(clean)) {
                      setTaggedUsers((prev) => [...prev, clean]);
                      setTagUserInput('');
                    }
                  }
                }}
                placeholder="Type classmate username (e.g. priya_7b)..."
                className="w-full h-10 pl-7 pr-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const clean = tagUserInput.trim();
                if (clean && !taggedUsers.includes(clean)) {
                  setTaggedUsers((prev) => [...prev, clean]);
                  setTagUserInput('');
                }
              }}
              disabled={!tagUserInput.trim()}
              className="px-3.5 h-10 rounded-xl gradient-bg text-white text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
            >
              Tag
            </button>
          </div>

          {taggedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {taggedUsers.map((u) => (
                <span
                  key={u}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-500 border border-pink-500/20 flex items-center gap-1.5"
                >
                  <span>@{u}</span>
                  <button
                    type="button"
                    onClick={() => setTaggedUsers((prev) => prev.filter((item) => item !== u))}
                    className="hover:text-red-500 cursor-pointer"
                    aria-label={`Remove @${u}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick suggestions from school */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['priya_7b', 'rahul_9a', 'sneha_10c', 'karthik_6a']
              .filter((suggested) => !taggedUsers.includes(suggested))
              .map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => setTaggedUsers((prev) => [...prev, suggested])}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line)] cursor-pointer transition-colors"
                >
                  + @{suggested}
                </button>
              ))}
          </div>
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
        onSelectSong={(song) => setSelectedSong(song)}
        title="Attach Music to Post 🎵"
      />
    </div>
  );
}
