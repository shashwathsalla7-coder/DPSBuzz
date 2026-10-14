'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Grid3X3,
  Bookmark,
  Repeat2,
  MoreHorizontal,
  ShieldCheck,
  Trophy,
  X,
  Copy,
  Share2,
  Flag,
  UserX,
  Check,
  Plus,
  Sparkles,
  Archive,
  Camera,
  Flame,
  Zap,
  Music,
  Heart,
  MessageCircle,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { DataStore, type Profile, type HabitStreak, type SongTrack, type Post } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import StreakTierLadder from '@/components/mascot/StreakTierLadder';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';
import { SongPickerModal } from '@/components/music/SongPickerModal';
import { getClassSections } from '@/config/school';

export default function ProfileClient({ username }: { username: string }) {
  const initialProfile = useMemo(() => {
    const found = DataStore.getProfileByUsername(username);
    if (found) return found;
    return {
      id: 'user-' + username,
      username,
      fullName: username,
      avatar: null,
      bio: 'Student • Classes 6–10',
      class: '8',
      section: 'A',
      role: 'student' as 'admin' | 'student',
      isVerified: false,
      isApproved: true,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      spiritPoints: 0,
      createdAt: new Date().toISOString(),
    };
  }, [username]);

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [postsVersion, setPostsVersion] = useState(0);

  // Interactive Button Modals & Sheets
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showNewHighlightModal, setShowNewHighlightModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showSongPickerModal, setShowSongPickerModal] = useState(false);
  const [showNoteSongPickerModal, setShowNoteSongPickerModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Post Detail & Repost Modals
  const [selectedPostDetail, setSelectedPostDetail] = useState<Post | null>(null);
  const [showDetailRepostSheet, setShowDetailRepostSheet] = useState(false);

  // Reactive listener for content updates and reposts
  useEffect(() => {
    const handleUpdate = () => {
      setPostsVersion((v) => v + 1);
      const updated = DataStore.getProfileByUsername(username);
      if (updated) setProfile(updated);
      setStreaksList(DataStore.getHabitStreaks());
    };
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [username]);

  // Note on avatar
  const [currentNote, setCurrentNote] = useState<string>('Note...');
  const [noteSong, setNoteSong] = useState<SongTrack | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  // Habit streak & Star Board panel state
  const [showHabitPostModal, setShowHabitPostModal] = useState(false);
  const [habitCategory, setHabitCategory] = useState<
    'studies' | 'sports' | 'reading' | 'stem' | 'arts' | 'routine'
  >('studies');
  const [habitCaption, setHabitCaption] = useState('');
  const [habitPhoto, setHabitPhoto] = useState<string | null>(null);
  const habitPhotoInputRef = useRef<HTMLInputElement>(null);
  const [streaksList, setStreaksList] = useState<HabitStreak[]>(() => {
    if (typeof window !== 'undefined') {
      return DataStore.getHabitStreaks();
    }
    return [];
  });

  // Highlights state
  const [highlights, setHighlights] = useState<Array<{ id: string; label: string; emoji: string }>>([
    { id: 'h1', label: 'Sports', emoji: '🏏' },
    { id: 'h2', label: 'Expo', emoji: '🔬' },
  ]);
  const [newHighlightName, setNewHighlightName] = useState('');
  const [newHighlightEmoji, setNewHighlightEmoji] = useState('⭐');

  // Edit profile form state
  const [editFullName, setEditFullName] = useState(initialProfile.fullName);
  const [editBio, setEditBio] = useState(initialProfile.bio || '');
  const [editClass, setEditClass] = useState(initialProfile.class || '8');
  const [editSection, setEditSection] = useState(initialProfile.section || 'A');
  const [editAvatar, setEditAvatar] = useState<string | null>(initialProfile.avatar || null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdateProfileSong = (song: SongTrack | undefined) => {
    const updated = DataStore.updateProfile(username, { song });
    if (updated) {
      setProfile(updated);
      showToast(song ? `Profile song set to "${song.title}" 🎵` : 'Profile song removed');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditAvatar(result);
      showToast('Photo selected from gallery! Click Save Changes to apply 📸');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const found = DataStore.getProfileByUsername(username);
    if (found) {
      setProfile(found);
      setEditFullName(found.fullName);
      setEditBio(found.bio || '');
      setEditClass(found.class || '8');
      setEditSection(found.section || 'A');
      setEditAvatar(found.avatar || null);
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.username.toLowerCase() === username.toLowerCase()) {
            setProfile(parsed);
            setEditFullName(parsed.fullName);
            setEditBio(parsed.bio || '');
            setEditClass(parsed.class || '8');
            setEditSection(parsed.section || 'A');
            setEditAvatar(parsed.avatar || null);
          }
        } catch {}
      }
    }

    try {
      const existingNote = DataStore.getChatNotes().find(
        (n) => n.username.toLowerCase() === username.toLowerCase()
      );
      if (existingNote) {
        setCurrentNote(existingNote.text);
        setNoteSong(existingNote.song || null);
      }
    } catch {}
  }, [username]);

  // Compute live Star Board & habit streak for this student
  const userStreak = useMemo(() => {
    const found = streaksList.find((s) => s.username.toLowerCase() === username.toLowerCase());
    if (found) return found;
    return {
      id: `streak-${username}`,
      username,
      fullName: profile?.fullName || username,
      class: profile?.class ? `${profile.class}-${profile.section || 'A'}` : '8-A',
      streakDays: 0,
      habitPoints: 0,
      primaryHabit: 'Studies' as const,
      habitTag: '#Studies',
      lastPostedDate: new Date().toISOString(),
      postedToday: false,
      recentPostsCount: 0,
      bestStreak: 0,
    };
  }, [streaksList, username, profile]);

  const starBoardRank = useMemo(() => {
    const sorted = [...streaksList].sort((a, b) => {
      if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
      return b.habitPoints - a.habitPoints;
    });
    const idx = sorted.findIndex((s) => s.username.toLowerCase() === username.toLowerCase());
    return idx !== -1 ? idx + 1 : 4;
  }, [streaksList, username]);

  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitCaption.trim() || !profile) return;
    const result = DataStore.recordHabitPost(profile.username, habitCaption.trim(), habitCategory);
    DataStore.addPost({
      userId: profile.id || 'user-me',
      username: profile.username,
      fullName: profile.fullName,
      class: `Class ${profile.class}-${profile.section || 'A'}`,
      avatar: profile.avatar || null,
      images: habitPhoto ? [habitPhoto] : [],
      imageUrl: habitPhoto || undefined,
      caption: `[Habit: ${habitCategory.toUpperCase()}] ${habitCaption.trim()} 🐝🔥 #StarBoard #${habitCategory}`,
    });
    setStreaksList(DataStore.getHabitStreaks());
    showToast(`Habit logged! +${result.points} pts added to Star Board! 🔥✨`);
    setShowHabitPostModal(false);
    setHabitCaption('');
    setHabitPhoto(null);
  };

  if (!profile) {
    return (
      <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Loading profile...
      </div>
    );
  }

  const isOwnProfile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.username && parsed.username.toLowerCase().trim() === profile.username.toLowerCase().trim()) {
          return true;
        }
      }
      const cur = DataStore.getCurrentUser();
      if (cur?.username && cur.username.toLowerCase().trim() === profile.username.toLowerCase().trim()) {
        return true;
      }
    } catch {}
    return false;
  }, [profile.username]);

  const pair = getAvatarColorPair(profile.username);
  const isOfficial = profile.username.toLowerCase() === 'dpsbuzz_official';

  const originalPosts = useMemo(() => {
    const list = DataStore.getPosts(true).filter(
      (p) => p.username.toLowerCase() === profile.username.toLowerCase() && !p.isRepost
    );
    return [...list].sort((a, b) => {
      if (a.timeAgo === 'Just now' || a.id.startsWith('post-')) return -1;
      if (b.timeAgo === 'Just now' || b.id.startsWith('post-')) return 1;
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [profile.username, postsVersion]);

  const repostPosts = useMemo(() => {
    const list = DataStore.getRepostsByUser(profile.username);
    return [...list].sort((a, b) => {
      if (a.timeAgo === 'Just now' || a.id.startsWith('post-')) return -1;
      if (b.timeAgo === 'Just now' || b.id.startsWith('post-')) return 1;
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [profile.username, postsVersion]);

  const savedPosts = useMemo(() => {
    return DataStore.getSavedPosts(profile.username);
  }, [profile.username, postsVersion]);

  const userPosts = useMemo(() => {
    return [...originalPosts, ...repostPosts];
  }, [originalPosts, repostPosts]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Profile = {
      ...profile,
      fullName: editFullName.trim() || profile.fullName,
      bio: editBio.trim(),
      class: '8',
      section: 'G',
      avatar: editAvatar !== undefined ? editAvatar : profile.avatar,
    };
    DataStore.updateProfile(profile.username, {
      fullName: updated.fullName,
      bio: updated.bio,
      class: '8',
      section: 'G',
      avatar: updated.avatar,
    });
    setProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dpsbuzz_user', JSON.stringify(updated));
    }
    setShowEditModal(false);
    showToast('Profile photo and details updated! ✨');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() && !noteSong) return;
    const textToSave = noteInput.trim() || (noteSong ? `Listening to ${noteSong.title} 🎵` : 'Note...');
    setCurrentNote(textToSave);
    if (isOwnProfile) {
      DataStore.saveChatNote({
        text: textToSave,
        song: noteSong || undefined,
      });
      window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
    }
    setNoteInput('');
    setShowNoteModal(false);
    showToast(noteSong ? `Note shared with "${noteSong.title}" 🎵` : 'Note shared! 💭');
  };

  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighlightName.trim()) return;
    setHighlights((prev) => [
      ...prev,
      { id: 'h-' + Date.now(), label: newHighlightName.trim(), emoji: newHighlightEmoji },
    ]);
    setNewHighlightName('');
    setShowNewHighlightModal(false);
    showToast('Highlight added to profile! ⭐');
  };

  const handleCopyProfileLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`);
    }
    setShowProfileOptions(false);
    showToast('Profile link copied to clipboard! 📋');
  };

  const handleShareProfile = async () => {
    setShowProfileOptions(false);
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/u/${profile.username}` : '';
    const shareData = {
      title: `${profile.fullName} (@${profile.username}) • DPS Buzz`,
      text: `Connect with ${profile.fullName} on DPS Buzz 🐝`,
      url: profileUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Profile shared successfully! 🚀');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          if (navigator.clipboard) await navigator.clipboard.writeText(profileUrl);
          showToast('Profile link copied to clipboard! 📋');
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(profileUrl);
      showToast('Profile link copied to clipboard! 📋');
    }
  };

  return (
    <div className="min-h-dvh pb-20 select-none bg-[var(--surface)] text-[var(--text)]">
      {/* Top Mobile Bar with safe area breathing room */}
      <div
        className="flex items-center justify-between px-4 pb-2 border-b transition-all"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
        }}
      >
        <Link
          href="/home"
          className="w-10 h-10 rounded-full flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] border border-transparent hover:border-[var(--line)]"
          style={{ color: 'var(--text)' }}
          aria-label="Back to home"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
          <span>{profile.username}</span>
          {profile.isVerified && (
            <ShieldCheck size={15} style={{ color: 'var(--primary)' }} />
          )}
        </div>
        <button
          onClick={() => setShowProfileOptions(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] active:scale-95 transition-all cursor-pointer border border-[var(--line)] shadow-xs"
          style={{
            color: 'var(--text)',
            backgroundColor: 'var(--surface-sunken)',
          }}
          aria-label="Options"
          title="More options"
        >
          <MoreHorizontal size={20} strokeWidth={2.2} />
        </button>
      </div>

      {/* Main Profile Info Section with Apple-Style Diagonal Light Beam Animation */}
      <div className="px-4 pt-4 pb-3 max-w-[480px] mx-auto space-y-3.5 profile-light-sweep rounded-3xl">
        {/* Row 1: Circular Avatar + Note Bubble (Left) and 3 Stats (Right) */}
        <div className="flex items-center justify-between gap-6">
          {/* Avatar 82px Circle with Interactive Note Bubble */}
          <div className="relative shrink-0">
            {/* Note Bubble (Clickable!) */}
            <button
              onClick={() => setShowNoteModal(true)}
              className="absolute -top-3.5 left-0 z-10 px-2.5 py-0.5 rounded-full shadow-xs text-[10px] font-medium border flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform max-w-[130px]"
              style={{
                backgroundColor: 'var(--surface-sunken)',
                borderColor: 'var(--line)',
                color: 'var(--text)',
              }}
              title="Click to share or edit note"
            >
              {noteSong && (
                <Music size={10} className="text-pink-500 animate-pulse shrink-0" />
              )}
              <span className="truncate">{currentNote}</span>
              <div
                className="absolute -bottom-1 left-3 w-1.5 h-1.5 rotate-45 border-r border-b"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              />
            </button>

            {/* Circular Avatar with Diagonal Light Shimmer */}
            <div className="relative">
              <div
                className="w-[82px] h-[82px] rounded-full flex items-center justify-center font-bold text-xl overflow-hidden border shadow-sm profile-light-sweep"
                style={{
                  backgroundColor: pair.bg,
                  color: pair.text,
                  borderColor: 'var(--line)',
                }}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.fullName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  profile.fullName.slice(0, 2).toUpperCase()
                )}
              </div>

              {/* Camera upload badge for own profile */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(true);
                    setTimeout(() => profilePhotoInputRef.current?.click(), 150);
                  }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center shadow-md border-2 border-[var(--surface)] hover:scale-110 transition-transform cursor-pointer"
                  title="Upload profile photo from gallery"
                  aria-label="Upload profile photo from gallery"
                >
                  <Camera size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 3 Horizontal Stats: Posts, Followers, Following */}
          <div className="flex-1 flex items-center justify-around text-center select-none tabular-nums">
            <div className="cursor-pointer" onClick={() => setActiveTab('posts')}>
              <div className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {userPosts.length || profile.postCount || 0}
              </div>
              <div className="text-[12px] lowercase font-normal" style={{ color: 'var(--text-muted)' }}>
                posts
              </div>
            </div>
            <div className="cursor-pointer" onClick={() => showToast(`${profile.followerCount || 0} students follow @${profile.username}`)}>
              <div className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {profile.followerCount || 0}
              </div>
              <div className="text-[12px] lowercase font-normal" style={{ color: 'var(--text-muted)' }}>
                followers
              </div>
            </div>
            <div className="cursor-pointer" onClick={() => showToast(`@${profile.username} follows ${profile.followingCount || 0} classmates`)}>
              <div className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {profile.followingCount || 0}
              </div>
              <div className="text-[12px] lowercase font-normal" style={{ color: 'var(--text-muted)' }}>
                following
              </div>
            </div>
          </div>
        </div>

        {/* Identity & Bio */}
        <div className="space-y-1">
          <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {profile.fullName}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isOfficial ? 'Official School Office' : `Class ${profile.class}-${profile.section || 'A'} • DPS Student 🐝`}
          </div>
          {profile.bio && (
            <p className="text-xs leading-relaxed whitespace-pre-line pt-0.5" style={{ color: 'var(--text)' }}>
              {profile.bio}
            </p>
          )}

          {/* Star Board Top Rank pill */}
          <div className="pt-1">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border btn-press"
              style={{
                backgroundColor: 'var(--primary-tint)',
                color: 'var(--primary)',
                borderColor: 'var(--line)',
              }}
            >
              <Trophy size={11} />
              <span>Star Board Top Rank this week</span>
            </Link>
          </div>

          {/* Profile Song (Instagram / MySpace Style) */}
          {profile.song ? (
            <div className="pt-2 flex items-center gap-2">
              <MusicTrackPill
                song={profile.song}
                compact
                onRemove={isOwnProfile ? () => handleUpdateProfileSong(undefined) : undefined}
              />
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setShowSongPickerModal(true)}
                  className="text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>
          ) : isOwnProfile ? (
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => setShowSongPickerModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border border-dashed border-[var(--line)] bg-[var(--surface-sunken)] hover:border-pink-500/50 hover:text-pink-400 text-[var(--text-muted)] transition-colors cursor-pointer"
              >
                <Music size={12} />
                <span>+ Add Profile Song 🎵</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2 pt-1">
          {isOwnProfile ? (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 h-9 rounded-full text-xs font-semibold border flex items-center justify-center gap-1 btn-press cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                <span>Edit profile</span>
              </button>
              <button
                onClick={() => setShowArchiveModal(true)}
                className="flex-1 h-9 rounded-full text-xs font-semibold border flex items-center justify-center gap-1 btn-press cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                <span>View archive</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  const currentUser = DataStore.getCurrentUser();
                  if (!currentUser || currentUser.username.toLowerCase().trim() === profile.username.toLowerCase().trim()) {
                    showToast('You cannot follow yourself! 🙅');
                    return;
                  }
                  const isNow = DataStore.toggleFollow(currentUser.username, profile.username);
                  setIsFollowing(isNow);
                  const updated = DataStore.getProfileByUsername(profile.username);
                  if (updated) setProfile(updated);
                  showToast(isNow ? `Following @${profile.username}` : `Unfollowed @${profile.username}`);
                }}
                className="flex-1 h-9 rounded-full text-xs font-semibold btn-press flex items-center justify-center cursor-pointer shadow-xs"
                style={{
                  backgroundColor: isFollowing ? 'var(--surface-sunken)' : 'var(--accent-cta)',
                  color: isFollowing ? 'var(--text)' : 'var(--on-accent-cta)',
                  border: isFollowing ? '1px solid var(--line)' : 'none',
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <Link
                href={`/chats?user=${profile.username}`}
                className="flex-1 h-9 rounded-full text-xs font-semibold border flex items-center justify-center btn-press"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                Message
              </Link>
            </>
          )}
        </div>

        {/* Star Board Standing & Habit Streaks Panel */}
        <div
          className="p-3.5 rounded-[12px] border space-y-3 mt-2 shadow-xs"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-[8px] flex items-center justify-center font-bold text-xs"
                style={{
                  backgroundColor: 'rgba(242, 183, 5, 0.15)',
                  color: '#F2B705',
                }}
              >
                <Trophy size={15} />
              </div>
              <div>
                <h3 className="text-xs font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                  Star Board Standing
                </h3>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Rank & Habit Streaks
                </p>
              </div>
            </div>

            <Link
              href="/leaderboard"
              className="text-[11px] font-bold hover:underline flex items-center gap-1 btn-press"
              style={{ color: 'var(--primary)' }}
            >
              <span>View Leaderboard</span>
              <span>→</span>
            </Link>
          </div>

          {/* 3 Metric Badges */}
          <div className="grid grid-cols-3 gap-2 text-center select-none">
            <div className="p-2 rounded-[8px] border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
              <div className="text-sm font-extrabold tabular-nums font-mono text-[#F2B705]">
                #{starBoardRank}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">School Rank</div>
            </div>

            <div className="p-2 rounded-[8px] border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
              <div className="text-sm font-extrabold tabular-nums font-mono text-emerald-500 flex items-center justify-center gap-1">
                <span className="animate-flame">🔥</span>
                <span>{userStreak.streakDays}d</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Active Streak</div>
            </div>

            <div className="p-2 rounded-[8px] border bg-[var(--surface)]" style={{ borderColor: 'var(--line)' }}>
              <div className="text-sm font-extrabold tabular-nums font-mono text-amber-400">
                ⭐ {userStreak.habitPoints}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Habit Points</div>
            </div>
          </div>

          {/* Embedded Streak Tier Ladder with Good / Better / Best milestones */}
          <StreakTierLadder
            currentStreakDays={userStreak.streakDays}
            habitPoints={userStreak.habitPoints}
            onPostClick={() => setShowHabitPostModal(true)}
          />

          {/* Post Today's Habit button if own profile */}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setShowHabitPostModal(true)}
              className="w-full py-2 px-3 rounded-[8px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all btn-press cursor-pointer hover:opacity-90 shadow-sm"
              style={{
                backgroundColor: 'var(--accent-cta)',
                color: 'var(--on-accent-cta)',
              }}
            >
              <Zap size={14} />
              <span>Post Today&apos;s Habit (+25 Pts)</span>
            </button>
          )}
        </div>

        {/* Highlights Row */}
        <div className="pt-1.5 flex items-center gap-4 overflow-x-auto no-scrollbar">
          {/* (+) New Highlight Button */}
          <div
            onClick={() => setShowNewHighlightModal(true)}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
          >
            <div
              className="w-14 h-14 rounded-full border border-dashed flex items-center justify-center group-hover:border-[var(--primary)] transition-colors"
              style={{
                borderColor: 'var(--line-strong)',
                backgroundColor: 'var(--surface-sunken)',
                color: 'var(--text-muted)',
              }}
            >
              <span className="text-xl font-light leading-none">+</span>
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              New
            </span>
          </div>

          {/* User's Highlights */}
          {highlights.map((h) => (
            <div
              key={h.id}
              onClick={() => showToast(`Opening "${h.label}" highlight stories`)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            >
              <div
                className="w-14 h-14 rounded-full border flex items-center justify-center text-xl transition-transform group-hover:scale-105"
                style={{
                  borderColor: 'var(--line)',
                  backgroundColor: 'var(--surface-sunken)',
                }}
              >
                {h.emoji}
              </div>
              <span className="text-[11px] font-medium truncate max-w-[60px]" style={{ color: 'var(--text)' }}>
                {h.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Tab Bar */}
      <div
        className="flex border-t border-b mt-2 max-w-[480px] mx-auto"
        style={{
          borderColor: 'var(--line)',
        }}
      >
        <button
          onClick={() => setActiveTab('posts')}
          className="flex-1 py-3 flex items-center justify-center btn-press border-b-2 cursor-pointer gap-1.5"
          style={{
            borderColor: activeTab === 'posts' ? 'var(--text)' : 'transparent',
            color: activeTab === 'posts' ? 'var(--text)' : 'var(--text-muted)',
          }}
          aria-label="Posts tab"
        >
          <Grid3X3 size={19} />
          <span className="text-[11px] font-semibold">Posts</span>
        </button>
        <button
          onClick={() => setActiveTab('reposts')}
          className="flex-1 py-3 flex items-center justify-center btn-press border-b-2 cursor-pointer gap-1.5"
          style={{
            borderColor: activeTab === 'reposts' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'reposts' ? 'var(--primary)' : 'var(--text-muted)',
          }}
          aria-label="Reposts tab"
        >
          <Repeat2 size={19} />
          <span className="text-[11px] font-semibold">Reposts</span>
          {repostPosts.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-500 font-bold tabular-nums">
              {repostPosts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className="flex-1 py-3 flex items-center justify-center btn-press border-b-2 cursor-pointer gap-1.5"
          style={{
            borderColor: activeTab === 'saved' ? 'var(--text)' : 'transparent',
            color: activeTab === 'saved' ? 'var(--text)' : 'var(--text-muted)',
          }}
          aria-label="Saved tab"
        >
          <Bookmark size={19} />
          <span className="text-[11px] font-semibold">Saved</span>
          {savedPosts.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-bold tabular-nums">
              {savedPosts.length}
            </span>
          )}
        </button>
      </div>

      {/* Posts Grid */}
      <div className="max-w-[480px] mx-auto px-1 py-2">
        {activeTab === 'posts' ? (
          originalPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {originalPosts.map((post) => {
                const displayImg = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPostDetail(post)}
                    className="aspect-square relative overflow-hidden rounded-[16px] bg-[var(--surface-sunken)] cursor-pointer group border border-[var(--line)] shadow-2xs"
                  >
                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={post.caption}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[var(--text-muted)] p-2 text-center bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                        <span className="font-semibold text-[11px] line-clamp-2">{post.caption.slice(0, 30)}</span>
                      </div>
                    )}
                    {post.likes > 0 && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/50 text-white text-[9px] font-bold flex items-center gap-0.5">
                        <span>❤️</span>
                        <span>{post.likes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                No posts yet
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                When {profile.username} shares photos or projects, they will appear here.
              </p>
            </div>
          )
        ) : activeTab === 'reposts' ? (
          repostPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {repostPosts.map((post) => {
                const displayImg = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);
                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPostDetail(post)}
                    className="aspect-square relative overflow-hidden rounded-[16px] bg-[var(--surface-sunken)] cursor-pointer group border border-[var(--line)] shadow-2xs"
                  >
                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={post.caption}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[var(--text-muted)] p-2 text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                        <span className="font-semibold text-[11px] line-clamp-2">{post.caption.slice(0, 30)}</span>
                      </div>
                    )}
                    {/* Repost attribution overlay */}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs">
                      <Repeat2 size={10} className="text-pink-400" />
                      <span>{post.repostedFrom ? `@${post.repostedFrom.username}` : 'Repost'}</span>
                    </div>
                    {post.likes > 0 && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/50 text-white text-[9px] font-bold flex items-center gap-0.5">
                        <span>❤️</span>
                        <span>{post.likes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--text-muted)]">
                <Repeat2 size={24} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                No reposts yet
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Posts that @{profile.username} reposts will appear here.
              </p>
            </div>
          )
        ) : savedPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {savedPosts.map((post) => {
              const displayImg = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);
              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostDetail(post)}
                  className="aspect-square relative overflow-hidden rounded-[16px] bg-[var(--surface-sunken)] cursor-pointer group border border-[var(--line)] shadow-2xs"
                >
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={post.caption}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[var(--text-muted)] p-2 text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                      <span className="font-semibold text-[11px] line-clamp-2">{post.caption.slice(0, 30)}</span>
                    </div>
                  )}
                  {/* Saved bookmark attribution badge */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs">
                    <Bookmark size={10} className="fill-amber-400 text-amber-400" />
                    <span>Saved</span>
                  </div>
                  {post.likes > 0 && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-black/50 text-white text-[9px] font-bold flex items-center gap-0.5">
                      <span>❤️</span>
                      <span>{post.likes}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--text-muted)]">
              <Bookmark size={24} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              No saved posts yet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Tap the bookmark icon on any post to save it for later. Only you can see what you&apos;ve saved.
            </p>
          </div>
        )}
      </div>

      {/* ─── Post Detail Modal (Interactive view & Repost from Grid) ─────────── */}
      {selectedPostDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => {
            setSelectedPostDetail(null);
            setShowDetailRepostSheet(false);
          }}
        >
          <div
            className="w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border overflow-hidden shadow-2xl flex flex-col"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden border"
                  style={{
                    backgroundColor: getAvatarColorPair(selectedPostDetail.username).bg,
                    color: getAvatarColorPair(selectedPostDetail.username).text,
                    borderColor: 'var(--line)',
                  }}
                >
                  {selectedPostDetail.avatar ? (
                    <img
                      src={selectedPostDetail.avatar}
                      alt={selectedPostDetail.fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    selectedPostDetail.fullName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                      {selectedPostDetail.username}
                    </span>
                    {selectedPostDetail.isRepost && (
                      <span className="text-[10px] font-bold text-pink-500 bg-pink-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                        <Repeat2 size={10} /> Repost
                      </span>
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {selectedPostDetail.class || 'DPS Student'} · {selectedPostDetail.timeAgo}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {(() => {
                  const cur = DataStore.getCurrentUser();
                  const canDelete = cur && (
                    cur.username.toLowerCase() === selectedPostDetail.username.toLowerCase() ||
                    cur.username.toLowerCase() === 'shashwath71845' ||
                    cur.role === 'admin'
                  );
                  if (!canDelete) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
                          if (cur && DataStore.deletePost(selectedPostDetail.id, cur.username)) {
                            showToast('Post deleted successfully 🗑️');
                            setSelectedPostDetail(null);
                            setShowDetailRepostSheet(false);
                            setPostsVersion((v) => v + 1);
                          } else {
                            showToast('Could not delete post');
                          }
                        }
                      }}
                      className="p-1.5 rounded-full hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                      aria-label="Delete post"
                      title="Delete post"
                    >
                      <Trash2 size={18} />
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPostDetail(null);
                    setShowDetailRepostSheet(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Close post detail"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Repost attribution header if this post is a repost */}
            {selectedPostDetail.isRepost && selectedPostDetail.repostedFrom && (
              <div
                className="px-4 py-2 border-b flex items-center gap-2 text-xs font-semibold bg-pink-500/5"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
              >
                <Repeat2 size={14} className="text-pink-400" />
                <span>
                  Reposted from{' '}
                  <span className="text-pink-500 font-bold">
                    @{selectedPostDetail.repostedFrom.username}
                  </span>
                </span>
              </div>
            )}

            {/* Post Image */}
            {(selectedPostDetail.imageUrl || (selectedPostDetail.images && selectedPostDetail.images.length > 0)) && (
              <div className="w-full aspect-square bg-black relative flex items-center justify-center overflow-hidden">
                <img
                  src={selectedPostDetail.imageUrl || selectedPostDetail.images[0]}
                  alt={selectedPostDetail.caption}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Action Row */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPostDetail((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null));
                    showToast('Liked post! ❤️');
                  }}
                  className="flex items-center gap-1 text-xs font-semibold hover:text-red-500 transition-colors cursor-pointer"
                  style={{ color: 'var(--text)' }}
                >
                  <Heart size={20} className={selectedPostDetail.likes > 0 ? 'fill-red-500 text-red-500' : ''} />
                  <span>{selectedPostDetail.likes || 0}</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Comments available on Home feed 💬')}
                  className="flex items-center gap-1 text-xs font-semibold hover:text-[var(--primary)] transition-colors cursor-pointer"
                  style={{ color: 'var(--text)' }}
                >
                  <MessageCircle size={20} />
                  <span>{selectedPostDetail.comments || 0}</span>
                </button>
                {/* Repost Trigger */}
                <button
                  type="button"
                  onClick={() => setShowDetailRepostSheet(true)}
                  className="flex items-center gap-1 text-xs font-semibold hover:text-pink-500 transition-colors cursor-pointer text-pink-500"
                  title="Repost this post"
                >
                  <Repeat2 size={21} />
                  <span>Repost</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Bookmark / Save / Unsave toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const cur = DataStore.getCurrentUser();
                    if (!cur) return;
                    const saved = DataStore.toggleSavePost(selectedPostDetail.id, cur.username);
                    setPostsVersion((v) => v + 1);
                    showToast(saved ? 'Post saved to bookmarks! 🔖' : 'Post unsaved from bookmarks! ❌');
                  }}
                  className="p-1 text-xs font-semibold hover:text-amber-400 transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title={DataStore.isPostSaved(selectedPostDetail.id, DataStore.getCurrentUser()?.username) ? 'Unsave post' : 'Save post'}
                >
                  <Bookmark
                    size={19}
                    className={
                      DataStore.isPostSaved(selectedPostDetail.id, DataStore.getCurrentUser()?.username)
                        ? 'fill-amber-400 text-amber-400'
                        : ''
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.origin + `/u/${selectedPostDetail.username}`);
                    showToast('Post link copied! 📋');
                  }}
                  className="p-1 text-xs font-semibold hover:text-[var(--primary)] transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* Caption */}
            <div className="p-4 space-y-2">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                <span className="font-bold mr-1.5">@{selectedPostDetail.username}</span>
                <span>{selectedPostDetail.caption}</span>
              </p>
            </div>

            {/* Repost Options Bottom Sheet */}
            {showDetailRepostSheet && (
              <div
                className="p-4 border-t space-y-2.5 animate-slide-up"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                <p className="text-xs font-bold text-center" style={{ color: 'var(--text)' }}>
                  Repost Options 🔄
                </p>

                {/* Undo Repost / Unrepost Option */}
                {(() => {
                  const cur = DataStore.getCurrentUser();
                  const canUnrepost = cur && (
                    DataStore.hasUserReposted(selectedPostDetail.id, cur.username) ||
                    (selectedPostDetail.isRepost && selectedPostDetail.username.toLowerCase() === cur.username.toLowerCase())
                  );
                  if (!canUnrepost) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (DataStore.unrepostPost(selectedPostDetail.id, cur.username)) {
                          showToast('Repost undone (unreposted)! 🔄');
                          setPostsVersion((v) => v + 1);
                          setShowDetailRepostSheet(false);
                          setSelectedPostDetail(null);
                        } else {
                          showToast('Could not undo repost');
                        }
                      }}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-red-500/30 text-red-500 bg-red-500/10 cursor-pointer hover:bg-red-500/20 transition-colors"
                    >
                      <Repeat2 size={16} />
                      <span>Undo Repost (Unrepost) 🔄</span>
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    const cur = DataStore.getCurrentUser();
                    if (!cur) return;
                    const res = DataStore.repostPost(selectedPostDetail.id, cur.username);
                    if (res) {
                      showToast('Reposted to feed! Check Reposts tab 🔄✨');
                      setPostsVersion((v) => v + 1);
                      setShowDetailRepostSheet(false);
                      setSelectedPostDetail(null);
                      setActiveTab('reposts');
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-[var(--accent-cta)] text-[var(--on-accent-cta)] cursor-pointer hover:opacity-95"
                >
                  <Repeat2 size={16} />
                  <span>Repost to Feed (shows in Reposts tab) 🔄</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cur = DataStore.getCurrentUser();
                    if (!cur) return;
                    const res = DataStore.repostToStory(selectedPostDetail.id, cur.username);
                    if (res) {
                      showToast('Added to your 24h story! ⚡');
                      setShowDetailRepostSheet(false);
                      setSelectedPostDetail(null);
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer hover:bg-[var(--line)]"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                >
                  <span>⚡</span>
                  <span>Add to Your 24h Story</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailRepostSheet(false)}
                  className="w-full py-1.5 text-[11px] font-semibold text-center cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 1. Profile Options Bottom Sheet ──────────────────────────────── */}
      {showProfileOptions && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowProfileOptions(false)}
        >
          <div
            className="w-full max-w-[400px] border divide-y rounded-[28px] overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCopyProfileLink}
              className="w-full py-3.5 px-4 text-xs font-semibold text-left flex items-center gap-3 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              <Copy size={16} />
              <span>Copy Profile Link</span>
            </button>
            <button
              onClick={handleShareProfile}
              className="w-full py-3.5 px-4 text-xs font-semibold text-left flex items-center gap-3 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              <Share2 size={16} />
              <span>Share this Profile</span>
            </button>
            <button
              onClick={() => {
                setShowProfileOptions(false);
                showToast(`Reported @${profile.username} to school moderators.`);
              }}
              className="w-full py-3.5 px-4 text-xs font-semibold text-left flex items-center gap-3 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--danger)' }}
            >
              <Flag size={16} />
              <span>Report Account</span>
            </button>
            <button
              onClick={() => {
                setShowProfileOptions(false);
                showToast(`Blocked @${profile.username}. You won't see their posts.`);
              }}
              className="w-full py-3.5 px-4 text-xs font-semibold text-left flex items-center gap-3 hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--danger)' }}
            >
              <UserX size={16} />
              <span>Block @{profile.username}</span>
            </button>
            <button
              onClick={() => setShowProfileOptions(false)}
              className="w-full py-3 px-4 text-xs font-bold text-center hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. Edit Profile Modal ────────────────────────────────────────── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-[420px] max-h-[85vh] sm:max-h-[80vh] border rounded-t-[28px] sm:rounded-[28px] overflow-hidden flex flex-col shadow-2xl"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <span className="text-sm font-bold">Edit Profile</span>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="edit-profile-form" onSubmit={handleSaveProfile} className="p-4 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
              {/* Photo Upload from Device Gallery - Circle Profile Logo */}
              <div className="flex flex-col items-center justify-center gap-2 pb-2 border-b border-[var(--line)]">
                <input
                  ref={profilePhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl overflow-hidden border-2 cursor-pointer relative group"
                  style={{
                    backgroundColor: pair.bg,
                    color: pair.text,
                    borderColor: 'var(--primary)',
                  }}
                  onClick={() => profilePhotoInputRef.current?.click()}
                  title="Click to select photo from gallery"
                >
                  {(editAvatar || profile.avatar) ? (
                    <img
                      src={editAvatar || profile.avatar!}
                      alt="Profile preview"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    profile.fullName.slice(0, 2).toUpperCase()
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold bg-[var(--surface-sunken)] hover:bg-[var(--line)] border border-[var(--line)] rounded-full flex items-center gap-1.5 cursor-pointer transition-colors"
                    style={{ color: 'var(--text)' }}
                  >
                    <Camera size={14} style={{ color: 'var(--primary)' }} />
                    <span>Upload from Gallery 📸</span>
                  </button>

                  {(editAvatar || profile.avatar) && (
                    <button
                      type="button"
                      onClick={() => setEditAvatar(null)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:text-red-300 border border-red-500/30 rounded-full cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] text-center">
                  Select your portrait from device gallery
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border rounded-xl focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  BIO (MAX 150 CHARACTERS)
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full text-xs p-3 border rounded-xl resize-none focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              {/* Class & Section locked permanently to Class 8-G (dropdown removed) */}
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  CLASS & SECTION
                </label>
                <div
                  className="w-full text-xs px-3 py-2.5 border rounded-xl flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                >
                  <span className="font-bold">Class 8-G (Section G)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/30">
                    🔒 Class 8-G
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Registered school class is fixed to Class 8-G.
                </p>
              </div>
            </form>

            {/* Pinned Sticky Bottom Footer with Save Changes Button */}
            <div
              className="p-3 border-t flex gap-2 flex-shrink-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold border rounded-xl cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-profile-form"
                className="flex-1 py-2.5 text-xs font-bold rounded-xl btn-press cursor-pointer shadow-md"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Archive Modal ─────────────────────────────────────────────── */}
      {showArchiveModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowArchiveModal(false)}
        >
          <div
            className="w-full max-w-[420px] max-h-[70vh] flex flex-col border rounded-full overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2">
                <Archive size={16} style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-bold">Story & Post Archive</span>
              </div>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="p-1 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Your vanished 24-hour stories are saved here privately:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { title: 'Maths test prep', time: 'Oct 8', color: '#1E3A8A' },
                  { title: 'Cricket win', time: 'Oct 5', color: '#B7791F' },
                  { title: 'Campus rains', time: 'Sep 29', color: '#0B9DB0' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="aspect-[9/12] p-2 flex flex-col justify-between text-white text-[10px] font-bold border border-white/10 rounded-full shadow-sm cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: item.color }}
                    onClick={() => showToast(`Replaying archived story: "${item.title}"`)}
                  >
                    <span>{item.time}</span>
                    <span className="line-clamp-2 leading-tight">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. New Highlight Modal ───────────────────────────────────────── */}
      {showNewHighlightModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowNewHighlightModal(false)}
        >
          <div
            className="w-full max-w-[380px] border rounded-full overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--line)' }}
            >
              <span className="text-sm font-bold">New Story Highlight</span>
              <button
                onClick={() => setShowNewHighlightModal(false)}
                className="p-1 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHighlight} className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  HIGHLIGHT TITLE
                </label>
                <input
                  type="text"
                  value={newHighlightName}
                  onChange={(e) => setNewHighlightName(e.target.value)}
                  placeholder="e.g. Science Fair, Sports Day"
                  maxLength={15}
                  className="w-full text-xs px-3 py-2 border rounded-full focus:outline-none"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  PICK COVER EMOJI
                </label>
                <div className="flex gap-2">
                  {['⭐', '🏆', '🎨', '🚀', '🎸', '⚽'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewHighlightEmoji(em)}
                      className={`w-9 h-9 border text-base flex items-center justify-center cursor-pointer rounded-full ${
                        newHighlightEmoji === em ? 'border-2 border-[var(--primary)] bg-[var(--primary-tint)]' : 'border-[var(--line)]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewHighlightModal(false)}
                  className="flex-1 py-2 text-xs font-semibold border rounded-full cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newHighlightName.trim()}
                  className="flex-1 py-2 text-xs font-bold rounded-full btn-press cursor-pointer disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                  }}
                >
                  Add Highlight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 5. Note Modal ────────────────────────────────────────────────── */}
      {showNoteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowNoteModal(false)}
        >
          <div
            className="w-full max-w-[380px] border rounded-[28px] overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--line)' }}
            >
              <span className="text-sm font-bold">Share a Thought / Note</span>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="p-1 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-4 space-y-3">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Share what&apos;s on your mind. Friends will see your note floating above your profile picture for 24 hours.
              </p>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Studying for physics test 🔬"
                maxLength={60}
                className="w-full text-xs px-3 py-2 border rounded-full focus:outline-none"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
                autoFocus
              />
              <div className="flex justify-between items-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span>Vanishes in 24 hours</span>
                <span>{noteInput.length}/60</span>
              </div>

              {/* Note Song Attachment */}
              <div
                className="p-2.5 rounded-[18px] border flex items-center justify-between gap-2"
                style={{ backgroundColor: 'var(--surface-sunken)', borderColor: 'var(--line)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-pink-500/15 text-pink-500 flex items-center justify-center shrink-0">
                    <Music size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate" style={{ color: 'var(--text)' }}>
                      {noteSong ? noteSong.title : 'Attach song to note 🎵'}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] truncate">
                      {noteSong ? `${noteSong.artist} • 30s preview` : 'Apple iTunes Preview'}
                    </p>
                  </div>
                </div>
                {noteSong ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowNoteSongPickerModal(true)}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteSong(null)}
                      className="w-6 h-6 rounded-full flex items-center justify-center border border-[var(--line)] text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                      aria-label="Remove note song"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNoteSongPickerModal(true)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--primary)] text-white hover:opacity-90 cursor-pointer"
                  >
                    Pick Song
                  </button>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 py-2 text-xs font-semibold border rounded-full cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!noteInput.trim() && !noteSong}
                  className="flex-1 py-2 text-xs font-bold rounded-full btn-press cursor-pointer disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                  }}
                >
                  Share Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Habit Post Modal for Star Board */}
      {showHabitPostModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-[16px] p-5 space-y-4 border shadow-2xl animate-fade-in"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg animate-flame">🔥</span>
                <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                  Log Habit for Star Board
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHabitPostModal(false)}
                className="p-1 rounded-full hover:bg-[var(--surface-sunken)] cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close habit modal"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Share your positive habit (studies, sports, reading) to keep your streak safe and earn +25 points!
            </p>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--text)' }}>
                Habit Category
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'studies', label: 'Studies 📚' },
                  { id: 'sports', label: 'Sports ⚽' },
                  { id: 'reading', label: 'Reading 📖' },
                  { id: 'stem', label: 'STEM 🔬' },
                  { id: 'arts', label: 'Arts 🎨' },
                  { id: 'routine', label: 'Routine 🌱' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setHabitCategory(cat.id as any)}
                    className={`py-1.5 px-2 rounded-[6px] text-xs font-semibold border transition-all cursor-pointer ${
                      habitCategory === cat.id ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--line)]'
                    }`}
                    style={{
                      backgroundColor: habitCategory === cat.id ? 'var(--primary-tint)' : 'var(--surface-sunken)',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--text)' }}>
                What did you accomplish today?
              </label>
              <textarea
                rows={3}
                value={habitCaption}
                onChange={(e) => setHabitCaption(e.target.value)}
                placeholder="e.g. Solved 15 algebra equations and reviewed chemistry practicals..."
                className="w-full p-2.5 rounded-[8px] text-xs border outline-none focus:ring-1 focus:ring-[var(--primary)]"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
            </div>

            {/* Gallery Photo Upload Option */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--text)' }}>
                Attach Photo from Gallery (Optional) 📸
              </label>
              <input
                ref={habitPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setHabitPhoto(ev.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {habitPhoto ? (
                <div className="relative w-full h-28 rounded-xl overflow-hidden border border-[var(--line)]">
                  <img src={habitPhoto} alt="Habit upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setHabitPhoto(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                    aria-label="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => habitPhotoInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-sunken)] hover:border-[var(--primary)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Camera size={15} style={{ color: 'var(--primary)' }} />
                  <span>Choose Photo from Gallery</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowHabitPostModal(false)}
                className="px-3.5 py-2 rounded-[8px] text-xs font-semibold border btn-press cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleHabitSubmit}
                disabled={!habitCaption.trim()}
                className="px-4 py-2 rounded-[8px] text-xs font-bold btn-press cursor-pointer transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                }}
              >
                Post Habit (+25) 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast Banner ─────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-20 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-fade-in">
          <div
            className="px-4 py-2 text-xs font-bold text-white shadow-xl flex items-center gap-2 rounded-full"
            style={{ backgroundColor: '#17181C', border: '1px solid #333' }}
          >
            <Check size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Profile Song Picker Modal */}
      <SongPickerModal
        isOpen={showSongPickerModal}
        onClose={() => setShowSongPickerModal(false)}
        onSelectSong={(song) => handleUpdateProfileSong(song)}
        title="Choose Your Profile Song 🎵"
      />

      {/* Note Song Picker Modal */}
      <SongPickerModal
        isOpen={showNoteSongPickerModal}
        onClose={() => setShowNoteSongPickerModal(false)}
        onSelectSong={(song) => {
          setNoteSong(song);
          setShowNoteSongPickerModal(false);
        }}
        title="Add Song to Note 🎵"
      />
    </div>
  );
}
