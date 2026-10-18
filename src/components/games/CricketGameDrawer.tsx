'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Swords,
  X,
  Play,
  HelpCircle,
  History,
  Sparkles,
  Bot,
  Zap,
  Flame,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Connect4Disc3D } from './Connect43DObjects';
import { CricketBall3D } from './Cricket3DObjects';
import { SoloTile3D } from './Solo20483DObjects';
import { DataStore, type Profile as UserProfile } from '@/lib/dataStore';
import type { Connect4Difficulty } from '@/types/connect4Game';

export interface SelectedPlayer {
  username: string;
  fullName: string;
  avatar?: string | null;
  class?: string;
  section?: string;
}

interface CricketGameDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  opponentUsername?: string;
  opponentName?: string;
  onSendChallenge: (targetUser?: SelectedPlayer) => void;
  onSendConnect4Challenge?: (isBot?: boolean, targetUser?: SelectedPlayer, difficulty?: Connect4Difficulty) => void;
  onOpenSoloGame?: (gameType?: '2048') => void;
  onOpenLeaderboard: (tab?: 'leaderboard' | 'history' | 'rules') => void;
}

export function CricketGameDrawer({
  isOpen,
  onClose,
  opponentUsername = '',
  opponentName = '',
  onSendChallenge,
  onSendConnect4Challenge,
  onOpenSoloGame,
  onOpenLeaderboard,
}: CricketGameDrawerProps) {
  const [selectedGameTab, setSelectedGameTab] = useState<'connect4' | 'cricket' | 'solo2048'>('connect4');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  const [botDifficulty, setBotDifficulty] = useState<Connect4Difficulty>('hard');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const currentUser = useMemo(() => {
    return DataStore.getCurrentUser();
  }, []);

  const currentCleanUser = (currentUser?.username || '').toLowerCase().trim();

  // Load all profiles from DataStore
  const allProfiles = useMemo(() => {
    if (!isOpen) return [];
    return DataStore.getProfiles().filter((p) => {
      const u = (p.username || '').toLowerCase().trim();
      return u && u !== currentCleanUser && u !== 'buzzbot';
    });
  }, [isOpen, currentCleanUser]);

  // Set default opponent if provided via props
  useEffect(() => {
    if (isOpen) {
      if (opponentUsername && opponentUsername.trim()) {
        const found = allProfiles.find(
          (p) => (p.username || '').toLowerCase() === opponentUsername.toLowerCase().trim()
        );
        setSelectedPlayer({
          username: opponentUsername,
          fullName: found?.fullName || opponentName || opponentUsername,
          avatar: found?.avatar || null,
          class: found?.class,
          section: found?.section,
        });
        setSelectedGameTab('connect4');
      } else {
        setSelectedPlayer(null);
        setSelectedGameTab('connect4');
      }
      setSearchQuery('');
    }
  }, [isOpen, opponentUsername, opponentName, allProfiles]);

  // Filtered players based on search query
  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) {
      // Suggest classmates from same class or first 6 students
      if (currentUser?.class) {
        const classmates = allProfiles.filter(
          (p) => p.class === currentUser.class && p.section === currentUser.section
        );
        if (classmates.length >= 3) return classmates.slice(0, 6);
      }
      return allProfiles.slice(0, 6);
    }
    const q = searchQuery.toLowerCase().trim();
    return allProfiles
      .filter(
        (p) =>
          (p.username || '').toLowerCase().includes(q) ||
          (p.fullName || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allProfiles, searchQuery, currentUser]);

  const handleSelectPlayer = (profile: UserProfile) => {
    setSelectedPlayer({
      username: profile.username,
      fullName: profile.fullName,
      avatar: profile.avatar || null,
      class: profile.class,
      section: profile.section,
    });
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleStartDuelClick = (gameType: 'connect4' | 'cricket') => {
    if (!selectedPlayer) {
      alert('Please search and select a player to duel with, or play vs BuzzBot!');
      return;
    }
    onClose();
    if (gameType === 'connect4') {
      if (onSendConnect4Challenge) {
        onSendConnect4Challenge(false, selectedPlayer || undefined);
      }
    } else {
      onSendChallenge(selectedPlayer || undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end justify-center select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="DPSBuzz Games Arena"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[500px] bg-[#0A0D18]/98 border-t border-[#C13584]/30 rounded-t-[32px] shadow-[0_-15px_60px_rgba(193,53,132,0.25)] p-4 sm:p-5 space-y-4 animate-slide-up text-white max-h-[92vh] overflow-y-auto">
        {/* Handle bar with brand shine */}
        <div className="w-12 h-1.5 rounded-full mx-auto bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737]" />

        {/* Header - DPS Buzz Brand Identity */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#F77737] p-0.5 shadow-lg shadow-[#C13584]/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0D101D] rounded-[14px] flex items-center justify-center text-xl">
                🐝
              </div>
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] bg-clip-text text-transparent">
                  DPS Buzz Games Arena
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C13584]/20 text-pink-300 font-extrabold border border-[#C13584]/40">
                  Live Lobby
                </span>
              </h3>
              <p className="text-xs text-slate-400">Invite any student or play arcade challenges</p>
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

        {/* Game Switcher Tabs with DPS Buzz Brand Colors */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-black">
          <button
            type="button"
            onClick={() => setSelectedGameTab('connect4')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedGameTab === 'connect4'
                ? 'bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] text-white shadow-lg shadow-[#C13584]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🔴 C4</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white font-extrabold hidden sm:inline">DUEL</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedGameTab('cricket')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedGameTab === 'cricket'
                ? 'bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] text-white shadow-lg shadow-[#C13584]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏏 Cricket</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedGameTab('solo2048')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedGameTab === 'solo2048'
                ? 'bg-gradient-to-r from-[#F77737] via-[#C13584] to-[#833AB4] text-white shadow-lg shadow-orange-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>👑 2048</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold">SOLO</span>
          </button>
        </div>

        {/* PLAYER SELECTION BOX - Required for Multiplayer Duels */}
        {selectedGameTab !== 'solo2048' && (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-[#C13584]/20 space-y-3 relative" ref={searchContainerRef}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-black tracking-widest text-[#F77737] flex items-center gap-1.5">
                <Users size={13} />
                <span>Choose Opponent</span>
              </span>

              {selectedPlayer && (
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="text-[11px] text-[#C13584] hover:underline font-bold cursor-pointer"
                >
                  Change Player
                </button>
              )}
            </div>

            {/* Currently Selected Player Card */}
            {selectedPlayer ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#833AB4]/20 via-[#C13584]/15 to-[#F77737]/15 border border-[#C13584]/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#833AB4] via-[#C13584] to-[#F77737] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-[#111422] flex items-center justify-center overflow-hidden">
                      {selectedPlayer.avatar ? (
                        <img src={selectedPlayer.avatar} alt={selectedPlayer.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-extrabold text-white">
                          {selectedPlayer.fullName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate flex items-center gap-1">
                      <span>{selectedPlayer.fullName}</span>
                      <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                    </p>
                    <p className="text-[11px] text-[#C13584] font-semibold truncate">
                      @{selectedPlayer.username} {selectedPlayer.class ? `• Class ${selectedPlayer.class}-${selectedPlayer.section || 'A'}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Ready
                  </span>
                </div>
              </div>
            ) : (
              /* Search Input Box to Pick Any Player */
              <div className="space-y-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search player by @username or name..."
                    className="w-full bg-[#111424] border border-white/15 focus:border-[#C13584] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown List */}
                {isSearchFocused && (
                  <div className="p-1 rounded-xl bg-[#0D101E] border border-white/15 max-h-40 overflow-y-auto space-y-0.5 shadow-2xl">
                    {filteredProfiles.length > 0 ? (
                      filteredProfiles.map((p) => (
                        <button
                          key={p.username}
                          type="button"
                          onClick={() => handleSelectPlayer(p)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#833AB4] to-[#F77737] p-0.5 flex-shrink-0">
                              <div className="w-full h-full rounded-full bg-[#111424] flex items-center justify-center overflow-hidden">
                                {p.avatar ? (
                                  <img src={p.avatar} alt={p.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-white">
                                    {p.fullName.slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate group-hover:text-pink-300">
                                {p.fullName}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                @{p.username} {p.class ? `• ${p.class}-${p.section || 'A'}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-bold group-hover:bg-[#C13584] transition-colors">
                            Pick
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No students found matching &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* GAME 1: CONNECT 4 (REDESIGNED WITH BRAND COLORS) */}
        {selectedGameTab === 'connect4' && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#160E26] via-[#101322] to-[#1C1022] border border-[#C13584]/35 space-y-3.5 relative overflow-hidden shadow-xl animate-fade-in">
            {/* Ambient Brand Orb */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#C13584]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#F77737]">
                    Multiplayer Duel
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C13584]/20 text-pink-300 font-extrabold border border-[#C13584]/35">
                    Hot ⭐
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Connect 4: Four In A Row</span>
                  <div className="flex items-center -space-x-1">
                    <Connect4Disc3D color="red" size="sm" />
                    <Connect4Disc3D color="yellow" size="sm" />
                  </div>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-[290px]">
                  Drop discs into the 7x6 board. Connect 4 horizontally, vertically, or diagonally before your opponent to win!
                </p>
              </div>
            </div>

            {/* 3 Bot Difficulty Tiers: Easy, Hard, Impossible */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Bot size={13} className="text-cyan-400" />
                  <span>AI Bot Difficulty:</span>
                </span>
                <span className="text-[10px] text-pink-300 font-bold">
                  {botDifficulty === 'easy' ? '🟢 Easy (Casual Win)' : botDifficulty === 'hard' ? '🟡 Hard (Tough)' : '🟣 Impossible (Minimax)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'easy', label: 'Easy', emoji: '🟢', desc: 'Casual' },
                    { id: 'hard', label: 'Hard', emoji: '🟡', desc: 'Tough' },
                    { id: 'impossible', label: 'Impossible', emoji: '🟣', desc: 'No Chance' },
                  ] as const
                ).map((lvl) => {
                  const isActive = botDifficulty === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setBotDifficulty(lvl.id)}
                      className={`py-1.5 px-2 rounded-lg text-left transition-all border cursor-pointer ${
                        isActive
                          ? lvl.id === 'easy'
                            ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-400/50'
                            : lvl.id === 'hard'
                            ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-400/50'
                            : 'bg-purple-950/70 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-400/50'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <p className="text-xs font-black flex items-center gap-1">
                        <span>{lvl.emoji}</span>
                        <span>{lvl.label}</span>
                      </p>
                      <p className="text-[9px] opacity-75">{lvl.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleStartDuelClick('connect4')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] hover:opacity-95 text-white text-xs font-black shadow-lg shadow-[#C13584]/35 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
              >
                <Swords size={15} />
                <span className="truncate">
                  {selectedPlayer ? `Challenge @${selectedPlayer.username}` : 'Challenge a Player'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSendConnect4Challenge) {
                    onSendConnect4Challenge(true, undefined, botDifficulty); // vs BuzzBot with selected difficulty
                  }
                }}
                className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-pink-900/60 hover:opacity-95 text-white text-xs font-bold border border-[#C13584]/50 flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                title={`Practice solo vs BuzzBot (${botDifficulty.toUpperCase()})`}
              >
                <Bot size={15} className="text-cyan-300" />
                <span>Vs Bot ({botDifficulty}) 🤖</span>
              </button>
            </div>
          </div>
        )}

        {/* GAME 2: GUESS THE CRICKETER (REDESIGNED WITH BRAND COLORS) */}
        {selectedGameTab === 'cricket' && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121226] via-[#0E1528] to-[#1E1228] border border-[#833AB4]/40 space-y-3.5 relative overflow-hidden shadow-xl animate-fade-in">
            {/* Ambient Brand Orb */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#833AB4]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#F77737] block">
                  Cricket Edition
                </span>
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Guess the Cricketer</span>
                  <CricketBall3D size="sm" />
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-[280px]">
                  Pick your secret cricketer. Take turns asking smart Yes/No questions and be the first to guess their secret! (3 lives limit)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStartDuelClick('cricket')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] hover:opacity-95 text-white text-xs font-black shadow-lg shadow-[#C13584]/35 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <Swords size={16} />
              <span className="truncate">
                {selectedPlayer ? `Challenge @${selectedPlayer.username} to Cricket` : 'Challenge a Player in Chat'}
              </span>
            </button>
          </div>
        )}

        {/* GAME 3: 2048 SOLO RUSH */}
        {selectedGameTab === 'solo2048' && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1F1208] via-[#1A0E22] to-[#260E24] border border-[#F77737]/45 space-y-3.5 relative overflow-hidden shadow-xl animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F77737]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#F77737]">
                    Solo Arcade • Instant Play
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#F77737]/20 text-amber-300 font-extrabold border border-[#F77737]/35">
                    No Waiting
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>2048: Buzz Tile Rush</span>
                  <span className="text-sm">👑</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-[280px]">
                  Slide matching tiles across 5 progressive levels (3x3 to 6x6). Use mouse drag, touch swipe, or tactile D-Pad. Unlock higher levels &amp; earn up to +500 Star Points!
                </p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="scale-75 origin-top-right flex gap-1">
                  <SoloTile3D value={1024} />
                  <SoloTile3D value={2048} />
                </div>
                <span className="text-[9px] text-[#F77737] font-bold tracking-tight">5 Levels • +500 Pts</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSoloGame) {
                  onOpenSoloGame('2048');
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F77737] via-[#C13584] to-[#833AB4] hover:opacity-95 text-white text-xs font-black shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <Play size={16} fill="white" />
              <span>Play 2048 Solo Now (Instant) 🚀</span>
            </button>
          </div>
        )}

        {/* Secondary Options */}
        <div className="space-y-2 pt-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLeaderboard('leaderboard');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200"
          >
            <Trophy size={18} className="text-[#F77737]" />
            <span className="flex-1 text-left text-xs font-bold">Arena Leaderboard & Rankings</span>
            <span className="text-[10px] text-pink-300 font-semibold">Top Masters →</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLeaderboard('history');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200"
          >
            <History size={18} className="text-[#833AB4]" />
            <span className="flex-1 text-left text-xs font-bold">Match History</span>
            <span className="text-[10px] text-pink-300 font-semibold">Past Games →</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLeaderboard('rules');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200"
          >
            <HelpCircle size={18} className="text-[#C13584]" />
            <span className="flex-1 text-left text-xs font-bold">Scoring: +50 Win, +10 Match</span>
            <span className="text-[10px] text-pink-300 font-semibold">Rules →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
