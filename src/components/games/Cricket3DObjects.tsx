'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Sparkles, Play, RotateCcw, X, Shield, Award, Flame, UserX } from 'lucide-react';

/* ==========================================================================
   WEB AUDIO THRILLER SOUND SYNTHESIZER
   Zero external asset dependencies, zero network fetch lag, 100% reliable
   ========================================================================== */
export function playThrillerGameOverSound(isWinner: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // 1. Thriller Suspense Sub-Bass Drone (35Hz - 80Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(45, now);
    subOsc.frequency.exponentialRampToValueAtTime(90, now + 0.45);
    subGain.gain.setValueAtTime(0.15, now);
    subGain.gain.linearRampToValueAtTime(0.28, now + 0.4);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.6);

    // 2. High-tension thriller string sweep / riser (240Hz -> 960Hz)
    const tensionOsc = ctx.createOscillator();
    const tensionGain = ctx.createGain();
    tensionOsc.type = 'triangle';
    tensionOsc.frequency.setValueAtTime(240, now);
    tensionOsc.frequency.exponentialRampToValueAtTime(960, now + 0.42);
    tensionGain.gain.setValueAtTime(0.08, now);
    tensionGain.gain.linearRampToValueAtTime(0.25, now + 0.4);
    tensionGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    tensionOsc.connect(tensionGain);
    tensionGain.connect(ctx.destination);
    tensionOsc.start(now);
    tensionOsc.stop(now + 0.48);

    // 3. Bat & Ball Heavy Impact "CRACK / BOOM" at 0.42s
    const impactTime = now + 0.42;

    // Sub punch
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'sine';
    punchOsc.frequency.setValueAtTime(140, impactTime);
    punchOsc.frequency.exponentialRampToValueAtTime(25, impactTime + 0.55);
    punchGain.gain.setValueAtTime(0.35, impactTime);
    punchGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.65);
    punchOsc.connect(punchGain);
    punchGain.connect(ctx.destination);
    punchOsc.start(impactTime);
    punchOsc.stop(impactTime + 0.65);

    // Willow wood crack noise transient
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.12));
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1800;
    noiseFilter.Q.value = 2.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, impactTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.22);
    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(impactTime);
    whiteNoise.stop(impactTime + 0.25);

    // 4. Triumph Fanfare (Winner) or Thriller Dissonance Drop (Defeat)
    if (isWinner) {
      // Epic stadium brass notes
      const notes = [
        { freq: 523.25, time: 0.65, dur: 0.22 }, // C5
        { freq: 659.25, time: 0.82, dur: 0.22 }, // E5
        { freq: 783.99, time: 0.98, dur: 0.35 }, // G5
        { freq: 1046.50, time: 1.25, dur: 0.8 }, // C6
      ];
      notes.forEach(({ freq, time, dur }) => {
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(freq, now + time);
        leadGain.gain.setValueAtTime(0.18, now + time);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
        leadOsc.connect(leadGain);
        leadGain.connect(ctx.destination);
        leadOsc.start(now + time);
        leadOsc.stop(now + time + dur);
      });
    } else {
      // Thriller minor suspense drop
      const chord = [220, 233.08, 155.56];
      chord.forEach((freq) => {
        const dOsc = ctx.createOscillator();
        const dGain = ctx.createGain();
        dOsc.type = 'sawtooth';
        dOsc.frequency.setValueAtTime(freq, now + 0.65);
        dGain.gain.setValueAtTime(0.12, now + 0.65);
        dGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        dOsc.connect(dGain);
        dGain.connect(ctx.destination);
        dOsc.start(now + 0.65);
        dOsc.stop(now + 1.5);
      });
    }
  } catch {
    // Autoplay policy or unsupported audio
  }
}

/* ==========================================================================
   3D CRICKET BALL COMPONENT
   Photorealistic red cherry sphere with raised white hand-stitched seam,
   radial specular highlights, and floating 3D perspective shadow
   ========================================================================== */
export interface CricketBall3DProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  spinning?: boolean;
  className?: string;
}

