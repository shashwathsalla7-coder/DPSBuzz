'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Trophy,
  Volume2,
  VolumeX,
  RefreshCw,
  Flag,
  HelpCircle,
  Sparkles,
  ArrowDown,
  Clock,
  Shield,
  Zap,
} from 'lucide-react';
import type { Connect4Board, Connect4Disc, Connect4Session, Connect4Difficulty } from '@/types/connect4Game';
import {
  Connect4Disc3D,
  Connect4CinematicWinTransition,
  playConnect4DropSound,
  playConnect4TurnChime,
  playConnect4LaserSound,
  playConnect4WinFanfare,
  playConnect4DefeatSound,
} from './Connect43DObjects';

export interface WinningLineInfo {
  type: 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up';
  label: string;
  startXPercent: number;
  startYPercent: number;
  endXPercent: number;
  endYPercent: number;
}

/**
 * Calculates the exact straight line geometry passing through the 4 winning pieces.
 * Returns percentage coordinates (0-100%) for drawing an SVG laser beam across the 7x6 board.
 */
export function computeWinningLine(winningCells: [number, number][]): WinningLineInfo | null {
  if (!winningCells || winningCells.length < 4) return null;

  // Sort by col, then by row
  const byCol = [...winningCells].sort((a, b) => (a[1] !== b[1] ? a[1] - b[1] : a[0] - b[0]));
  const isVertical = byCol[0][1] === byCol[byCol.length - 1][1];

  let start: [number, number];
  let end: [number, number];
  let type: 'horizontal' | 'vertical' | 'diagonal_down' | 'diagonal_up';
  let label: string;

  if (isVertical) {
    const byRow = [...winningCells].sort((a, b) => a[0] - b[0]);
    start = byRow[0];
    end = byRow[byRow.length - 1];
    type = 'vertical';
    label = 'Straight Vertical 4-in-a-Row ↕️';
  } else {
    start = byCol[0];
    end = byCol[byCol.length - 1];
    if (start[0] === end[0]) {
      type = 'horizontal';
      label = 'Straight Horizontal 4-in-a-Row ↔️';
    } else if (start[0] < end[0]) {
      type = 'diagonal_down';
      label = 'Straight Diagonal 4-in-a-Row ↘️';
    } else {
      type = 'diagonal_up';
      label = 'Straight Diagonal 4-in-a-Row ↗️';
    }
  }

  // Calculate cell centers in percentages:
  // Col: (c + 0.5) / 7 * 100%
  // Row: (r + 0.5) / 6 * 100%
  const x1 = ((start[1] + 0.5) / 7) * 100;
  const y1 = ((start[0] + 0.5) / 6) * 100;
  const x2 = ((end[1] + 0.5) / 7) * 100;
  const y2 = ((end[0] + 0.5) / 6) * 100;

  // Extend line 3.8% past disc centers for a crisp full straight cut
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const ext = 3.8;
  const ux = dx / dist;
  const uy = dy / dist;

  return {
    type,
    label,
    startXPercent: Math.max(1, Math.min(99, x1 - ux * ext)),
    startYPercent: Math.max(1, Math.min(99, y1 - uy * ext)),
    endXPercent: Math.max(1, Math.min(99, x2 + ux * ext)),
    endYPercent: Math.max(1, Math.min(99, y2 + uy * ext)),
  };
}

interface Connect4GameModalProps {
  isOpen: boolean;
  gameId: string | null;
  currentUsername: string;
  onClose: () => void;
  onOpenLeaderboard?: () => void;
}

