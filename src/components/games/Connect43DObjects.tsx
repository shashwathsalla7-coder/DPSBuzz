'use client';

import React from 'react';
import { Trophy, Sparkles, RefreshCw, X, Award, Zap } from 'lucide-react';

/* =====================================================================
   WEB AUDIO API SOUND SYNTHESIZER
   Zero external asset dependencies, 0ms latency, 100% reliable
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
 * Realistic physical acrylic disc drop sound with gravity pitch variation
 */
export function playConnect4DropSound(row: number = 5): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Higher row numbers (bottom of board, deeper drop) produce deeper pitch
  const baseFreq = 260 + (5 - row) * 35; // 260Hz to 435Hz

  // Primary wood/plastic tap
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.12);

  gain.gain.setValueAtTime(0.45, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);

  // Subtle second bounce click
  const oscBounce = ctx.createOscillator();
  const gainBounce = ctx.createGain();
  oscBounce.type = 'sine';
  oscBounce.frequency.setValueAtTime(baseFreq * 1.3, now + 0.08);
  oscBounce.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.16);

  gainBounce.gain.setValueAtTime(0.0, now);
  gainBounce.gain.setValueAtTime(0.25, now + 0.08);
  gainBounce.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  oscBounce.connect(gainBounce);
  gainBounce.connect(ctx.destination);
  oscBounce.start(now + 0.08);
  oscBounce.stop(now + 0.2);
}

/**
 * Subtle turn chime
 */
export function playConnect4TurnChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.26);
}

/**
 * High-tech laser hum when 4 pieces connect
 */
export function playConnect4LaserSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(1760, now + 0.35);

  // Lowpass filter for smooth energy
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(3200, now + 0.35);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.46);
}

/**
 * Triumphant fanfare upon winning
 */
export function playConnect4WinFanfare(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Major triad fanfare arpeggio: C5 -> E5 -> G5 -> C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const noteStart = now + i * 0.11;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.35, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteStart + 0.36);
  });
}

/**
 * Defeat dissonance
 */
export function playConnect4DefeatSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [440, 415.3, 392, 349.23];
  notes.forEach((freq, i) => {
    const noteStart = now + i * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.25, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteStart + 0.32);
  });
}

/* =====================================================================
   3D CONNECT 4 DISC COMPONENT
   ===================================================================== */
interface Connect4Disc3DProps {
  color: 'red' | 'yellow';
  isWinning?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isFloating?: boolean;
}

