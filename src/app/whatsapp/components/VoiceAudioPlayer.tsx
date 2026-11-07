'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceAudioPlayerProps {
  audioUrl?: string;
  duration?: string;
  isMe?: boolean;
}

export const VoiceAudioPlayer: React.FC<VoiceAudioPlayerProps> = ({
  audioUrl,
  duration = '0:08',
  isMe = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const synthOscRef = useRef<AudioContext | null>(null);

  // Parse duration if given as "0:08"
  useEffect(() => {
    if (duration) {
      const parts = duration.split(':');
      if (parts.length === 2) {
        const sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        if (!isNaN(sec) && sec > 0) setAudioDuration(sec);
      }
    }
  }, [duration]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (synthOscRef.current) {
        synthOscRef.current.close().catch(() => {});
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      // Start Playing
      setIsPlaying(true);

      if (audioUrl && audioUrl.startsWith('data:audio') || (audioUrl && audioUrl.startsWith('http'))) {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => {
              setIsPlaying(false);
              setCurrentTime(0);
            };
            audioRef.current.ontimeupdate = () => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            };
          }
          audioRef.current.play().catch(() => {
            // Fallback to synthetic playback simulation if browser blocks media
            simulateSyntheticPlayback();
          });
        } catch {
          simulateSyntheticPlayback();
        }
      } else {
        simulateSyntheticPlayback();
      }
    }
  };

  const simulateSyntheticPlayback = () => {
    // Generate soft simulated speech chime using Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      synthOscRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio context may require user activation
    }

    const startTime = Date.now() - (currentTime * 1000);
    const targetDuration = audioDuration || 8;

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= targetDuration) {
        setCurrentTime(0);
        setIsPlaying(false);
      } else {
        setCurrentTime(elapsed);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const progressPercent = Math.min(100, (currentTime / (audioDuration || 8)) * 100);

  const formatSec = (sec: number) => {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  // 16 stylized sound waveform heights
  const waveformBars = [30, 45, 80, 60, 95, 75, 40, 90, 100, 65, 85, 50, 70, 90, 40, 60];

  return (
    <div className="flex items-center gap-3 py-1.5 my-1 min-w-[220px] max-w-[280px]">
      {/* Play / Pause circular button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95 ${
          isMe
            ? 'bg-[#e9edef] text-[#005c4b] hover:bg-white'
            : 'bg-[#00a884] text-white hover:bg-[#008f6f]'
        }`}
        title={isPlaying ? 'Pause' : 'Play voice note'}
      >
        {isPlaying ? (
          <Pause size={15} className="fill-current" />
        ) : (
          <Play size={15} className="fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform and Scrubber */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-[2.5px] h-6 cursor-pointer" onClick={togglePlay}>
          {waveformBars.map((h, i) => {
            const barProgress = (i / waveformBars.length) * 100;
            const isFilled = barProgress <= progressPercent;
            return (
              <div
                key={i}
                className="w-[3px] rounded-full transition-all duration-150"
                style={{
                  height: `${isPlaying ? Math.max(20, (h * (0.6 + Math.sin(currentTime * 8 + i) * 0.4))) : h}%`,
                  backgroundColor: isFilled
                    ? isMe
                      ? '#53bdeb'
                      : '#00a884'
                    : isMe
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(255, 255, 255, 0.2)',
                }}
              />
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[10px] font-mono mt-0.5 text-[#8696a0]">
          <span>{isPlaying ? formatSec(currentTime) : duration}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold">Voice Note</span>
        </div>
      </div>
    </div>
  );
};
