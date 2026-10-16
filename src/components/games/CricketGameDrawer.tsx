'use client';

import React from 'react';
import { Trophy, Swords, X, Play, HelpCircle, History, Sparkles } from 'lucide-react';

interface CricketGameDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  opponentUsername: string;
  opponentName: string;
  onSendChallenge: () => void;
  onOpenLeaderboard: (tab?: 'leaderboard' | 'history' | 'rules') => void;
}

export function CricketGameDrawer({
  isOpen,
  onClose,
  opponentUsername,
  opponentName,
  onSendChallenge,
  onOpenLeaderboard,
}: CricketGameDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-end justify-center select-none"
      role="dialog"
      aria-modal="true"
      aria-label="DPSBuzz Games Menu"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[480px] bg-[#120e21] border-t border-purple-500/30 rounded-t-[28px] shadow-2xl p-4 space-y-4 animate-slide-up text-white">
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full mx-auto bg-purple-500/30" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-lg">
              🎮
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>DPSBuzz Games</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                  New
                </span>
              </h3>
              <p className="text-xs text-purple-200/70">Play 1-on-1 multiplayer games in chat</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Featured Game Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/60 via-purple-950/70 to-indigo-950/70 border border-pink-500/40 space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest text-pink-400 block">
                Featured Game
              </span>
              <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Guess the Cricketer</span>
                <span className="text-lg">🏏</span>
              </h4>
              <p className="text-xs text-purple-200/80 leading-relaxed max-w-[280px]">
                Pick your secret cricketer. Take turns asking smart Yes/No questions and be the first to guess their secret!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSendChallenge();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-pink-900/40 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <Swords size={16} />
            <span>Challenge @{opponentUsername}</span>
          </button>
        </div>

        {/* Secondary Options */}
        <div className="space-y-2 pt-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLeaderboard('leaderboard');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 transition-colors cursor-pointer text-purple-100"
          >
            <Trophy size={18} className="text-amber-400" />
            <span className="flex-1 text-left text-xs font-bold">Leaderboard & Rankings</span>
            <span className="text-[10px] text-purple-400 font-semibold">Top Masters →</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLeaderboard('history');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 transition-colors cursor-pointer text-purple-100"
          >
            <History size={18} className="text-teal-400" />
            <span className="flex-1 text-left text-xs font-bold">Match History</span>
            <span className="text-[10px] text-purple-400 font-semibold">Past Games →</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLeaderboard('rules');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 transition-colors cursor-pointer text-purple-100"
          >
            <HelpCircle size={18} className="text-pink-400" />
            <span className="flex-1 text-left text-xs font-bold">Game Rules & Tips</span>
            <span className="text-[10px] text-purple-400 font-semibold">How to win →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