export function Connect4Disc3D({
  color,
  isWinning = false,
  size = 'md',
  className = '',
  isFloating = false,
}: Connect4Disc3DProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-full h-full max-w-[36px] max-h-[36px] sm:max-w-[44px] sm:max-h-[44px] aspect-square',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  }[size];

  const isRed = color === 'red';

  return (
    <div
      className={`relative rounded-full select-none flex items-center justify-center transition-all duration-300 ${sizeClasses} ${
        isWinning ? 'animate-pulse scale-105 z-20' : ''
      } ${isFloating ? 'animate-bounce shadow-2xl' : ''} ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Outer 3D Bevel Rim with dynamic lighting */}
      <div
        className={`absolute inset-0 rounded-full shadow-lg ${
          isRed
            ? 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-950 shadow-red-950/80 border-[2px] border-rose-300/60'
            : 'bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-800 shadow-yellow-950/80 border-[2px] border-amber-200/70'
        } ${isWinning ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.9)]' : ''}`}
      >
        {/* Specular Radial Glint (Top-Left Highlight) */}
        <div className="absolute top-1 left-1.5 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-white/70 to-transparent blur-[1px] pointer-events-none" />

        {/* Concentric Ridge Groove 1 */}
        <div
          className={`absolute inset-1.5 sm:inset-2 rounded-full border border-black/25 flex items-center justify-center ${
            isRed
              ? 'bg-gradient-to-br from-red-500 to-red-800 shadow-inner'
              : 'bg-gradient-to-br from-amber-400 to-yellow-600 shadow-inner'
          }`}
        >
          {/* Inner Recessed Center Coin Circle */}
          <div
            className={`w-1/2 h-1/2 rounded-full flex items-center justify-center border border-white/20 shadow-md ${
              isRed
                ? 'bg-gradient-to-br from-red-700 to-rose-950 text-rose-200'
                : 'bg-gradient-to-br from-amber-500 to-yellow-800 text-amber-100'
            }`}
          >
            {isWinning && (
              <Sparkles size={size === 'sm' ? 10 : 16} className="text-white animate-spin" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   FULLSCREEN CINEMATIC WINNER SMASH TRANSITION OVERLAY
   ===================================================================== */
interface Connect4CinematicWinTransitionProps {
  winnerUsername: string;
  winnerName: string;
  isWinner: boolean;
  isDraw: boolean;
  winnerColor: 'red' | 'yellow';
  totalMoves: number;
  pointsEarned: number;
  onClose: () => void;
  onRematch?: () => void;
  winningLineLabel?: string;
  isBotWinner?: boolean;
}

export function Connect4CinematicWinTransition({
  winnerUsername,
  winnerName,
  isWinner,
  isDraw,
  winnerColor,
  totalMoves,
  pointsEarned,
  onClose,
  onRematch,
  winningLineLabel,
  isBotWinner = false,
}: Connect4CinematicWinTransitionProps) {
  React.useEffect(() => {
    if (isDraw) {
      playConnect4TurnChime();
    } else if (isWinner) {
      playConnect4WinFanfare();
    } else {
      playConnect4DefeatSound();
    }
  }, [isWinner, isDraw]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-red-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-amber-500/20 blur-[100px] pointer-events-none" />

      {/* Main Apple Liquid Glass Card */}
      <div className="relative w-full max-w-[420px] rounded-[32px] bg-[#0A0E17]/92 border border-white/15 p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] text-center space-y-6 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* 3D Animated Hero Trophy or Discs */}
        <div className="flex justify-center items-center gap-3 pt-2">
          {isDraw ? (
            <div className="flex items-center gap-2">
              <Connect4Disc3D color="red" size="lg" />
              <span className="text-2xl font-black text-slate-400">VS</span>
              <Connect4Disc3D color="yellow" size="lg" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-500/30 to-amber-500/30 rounded-full blur-xl" />
              <Connect4Disc3D color={winnerColor} size="xl" isWinning isFloating />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center shadow-lg">
                <Trophy size={16} className="text-black" />
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black tracking-widest uppercase text-cyan-400">
            CONNECT 4 ARENA
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isDraw ? (
              'Stalemate! Match Drawn 🤝'
            ) : isWinner ? (
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                VICTORY IS YOURS! 🏆
              </span>
            ) : (
              <span className="text-rose-400">@{winnerUsername} Won! 💥</span>
            )}
          </h2>
          <p className="text-xs text-slate-400 max-w-[300px] mx-auto">
            {isDraw
              ? 'All 42 slots filled with no 4-in-a-row! Masterful tactical defense from both players.'
              : isWinner
              ? 'Flawless 4-in-a-row combination! You outsmarted your opponent.'
              : isBotWinner
              ? `BuzzBot calculated a winning line in ${totalMoves} moves!`
              : `Opponent connected 4 discs first in ${totalMoves} moves. Good game!`}
          </p>
        </div>

        {/* How It Won - Straight Laser Line Card */}
        {!isDraw && winningLineLabel && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-blue-500/10 border border-white/15 space-y-2 text-center animate-scale-in">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Zap size={13} className="text-amber-400" />
              <span>How The Match Was Won</span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black text-white px-3 py-1 rounded-full bg-white/10 border border-white/20 shadow-sm flex items-center gap-1.5">
                <span>{isBotWinner ? '🤖 BuzzBot:' : isWinner ? '🏆 You:' : `💥 @${winnerUsername}:`}</span>
                <span className="text-amber-300">{winningLineLabel}</span>
              </span>
            </div>

            {/* Visual 4-Disc Straight Laser Connector */}
            <div className="relative flex items-center justify-center gap-2.5 py-1.5 max-w-[240px] mx-auto">
              {/* Glowing Straight Laser Line */}
              <div
                className={`absolute inset-x-2 top-1/2 -translate-y-1/2 h-[3.5px] rounded-full shadow-[0_0_15px_rgba(255,255,255,0.9)] ${
                  winnerColor === 'red'
                    ? 'bg-gradient-to-r from-rose-500 via-white to-rose-500 shadow-rose-500/80'
                    : 'bg-gradient-to-r from-amber-400 via-white to-amber-400 shadow-amber-400/80'
                }`}
              />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative z-10 scale-90">
                  <Connect4Disc3D color={winnerColor} size="sm" isWinning />
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-300 font-medium">
              {isBotWinner
                ? 'BuzzBot connected 4 discs in a straight line before you could block it! 🤖⚡'
                : isWinner
                ? 'You struck a clean straight line of 4 discs to take the victory! 👑✨'
                : `@${winnerUsername} connected 4 discs in a straight row!`}
            </p>
          </div>
        )}

        {/* Points & Stats Card */}
        <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="p-2.5 rounded-xl bg-white/[0.03] text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Arena Points</span>
            <span className="text-lg font-black text-amber-400">+{pointsEarned} PTS</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Moves</span>
            <span className="text-lg font-black text-cyan-400">{totalMoves}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {onRematch && (
            <button
              onClick={onRematch}
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <RefreshCw size={16} />
              <span>Play Rematch ⚡</span>
            </button>
          )}

          <button
            onClick={onClose}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Back to Chat 💬
          </button>
        </div>
      </div>
    </div>
  );
}
