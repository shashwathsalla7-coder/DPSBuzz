'use client';

import React, { useEffect } from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface UniqueLikeOverlayProps {
  isVisible: boolean;
  onFinished?: () => void;
}

export const playLikeChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Friendly musical bounce: A4 (440Hz) -> E5 (659Hz) -> A5 (880Hz)
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

export const triggerLikeVibration = () => {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate([35, 25, 55]);
    }
  } catch {}
};

export const UniqueLikeOverlay: React.FC<UniqueLikeOverlayProps> = ({ isVisible, onFinished }) => {
  useEffect(() => {
    if (isVisible) {
      playLikeChime();
      triggerLikeVibration();
      const timer = setTimeout(() => {
        onFinished?.();
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onFinished]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden select-none">
      {/* 1. Outer Shockwave Aura */}
      <div className="absolute w-36 h-36 rounded-full border-rose-400 bg-rose-500/15 animate-unique-shockwave" />

      {/* 2. Floating +1 Badge */}
      <div className="absolute -translate-y-8 animate-plus-one z-40">
        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-white font-black text-sm shadow-xl shadow-rose-500/50 flex items-center gap-1 border border-white/40">
          <Sparkles size={13} className="text-amber-200 animate-pulse" />
          <span>+1</span>
        </div>
      </div>

      {/* 3. Radial Particle Fireworks (8 unique directional elements) */}
      <div className="absolute text-xl animate-burst-1">💖</div>
      <div className="absolute text-xl animate-burst-2">✨</div>
      <div className="absolute text-xl animate-burst-3">🔥</div>
      <div className="absolute text-xl animate-burst-4">⭐</div>
      <div className="absolute text-xl animate-burst-5">⚡</div>
      <div className="absolute text-xl animate-burst-6">🎉</div>
      <div className="absolute text-xl animate-burst-7">💫</div>
      <div className="absolute text-xl animate-burst-8">❤️</div>

      {/* 4. Center Glowing Heart with Multi-Stop Gradient Fill */}
      <div className="relative animate-unique-heart">
        <svg width="104" height="104" viewBox="0 0 24 24" className="drop-shadow-[0_0_30px_rgba(244,63,94,0.95)]">
          <defs>
            <linearGradient id="uniqueLikeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <path
            fill="url(#uniqueLikeGrad)"
            stroke="#ffffff"
            strokeWidth="0.8"
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          />
        </svg>
      </div>
    </div>
  );
};
