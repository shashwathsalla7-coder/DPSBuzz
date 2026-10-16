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
  Phone,
  Video,
  Pin,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Tag,
  Maximize2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { DataStore, type Profile, type HabitStreak, type SongTrack, type Post, type ProfileHighlight } from '@/lib/dataStore';
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
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'tagged' | 'saved'>('posts');
  const [postsVersion, setPostsVersion] = useState(0);

  const isDeletedOrMissing = useMemo(() => {
    const clean = (username || '').toLowerCase().trim();
    if (!clean) return true;
    if (DataStore.getDeletedUsernames().has(clean)) return true;
    const profileExists = DataStore.getProfiles().some(
      (p) => p && p.username && p.username.toLowerCase().trim() === clean
    );
    return !profileExists;
  }, [username, postsVersion]);

  // Persistent follow status check for the viewer and the profile on load
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cur = DataStore.getCurrentUser();
      if (cur?.username && cur.username.toLowerCase() !== 'guest') {
        return DataStore.isFollowing(cur.username, username);
      }
    }
    return false;
  });

  const [isRequested, setIsRequested] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cur = DataStore.getCurrentUser();
      if (cur?.username && cur.username.toLowerCase() !== 'guest') {
        return DataStore.isFollowRequested(cur.username, username);
      }
    }
    return false;
  });

  const [isFollowedBy, setIsFollowedBy] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cur = DataStore.getCurrentUser();
      if (cur?.username && cur.username.toLowerCase() !== 'guest') {
        return DataStore.isFollowedBy(cur.username, username);
      }
    }
    return false;
  });

  const [hasIncomingRequest, setHasIncomingRequest] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cur = DataStore.getCurrentUser();
      if (cur?.username && cur.username.toLowerCase() !== 'guest') {
        return DataStore.isFollowRequested(username, cur.username);
      }
    }
    return false;
  });

  // Interactive Button Modals & Sheets
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showNewHighlightModal, setShowNewHighlightModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showSongPickerModal, setShowSongPickerModal] = useState(false);
  const [showNoteSongPickerModal, setShowNoteSongPickerModal] = useState(false);
  const [showPostSongPickerModal, setShowPostSongPickerModal] = useState(false);
  const [showEnlargedPhoto, setShowEnlargedPhoto] = useState(false);
  const [detailSlideIndex, setDetailSlideIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Followers & Following interactive modal state
  const [showFollowListModal, setShowFollowListModal] = useState(false);
  const [followListModalTab, setFollowListModalTab] = useState<'followers' | 'following'>('followers');
  const [followListSearchQuery, setFollowListSearchQuery] = useState('');

  // Post Detail & Repost Modals
  const [selectedPostDetail, setSelectedPostDetail] = useState<Post | null>(null);
  const [showDetailRepostSheet, setShowDetailRepostSheet] = useState(false);
  const [showDetailComments, setShowDetailComments] = useState(false);
  const [detailCommentText, setDetailCommentText] = useState('');
  const [detailCommentsMap, setDetailCommentsMap] = useState<Record<string, any[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('dpsbuzz_comments_v1');
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  // Long-press peek & pop preview state (Instagram-style Peek & Pop with quick actions)
  const [peekPost, setPeekPost] = useState<Post | null>(null);
  const [peekFitMode, setPeekFitMode] = useState<'cover' | 'contain'>('cover');
  const [peekLikedPosts, setPeekLikedPosts] = useState<Record<string, boolean>>({});
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);
  const justLongPressedRef = useRef<boolean>(false);

  // Close peek on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && peekPost) {
        setPeekPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [peekPost]);

  const startLongPress = (post: Post, e: React.TouchEvent | React.MouseEvent) => {
    if (isRearrangeMode) return;
    if ('touches' in e && e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      touchStartPosRef.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    }
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      justLongPressedRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(45);
        } catch {}
      }
      setPeekPost(post);
      setPeekFitMode('cover');
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || e.touches.length === 0) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelLongPress();
    }
  };

  const handleTouchEnd = () => {
    cancelLongPress();
    if (justLongPressedRef.current) {
      setTimeout(() => {
        justLongPressedRef.current = false;
      }, 300);
    }
  };

  const getLongPressProps = (post: Post, onClickFallback: () => void) => ({
    onTouchStart: (e: React.TouchEvent) => startLongPress(post, e),
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: (e: React.MouseEvent) => startLongPress(post, e),
    onMouseUp: cancelLongPress,
    onMouseLeave: cancelLongPress,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isRearrangeMode) {
        setPeekPost(post);
        setPeekFitMode('cover');
      }
    },
    onClick: () => {
      if (justLongPressedRef.current || isLongPressActiveRef.current) return;
      onClickFallback();
    },
  });

  // Reactive listener for content updates and reposts
  useEffect(() => {
    const handleUpdate = () => {
      setPostsVersion((v) => v + 1);
      const updated = DataStore.getProfileByUsername(username);
      if (updated) setProfile(updated);
      setStreaksList(DataStore.getHabitStreaks());
      const cur = DataStore.getCurrentUser();
      if (cur?.username && cur.username.toLowerCase() !== 'guest') {
        setIsFollowing(DataStore.isFollowing(cur.username, username));
        setIsRequested(DataStore.isFollowRequested(cur.username, username));
        setIsFollowedBy(DataStore.isFollowedBy(cur.username, username));
        setHasIncomingRequest(DataStore.isFollowRequested(username, cur.username));
      }
    };
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [username]);

  // Check if active profile belongs to current logged-in user
  const isOwnProfile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('dpsbuzz_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.username && parsed.username.toLowerCase() !== 'guest') {
          if (parsed.username.toLowerCase().trim() === profile.username.toLowerCase().trim()) {
            if (parsed.username.toLowerCase() === 'shashwath71845') {
              return localStorage.getItem('dpsbuzz_shashwath_authenticated') === 'true';
            }
            return true;
          }
        }
      }
      const cur = DataStore.getCurrentUser();
      if (cur?.username && cur.username.toLowerCase() !== 'guest') {
        if (cur.username.toLowerCase().trim() === profile.username.toLowerCase().trim()) {
          if (cur.username.toLowerCase() === 'shashwath71845') {
            return localStorage.getItem('dpsbuzz_shashwath_authenticated') === 'true';
          }
          return true;
        }
      }
    } catch {}
    return false;
  }, [profile.username]);

  // Note on avatar: specifically for the profile being viewed
  const profileNote = useMemo(() => {
    return DataStore.getNoteForUser(profile.username);
  }, [profile.username, postsVersion]);

  const [currentNote, setCurrentNote] = useState<string>(() => {
    const existing = DataStore.getNoteForUser(username);
    if (existing) return existing.text;
    return isOwnProfile ? 'Note...' : '';
  });
  const [noteSong, setNoteSong] = useState<SongTrack | null>(() => {
    const existing = DataStore.getNoteForUser(username);
    return existing?.song || null;
  });
  const [noteInput, setNoteInput] = useState<string>('');

  useEffect(() => {
    if (profileNote) {
      setCurrentNote(profileNote.text);
      setNoteSong(profileNote.song || null);
    } else {
      setCurrentNote(isOwnProfile ? 'Note...' : '');
      setNoteSong(null);
    }
  }, [profileNote, isOwnProfile]);

  // Active story detection for story gradient ring
  const userStories = useMemo(() => {
    return DataStore.getStories().filter(
      (s) => s.username.toLowerCase().trim() === profile.username.toLowerCase().trim()
    );
  }, [profile.username, postsVersion]);
  const hasActiveStory = userStories.length > 0;

  // Highlights state: per-user, owner-managed from DataStore
  const [highlights, setHighlights] = useState<ProfileHighlight[]>(() => {
    if (typeof window !== 'undefined') {
      return DataStore.getHighlights(username);
    }
    return [];
  });
  const [newHighlightName, setNewHighlightName] = useState('');
  const [newHighlightEmoji, setNewHighlightEmoji] = useState('⭐');
  const [newHighlightText, setNewHighlightText] = useState('');
  const [newHighlightImage, setNewHighlightImage] = useState<string | null>(null);
  const [newHighlightBg, setNewHighlightBg] = useState('linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)');
  const [activeHighlight, setActiveHighlight] = useState<ProfileHighlight | null>(null);
  const highlightFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && profile?.username) {
      setHighlights(DataStore.getHighlights(profile.username));
    }
  }, [profile?.username, postsVersion]);

  // Listen for call errors to surface clear feedback to user
  useEffect(() => {
    const handleCallError = (e: any) => {
      if (e.detail?.message) {
        showToast(e.detail.message);
      }
    };
    window.addEventListener('dpsbuzz:call_error', handleCallError);
    return () => window.removeEventListener('dpsbuzz:call_error', handleCallError);
  }, []);

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

  // Edit profile form state
  const [editFullName, setEditFullName] = useState(initialProfile.fullName);
  const [editBio, setEditBio] = useState(initialProfile.bio || '');
  const [editClass, setEditClass] = useState(initialProfile.class || '8');
  const [editSection, setEditSection] = useState(initialProfile.section || 'A');
  const [editAvatar, setEditAvatar] = useState<string | null>(initialProfile.avatar || null);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddDetailComment = (postId: string) => {
    const trimmed = detailCommentText.trim();
    if (!trimmed) return;
    const cur = DataStore.getCurrentUser();
    const newComment = {
      id: 'c-' + Date.now(),
      username: cur.username || 'student',
      text: trimmed,
      timeAgo: 'Just now',
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...detailCommentsMap,
      [postId]: [...(detailCommentsMap[postId] || []), newComment],
    };
    setDetailCommentsMap(updated);
    try {
      localStorage.setItem('dpsbuzz_comments_v1', JSON.stringify(updated));
    } catch {}
    setDetailCommentText('');

    // Update post comments count in posts storage
    const posts = DataStore.getPosts(true);
    const updatedPosts = posts.map((p) =>
      p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
    );
    try {
      localStorage.setItem('dpsbuzz_posts_v2', JSON.stringify(updatedPosts));
    } catch {}

    if (selectedPostDetail && selectedPostDetail.id === postId) {
      setSelectedPostDetail({
        ...selectedPostDetail,
        comments: (selectedPostDetail.comments || 0) + 1,
      });
    }

    setPostsVersion((v) => v + 1);
    showToast('Comment posted! 💬');

    fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: newComment }),
    }).catch(() => {});
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
    if (!isOwnProfile || !habitCaption.trim() || !profile) return;
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

  const pair = getAvatarColorPair(profile.username);
  const isOfficial = profile.username.toLowerCase() === 'dpsbuzz_official';

  const rawOriginalPosts = useMemo(() => {
    return DataStore.getPosts(true).filter(
      (p) => p.username.toLowerCase() === profile.username.toLowerCase() && !p.isRepost
    );
  }, [profile.username, postsVersion]);

  const originalPosts = useMemo(() => {
    return DataStore.getOrderedUserPosts(profile.username, rawOriginalPosts);
  }, [profile.username, rawOriginalPosts, postsVersion]);

  const handleTogglePin = (postId: string) => {
    const res = DataStore.togglePinPost(profile.username, postId);
    setPostsVersion((v) => v + 1);
    showToast(res.isPinned ? 'Post pinned to your profile! 📌' : 'Post unpinned from your profile 📌');
  };

  const handleMovePost = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= originalPosts.length) return;
    const currentIds = originalPosts.map((p) => p.id);
    const [movedId] = currentIds.splice(fromIndex, 1);
    currentIds.splice(toIndex, 0, movedId);
    DataStore.setProfileGridOrder(profile.username, currentIds);
    setPostsVersion((v) => v + 1);
  };

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

  const taggedPosts = useMemo(() => {
    return DataStore.getTaggedPosts(profile.username);
  }, [profile.username, postsVersion]);

  const handleToggleTaggedOnGrid = (postId: string) => {
    const isOnGrid = DataStore.toggleTaggedPostOnGrid(profile.username, postId);
    setPostsVersion((v) => v + 1);
    showToast(
      isOnGrid
        ? 'Tagged photo added to your main profile grid! 🏷️✨'
        : 'Removed from your main grid ❌'
    );
  };

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
    if (!isOwnProfile) {
      showToast('You can only post notes on your own profile ✍️');
      return;
    }
    if (!noteInput.trim() && !noteSong) return;
    const textToSave = noteInput.trim() || (noteSong ? `Listening to ${noteSong.title} 🎵` : 'Note...');
    DataStore.saveChatNote(
      {
        text: textToSave,
        song: noteSong || undefined,
      },
      profile.username
    );
    setCurrentNote(textToSave);
    setNoteInput('');
    setShowNoteModal(false);
    setPostsVersion((v) => v + 1);
    showToast(noteSong ? `Note shared with "${noteSong.title}" 🎵` : 'Note shared! 💭');
  };

  const handleDeleteNote = () => {
    if (!isOwnProfile) return;
    DataStore.deleteChatNote(profile.username);
    setCurrentNote(isOwnProfile ? 'Note...' : '');
    setNoteSong(null);
    setShowNoteModal(false);
    setPostsVersion((v) => v + 1);
    showToast('Note deleted 🗑️');
  };

  const handleHighlightImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Photo must be under 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setNewHighlightImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) {
      showToast('You can only create highlights on your own profile ⭐');
      return;
    }
    if (!newHighlightName.trim()) {
      showToast('Please enter a highlight title');
      return;
    }
    try {
      const created = DataStore.addHighlight(profile.username, {
        label: newHighlightName.trim(),
        emoji: newHighlightEmoji,
        coverImage: newHighlightImage || null,
        text: newHighlightText.trim() || undefined,
        background: newHighlightBg,
      });
      setHighlights((prev) => [...prev, created]);
      setNewHighlightName('');
      setNewHighlightText('');
      setNewHighlightImage(null);
      setNewHighlightEmoji('⭐');
      setNewHighlightBg('linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)');
      setShowNewHighlightModal(false);
      setPostsVersion((v) => v + 1);
      showToast('Highlight added to profile! ✨');
    } catch (err: any) {
      showToast(err?.message || 'Could not add highlight');
    }
  };

  const handleDeleteHighlight = (highlightId: string) => {
    if (!isOwnProfile) {
      showToast('You cannot delete highlights from another account 🙅');
      return;
    }
    const wasDeleted = DataStore.deleteHighlight(profile.username, highlightId);
    if (wasDeleted) {
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      if (activeHighlight?.id === highlightId) {
        setActiveHighlight(null);
      }
      setPostsVersion((v) => v + 1);
      showToast('Highlight deleted');
    }
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

  // Followers & Following lists for interactive modal
  const followersList = useMemo(() => {
    return DataStore.getFollowers(profile.username);
  }, [profile.username, postsVersion]);

  const followingList = useMemo(() => {
    return DataStore.getFollowing(profile.username);
  }, [profile.username, postsVersion]);

  const mutualFollowers = useMemo(() => {
    const cur = DataStore.getCurrentUser();
    if (!cur || isOwnProfile) return [];
    return DataStore.getMutualFollows(cur.username, profile.username);
  }, [profile.username, isOwnProfile, postsVersion]);

  const displayedFollowList = useMemo(() => {
    const baseList = followListModalTab === 'followers' ? followersList : followingList;
    if (!followListSearchQuery.trim()) return baseList;
    const q = followListSearchQuery.toLowerCase().trim();
    return baseList.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
    );
  }, [followListModalTab, followersList, followingList, followListSearchQuery]);

  const handleOpenFollowModal = (tab: 'followers' | 'following') => {
    const isPrivate = Boolean(profile.isPrivate);
    if (!isOwnProfile && isPrivate && !isFollowing) {
      showToast(`🔒 This account is private. Follow @${profile.username} to see their followers and following.`);
      return;
    }
    setFollowListModalTab(tab);
    setFollowListSearchQuery('');
    setShowFollowListModal(true);
  };

  const handleToggleFollowInModal = (targetUsername: string) => {
    const cur = DataStore.getCurrentUser();
    if (!cur) return;
    if (cur.username.toLowerCase() === targetUsername.toLowerCase()) {
      showToast('You cannot follow yourself! 🙅');
      return;
    }
    const isCurrentlyFollowing = DataStore.isFollowing(cur.username, targetUsername);
    if (!isCurrentlyFollowing) {
      const all = DataStore.getProfiles();
      const targetProf = all.find((p) => p.username.toLowerCase() === targetUsername.toLowerCase());
      if (targetProf && targetProf.isPrivate) {
        const hasReq = DataStore.hasRequestedFollow(cur.username, targetUsername);
        if (hasReq) {
          DataStore.cancelFollowRequest(cur.username, targetUsername);
          showToast(`Cancelled follow request to @${targetUsername}`);
        } else {
          DataStore.requestFollow(cur.username, targetUsername);
          showToast(`Follow request sent to @${targetUsername} 🔒`);
        }
        setPostsVersion((v) => v + 1);
        return;
      }
    }
    const isNow = DataStore.toggleFollow(cur.username, targetUsername);
    setPostsVersion((v) => v + 1);
    showToast(isNow ? `Following @${targetUsername}! 🤝` : `Unfollowed @${targetUsername}`);
  };

  if (isDeletedOrMissing) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center select-none bg-[var(--surface)] text-[var(--text)]">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 border shadow-sm"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
        >
          <UserX size={38} className="text-[var(--text-muted)] opacity-70" />
        </div>
        <h1 className="text-xl font-bold mb-2">User Not Found</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-xs mb-6">
          This account does not exist or has been permanently deleted from DPS Buzz.
        </p>
        <Link
          href="/home"
          className="px-6 py-2.5 rounded-full font-semibold text-sm gradient-bg text-white shadow-md active:scale-95 transition-all"
        >
          Back to Home
        </Link>
      </div>
    );
  }

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
        {isOwnProfile ? (
          <div className="w-10 h-10" />
        ) : (
          <Link
            href="/home"
            className="w-10 h-10 rounded-full flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] border border-transparent hover:border-[var(--line)]"
            style={{ color: 'var(--text)' }}
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
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
            {/* Note Bubble: Editable by owner; Read-only for other users if active; Hidden for other users if empty */}
            {isOwnProfile ? (
              <button
                type="button"
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
                <span className="truncate">{currentNote || '+ Note'}</span>
                <div
                  className="absolute -bottom-1 left-3 w-1.5 h-1.5 rotate-45 border-r border-b"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                  }}
                />
              </button>
            ) : profileNote && profileNote.text ? (
              <div
                onClick={() => showToast(`@${profile.username}: "${profileNote.text}" 💭`)}
                className="absolute -top-3.5 left-0 z-10 px-2.5 py-0.5 rounded-full shadow-xs text-[10px] font-medium border flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform max-w-[130px]"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
                title={`Note from @${profile.username}`}
              >
                {profileNote.song && (
                  <Music size={10} className="text-pink-500 animate-pulse shrink-0" />
                )}
                <span className="truncate">{profileNote.text}</span>
                <div
                  className="absolute -bottom-1 left-3 w-1.5 h-1.5 rotate-45 border-r border-b"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                  }}
                />
              </div>
            ) : null}

            {/* Circular Avatar with Optional Story Ring & Detail View on click */}
            <div
              className={`relative rounded-full transition-all ${
                hasActiveStory
                  ? 'story-ring p-[3px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-md cursor-pointer'
                  : ''
              }`}
              onClick={() => setShowEnlargedPhoto(true)}
              title="Click to view profile picture in detail"
            >
              <div
                className="w-[82px] h-[82px] rounded-full flex items-center justify-center font-bold text-xl overflow-hidden border shadow-sm profile-light-sweep cursor-pointer"
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

              {/* Active Online Indicator */}
              {!isOwnProfile && DataStore.isUserActive(profile.username) && (
                <span
                  className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[var(--surface,#171C26)] z-20 pointer-events-none shadow-sm"
                  title={`@${profile.username} is active now`}
                />
              )}

              {/* Camera upload badge for own profile ONLY */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
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

          {/* 3 Horizontal Stats: Posts, Followers, Following (Strictly Authoritative) */}
          <div className="flex-1 flex items-center justify-around text-center select-none tabular-nums">
            <div className="cursor-pointer" onClick={() => setActiveTab('posts')}>
              <div className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {originalPosts.length}
              </div>
              <div className="text-[12px] lowercase font-normal" style={{ color: 'var(--text-muted)' }}>
                posts
              </div>
            </div>
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleOpenFollowModal('followers')}
              title={`View ${profile.username}'s followers`}
            >
              <div className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {followersList.length}
              </div>
              <div className="text-[12px] lowercase font-normal" style={{ color: 'var(--text-muted)' }}>
                followers
              </div>
            </div>
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleOpenFollowModal('following')}
              title={`View who ${profile.username} follows`}
            >
              <div className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {followingList.length}
              </div>
              <div className="text-[12px] lowercase font-normal" style={{ color: 'var(--text-muted)' }}>
                following
              </div>
            </div>
          </div>
        </div>

        {/* Identity & Bio */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {profile.fullName}
            </span>
            {!isOwnProfile && isFollowedBy && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)]">
                Follows you
              </span>
            )}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isOfficial ? 'Official School Office' : `Class ${profile.class}-${profile.section || 'A'} • DPS Student 🐝`}
          </div>
          {profile.bio && (
            <p className="text-xs leading-relaxed whitespace-pre-line pt-0.5" style={{ color: 'var(--text)' }}>
              {profile.bio}
            </p>
          )}

          {/* Social proof / Mutual follows: Followed by [avatar] @username matching screenshot */}
          {!isOwnProfile && mutualFollowers.length > 0 && (
            <div
              onClick={() => handleOpenFollowModal('followers')}
              className="flex items-center gap-2 pt-1 cursor-pointer group"
            >
              <div className="flex -space-x-1.5 overflow-hidden">
                {mutualFollowers.slice(0, 3).map((mfUser) => {
                  const mfProf = DataStore.getProfileByUsername(mfUser);
                  return (
                    <div
                      key={mfUser}
                      className="inline-block w-4 h-4 rounded-full ring-2 ring-[var(--surface)] bg-[var(--surface-sunken)] overflow-hidden shrink-0"
                    >
                      {mfProf?.avatar ? (
                        <img src={mfProf.avatar} alt={mfUser} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-white bg-blue-500">
                          {mfUser.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] leading-tight text-[var(--text-muted)] group-hover:underline">
                Followed by <span className="font-semibold text-[var(--text)]">@{mutualFollowers[0]}</span>
                {mutualFollowers.length > 1 && (
                  <span> and {mutualFollowers.length - 1} other{mutualFollowers.length > 2 ? 's' : ''} you follow</span>
                )}
              </p>
            </div>
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
                onEditPart={isOwnProfile ? () => setShowSongPickerModal(true) : undefined}
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
                type="button"
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
                type="button"
                onClick={handleShareProfile}
                className="flex-1 h-9 rounded-full text-xs font-semibold border flex items-center justify-center gap-1 btn-press cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                <span>Share profile</span>
              </button>
              <button
                type="button"
                onClick={() => setShowArchiveModal(true)}
                className="flex-1 h-9 rounded-full text-xs font-semibold border flex items-center justify-center gap-1 btn-press cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                <span>Archive</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  const currentUser = DataStore.getCurrentUser();
                  if (!currentUser || !currentUser.username || currentUser.username.toLowerCase() === 'guest') {
                    showToast('Please log in to follow students 👤');
                    return;
                  }
                  if (currentUser.username.toLowerCase().trim() === profile.username.toLowerCase().trim()) {
                    showToast('You cannot follow yourself! 🙅');
                    return;
                  }

                  // If there is an incoming friend request from this user, accepting it makes them mutual friends!
                  if (hasIncomingRequest) {
                    DataStore.acceptFollowRequest(currentUser.username, profile.username);
                    setIsFollowing(true);
                    setIsFollowedBy(true);
                    setHasIncomingRequest(false);
                    setPostsVersion((v) => v + 1);
                    const updated = DataStore.getProfileByUsername(profile.username);
                    if (updated) setProfile(updated);
                    showToast(`Accepted friend request from @${profile.username}! You are now friends 🎉`);
                    return;
                  }

                  // If already following, unfollow directly
                  if (isFollowing) {
                    const isNow = DataStore.toggleFollow(currentUser.username, profile.username);
                    setIsFollowing(isNow);
                    setIsRequested(false);
                    setPostsVersion((v) => v + 1);
                    const updated = DataStore.getProfileByUsername(profile.username);
                    if (updated) setProfile(updated);
                    showToast(`Unfollowed @${profile.username}`);
                    return;
                  }

                  // If profile is private, handle Follow Request
                  if (profile.isPrivate) {
                    if (isRequested) {
                      DataStore.cancelFollowRequest(currentUser.username, profile.username);
                      setIsRequested(false);
                      showToast(`Follow request cancelled for @${profile.username}`);
                    } else {
                      DataStore.requestFollow(currentUser.username, profile.username);
                      setIsRequested(true);
                      showToast(`Friend request sent to @${profile.username} 🔒`);
                    }
                    return;
                  }

                  // If public or Follow Back, direct follow
                  const isNow = DataStore.toggleFollow(currentUser.username, profile.username);
                  setIsFollowing(isNow);
                  setIsRequested(false);
                  setPostsVersion((v) => v + 1);
                  const updated = DataStore.getProfileByUsername(profile.username);
                  if (updated) setProfile(updated);
                  showToast(isFollowedBy ? `You and @${profile.username} are now friends! 🤝` : `Following @${profile.username}`);
                }}
                className={`${isFollowing ? 'flex-1' : 'w-full'} h-9 rounded-full text-xs font-semibold btn-press flex items-center justify-center cursor-pointer shadow-xs`}
                style={{
                  backgroundColor: (isFollowing || isRequested) && !hasIncomingRequest ? 'var(--surface-sunken)' : 'var(--accent-cta)',
                  color: (isFollowing || isRequested) && !hasIncomingRequest ? 'var(--text)' : 'var(--on-accent-cta)',
                  border: (isFollowing || isRequested) && !hasIncomingRequest ? '1px solid var(--line)' : 'none',
                }}
              >
                {hasIncomingRequest
                  ? 'Confirm'
                  : isFollowedBy && !isFollowing && !isRequested
                  ? 'Follow Back'
                  : isFollowing ? 'Following' : isRequested ? 'Requested' : 'Follow'}
              </button>
              {isFollowing && (
                <>
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
                  <button
                    type="button"
                    onClick={() => {
                      const cur = DataStore.getCurrentUser();
                      if (!cur || !cur.username || cur.username.toLowerCase() === 'guest') {
                        showToast('Please log in to place voice calls 📞');
                        return;
                      }
                      if (cur.username.toLowerCase().trim() === profile.username.toLowerCase().trim()) {
                        showToast('You cannot call your own account 🙅');
                        return;
                      }
                      const now = Date.now();
                      if ((window as any).__dpsbuzz_last_call_click && now - (window as any).__dpsbuzz_last_call_click < 2500) {
                        return;
                      }
                      (window as any).__dpsbuzz_last_call_click = now;
                      showToast(`Calling @${profile.username}...`);
                      window.dispatchEvent(
                        new CustomEvent('dpsbuzz:start_call', {
                          detail: {
                            receiverUsername: profile.username,
                            receiverName: profile.fullName,
                            receiverAvatar: profile.avatar,
                            isVideo: false,
                          },
                        })
                      );
                    }}
                    className="w-9 h-9 rounded-full border flex items-center justify-center btn-press cursor-pointer text-[var(--text-muted)] hover:text-[#007AFF] transition-colors"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                    }}
                    title="Voice Call"
                    aria-label="Voice Call"
                  >
                    <Phone size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = DataStore.getCurrentUser();
                      if (!cur || !cur.username || cur.username.toLowerCase() === 'guest') {
                        showToast('Please log in to place video calls 📹');
                        return;
                      }
                      if (cur.username.toLowerCase().trim() === profile.username.toLowerCase().trim()) {
                        showToast('You cannot call your own account 🙅');
                        return;
                      }
                      const now = Date.now();
                      if ((window as any).__dpsbuzz_last_call_click && now - (window as any).__dpsbuzz_last_call_click < 2500) {
                        return;
                      }
                      (window as any).__dpsbuzz_last_call_click = now;
                      showToast(`Video calling @${profile.username}...`);
                      window.dispatchEvent(
                        new CustomEvent('dpsbuzz:start_call', {
                          detail: {
                            receiverUsername: profile.username,
                            receiverName: profile.fullName,
                            receiverAvatar: profile.avatar,
                            isVideo: true,
                          },
                        })
                      );
                    }}
                    className="w-9 h-9 rounded-full border flex items-center justify-center btn-press cursor-pointer text-[var(--text-muted)] hover:text-[#007AFF] transition-colors"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                    }}
                    title="Video Call"
                    aria-label="Video Call"
                  >
                    <Video size={16} />
                  </button>
                </>
              )}
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
            onPostClick={isOwnProfile ? () => setShowHabitPostModal(true) : undefined}
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

        {/* Highlights Row (Only visible to owner, or if public/following and has highlights) */}
        {(isOwnProfile || ((!profile.isPrivate || isFollowing) && highlights.length > 0)) && (
          <div className="pt-1.5 flex items-center gap-4 overflow-x-auto no-scrollbar">
            {/* (+) New Highlight Button (Only visible to account owner) */}
            {isOwnProfile && (
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
            )}

            {/* User's Highlights */}
            {highlights.map((h) => (
              <div
                key={h.id}
                onClick={() => setActiveHighlight(h)}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group relative"
              >
                <div
                  className="w-14 h-14 rounded-full border p-0.5 flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden shadow-xs"
                  style={{
                    borderColor: 'var(--line-strong)',
                    backgroundColor: 'var(--surface-sunken)',
                  }}
                >
                  {h.coverImage ? (
                    <img src={h.coverImage} alt={h.label} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-xl">{h.emoji || '⭐'}</span>
                  )}
                </div>
                <span className="text-[11px] font-medium truncate max-w-[64px] text-center" style={{ color: 'var(--text)' }}>
                  {h.label}
                </span>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete highlight "${h.label}"?`)) {
                        handleDeleteHighlight(h.id);
                      }
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete highlight"
                    aria-label={`Delete highlight ${h.label}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* If Account is Private and Viewer is Not Following & Not Own Profile */}
      {!isOwnProfile && Boolean(profile.isPrivate) && !isFollowing ? (
        <div className="max-w-[480px] mx-auto px-6 py-20 text-center space-y-4 select-none border-t border-[var(--line)] mt-3">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] mx-auto flex items-center justify-center text-[var(--text-muted)] shadow-xs">
            <Lock size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text)]">This Account is Private 🔒</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
              {isRequested
                ? `Follow request sent. Waiting for @${profile.username} to accept.`
                : `Follow @${profile.username} to see their photos, stories, and posts.`}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Grid Tab Bar */}
          <div
            className="flex items-center justify-between border-t border-b mt-2 max-w-[480px] mx-auto px-1"
            style={{
              borderColor: 'var(--line)',
            }}
          >
        <div className="flex flex-1">
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
            onClick={() => setActiveTab('tagged')}
            className="flex-1 py-3 flex items-center justify-center btn-press border-b-2 cursor-pointer gap-1.5"
            style={{
              borderColor: activeTab === 'tagged' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'tagged' ? 'var(--primary)' : 'var(--text-muted)',
            }}
            aria-label="Tagged tab"
          >
            <Tag size={17} />
            <span className="text-[11px] font-semibold">Tagged</span>
            {taggedPosts.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold tabular-nums">
                {taggedPosts.length}
              </span>
            )}
          </button>
          {isOwnProfile && (
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
          )}
        </div>

        {/* Edit Grid / Rearrange Toggle Button */}
        {isOwnProfile && activeTab === 'posts' && originalPosts.length > 1 && (
          <button
            type="button"
            onClick={() => setIsRearrangeMode((prev) => !prev)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              isRearrangeMode
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] border-[var(--line)]'
            }`}
            title={isRearrangeMode ? 'Finish rearranging' : 'Rearrange posts on your profile'}
          >
            <GripVertical size={13} />
            <span>{isRearrangeMode ? 'Done' : 'Edit Grid'}</span>
          </button>
        )}
      </div>

      {/* Rearrange Mode Instructions Banner */}
      {isRearrangeMode && (
        <div className="max-w-[480px] mx-auto px-3 py-2 my-1 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-1.5 text-blue-400">
            <Sparkles size={14} className="shrink-0" />
            <span className="font-medium text-[11px] leading-tight">
              Rearrange mode: Tap ◀ ▶ or drag posts to reorder. Pinned posts stay first.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsRearrangeMode(false)}
            className="px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      )}

      {/* Posts Grid */}
      <div className="max-w-[480px] mx-auto px-1 py-2">
        {activeTab === 'posts' ? (
          originalPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {originalPosts.map((post, postIdx) => {
                const displayImg = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);

                if (isRearrangeMode) {
                  return (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => setDraggedPostId(post.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedPostId && draggedPostId !== post.id) {
                          const fromIdx = originalPosts.findIndex((p) => p.id === draggedPostId);
                          const toIdx = postIdx;
                          handleMovePost(fromIdx, toIdx);
                          setDraggedPostId(null);
                        }
                      }}
                      className="aspect-square relative overflow-hidden rounded-[16px] bg-[var(--surface-sunken)] p-1.5 flex flex-col justify-between border-2 border-dashed border-blue-500/50 shadow-sm select-none"
                    >
                      {displayImg && (
                        <img
                          src={displayImg}
                          alt={post.caption}
                          className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                      )}

                      {/* Top badge row: order number + Pin toggle */}
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                          {postIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(post.id);
                          }}
                          className={`p-1 rounded-full text-xs cursor-pointer shadow-xs ${
                            post.isPinned
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-black/60 text-white hover:bg-black/80'
                          }`}
                          title={post.isPinned ? 'Unpin post' : 'Pin to top of profile'}
                        >
                          <Pin size={11} className={post.isPinned ? 'fill-black rotate-45' : 'rotate-45'} />
                        </button>
                      </div>

                      {/* Bottom row: ◀ and ▶ movement buttons */}
                      <div className="relative z-10 flex items-center justify-center gap-2 py-0.5">
                        <button
                          type="button"
                          disabled={postIdx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePost(postIdx, postIdx - 1);
                          }}
                          className="w-7 h-7 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center disabled:opacity-25 cursor-pointer shadow-md text-xs font-bold"
                          title="Move earlier"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          disabled={postIdx === originalPosts.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePost(postIdx, postIdx + 1);
                          }}
                          className="w-7 h-7 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center disabled:opacity-25 cursor-pointer shadow-md text-xs font-bold"
                          title="Move later"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={post.id}
                    {...getLongPressProps(post, () => setSelectedPostDetail(post))}
                    className="aspect-square relative overflow-hidden rounded-[16px] bg-[var(--surface-sunken)] cursor-pointer group border border-[var(--line)] shadow-2xs select-none"
                  >
                    {/* Instagram-style Top Right Pin Icon Badge */}
                    {post.isPinned && (
                      <div
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/65 backdrop-blur-xs flex items-center justify-center text-white shadow-xs z-10"
                        title={`Pinned post #${post.pinnedIndex || 1}`}
                      >
                        <Pin size={11} className="fill-white rotate-45 text-white" />
                      </div>
                    )}
                    {/* Tagged post on main grid badge */}
                    {post.isTaggedOnGrid && (
                      <div
                        className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/65 backdrop-blur-xs flex items-center gap-1 text-white shadow-xs z-10 text-[9px] font-bold"
                        title="Tagged photo pushed to your main grid"
                      >
                        <Tag size={10} className="text-pink-400" />
                        <span>Tagged</span>
                      </div>
                    )}
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
            <div className="py-16 text-center space-y-2 animate-fade-in">
              <div className="w-16 h-16 rounded-full border-2 border-[var(--line)] flex items-center justify-center mx-auto mb-3 text-[var(--text)] bg-[var(--surface-sunken)] shadow-xs">
                <Camera size={30} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                No posts yet
              </h3>
              <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                {isOwnProfile
                  ? 'When you share photos or school projects, they will appear on your profile grid.'
                  : `When @${profile.username} shares photos or school projects, they will appear here.`}
              </p>
              {isOwnProfile && (
                <div className="pt-2">
                  <Link
                    href="/post/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    <Plus size={14} />
                    <span>Share first post</span>
                  </Link>
                </div>
              )}
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
                    {...getLongPressProps(post, () => setSelectedPostDetail(post))}
                    className="aspect-square relative overflow-hidden rounded-[16px] bg-[var(--surface-sunken)] cursor-pointer group border border-[var(--line)] shadow-2xs select-none"
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
        ) : activeTab === 'tagged' ? (
          taggedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5">
              {taggedPosts.map((post) => {
                const displayImg = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);
                const isOnGrid = DataStore.isTaggedPostOnGrid(profile.username, post.id);
                return (
                  <div
                    key={post.id}
                    {...getLongPressProps(post, () => {
                      setSelectedPostDetail(post);
                      setDetailSlideIndex(0);
                    })}
                    className="aspect-square relative overflow-hidden rounded-[16px] bg-[var(--surface-sunken)] cursor-pointer group border border-[var(--line)] shadow-2xs select-none"
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
                    {/* Tagged by badge */}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs">
                      <Tag size={10} className="text-pink-400" />
                      <span>@{post.username}</span>
                    </div>

                    {/* Push to Main Grid Toggle Button for Profile Owner */}
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTaggedOnGrid(post.id);
                        }}
                        className={`absolute bottom-1.5 inset-x-1.5 py-1 px-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-md ${
                          isOnGrid
                            ? 'bg-blue-600 text-white'
                            : 'bg-black/75 hover:bg-black text-white/90'
                        }`}
                        title={isOnGrid ? 'Remove from main profile grid' : 'Push photo to main profile grid'}
                      >
                        <Tag size={10} />
                        <span>{isOnGrid ? 'On Grid ✓' : '+ Add to Grid'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--text-muted)]">
                <Tag size={24} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                No tagged photos yet
              </p>
              <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                When classmates tag @{profile.username} in photos, they will appear here. You can then push them straight to your main profile grid!
              </p>
            </div>
          )
        ) : isOwnProfile && activeTab === 'saved' ? (
          savedPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {savedPosts.map((post) => {
              const displayImg = post.imageUrl || (post.images && post.images.length > 0 ? post.images[0] : null);
              return (
                <div
                  key={post.id}
                  {...getLongPressProps(post, () => setSelectedPostDetail(post))}
                  className="aspect-square relative overflow-hidden rounded-[16px] bg-[var(--surface-sunken)] cursor-pointer group border border-[var(--line)] shadow-2xs select-none"
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
        )) : null}
      </div>
    </>
  )}

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
                    {DataStore.isPostPinned(selectedPostDetail.username, selectedPostDetail.id) && (
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Pin size={10} className="fill-amber-500 rotate-45" /> Pinned
                      </span>
                    )}
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
                {/* Push to Main Grid button if user is tagged in this post */}
                {isOwnProfile && selectedPostDetail.username.toLowerCase() !== profile.username.toLowerCase() && (
                  <button
                    type="button"
                    onClick={() => handleToggleTaggedOnGrid(selectedPostDetail.id)}
                    className={`px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      DataStore.isTaggedPostOnGrid(profile.username, selectedPostDetail.id)
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-blue-500 border border-[var(--line)]'
                    }`}
                    title={DataStore.isTaggedPostOnGrid(profile.username, selectedPostDetail.id) ? 'Remove from main profile grid' : 'Push photo to main profile grid'}
                  >
                    <Tag size={12} />
                    <span>{DataStore.isTaggedPostOnGrid(profile.username, selectedPostDetail.id) ? 'On Grid ✓' : '+ Main Grid'}</span>
                  </button>
                )}

                {/* Edit / Change Music button for post owner */}
                {isOwnProfile && !selectedPostDetail.isRepost && (
                  <button
                    type="button"
                    onClick={() => setShowPostSongPickerModal(true)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      selectedPostDetail.song
                        ? 'text-pink-500 bg-pink-500/10 hover:bg-pink-500/20'
                        : 'text-[var(--text-muted)] hover:text-pink-500 hover:bg-[var(--surface-sunken)]'
                    }`}
                    title={selectedPostDetail.song ? `Change music ("${selectedPostDetail.song.title}") 🎵` : 'Add background music 🎵'}
                    aria-label="Change music"
                  >
                    <Music size={17} />
                  </button>
                )}

                {/* Pin / Unpin button for profile owner (regular posts only) */}
                {isOwnProfile && !selectedPostDetail.isRepost && (
                  <button
                    type="button"
                    onClick={() => {
                      handleTogglePin(selectedPostDetail.id);
                    }}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      DataStore.isPostPinned(profile.username, selectedPostDetail.id)
                        ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-[var(--text-muted)] hover:text-amber-500 hover:bg-[var(--surface-sunken)]'
                    }`}
                    aria-label={DataStore.isPostPinned(profile.username, selectedPostDetail.id) ? 'Unpin post' : 'Pin post to profile'}
                    title={DataStore.isPostPinned(profile.username, selectedPostDetail.id) ? 'Unpin post' : 'Pin post to profile'}
                  >
                    <Pin
                      size={18}
                      className={DataStore.isPostPinned(profile.username, selectedPostDetail.id) ? 'fill-amber-500 rotate-45' : ''}
                    />
                  </button>
                )}
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

            {/* Post Image & Carousel Navigation */}
            {(() => {
              const allImgs = (selectedPostDetail.images && selectedPostDetail.images.length > 0)
                ? selectedPostDetail.images
                : (selectedPostDetail.imageUrl ? [selectedPostDetail.imageUrl] : []);
              if (allImgs.length === 0) return null;
              const curImg = allImgs[detailSlideIndex] || allImgs[0];
              return (
                <div className="w-full aspect-square bg-black relative flex items-center justify-center overflow-hidden select-none">
                  <img
                    src={curImg}
                    alt={selectedPostDetail.caption}
                    className="w-full h-full object-contain"
                  />
                  {allImgs.length > 1 && (
                    <>
                      {/* Prev button */}
                      {detailSlideIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setDetailSlideIndex((i) => Math.max(0, i - 1))}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-sm font-bold shadow-md cursor-pointer z-10"
                        >
                          ◀
                        </button>
                      )}
                      {/* Next button */}
                      {detailSlideIndex < allImgs.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setDetailSlideIndex((i) => Math.min(allImgs.length - 1, i + 1))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-sm font-bold shadow-md cursor-pointer z-10"
                        >
                          ▶
                        </button>
                      )}
                      {/* Slide Indicator Badge */}
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold z-10">
                        {detailSlideIndex + 1}/{allImgs.length}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Action Row */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const cur = DataStore.getCurrentUser();
                    if (!cur?.username || cur.username.toLowerCase() === 'guest') {
                      showToast('Please log in to like posts ❤️');
                      return;
                    }
                    const res = DataStore.toggleLikePost(selectedPostDetail.id, cur.username);
                    setSelectedPostDetail((prev) =>
                      prev ? { ...prev, likes: res.likesCount } : null
                    );
                    setPostsVersion((v) => v + 1);
                    showToast(res.liked ? 'Liked post! ❤️' : 'Unliked post');
                  }}
                  className="flex items-center gap-1 text-xs font-semibold hover:text-red-500 transition-colors cursor-pointer"
                  style={{ color: 'var(--text)' }}
                >
                  <Heart
                    size={20}
                    className={
                      (() => {
                        const cur = DataStore.getCurrentUser();
                        return (cur?.username && DataStore.isPostLiked(selectedPostDetail.id, cur.username))
                          ? 'fill-red-500 text-red-500'
                          : '';
                      })()
                    }
                  />
                  <span>{DataStore.getPostLikes(selectedPostDetail.id)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailComments((prev) => !prev)}
                  className={`flex items-center gap-1 text-xs font-semibold hover:text-[var(--primary)] transition-colors cursor-pointer ${
                    showDetailComments ? 'text-[var(--primary)]' : ''
                  }`}
                  style={{ color: showDetailComments ? 'var(--primary)' : 'var(--text)' }}
                  title="View and post comments"
                  aria-label="View comments"
                >
                  <MessageCircle size={20} />
                  <span>{detailCommentsMap[selectedPostDetail.id]?.length || selectedPostDetail.comments || 0}</span>
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

            {/* Attached Audio Track Pill */}
            {selectedPostDetail.song && (
              <div className="px-4 pt-2.5 pb-1">
                <MusicTrackPill song={selectedPostDetail.song} compact />
              </div>
            )}

            {/* Caption with Per-Slide Caption Support */}
            {(() => {
              const allImgs = (selectedPostDetail.images && selectedPostDetail.images.length > 0)
                ? selectedPostDetail.images
                : (selectedPostDetail.imageUrl ? [selectedPostDetail.imageUrl] : []);
              const currentDetailCaption =
                (selectedPostDetail.slideCaptions && selectedPostDetail.slideCaptions[detailSlideIndex]?.trim()) ||
                selectedPostDetail.caption;
              const hasSlideCaptions = Boolean(
                selectedPostDetail.slideCaptions && selectedPostDetail.slideCaptions.some((c) => c && c.trim())
              );
              return (
                <div className="p-4 space-y-1.5">
                  {hasSlideCaptions && allImgs.length > 1 && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                      📸 Slide {detailSlideIndex + 1} of {allImgs.length}
                    </span>
                  )}
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                    <span className="font-bold mr-1.5">@{selectedPostDetail.username}</span>
                    <span>{currentDetailCaption}</span>
                  </p>
                </div>
              );
            })()}

            {/* Interactive Comments Drawer inside Post Modal */}
            {showDetailComments && (
              <div
                className="border-t animate-slide-up flex flex-col"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                    Comments ({detailCommentsMap[selectedPostDetail.id]?.length || selectedPostDetail.comments || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDetailComments(false)}
                    className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    Hide
                  </button>
                </div>

                {/* Comments List */}
                <div className="max-h-48 overflow-y-auto p-4 space-y-3 no-scrollbar">
                  {(!detailCommentsMap[selectedPostDetail.id] || detailCommentsMap[selectedPostDetail.id].length === 0) ? (
                    <p className="text-xs text-center py-4 text-[var(--text-muted)]">
                      No comments yet. Be the first to comment! 💬
                    </p>
                  ) : (
                    detailCommentsMap[selectedPostDetail.id].map((c: any) => (
                      <div key={c.id || c.createdAt} className="flex items-start gap-2 text-xs">
                        <span className="font-bold text-[var(--text)] shrink-0">@{c.username}</span>
                        <span className="text-[var(--text-secondary)] break-words flex-1">{c.text}</span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">{c.timeAgo || 'Just now'}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddDetailComment(selectedPostDetail.id);
                  }}
                  className="p-3 border-t flex items-center gap-2"
                  style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}
                >
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={detailCommentText}
                    onChange={(e) => setDetailCommentText(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-full text-xs border outline-none font-medium transition-all"
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      borderColor: 'var(--line)',
                      color: 'var(--text)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!detailCommentText.trim()}
                    className="h-9 px-4 rounded-full text-xs font-bold text-white transition-opacity disabled:opacity-40 cursor-pointer shadow-xs"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    Post
                  </button>
                </form>
              </div>
            )}

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

      {/* ─── 4. Rectangular Highlight Editor Modal (Story-like Card Canvas) ──────── */}
      {showNewHighlightModal && isOwnProfile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setShowNewHighlightModal(false)}
        >
          <div
            className="w-full max-w-[440px] max-h-[92vh] flex flex-col border rounded-3xl overflow-hidden shadow-2xl animate-scale-in"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">New Profile Highlight</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'var(--primary-tint)', color: 'var(--primary)' }}>
                  Story Card
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewHighlightModal(false)}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close highlight editor"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddHighlight} className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* 1. RECTANGULAR CARD EDITOR PREVIEW (Story Canvas) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                    HIGHLIGHT PREVIEW (RECTANGLE)
                  </label>
                  <span className="text-[10px] text-zinc-400 font-medium">Stories Style</span>
                </div>

                <div
                  className="relative w-full aspect-[4/5] max-h-[260px] sm:max-h-[290px] rounded-2xl overflow-hidden border shadow-lg flex flex-col justify-between p-4 transition-all select-none"
                  style={{
                    background: newHighlightBg,
                    borderColor: 'var(--line)',
                  }}
                >
                  {/* Uploaded Background Photo (Full Bleed Image) */}
                  {newHighlightImage && (
                    <img
                      src={newHighlightImage}
                      alt="Highlight Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* Legibility Gradient Overlay when Image or Text is present */}
                  {newHighlightImage && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />
                  )}

                  {/* Card Header Tag */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-sm">
                      <span className="text-sm">{newHighlightEmoji}</span>
                      <span className="text-[11px] font-bold max-w-[140px] truncate">
                        {newHighlightName.trim() || 'Highlight Title'}
                      </span>
                    </div>

                    {newHighlightImage && (
                      <button
                        type="button"
                        onClick={() => setNewHighlightImage(null)}
                        className="px-2 py-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        ✕ Remove Photo
                      </button>
                    )}
                  </div>

                  {/* Card Content (Typed Text or Placeholder) */}
                  <div className="relative z-10 my-auto px-2 text-center">
                    {newHighlightText.trim() ? (
                      <div className="inline-block p-3 rounded-xl bg-black/45 backdrop-blur-sm border border-white/15 text-white shadow-md max-w-full">
                        <p className="text-sm sm:text-base font-bold leading-snug drop-shadow-md whitespace-pre-wrap break-words">
                          {newHighlightText}
                        </p>
                      </div>
                    ) : !newHighlightImage ? (
                      <div className="flex flex-col items-center gap-1.5 text-white/70 py-4">
                        <Camera size={26} className="opacity-80" />
                        <span className="text-xs font-semibold">Upload a photo or type text below</span>
                        <span className="text-[10px] text-white/50">Custom story-style card</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Footer Info */}
                  <div className="relative z-10 flex items-center justify-between text-white/60 text-[10px] font-medium">
                    <span>@{profile.username}</span>
                    <span>Profile Highlight</span>
                  </div>
                </div>
              </div>

              {/* 2. Photo Upload Option */}
              <div>
                <input
                  ref={highlightFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHighlightImageUpload}
                />
                <button
                  type="button"
                  onClick={() => highlightFileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all hover:opacity-90 cursor-pointer shadow-xs"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                >
                  <Camera size={16} className="text-pink-500" />
                  <span>{newHighlightImage ? 'Change Highlight Photo 📷' : 'Upload Cover Photo (Camera / Gallery) 📸'}</span>
                </button>
              </div>

              {/* 3. Highlight Title Input */}
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  HIGHLIGHT TITLE *
                </label>
                <input
                  type="text"
                  value={newHighlightName}
                  onChange={(e) => setNewHighlightName(e.target.value)}
                  placeholder="e.g. Science Fair, Sports Day, Class Trip"
                  maxLength={24}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                  autoFocus
                />
              </div>

              {/* 4. Type & Post Highlight Text Area */}
              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  TYPE HIGHLIGHT STORY / NOTE (OPTIONAL)
                </label>
                <textarea
                  value={newHighlightText}
                  onChange={(e) => setNewHighlightText(e.target.value)}
                  placeholder="Type memories, thoughts, or story caption for this highlight..."
                  rows={2}
                  maxLength={280}
                  className="w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none resize-none transition-colors"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                />
                <div className="flex justify-between text-[10px] mt-0.5 text-zinc-400">
                  <span>Displays on the highlight story card</span>
                  <span>{newHighlightText.length}/280</span>
                </div>
              </div>

              {/* 5. Card Background Presets */}
              <div>
                <label className="text-[11px] font-bold block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  BACKGROUND STYLE
                </label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {[
                    { label: 'Instagram Sunset', bg: 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)' },
                    { label: 'Midnight Indigo', bg: 'linear-gradient(135deg, #0F172A, #1E1B4B, #312E81)' },
                    { label: 'Emerald Forest', bg: 'linear-gradient(135deg, #064E3B, #047857, #10B981)' },
                    { label: 'DPS Amber Gold', bg: 'linear-gradient(135deg, #78350F, #D97706, #F59E0B)' },
                    { label: 'Deep Crimson', bg: 'linear-gradient(135deg, #881337, #BE123C, #F43F5E)' },
                    { label: 'Pitch Black', bg: '#121212' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewHighlightBg(preset.bg)}
                      className={`w-8 h-8 rounded-full shrink-0 border-2 transition-transform cursor-pointer ${
                        newHighlightBg === preset.bg ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ background: preset.bg }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              {/* 6. Cover Emoji Selector */}
              <div>
                <label className="text-[11px] font-bold block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  COVER ICON / EMOJI
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {['⭐', '🏆', '🎨', '🚀', '🎸', '⚽', '📸', '🎓', '✨', '🐝', '❤️', '🔥'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewHighlightEmoji(em)}
                      className={`w-9 h-9 border text-base flex items-center justify-center shrink-0 cursor-pointer rounded-xl transition-all ${
                        newHighlightEmoji === em
                          ? 'border-2 border-[var(--primary)] bg-[var(--primary-tint)] scale-105'
                          : 'border-[var(--line)] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewHighlightModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl gradient-bg text-white shadow-md btn-press cursor-pointer disabled:opacity-40 transition-all"
                >
                  Post Highlight ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 4B. Interactive Highlight Story Viewer Modal ──────────────────── */}
      {activeHighlight && (isOwnProfile || (!profile.isPrivate || isFollowing)) && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
          onClick={() => setActiveHighlight(null)}
        >
          <div
            className="relative w-full max-w-[400px] aspect-[9/16] sm:aspect-[4/5] min-h-[460px] sm:min-h-[520px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-5 border border-white/20 animate-scale-in"
            style={{
              background: activeHighlight.background || 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Full-bleed Highlight Photo */}
            {activeHighlight.coverImage && (
              <img
                src={activeHighlight.coverImage}
                alt={activeHighlight.label}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Gradient Overlay for Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

            {/* Top Bar: Author, Title & Actions */}
            <div className="relative z-10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full border-2 border-white/40 overflow-hidden bg-black/40 flex items-center justify-center shrink-0">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{profile.fullName[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold leading-none">@{profile.username}</span>
                    <span className="text-xs">{activeHighlight.emoji}</span>
                  </div>
                  <p className="text-[11px] text-white/80 font-semibold mt-0.5">{activeHighlight.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete highlight "${activeHighlight.label}"?`)) {
                        handleDeleteHighlight(activeHighlight.id);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-red-600/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Delete highlight"
                    aria-label="Delete highlight"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveHighlight(null)}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close highlight"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Middle: Typed Highlight Story Text */}
            <div className="relative z-10 my-auto px-4 text-center">
              {activeHighlight.text ? (
                <div className="inline-block p-4 sm:p-5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-2xl max-w-full">
                  <p className="text-base sm:text-xl font-bold leading-relaxed whitespace-pre-wrap drop-shadow-md">
                    {activeHighlight.text}
                  </p>
                </div>
              ) : !activeHighlight.coverImage ? (
                <div className="text-center text-white">
                  <span className="text-6xl drop-shadow-lg block mb-2">{activeHighlight.emoji || '⭐'}</span>
                  <h3 className="text-2xl font-black drop-shadow-md">{activeHighlight.label}</h3>
                </div>
              ) : null}
            </div>

            {/* Bottom Bar: Highlight Info & Date */}
            <div className="relative z-10 flex items-center justify-between text-white/70 text-xs font-medium pt-2 border-t border-white/10">
              <span className="flex items-center gap-1">
                <span>🌟 Profile Highlight</span>
              </span>
              <span>
                {activeHighlight.createdAt
                  ? new Date(activeHighlight.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : 'Saved'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. Note Modal ────────────────────────────────────────────────── */}
      {showNoteModal && isOwnProfile && (
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
                {profileNote && (
                  <button
                    type="button"
                    onClick={handleDeleteNote}
                    className="py-2 px-3 text-xs font-semibold border rounded-full cursor-pointer text-red-500 border-red-500/30 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                )}
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

      {/* ─── Enlarged Profile Photo Modal ─────────────────────────────────── */}
      {showEnlargedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowEnlargedPhoto(false)}
        >
          <div
            className="relative max-w-sm w-full bg-[var(--surface)] border border-[var(--line)] rounded-3xl p-5 flex flex-col items-center gap-4 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowEnlargedPhoto(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[var(--surface-sunken)] hover:bg-[var(--line)] text-[var(--text)] transition-colors cursor-pointer"
              aria-label="Close enlarged photo"
            >
              <X size={20} />
            </button>

            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-2 border-[var(--primary)] shadow-lg bg-[var(--surface-sunken)] flex items-center justify-center">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-orange-500/20">
                  <span className="text-6xl font-bold text-[var(--primary)]">
                    {(profile.fullName || profile.username || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[var(--text)]">{profile.fullName}</h3>
              <p className="text-xs text-[var(--text-muted)]">@{profile.username}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Habit Post Modal for Star Board */}
      {showHabitPostModal && isOwnProfile && (
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
        initialTrack={profile.song || undefined}
        onSelectSong={(song) => handleUpdateProfileSong(song)}
        title="Choose Your Profile Song 🎵"
      />

      {/* Note Song Picker Modal */}
      <SongPickerModal
        isOpen={showNoteSongPickerModal}
        onClose={() => setShowNoteSongPickerModal(false)}
        initialTrack={noteSong || undefined}
        onSelectSong={(song) => {
          setNoteSong(song);
          setShowNoteSongPickerModal(false);
        }}
        title="Add Song to Note 🎵"
      />

      {/* Post Song Picker Modal for Post-Upload Music Changes */}
      <SongPickerModal
        isOpen={showPostSongPickerModal}
        onClose={() => setShowPostSongPickerModal(false)}
        initialTrack={selectedPostDetail?.song || undefined}
        onSelectSong={(song) => {
          if (selectedPostDetail) {
            DataStore.updatePostSong(selectedPostDetail.id, song);
            setSelectedPostDetail((prev) => (prev ? { ...prev, song } : null));
            setPostsVersion((v) => v + 1);
            showToast('Post background music updated! 🎵✨');
          }
          setShowPostSongPickerModal(false);
        }}
        title="Change Post Music 🎵"
      />

      {/* ─── Long Press Peek & Pop Modal (Instagram Style) ──────────────── */}
      {peekPost && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-scale-in select-none"
          onClick={() => setPeekPost(null)}
        >
          <div
            className="w-full max-w-[320px] sm:max-w-[340px] flex flex-col gap-2.5 max-h-[92vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Post Header + Image Preview Card */}
            <div
              className="w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--line)] bg-[var(--card)] cursor-pointer"
              onClick={() => {
                const target = peekPost;
                setPeekPost(null);
                setSelectedPostDetail(target);
              }}
              title="Tap to open full post"
            >
              {/* Header */}
              <div className="px-3.5 py-2.5 flex items-center justify-between bg-[var(--surface)] border-b border-[var(--line)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--surface-sunken)] flex items-center justify-center shrink-0 border border-[var(--line)]">
                    {peekPost.avatar ? (
                      <img src={peekPost.avatar} alt={peekPost.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[var(--primary)]">
                        {peekPost.username.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-[var(--text)]">@{peekPost.username}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">DPS Hyderabad • {peekPost.class || 'Student'}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)] font-semibold border border-[var(--line)]">
                  Preview
                </span>
              </div>

              {/* Image Preview with Adjust Preview toggle support */}
              <div className="w-full aspect-square bg-black relative flex items-center justify-center overflow-hidden">
                {(() => {
                  const displayImg = peekPost.imageUrl || (peekPost.images && peekPost.images.length > 0 ? peekPost.images[0] : null);
                  if (!displayImg) {
                    return (
                      <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                        {peekPost.caption}
                      </div>
                    );
                  }
                  return (
                    <img
                      src={displayImg}
                      alt={peekPost.caption}
                      className={`w-full h-full transition-all duration-300 ${
                        peekFitMode === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                    />
                  );
                })()}

                {/* Carousel badge if multi-photo */}
                {peekPost.images && peekPost.images.length > 1 && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold z-10">
                    1/{peekPost.images.length} 📷
                  </div>
                )}

                {/* Pinned badge */}
                {peekPost.isPinned && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center gap-1 shadow-xs z-10">
                    <Pin size={10} className="fill-black rotate-45" />
                    <span>Pinned</span>
                  </div>
                )}

                {/* Audio Track Pill */}
                {peekPost.song && (
                  <div className="absolute bottom-2.5 inset-x-2.5 z-10">
                    <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 shadow-md">
                      <Music size={12} className="text-pink-400 shrink-0 animate-pulse" />
                      <span className="truncate">{peekPost.song.title} • {peekPost.song.artist}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Action Menu Card (Instagram quick actions as shown in reel screenshot) */}
            <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--line)] bg-[var(--card)] divide-y divide-[var(--line)]">
              {/* Option 1: Reorder Grid (Reordenar grade) */}
              {isOwnProfile && originalPosts.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setPeekPost(null);
                    setIsRearrangeMode(true);
                    showToast('Rearrange mode enabled! Drag or tap ◀ ▶ to reorder. ▦');
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-[var(--text)] group"
                >
                  <Grid3X3 size={18} className="text-[var(--text-muted)] group-hover:text-blue-500 transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span>Reorder grid</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal">(Reordenar grade)</span>
                    </span>
                    <p className="text-[10px] font-normal text-[var(--text-muted)]">Rearrange photos on your profile</p>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold">▦</span>
                </button>
              )}

              {/* Option 2: Adjust Preview (Ajustar prévia) */}
              <button
                type="button"
                onClick={() => {
                  setPeekFitMode((mode) => (mode === 'cover' ? 'contain' : 'cover'));
                  showToast(peekFitMode === 'cover' ? 'Preview set to Fit (Ajustar prévia) ⛶' : 'Preview set to Fill ⛶');
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-[var(--text)] group"
              >
                <Maximize2 size={18} className="text-[var(--text-muted)] group-hover:text-pink-500 transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span>Adjust preview</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">(Ajustar prévia)</span>
                  </span>
                  <p className="text-[10px] font-normal text-[var(--text-muted)]">
                    {peekFitMode === 'cover' ? 'Fit photo to frame' : 'Fill full frame'}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)] font-bold capitalize">
                  {peekFitMode}
                </span>
              </button>

              {/* Option 3: Pin to profile / Unpin from profile */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => {
                    handleTogglePin(peekPost.id);
                    setPeekPost((p) => (p ? { ...p, isPinned: !p.isPinned } : null));
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-[var(--text)] group"
                >
                  <Pin
                    size={18}
                    className={`rotate-45 shrink-0 transition-colors ${
                      peekPost.isPinned ? 'text-amber-500 fill-amber-500' : 'text-[var(--text-muted)] group-hover:text-amber-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <span>{peekPost.isPinned ? 'Unpin from profile' : 'Pin to your profile'}</span>
                    <p className="text-[10px] font-normal text-[var(--text-muted)]">Keep at the top of your grid</p>
                  </div>
                  {peekPost.isPinned && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                      Pinned
                    </span>
                  )}
                </button>
              )}

              {/* Option 4: Like (Curtir) */}
              <button
                type="button"
                onClick={() => {
                  const cur = DataStore.getCurrentUser();
                  if (!cur?.username || cur.username.toLowerCase() === 'guest') {
                    showToast('Please log in to like posts ❤️');
                    return;
                  }
                  const res = DataStore.toggleLikePost(peekPost.id, cur.username);
                  setPeekLikedPosts((prev) => ({ ...prev, [peekPost.id]: res.liked }));
                  setPeekPost((prev) => (prev ? { ...prev, likes: res.likesCount } : null));
                  setPostsVersion((v) => v + 1);
                  showToast(res.liked ? 'Liked post! ❤️' : 'Unliked post');
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-[var(--text)] group"
              >
                <Heart
                  size={18}
                  className={`shrink-0 transition-colors ${
                    (() => {
                      const cur = typeof window !== 'undefined' ? DataStore.getCurrentUser() : null;
                      const isLiked = (cur?.username && DataStore.isPostLiked(peekPost.id, cur.username)) || !!peekLikedPosts[peekPost.id];
                      return isLiked ? 'text-red-500 fill-red-500' : 'text-[var(--text-muted)] group-hover:text-red-500';
                    })()
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span>
                      {(() => {
                        const cur = typeof window !== 'undefined' ? DataStore.getCurrentUser() : null;
                        const isLiked = (cur?.username && DataStore.isPostLiked(peekPost.id, cur.username)) || !!peekLikedPosts[peekPost.id];
                        return isLiked ? 'Liked' : 'Like';
                      })()}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">(Curtir)</span>
                  </span>
                  <p className="text-[10px] font-normal text-[var(--text-muted)]">{DataStore.getPostLikes(peekPost.id)} likes</p>
                </div>
              </button>

              {/* Option 5: Comment (Comentar) */}
              <button
                type="button"
                onClick={() => {
                  const target = peekPost;
                  setPeekPost(null);
                  setSelectedPostDetail(target);
                  setShowDetailComments(true);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-[var(--text)] group"
              >
                <MessageCircle size={18} className="text-[var(--text-muted)] group-hover:text-blue-500 transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span>Comment</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">(Comentar)</span>
                  </span>
                  <p className="text-[10px] font-normal text-[var(--text-muted)]">Open comments and conversation</p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  {peekPost.comments || 0}
                </span>
              </button>

              {/* Option 6: Change Post Music (for owner) */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => {
                    const target = peekPost;
                    setPeekPost(null);
                    setSelectedPostDetail(target);
                    setShowPostSongPickerModal(true);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-[var(--text)] group"
                >
                  <Music size={18} className="text-pink-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span>{peekPost.song ? 'Change background music' : 'Add background music'}</span>
                    <p className="text-[10px] font-normal text-[var(--text-muted)]">
                      {peekPost.song ? `Current: ${peekPost.song.title}` : 'Pick soundtrack from music library'}
                    </p>
                  </div>
                  <span className="text-[10px] text-pink-500 font-bold">🎵</span>
                </button>
              )}

              {/* Option 7: Push Tagged Post to Main Grid (if tagged) */}
              {isOwnProfile && peekPost.username.toLowerCase() !== profile.username.toLowerCase() && (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleTaggedOnGrid(peekPost.id);
                    setPeekPost(null);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-[var(--text)] group"
                >
                  <Tag size={18} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span>
                      {DataStore.isTaggedPostOnGrid(profile.username, peekPost.id)
                        ? 'Remove from main profile grid'
                        : 'Push photo to main profile grid'}
                    </span>
                    <p className="text-[10px] font-normal text-[var(--text-muted)]">Show tagged post on your primary tab</p>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold">🏷️</span>
                </button>
              )}

              {/* Option 8: Share post */}
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(`${window.location.origin}/u/${peekPost.username}?post=${peekPost.id}`);
                  }
                  showToast('Post link copied to clipboard! 📋✨');
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer text-[var(--text)] group"
              >
                <Share2 size={18} className="text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <span>Share</span>
                  <p className="text-[10px] font-normal text-[var(--text-muted)]">Copy shareable link</p>
                </div>
              </button>

              {/* Option 9: Delete post (if own profile) */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this post?')) {
                      DataStore.deletePost(peekPost.id);
                      setPeekPost(null);
                      setPostsVersion((v) => v + 1);
                      showToast('Post deleted 🗑️');
                    }
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs font-semibold hover:bg-red-500/10 transition-colors cursor-pointer text-red-500 group"
                >
                  <Trash2 size={18} className="text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span>Delete post</span>
                    <p className="text-[10px] font-normal text-red-400/80">Permanently remove this photo</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Followers / Following Interactive Modal ──────────────────────── */}
      {showFollowListModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none"
          onClick={() => setShowFollowListModal(false)}
        >
          <div
            className="w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-2xl border flex flex-col overflow-hidden shadow-2xl animate-slide-up"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="w-6" />
              <h3 className="text-sm font-bold text-center truncate" style={{ color: 'var(--text)' }}>
                @{profile.username}
              </h3>
              <button
                type="button"
                onClick={() => setShowFollowListModal(false)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2 Tabs: Followers vs Following */}
            <div className="flex border-b text-xs font-bold" style={{ borderColor: 'var(--line)' }}>
              <button
                type="button"
                onClick={() => setFollowListModalTab('followers')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  followListModalTab === 'followers'
                    ? 'border-blue-500 text-blue-500 font-bold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>Followers</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-sunken)] text-[10px] tabular-nums">
                  {followersList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFollowListModalTab('following')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  followListModalTab === 'following'
                    ? 'border-blue-500 text-blue-500 font-bold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <span>Following</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-sunken)] text-[10px] tabular-nums">
                  {followingList.length}
                </span>
              </button>
            </div>

            {/* Search Filter Box */}
            <div className="p-3 border-b" style={{ borderColor: 'var(--line)' }}>
              <div className="relative">
                <input
                  type="text"
                  value={followListSearchQuery}
                  onChange={(e) => setFollowListSearchQuery(e.target.value)}
                  placeholder={`Search ${followListModalTab}...`}
                  className="w-full text-xs rounded-xl px-3 py-2 pl-8 border bg-[var(--surface-sunken)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500"
                  style={{ borderColor: 'var(--line)' }}
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">
                  🔍
                </span>
                {followListSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setFollowListSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable List of Students */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--line)] max-h-[50vh] p-1">
              {displayedFollowList.length > 0 ? (
                displayedFollowList.map((student) => {
                  const cur = DataStore.getCurrentUser();
                  const isSelf = cur && cur.username.toLowerCase() === student.username.toLowerCase();
                  const isFollowingStudent = cur ? DataStore.isFollowing(cur.username, student.username) : false;
                  const isFollowedByStudent = cur ? DataStore.isFollowedBy(cur.username, student.username) : false;
                  const hasReqStudent = cur ? DataStore.hasRequestedFollow(cur.username, student.username) : false;

                  return (
                    <div
                      key={student.id || student.username}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-[var(--surface-sunken)] rounded-xl transition-colors"
                    >
                      <Link
                        href={`/u/${student.username}`}
                        onClick={() => setShowFollowListModal(false)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-center shrink-0">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-blue-500">
                              {student.username.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate text-[var(--text)] group-hover:underline">
                              @{student.username}
                            </span>
                            {student.isVerified && (
                              <span className="text-[10px] text-blue-500 font-bold" title="Verified DPS Student">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] truncate text-[var(--text-muted)]">
                            {student.fullName}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Class {student.class}-{student.section || 'A'}
                          </p>
                        </div>
                      </Link>

                      {/* Follow / Following Action Button */}
                      <div>
                        {isSelf ? (
                          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)] border border-[var(--line)]">
                            You
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleFollowInModal(student.username)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors shadow-2xs ${
                              isFollowingStudent || hasReqStudent
                                ? 'bg-[var(--surface-sunken)] text-[var(--text)] border border-[var(--line)] hover:bg-red-500/10 hover:text-red-500'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {isFollowingStudent
                              ? 'Following'
                              : hasReqStudent
                              ? 'Requested'
                              : isFollowedByStudent
                              ? 'Follow Back'
                              : 'Follow'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center space-y-1 text-xs text-[var(--text-muted)]">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {followListSearchQuery ? 'No classmates found' : `No ${followListModalTab} yet`}
                  </p>
                  <p className="text-[11px]">
                    {followListSearchQuery
                      ? `No one matching "${followListSearchQuery}"`
                      : followListModalTab === 'followers'
                      ? `@${profile.username} doesn't have any followers yet.`
                      : `@${profile.username} isn't following anyone yet.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
