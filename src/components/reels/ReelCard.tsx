/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  UserPlus,
  UserCheck,
  Eye,
} from 'lucide-react';
import { DataStore, type Post, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { UniqueLikeOverlay, playLikeChime, triggerLikeVibration } from '@/components/reels/UniqueLikeOverlay';

interface ReelCardProps {
  reel: Post;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenComments: (reel: Post) => void;
  onOpenShare: (reel: Post) => void;
  onOpenLikesViews?: (reel: Post) => void;
  currentUser: Profile | null;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  onOpenComments,
  onOpenShare,
  onOpenLikesViews,
  currentUser,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isVideoMedia = Boolean(
    reel.isVideo ||
    reel.isReel ||
    reel.videoUrl ||
    (reel.imageUrl && (
      reel.imageUrl.endsWith('.mp4') ||
      reel.imageUrl.endsWith('.webm') ||
      reel.imageUrl.endsWith('.mov') ||
      reel.imageUrl.includes('/video/upload/') ||
      reel.imageUrl.includes('/videos/')
    )) ||
    (reel.images && Array.isArray(reel.images) && reel.images.some((img: string) => typeof img === 'string' && (img.endsWith('.mp4') || img.includes('/video/'))))
  );
  const videoUrl = isVideoMedia ? (reel.videoUrl || (reel.images && reel.images[0]) || reel.imageUrl) : '';
  const authorProf = DataStore.getProfileByUsername(reel.username);
  const authorAvatar = authorProf?.avatar || reel.avatar || null;
  const color = getAvatarColorPair(reel.username);
  const initials = (authorProf?.fullName || reel.fullName || reel.username || 'ST').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (currentUser?.username) {
      const likedIds = DataStore.getUserLikedPostIds(currentUser.username);
      setIsLiked(likedIds.includes(reel.id));
      setIsFollowing(DataStore.isFollowing(currentUser.username, reel.username));
    }
    setLikesCount(DataStore.getPostLikes(reel.id));
    setCommentsCount(DataStore.getAllCommentsMap()[reel.id]?.length || 0);
    setViewsCount(DataStore.getPostViews(reel.id));
  }, [reel.id, currentUser?.username]);

  // Record 1 unique view
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActive && isPlaying) {
      timer = setTimeout(() => {
        const v = DataStore.incrementPostViews(reel.id, currentUser?.username);
        setViewsCount(v);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, isPlaying, reel.id, currentUser?.username]);

  // Video playback management based on active index
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
      setIsCaptionExpanded(false);
    }
  }, [isActive, isMuted]);

  const handleTouchOrClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      handleDoubleTapLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      singleTapTimerRef.current = setTimeout(() => {
        togglePlayPause();
      }, DOUBLE_TAP_DELAY);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 500);
  };

  const handleDoubleTapLike = () => {
    if (!currentUser?.username) return;
    if (!isLiked) {
      const res = DataStore.toggleLikePost(reel.id, currentUser.username);
      const isNow = typeof res === 'boolean' ? res : Boolean((res as any)?.liked);
      setIsLiked(isNow);
      setLikesCount(DataStore.getPostLikes(reel.id));
    }
    setShowHeartAnim(true);
    playLikeChime();
    triggerLikeVibration();
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.username) return;
    const res = DataStore.toggleLikePost(reel.id, currentUser.username);
    const nowLiked = typeof res === 'boolean' ? res : Boolean((res as any)?.liked);
    setIsLiked(nowLiked);
    setLikesCount(DataStore.getPostLikes(reel.id));
    if (nowLiked) {
      playLikeChime();
      triggerLikeVibration();
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (!video || !bar || !video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    bar.style.width = `${pct}%`;
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.username || currentUser.username === reel.username) return;
    const isNowFollowing = DataStore.toggleFollow(currentUser.username, reel.username);
    setIsFollowing(isNowFollowing);
  };

  return (
    <div
      className="relative w-full h-[100dvh] snap-start snap-always overflow-hidden bg-black flex items-center justify-center select-none"
      onClick={handleTouchOrClick}
    >
      {/* Background Video Player */}
      {isVideoMedia && videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover sm:object-contain sm:max-w-[440px]"
          playsInline
          loop
          muted={isMuted}
          preload={isActive ? 'auto' : 'metadata'}
          crossOrigin="anonymous"
          disablePictureInPicture
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
          <img
            src={reel.imageUrl || (reel.images && reel.images[0]) || '/icons/logo.png'}
            alt={reel.caption || reel.username}
            className="w-full h-full object-cover sm:object-contain sm:max-w-[440px]"
          />
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Center Play/Pause Feedback */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center">
            {isPlaying ? <Play size={24} className="translate-x-0.5" /> : <Pause size={24} />}
          </div>
        </div>
      )}

      {/* Center Heart Animation */}
      <UniqueLikeOverlay isVisible={showHeartAnim} onFinished={() => setShowHeartAnim(false)} />

      {/* Subtle overlays for text contrast */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none z-10" />

      {/* Right Side Action Column (Consistent white icons & uniform typography) */}
      <div
        className="absolute right-3.5 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-20 flex flex-col items-center gap-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Like */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleLikeClick}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 active:scale-90 transition-all cursor-pointer min-h-[44px]"
            aria-label={isLiked ? 'Unlike reel' : 'Like reel'}
          >
            <Heart
              size={22}
              className={isLiked ? 'fill-red-500 text-red-500' : 'text-white'}
            />
          </button>
          <span className="text-xs font-semibold text-white/90 tabular-nums">
            {likesCount}
          </span>
        </div>

        {/* 2. Views */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLikesViews?.(reel);
            }}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 active:scale-90 transition-all cursor-pointer min-h-[44px]"
            aria-label="View reel stats"
          >
            <Eye size={22} className="text-white" />
          </button>
          <span className="text-xs font-semibold text-white/90 tabular-nums">
            {viewsCount}
          </span>
        </div>

        {/* 3. Comments */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenComments(reel)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 active:scale-90 transition-all cursor-pointer min-h-[44px]"
            aria-label="Comments"
          >
            <MessageCircle size={22} className="text-white" />
          </button>
          <span className="text-xs font-semibold text-white/90 tabular-nums">
            {commentsCount}
          </span>
        </div>

        {/* 4. Share */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => onOpenShare(reel)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 active:scale-90 transition-all cursor-pointer min-h-[44px]"
            aria-label="Share reel"
          >
            <Share2 size={22} className="text-white" />
          </button>
          <span className="text-xs font-semibold text-white/90">
            Share
          </span>
        </div>

        {/* 5. Mute */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onToggleMute}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 active:scale-90 transition-all cursor-pointer min-h-[44px]"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={22} className="text-white" /> : <Volume2 size={22} className="text-white" />}
          </button>
          <span className="text-xs font-semibold text-white/90">
            {isMuted ? 'Muted' : 'Sound'}
          </span>
        </div>
      </div>

      {/* Bottom Info Overlay (Safely placed above bottom navigation bar) */}
      <div
        className="absolute left-4 right-18 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-20 text-white space-y-2 pointer-events-auto sm:max-w-[340px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Creator Header with Avatar & Follow Button */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/u/${reel.username}`}
            className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/40 shadow-sm"
          >
            {authorAvatar ? (
              <img src={authorAvatar} alt={reel.username} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {initials}
              </div>
            )}
          </Link>
          <div className="flex items-center gap-2 truncate">
            <Link
              href={`/u/${reel.username}`}
              className="text-sm font-semibold text-white hover:underline truncate"
            >
              @{reel.username}
            </Link>
            {currentUser?.username && currentUser.username !== reel.username && (
              <button
                type="button"
                onClick={handleFollowClick}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer min-h-[28px] ${
                  isFollowing
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-[var(--primary)] border-transparent text-white shadow-xs'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Reel Caption: at most 2 lines with "more" */}
        {reel.caption && (
          <div className="text-xs text-white/95 leading-relaxed">
            <p className={isCaptionExpanded ? '' : 'line-clamp-2'}>
              {reel.caption}
            </p>
            {reel.caption.length > 80 && (
              <button
                type="button"
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-white/70 hover:text-white font-semibold text-xs mt-0.5 cursor-pointer"
              >
                {isCaptionExpanded ? 'less' : 'more'}
              </button>
            )}
          </div>
        )}

        {/* Audio Pill: Positioned above docked bar without overlapping */}
        {(reel.song || (reel as any).music) && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/20 text-xs text-white max-w-[240px]">
            <Music size={12} className="shrink-0" />
            <span className="truncate">{(reel.song || (reel as any).music)?.title} • {(reel.song || (reel as any).music)?.artist}</span>
          </div>
        )}
      </div>

      {/* Progress Bar at Bottom of Reel Content */}
      <div className="absolute bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-0 right-0 h-[2px] bg-white/20 z-30 pointer-events-none">
        <div ref={progressBarRef} className="h-full bg-[var(--primary)] transition-all duration-100" style={{ width: '0%' }} />
      </div>
    </div>
  );
};

export default ReelCard;
