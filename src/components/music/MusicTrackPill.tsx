'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Music, Scissors, Flame } from 'lucide-react';
import { SongTrack } from '@/lib/dataStore';
import { globalAudio, AudioPlayerState } from '@/lib/audioManager';

interface MusicTrackPillProps {
  song: SongTrack;
  compact?: boolean;
  onRemove?: () => void;
  onEditPart?: () => void;
}

export const MusicTrackPill: React.FC<MusicTrackPillProps> = ({
  song,
  compact = false,
  onRemove,
  onEditPart,
}) => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
  });

  const formatSec = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const mins = Math.floor(s / 60);
    const remainder = s % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const unsubscribe = globalAudio.subscribe((state) => {
      setPlayerState(state);
    });
    return unsubscribe;
  }, []);

  const isCurrentTrack = playerState.currentTrack?.id === song.id;
  const isPlaying = isCurrentTrack && playerState.isPlaying;
  const progress = isCurrentTrack ? playerState.progress : 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    globalAudio.toggleTrack(song);
  };

  const startTime = song.startTime !== undefined ? song.startTime : 14;
  const clipDur = song.clipDuration || 15;
  const isChorus = startTime >= 12 && startTime <= 22;

  return (
    <div
      onClick={handleToggle}
      className={`relative overflow-hidden group cursor-pointer transition-all active:scale-[0.98] select-none ${
        compact
          ? 'inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-pink-500/50'
          : 'flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-pink-500/50 shadow-md'
      }`}
    >
      {/* Progress bar background indicator when playing */}
      {isCurrentTrack && (
        <div
          className="absolute left-0 bottom-0 top-0 bg-pink-500/10 pointer-events-none transition-all duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      )}

      {/* Album Artwork or Music Icon */}
      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center shadow-inner">
        {song.artworkUrl ? (
          <img
            src={song.artworkUrl}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music size={14} className="text-zinc-400" />
        )}

        {/* Small Play/Pause overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isPlaying ? (
            <Pause size={12} className="text-white fill-white" />
          ) : (
            <Play size={12} className="text-white fill-white ml-0.5" />
          )}
        </div>
      </div>

      {/* Track Info & Animated Equalizer */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-white truncate max-w-[140px] md:max-w-[180px]">
            {song.title}
          </p>

          {/* Equalizer Waveform bars when playing */}
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
              <span className="w-0.5 h-3 bg-pink-500 animate-pulse rounded-full" />
              <span className="w-0.5 h-2 bg-pink-400 animate-bounce rounded-full" />
              <span className="w-0.5 h-3.5 bg-pink-500 animate-pulse rounded-full" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 flex-wrap">
          <span className="truncate max-w-[100px] md:max-w-[140px]">
            {song.artist}
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-mono font-bold shrink-0 text-[9px]">
            {isChorus && <Flame size={10} className="text-pink-400 fill-pink-400" />}
            <span>
              {formatSec(startTime)} - {formatSec(startTime + clipDur)}
            </span>
          </span>
        </div>
      </div>

      {/* Right Actions: Play + Choose Part + Remove */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handleToggle}
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform ${
            isPlaying
              ? 'gradient-bg text-white shadow-sm shadow-pink-500/30'
              : 'bg-zinc-800 text-zinc-300 hover:text-white'
          }`}
          aria-label={isPlaying ? 'Pause song preview' : 'Play song preview'}
        >
          {isPlaying ? (
            <Pause size={12} className="fill-white" />
          ) : (
            <Play size={12} className="fill-current ml-0.5" />
          )}
        </button>

        {/* Change Part / Select Main Part Button */}
        {onEditPart && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditPart();
            }}
            className="px-2 py-1 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Select main part or scrub whole song"
          >
            <Scissors size={11} />
            <span className="hidden sm:inline">Choose Part</span>
            <span className="sm:hidden">Part</span>
          </button>
        )}

        {/* Optional Remove button */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded-full text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Remove song"
          >
            <span className="text-xs font-bold leading-none">✕</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MusicTrackPill;
