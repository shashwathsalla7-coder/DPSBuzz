'use client';

import React from 'react';
import { Swords, Trophy, Play, Check, X, Shield, Sparkles } from 'lucide-react';

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
  const cleanCurrent = currentUsername.toLowerCase().trim();
  const isInviter = invite.inviterUsername.toLowerCase().trim() === cleanCurrent;
  const isOpponent = invite.opponentUsername.toLowerCase().trim() === cleanCurrent;

  const status = invite.status;

  return (
    <div
      className={`my-2 p-3.5 rounded-2xl border text-left max-w-sm transition-all shadow-md select-none ${
        isMe
          ? 'bg-gradient-to-br from-purple-900/90 via-indigo-950/90 to-purple-950/90 border-purple-500/40 text-white'
          : 'bg-gradient-to-br from-slate-900/95 via-purple-950/90 to-slate-900/95 border-purple-500/30 text-white'
      }`}
    >
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-sm">
            🏏
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Guess the Cricketer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-500/30 text-pink-300 font-semibold border border-pink-400/20">
                DPSBuzz Game
              </span>
            </h4>
            <p className="text-[10px] text-purple-200/70">1-on-1 Realtime Deduction Duel</p>
          </div>
        </div>

        {status === 'in_progress' && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        )}
      </div>

      {/* Invitation Description */}
      <div className="space-y-1.5 mb-3">
        {status === 'waiting_invite' && (
          <p className="text-xs text-purple-100 font-medium">
            {isInviter ? (
              <span>
                You challenged <strong className="text-pink-300 font-bold">@{invite.opponentUsername}</strong> to a match.
              </span>
            ) : (
              <span>
                <strong className="text-pink-300 font-bold">@{invite.inviterUsername}</strong> challenged you to Guess the Cricketer!
              </span>
            )}
          </p>
        )}

        {(status === 'selecting' || status === 'in_progress') && (
          <div className="text-xs text-purple-100 font-medium flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400 shrink-0" />
            <span>Match active: Secret cricketer battle in progress!</span>
          </div>
        )}

        {status === 'completed' && (
          <div className="text-xs text-purple-100 font-medium flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400 shrink-0" />
            <span>
              Game finished! Winner:{' '}
              <strong className="text-amber-300 font-bold">@{invite.winner}</strong>
            </span>
          </div>
        )}

        {status === 'declined' && (
          <p className="text-xs text-red-300 font-medium">The challenge was declined.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-1">
        {/* Recipient pending options */}
        {status === 'waiting_invite' && isOpponent && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAccept(invite.gameId)}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Accept & Play</span>
            </button>
            <button
              type="button"
              onClick={() => onDecline(invite.gameId)}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <X size={14} />
              <span>Decline</span>
            </button>
          </div>
        )}

        {/* Inviter pending status */}
        {status === 'waiting_invite' && isInviter && (
          <div className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-purple-200/80 font-medium">
            Waiting for @{invite.opponentUsername} to accept...
          </div>
        )}

        {/* Active game enter button */}
        {(status === 'selecting' || status === 'in_progress') && (
          <button
            type="button"
            onClick={() => onOpenGame(invite.gameId)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-900/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play size={13} className="fill-white" />
            <span>Enter Match Arena</span>
          </button>
        )}

        {/* Completed game view button */}
        {status === 'completed' && (
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
