'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Clock, HelpCircle, X, Medal, Swords, Award, Star, Flame, Shield } from 'lucide-react';
import type { CricketLeaderboardEntry, CricketMatchRecord } from '@/types/cricketGame';

interface CricketLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'leaderboard' | 'history' | 'rules';
  currentUsername?: string;
}

export function CricketLeaderboardModal({
  isOpen,
  onClose,
  initialTab = 'leaderboard',
  currentUsername,
}: CricketLeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history' | 'rules'>(initialTab);
  const [leaderboard, setLeaderboard] = useState<CricketLeaderboardEntry[]>([]);
  const [history, setHistory] = useState<CricketMatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchData() {
      setIsLoading(true);
      try {
        const [lbRes, histRes] = await Promise.all([
          fetch('/api/games/cricket?action=leaderboard'),
          fetch('/api/games/cricket?action=history'),
        ]);

        const lbJson = await lbRes.json();
        const histJson = await histRes.json();

        if (isMounted) {
          if (lbJson.success) setLeaderboard(lbJson.leaderboard || []);
          if (histJson.success) setHistory(histJson.history || []);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="DPSBuzz Cricket Leaderboard & Match Center"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-[#110e1c] border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-fade-in text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-500/20 flex items-center justify-between bg-gradient-to-r from-purple-950/80 via-[#181329] to-purple-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-lg shadow-sm">
              🏏
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Guess the Cricketer</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                  Arena
                </span>
              </h3>
              <p className="text-xs text-purple-200/70">Leaderboard & Match Center</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-purple-500/20 px-3 pt-2 bg-[#140f24]">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <Trophy size={14} />
            <span>Leaderboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <Clock size={14} />
            <span>Match History</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-purple-300/60 hover:text-purple-200'
            }`}
          >
            <HelpCircle size={14} />
            <span>How to Play</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-purple-300">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              <p className="text-xs">Loading cricket arena stats...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: LEADERBOARD */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-2.5">
                  {leaderboard.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-2xl">
                        🏏
                      </div>
                      <h4 className="text-sm font-bold text-white">No matches played yet!</h4>
                      <p className="text-xs text-purple-300/70 max-w-xs leading-relaxed">
                        Challenge a classmate in chat to take the #1 spot on the DPSBuzz Cricket Leaderboard.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-[11px] font-semibold text-purple-300/70 px-1 uppercase tracking-wider flex items-center justify-between">
                        <span>Rank & Player</span>
                        <span>Wins • Win Rate • Points</span>
                      </div>

                      {leaderboard.map((entry, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    return (
                      <div
                        key={entry.username}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          isTop1
                            ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border-amber-500/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank badge */}
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isTop1
                                ? 'bg-amber-400 text-black shadow-md shadow-amber-500/30'
                                : isTop2
                                ? 'bg-slate-300 text-black'
                                : isTop3
                                ? 'bg-amber-700 text-white'
                                : 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {isTop1 ? '👑' : index + 1}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{entry.fullName}</span>
                              {isTop1 && <Flame size={12} className="text-amber-400 shrink-0 fill-amber-400" />}
                            </p>
                            <p className="text-[10px] text-purple-300/70 truncate">@{entry.username}</p>
                          </div>
                        </div>

                        {/* Stats pill */}
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-pink-400">{entry.points} pts</span>
                            <span className="text-[10px] text-purple-300/60">
                              {entry.wins}W / {entry.matches}M ({entry.winRate}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: MATCH HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-2.5">
                  {history.length === 0 ? (
                    <div className="py-12 text-center text-purple-300/60 text-xs">
                      No matches played yet. Be the first to start a match! 🏏
                    </div>
                  ) : (
                    history.map((record) => {
                      const dateStr = record.completedAt
                        ? new Date(record.completedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recent';

                      return (
                        <div
                          key={record.id}
                          className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between text-[11px] text-purple-300/70 pb-1 border-b border-white/5">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock size={11} />
                              {dateStr}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                              Winner: @{record.winnerUsername} 🏆
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
                              <span className="text-[10px] text-purple-300/70 block">Player 1</span>
                              <strong className="text-white block truncate">@{record.player1Username}</strong>
                              <span className="text-[10px] text-pink-300 font-semibold block mt-0.5 truncate">
                                Picked: {record.player1Cricketer}
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
                              <span className="text-[10px] text-purple-300/70 block">Player 2</span>
                              <strong className="text-white block truncate">@{record.player2Username}</strong>
                              <span className="text-[10px] text-pink-300 font-semibold block mt-0.5 truncate">
                                Picked: {record.player2Cricketer}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 3: RULES & HOW TO PLAY */}
              {activeTab === 'rules' && (
                <div className="space-y-3.5 text-xs text-purple-200/90 leading-relaxed">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 space-y-1.5">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>🏏 Core Objective</span>
                    </h4>
                    <p>
                      Each player secretly picks one legendary or active cricketer. You take turns asking smart Yes/No questions to narrow down who your opponent picked. The first player to correctly guess wins!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider text-pink-400">
                      Step-by-Step Rules:
                    </h5>
                    <ol className="space-y-2 list-decimal list-inside pl-1">
                      <li>
                        <strong className="text-white">Secret Selection:</strong> Browse and pick your secret cricketer. Your pick is encrypted and locked on the server — your opponent cannot see it.
                      </li>
                      <li>
                        <strong className="text-white">Alternating Turns:</strong> On your turn, you can either:
                        <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-purple-200/75">
                          <li>Ask a suggested or custom Yes/No question about their cricketer.</li>
                          <li>Or submit a final guess if you are confident!</li>
                        </ul>
                      </li>
                      <li>
                        <strong className="text-white">Honest Answers:</strong> When your opponent asks you a question, answer truthfully with <span className="text-emerald-400 font-semibold">Yes</span>, <span className="text-red-400 font-semibold">No</span>, <span className="text-amber-400 font-semibold">Partially</span>, or <span className="text-purple-400 font-semibold">Can&apos;t Say</span>.
                      </li>
                      <li>
                        <strong className="text-white">Final Guesses:</strong> If your guess is correct, you win immediately! If incorrect, your turn passes to your opponent, but your opponent&apos;s cricketer remains secret.
                      </li>
                      <li>
                        <strong className="text-white">Leaderboard Points:</strong> Winners earn <span className="text-amber-300 font-bold">+60 points</span>; participants earn <span className="text-purple-300 font-bold">+15 points</span>.
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-purple-500/20 bg-[#140f24] text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Close Match Center
          </button>
        </div>
      </div>
    </div>
  );
}
