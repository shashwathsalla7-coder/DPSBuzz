'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  ImageOff,
  Heart,
  CheckCircle2,
  Volume2,
  VolumeX,
  Tag,
  Play,
  Pause,
  Maximize,
  Minimize,
  X,
} from 'lucide-react';
import { type Post, DataStore } from '@/lib/dataStore';
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

  // Video State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);

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

  // Video Detection Helper
  const isVideoUrl = (url: any) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.includes('/video/upload/') ||
      lower.includes('/videos/')
    );
  };

  const isVideo = Boolean(
    post.isVideo ||
    isVideoUrl(post.videoUrl) ||
    (post.imageUrl && isVideoUrl(post.imageUrl)) ||
    (images.length > 0 && images.some(isVideoUrl))
  );

  const effectiveVideoUrl =
    post.videoUrl ||
    (post.imageUrl && isVideoUrl(post.imageUrl) ? post.imageUrl : null) ||
    (images.length > 0 ? images.find(isVideoUrl) : null) ||
    (isVideo ? (post.imageUrl || images[0]) : null);

  const [videoSrc, setVideoSrc] = useState(effectiveVideoUrl);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setVideoSrc(effectiveVideoUrl);
    setRetryCount(0);
  }, [effectiveVideoUrl]);

  const handleVideoError = () => {
    if (retryCount === 0 && effectiveVideoUrl && !effectiveVideoUrl.startsWith('/videos/')) {
      console.warn('Retrying video with local fallback...');
      setRetryCount(1);
      setVideoSrc('/videos/launch_video.mp4');
      setIsLoading(true);
      return;
    }
    setIsLoading(false);
    setHasError(true);
  };

  const isOfficial =
    post.username.toLowerCase() === 'dpsbuzz' ||
    post.username.toLowerCase() === 'dps_official' ||
    post.fullName?.toLowerCase().includes('official');

  const avatarColor = getAvatarColorPair(post.username);
  const initials = (post.fullName || post.username || 'ST').slice(0, 2).toUpperCase();
  const effectiveAvatar =
    post.avatar ||
    (post as any).userAvatar ||
    DataStore.getProfileByUsername(post.username)?.avatar ||
    null;
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  // Stop background audio and other videos on the page when this video starts playing
  const handleVideoPlaying = () => {
    setIsVideoPlaying(true);
    if (globalAudio.getState().isPlaying) {
      globalAudio.pauseTrack();
    }
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((v) => {
        if (v !== videoRef.current && v !== modalVideoRef.current) {
          v.pause();
        }
      });
    }
  };

  // Synchronize playback without double audio (resounding / echo prevention)
  const handleToggleFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const curTime = videoRef.current.currentTime;
      setVideoCurrentTime(curTime);
      videoRef.current.pause();
      videoRef.current.muted = true;
    }
    setIsFullscreenModalOpen(true);
  };

  const handleExitFullscreen = () => {
    if (modalVideoRef.current) {
      const curTime = modalVideoRef.current.currentTime;
      const wasPlaying = !modalVideoRef.current.paused;
      modalVideoRef.current.pause();
      modalVideoRef.current.muted = true;
      setVideoCurrentTime(curTime);
      setIsFullscreenModalOpen(false);

      if (videoRef.current) {
        videoRef.current.currentTime = curTime;
        videoRef.current.muted = isVideoMuted;
        if (wasPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    } else {
      setIsFullscreenModalOpen(false);
    }
  };

  // Handle ESC key to exit fullscreen modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenModalOpen) {
        handleExitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenModalOpen]);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onDoubleTapLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      if (isVideo && videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
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


  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative mx-3 select-none">
      {/* 4:5 or 16:9 Fixed Ratio Media Container (28px radius, no border, no shadow) */}
      <div
        className={`w-full ${isVideo ? 'aspect-[4/5] sm:aspect-video' : 'aspect-[4/5]'} relative rounded-[28px] overflow-hidden cursor-pointer bg-black`}
        style={{
          backgroundColor: isVideo ? '#000000' : 'var(--surface-sunken)',
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
              Media didn&apos;t load. Tap to retry.
            </p>
          </div>
        ) : isVideo && effectiveVideoUrl ? (
          /* High-Performance HTML5 Video Player */
          <div className="w-full h-full relative bg-black flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center text-white/50 text-xs">
                Loading launch video...
              </div>
            )}
            <video
              ref={videoRef}
              src={videoSrc || effectiveVideoUrl}
              playsInline
              preload="metadata"
              muted={isVideoMuted}
              onLoadedData={() => setIsLoading(false)}
              onPlay={handleVideoPlaying}
              onPause={() => setIsVideoPlaying(false)}
              onTimeUpdate={(e) => setVideoCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
              onError={handleVideoError}
              className="w-full h-full object-contain"
            />

            {/* Big Center Play Button Overlay when Paused */}
            {!isVideoPlaying && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none z-10 transition-all">
                <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transform hover:scale-110 transition-transform">
                  <Play size={28} className="ml-1 fill-white" />
                </div>
              </div>
            )}

            {/* Bottom Scrim for Video Controls */}
            <div
              className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-10"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
              }}
            />

            {/* Video Scrubber & Time Bar */}
            <div className="absolute bottom-2 left-4 right-4 z-20 pointer-events-auto">
              <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono text-white/90 drop-shadow">
                <span className="tabular-nums">{formatTime(videoCurrentTime)}</span>
                <div
                  className="flex-1 h-1.5 bg-white/30 hover:h-2 rounded-full overflow-hidden cursor-pointer transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const newTime = pos * videoDuration;
                    if (videoRef.current) videoRef.current.currentTime = newTime;
                    setVideoCurrentTime(newTime);
                  }}
                >
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{
                      width: `${videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="tabular-nums">{formatTime(videoDuration)}</span>
              </div>
            </div>

            {/* Floating Action Controls on Video: Full Screen Button & Mute Toggle */}
            <div className="absolute bottom-10 right-3.5 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextMuted = !isVideoMuted;
                  setIsVideoMuted(nextMuted);
                  if (videoRef.current) videoRef.current.muted = nextMuted;
                }}
                className="h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all active:scale-95 cursor-pointer shadow-lg"
                aria-label={isVideoMuted ? 'Unmute video' : 'Mute video'}
                title={isVideoMuted ? 'Unmute' : 'Mute'}
              >
                {isVideoMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {/* Prominent Full Screen Button */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="h-8 px-3 rounded-full flex items-center gap-1.5 backdrop-blur-md bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 transition-all active:scale-95 cursor-pointer shadow-lg font-bold text-xs"
                title="Watch in Full Screen"
                aria-label="Full Screen"
              >
                <Maximize size={14} />
                <span>Full Screen</span>
              </button>
            </div>
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
                  decoding="async"
                  width={1080}
                  height={1350}
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
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 42%)',
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
            {effectiveAvatar && !avatarLoadError ? (
              <img
                src={effectiveAvatar}
                alt={post.username}
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                onError={() => setAvatarLoadError(true)}
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
        {totalImages > 1 && !isVideo && (
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
        {post.song && !isVideo && (
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

        {/* Tagged Classmates Indicator on Photo/Video (Instagram Style) */}
        {post.taggedUsers && post.taggedUsers.length > 0 && !isVideo && (
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
      {totalImages > 1 && !isVideo && (
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

      {/* Dedicated In-App Fullscreen Theater Overlay Modal */}
      {isFullscreenModalOpen && effectiveVideoUrl && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/90 to-transparent">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white/30 overflow-hidden"
                style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
              >
                {effectiveAvatar && !avatarLoadError ? (
                  <img
                    src={effectiveAvatar}
                    alt={post.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-sm">{post.username}</span>
                  {isOfficial && <CheckCircle2 size={15} className="text-blue-400 fill-white" />}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-300 font-bold border border-blue-400/30">
                    Launch Video 🚀
                  </span>
                </div>
                <p className="text-xs text-white/70 truncate max-w-xs sm:max-w-md">
                  {post.caption || 'DPS Buzz Launch Video'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExitFullscreen}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                title="Exit Full Screen (Esc)"
                aria-label="Exit Full Screen"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Center Video Player */}
          <div
            className="relative flex-1 flex items-center justify-center px-2 sm:px-6 py-2 overflow-hidden"
            onClick={() => {
              if (modalVideoRef.current) {
                if (modalVideoRef.current.paused) {
                  modalVideoRef.current.play().catch(() => {});
                  handleVideoPlaying();
                } else {
                  modalVideoRef.current.pause();
                }
              }
            }}
          >
            <video
              ref={modalVideoRef}
              src={videoSrc || effectiveVideoUrl}
              playsInline
              controls={false}
              muted={isVideoMuted}
              onTimeUpdate={(e) => setVideoCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
              onPlay={handleVideoPlaying}
              onPause={() => setIsVideoPlaying(false)}
              onError={handleVideoError}
              className="max-w-full max-h-[75vh] w-auto h-auto rounded-2xl shadow-2xl object-contain cursor-pointer"
            />

            {!isVideoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-blue-600/95 text-white flex items-center justify-center shadow-2xl backdrop-blur-md">
                  <Play size={36} className="ml-1 fill-white" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-10 space-y-3">
            {/* Scrubber Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-white/90 tabular-nums">
                {formatTime(videoCurrentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={videoDuration || 100}
                step={0.1}
                value={videoCurrentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setVideoCurrentTime(newTime);
                  if (modalVideoRef.current) modalVideoRef.current.currentTime = newTime;
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                }}
                className="flex-1 h-2 bg-white/25 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2.5 transition-all"
              />
              <span className="text-xs font-mono text-white/90 tabular-nums">
                {formatTime(videoDuration)}
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (modalVideoRef.current) {
                      if (modalVideoRef.current.paused) modalVideoRef.current.play().catch(() => {});
                      else modalVideoRef.current.pause();
                    }
                  }}
                  className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  {isVideoPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5 fill-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isVideoMuted;
                    setIsVideoMuted(next);
                    if (modalVideoRef.current) modalVideoRef.current.muted = next;
                    if (videoRef.current) videoRef.current.muted = next;
                  }}
                  className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                >
                  {isVideoMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                {post.taggedUsers && post.taggedUsers.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
                    <Tag size={13} className="text-blue-400" />
                    <span>Tagged: @{post.taggedUsers.join(', @')}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleExitFullscreen}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-md active:scale-95"
              >
                <Minimize size={16} />
                <span>Exit Full Screen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostImage;
