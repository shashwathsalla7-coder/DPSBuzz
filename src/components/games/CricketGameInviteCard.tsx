'use client';

import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Play, Check, X, Shield, Sparkles, Lock, ArrowRight, UserX } from 'lucide-react';

export interface CricketGameInviteData {
  gameId: string;
  gameType: 'cricket';
  inviterUsername: string;
  inviterName: string;
  opponentUsername: string;
  opponentName: string;
  status: 'waiting_invite' | 'declined' | 'selecting' | 'in_progress' | 'completed' | 'abandoned';
  winner?: string | null;
  winningGuess?: string | null;
  forfeitedBy?: string | null;
}

interface CricketGameInviteCardProps {
  invite: CricketGameInviteData;
  isMe: boolean;
  currentUsername: string;
  onAccept: (gameId: string) => void;
  onDecline: (gameId: string) => void;
  onOpenGame: (gameId: string) => void;
}

export function CricketGameInviteCard({
  invite,
  isMe,
  currentUsername,
  onAccept,
  onDecline,
  onOpenGame,
}: CricketGameInviteCardProps) {
  const cleanCurrent = (currentUsername || '').toLowerCase().trim();
  const cleanInviter = (invite.inviterUsername || '').toLowerCase().trim();
  const cleanOpponent = (invite.opponentUsername || '').toLowerCase().trim();

  // Bulletproof role detection: if current user sent this bubble (isMe), they are the inviter.
  // If they received this bubble (!isMe), they are the opponent/recipient!
  const isInviter = isMe || cleanInviter === cleanCurrent;
  const isOpponent = !isMe || cleanOpponent === cleanCurrent || cleanOpponent.includes(cleanCurrent);

  const [liveStatus, setLiveStatus] = useState<string>(invite.status);
  const [liveWinner, setLiveWinner] = useState<string | null>(invite.winner || null);
  const [liveWinningGuess, setLiveWinningGuess] = useState<string | null>(invite.winningGuess || null);
  const [forfeitedBy, setForfeitedBy] = useState<string | null>(invite.forfeitedBy || null);
  const [mePicked, setMePicked] = useState<boolean>(false);
  const [oppPicked, setOppPicked] = useState<boolean>(false);
  const [liveTurn, setLiveTurn] = useState<string | null>(null);

  // Poll & broadcast channel live game state so updates are instantaneous
  useEffect(() => {
    // If the game is already in a terminal state, don't poll or listen
    if (liveStatus === 'completed' || liveStatus === 'declined' || liveStatus === 'abandoned') {
      return;
    }

    let isMounted = true;

    const checkLiveSession = async () => {
      try {
        const res = await fetch(
          `/api/games/cricket?gameId=${encodeURIComponent(invite.gameId)}&username=${encodeURIComponent(cleanCurrent)}`,
          { cache: 'no-store' }
        );
        if (res.status === 404) {
          if (isMounted) setLiveStatus('abandoned');
          return;
        }
        const data = await res.json();
        if (isMounted && data?.success && data?.session) {
          const s = data.session;
          setLiveStatus((prev) => (prev !== s.status ? s.status : prev));
          if (s.winner) setLiveWinner((prev) => (prev !== s.winner ? s.winner : prev));
          if (s.winningGuess) setLiveWinningGuess((prev) => (prev !== s.winningGuess ? s.winningGuess : prev));
          if (s.forfeitedBy) setForfeitedBy((prev) => (prev !== s.forfeitedBy ? s.forfeitedBy : prev));
          if (s.currentTurn) setLiveTurn((prev) => (prev !== s.currentTurn ? s.currentTurn : prev));

          const p1User = (s.player1?.username || '').toLowerCase().trim();
          const isP1 = p1User === cleanCurrent;
          const mePlayer = isP1 ? s.player1 : s.player2;
          const oppPlayer = isP1 ? s.player2 : s.player1;

          const hasMe = Boolean(mePlayer?.hasSelected);
          const hasOpp = Boolean(oppPlayer?.hasSelected);
          setMePicked((prev) => (prev !== hasMe ? hasMe : prev));
          setOppPicked((prev) => (prev !== hasOpp ? hasOpp : prev));
        }
      } catch {}
    };

    checkLiveSession();

    // Instant cross-tab sync via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('dpsbuzz_cricket_realtime');
        bc.onmessage = (ev) => {
          if (ev.data?.gameId === invite.gameId) {
            checkLiveSession();
          }
        };
      }
    } catch {}

    const onCustomUpdate = (ev: Event) => {
      const customEv = ev as CustomEvent;
      if (!customEv.detail?.gameId || customEv.detail.gameId === invite.gameId) {
        checkLiveSession();
      }
    };
    window.addEventListener('dpsbuzz_cricket_update', onCustomUpdate);

    // Fast fallback polling every 900ms while game is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      checkLiveSession();
    }, 900);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener('dpsbuzz_cricket_update', onCustomUpdate);
    };
  }, [invite.gameId, cleanCurrent, liveStatus]);

  const otherUsername = isInviter ? invite.opponentUsername : invite.inviterUsername;
  const isForfeited = Boolean(forfeitedBy) || Boolean(invite.forfeitedBy) || (liveWinningGuess && liveWinningGuess.toLowerCase().includes('quit'));

  return (
    <div
      className={`my-2 p-3.5 rounded-2xl border text-left max-w-sm transition-all shadow-lg select-none ${
        isMe
          ? 'bg-gradient-to-br from-[#140E26] via-[#0F1220] to-[#1C0E28] border-[#833AB4]/40 shadow-[0_10px_30px_rgba(131,58,180,0.2)] text-white'
          : 'bg-gradient-to-br from-[#0F101E] via-[#120E24] to-[#0A0D18] border-[#C13584]/30 text-white'
      }`}
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#F77737] p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-[#0D101E] rounded-[6px] flex items-center justify-center text-xs">
              🏏
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] bg-clip-text text-transparent">
                Guess the Cricketer
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#C13584]/20 text-pink-300 font-extrabold border border-[#C13584]/30">
                Arena
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">DPS Buzz Deduction Duel</p>
          </div>
        </div>

        {liveStatus === 'in_progress' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        )}
      </div>

      {/* Invitation & Turn Description */}
      <div className="space-y-1.5 mb-3">
        {liveStatus === 'waiting_invite' && (
          <p className="text-xs text-slate-200 font-medium">
            {isInviter ? (
              <span>
                You challenged <strong className="text-cyan-300 font-bold">@{invite.opponentUsername}</strong> to a match.
              </span>
            ) : (
              <span>
                <strong className="text-cyan-300 font-bold">@{invite.inviterUsername}</strong> challenged you to Guess the Cricketer!
              </span>
            )}
          </p>
        )}

        {liveStatus === 'selecting' && (
          <div className="space-y-1">
            {oppPicked && !mePicked ? (
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 font-medium flex items-center gap-2 animate-pulse">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <span>
                  <strong className="text-white">@{otherUsername}</strong> picked their cricketer! Choose yours now! 🔒
                </span>
              </div>
            ) : mePicked && !oppPicked ? (
              <div className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                <Lock size={13} className="text-emerald-400 shrink-0" />
                <span>You chose your secret cricketer! Waiting for @{otherUsername} to pick...</span>
              </div>
            ) : mePicked && oppPicked ? (
              <div className="text-xs text-emerald-200 font-medium flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-400 shrink-0" />
                <span>Both players ready! Deduction arena starting...</span>
              </div>
            ) : (
              <div className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                <span>Challenge accepted! Select your secret cricketer 🔒</span>
              </div>
            )}
          </div>
        )}

        {liveStatus === 'in_progress' && (
          <div className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400 shrink-0" />
            <span>
              Match active! {liveTurn === cleanCurrent ? (
                <strong className="text-emerald-400 font-bold">Your turn to ask/guess! 🎯</strong>
              ) : (
                <span className="text-slate-300">@{liveTurn}&apos;s turn to act ⏳</span>
              )}
            </span>
          </div>
        )}

        {liveStatus === 'completed' && (
          <div className="space-y-1">
            {isForfeited ? (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2.5">
                <UserX size={16} className="text-rose-400 shrink-0" />
                <div>
                  <p className="font-extrabold text-rose-300">
                    @{forfeitedBy || otherUsername} has quit the match!
                  </p>
                  <p className="text-xs text-white">
                    Winner: <strong className="text-amber-400 font-extrabold">@{liveWinner || invite.winner}</strong> 🏆 (Opponent quit)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-400 shrink-0" />
                <span>
                  Game finished! Winner:{' '}
                  <strong className="text-amber-300 font-bold">@{liveWinner || invite.winner}</strong> 🏆
                </span>
              </div>
            )}
          </div>
        )}

        {liveStatus === 'declined' && (
          <p className="text-xs text-rose-400 font-medium">The challenge was declined.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-1">
        {/* Recipient pending options */}
        {liveStatus === 'waiting_invite' && isOpponent && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLiveStatus('selecting');
                onAccept(invite.gameId);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#C13584]/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Accept & Play</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLiveStatus('declined');
                onDecline(invite.gameId);
              }}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <X size={14} />
              <span>Decline</span>
            </button>
          </div>
        )}

        {/* Inviter pending status */}
        {liveStatus === 'waiting_invite' && isInviter && (
          <div className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-slate-400 font-medium">
            Waiting for @{invite.opponentUsername} to accept...
          </div>
        )}

        {/* Selecting stage actions */}
        {liveStatus === 'selecting' && (
          <button
            type="button"
            onClick={() => onOpenGame(invite.gameId)}
            className={`w-full py-2 px-3 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              oppPicked && !mePicked
                ? 'bg-gradient-to-r from-[#F77737] via-[#C13584] to-[#833AB4] hover:opacity-95 animate-pulse shadow-[#C13584]/50'
                : 'bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] hover:opacity-95 shadow-[#C13584]/40'
            }`}
          >
            {oppPicked && !mePicked ? (
              <>
                <Sparkles size={13} className="text-amber-300" />
                <span>Opponent Ready! Choose Your Cricketer 🏏</span>
              </>
            ) : mePicked && !oppPicked ? (
              <>
                <Lock size={13} className="text-pink-300" />
                <span>Secret Locked · View Match Lobby ⏳</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-white" />
                <span>Pick Secret Cricketer 🏏</span>
              </>
            )}
          </button>
        )}

        {/* In-progress active game enter button */}
        {liveStatus === 'in_progress' && (
          <button
            type="button"
            onClick={() => onOpenGame(invite.gameId)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#C13584]/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play size={13} className="fill-white" />
            <span>Enter Match Arena 🎮</span>
          </button>
        )}

        {/* Completed game view button */}
        {liveStatus === 'completed' && (
          <button
            type="button"
            onClick={() => onOpenGame(invite.gameId)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-bold shadow-md shadow-amber-900/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy size={13} className="fill-white" />
            <span>View Match Results / Play Again</span>
          </button>
        )}
      </div>
    </div>
  );
}
