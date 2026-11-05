'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';

interface VideoPlayerModalProps {
  title: string;
  duration: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  title,
  duration,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 1;
      });
    }, 140);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#111b21] rounded-2xl border border-[#222d34] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-12 px-4 flex items-center justify-between bg-[#202c33] border-b border-[#222d34]">
          <span className="text-xs font-semibold text-[#e9edef] truncate">{title}</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Canvas Simulation */}
        <div className="relative aspect-video w-full bg-gradient-to-br from-stone-900 via-black to-stone-950 flex flex-col items-center justify-center group">
          {/* Animated Video Canvas Art */}
          <div className="text-center p-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884] mb-3">
              <Play size={28} className={isPlaying ? 'animate-pulse' : ''} />
            </div>
            <div className="text-sm font-medium text-white">{title}</div>
            <div className="text-xs text-[#8696a0] mt-1">DPS Campus Prime 2026 Footage</div>
          </div>

          {/* Center Play/Pause button on tap */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center text-white">
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </div>
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-[#00a884] transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Video Controls Bar */}
        <div className="h-12 px-4 flex items-center justify-between bg-[#202c33] text-[#8696a0]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="hover:text-white cursor-pointer"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={() => setProgress(0)}
              className="hover:text-white cursor-pointer"
              title="Restart"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="hover:text-white cursor-pointer"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <span className="text-[11px] font-mono text-[#8696a0]">
              {Math.floor((progress / 100) * 140)}s / {duration}
            </span>
          </div>

          <button
            onClick={() => setProgress(100)}
            className="text-xs text-[#00a884] hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
