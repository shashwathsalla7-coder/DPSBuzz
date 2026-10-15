'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreHorizontal, ImageOff, Heart, CheckCircle2, Volume2, VolumeX, Tag } from 'lucide-react';
import { type Post } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { globalAudio } from '@/lib/audioManager';

export interface PostImageProps {
  post: Post;
  onDoubleTapLike: () => void;
  onOptionsClick: () => void;
  showHeartPop?: boolean;
  onSlideChange?: (index: number) => void;
}

export const PostImage: React.FC<PostImageProps> = ({
  post,
  onDoubleTapLike,
  onOptionsClick,
  showHeartPop = false,
  onSlideChange,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const unsub = globalAudio.subscribe((state) => {
      const isThis = state.isPlaying && state.currentTrack?.id === post.song?.id;
      setIsPlayingAudio(isThis);
    });
    return unsub;
  }, [post.song?.id]);

  const images = post.images && post.images.length > 0
    ? post.images
    : post.imageUrl
    ? [post.imageUrl]
    : [];

  const totalImages = images.length;
  const isOfficial =
    post.username.toLowerCase() === 'dpsbuzz' ||
    post.username.toLowerCase() === 'dps_official' ||
    post.fullName?.toLowerCase().includes('official');

  const avatarColor = getAvatarColorPair(post.username);
  const initials = (post.fullName || post.username || 'ST').slice(0, 2).toUpperCase();

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onDoubleTapLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== currentSlide && index >= 0 && index < totalImages) {
      setCurrentSlide(index);
      onSlideChange?.(index);
    }
  };

  return (
    <div className="relative mx-3 select-none">
      {/* 4:5 Fixed Ratio Photo Container (28px radius, no border, no shadow) */}
      <div
        className="w-full aspect-[4/5] relative rounded-[28px] overflow-hidden cursor-pointer"
        style={{
          backgroundColor: 'var(--surface-sunken)',
        }}
        onClick={handleTap}
      >
        {/* Error Fallback Tile */}
        {hasError ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              setIsLoading(true);
            }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-black/10 text-[var(--text-muted)]">
              <ImageOff size={24} />
            </div>
            <p className="text-xs font-semibold text-[var(--text)]">
              Photo didn&apos;t load. Tap to retry.
            </p>
          </div>
        ) : totalImages === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
            No media attached
          </div>
        ) : totalImages === 1 ? (
          /* Single Photo with Blur-up Placeholder */
          <div className="w-full h-full relative">
            {isLoading && (
              <div className="absolute inset-0 bg-[var(--surface-sunken)] animate-pulse" />
            )}
            <img
              src={images[0]}
              alt={`Photo by ${post.username}`}
              loading="lazy"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </div>
        ) : (
          /* Multi-Photo Carousel with Horizontal Scroll Snap */
          <div
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
            onScroll={handleScroll}
          >
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="w-full h-full flex-shrink-0 snap-start snap-always relative"
              >
                <img
                  src={imgUrl}
                  alt={`Photo ${idx + 1} by ${post.username}`}
                  loading="lazy"
                  onError={() => setHasError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Top Scrim: linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,0) 38%) */}
        <div
          className="absolute top-0 left-0 right-0 h-36 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 38%)',
          }}
        />

        {/* Overlaid Top-Left: 36px avatar, username (white, 600), class and time (white at 85%, 12px) */}
        <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2.5 max-w-[calc(100%-60px)]">
          <Link
            href={`/u/${post.username}`}
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-white/30 flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: avatarColor.bg,
              color: avatarColor.text,
            }}
          >
            {post.avatar ? (
              <img
                src={post.avatar}
                alt={post.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <Link
                href={`/u/${post.username}`}
                onClick={(e) => e.stopPropagation()}
                className="text-white text-sm font-semibold truncate hover:underline drop-shadow-sm"
              >
                {post.username}
              </Link>
              {isOfficial && (
                <CheckCircle2 size={14} className="text-blue-400 fill-white shrink-0" />
              )}
            </div>
            <div className="text-[12px] leading-tight text-white/85 truncate drop-shadow-sm font-medium">
              {post.class?.trim().startsWith('Class')
                ? post.class.trim()
                : post.class
                ? `Class ${post.class.trim()}`
                : 'DPS Student'}{' '}
              · {post.timeAgo}
            </div>
          </div>
        </div>

        {/* Overlaid Top-Right: 36px circular 'more' button with dark translucent background (no blur) */}
        <div className="absolute top-3.5 right-3.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOptionsClick();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-85 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.40)',
            }}
            aria-label="More post options"
          >
            <MoreHorizontal size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Multi-photo "1/3" counter chip */}
        {totalImages > 1 && (
          <div className="absolute top-3.5 right-14 z-20 pointer-events-none">
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white tabular-nums"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.50)',
              }}
            >
              {currentSlide + 1}/{totalImages}
            </span>
          </div>
        )}

        {/* Floating Sound Toggle Pill for Posts with Music (Instagram Style) */}
        {post.song && (
          <div className="absolute bottom-3.5 right-3.5 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (post.song) {
                  globalAudio.toggleTrack(post.song);
                }
              }}
              className={`h-8 px-2.5 rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/25 transition-all active:scale-95 cursor-pointer shadow-lg ${
                isPlayingAudio
                  ? 'bg-black/85 text-white ring-2 ring-pink-500'
                  : 'bg-black/60 text-white/90 hover:bg-black/80'
              }`}
              aria-label={isPlayingAudio ? 'Pause post music' : 'Play post music'}
              title={isPlayingAudio ? 'Pause music' : `Play "${post.song.title}"`}
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 size={14} className="text-pink-400" />
                  <div className="flex items-end gap-0.5 h-2.5" aria-hidden="true">
                    <span className="w-0.5 bg-pink-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5" />
                    <span className="w-0.5 bg-pink-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-1.5" />
                    <span className="w-0.5 bg-pink-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-2" />
                  </div>
                </>
              ) : (
                <>
                  <VolumeX size={14} className="text-white/80" />
                  <span className="text-[10px] font-bold">Play Music</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tagged Classmates Indicator on Photo (Instagram Style) */}
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="absolute bottom-3.5 left-3.5 z-20 pointer-events-none">
            <span
              className="h-7 px-2 rounded-full flex items-center gap-1 text-white backdrop-blur-md shadow-md text-[10px] font-bold"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
            >
              <Tag size={12} />
              <span>{post.taggedUsers.length}</span>
            </span>
          </div>
        )}
      </div>

      {/* Multi-photo dots under the photo (6px dots, active stretches to 16px in primary) */}
      {totalImages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2 select-none">
          {images.map((_, dotIdx) => (
            <span
              key={dotIdx}
              className="h-1.5 rounded-full transition-all duration-200"
              style={{
                width: dotIdx === currentSlide ? '16px' : '6px',
                backgroundColor:
                  dotIdx === currentSlide ? 'var(--primary)' : 'var(--line-strong)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostImage;
