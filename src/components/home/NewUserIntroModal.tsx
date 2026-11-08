'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Trophy,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Shield,
  GraduationCap,
  Crown,
  Gamepad2,
  Camera,
  ArrowRight,
} from 'lucide-react';

export interface NewUserIntroModalProps {
  isOpen?: boolean;
  currentUsername?: string;
  onClose?: () => void;
  forceShow?: boolean;
}

export function NewUserIntroModal({
  isOpen: controlledIsOpen,
  currentUsername,
  onClose,
  forceShow = false,
}: NewUserIntroModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const cleanUser = (currentUsername || '').toLowerCase().trim();

  useEffect(() => {
    if (forceShow) {
      setInternalOpen(true);
      return;
    }

    if (controlledIsOpen !== undefined) {
      setInternalOpen(controlledIsOpen);
      return;
    }

    if (typeof window !== 'undefined' && cleanUser && cleanUser !== 'guest') {
      const seenKey = `dpsbuzz_intro_seen_${cleanUser}`;
      const hasSeen = localStorage.getItem(seenKey);
      if (!hasSeen) {
        // Automatically greet first-time / new user after 600ms
        const timer = setTimeout(() => {
          setInternalOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [controlledIsOpen, forceShow, cleanUser]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined' && cleanUser && cleanUser !== 'guest') {
      localStorage.setItem(`dpsbuzz_intro_seen_${cleanUser}`, 'true');
      localStorage.setItem('dpsbuzz_intro_seen_global', 'true');
    }
    setInternalOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="DPS Buzz Welcome and Guide Walkthrough"
    >
      {/* Background Ambience Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#6B5BF2]/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#6B5BF2]/20 blur-[130px] pointer-events-none" />

      {/* Main Liquid Glass Shell */}
      <div className="relative w-full max-w-[500px] max-h-[92vh] overflow-y-auto rounded-[32px] sm:rounded-[36px] bg-[#0A0D18]/96 border border-[#6B5BF2]/35 p-5 sm:p-7 shadow-[0_30px_100px_rgba(193,53,132,0.35)] text-white space-y-5">
        {/* Specular Rim Light */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#6B5BF2]/70 to-transparent pointer-events-none" />

        {/* Top Header & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6B5BF2] via-[#6B5BF2] to-[#7B6CFF] p-0.5 shadow-lg shadow-[#6B5BF2]/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0D101D] rounded-[14px] flex items-center justify-center text-lg">
                🐝
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-tight bg-gradient-to-r from-[#6B5BF2] via-[#6B5BF2] to-[#7B6CFF] bg-clip-text text-transparent">
                  Getting started
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary-tint)] text-[var(--primary)] font-extrabold border border-[var(--line-strong)]">
                  Step {step} of 3
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Campus Guide • Streaks & Leaderboard</p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            type="button"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: 1, label: 'Welcome 🐝' },
            { num: 2, label: 'Daily Streak 🔥' },
            { num: 3, label: 'Leaderboard 🏆' },
          ].map((item) => {
            const isActive = step === item.num;
            const isCompleted = step > item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => setStep(item.num as 1 | 2 | 3)}
                className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-bold transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6B5BF2]/40 to-[#6B5BF2]/40 border-[#6B5BF2] text-white shadow-md'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* STEP 1: WELCOME TO DPSBUZZ */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[var(--primary-tint)] border border-[var(--line)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--primary)] font-black text-sm">
                <GraduationCap size={18} />
                <span>Welcome to DPS Buzz</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                A private space for DPS students in classes 6 to 10. Follow classmates, share posts and reels, read school notices, and chat with your class.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div>
                  <h4 className="font-bold text-white">Only for our school</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    You need the school code to join, and the school can suspend accounts that break the rules.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div>
                  <h4 className="font-bold text-white">See who liked your post</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Tap the like count on any post to see who liked it.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <span className="text-lg">🎬</span>
                <div>
                  <h4 className="font-bold text-white">Stories, Posts & Reels</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Share daily study preparation, sports highlights, classroom memories, and interactive stories with music.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DAILY STREAKS EXPLAINED */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            {/* The Critical Daily Streak Reset Rule */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--primary-tint)] via-[var(--gold-tint)] to-transparent border border-[var(--line-strong)] space-y-2.5">
              <div className="flex items-center gap-2 text-[var(--gold)] font-black text-sm">
                <Flame size={18} className="fill-orange-500 text-[var(--primary)] animate-pulse" />
                <span>How the Daily Streak Works</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Your streak tracks how many <strong>consecutive days</strong> you share positive habits on DPS Buzz (study prep, sports, reading, science, or campus moments).
              </p>

              {/* STRICT RESET ALERT */}
              <div className="p-3 rounded-xl bg-[var(--primary-tint)] border border-[var(--line-strong)] flex items-start gap-2.5 text-[var(--primary)]">
                <AlertTriangle size={17} className="text-[var(--primary)] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="block text-[var(--primary)] font-black uppercase tracking-wide">
                    ⚠️ The Strict Reset Rule:
                  </strong>
                  You must post at least <strong>once every single day</strong> before midnight. If you miss even <strong>ONE day without posting</strong>, your streak is <strong>immediately removed and resets to 0</strong>!
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--primary-tint)] text-[var(--primary)] flex items-center justify-center shrink-0 font-bold text-xs">
                  +25
                </div>
                <div>
                  <h4 className="font-bold text-white">Earn +25 Strike Points Daily</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Your first post each day awards <strong>+25 Strike Points</strong> and increments your flame streak by +1 day!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <span className="text-lg">🔥</span>
                <div>
                  <h4 className="font-bold text-white">Streak Flame Tiers</h4>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 text-[10px]">
                    <span className="p-1 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-bold">
                      🌱 3d: Honey Sprout
                    </span>
                    <span className="p-1 rounded bg-[var(--gold-tint)] border border-[var(--gold)] text-[var(--gold)] font-bold">
                      🐝 7d: Hive Scout
                    </span>
                    <span className="p-1 rounded bg-[var(--primary-tint)] border border-[var(--line-strong)] text-[var(--primary)] font-bold">
                      🛡️ 14d: Fire Guard
                    </span>
                    <span className="p-1 rounded bg-[var(--primary-tint)] border border-[var(--line-strong)] text-[var(--primary)] font-bold">
                      👑 30d: Campus Legend
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LEADERBOARD & STAR BOARD */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--gold-tint)] via-[var(--gold-tint)] to-transparent border border-[var(--gold)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--gold)] font-black text-sm">
                <Trophy size={18} className="text-[var(--gold)]" />
                <span>The Star Board & School Rankings</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Compete across your class, section, and the entire school! The students with the highest active streaks and points take the <strong>Top 1, 2, 3 Glory Podium</strong> on the DPS Buzz Home Feed.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Zap size={14} className="text-[var(--gold)]" />
                  <span>How to Earn Strike Points & Climb Ranks:</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 pt-1">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-bold text-[var(--primary)]">Daily Habit Post</span>
                    <p className="text-[10px] text-slate-400">+25 pts (1st post/day)</p>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-bold text-[var(--primary)]">Connect 4 Duel</span>
                    <p className="text-[10px] text-slate-400">+50 pts win / +10 pts play</p>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-bold text-cyan-300">Cricket Challenge</span>
                    <p className="text-[10px] text-slate-400">+50 pts for correct guess</p>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-bold text-[var(--primary)]">Solo 2048</span>
                    <p className="text-[10px] text-slate-400">Up to +350 pts per tier</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
                <span className="text-lg">🏅</span>
                <div>
                  <h4 className="font-bold text-white">Section & School Pride</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Represent your class section (e.g. Class 8-A) and bring your section to #1 on the leaderboard!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2.5">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismiss}
              className="py-2.5 px-4 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Skip
            </button>
          )}

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  step === s ? 'w-5 bg-[#6B5BF2]' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#6B5BF2] via-[#6B5BF2] to-[#7B6CFF] hover:opacity-95 text-white text-xs font-black shadow-lg shadow-[#6B5BF2]/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/post/new"
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-950/40"
              >
                <Camera size={14} />
                <span>Post Now</span>
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6B5BF2] via-[#6B5BF2] to-[#7B6CFF] hover:opacity-95 text-white text-xs font-black shadow-lg shadow-[#6B5BF2]/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                <span>Let&apos;s Go 🚀</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
