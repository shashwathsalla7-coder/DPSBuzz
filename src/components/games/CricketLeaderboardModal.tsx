'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Clock, HelpCircle, X, Medal, Swords, Award, Star, Flame, Shield, Heart, AlertTriangle } from 'lucide-react';
import type { CricketLeaderboardEntry, CricketMatchRecord } from '@/types/cricketGame';
import { CricketBall3D, Trophy3D } from './Cricket3DObjects';

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
        const viewerParam = currentUsername ? `&viewer=${encodeURIComponent(currentUsername.toLowerCase().trim())}` : '';
        const [lbRes, histRes] = await Promise.all([
          fetch(`/api/games/cricket?action=leaderboard${viewerParam}`, { cache: 'no-store' }),
          fetch(`/api/games/cricket?action=history${viewerParam}`, { cache: 'no-store' }),
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
  }, [isOpen, currentUsername]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="DPSBuzz Cricket Leaderboard & Match Center"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-[#0A0D15]/92 backdrop-blur-3xl border border-white/15 rounded-[28px] sm:rounded-[36px] shadow-[0_30px_90px_rgba(0,0,0,0.85)] flex flex-col max-h-[88vh] overflow-hidden animate-fade-in text-white">
        {/* Apple specular rim highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-20" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#121626]/90 via-[#0E121E]/90 to-[#121626]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-0.5">
              <CricketBall3D size="sm" spinning={true} />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] bg-clip-text text-transparent">
                  Guess the Cricketer
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C13584]/20 text-pink-300 font-extrabold border border-[#C13584]/40">
                  Arena
                </span>
              </h3>
              <p className="text-xs text-slate-400">DPS Buzz Leaderboard & Match Center</p>
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
        <div className="flex border-b border-[#1F293D] px-3 pt-2 bg-[#0F131B]">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'border-[#C13584] text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy size={14} className={activeTab === 'leaderboard' ? 'text-[#F77737]' : ''} />
            <span>Leaderboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#C13584] text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock size={14} className={activeTab === 'history' ? 'text-[#833AB4]' : ''} />
            <span>Match History</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'border-[#C13584] text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle size={14} className={activeTab === 'rules' ? 'text-[#C13584]' : ''} />
            <span>Rules & Lives</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <p className="text-xs">Loading cricket arena stats...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: LEADERBOARD */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-2.5">
                  {leaderboard.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#171C26] border border-[#222B3B] flex items-center justify-center text-2xl">
                        🏏
                      </div>
                      <h4 className="text-sm font-bold text-white">No matches played yet!</h4>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        Challenge a classmate in chat to take the #1 spot on the DPSBuzz Cricket Leaderboard.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-[11px] font-semibold text-slate-400 px-1 uppercase tracking-wider flex items-center justify-between">
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
                                ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-amber-950/40 border-amber-500/40'
                                : 'bg-[#151D2A] border-[#222B3B] hover:bg-[#1A2333]'
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
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {isTop1 ? '👑' : index + 1}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                  <span>{entry.fullName}</span>
                                  {isTop1 && <Flame size={12} className="text-amber-400 shrink-0 fill-amber-400" />}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">@{entry.username}</p>
                              </div>
                            </div>

                            {/* Stats pill */}
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-cyan-400">{entry.points} pts</span>
                                <span className="text-[10px] text-slate-400">
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
                    <div className="py-12 text-center text-slate-400 text-xs">
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
                          className="p-3.5 rounded-2xl bg-[#151D2A] border border-[#222B3B] space-y-2 hover:bg-[#1A2333] transition-colors"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-white/5">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock size={11} />
                              {dateStr}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                              Winner: @{record.winnerUsername} 🏆
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-xl bg-[#0F131B] border border-[#1F293D]">
                              <span className="text-[10px] text-slate-400 block">Player 1</span>
                              <strong className="text-white block truncate">@{record.player1Username}</strong>
                              <span className="text-[10px] text-cyan-400 font-semibold block mt-0.5 truncate">
                                Picked: {record.player1Cricketer}
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-[#0F131B] border border-[#1F293D]">
                              <span className="text-[10px] text-slate-400 block">Player 2</span>
                              <strong className="text-white block truncate">@{record.player2Username}</strong>
                              <span className="text-[10px] text-cyan-400 font-semibold block mt-0.5 truncate">
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
                <div className="space-y-3.5 text-xs text-slate-200 leading-relaxed">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 space-y-1.5">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>🏏 Core Objective & Fast Turns</span>
                    </h4>
                    <p className="text-slate-300">
                      Each player secretly picks one legendary or active cricketer. You take turns asking smart Yes/No questions to deduce your opponent&apos;s cricketer. The first player to correctly guess wins!
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                    <h5 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                      <Heart size={14} className="text-rose-500 fill-rose-500" />
                      <span>3 Lives / Guess Attempts Rule</span>
                    </h5>
                    <p className="text-slate-300">
                      Each player has exactly <strong>3 Guess Attempts (❤️❤️❤️)</strong> per match.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                      <li>
                        <strong className="text-emerald-400">First to Correctly Guess Wins:</strong> The first player to deduce and say the opponent&apos;s cricketer wins immediately!
                      </li>
                      <li>
                        <strong className="text-rose-400">3 Fails = Instant Loss:</strong> If you fail 3 times, your 3 lives are exhausted and your opponent wins automatically!
                      </li>
                      <li>
                        <strong className="text-cyan-400">Both Players Can Pick Same Cricketer:</strong> You and your opponent are allowed to secretly choose the identical cricketer! You can guess that cricketer freely — if your opponent picked them too, you win!
                      </li>
                      <li>
                        <strong className="text-amber-400">Forfeit Rule:</strong> If a player quits the match or exits, the opponent is immediately awarded the win by forfeit.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider text-cyan-400">
                      How Turns Work:
                    </h5>
                    <ol className="space-y-2 list-decimal list-inside pl-1 text-slate-300">
                      <li>
                        <strong className="text-white">Secret Selection:</strong> Pick your cricketer from 200+ icons. Your pick is encrypted until the match ends.
                      </li>
                      <li>
                        <strong className="text-white">Alternating Turns:</strong> You can either ask a Yes/No question or tap a quick-option answer to make a guess.
                      </li>
                      <li>
                        <strong className="text-white">Honest Answers:</strong> Answer your opponent with <span className="text-emerald-400 font-semibold">Yes</span>, <span className="text-rose-400 font-semibold">No</span>, <span className="text-amber-400 font-semibold">Partially</span>, or <span className="text-slate-300 font-semibold">Can&apos;t Say</span>.
                      </li>
                      <li>
                        <strong className="text-white">Leaderboard Points:</strong> Match winners receive <span className="text-amber-300 font-bold">+50 points</span>; each completed match awards <span className="text-cyan-300 font-bold">+10 points</span>. Points = (Wins × 50) + (Losses × 10).
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1F293D] bg-[#0F131B] text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Close Match Center
          </button>
        </div>
      </div>
    </div>
  );
}