function Connect4GameModalContent({
  isOpen,
  gameId,
  currentUsername,
  onClose,
  onOpenLeaderboard,
}: Connect4GameModalProps) {
  const cleanCurrent = (currentUsername || '').toLowerCase().trim();

  const [session, setSession] = useState<Connect4Session | null>(null);
  const [board, setBoard] = useState<Connect4Board>(() =>
    Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))
  );
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState<boolean>(false);
  const [showCinematicWin, setShowCinematicWin] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Connect4Difficulty>('hard');

  const prevStatusRef = useRef<string | null>(null);
  const prevMoveCountRef = useRef<number>(0);
  const isDroppingRef = useRef<boolean>(false);
  const isBotThinkingRef = useRef<boolean>(false);
  const sessionRef = useRef<Connect4Session | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Sync difficulty from session
  useEffect(() => {
    if (session?.botDifficulty) {
      setSelectedDifficulty(session.botDifficulty);
    }
  }, [session?.botDifficulty]);

  const triggerError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  // Fetch Session data
  const fetchSession = useCallback(async () => {
    if (!gameId) return;
    if (isDroppingRef.current || isBotThinkingRef.current) return;

    try {
      const res = await fetch(
        `/api/games/connect4?gameId=${encodeURIComponent(gameId)}&username=${encodeURIComponent(cleanCurrent)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (data.success && data.session) {
        const s: Connect4Session = data.session;
        // Never roll back to older move count or overwrite in-flight client drop
        if (isDroppingRef.current || isBotThinkingRef.current) return;
        if (s.moveCount < prevMoveCountRef.current) return;

        setSession(s);
        setBoard(s.board);

        // Play drop sound if moves advanced from opponent
        if (s.moveCount > prevMoveCountRef.current) {
          if (soundEnabled && s.lastMove) {
            playConnect4DropSound(s.lastMove.row);
          }
          prevMoveCountRef.current = s.moveCount;
        }

        // Detect game completion for audio celebration without navigating away
        if (s.status === 'completed' && prevStatusRef.current !== 'completed') {
          if (soundEnabled) {
            if (s.winningCells) playConnect4LaserSound();
            if (s.winner === 'draw') {
              playConnect4TurnChime();
            } else if (s.winner?.toLowerCase().trim() === cleanCurrent) {
              playConnect4WinFanfare();
            } else {
              playConnect4DefeatSound();
            }
          }
          // DONT GO NEXT: Stay directly on the board so player can see the winning line!
        }
        prevStatusRef.current = s.status;
      }
    } catch (err) {
      console.warn('[Connect4Modal] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, cleanCurrent, soundEnabled]);

  useEffect(() => {
    if (!isOpen || !gameId) {
      setSession(null);
      setIsLoading(true);
      setShowCinematicWin(false);
      prevStatusRef.current = null;
      prevMoveCountRef.current = 0;
      isDroppingRef.current = false;
      isBotThinkingRef.current = false;
      setIsDropping(false);
      setIsBotThinking(false);
      return;
    }

    fetchSession();

    // BroadcastChannel sync
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('dpsbuzz_connect4_realtime');
        bc.onmessage = (ev) => {
          if (ev.data?.gameId === gameId) {
            fetchSession();
          }
        };
      }
    } catch {}

    const onCustomUpdate = (ev: Event) => {
      const customEv = ev as CustomEvent;
      if (!customEv.detail?.gameId || customEv.detail.gameId === gameId) {
        fetchSession();
      }
    };
    window.addEventListener('dpsbuzz_connect4_update', onCustomUpdate);

    // Fast Real-Time Polling interval: 600ms for multiplayer duels with friends; 10s idle ping for bot games
    const isBotGame = Boolean(
      sessionRef.current?.player2?.isBot ||
      sessionRef.current?.player2?.username.toLowerCase().trim() === 'buzzbot'
    );
    const pollInterval = isBotGame ? 10000 : 600;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (isDroppingRef.current || isBotThinkingRef.current) return;
      fetchSession();
    }, pollInterval);

    return () => {
      clearInterval(interval);
      window.removeEventListener('dpsbuzz_connect4_update', onCustomUpdate);
      if (bc) bc.close();
    };
  }, [isOpen, gameId, fetchSession]);

  const winningLineInfo = useMemo(() => {
    if (!session?.winningCells || session.status !== 'completed' || session.winningCells.length < 4) return null;
    return computeWinningLine(session.winningCells);
  }, [session?.winningCells, session?.status]);

  if (!isOpen) return null;

  const isPlayer1 = session?.player1.username.toLowerCase().trim() === cleanCurrent;
  const isPlayer2 = session?.player2.username.toLowerCase().trim() === cleanCurrent;
  const myColor: 'red' | 'yellow' = isPlayer1 ? 'red' : 'yellow';
  const myDisc: Connect4Disc = isPlayer1 ? 'p1' : 'p2';
  const oppColor: 'red' | 'yellow' = isPlayer1 ? 'yellow' : 'red';

  const isMyTurn = session?.status === 'in_progress' && session?.currentTurn.toLowerCase().trim() === cleanCurrent;
  const isGameOver = session?.status === 'completed';
  const isWinner = isGameOver && session?.winner?.toLowerCase().trim() === cleanCurrent;
  const isDraw = isGameOver && session?.winner === 'draw';
  const isBuzzBotWinner = Boolean(
    isGameOver &&
      !isDraw &&
      !isWinner &&
      (session?.winner?.toLowerCase().trim() === 'buzzbot' ||
        (session?.player2.isBot && session?.winner?.toLowerCase().trim() === session.player2.username.toLowerCase().trim()))
  );

  // Handle column drop
  const handleDropPiece = async (col: number) => {
    if (!session || session.status !== 'in_progress' || !isMyTurn || isDropping || isBotThinking) return;

    // Check if column is already full
    if (board[0][col] !== null) {
      triggerError('Column is full! Choose another column.');
      return;
    }

    // Find target row optimistically
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (board[r][col] === null) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) return;

    setIsDropping(true);
    isDroppingRef.current = true;

    // 0ms Optimistic UI Drop for human player
    if (soundEnabled) {
      playConnect4DropSound(targetRow);
    }

    const optimisticBoard = board.map((rowArr) => [...rowArr]);
    optimisticBoard[targetRow][col] = myDisc;
    setBoard(optimisticBoard);

    try {
      const res = await fetch('/api/games/connect4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'drop',
          gameId: session.gameId,
          username: cleanCurrent,
          col,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        const isBotGame = Boolean(
          session.player2.isBot || session.player2.username.toLowerCase().trim() === 'buzzbot'
        );

        if (isBotGame && data.botMove) {
          // Staged Bot Drop: Human move landed cleanly. Now BuzzBot deliberates for 550ms!
          setIsBotThinking(true);
          isBotThinkingRef.current = true;
          prevMoveCountRef.current = data.session.moveCount - 1;

          setTimeout(() => {
            if (soundEnabled && data.botMove) {
              playConnect4DropSound(data.botMove.row);
            }
            setBoard(data.session.board);
            setSession(data.session);
            prevMoveCountRef.current = data.session.moveCount;
            setIsBotThinking(false);
            isBotThinkingRef.current = false;
            setIsDropping(false);
            isDroppingRef.current = false;

            if (data.session.status === 'completed') {
              if (soundEnabled) {
                if (data.session.winningCells) playConnect4LaserSound();
                if (data.session.winner === 'draw') {
                  playConnect4TurnChime();
                } else if (data.session.winner?.toLowerCase().trim() === cleanCurrent) {
                  playConnect4WinFanfare();
                } else {
                  playConnect4DefeatSound();
                }
              }
            }
          }, 550);
        } else {
          // Human multiplayer match or immediate game-over move
          setSession(data.session);
          setBoard(data.session.board);
          prevMoveCountRef.current = data.session.moveCount;
          setIsDropping(false);
          isDroppingRef.current = false;

          // Broadcast to opponent
          try {
            if (typeof window !== 'undefined') {
              if ('BroadcastChannel' in window) {
                const bc = new BroadcastChannel('dpsbuzz_connect4_realtime');
                bc.postMessage({ gameId: session.gameId, action: 'drop', col });
                bc.close();
              }
              window.dispatchEvent(new CustomEvent('dpsbuzz_connect4_update', { detail: { gameId: session.gameId } }));
            }
          } catch {}

          if (data.session.status === 'completed') {
            if (soundEnabled) {
              if (data.session.winningCells) playConnect4LaserSound();
              if (data.session.winner === 'draw') {
                playConnect4TurnChime();
              } else if (data.session.winner?.toLowerCase().trim() === cleanCurrent) {
                playConnect4WinFanfare();
              } else {
                playConnect4DefeatSound();
              }
            }
            // DONT GO NEXT: stay directly on the board with the winning laser line visible!
          }
        }
      } else {
        // Rollback on server error
        setIsDropping(false);
        isDroppingRef.current = false;
        fetchSession();
        triggerError(data.error || 'Failed to place disc');
      }
    } catch {
      setIsDropping(false);
      isDroppingRef.current = false;
      fetchSession();
      triggerError('Network error dropping piece');
    }
  };

  // Forfeit / Resign
  const handleForfeit = async () => {
    if (!session || session.status !== 'in_progress') return;
    try {
      const res = await fetch('/api/games/connect4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forfeit',
          gameId: session.gameId,
          username: cleanCurrent,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setShowForfeitConfirm(false);
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('dpsbuzz_connect4_update', { detail: { gameId: session.gameId } }));
          }
        } catch {}
      }
    } catch {}
  };

  // Rematch
  const handleRematch = async (rematchDiff?: Connect4Difficulty) => {
    if (!session) return;
    const diffToUse = rematchDiff || selectedDifficulty || session.botDifficulty || 'hard';
    try {
      const res = await fetch('/api/games/connect4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rematch',
          gameId: session.gameId,
          username: cleanCurrent,
          difficulty: diffToUse,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setBoard(data.session.board);
        setShowCinematicWin(false);
        prevMoveCountRef.current = 0;
        prevStatusRef.current = 'in_progress';
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('dpsbuzz_connect4_update', { detail: { gameId: session.gameId } }));
          }
        } catch {}
      }
    } catch {}
  };

  // Change Difficulty dynamically for BuzzBot
  const handleSetDifficulty = async (diff: Connect4Difficulty) => {
    setSelectedDifficulty(diff);
    if (!session || !session.player2.isBot) return;
    try {
      const res = await fetch('/api/games/connect4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_difficulty',
          gameId: session.gameId,
          difficulty: diff,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
      }
    } catch {}
  };

  // Helper: check if a coordinate is one of the winning 4 pieces
  const isWinningCell = (r: number, c: number): boolean => {
    if (!session?.winningCells) return false;
    return session.winningCells.some(([wr, wc]) => wr === r && wc === c);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xl select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Connect 4 Game Arena"
    >
      {/* Background Ambience - DPS Buzz Brand Colors */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#833AB4]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#C13584]/20 blur-[120px] pointer-events-none" />

      {/* Main Apple Liquid Glass Modal Shell */}
      <div className="relative w-full max-w-[540px] max-h-[96vh] overflow-y-auto rounded-[28px] sm:rounded-[36px] bg-[#0A0D18]/96 border border-[#C13584]/30 p-4 sm:p-6 shadow-[0_30px_90px_rgba(193,53,132,0.3)] text-white space-y-4">
        {/* Specular Rim Light */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C13584]/60 to-transparent pointer-events-none" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#F77737] p-0.5 shadow-lg shadow-[#C13584]/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0D101D] rounded-[14px] flex items-center justify-center text-lg">
                🐝
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-tight bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] bg-clip-text text-transparent">
                  Connect 4 Duel
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C13584]/25 text-pink-300 font-extrabold border border-[#C13584]/40">
                  Arena
                </span>
              </div>
              <p className="text-[11px] text-slate-400">DPS Buzz Tactical Four-In-A-Row</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              type="button"
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
              title={soundEnabled ? 'Mute audio' : 'Enable audio'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-slate-500" />}
            </button>

            <button
              onClick={() => setShowRules(!showRules)}
              type="button"
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="How to play"
              title="How to play"
            >
              <HelpCircle size={16} />
            </button>

            <button
              onClick={() => {
                if (session && session.status === 'in_progress') {
                  setShowForfeitConfirm(true);
                } else {
                  onClose();
                }
              }}
              type="button"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close arena"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Rules Flyout */}
        {showRules && (
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span>📖 How to Play Connect 4</span>
              <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
              <li>Take turns dropping 1 disc into any of the 7 columns.</li>
              <li>The disc falls by gravity to the lowest available space in the column.</li>
              <li>First player to connect <strong>4 discs in a line</strong> (Horizontal, Vertical, or Diagonal) wins!</li>
              <li>Win awards <strong>+50 Arena Points</strong>; match completion awards <strong>+10 Points</strong>.</li>
            </ul>
          </div>
        )}

        {/* Scoreboard: Player 1 vs Player 2 */}
        {session && (
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            {/* Player 1 Card (Red) */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                session.currentTurn.toLowerCase().trim() === session.player1.username.toLowerCase().trim() &&
                session.status === 'in_progress'
                  ? 'bg-rose-500/15 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-white/[0.02] border-white/5 opacity-80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Connect4Disc3D color="red" size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate">
                      {isPlayer1 ? 'You' : `@${session.player1.username}`}
                    </span>
                    <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 font-semibold">RED</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{session.player1.fullName}</span>
                </div>
              </div>
            </div>

            {/* Player 2 Card (Yellow) */}
            <div
              className={`p-2.5 rounded-xl border transition-all ${
                session.currentTurn.toLowerCase().trim() === session.player2.username.toLowerCase().trim() &&
                session.status === 'in_progress'
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-white/[0.02] border-white/5 opacity-80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Connect4Disc3D color="yellow" size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate">
                      {isPlayer2 ? 'You' : session.player2.isBot ? 'BuzzBot 🤖' : `@${session.player2.username}`}
                    </span>
                    <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-semibold">
                      YELLOW
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{session.player2.fullName}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Turn Status Banner */}
        {session && (
          <div className="text-center py-1">
            {session.status === 'waiting_invite' ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold animate-pulse">
                <Clock size={14} />
                <span>Waiting for opponent to accept challenge...</span>
              </div>
            ) : session.status === 'in_progress' ? (
              isBotThinking ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>BuzzBot is thinking... 🤖</span>
                </div>
              ) : isMyTurn ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                  <ArrowDown size={14} className="animate-bounce" />
                  <span>YOUR TURN: Tap any column to drop your {myColor.toUpperCase()} disc!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-slate-300 text-xs font-medium">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    Opponent&apos;s turn ({session.currentTurn === 'buzzbot' ? 'BuzzBot thinking...' : `@${session.currentTurn}`})...
                  </span>
                </div>
              )
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md">
                <Trophy size={14} className="text-yellow-400" />
                <span>
                  {isDraw
                    ? 'Stalemate! Match Drawn 🤝'
                    : isWinner
                    ? 'Victory! You Won! 🏆'
                    : isBuzzBotWinner
                    ? 'BuzzBot Won The Match! 🤖'
                    : `@${session.winner} Won! 💥`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Victory Line Explanation Card: How It Won (Straight Laser Line Highlight) */}
        {isGameOver && !isDraw && winningLineInfo && (
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 shadow-lg animate-fade-in ${
              isBuzzBotWinner
                ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-yellow-500/20 border-amber-500/40 text-amber-200 shadow-amber-950/40'
                : isWinner
                ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 border-emerald-500/40 text-emerald-200 shadow-emerald-950/40'
                : 'bg-gradient-to-r from-rose-500/20 via-pink-500/15 to-purple-500/20 border-rose-500/40 text-rose-200 shadow-rose-950/40'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-md shrink-0 ${
                  isBuzzBotWinner
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-600'
                    : isWinner
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-600'
                    : 'bg-gradient-to-br from-rose-500 to-red-700'
                }`}
              >
                {isBuzzBotWinner ? '🤖' : isWinner ? '🏆' : '💥'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-white">
                    {isBuzzBotWinner
                      ? 'BuzzBot Won Straight Line:'
                      : isWinner
                      ? 'You Won Straight Line:'
                      : `@${session.winner} Won:`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-extrabold border border-white/20">
                    {winningLineInfo.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5 truncate">
                  {isBuzzBotWinner
                    ? 'BuzzBot formed a straight 4-disc connect (laser line drawn below)!'
                    : isWinner
                    ? 'You connected 4 discs in a straight line (laser line drawn below)!'
                    : 'A straight 4-disc line was connected (laser line drawn below)!'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end">
              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                4-IN-A-ROW
              </span>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {errorToast && (
          <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs text-center font-semibold animate-fade-in">
            {errorToast}
          </div>
        )}

        {/* CONNECT 4 PHYSICAL 3D BOARD */}
        <div className="flex flex-col items-center justify-center pt-1">
          {/* Top Column Drop Indicators */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 w-full max-w-[420px] mb-1 px-2">
            {Array.from({ length: 7 }).map((_, c) => {
              const isColHovered = hoveredCol === c;
              const isColFull = board[0][c] !== null;

              return (
                <button
                  key={`col-arrow-${c}`}
                  type="button"
                  onClick={() => handleDropPiece(c)}
                  onMouseEnter={() => !isBotThinking && setHoveredCol(c)}
                  onMouseLeave={() => setHoveredCol(null)}
                  disabled={!isMyTurn || isColFull || isDropping || isBotThinking}
                  className={`h-8 sm:h-10 rounded-t-lg flex items-center justify-center transition-all ${
                    isMyTurn && !isColFull && !isDropping && !isBotThinking
                      ? 'cursor-pointer hover:bg-white/10 active:scale-90'
                      : 'cursor-not-allowed opacity-30'
                  }`}
                  aria-label={`Drop piece in column ${c + 1}`}
                >
                  {isMyTurn && !isColFull && !isBotThinking && isColHovered ? (
                    <Connect4Disc3D color={myColor} size="sm" isFloating />
                  ) : isMyTurn && !isColFull && !isBotThinking ? (
                    <ArrowDown size={14} className="text-slate-400 hover:text-white" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Vertical Acrylic Board Frame - DPS Buzz Brand Casing */}
          <div className="relative w-full max-w-[420px] rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#1A122E] via-[#111425] to-[#0A0D18] border-2 border-[#C13584]/40 p-2.5 sm:p-3.5 shadow-[0_20px_60px_rgba(193,53,132,0.25)]">
            {/* Glossy Brand Reflection Bar */}
            <div className="absolute inset-x-4 top-1 h-1 rounded-full bg-gradient-to-r from-transparent via-[#C13584]/50 to-transparent pointer-events-none" />

            {/* 6 Rows x 7 Columns Grid */}
            <div className="relative grid grid-rows-6 gap-1.5 sm:gap-2">
              {/* Straight Laser Beam Winning Line Overlay */}
              {isGameOver && !isDraw && winningLineInfo && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <filter id="c4LaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="c4LaserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop
                        offset="30%"
                        stopColor={isBuzzBotWinner ? '#FFD700' : isWinner ? '#C13584' : '#F77737'}
                        stopOpacity="1"
                      />
                      <stop
                        offset="70%"
                        stopColor={isBuzzBotWinner ? '#F77737' : isWinner ? '#833AB4' : '#C13584'}
                        stopOpacity="1"
                      />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
                    </linearGradient>
                  </defs>

                  {/* Outer pulsing neon aura line */}
                  <line
                    x1={winningLineInfo.startXPercent}
                    y1={winningLineInfo.startYPercent}
                    x2={winningLineInfo.endXPercent}
                    y2={winningLineInfo.endYPercent}
                    stroke={isBuzzBotWinner ? '#FFD700' : isWinner ? '#C13584' : '#F77737'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.9"
                    filter="url(#c4LaserGlow)"
                    className="animate-pulse"
                  />

                  {/* Mid laser core beam */}
                  <line
                    x1={winningLineInfo.startXPercent}
                    y1={winningLineInfo.startYPercent}
                    x2={winningLineInfo.endXPercent}
                    y2={winningLineInfo.endYPercent}
                    stroke="url(#c4LaserGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* High-intensity white center beam */}
                  <line
                    x1={winningLineInfo.startXPercent}
                    y1={winningLineInfo.startYPercent}
                    x2={winningLineInfo.endXPercent}
                    y2={winningLineInfo.endYPercent}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Glowing vertex nodes at each of the 4 discs */}
                  {session?.winningCells?.map(([wr, wc], idx) => {
                    const cx = ((wc + 0.5) / 7) * 100;
                    const cy = ((wr + 0.5) / 6) * 100;
                    return (
                      <g key={idx}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="3.5"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="0.8"
                          filter="url(#c4LaserGlow)"
                          className="animate-ping"
                        />
                        <circle cx={cx} cy={cy} r="1.8" fill="#ffffff" />
                      </g>
                    );
                  })}
                </svg>
              )}

              {board.map((rowArr, r) => (
                <div key={`row-${r}`} className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {rowArr.map((cell, c) => {
                    const isWinning = isWinningCell(r, c);
                    const isColHovered = hoveredCol === c;

                    return (
                      <div
                        key={`cell-${r}-${c}`}
                        onClick={() => !isDropping && !isBotThinking && handleDropPiece(c)}
                        onMouseEnter={() => !isBotThinking && setHoveredCol(c)}
                        onMouseLeave={() => setHoveredCol(null)}
                        className={`aspect-square rounded-full flex items-center justify-center relative select-none transition-transform ${
                          !isMyTurn || isDropping || isBotThinking ? 'cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          cell === null
                            ? 'bg-[#04060B] shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] border border-white/5 hover:border-cyan-400/40'
                            : ''
                        } ${isMyTurn && !isBotThinking && cell === null && isColHovered ? 'bg-[#070C18]' : ''}`}
                      >
                        {cell === 'p1' && (
                          <Connect4Disc3D color="red" isWinning={isWinning} size="md" />
                        )}
                        {cell === 'p2' && (
                          <Connect4Disc3D color="yellow" isWinning={isWinning} size="md" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Board Base Stand (Legs) */}
            <div className="absolute -bottom-3 inset-x-6 h-3 bg-gradient-to-b from-blue-900/60 to-black rounded-b-xl border-x border-b border-blue-500/30 shadow-lg -z-10" />
          </div>
        </div>

        {/* ON-BOARD GAME-OVER BAR ("DONT GO NEXT" - REMAINS VISIBLE WITH THE BOARD AND LASER LINE) */}
        {isGameOver && session && (
          <div className="w-full max-w-[420px] mx-auto p-4 rounded-2xl bg-gradient-to-b from-[#141026] via-[#101322] to-[#0A0D18] border-2 border-[#C13584]/50 shadow-[0_12px_40px_rgba(193,53,132,0.25)] space-y-3.5 animate-fade-in">
            {/* Header: Winner & Winning Line Type */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {isDraw ? '🤝' : isWinner ? '🏆' : isBuzzBotWinner ? '🤖' : '💥'}
                </span>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    {isDraw
                      ? 'Match Drawn (Stalemate)'
                      : isWinner
                      ? 'Victory! You Won!'
                      : isBuzzBotWinner
                      ? 'BuzzBot Won The Match!'
                      : `@${session.winner} Won!`}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {isDraw
                      ? 'Board full without 4 connected'
                      : winningLineInfo
                      ? `Connected 4 discs in a ${winningLineInfo.label}!`
                      : 'Match completed'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-300 border border-amber-400/40">
                  {isWinner ? '+50 PTS' : isDraw ? '+20 PTS' : '+10 PTS'}
                </span>
              </div>
            </div>

            {/* If vs BuzzBot: 3 Difficulty Levels Switcher (Easy, Hard, Impossible) */}
            {session.player2.isBot && (
              <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-300 flex items-center gap-1">
                    <Shield size={12} className="text-purple-400" />
                    <span>Bot Difficulty:</span>
                  </span>
                  <span className="text-pink-300 uppercase font-extrabold text-[10px]">
                    {selectedDifficulty === 'easy'
                      ? '🟢 Easy (Casual)'
                      : selectedDifficulty === 'hard'
                      ? '🟡 Hard (Tactical)'
                      : '🟣 Impossible (Master)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'easy' as const, label: 'Easy', emoji: '🟢', sub: 'Human Wins' },
                      { id: 'hard' as const, label: 'Hard', emoji: '🟡', sub: 'Tough AI' },
                      { id: 'impossible' as const, label: 'Impossible', emoji: '🟣', sub: 'Minimax 5' },
                    ] as const
                  ).map((lvl) => {
                    const isSelected = selectedDifficulty === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => handleSetDifficulty(lvl.id)}
                        className={`py-1.5 px-1.5 rounded-lg text-center transition-all border cursor-pointer ${
                          isSelected
                            ? lvl.id === 'easy'
                              ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md ring-1 ring-emerald-400/50'
                              : lvl.id === 'hard'
                              ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/50'
                              : 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-md ring-1 ring-purple-400/50'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <p className="text-[11px] font-black flex items-center justify-center gap-1">
                          <span>{lvl.emoji}</span>
                          <span>{lvl.label}</span>
                        </p>
                        <p className="text-[9px] opacity-75">{lvl.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons: Play Again (Rematch) + View Summary */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleRematch()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] hover:opacity-95 active:scale-98 text-white text-xs font-black shadow-lg shadow-[#C13584]/35 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Play Again (Rematch) 🚀</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCinematicWin(true)}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View Fullscreen Cinematic Trophy Overlay"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Summary 🎬</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            onClick={() => setShowForfeitConfirm(true)}
            type="button"
            disabled={session?.status !== 'in_progress'}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Flag size={14} />
            <span>Resign Match</span>
          </button>

          {isGameOver && (
            <button
              onClick={() => setShowCinematicWin(true)}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles size={14} />
              <span>View Results 🎬</span>
            </button>
          )}

          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trophy size={14} className="text-amber-400" />
              <span>Rankings</span>
            </button>
          )}
        </div>
      </div>

      {/* Forfeit Confirmation Modal */}
      {showForfeitConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-[340px] rounded-2xl bg-[#0C101A] border border-white/20 p-5 space-y-4 text-center shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-xl">
              🏳️
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Leave Match Arena?</h4>
              <p className="text-xs text-slate-300 mt-1">
                You can minimize the game to view your chats and resume anytime, or resign the match (+50 PTS to opponent).
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setShowForfeitConfirm(false);
                  onClose();
                }}
                type="button"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-950/40"
              >
                Minimize Game (Keep Playing) 💬
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForfeitConfirm(false)}
                  type="button"
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer text-white transition-all"
                >
                  Stay Here
                </button>
                <button
                  onClick={handleForfeit}
                  type="button"
                  className="flex-1 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer shadow-lg shadow-rose-950/50 transition-all"
                >
                  Resign Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cinematic Game-Over Presentation */}
      {showCinematicWin && session && (
        <Connect4CinematicWinTransition
          winnerUsername={session.winner === 'draw' ? '' : session.winner || ''}
          winnerName={
            session.winner === 'draw'
              ? 'Draw'
              : session.winner?.toLowerCase().trim() === session.player1.username.toLowerCase().trim()
              ? session.player1.fullName
              : session.player2.fullName
          }
          isWinner={isWinner}
          isDraw={isDraw}
          winnerColor={session.winner === session.player1.username ? 'red' : 'yellow'}
          totalMoves={session.moveCount}
          pointsEarned={isWinner ? 50 : isDraw ? 20 : 10}
          onClose={() => {
            setShowCinematicWin(false);
            onClose();
          }}
          onRematch={handleRematch}
          winningLineLabel={winningLineInfo?.label}
          isBotWinner={isBuzzBotWinner}
        />
      )}
    </div>
  );
}

class Connect4GameErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn('[Connect4GameModal] Caught render error:', err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0B0E14] border border-[#1F293D] rounded-3xl p-6 text-center text-white space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-2xl mx-auto">
              🔴
            </div>
            <h3 className="text-sm font-bold text-white">Connect 4 Arena Reconnecting</h3>
            <p className="text-xs text-slate-400">
              The game encountered a brief display error. Click below to reconnect or return to chat.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] text-white text-xs font-bold cursor-pointer transition-all"
              >
                Reconnect
              </button>
              <button
                type="button"
                onClick={this.props.onClose}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Connect4GameModal(props: Connect4GameModalProps) {
  if (!props.isOpen) return null;
  return (
    <Connect4GameErrorBoundary onClose={props.onClose}>
      <Connect4GameModalContent {...props} />
    </Connect4GameErrorBoundary>
  );
}
