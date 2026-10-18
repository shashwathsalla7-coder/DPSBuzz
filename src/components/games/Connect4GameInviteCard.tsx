'use client';

import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Play, Check, X, Shield, Sparkles, ArrowRight, Flag } from 'lucide-react';
import type { Connect4InviteData, Connect4Status } from '@/types/connect4Game';
import { Connect4Disc3D } from './Connect43DObjects';

interface Connect4GameInviteCardProps {
  invite: Connect4InviteData;
  isMe: boolean;
  currentUsername: string;
  onAccept: (gameId: string) => void;
  onDecline: (gameId: string) => void;
  onOpenGame: (gameId: string) => void;
}

export function Connect4GameInviteCard({
  invite,
  isMe,
  currentUsername,
  onAccept,
  onDecline,
  onOpenGame,
}: Connect4GameInviteCardProps) {
  const cleanCurrent = (currentUsername || '').toLowerCase().trim();
  const cleanInviter = (invite.inviterUsername || '').toLowerCase().trim();
  const cleanOpponent = (invite.opponentUsername || '').toLowerCase().trim();

  // Bulletproof role detection: if current user sent this bubble (isMe), they are the inviter.
  // If they received this bubble (!isMe), they are the opponent/recipient!
  const isInviter = isMe || cleanInviter === cleanCurrent;
  const isOpponent = !isMe || cleanOpponent === cleanCurrent || cleanOpponent.includes(cleanCurrent);

  const [liveStatus, setLiveStatus] = useState<Connect4Status>(invite.status);
  const [liveWinner, setLiveWinner] = useState<string | null>(invite.winner || null);
  const [forfeitedBy, setForfeitedBy] = useState<string | null>(invite.forfeitedBy || null);
  const [liveTurn, setLiveTurn] = useState<string | null>(null);

  useEffect(() => {
    if (liveStatus === 'completed' || liveStatus === 'declined' || liveStatus === 'abandoned') {
      return;
    }

    let isMounted = true;

    const checkLiveSession = async () => {
      try {
        const res = await fetch(
          `/api/games/connect4?gameId=${encodeURIComponent(invite.gameId)}&username=${encodeURIComponent(cleanCurrent)}`,
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
          if (s.forfeitedBy) setForfeitedBy((prev) => (prev !== s.forfeitedBy ? s.forfeitedBy : prev));
          if (s.currentTurn) setLiveTurn((prev) => (prev !== s.currentTurn ? s.currentTurn : prev));
        }
      } catch {}
    };

    checkLiveSession();

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('dpsbuzz_connect4_realtime');
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
    window.addEventListener('dpsbuzz_connect4_update', onCustomUpdate);

    const interval = setInterval(checkLiveSession, 900);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('dpsbuzz_connect4_update', onCustomUpdate);
      if (bc) bc.close();
    };
  }, [invite.gameId, liveStatus, cleanCurrent]);

  const isMyTurn = liveTurn?.toLowerCase().trim() === cleanCurrent;
  const isGameOver = liveStatus === 'completed';
  const isWinner = isGameOver && liveWinner?.toLowerCase().trim() === cleanCurrent;
  const isDraw = isGameOver && liveWinner === 'draw';

  return (
    <div className="w-full max-w-[320px] rounded-2xl bg-gradient-to-br from-[#120F24] via-[#0E1120] to-[#180E1C] border border-[#C13584]/35 p-3.5 shadow-xl text-white space-y-3 select-none animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#F77737] p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-[#0D101E] rounded-[6px] flex items-center justify-center text-xs">
              🐝
            </div>
          </div>
          <div>
            <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1">
              <span className="bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] bg-clip-text text-transparent">
                Connect 4
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C13584]/20 text-pink-300 font-bold">
                Duel
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">DPS Buzz Four-In-A-Row</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Connect4Disc3D color="red" size="sm" />
          <Connect4Disc3D color="yellow" size="sm" />
        </div>
      </div>

      {/* Players Lineup */}
      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="truncate max-w-[85px]">{invite.inviterName || `@${invite.inviterUsername}`}</span>
        </div>
        <span className="text-[10px] text-cyan-400 font-black">VS</span>
        <div className="flex items-center gap-1.5">
          <span className="truncate max-w-[85px]">{invite.opponentName || `@${invite.opponentUsername}`}</span>
          <span className="w-2 h-2 rounded-full bg-amber-400" />
        </div>
      </div>

      {/* Status Bar */}
      <div className="text-center py-0.5">
        {liveStatus === 'declined' ? (
          <span className="text-xs text-slate-400 font-medium">Challenge was declined</span>
        ) : isGameOver ? (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Trophy size={14} className="text-amber-400" />
            <span>
              {isDraw
                ? 'Match Ended in a Draw! 🤝'
                : isWinner
                ? 'You Won the Match! 🏆'
                : `@${liveWinner} won the match!`}
            </span>
          </div>
        ) : liveStatus === 'in_progress' ? (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 animate-pulse">
            <Sparkles size={14} />
            <span>{isMyTurn ? 'Your turn to drop a disc!' : `Waiting for @${liveTurn || 'opponent'}...`}</span>
          </div>
        ) : (
          <span className="text-xs text-blue-300 font-semibold animate-pulse">
            {isInviter ? 'Waiting for opponent to accept...' : 'Challenged you to a match!'}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-0.5">
        {liveStatus === 'waiting_invite' ? (
          isOpponent ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLiveStatus('declined');
                  onDecline(invite.gameId);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  setLiveStatus('in_progress');
                  onAccept(invite.gameId);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-red-950/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check size={14} />
                <span>Accept Duel</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenGame(invite.gameId)}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Arena</span>
              <ArrowRight size={14} />
            </button>
          )
        ) : liveStatus === 'in_progress' ? (
          <button
            type="button"
            onClick={() => onOpenGame(invite.gameId)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-950/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Play size={14} fill="currentColor" />
            <span>{isMyTurn ? 'Your Turn - Drop Disc! ⚡' : 'View Live Board 🔴'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenGame(invite.gameId)}
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Final Board 🎬</span>
          </button>
        )}
      </div>
    </div>
  );
}
