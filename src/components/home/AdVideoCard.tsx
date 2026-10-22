'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Play, Pause, ExternalLink, Sparkles } from 'lucide-react';

interface AdVideoCardProps {
  videoSrc?: string;
  posterSrc?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  actionText?: string;
  actionUrl?: string;
}

export function AdVideoCard({
  videoSrc = '/videos/ad.mp4',
  posterSrc,
  title = 'DPS Buzz Spotlight',
  subtitle = 'Sponsored • Official Announcement',
  caption = 'Experience the best of DPS Buzz. Watch our latest feature preview and stay ahead!',
  actionText = 'Learn More',
  actionUrl = '/download',
}: AdVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <article
      className="rounded-[22px] border overflow-hidden shadow-xs transition-shadow my-3"
      style={{
        backgroundColor: 'var(--surface, #121214)',
        borderColor: 'var(--line, #26262b)',
      }}
    >
      {/* Ad Header */}
      <div className="flex items-center justify-between p-3.5 border-b" style={{ borderColor: 'var(--line, #26262b)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-[2px] flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-sm">
              🐝
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-[var(--text,#fafafa)] truncate">
                {title}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <Sparkles size={10} /> Ad
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted,#737373)] truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {actionUrl && (
          <Link
            href={actionUrl}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            {actionText}
            <ExternalLink size={12} />
          </Link>
        )}
      </div>

      {/* Video Container */}
      <div
        className="relative w-full aspect-square bg-black flex items-center justify-center cursor-pointer select-none group"
        onClick={togglePlay}
      >
        {hasError ? (
          <div className="p-6 text-center text-neutral-400 space-y-2">
            <p className="text-sm font-medium">Ad Video Preview</p>
            <p className="text-xs text-neutral-500">
              Drop your video file into <code className="text-purple-400">public/videos/ad.mp4</code> to display it here.
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              onError={() => setHasError(true)}
              className="w-full h-full object-cover"
            />

            {/* Play / Pause Overlay Icon when tapped */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white">
                  <Play size={28} className="ml-1" fill="currentColor" />
                </div>
              </div>
            )}

            {/* Volume toggle button */}
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/90 transition-colors z-10"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Action Strip (Instagram style "Learn More" bar) */}
      {actionUrl && (
        <Link
          href={actionUrl}
          className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-neutral-900 border-t border-b hover:opacity-95 transition-opacity"
          style={{ borderColor: 'var(--line, #26262b)' }}
        >
          <span className="text-xs font-semibold text-white tracking-wide">
            {actionText.toUpperCase()}
          </span>
          <span className="text-xs text-pink-400 font-bold flex items-center gap-1">
            Tap here &gt;
          </span>
        </Link>
      )}

      {/* Caption & Description */}
      <div className="p-3.5 space-y-1.5">
        <p className="text-xs text-[var(--text,#fafafa)] leading-relaxed">
          <span className="font-bold mr-1.5">{title}</span>
          <span className="text-[var(--text-secondary,#a8a8a8)]">{caption}</span>
        </p>
      </div>
    </article>
  );
}

export default AdVideoCard;
