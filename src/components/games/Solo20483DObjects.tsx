'use client';

import React from 'react';

/* =====================================================================
   2048 WEB AUDIO SOUND SYNTHESIZER
   Zero external dependencies, 0ms latency, high-fidelity sound
   ===================================================================== */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Slide swoosh when tiles shift across the board
 */
export function play2048SlideSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {}
}

/**
 * Melodic merge pop when two identical tiles combine.
 * Pitch escalates dynamically with tile value (2->4 up to 1024->2048)
 */
export function play2048MergeSound(tileValue: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Pitch mapping: 4->330Hz, 8->392Hz, 16->440Hz ... 2048->1046Hz, 4096->1174Hz, 8192->1318Hz
    const pitchMap: Record<number, number> = {
      4: 329.63,  // E4
      8: 392.00,  // G4
      16: 440.00, // A4
      32: 523.25, // C5
      64: 587.33, // D5
      128: 659.25, // E5
      256: 783.99, // G5
      512: 880.00, // A5
      1024: 987.77, // B5
      2048: 1046.50, // C6
      4096: 1174.66, // D6
      8192: 1318.51, // E6
      16384: 1567.98, // G6
    };

    const freq = pitchMap[tileValue] || 523.25;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tileValue >= 128 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    // Harmonic sparkle overtone for big milestones (>= 128)
    if (tileValue >= 128) {
      const harm = ctx.createOscillator();
      const harmGain = ctx.createGain();
      harm.type = 'sine';
      harm.frequency.setValueAtTime(freq * 2, now + 0.03);
      harmGain.gain.setValueAtTime(0.1, now + 0.03);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      harm.connect(harmGain);
      harmGain.connect(ctx.destination);
      harm.start(now + 0.03);
      harm.stop(now + 0.22);
    }
  } catch {}
}

/**
 * Regal 2048 victory fanfare!
 */
export function play2048WinSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.14;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.52);
    });
  } catch {}
}

/**
 * Triumphant Level-Up chime with cascading harmonics
 */
export function play2048LevelUpSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const chordNotes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51]; // C5 to E6 arpeggio
    chordNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.46);
    });
  } catch {}
}

/**
 * Melancholic game over synth sound
 */
export function play2048GameOverSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  } catch {}
}

/* =====================================================================
   APPLE-STYLE 3D 2048 TILE COMPONENT
   ===================================================================== */
export interface SoloTile3DProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'auto';
  gridSize?: number;
  isNew?: boolean;
  isMerged?: boolean;
}

