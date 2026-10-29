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
  Sparkles,
} from 'lucide-react';
import { DataStore, type Post, type Profile } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

interface ReelCardProps {
  reel: Post;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenComments: (reel: Post) => void;
  onOpenShare: (reel: Post) => void;
  currentUser: Profile | null;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  onOpenComments,
  onOpenShare,
  currentUser,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes || 0);
  const [commentsCount, setCommentsCount] = useState(reel.comments || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const lastTapRef = useRef<number>(0);
  const playIconTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoUrl = reel.videoUrl || reel.imageUrl;
  const authorProf = DataStore.getProfileByUsername(reel.username);
  const authorAvatar = authorProf?.avatar || reel.avatar || null;
  const color = getAvatarColorPair(reel.username);
  const initials = (authorProf?.fullName || reel.fullName || reel.username || 'ST').slice(0, 2).toUpperCase();

  // Initialize liked & follow state
  useEffect(() => {
    if (currentUser?.username) {
      const likedIds = DataStore.getUserLikedPostIds(currentUser.username);
      setIsLiked(likedIds.includes(reel.id));
      setIsFollowing(DataStore.isFollowing(currentUser.username, reel.username));
    }
    setLikesCount(reel.likes || 0);
    setCommentsCount(reel.comments || 0);
  }, [reel.id, currentUser?.username]);

  // Video play/pause based on active reel in viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Auto-play was prevented (often due to unmuted audio on mobile)
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isMuted]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }

    setShowPlayIcon(true);
    if (playIconTimeoutRef.current) clearTimeout(playIconTimeoutRef.current);
    playIconTimeoutRef.current = setTimeout(() => setShowPlayIcon(false), 650);
  };

  // Double tap to like, single tap to play/pause
  const handleTouchOrClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      if (!isLiked && currentUser?.username) {
        const res = DataStore.toggleLikePost(reel.id, currentUser.username);
        setIsLiked(res.liked);
        setLikesCount(res.likesCount);
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY && lastTapRef.current !== 0) {
          handleTogglePlay();
          lastTapRef.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.username) return;
    const res = DataStore.toggleLikePost(reel.id, currentUser.username);
    setIsLiked(res.liked);
    setLikesCount(res.likesCount);
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
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover sm:object-contain sm:max-w-[440px]"
        playsInline
        loop
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Center Animated Play/Pause Feedback Icon */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center animate-scale-in">
            {isPlaying ? <Play size={28} className="translate-x-0.5" /> : <Pause size={28} />}
          </div>
        </div>
      )}

      {/* Center Double-Tap Pop Heart Animation */}
      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <Heart size={100} className="fill-rose-500 text-rose-500 animate-heart-pop drop-shadow-2xl" />
        </div>
      )}

      {/* Top Subtle Gradient */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10 sm:max-w-[440px] sm:mx-auto" />

      {/* Bottom Gradient Overlay for text readability */}
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10 sm:max-w-[440px] sm:mx-auto" />

      {/* Right Side Action Column (Instagram Reels Style) */}
      <div
        className="absolute right-3 bottom-20 sm:bottom-12 z-20 flex flex-col items-center gap-5 sm:gap-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLikeClick}
          className="flex flex-col items-center gap-1 group active:scale-75 transition-transform cursor-pointer"
          aria-label={isLiked ? 'Unlike reel' : 'Like reel'}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
              isLiked ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50' : 'bg-black/40 hover:bg-black/60 text-white'
            }`}
          >
            <Heart size={22} className={isLiked ? 'fill-white stroke-white animate-heart-pop' : ''} />
          </div>
          <span className="text-[11px] font-bold tracking-tight drop-shadow-sm">
            {likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => onOpenComments(reel)}
          className="flex flex-col items-center gap-1 group active:scale-75 transition-transform cursor-pointer"
          aria-label="View comments"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-colors">
            <MessageCircle size={22} />
          </div>
          <span className="text-[11px] font-bold tracking-tight drop-shadow-sm">
            {commentsCount}
          </span>
        </button>

        {/* Share Button (Sends directly to chats / apps) */}
        <button
          type="button"
          onClick={() => onOpenShare(reel)}
          className="flex flex-col items-center gap-1 group active:scale-75 transition-transform cursor-pointer"
          aria-label="Share reel"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-colors">
            <Share2 size={22} className="text-cyan-400" />
          </div>
          <span className="text-[11px] font-bold tracking-tight drop-shadow-sm">
            Share
          </span>
        </button>

        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={onToggleMute}
          className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={20} className="text-amber-400" /> : <Volume2 size={20} />}
        </button>

        {/* Rotating Sound Vinyl Disc in bottom right */}
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 via-zinc-950 to-zinc-800 border-2 border-white/30 p-1 shadow-lg flex items-center justify-center ${
            isPlaying ? 'animate-spin' : ''
          }`}
          style={{ animationDuration: '4s' }}
        >
          <div className="w-full h-full rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt="audio disc" className="w-full h-full object-cover" />
            ) : (
              <Music size={12} className="text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Info Overlay (Creator, Caption, Music) */}
      <div
        className="absolute left-3 right-16 bottom-20 sm:bottom-12 z-20 text-white space-y-2 pointer-events-auto sm:max-w-[340px] sm:left-[calc(50%-210px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Creator Header with Avatar & Follow Button */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/u/${reel.username}`}
            className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white/80 shadow-md transition-transform hover:scale-105"
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
              className="text-sm font-bold text-white hover:underline truncate drop-shadow-sm"
            >
              @{reel.username}
            </Link>
            {currentUser?.username && currentUser.username !== reel.username && (
              <button
                type="button"
                onClick={handleFollowClick}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  isFollowing
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-[var(--primary)] border-transparent text-white shadow-sm hover:opacity-90'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={11} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={11} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Reel Caption */}
        {reel.caption && (
          <div className="text-xs text-white/95 leading-relaxed drop-shadow-sm">
            <p className={isCaptionExpanded ? '' : 'line-clamp-2'}>
              {reel.caption}
            </p>
            {reel.caption.length > 90 && (
              <button
                type="button"
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-[11px] font-bold text-white/70 hover:text-white mt-0.5 cursor-pointer"
              >
                {isCaptionExpanded ? 'less' : '...more'}
              </button>
            )}
          </div>
        )}

        {/* Music / Sound Audio Marquee Banner */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/85 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 w-fit max-w-[280px] truncate">
          <Music size={12} className="shrink-0 text-pink-400 animate-pulse" />
          <span className="truncate">
            {reel.song ? `${reel.song.title} • ${reel.song.artist}` : `Original Audio • @${reel.username}`}
          </span>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30 sm:max-w-[440px] sm:mx-auto">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ReelCard;
