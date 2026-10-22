'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Play, Pause, ExternalLink, Sparkles, Maximize2, X } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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

  // Listen for fullscreen change events so we show native controls only when in fullscreen
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
      if (videoRef.current) {
        videoRef.current.controls = isFs;
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
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

  const handleFullscreen = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    // Ensure playback resumes if paused
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    }

    // Try native fullscreen first
    try {
      if (video.requestFullscreen) {
        video.controls = true;
        await video.requestFullscreen();
        return;
      } else if ((video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen();
        return;
      } else if ((video as any).webkitRequestFullscreen) {
        video.controls = true;
        (video as any).webkitRequestFullscreen();
        return;
      } else if ((video as any).msRequestFullscreen) {
        video.controls = true;
        (video as any).msRequestFullscreen();
        return;
      }
    } catch (err) {
      console.warn('Native fullscreen request not supported or denied, opening overlay', err);
    }

    // Fallback to in-app complete view modal
    setIsModalOpen(true);
  };

  return (
    <>
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

              {/* Tap to Open Full Screen Pill Button (top-left) */}
              <button
                type="button"
                onClick={handleFullscreen}
                className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-semibold hover:bg-black/90 active:scale-95 transition-all shadow-lg group-hover:border-pink-500/50"
                aria-label="Tap to open full screen complete view"
              >
                <Maximize2 size={13} className="text-pink-400" />
                <span>Tap to Open Full Screen</span>
              </button>

              {/* Play / Pause Overlay Icon when paused */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white shadow-xl">
                    <Play size={28} className="ml-1" fill="currentColor" />
                  </div>
                </div>
              )}

              {/* Fullscreen icon button (bottom-right, left of volume) */}
              <button
                type="button"
                onClick={handleFullscreen}
                className="absolute bottom-3 right-13 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/90 active:scale-95 transition-all z-20"
                aria-label="Open full screen complete view"
                title="Open full screen complete view"
              >
                <Maximize2 size={15} />
              </button>

              {/* Volume toggle button (bottom-right) */}
              <button
                type="button"
                onClick={toggleMute}
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/90 active:scale-95 transition-all z-20"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Bottom Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 z-10">
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

      {/* Fullscreen Complete View Modal Overlay (Fallback & In-App Viewer) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-fade-in"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-xs">
                🐝
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">{title}</p>
                <p className="text-[11px] text-neutral-400">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  handleFullscreen();
                }}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Native Fullscreen"
                title="Native Fullscreen"
              >
                <Maximize2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Center Video with complete uncropped view */}
          <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4">
            <video
              src={videoSrc}
              controls
              autoPlay
              playsInline
              className="max-h-[75vh] w-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Bottom Action Strip */}
          <div className="p-4 bg-gradient-to-t from-black/90 to-transparent space-y-3 z-10">
            {caption && (
              <p className="text-xs text-neutral-300 text-center max-w-lg mx-auto">
                {caption}
              </p>
            )}
            {actionUrl && (
              <div className="flex justify-center">
                <Link
                  href={actionUrl}
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs shadow-lg shadow-pink-600/30 hover:opacity-90 transition-opacity"
                >
                  <span>{actionText}</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AdVideoCard;