export function CricketBall3D({
  size = 'md',
  interactive = false,
  spinning = true,
  className = '',
}: CricketBall3DProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const sizePixels = {
    sm: 36,
    md: 56,
    lg: 84,
    xl: 120,
  }[size];

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -30;
    setTilt({ x, y });
  };

  const handlePointerLeave = () => {
    if (!interactive) return;
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{
        width: sizePixels,
        height: sizePixels + 12,
        perspective: '600px',
      }}
    >
      {/* 3D Ball Sphere */}
      <div
        className={`relative rounded-full transition-transform duration-200 ease-out ${
          spinning ? 'animate-[cricket-ball-float_3.5s_ease-in-out_infinite]' : ''
        }`}
        style={{
          width: sizePixels,
          height: sizePixels,
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transformStyle: 'preserve-3d',
          background: 'radial-gradient(circle at 32% 28%, #FF7A7A 0%, #D81B26 35%, #8B0B13 70%, #400206 100%)',
          boxShadow: `
            inset -4px -6px 14px rgba(0, 0, 0, 0.75),
            inset 3px 4px 10px rgba(255, 180, 180, 0.65),
            0 8px 24px rgba(180, 20, 30, 0.45)
          `,
        }}
      >
        {/* Specular Glint (Top-Left shine) */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '16%',
            left: '20%',
            width: '28%',
            height: '18%',
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 75%)',
            transform: 'rotate(-25deg)',
          }}
        />

        {/* 3D Raised Seam (White stitched seam running across the ball) */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-full"
          style={{
            transform: 'rotate(42deg)',
          }}
        >
          {/* Main seam band */}
          <div
            className="w-full flex items-center justify-between px-0.5"
            style={{
              height: sizePixels > 60 ? '4px' : '2.5px',
              backgroundColor: '#FAFAF8',
              boxShadow: '0 0 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.3)',
            }}
          >
            {/* Seam stitches */}
            {Array.from({ length: Math.floor(sizePixels / 4) }).map((_, i) => (
              <span
                key={i}
                className="block bg-slate-400/80 rounded-full"
                style={{
                  width: '1px',
                  height: sizePixels > 60 ? '5px' : '3.5px',
                  opacity: i % 2 === 0 ? 0.9 : 0.4,
                }}
              />
            ))}
          </div>
        </div>

        {/* Gold Cricket Stamp (Club mark) */}
        <div
          className="absolute pointer-events-none text-[8px] font-black text-amber-200/50 uppercase tracking-tighter"
          style={{
            top: '52%',
            right: '22%',
            transform: 'rotate(15deg) scale(0.8)',
            textShadow: '0 1px 1px rgba(0,0,0,0.8)',
          }}
        >
          {sizePixels > 60 && 'DPS BUZZ'}
        </div>
      </div>

      {/* Dynamic 3D Contact Shadow */}
      <div
        className="rounded-full pointer-events-none transition-all duration-300"
        style={{
          width: sizePixels * 0.7,
          height: sizePixels * 0.16,
          background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.15) 55%, transparent 75%)',
          marginTop: sizePixels > 60 ? '6px' : '2px',
        }}
      />
    </div>
  );
}

/* ==========================================================================
   3D CRICKET BAT COMPONENT
   English willow grain blade, curved sweet spot, and textured handle
   ========================================================================== */
export interface CricketBat3DProps {
  size?: 'sm' | 'md' | 'lg';
  angle?: number;
  swinging?: boolean;
  className?: string;
}

