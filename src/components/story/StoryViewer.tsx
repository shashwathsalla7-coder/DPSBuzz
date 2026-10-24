'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play, Send, Heart, User, Music, Volume2, VolumeX, Eye, Users, ExternalLink, Flag } from 'lucide-react';
import { Story, UserStoryGroup, DataStore } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { globalAudio } from '@/lib/audioManager';

export interface StoryViewerProps {
  userGroups?: UserStoryGroup[];
  stories?: Story[];
  initialUserIndex?: number;
  initialStoryIndex?: number;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onStorySeen?: (storyId: string) => void;
}

const STORY_DURATION_MS = 5000; // 5 seconds per story slide
const QUICK_REACTIONS = ['❤️', '🔥', '😂', '👏', '😮', '😢', '😍', '💯'];

// ─── Template Renderer (Celebration Templates) ──────────────────────────────
const TemplateRenderer: React.FC<{ story: Story }> = ({ story }) => {
  const name = story.templateData?.name || 'Friend';
  const photoUrl = story.templateData?.extra;
  const wish = story.text;

  // Safe padding so template content never overlaps top progress bars / header or bottom reply bar
  const templateContainerStyle: React.CSSProperties = {
    paddingTop: 'max(env(safe-area-inset-top, 0px) + 84px, 110px)',
    paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 84px, 110px)',
  };

  if (story.template === 'birthday') {
    return (
      <div
        className="w-full h-full min-h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto relative z-10"
        style={{
          ...templateContainerStyle,
          background: 'radial-gradient(circle at 50% 20%, #4c1d95 0%, #1e1035 55%, #0f0720 100%)',
        }}
      >
        <div className="absolute top-28 left-4 text-4xl select-none pointer-events-none" aria-hidden>🎈</div>
        <div className="absolute top-26 right-6 text-3xl select-none pointer-events-none" aria-hidden>🎉</div>
        <div className="absolute bottom-28 left-4 text-2xl select-none pointer-events-none" aria-hidden>✨</div>
        <div className="absolute bottom-24 right-4 text-3xl select-none pointer-events-none" aria-hidden>🎊</div>

        {/* Crown sticker */}
        <div className="text-4xl select-none mb-1 drop-shadow-md" aria-hidden>👑</div>

        {/* Birthday Photo in golden celebratory frame */}
        <div className="relative mb-3.5 shrink-0">
          {photoUrl ? (
            <div
              className="w-28 h-28 overflow-hidden shadow-2xl shrink-0 rounded-full"
              style={{
                border: '3.5px solid #F59E0B',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.55)',
              }}
            >
              <img src={photoUrl} alt={name} className="w-full h-full object-cover rounded-full" />
            </div>
          ) : (
            <div
              className="w-28 h-28 flex items-center justify-center text-4xl font-extrabold text-white rounded-full"
              style={{
                border: '3.5px solid #F59E0B',
                background: 'rgba(255,255,255,0.15)',
                boxShadow: '0 0 25px rgba(245, 158, 11, 0.45)',
              }}
            >
              {name[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="absolute -bottom-2.5 -right-2.5 text-2xl" aria-hidden>🎂</div>
        </div>

        {/* Happy Birthday tag */}
        <div className="px-3.5 py-0.5 bg-amber-400 text-black font-black text-xs tracking-wider uppercase mb-2 shadow-sm rounded-full">
          HAPPY BIRTHDAY
        </div>

        {/* Birthday Boy / Girl Name */}
        <h2
          className="text-white text-3xl sm:text-4xl font-black px-4 leading-tight drop-shadow-lg"
          style={{ fontFamily: 'var(--font-display)', textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}
        >
          {name}
        </h2>

        {/* Personal wish message */}
        <p className="text-amber-200 text-sm mt-3 px-6 leading-relaxed font-medium">
          {wish || 'Wishing you the happiest birthday! Keep shining! 🎂🎉✨'}
        </p>

        <p className="text-white/45 text-xs mt-4 font-semibold">
          DPS Buzz • Celebrate Classmates 🐝
        </p>
      </div>
    );
  }

  if (story.template === 'goodluck') {
    return (
      <div
        className="w-full h-full min-h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto relative z-10"
        style={{
          ...templateContainerStyle,
          background: 'linear-gradient(160deg, #0c2340 0%, #1E3A8A 60%, #0B9DB0 100%)',
        }}
      >
        <p className="text-6xl mb-3 select-none" aria-hidden>⭐</p>
        {photoUrl && (
          <div className="w-24 h-24 overflow-hidden mb-3 border-2 border-white shadow-lg rounded-full shrink-0">
            <img src={photoUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          </div>
        )}
        <div className="px-3 py-0.5 bg-cyan-400 text-black font-extrabold text-[11px] tracking-widest uppercase mb-2 rounded-full">
          ALL THE BEST
        </div>
        <h2 className="text-white text-3xl font-black px-4" style={{ fontFamily: 'var(--font-display)' }}>
          {name}
        </h2>
        <p className="text-cyan-100 text-sm mt-3 px-6 leading-relaxed font-medium">
          {wish || 'Bring home the trophy! Whole school is cheering for you! 🏆✨'}
        </p>
      </div>
    );
  }

  if (story.template === 'congrats') {
    return (
      <div
        className="w-full h-full min-h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto relative z-10"
        style={{
          ...templateContainerStyle,
          background: 'linear-gradient(145deg, #064e3b 0%, #047857 50%, #059669 100%)',
        }}
      >
        <p className="text-6xl mb-2 select-none" aria-hidden>🏆</p>
        {photoUrl && (
          <div className="w-24 h-24 overflow-hidden mb-3 border-2 border-amber-300 shadow-xl rounded-full shrink-0">
            <img src={photoUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          </div>
        )}
        <div className="px-3.5 py-0.5 bg-amber-400 text-black font-black text-xs tracking-wider uppercase mb-2 rounded-full">
          CONGRATULATIONS
        </div>
        <h2 className="text-white text-3xl font-black px-4" style={{ fontFamily: 'var(--font-display)' }}>
          {name}
        </h2>
        <p className="text-emerald-100 text-sm mt-3 px-6 font-medium">
          {wish || 'Outstanding achievement! We are all so proud of you! 👏🎉'}
        </p>
      </div>
    );
  }

  if (story.template === 'topscorer') {
    return (
      <div
        className="w-full h-full min-h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto relative z-10"
        style={{
          ...templateContainerStyle,
          background: 'linear-gradient(150deg, #78350f 0%, #d97706 60%, #b45309 100%)',
        }}
      >
        <p className="text-6xl mb-2 select-none" aria-hidden>🥇</p>
        {photoUrl && (
          <div className="w-24 h-24 overflow-hidden mb-3 border-2 border-white shadow-lg rounded-full shrink-0">
            <img src={photoUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          </div>
        )}
        <div className="px-3 py-0.5 bg-yellow-300 text-black font-extrabold text-[11px] tracking-widest uppercase mb-1.5 rounded-full">
          TOP SCORER
        </div>
        <h2 className="text-white text-3xl font-black px-4" style={{ fontFamily: 'var(--font-display)' }}>
          {name}
        </h2>
        <p className="text-yellow-100 text-sm mt-3 px-6 font-medium">
          {wish || 'Highest marks in class! Absolute legend!'}
        </p>
      </div>
    );
  }

  return null;
};

export const StoryViewer: React.FC<StoryViewerProps> = ({
  userGroups,
  stories,
  initialUserIndex = 0,
  initialStoryIndex = 0,
  initialIndex = 0,
  isOpen,
  onClose,
  onStorySeen,
}) => {
  // Normalize userGroups from either passed userGroups or flat stories array
  const effectiveGroups = useMemo<UserStoryGroup[]>(() => {
    if (userGroups && userGroups.length > 0) {
      return userGroups.filter((g) => g.stories && g.stories.length > 0);
    }
    if (stories && stories.length > 0) {
      // Group flat stories by username
      const map = new Map<string, Story[]>();
      for (const s of stories) {
        if (!map.has(s.username)) map.set(s.username, []);
        map.get(s.username)!.push(s);
      }
      const groups: UserStoryGroup[] = [];
      map.forEach((uStories, username) => {
        uStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const first = uStories[0];
        groups.push({
          username,
          fullName: first.fullName || username,
          avatar: first.avatar,
          stories: uStories,
          hasUnseen: uStories.some((s) => !s.isSeen),
        });
      });
      groups.sort((a, b) => {
        const latestA = Math.max(...a.stories.map((s) => new Date(s.createdAt).getTime() || 0));
        const latestB = Math.max(...b.stories.map((s) => new Date(s.createdAt).getTime() || 0));
        return latestB - latestA;
      });
      return groups;
    }
    return [];
  }, [userGroups, stories]);

  // Which user profile is currently open (0 .. effectiveGroups.length - 1)
  const [currentUserIndex, setCurrentUserIndex] = useState<number>(initialUserIndex);

  // Which story index within this profile (0 .. currentGroup.stories.length - 1)
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(initialStoryIndex);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => globalAudio.getSavedMuteState());
  const [audioIsPlaying, setAudioIsPlaying] = useState<boolean>(false);
  const [showMusicCreditSheet, setShowMusicCreditSheet] = useState<boolean>(false);
  const [reportedSong, setReportedSong] = useState<boolean>(false);
  const [replyText, setReplyText] = useState('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);

  // Story Activity & Analytics State
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [activityTab, setActivityTab] = useState<'views' | 'likes'>('views');

  // Live views & likes mapping per storyId
  const [storyLikes, setStoryLikes] = useState<{ [id: string]: boolean }>({});
  const [storyLikesCount, setStoryLikesCount] = useState<{ [id: string]: number }>({});
  const [storyViewsCount, setStoryViewsCount] = useState<{ [id: string]: number }>({});
  const [storyViewers, setStoryViewers] = useState<{ [id: string]: string[] }>({});
  const [storyLikers, setStoryLikers] = useState<{ [id: string]: string[] }>({});

  const currentUser = useMemo(() => DataStore.getCurrentUser(), []);
  const currentUsername = useMemo(() => (currentUser?.username || '').toLowerCase().trim(), [currentUser]);
  const [profiles, setProfiles] = useState(() => DataStore.getProfiles());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedBeforePauseRef = useRef<number>(0);
  const seenStoriesRef = useRef<Set<string>>(new Set());
  const prevIsOpenRef = useRef<boolean>(false);

  // Sync state on open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && effectiveGroups.length > 0) {
      const uIdx = Math.max(0, Math.min(initialUserIndex, effectiveGroups.length - 1));
      const targetGroup = effectiveGroups[uIdx];
      const sIdx = targetGroup?.stories
        ? Math.max(0, Math.min(initialStoryIndex, targetGroup.stories.length - 1))
        : 0;

      setCurrentUserIndex(uIdx);
      setCurrentStoryIndex(sIdx);
      setIsPaused(false);
      setIsMuted(false);
      setShowActivitySheet(false);
      setFloatingEmoji(null);
      setToastMessage('');
      elapsedBeforePauseRef.current = 0;
      setReplyText('');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialUserIndex, initialStoryIndex, effectiveGroups.length]);

  // Reset seen tracking and stop audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      seenStoriesRef.current.clear();
      setShowActivitySheet(false);
      setShowMusicCreditSheet(false);
      globalAudio.stop();
    }
  }, [isOpen]);

  // Listen to audio player state changes
  useEffect(() => {
    const unsub = globalAudio.subscribe((state) => {
      setAudioIsPlaying(state.isPlaying);
    });
    return () => unsub();
  }, []);

  // Ensure audio is stopped on unmount
  useEffect(() => {
    return () => {
      globalAudio.stop();
    };
  }, []);

  // Current active profile and story
  const currentGroup = effectiveGroups[currentUserIndex] || effectiveGroups[0];
  const currentStories = currentGroup?.stories || [];
  const currentStory = currentStories[currentStoryIndex] || currentStories[0];

  // Audio Playback Sync with Active Story Slide & Pause State
  useEffect(() => {
    if (!isOpen) {
      globalAudio.stop();
      return;
    }

    if (currentStory?.song && !isPaused && !isMuted && !showActivitySheet && !showMusicCreditSheet) {
      globalAudio.setMuted(false);
      globalAudio.playTrack(currentStory.song);
    } else {
      globalAudio.pauseTrack();
    }

    return () => {
      globalAudio.pauseTrack();
    };
  }, [isOpen, currentStory?.id, currentStory?.song, isPaused, isMuted, showActivitySheet, showMusicCreditSheet]);

  // Avatar color pair
  const pair = getAvatarColorPair(currentStory?.username || 'student');

  // Synchronize current story views & likes
  const syncStoryStats = useCallback((storyId: string) => {
    const allStories = DataStore.getStories();
    const st = allStories.find((s) => s.id === storyId);
    if (st) {
      const vList = Array.isArray(st.viewers) ? st.viewers : [];
      const lList = Array.isArray(st.likers) ? st.likers : [];
      const vCount = Math.max(vList.length, st.viewsCount || 0);
      const lCount = Math.max(lList.length, st.likesCount || 0);
      const isLiked = lList.some((u) => u.toLowerCase() === currentUsername);

      setStoryViewsCount((prev) => ({ ...prev, [storyId]: vCount }));
      setStoryViewers((prev) => ({ ...prev, [storyId]: vList }));
      setStoryLikesCount((prev) => ({ ...prev, [storyId]: lCount }));
      setStoryLikers((prev) => ({ ...prev, [storyId]: lList }));
      setStoryLikes((prev) => ({ ...prev, [storyId]: isLiked }));
    }
  }, [currentUsername]);

  // Mark story as seen when it becomes active & sync views/likes
  useEffect(() => {
    if (isOpen && currentStory?.id) {
      if (!seenStoriesRef.current.has(currentStory.id)) {
        seenStoriesRef.current.add(currentStory.id);
        if (onStorySeen) onStorySeen(currentStory.id);
      }
      DataStore.markStorySeen(currentStory.id, currentUsername);
      syncStoryStats(currentStory.id);
    }
  }, [isOpen, currentStory?.id, onStorySeen, currentUsername, syncStoryStats]);

  // Real-time listener for content updates
  useEffect(() => {
    const handleUpdate = () => {
      setProfiles(DataStore.getProfiles());
      if (currentStory?.id) {
        syncStoryStats(currentStory.id);
      }
    };
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
  }, [currentStory?.id, syncStoryStats]);

  // Check if viewing own story
  const isOwnStory = useMemo(() => {
    if (!currentGroup && !currentStory) return false;
    const authorUser = (currentStory?.username || currentGroup?.username || '').toLowerCase().trim();
    return authorUser === currentUsername || currentStory?.isOwn === true;
  }, [currentGroup, currentStory, currentUsername]);

  const currentStoryId = currentStory?.id || '';
  const currentViewsCount = storyViewsCount[currentStoryId] ?? currentStory?.viewsCount ?? currentStory?.viewers?.length ?? 1;
  const currentLikesCount = storyLikesCount[currentStoryId] ?? currentStory?.likesCount ?? currentStory?.likers?.length ?? 0;
  const isCurrentStoryLiked = storyLikes[currentStoryId] ?? (currentStory?.likers?.some((u) => u.toLowerCase() === currentUsername) || false);
  const viewersList = storyViewers[currentStoryId] ?? currentStory?.viewers ?? [];
  const likersList = storyLikers[currentStoryId] ?? currentStory?.likers ?? [];

  // ─── INSTAGRAM NAVIGATION ───────────────────────────────────────────────────

  // Next Story / Next Profile Handler
  const handleNext = useCallback(() => {
    setShowActivitySheet(false);
    if (currentStoryIndex < currentStories.length - 1) {
      // 1. Same Profile: advance to NEXT story of this profile!
      setCurrentStoryIndex((prev) => prev + 1);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      // 2. Finished this profile's stories: advance to NEXT PROFILE!
      if (currentUserIndex < effectiveGroups.length - 1) {
        setCurrentUserIndex((prev) => prev + 1);
        setCurrentStoryIndex(0); // Start at story 1 of the new profile
        elapsedBeforePauseRef.current = 0;
        startTimeRef.current = Date.now();
      } else {
        // All profiles finished -> close viewer
        onClose();
      }
    }
  }, [currentStoryIndex, currentStories.length, currentUserIndex, effectiveGroups.length, onClose]);

  // Previous Story / Previous Profile Handler
  const handlePrev = useCallback(() => {
    setShowActivitySheet(false);
    if (currentStoryIndex > 0) {
      // 1. Same Profile: go back to PREVIOUS story of this profile!
      setCurrentStoryIndex((prev) => prev - 1);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      // 2. At story 1 of this profile: go back to PREVIOUS PROFILE's LAST story!
      if (currentUserIndex > 0) {
        const prevGroup = effectiveGroups[currentUserIndex - 1];
        const lastStoryIdx = Math.max(0, prevGroup.stories.length - 1);
        setCurrentUserIndex((prev) => prev - 1);
        setCurrentStoryIndex(lastStoryIdx);
        elapsedBeforePauseRef.current = 0;
        startTimeRef.current = Date.now();
      } else {
        // First story of first profile: restart progress from 0
        elapsedBeforePauseRef.current = 0;
        startTimeRef.current = Date.now();
      }
    }
  }, [currentStoryIndex, currentUserIndex, effectiveGroups]);

  // Jump directly to Next Profile
  const handleNextProfile = useCallback(() => {
    setShowActivitySheet(false);
    if (currentUserIndex < effectiveGroups.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  }, [currentUserIndex, effectiveGroups.length, onClose]);

  // Jump directly to Previous Profile
  const handlePrevProfile = useCallback(() => {
    setShowActivitySheet(false);
    if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentStoryIndex(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    }
  }, [currentUserIndex]);

  // Auto-advance timer (5 seconds per slide, 0ms idle CPU, hardware accelerated)
  useEffect(() => {
    if (!isOpen || isPaused || showActivitySheet || !currentStory) return;

    const remaining = Math.max(150, STORY_DURATION_MS - elapsedBeforePauseRef.current);
    startTimeRef.current = Date.now();

    const timeout = setTimeout(() => {
      elapsedBeforePauseRef.current = 0;
      handleNext();
    }, remaining);

    return () => clearTimeout(timeout);
  }, [isOpen, isPaused, showActivitySheet, currentUserIndex, currentStoryIndex, currentStory, handleNext]);

  // Pause / Resume handler on touch hold
  const handlePause = () => {
    if (!isPaused) {
      elapsedBeforePauseRef.current += Math.max(0, Date.now() - startTimeRef.current);
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (isPaused) {
      startTimeRef.current = Date.now();
      setIsPaused(false);
    }
  };

  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      handlePause();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleResume();
    if (e.changedTouches.length === 1) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;

      // Swipe up from bottom area -> open Activity Sheet (STRICTLY FOR STORY CREATOR ONLY)
      if (isOwnStory && deltaY < -70 && touchStartY.current > 300 && Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
        handlePause();
        setShowActivitySheet(true);
        return;
      }
      // Pull down gesture (swipe down from header area) -> dismiss story
      if (deltaY > 90 && touchStartY.current < 240 && Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
        onClose();
        return;
      }
      // Swipe left -> Next user profile / story
      if (deltaX < -70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        handleNext();
        return;
      }
      // Swipe right -> Prev user profile / story
      if (deltaX > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        handlePrev();
        return;
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showActivitySheet) {
          setShowActivitySheet(false);
          handleResume();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev, showActivitySheet]);

  // Story Reply handler
  const handleSendStoryReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed || !currentStory) return;

    DataStore.sendStoryReplyToChat(currentStory, trimmed, currentUsername);

    setReplyText('');
    setFloatingEmoji('💬');
    setTimeout(() => setFloatingEmoji(null), 900);
    setToastMessage(`Sent reply directly to @${currentGroup.username}'s chat! 💬`);
    setTimeout(() => setToastMessage(''), 2400);
    handleResume();
  };

  // Quick Emoji Reaction handler
  const handleSendQuickReaction = (emoji: string) => {
    if (!currentStory) return;
    DataStore.sendStoryReplyToChat(currentStory, emoji, currentUsername);
    setFloatingEmoji(emoji);
    setTimeout(() => setFloatingEmoji(null), 1100);
    setToastMessage(`Reacted ${emoji} to @${currentGroup.username}! 💬`);
    setTimeout(() => setToastMessage(''), 2400);
  };

  // Story Like Toggle handler
  const handleToggleLike = () => {
    if (!currentStory) return;
    const res = DataStore.toggleLikeStory(currentStory.id, currentUsername);
    setStoryLikes((prev) => ({ ...prev, [currentStory.id]: res.liked }));
    setStoryLikesCount((prev) => ({ ...prev, [currentStory.id]: res.likesCount }));

    if (res.liked) {
      setFloatingEmoji('❤️');
      setTimeout(() => setFloatingEmoji(null), 1100);
      setToastMessage(`Liked @${currentGroup.username}'s story ❤️`);
      setTimeout(() => setToastMessage(''), 2200);
    }
  };

  if (!isOpen || !currentStory || !currentGroup) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Story viewer"
    >
      {/* Desktop Left Profile Skip Button */}
      {currentUserIndex > 0 && (
        <button
          type="button"
          onClick={handlePrevProfile}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/10 hover:bg-white/25 text-white flex-col items-center gap-1 transition-all rounded-full cursor-pointer"
          aria-label="Previous profile"
          title={`Previous profile: @${effectiveGroups[currentUserIndex - 1]?.username}`}
        >
          <ChevronLeft size={24} />
          <span className="text-[10px] font-mono font-bold max-w-[80px] truncate">
            @{effectiveGroups[currentUserIndex - 1]?.username}
          </span>
        </button>
      )}

      {/* Main Container constrained to mobile phone ratio */}
      <div
        className="relative w-full max-w-[420px] h-[100dvh] sm:h-[92vh] sm:my-auto flex flex-col justify-between overflow-hidden shadow-2xl rounded-none sm:rounded-[32px] border border-white/10"
        style={{
          background: currentStory.background || '#0B0F1A',
        }}
      >
        {/* Top Overlay: PROGRESS BARS (EXACT NUMBER OF BARS = NUMBER OF STORIES OF THIS PROFILE) */}
        <div
          className="absolute top-0 inset-x-0 z-30 px-4 pb-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px) + 16px, 54px)' }}
        >
          {/* THE NO OF STORIES OF A PROFILE IS NO OF BARS */}
          <div className="flex items-center gap-1.5 w-full mb-3" aria-label="Profile story progress bars">
            {currentStories.map((s, idx) => {
              const isPast = idx < currentStoryIndex;
              const isCurrent = idx === currentStoryIndex;

              return (
                <div
                  key={`${currentUserIndex}-${s.id || idx}`}
                  className="h-[3px] rounded-full overflow-hidden flex-1 bg-white/30"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.30)',
                  }}
                >
                  <div
                    key={`${currentUserIndex}-${idx}-${currentStoryIndex}`}
                    className="h-full bg-white rounded-full w-full"
                    style={{
                      transformOrigin: 'left',
                      transform: isPast ? 'scaleX(1)' : isCurrent ? undefined : 'scaleX(0)',
                      animation: isCurrent ? `story-progress-fill ${STORY_DURATION_MS}ms linear forwards` : 'none',
                      animationPlayState: isPaused ? 'paused' : 'running',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* User profile header & Close button */}
          {(() => {
            const effectiveStoryAvatar =
              currentStory.avatar ||
              currentGroup.avatar ||
              DataStore.getProfileByUsername(currentGroup.username)?.avatar ||
              null;
            return (
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white/60 shrink-0 overflow-hidden"
                    style={{ backgroundColor: pair.bg, color: pair.text }}
                  >
                    {effectiveStoryAvatar ? (
                      <img
                        src={effectiveStoryAvatar}
                        alt={currentGroup.fullName || currentGroup.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentGroup.username.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-xs sm:text-sm tracking-tight leading-tight drop-shadow-sm">
                        {currentGroup.username}
                      </span>
                  {/* Indicator showing which story of this user */}
                  {currentStories.length > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/20 text-white font-mono rounded-full">
                      {currentStoryIndex + 1}/{currentStories.length}
                    </span>
                  )}
                </div>
                <span className="text-white/75 text-[11px] leading-tight">
                  @{currentGroup.username} • {currentStory.createdAt ? `${Math.max(1, Math.floor((Date.now() - new Date(currentStory.createdAt).getTime()) / 3600000))}h` : '24h story'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentStory.song && (
                <button
                  type="button"
                  onClick={() => {
                    globalAudio.unlockAudio();
                    setIsMuted((m) => {
                      const next = !m;
                      globalAudio.setMuted(next);
                      if (!next && currentStory.song) {
                        globalAudio.playTrack(currentStory.song);
                      }
                      return next;
                    });
                  }}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-white bg-black/60 hover:bg-black/80 border border-white/30 cursor-pointer transition-all active:scale-95 shadow-md"
                  aria-label={isMuted ? 'Unmute story music' : 'Mute story music'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-white bg-black/60 hover:bg-black/80 border border-white/30 cursor-pointer transition-all active:scale-95 shadow-md"
                aria-label={isPaused ? 'Resume story' : 'Pause story'}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-white bg-black/60 hover:bg-black/80 border border-white/30 cursor-pointer transition-all active:scale-95 shadow-md"
                aria-label="Close story"
              >
                <X size={20} />
              </button>
            </div>
          </div>
            );
          })()}

          {/* Song Badge Pill if Story has Music Attached */}
          {currentStory.song && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {currentStory.song.isUnavailable ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white/50 text-[11px] font-medium animate-fade-in shadow-md">
                  <Music size={12} className="text-white/40" />
                  <span>Song no longer available</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsPaused(true);
                    setShowMusicCreditSheet(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white w-fit animate-fade-in shadow-md hover:bg-black/80 transition-colors cursor-pointer text-left"
                  title="View music credits & license"
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-pink-500/20 flex items-center justify-center shrink-0">
                    {currentStory.song.artworkUrl ? (
                      <img src={currentStory.song.artworkUrl} alt={currentStory.song.title} className="w-full h-full object-cover" />
                    ) : (
                      <Music size={10} className="text-pink-400" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold truncate max-w-[150px]">♪ {currentStory.song.title}</span>
                  <span className="text-[10px] text-white/70 truncate max-w-[90px]">• {currentStory.song.artist}</span>
                  {currentStory.song.startTime !== undefined && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/30 text-pink-300 font-mono font-bold shrink-0">
                      0:{Math.floor(currentStory.song.startTime).toString().padStart(2, '0')}
                    </span>
                  )}
                  {/* Equalizer animation bars */}
                  {!isPaused && !isMuted && audioIsPlaying && (
                    <div className="flex items-end gap-0.5 h-3 ml-0.5 shrink-0" aria-hidden="true">
                      <span className="w-0.5 bg-pink-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                      <span className="w-0.5 bg-pink-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2" />
                      <span className="w-0.5 bg-pink-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-2.5" />
                    </div>
                  )}
                </button>
              )}

              {/* Tap to Play Sound Banner if Browser Blocked Autoplay */}
              {!isMuted && !audioIsPlaying && !isPaused && !currentStory.song.isUnavailable && (
                <button
                  type="button"
                  onClick={() => {
                    globalAudio.unlockAudio();
                    globalAudio.playTrack(currentStory.song!);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-600/90 hover:bg-pink-500 text-white text-[11px] font-bold shadow-lg animate-pulse cursor-pointer border border-white/30 transition-all active:scale-95"
                >
                  <Volume2 size={13} />
                  <span>Tap for sound 🔊</span>
                </button>
              )}
            </div>
          )}

          {/* Repost Badge Pill if Story is a Repost */}
          {currentStory.isRepost && currentStory.repostedFrom && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white w-fit animate-fade-in shadow-md">
              <span className="text-pink-400 font-bold text-xs">🔄</span>
              <span className="text-[11px] font-bold">
                Original post by @{currentStory.repostedFrom.username}
              </span>
            </div>
          )}
        </div>

        {/* Story Body Content */}
        <div
          className="relative flex-1 w-full h-full flex flex-col items-center justify-center text-center select-none overflow-y-auto overscroll-contain"
          onPointerDown={handlePause}
          onPointerUp={handleResume}
          onPointerLeave={handleResume}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            touchAction: 'pan-y',
            ...(currentStory.imageUrl
              ? { padding: 0 }
              : {
                  paddingTop: 'max(env(safe-area-inset-top, 0px) + 84px, 110px)',
                  paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 84px, 110px)',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }),
          }}
        >
          {currentStory.imageUrl ? (
            /* Full-bleed Photo Story with Instagram Filters, Stickers, and Text Overlay */
            <>
              <img
                src={currentStory.imageUrl}
                alt="Story photo"
                className="absolute inset-0 w-full h-full object-cover rounded-none transition-all duration-300"
                style={{ filter: currentStory.filter || 'none' }}
              />

              {/* Useful Student Stickers overlay */}
              {currentStory.stickers && currentStory.stickers.length > 0 && (
                <div className="absolute top-28 left-4 z-20 space-y-2 pointer-events-none">
                  {currentStory.stickers.map((stk, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-2xl ${stk.color || 'bg-black/80 text-white'} max-w-[260px] shadow-xl text-left animate-fade-in`}
                    >
                      <p className="text-xs font-black leading-tight">{stk.title}</p>
                      {stk.subtitle && (
                        <p className="text-[10px] text-white/80 leading-tight mt-0.5">{stk.subtitle}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Written Text on Story (Aa) */}
              {currentStory.text && (
                <div className="absolute bottom-24 left-0 right-0 px-6 text-center z-10 pointer-events-none">
                  <span
                    className={`inline-block text-xl sm:text-2xl leading-snug drop-shadow-lg ${
                      currentStory.textStyle?.bgStyle === 'fill'
                        ? 'px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md shadow-xl'
                        : currentStory.textStyle?.bgStyle === 'semi'
                        ? 'px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm'
                        : 'drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]'
                    } ${
                      currentStory.textStyle?.font === 'bold'
                        ? 'font-black tracking-tight'
                        : currentStory.textStyle?.font === 'neon'
                        ? 'font-mono font-bold tracking-wide drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                        : currentStory.textStyle?.font === 'typewriter'
                        ? 'font-mono font-medium'
                        : 'font-sans font-bold'
                    }`}
                    style={{
                      color: currentStory.textStyle?.color || currentStory.textColor || '#FFFFFF',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {currentStory.text}
                  </span>
                </div>
              )}
            </>
          ) : currentStory.template ? (
            /* Template Story */
            <TemplateRenderer story={currentStory} />
          ) : currentStory.text ? (
            /* Text Story */
            <div className="w-full max-w-sm flex flex-col items-center justify-center animate-fade-in py-6">
              <p
                className="text-[28px] sm:text-[32px] font-extrabold tracking-tight leading-snug drop-shadow-sm select-none break-words"
                style={{ color: currentStory.textColor || '#FFFFFF', fontFamily: 'var(--font-display)' }}
              >
                {currentStory.text}
              </p>
            </div>
          ) : currentStory.mediaUrl ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story media"
              className="max-h-full max-w-full object-contain rounded-none"
            />
          ) : (
            <p className="text-white text-lg font-medium">DPS Buzz Story</p>
          )}

          {/* Navigation Tap Zones: Left 20% and Right 20%, bounded between top and bottom bars so center 60% can freely scroll */}
          <div
            className="absolute top-28 bottom-28 left-0 w-[20%] z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous story"
          />
          <div
            className="absolute top-28 bottom-28 right-0 w-[20%] z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next story"
          />
        </div>

        {/* Desktop Step Nav Arrows for within-story steps */}
        <button
          type="button"
          onClick={handlePrev}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-black/60 hover:bg-black/80 text-white items-center justify-center transition-colors cursor-pointer rounded-full"
          aria-label="Previous story slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-black/60 hover:bg-black/80 text-white items-center justify-center transition-colors cursor-pointer rounded-full"
          aria-label="Next story slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Floating Emoji Animation when reacting or liking */}
        {floatingEmoji && (
          <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center animate-[ping_0.7s_ease-out_forwards]">
            <span className="text-7xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] select-none">
              {floatingEmoji}
            </span>
          </div>
        )}

        {/* Toast confirmation when reply sent or reacted */}
        {toastMessage && (
          <div className="absolute top-20 inset-x-0 z-40 flex justify-center animate-fade-in pointer-events-none px-4">
            <span className="text-xs font-bold text-white bg-black/90 px-4 py-2 border border-white/20 rounded-full shadow-2xl backdrop-blur-md">
              {toastMessage}
            </span>
          </div>
        )}

        {/* Bottom Bar: Instagram-style Story Reply / Insights bar elevated above Android navigation bar */}
        <div
          className="absolute inset-x-0 z-30 px-3 pt-2.5 flex flex-col bg-gradient-to-t from-black/95 via-black/70 to-transparent"
          style={{
            bottom: 0,
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 16px, 48px)',
          }}
        >
          {isOwnStory ? (
            /* Own Story: Full-width Activity & Insights Bar */
            <div className="w-full">
              <button
                type="button"
                onClick={() => {
                  handlePause();
                  setActivityTab('views');
                  setShowActivitySheet(true);
                }}
                className="w-full h-12 px-4 flex items-center justify-between bg-black/75 hover:bg-black/90 active:scale-[0.98] backdrop-blur-md border border-white/25 rounded-2xl text-white shadow-xl cursor-pointer transition-all"
                aria-label="View story activity and insights"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Eye size={16} className="text-cyan-400" />
                    <span>{currentViewsCount} {currentViewsCount === 1 ? 'member' : 'members'} saw</span>
                  </div>
                  <span className="text-white/30">•</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Heart size={15} className="text-rose-500 fill-rose-500" />
                    <span>{currentLikesCount} {currentLikesCount === 1 ? 'like' : 'likes'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-300">
                  <span>Activity</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            </div>
          ) : (
            /* Classmate Story: Quick Emoji Reactions + Views Pill + Message Input + Heart Like */
            <div className="w-full flex flex-col gap-2">
              {/* Quick emoji reaction row */}
              <div className="flex items-center justify-between gap-1 px-1 overflow-x-auto no-scrollbar">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendQuickReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg rounded-full bg-black/45 hover:bg-black/75 active:scale-125 transition-all cursor-pointer backdrop-blur-md border border-white/10"
                    title={`React ${emoji}`}
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Main row: Message Input + Heart Like (NO views pill for classmate stories) */}
              <div className="flex items-center gap-2">
                {/* Reply Message Input */}
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={handlePause}
                    onBlur={handleResume}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendStoryReply();
                      }
                    }}
                    placeholder={`Message @${currentGroup.username}...`}
                    className="w-full h-11 pl-4 pr-10 text-xs text-white placeholder-white/60 bg-black/65 backdrop-blur-md border border-white/30 rounded-full outline-none focus:border-white transition-colors shadow-lg"
                  />
                  {replyText.trim() && (
                    <button
                      type="button"
                      onClick={handleSendStoryReply}
                      className="absolute right-2.5 w-7 h-7 flex items-center justify-center text-white hover:text-amber-300 transition-colors cursor-pointer"
                      aria-label="Send reply"
                    >
                      <Send size={15} />
                    </button>
                  )}
                </div>

                {/* Heart Like Button */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`h-11 min-w-[44px] px-3 flex items-center justify-center gap-1.5 bg-black/65 backdrop-blur-md border rounded-full cursor-pointer transition-all hover:scale-105 active:scale-90 shadow-lg shrink-0 ${
                    isCurrentStoryLiked ? 'border-rose-500/80 bg-rose-950/40 text-rose-400' : 'border-white/30 text-white'
                  }`}
                  aria-label="Like story"
                  title={isCurrentStoryLiked ? 'Unlike story' : 'Like story'}
                >
                  <Heart
                    size={19}
                    className={isCurrentStoryLiked ? 'text-rose-500 fill-rose-500 animate-[bounce_0.3s_ease-out]' : 'text-white'}
                  />
                  {currentLikesCount > 0 && (
                    <span className="text-xs font-bold">
                      {currentLikesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Story Activity Sheet Modal (Instagram Style: Viewers & Likers - STRICTLY FOR STORY CREATOR ONLY) */}
        {showActivitySheet && isOwnStory && (
          <div
            className="absolute inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setShowActivitySheet(false);
              handleResume();
            }}
          >
            <div
              className="w-full max-h-[75vh] flex flex-col bg-[#111422] border-t border-white/20 rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab Handle */}
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mt-2.5 mb-1.5" />

              {/* Header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-base">Story Activity</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-mono">
                    @{currentGroup.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowActivitySheet(false);
                    handleResume();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                  aria-label="Close activity"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tabs: Views vs Likes */}
              <div className="flex border-b border-white/10 px-4">
                <button
                  type="button"
                  onClick={() => setActivityTab('views')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                    activityTab === 'views'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <Eye size={15} />
                  <span>Seen ({currentViewsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivityTab('likes')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                    activityTab === 'likes'
                      ? 'border-rose-500 text-rose-400'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <Heart size={15} className={activityTab === 'likes' ? 'fill-rose-500 text-rose-500' : ''} />
                  <span>Liked ({currentLikesCount})</span>
                </button>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh] overscroll-contain">
                {activityTab === 'views' ? (
                  viewersList.length > 0 ? (
                    viewersList.map((viewerUser) => {
                      const prof = profiles.find((p) => p.username.toLowerCase() === viewerUser.toLowerCase());
                      const viewerPair = getAvatarColorPair(viewerUser);
                      const hasLiked = likersList.some((u) => u.toLowerCase() === viewerUser.toLowerCase());

                      return (
                        <div
                          key={viewerUser}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ring-1 ring-white/20 overflow-hidden shrink-0"
                              style={{ backgroundColor: viewerPair.bg, color: viewerPair.text }}
                            >
                              {(prof?.avatar || DataStore.getProfileByUsername(viewerUser)?.avatar) ? (
                                <img src={prof?.avatar || DataStore.getProfileByUsername(viewerUser)?.avatar || ''} alt={viewerUser} className="w-full h-full object-cover" />
                              ) : (
                                viewerUser.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-semibold text-xs">
                                  {prof?.fullName || viewerUser}
                                </span>
                                {hasLiked && (
                                  <Heart size={12} className="text-rose-500 fill-rose-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-white/50 text-[11px]">
                                @{viewerUser} • {prof?.class ? `Class ${prof.class}` : 'Student'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-medium px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30">
                            <Eye size={12} />
                            <span>Saw</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-white/50 space-y-2">
                      <Eye size={32} className="mx-auto text-white/30" />
                      <p className="text-sm font-semibold">No classmates have viewed this yet</p>
                      <p className="text-xs text-white/40">When school friends open the story, they will appear here</p>
                    </div>
                  )
                ) : (
                  likersList.length > 0 ? (
                    likersList.map((likerUser) => {
                      const prof = profiles.find((p) => p.username.toLowerCase() === likerUser.toLowerCase());
                      const likerPair = getAvatarColorPair(likerUser);

                      return (
                        <div
                          key={likerUser}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ring-1 ring-white/20 overflow-hidden shrink-0"
                              style={{ backgroundColor: likerPair.bg, color: likerPair.text }}
                            >
                              {(prof?.avatar || DataStore.getProfileByUsername(likerUser)?.avatar) ? (
                                <img src={prof?.avatar || DataStore.getProfileByUsername(likerUser)?.avatar || ''} alt={likerUser} className="w-full h-full object-cover" />
                              ) : (
                                likerUser.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="text-left">
                              <span className="text-white font-semibold text-xs">
                                {prof?.fullName || likerUser}
                              </span>
                              <p className="text-white/50 text-[11px]">
                                @{likerUser} • {prof?.class ? `Class ${prof.class}` : 'Student'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-rose-300 font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30">
                            <Heart size={12} className="fill-rose-500 text-rose-500" />
                            <span>Liked</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-white/50 space-y-2">
                      <Heart size={32} className="mx-auto text-white/30" />
                      <p className="text-sm font-semibold">No likes yet</p>
                      <p className="text-xs text-white/40">When classmates tap the heart on this story, they will show up here</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Music Credit & Attribution Sheet */}
        {showMusicCreditSheet && currentStory?.song && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
            <div className="w-full max-w-xs bg-[#1a1a1a] border border-[#2e2e2e] rounded-3xl p-5 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Music size={16} className="text-pink-400" /> Song Details
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowMusicCreditSheet(false);
                    setIsPaused(false);
                  }}
                  className="p-1 rounded-full text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={currentStory.song.artworkUrl || '/icons/icon-192.png'}
                  alt={currentStory.song.title}
                  className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate text-white">{currentStory.song.title}</p>
                  <p className="text-xs text-white/70 truncate">{currentStory.song.artist}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-mono">
                    {currentStory.song.license || 'Creative Commons'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/70 space-y-1.5">
                <p className="text-[11px] leading-relaxed">
                  {currentStory.song.creditText || `Music provided courtesy of ${currentStory.song.artist} under Creative Commons.`}
                </p>
                {currentStory.song.sourcePageUrl && (
                  <a
                    href={currentStory.song.sourcePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:underline pt-1"
                  >
                    <span>Listen on Jamendo</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      let username = 'student';
                      const stored = localStorage.getItem('dpsbuzz_user');
                      if (stored) username = JSON.parse(stored).username || 'student';

                      await fetch('/api/music/report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          trackId: currentStory.song?.id,
                          trackTitle: currentStory.song?.title,
                          trackArtist: currentStory.song?.artist,
                          reporterUsername: username,
                          reason: 'Reported from story playback',
                        }),
                      });
                      setReportedSong(true);
                      setTimeout(() => {
                        setReportedSong(false);
                        setShowMusicCreditSheet(false);
                        setIsPaused(false);
                      }, 1200);
                    } catch {}
                  }}
                  className="flex-1 py-2 rounded-xl bg-white/[0.06] hover:bg-red-500/20 hover:text-red-300 text-white/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Flag size={13} />
                  <span>{reportedSong ? 'Reported ✓' : 'Report Song'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMusicCreditSheet(false);
                    setIsPaused(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Right Profile Skip Button */}
      {currentUserIndex < effectiveGroups.length - 1 && (
        <button
          type="button"
          onClick={handleNextProfile}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/10 hover:bg-white/25 text-white flex-col items-center gap-1 transition-all rounded-none cursor-pointer"
          aria-label="Next profile"
          title={`Next profile: @${effectiveGroups[currentUserIndex + 1]?.username}`}
        >
          <ChevronRight size={24} />
          <span className="text-[10px] font-mono font-bold max-w-[80px] truncate">
            @{effectiveGroups[currentUserIndex + 1]?.username}
          </span>
        </button>
      )}
    </div>
  );
};

export default StoryViewer;
