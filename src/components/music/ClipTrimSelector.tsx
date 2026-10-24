'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Scissors, Check, X, Volume2, Clock, Sparkles } from 'lucide-react';
import { MusicTrack } from '@/lib/music/types';
import { globalAudio } from '@/lib/audioManager';

interface ClipTrimSelectorProps {
  track: MusicTrack;
  initialStart?: number;
  initialDuration?: number;
  onConfirm: (selection: { startSeconds: number; lengthSeconds: number }) => void;
  onCancel: () => void;
}

// Fixed pseudo-waveform bar heights for consistent visual timeline (50 bars)
const TIMELINE_BARS = [
  25, 35, 45, 60, 50, 40, 65, 80, 95, 85,
  70, 90, 100, 95, 85, 75, 90, 85, 60, 50,
  45, 65, 80, 100, 95, 90, 80, 70, 85, 90,
  75, 60, 80, 95, 85, 70, 55, 65, 75, 80,
  60, 50, 45, 60, 50, 40, 35, 30, 25, 20,
];

export const ClipTrimSelector: React.FC<ClipTrimSelectorProps> = ({
  track,
  initialStart = 15,
  initialDuration = 15,
  onConfirm,
  onCancel,
}) => {
  const fullDuration = Math.max(1, Math.round(track.duration || 180));
  const [clipLength, setClipLength] = useState<number>(() => {
    if (fullDuration < initialDuration) return fullDuration;
    return initialDuration === 30 ? 30 : 15;
  });

  const maxStart = Math.max(0, fullDuration - clipLength);
  const [startSeconds, setStartSeconds] = useState<number>(() => {
    return Math.min(Math.max(0, initialStart), maxStart);
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentPlayOffset, setCurrentPlayOffset] = useState<number>(startSeconds);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const loopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Format seconds to M:SS
  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  // Convert track to SongTrack compatible format for globalAudio
  const getAudioTrackObj = useCallback(() => {
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      artworkUrl: track.coverImage,
      previewUrl: track.audioUrl,
      durationSeconds: fullDuration,
      startTime: startSeconds,
      clipDuration: clipLength,
      provider: track.provider,
      license: track.license,
      creditText: track.creditText,
      sourcePageUrl: track.sourcePageUrl,
    };
  }, [track, fullDuration, startSeconds, clipLength]);

  // Start playing segment in audioManager with looping
  const playSegment = useCallback(
    (start: number, len: number) => {
      const audioTrack = {
        ...getAudioTrackObj(),
        startTime: start,
        clipDuration: len,
      };
      globalAudio.previewSegment(audioTrack, start, len);
      setIsPlaying(true);
      setCurrentPlayOffset(start);
    },
    [getAudioTrackObj]
  );

  // Play immediately on mount
  useEffect(() => {
    playSegment(startSeconds, clipLength);

    return () => {
      globalAudio.stop();
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    };
  }, []);

  // Monitor play progress for scrubber indicator & loop boundary
  useEffect(() => {
    if (loopTimerRef.current) clearInterval(loopTimerRef.current);

    if (isPlaying) {
      loopTimerRef.current = setInterval(() => {
        const state = globalAudio.getState();
        const cur = state.currentTime;
        const endLimit = startSeconds + clipLength;

        if (cur >= endLimit || cur < startSeconds - 0.5) {
          // Loop back smoothly
          globalAudio.seekSeconds(startSeconds);
          setCurrentPlayOffset(startSeconds);
        } else {
          setCurrentPlayOffset(cur);
        }
      }, 150);
    }

    return () => {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    };
  }, [isPlaying, startSeconds, clipLength]);

  // Handle timeline scrubber drag / click
  const updateStartFromPointer = (clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetSeconds = Math.round(ratio * fullDuration);
    const clamped = Math.min(Math.max(0, targetSeconds), maxStart);

    setStartSeconds(clamped);
    playSegment(clamped, clipLength);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateStartFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updateStartFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      globalAudio.pauseTrack();
      setIsPlaying(false);
    } else {
      playSegment(startSeconds, clipLength);
    }
  };

  const handleDurationChange = (newLen: number) => {
    const clampedLen = fullDuration < newLen ? fullDuration : newLen;
    setClipLength(clampedLen);
    const newMaxStart = Math.max(0, fullDuration - clampedLen);
    const newStart = Math.min(startSeconds, newMaxStart);
    setStartSeconds(newStart);
    playSegment(newStart, clampedLen);
  };

  // Window geometry calculations for the overlay
  const windowLeftPercent = (startSeconds / fullDuration) * 100;
  const windowWidthPercent = Math.min(100 - windowLeftPercent, (clipLength / fullDuration) * 100);
  const playheadPercent = Math.max(
    0,
    Math.min(100, ((currentPlayOffset - startSeconds) / clipLength) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="w-full sm:max-w-lg bg-[#121212] border border-[#262626] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-base font-bold flex items-center justify-center gap-1.5">
              <Scissors size={16} className="text-pink-400" /> Choose Your Clip
            </h2>
            <p className="text-xs text-white/60">Drag the window to pick the best part</p>
          </div>
          <button
            type="button"
            onClick={() => onConfirm({ startSeconds, lengthSeconds: clipLength })}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Check size={14} /> Done
          </button>
        </div>

        {/* Track Info Card */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <img
              src={track.coverImage}
              alt={track.title}
              className="w-13 h-13 rounded-xl object-cover shrink-0 border border-white/10 shadow-md"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate text-white">{track.title}</h3>
              <p className="text-xs text-white/60 truncate">{track.artist}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-300 font-mono font-medium">
                  {track.license}
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  Full Song: {formatTime(fullDuration)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={togglePlayPause}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 hover:scale-105 flex items-center justify-center text-white shadow-lg shrink-0 transition-transform active:scale-95 cursor-pointer"
              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Clip Duration Selector (15s vs 30s) */}
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-white/70 font-medium flex items-center gap-1">
            <Clock size={13} className="text-pink-400" /> Clip Length:
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.05] border border-white/10">
            <button
              type="button"
              onClick={() => handleDurationChange(15)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                clipLength === 15
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              15 Seconds
            </button>
            <button
              type="button"
              onClick={() => handleDurationChange(30)}
              disabled={fullDuration < 30}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                clipLength === 30
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                  : fullDuration < 30
                  ? 'opacity-30 cursor-not-allowed text-white/40'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              30 Seconds
            </button>
          </div>
        </div>

        {/* Timeline & Waveform View */}
        <div className="px-5 py-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-medium text-white/80">
            <span className="text-pink-300 font-bold">
              {formatTime(startSeconds)} – {formatTime(startSeconds + clipLength)}
            </span>
            <span className="text-white/40">Total: {formatTime(fullDuration)}</span>
          </div>

          {/* Interactive Timeline Track */}
          <div
            ref={timelineRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative h-20 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden cursor-ew-resize select-none touch-none flex items-center px-2"
          >
            {/* Background Waveform Bars */}
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none opacity-40">
              {TIMELINE_BARS.map((height, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full bg-white/40"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            {/* Draggable Highlight Selection Window */}
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-pink-500/20 border-2 border-pink-400 backdrop-brightness-125 transition-[left,width] duration-75 shadow-[0_0_15px_rgba(236,72,153,0.3)] pointer-events-none flex flex-col justify-between"
              style={{
                left: `${windowLeftPercent}%`,
                width: `${windowWidthPercent}%`,
              }}
            >
              {/* Window Handles */}
              <div className="h-1 bg-pink-400 w-full" />
              {/* Internal Scrub Playhead */}
              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_#ffffff]"
                  style={{ left: `${playheadPercent}%` }}
                />
              )}
              <div className="h-1 bg-pink-400 w-full" />
            </div>
          </div>

          <p className="text-[11px] text-center text-white/50 pt-1">
            Tap or drag horizontally anywhere on the waveform to slide the start point
          </p>
        </div>

        {/* Attribution & Legal Notice */}
        <div className="px-5 py-3 bg-white/[0.02] border-t border-[#262626] text-[11px] text-white/50 space-y-1">
          <p className="truncate">
            <span className="text-white/70 font-semibold">Credit:</span> {track.creditText}
          </p>
          <p>
            <a
              href={track.sourcePageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:underline"
            >
              View track license on Jamendo ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