export function SoloTile3D({ value, size = 'auto', gridSize = 4, isNew, isMerged }: SoloTile3DProps) {
  if (value === 0) return null;

  // Dynamic typography and dimensions based on grid size
  const getDynamicStyles = () => {
    if (size !== 'auto') {
      return {
        sm: 'w-10 h-10 text-xs rounded-xl',
        md: 'w-16 h-16 sm:w-20 sm:h-20 text-lg sm:text-2xl rounded-2xl',
        lg: 'w-24 h-24 text-3xl rounded-3xl',
      }[size];
    }

    switch (gridSize) {
      case 3:
        return 'w-full h-full text-2xl sm:text-3xl rounded-2xl';
      case 4:
        return 'w-full h-full text-lg sm:text-2xl rounded-xl sm:rounded-2xl';
      case 5:
        return 'w-full h-full text-sm sm:text-lg rounded-lg sm:rounded-xl';
      case 6:
        return 'w-full h-full text-xs sm:text-sm rounded-md sm:rounded-lg';
      default:
        return 'w-full h-full text-base sm:text-xl rounded-xl';
    }
  };

  const dynamicClass = getDynamicStyles();

  // Tile styles with vibrant Apple progressive gradients
  const getTileTheme = (val: number) => {
    switch (val) {
      case 2:
        return {
          bg: 'from-blue-500 to-indigo-600',
          shadow: 'shadow-blue-500/25',
          border: 'border-blue-300/40',
          text: 'text-white',
          badge: 'Rookie',
        };
      case 4:
        return {
          bg: 'from-cyan-500 to-blue-600',
          shadow: 'shadow-cyan-500/30',
          border: 'border-cyan-200/50',
          text: 'text-white',
          badge: 'Scout',
        };
      case 8:
        return {
          bg: 'from-emerald-500 to-teal-600',
          shadow: 'shadow-emerald-500/30',
          border: 'border-emerald-200/50',
          text: 'text-white',
          badge: 'Scholar',
        };
      case 16:
        return {
          bg: 'from-amber-500 to-orange-600',
          shadow: 'shadow-amber-500/35',
          border: 'border-amber-200/50',
          text: 'text-white',
          badge: 'Striker',
        };
      case 32:
        return {
          bg: 'from-orange-500 to-rose-600',
          shadow: 'shadow-orange-500/40',
          border: 'border-orange-200/50',
          text: 'text-white',
          badge: 'Prefect',
        };
      case 64:
        return {
          bg: 'from-rose-500 to-red-600',
          shadow: 'shadow-rose-500/45',
          border: 'border-rose-200/50',
          text: 'text-white',
          badge: 'Captain',
        };
      case 128:
        return {
          bg: 'from-pink-500 via-rose-500 to-purple-600',
          shadow: 'shadow-pink-500/50',
          border: 'border-pink-200/60 ring-2 ring-pink-400/40',
          text: 'text-white',
          badge: 'Ace ⭐',
        };
      case 256:
        return {
          bg: 'from-purple-500 via-violet-600 to-indigo-700',
          shadow: 'shadow-purple-500/50',
          border: 'border-purple-200/60 ring-2 ring-purple-400/40',
          text: 'text-white',
          badge: 'Master 🔮',
        };
      case 512:
        return {
          bg: 'from-indigo-500 via-blue-600 to-cyan-500',
          shadow: 'shadow-indigo-500/60',
          border: 'border-indigo-200/70 ring-2 ring-indigo-400/50',
          text: 'text-white',
          badge: 'Champion ⚡',
        };
      case 1024:
        return {
          bg: 'from-fuchsia-500 via-pink-600 to-rose-600',
          shadow: 'shadow-fuchsia-500/70',
          border: 'border-fuchsia-200/80 ring-2 ring-fuchsia-400/60',
          text: 'text-white',
          badge: 'Legend 🌟',
        };
      case 2048:
        return {
          bg: 'from-amber-400 via-yellow-300 to-amber-500',
          shadow: 'shadow-amber-400/80',
          border: 'border-yellow-100 ring-4 ring-amber-300/80 animate-pulse',
          text: 'text-amber-950 font-black',
          badge: 'Buzz Star 🐝👑',
        };
      case 4096:
        return {
          bg: 'from-amber-400 via-orange-500 to-rose-600',
          shadow: 'shadow-orange-500/80',
          border: 'border-amber-200 ring-4 ring-amber-400/80 animate-pulse',
          text: 'text-white font-black',
          badge: 'Royal Titan 👑',
        };
      case 8192:
        return {
          bg: 'from-cyan-400 via-sky-500 to-indigo-600',
          shadow: 'shadow-cyan-400/90',
          border: 'border-cyan-200 ring-4 ring-cyan-300/90 animate-pulse',
          text: 'text-white font-black',
          badge: 'Cosmic Apex 🌌',
        };
      case 16384:
        return {
          bg: 'from-emerald-400 via-teal-300 to-cyan-500',
          shadow: 'shadow-emerald-400/90',
          border: 'border-emerald-100 ring-4 ring-emerald-300/90 animate-pulse',
          text: 'text-emerald-950 font-black',
          badge: 'Singularity ⚡',
        };
      default:
        return {
          bg: 'from-violet-900 via-purple-900 to-black',
          shadow: 'shadow-purple-900/80',
          border: 'border-violet-400/90 ring-4 ring-violet-500/80',
          text: 'text-white',
          badge: 'Ultra Master 🌌',
        };
    }
  };

  const theme = getTileTheme(value);

  return (
    <div
      className={`relative select-none flex flex-col items-center justify-center font-black transition-all duration-100 shadow-lg ${dynamicClass} bg-gradient-to-br ${theme.bg} ${theme.shadow} border ${theme.border} ${
        isNew ? 'animate-scale-in' : ''
      } ${isMerged ? 'animate-bounce-in' : ''}`}
    >
      {/* 3D Specular Light Rim */}
      <div className="absolute inset-x-2 top-1 h-[2px] bg-white/40 rounded-full pointer-events-none" />

      {/* Number Display */}
      <span className={`tracking-tight drop-shadow-sm leading-none ${theme.text}`}>
        {value}
      </span>

      {/* Subtitle Badge (for larger tiles in 3x3 and 4x4) */}
      {gridSize <= 4 && value >= 16 && (
        <span
          className={`text-[7px] sm:text-[9px] uppercase tracking-wider font-extrabold opacity-90 mt-0.5 ${
            value === 2048 ? 'text-amber-950' : 'text-white/80'
          }`}
        >
          {theme.badge}
        </span>
      )}
    </div>
  );
}