export function CricketBat3D({
  size = 'md',
  angle = -18,
  swinging = false,
  className = '',
}: CricketBat3DProps) {
  const heightPixels = {
    sm: 58,
    md: 88,
    lg: 130,
  }[size];

  return (
    <div
      className={`relative inline-block select-none ${
        swinging ? 'animate-[cricket-bat-swing_2.8s_ease-in-out_infinite]' : ''
      } ${className}`}
      style={{
        height: heightPixels,
        width: heightPixels * 0.28,
        transform: `perspective(500px) rotateZ(${angle}deg)`,
        transformOrigin: 'top center',
        filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.6))',
      }}
    >
      {/* Rubber Grip Handle */}
      <div
        className="mx-auto rounded-t-sm relative overflow-hidden"
        style={{
          width: '28%',
          height: '32%',
          background: 'linear-gradient(to right, #1E293B 0%, #3B82F6 40%, #1D4ED8 70%, #0F172A 100%)',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)',
        }}
      >
        {/* Grip wrap grooves */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-full h-px bg-black/40 my-1"
          />
        ))}
      </div>

      {/* Rubber Cone Collar */}
      <div
        className="mx-auto"
        style={{
          width: '38%',
          height: '5%',
          backgroundColor: '#0F172A',
          borderRadius: '1px',
        }}
      />

      {/* Willow Wood Blade */}
      <div
        className="w-full relative rounded-b-md overflow-hidden"
        style={{
          height: '63%',
          background: 'linear-gradient(to right, #C6934B 0%, #F3D9A4 32%, #E7C88C 65%, #9E6B28 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.6), inset -2px -2px 6px rgba(0,0,0,0.4)',
        }}
      >
        {/* Sweet spot spine ridge */}
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1/3 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.45) 50%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Metallic DPS Buzz sticker badge */}
        <div
          className="absolute top-2 inset-x-1 py-1 rounded bg-gradient-to-r from-blue-700 via-cyan-500 to-blue-800 text-[6px] font-black text-white text-center tracking-tighter shadow-sm uppercase pointer-events-none"
          style={{
            transform: 'scale(0.85)',
          }}
        >
          DPS BUZZ
        </div>

        {/* Curved Toe bottom guard */}
        <div
          className="absolute bottom-0 inset-x-0 h-1.5 bg-[#8A5A1B]"
          style={{
            borderTop: '1px solid rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   3D GOLDEN TROPHY COMPONENT
   Reflective golden chalice with handles, star badge, and pedestal
   ========================================================================== */
export interface Trophy3DProps {
  size?: 'sm' | 'md' | 'lg';
  glowing?: boolean;
  className?: string;
}

export function Trophy3D({
  size = 'md',
  glowing = true,
  className = '',
}: Trophy3DProps) {
  const pixelSize = {
    sm: 44,
    md: 72,
    lg: 108,
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
    >
      {/* Golden Aura Glow */}
      {glowing && (
        <div
          className="absolute inset-0 rounded-full blur-xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.45) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Trophy Body */}
      <div
        className="relative z-10 flex flex-col items-center justify-center"
        style={{
          filter: 'drop-shadow(0 8px 18px rgba(245, 158, 11, 0.5))',
        }}
      >
        <Trophy
          size={pixelSize * 0.85}
          className="text-amber-400 fill-amber-400 stroke-amber-500"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   CINEMATIC GAME OVER 3D SMASH TRANSITION OVERLAY
   - Thriller sound synthesizer effect
   - 3D Cricket Bat swings into frame
   - 3D Cricket Ball gets SMASHED and zooms toward screen
   - Explosive gold particle burst & winner trophy elevation
   - Apple-style Liquid Glass modal cards
   ========================================================================== */
export interface GameOver3DSmashTransitionProps {
  isOpen: boolean;
  winnerName: string;
  winnerUsername: string;
  winnerAvatar?: string | null;
  isMyVictory: boolean;
  winningCricketerName?: string;
  forfeit?: boolean;
  quitterUsername?: string;
  onPlayAgain?: () => void;
  onClose: () => void;
  onOpenLeaderboard?: () => void;
}

export function GameOver3DSmashTransition({
  isOpen,
  winnerName,
  winnerUsername,
  winnerAvatar,
  isMyVictory,
  winningCricketerName,
  forfeit = false,
  quitterUsername,
  onPlayAgain,
  onClose,
  onOpenLeaderboard,
}: GameOver3DSmashTransitionProps) {
  const [stage, setStage] = useState<'smash' | 'reveal'>('smash');
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setStage('smash');
      soundPlayedRef.current = false;
      return;
    }

    // 1. Play Thriller Game Over Sound
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playThrillerGameOverSound(isMyVictory);
    }

    // 2. Stage timing: Smash transition (0 - 800ms), then reveal (800ms+)
    const timer = setTimeout(() => {
      setStage('reveal');
    }, 850);

    return () => clearTimeout(timer);
  }, [isOpen, isMyVictory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Apple-style Deep Frosted Glass Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-2xl transition-opacity duration-700"
        onClick={stage === 'reveal' ? onClose : undefined}
      />

      {/* STAGE 1: 3D BAT & BALL SMASH ANIMATION */}
      {stage === 'smash' && (
        <div className="relative z-30 flex flex-col items-center justify-center pointer-events-none">
          {/* 3D Bat Swing Trail */}
          <div className="animate-[bat-smash-swing_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <CricketBat3D size="lg" angle={35} />
          </div>

          {/* 3D Cricket Ball Zooming toward camera on impact */}
          <div className="absolute animate-[ball-smash-zoom_0.85s_cubic-bezier(0.12,0.9,0.25,1)_forwards]">
            <CricketBall3D size="xl" spinning={false} />
          </div>

          {/* Impact Spark Flash */}
          <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-amber-400 via-white to-cyan-300 blur-2xl animate-[impact-flash_0.4s_ease-out_forwards]" />
        </div>
      )}

      {/* STAGE 2: CHAMPIONSHIP WINNER REVEAL (Apple Style Liquid Glass Card) */}
      {stage === 'reveal' && (
        <div
          className="relative z-30 w-full max-w-sm sm:max-w-md bg-[#0B0F19]/90 backdrop-blur-3xl border border-white/15 rounded-[32px] sm:rounded-[36px] shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden p-6 sm:p-7 text-center animate-[apple-scale-in_0.45s_cubic-bezier(0.16,1,0.3,1)_forwards]"
          style={{
            boxShadow: isMyVictory
              ? '0 0 60px rgba(245, 158, 11, 0.25), 0 30px 90px rgba(0,0,0,0.9)'
              : '0 0 50px rgba(14, 165, 233, 0.2), 0 30px 90px rgba(0,0,0,0.9)',
          }}
        >
          {/* Top Apple specular line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* 3D Trophy Header with Ambient Beams */}
          <div className="relative mb-3 flex items-center justify-center">
            {/* 3D Cricket Props Composition */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute -left-10 -bottom-2 -rotate-12 opacity-80">
                <CricketBall3D size="sm" spinning={false} />
              </div>
              <Trophy3D size="lg" glowing={true} />
              <div className="absolute -right-8 -top-3 rotate-45 opacity-80">
                <CricketBat3D size="sm" angle={25} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/25 inline-flex items-center gap-1.5">
              <Sparkles size={11} />
              <span>MATCH CONCLUDED</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {forfeit ? (
                isMyVictory ? (
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                    Victory by Forfeit! 🏆
                  </span>
                ) : (
                  <span className="text-rose-400">You Left the Match</span>
                )
              ) : isMyVictory ? (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                  Congratulations! You Won! 🏆
                </span>
              ) : (
                <span className="text-white">
                  @{winnerUsername} Won! 🏏
                </span>
              )}
            </h2>

            {forfeit && quitterUsername && (
              <p className="text-xs text-rose-300 font-semibold flex items-center justify-center gap-1">
                <UserX size={14} />
                <span>@{quitterUsername} quit the match</span>
              </p>
            )}
          </div>

          {/* Winner Profile Capsule (Apple-style frosted pill) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md mb-4 text-left flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 p-0.5 shrink-0 shadow-md">
              <div className="w-full h-full rounded-full bg-[#0F131B] flex items-center justify-center text-sm font-black text-amber-300 overflow-hidden">
                {winnerAvatar ? (
                  <img src={winnerAvatar} alt={winnerName} className="w-full h-full object-cover" />
                ) : (
                  winnerName.charAt(0) || 'W'
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white truncate">{winnerName}</p>
                <Award size={13} className="text-amber-400 shrink-0" />
              </div>
              <p className="text-xs text-slate-400 truncate">@{winnerUsername} • Champion</p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black text-amber-400 bg-amber-400/15 px-2.5 py-1 rounded-xl border border-amber-400/30">
                +50 PTS
              </span>
            </div>
          </div>

          {/* Deduced Secret Cricketer Banner */}
          {winningCricketerName && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-blue-950/40 border border-blue-500/30 text-xs text-slate-200 mb-5">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                Secret Cricketer Deduced
              </span>
              <strong className="text-sm font-extrabold text-cyan-300 block">
                🏏 {winningCricketerName}
              </strong>
            </div>
          )}

          {/* Apple-style Action Buttons */}
          <div className="space-y-2 pt-1">
            {onPlayAgain && (
              <button
                type="button"
                onClick={onPlayAgain}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/50 active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Play Rematch</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {onOpenLeaderboard && (
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  className="py-2.5 px-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-amber-300 text-xs font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trophy size={14} />
                  <span>Leaderboard</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white/90 text-xs font-bold active:scale-[0.97] transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
