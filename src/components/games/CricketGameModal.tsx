'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Swords,
  Trophy,
  HelpCircle,
  Search,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  AlertTriangle,
  Send,
  Lock,
  Eye,
  EyeOff,
  Flame,
  Award,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react';
import {
  CRICKETERS,
  getCricketerById,
  searchCricketers,
  searchCricketersPaginated,
  SUGGESTED_QUESTIONS,
  Cricketer,
} from '@/data/cricketers';
import { CricketAvatar } from '@/components/games/CricketAvatar';
import type {
  CricketGameSession,
  AnswerType,
  TimelineItem,
} from '@/types/cricketGame';

interface CricketGameModalProps {
  isOpen: boolean;
  gameId: string | null;
  currentUsername: string;
  onClose: () => void;
  onOpenLeaderboard?: (tab?: 'leaderboard' | 'history' | 'rules') => void;
}

// Simple Web Audio API sound synthesizer
function playSound(type: 'click' | 'question' | 'answer' | 'win' | 'wrong') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'question') {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'answer') {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.36); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

// Canvas Confetti component
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.offsetWidth);
    const height = (canvas.height = canvas.offsetHeight);

    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#fbbf24'];
    const particles = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
    }));

    let frameCount = 0;
    const maxFrames = 260; // ~4.3 seconds at 60fps

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      const opacity = frameCount > 200 ? Math.max(0, (maxFrames - frameCount) / 60) : 1;
      ctx.globalAlpha = opacity;

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();

        if (p.y > height && frameCount < 180) {
          p.y = -20;
          p.x = Math.random() * width;
        }
      });

      if (frameCount < maxFrames) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30 w-full h-full"
    />
  );
}

export function CricketGameModal({
  isOpen,
  gameId,
  currentUsername,
  onClose,
  onOpenLeaderboard,
}: CricketGameModalProps) {
  const [session, setSession] = useState<CricketGameSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selection stage states
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorRole, setSelectorRole] = useState('All');
  const [selectorCountry, setSelectorCountry] = useState('All');
  const [selectorPage, setSelectorPage] = useState(1);
  const [selectedCricketerId, setSelectedCricketerId] = useState<string | null>(null);
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false);

  // Gameplay turn states
  const [gameplayTab, setGameplayTab] = useState<'question' | 'guess'>('question');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [customQuestion, setCustomQuestion] = useState('');
  const [guessSearch, setGuessSearch] = useState('');
  const [selectedGuessId, setSelectedGuessId] = useState<string | null>(null);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [showMySecretDetails, setShowMySecretDetails] = useState(false);

  const timelineEndRef = useRef<HTMLDivElement | null>(null);
  const prevTurnRef = useRef<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const sessionRef = useRef<CricketGameSession | null>(null);
  sessionRef.current = session;

  const cleanUser = currentUsername.toLowerCase().trim();

  // Polling game session
  const fetchSession = async (silent = false) => {
    if (!gameId) return;
    if (!silent) setIsLoading(true);

    try {
      const res = await fetch(`/api/games/cricket?gameId=${encodeURIComponent(gameId)}&username=${encodeURIComponent(cleanUser)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setErrorMsg(null);

        // Sound triggers on state transitions
        if (prevStatusRef.current && prevStatusRef.current !== data.session.status) {
          if (data.session.status === 'completed') {
            playSound('win');
          }
        }
        if (prevTurnRef.current && prevTurnRef.current !== data.session.currentTurn && data.session.currentTurn === cleanUser) {
          playSound('click');
        }
        prevStatusRef.current = data.session.status;
        prevTurnRef.current = data.session.currentTurn;
      } else {
        if (!silent) setErrorMsg(data.error || 'Failed to load game');
      }
    } catch (err: any) {
      if (!silent) setErrorMsg('Network error connecting to game session');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !gameId) {
      setSession(null);
      return;
    }

    fetchSession(false);

    // Poll every 1.5s for live multiplayer state synchronization while match is active
    const timer = setInterval(() => {
      if (sessionRef.current?.status === 'completed' || sessionRef.current?.status === 'abandoned' || sessionRef.current?.status === 'declined') {
        return;
      }
      fetchSession(true);
    }, 1500);

    return () => clearInterval(timer);
  }, [isOpen, gameId, cleanUser]);

  // Auto-scroll timeline to bottom on update
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.timeline?.length]);

  if (!isOpen) return null;

  // Derive players
  const isPlayer1 = session?.player1.username.toLowerCase().trim() === cleanUser;
  const isPlayer2 = session?.player2.username.toLowerCase().trim() === cleanUser;
  const me = isPlayer1 ? session?.player1 : session?.player2;
  const opponent = isPlayer1 ? session?.player2 : session?.player1;

  const isMyTurn = session?.status === 'in_progress' && session?.currentTurn.toLowerCase().trim() === cleanUser;
  const isAwaitingAnswer = session?.turnState === 'awaiting_answer';
  const amITheAnswerer = isAwaitingAnswer && session?.activeQuestion?.askedBy.toLowerCase().trim() !== cleanUser;

  // My chosen cricketer (if selected)
  const mySecretCricketer = me?.selectedCricketerId ? getCricketerById(me.selectedCricketerId) : null;

  // Filtered lists for selector
  const paginatedSelector = useMemo(() => {
    return searchCricketersPaginated(selectorSearch, selectorRole, selectorCountry, selectorPage, 18);
  }, [selectorSearch, selectorRole, selectorCountry, selectorPage]);
  const guessCricketers = searchCricketers(guessSearch);

  // --- ACTIONS ---

  const handleSelectCricketer = async () => {
    if (!gameId || !selectedCricketerId) return;
    setIsSubmittingSelection(true);
    playSound('click');

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select_cricketer',
          gameId,
          username: cleanUser,
          cricketerId: selectedCricketerId,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setSelectedCricketerId(null);
      } else {
        alert(data.error || 'Failed to select cricketer');
      }
    } catch {
      alert('Network error submitting cricketer selection');
    } finally {
      setIsSubmittingSelection(false);
    }
  };

  const handleAskQuestion = async (text: string) => {
    if (!gameId || !text.trim() || isSubmittingTurn) return;
    setIsSubmittingTurn(true);
    playSound('question');

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask_question',
          gameId,
          username: cleanUser,
          questionText: text.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setCustomQuestion('');
      } else {
        alert(data.error || 'Failed to ask question');
      }
    } catch {
      alert('Network error sending question');
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const handleAnswerQuestion = async (answer: AnswerType) => {
    if (!gameId || isSubmittingTurn) return;
    setIsSubmittingTurn(true);
    playSound('answer');

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer_question',
          gameId,
          username: cleanUser,
          answer,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
      } else {
        alert(data.error || 'Failed to answer question');
      }
    } catch {
      alert('Network error submitting answer');
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const handleMakeGuess = async () => {
    if (!gameId || !selectedGuessId || isSubmittingTurn) return;
    setIsSubmittingTurn(true);

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'guess',
          gameId,
          username: cleanUser,
          cricketerId: selectedGuessId,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setSelectedGuessId(null);
        if (data.isCorrect) {
          playSound('win');
        } else {
          playSound('wrong');
        }
      } else {
        alert(data.error || 'Failed to submit guess');
      }
    } catch {
      alert('Network error submitting guess');
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const handleRematch = async () => {
    if (!gameId) return;
    setIsLoading(true);
    playSound('click');

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rematch',
          gameId,
          username: cleanUser,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setSelectedCricketerId(null);
        setSelectedGuessId(null);
      } else {
        alert(data.error || 'Failed to restart match');
      }
    } catch {
      alert('Network error requesting rematch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Guess the Cricketer Game Arena"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-pink-600/15 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-purple-600/15 blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-2xl bg-[#0c0914] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-white">
        {/* Victory Confetti overlay */}
        {session?.status === 'completed' && <ConfettiCanvas />}

        {/* TOP BAR */}
        <div className="p-3.5 sm:px-5 sm:py-3.5 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-purple-950/80 border-b border-purple-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-base">
              🏏
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  Guess the Cricketer
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                  DPSBuzz Arena
                </span>
              </div>
              <p className="text-[11px] text-purple-200/70 font-medium">
                {session?.status === 'selecting' && 'Lobby: Secret Cricketer Selection'}
                {session?.status === 'in_progress' && (isMyTurn ? '🎯 Your Turn to Act' : '⏳ Opponent is Thinking...')}
                {session?.status === 'completed' && '🏆 Match Concluded'}
                {session?.status === 'waiting_invite' && 'Challenging opponent...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={() => onOpenLeaderboard('leaderboard')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 hover:text-amber-200 border border-amber-500/20 transition-all cursor-pointer"
                title="View Leaderboard"
              >
                <Trophy size={17} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer"
              aria-label="Back to Chat"
              title="Back to Chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* LOADING & ERROR STATES */}
        {isLoading && !session && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <div className="w-10 h-10 border-3 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-xs text-purple-300/80 font-medium animate-pulse">
              Connecting to cricket arena...
            </p>
          </div>
        )}

        {errorMsg && !session && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <AlertTriangle size={36} className="text-amber-400" />
            <p className="text-sm text-red-200 font-semibold">{errorMsg}</p>
            <button
              type="button"
              onClick={() => fetchSession(false)}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {session && (
          <>
            {/* SCOREBOARD BANNER (Visible in all non-invite states) */}
            {session.status !== 'waiting_invite' && session.status !== 'declined' && (
              <div className="px-3 py-2.5 sm:px-5 sm:py-3 bg-purple-950/40 border-b border-purple-500/20 shrink-0">
                <div className="grid grid-cols-7 items-center gap-1">
                  {/* Left: You */}
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-pink-500/40">
                      {me?.fullName?.charAt(0) || 'Y'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate text-white">
                          You ({me?.username})
                        </span>
                        {isMyTurn && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-purple-200/70">
                        <span className="text-pink-300 font-semibold">{me?.score || 0} pts</span>
                        <span>•</span>
                        <span>
                          {me?.correctGuesses || 0}W / {me?.incorrectGuesses || 0}L
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Turn Status Badge */}
                  <div className="col-span-1 text-center">
                    <div className="inline-flex flex-col items-center justify-center">
                      <span className="text-[11px] font-black text-amber-400 tracking-wider">
                        VS
                      </span>
                    </div>
                  </div>

                  {/* Right: Opponent */}
                  <div className="col-span-3 flex items-center justify-end gap-2 min-w-0 text-right">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isMyTurn && session.status === 'in_progress' && (
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                        )}
                        <span className="text-xs font-bold truncate text-white">
                          @{opponent?.username}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-2 text-[10px] text-purple-200/70">
                        <span>
                          {opponent?.correctGuesses || 0}W / {opponent?.incorrectGuesses || 0}L
                        </span>
                        <span>•</span>
                        <span className="text-purple-300 font-semibold">{opponent?.score || 0} pts</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-800 flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-indigo-500/40">
                      {opponent?.fullName?.charAt(0) || 'O'}
                    </div>
                  </div>
                </div>

                {/* Sub-strip: My Secret Preview Reminder */}
                {session.status === 'in_progress' && mySecretCricketer && (
                  <div className="mt-2 pt-2 border-t border-purple-500/10 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-purple-200/90 font-medium">
                      <CricketAvatar cricketer={mySecretCricketer} size="xs" />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Lock size={12} className="text-emerald-400" />
                        <span>Your Secret:</span>
                        <strong className="text-emerald-300 font-bold">
                          {mySecretCricketer.name} ({mySecretCricketer.iplTeam}, #{mySecretCricketer.jerseyNumber})
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMySecretDetails(!showMySecretDetails)}
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                    >
                      {showMySecretDetails ? <EyeOff size={11} /> : <Eye size={11} />}
                      <span>{showMySecretDetails ? 'Hide Details' : 'View Clues'}</span>
                    </button>
                  </div>
                )}

                {/* Secret facts expansion */}
                {showMySecretDetails && mySecretCricketer && (
                  <div className="mt-2 p-2.5 rounded-xl bg-purple-900/30 border border-purple-500/20 text-[11px] text-purple-200 space-y-1 animate-fade-in">
                    <p>
                      <strong>Role:</strong> {mySecretCricketer.role} ({mySecretCricketer.battingStyle},{' '}
                      {mySecretCricketer.bowlingStyle})
                    </p>
                    <p>
                      <strong>World Cup Winner:</strong> {mySecretCricketer.worldCupWinner ? 'Yes 🏆' : 'No'} |{' '}
                      <strong>Era:</strong> {mySecretCricketer.era}
                    </p>
                    <p className="text-purple-300/80 italic">
                      💡 {mySecretCricketer.hint}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 1: SECRET CRICKETER SELECTION */}
            {session.status === 'selecting' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Status prompt */}
                {me?.hasSelected ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-xl">
                      🔒
                    </div>
                    <h3 className="text-base font-bold text-emerald-300">
                      Your Secret Cricketer is Locked!
                    </h3>
                    <p className="text-xs text-emerald-200/80 max-w-md mx-auto">
                      Waiting for <strong className="text-white">@{opponent?.username}</strong> to secretly choose their cricketer. The deduction arena starts automatically once both are ready!
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Waiting for opponent...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/50 to-purple-950/50 border border-pink-500/30">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Pick Your Secret Cricketer</span>
                        <Lock size={14} className="text-pink-400" />
                      </h3>
                      <p className="text-xs text-purple-200/80 mt-1">
                        Select a cricketer that your opponent must deduce by asking Yes/No questions. Keep it a secret!
                      </p>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="space-y-2.5">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400"
                        />
                        <input
                          type="text"
                          value={selectorSearch}
                          onChange={(e) => {
                            setSelectorSearch(e.target.value);
                            setSelectorPage(1);
                          }}
                          placeholder="Search 200+ cricketers by name, country, IPL team, role, jersey #..."
                          className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs sm:text-sm text-white placeholder-purple-300/40 focus:outline-none focus:border-pink-500"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {selectorSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectorSearch('');
                                setSelectorPage(1);
                              }}
                              className="text-white/50 hover:text-white p-0.5"
                            >
                              <X size={14} />
                            </button>
                          )}
                          <span className="text-[10px] font-semibold text-purple-300/70 bg-purple-900/40 px-2 py-0.5 rounded-md border border-purple-500/20">
                            {paginatedSelector.total}
                          </span>
                        </div>
                      </div>

                      {/* Role Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider shrink-0 mr-0.5">
                          Role:
                        </span>
                        {['All', 'Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'].map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              setSelectorRole(role);
                              setSelectorPage(1);
                            }}
                            className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                              selectorRole === role
                                ? 'bg-pink-600 text-white shadow-xs'
                                : 'bg-white/5 hover:bg-white/10 text-purple-200/70'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>

                      {/* Country Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider shrink-0 mr-0.5">
                          Country:
                        </span>
                        {[
                          'All',
                          'India',
                          'Australia',
                          'England',
                          'South Africa',
                          'West Indies',
                          'New Zealand',
                          'Pakistan',
                          'Sri Lanka',
                          'Afghanistan',
                          'Bangladesh',
                        ].map((country) => (
                          <button
                            key={country}
                            type="button"
                            onClick={() => {
                              setSelectorCountry(country);
                              setSelectorPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                              selectorCountry === country
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white/5 hover:bg-white/10 text-purple-200/70'
                            }`}
                          >
                            {country}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cricketer Grid with lazy avatars and attribution */}
                    {paginatedSelector.items.length === 0 ? (
                      <div className="p-8 text-center text-xs text-purple-300/60 rounded-2xl bg-purple-950/20 border border-purple-500/10">
                        No cricketers found matching &ldquo;{selectorSearch}&rdquo;. Try another filter or search term.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                        {paginatedSelector.items.map((c) => {
                          const isSelected = selectedCricketerId === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCricketerId(c.id)}
                              className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-pink-900/80 to-purple-900/80 border-pink-400 shadow-md ring-2 ring-pink-500/50'
                                  : 'bg-purple-950/20 hover:bg-purple-950/50 border-purple-500/15'
                              }`}
                            >
                              <CricketAvatar cricketer={c} size="md" showAttribution />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs font-bold text-white truncate">
                                    {c.name}
                                  </h4>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-pink-300 shrink-0">
                                    #{c.jerseyNumber}
                                  </span>
                                </div>
                                <p className="text-[10px] text-purple-200/80 truncate">
                                  {c.role} • {c.country}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-purple-300/70">
                                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 font-semibold truncate max-w-[85px]">
                                    {c.iplTeam}
                                  </span>
                                  <span className="truncate">{c.era}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {paginatedSelector.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-1 px-1 text-xs">
                        <button
                          type="button"
                          disabled={paginatedSelector.currentPage <= 1}
                          onClick={() => setSelectorPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 disabled:opacity-30 disabled:cursor-not-allowed border border-purple-500/20 text-white font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <ChevronLeft size={14} />
                          <span>Prev</span>
                        </button>

                        <span className="text-[11px] font-medium text-purple-300">
                          Page <strong className="text-white font-bold">{paginatedSelector.currentPage}</strong> of{' '}
                          <strong className="text-white font-bold">{paginatedSelector.totalPages}</strong>{' '}
                          <span className="text-purple-400">({paginatedSelector.total} players)</span>
                        </span>

                        <button
                          type="button"
                          disabled={paginatedSelector.currentPage >= paginatedSelector.totalPages}
                          onClick={() => setSelectorPage((p) => Math.min(paginatedSelector.totalPages, p + 1))}
                          className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 disabled:opacity-30 disabled:cursor-not-allowed border border-purple-500/20 text-white font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}

                    {/* Lock in Button Bar */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={!selectedCricketerId || isSubmittingSelection}
                        onClick={handleSelectCricketer}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <Lock size={16} />
                        <span>
                          {selectedCricketerId
                            ? `Lock in ${getCricketerById(selectedCricketerId)?.name || 'Selection'} 🔒`
                            : 'Select a Cricketer Above'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 2: ACTIVE DEDUCTION ARENA (IN PROGRESS) */}
            {session.status === 'in_progress' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* 1. TIMELINE & DEDUCTION LOG */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400/80 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/20">
                      Match Deduction Feed
                    </span>
                  </div>

                  {session.timeline.map((item: TimelineItem) => {
                    const isSystem = item.type === 'system';
                    const isGuess = item.type === 'guess';
                    const isQuestion = item.type === 'question';
                    const isFromMe = item.by.toLowerCase().trim() === cleanUser;

                    if (isSystem) {
                      return (
                        <div
                          key={item.id}
                          className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/15 text-center text-[11px] text-purple-200/80 font-medium"
                        >
                          {item.questionText}
                        </div>
                      );
                    }

                    if (isGuess) {
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border text-xs ${
                            item.isCorrect
                              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-100'
                              : 'bg-rose-950/60 border-rose-500/30 text-rose-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold flex items-center gap-1.5">
                              <span>{item.isCorrect ? '🏆 Correct Guess!' : '❌ Incorrect Guess'}</span>
                              <span className="text-[10px] text-white/70">by @{item.by}</span>
                            </span>
                            <span className="text-[10px] opacity-75">
                              {item.isCorrect ? '+50 pts' : '-5 pts'}
                            </span>
                          </div>
                          <p className="text-xs">
                            Guessed: <strong className="font-extrabold">{item.cricketerName}</strong>
                            {!item.isCorrect && ' (Opponent secret remains safe!)'}
                          </p>
                        </div>
                      );
                    }

                    if (isQuestion) {
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border text-xs max-w-[88%] ${
                            isFromMe
                              ? 'ml-auto bg-gradient-to-r from-pink-950/60 to-purple-950/60 border-pink-500/30 text-purple-100'
                              : 'mr-auto bg-slate-900/80 border-purple-500/20 text-purple-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-pink-300">
                              {isFromMe ? 'You asked:' : `@${item.by} asked:`}
                            </span>
                            {item.answer && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  item.answer === 'yes'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : item.answer === 'no'
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                    : item.answer === 'partially'
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-slate-700/50 text-slate-300 border-slate-600'
                                }`}
                              >
                                {item.answer === 'yes' && '✅ Yes'}
                                {item.answer === 'no' && '❌ No'}
                                {item.answer === 'partially' && '⚠️ Partially'}
                                {item.answer === 'cant_say' && "🤷 Can't Say"}
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-white text-[12px] leading-relaxed">
                            {item.questionText}
                          </p>
                        </div>
                      );
                    }

                    return null;
                  })}
                  <div ref={timelineEndRef} />
                </div>

                {/* 2. INTERACTION CONTROLS */}
                <div className="p-3 sm:p-4 bg-purple-950/40 border-t border-purple-500/20 shrink-0 space-y-3">
                  {/* Case A: Answer prompt (when opponent asked a question and waiting for my answer) */}
                  {amITheAnswerer && session.activeQuestion && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/90 to-purple-950/90 border border-indigo-500/40 space-y-2.5 animate-slide-up">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <HelpCircle size={15} />
                          <span>@{session.activeQuestion.askedBy} asks you:</span>
                        </span>
                        <span className="text-[10px] text-purple-300/80">Respond honestly</span>
                      </div>
                      <p className="text-sm font-bold text-white bg-black/30 p-2.5 rounded-xl border border-white/10">
                        &ldquo;{session.activeQuestion.questionText}&rdquo;
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isSubmittingTurn}
                          onClick={() => handleAnswerQuestion('yes')}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Yes</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingTurn}
                          onClick={() => handleAnswerQuestion('no')}
                          className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X size={14} />
                          <span>No</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingTurn}
                          onClick={() => handleAnswerQuestion('partially')}
                          className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Partially</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingTurn}
                          onClick={() => handleAnswerQuestion('cant_say')}
                          className="py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Can&apos;t Say</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Case B: Waiting for opponent to answer */}
                  {isAwaitingAnswer && !amITheAnswerer && (
                    <div className="p-3.5 rounded-2xl bg-purple-900/30 border border-purple-500/20 text-center space-y-2">
                      <div className="inline-flex items-center gap-2 text-xs text-purple-200 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
                        <span>Waiting for @{opponent?.username} to answer:</span>
                      </div>
                      <p className="text-xs text-white/90 italic bg-black/20 p-2 rounded-xl">
                        &ldquo;{session.activeQuestion?.questionText}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Case C: My turn to ask or guess */}
                  {isMyTurn && !isAwaitingAnswer && (
                    <div className="space-y-2.5">
                      {/* Tabs: Ask Question vs Guess Cricketer */}
                      <div className="flex p-1 rounded-xl bg-purple-950/50 border border-purple-500/20">
                        <button
                          type="button"
                          onClick={() => setGameplayTab('question')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            gameplayTab === 'question'
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xs'
                              : 'text-purple-300 hover:text-white'
                          }`}
                        >
                          <HelpCircle size={14} />
                          <span>Ask a Question</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGameplayTab('guess')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            gameplayTab === 'guess'
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xs'
                              : 'text-purple-300 hover:text-white'
                          }`}
                        >
                          <Trophy size={14} />
                          <span>Make a Guess (Win!)</span>
                        </button>
                      </div>

                      {/* Tab 1: Ask Question Controls */}
                      {gameplayTab === 'question' && (
                        <div className="space-y-2">
                          {/* Category chips */}
                          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                            {SUGGESTED_QUESTIONS.map((cat, idx) => (
                              <button
                                key={cat.category}
                                type="button"
                                onClick={() => setActiveCategoryIndex(idx)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                                  activeCategoryIndex === idx
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-purple-300/80'
                                }`}
                              >
                                {cat.icon} {cat.category}
                              </button>
                            ))}
                          </div>

                          {/* Quick tap suggested questions */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {SUGGESTED_QUESTIONS[activeCategoryIndex]?.questions.map((q) => (
                              <button
                                key={q}
                                type="button"
                                disabled={isSubmittingTurn}
                                onClick={() => handleAskQuestion(q)}
                                className="p-2 text-left rounded-xl bg-purple-950/30 hover:bg-pink-900/30 border border-purple-500/15 hover:border-pink-500/30 text-[11px] text-purple-200 hover:text-white font-medium transition-all active:scale-98 cursor-pointer truncate"
                              >
                                {q}
                              </button>
                            ))}
                          </div>

                          {/* Custom Question Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={customQuestion}
                              onChange={(e) => setCustomQuestion(e.target.value)}
                              placeholder="Or type custom Yes/No question..."
                              className="flex-1 px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAskQuestion(customQuestion);
                                }
                              }}
                            />
                            <button
                              type="button"
                              disabled={!customQuestion.trim() || isSubmittingTurn}
                              onClick={() => handleAskQuestion(customQuestion)}
                              className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Send size={13} />
                              <span>Ask</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Make Final Guess Controls */}
                      {gameplayTab === 'guess' && (
                        <div className="space-y-2">
                          <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                            <span>
                              Guessing correctly instantly wins the match! Wrong guess carries a penalty.
                            </span>
                          </div>

                          <div className="relative">
                            <Search
                              size={14}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400"
                            />
                            <input
                              type="text"
                              value={guessSearch}
                              onChange={(e) => setGuessSearch(e.target.value)}
                              placeholder="Search cricketer to guess..."
                              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
                            {guessCricketers.map((c) => {
                              const isSelected = selectedGuessId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setSelectedGuessId(c.id)}
                                  className={`p-1.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                                    isSelected
                                      ? 'bg-amber-600/40 border-amber-400 text-white shadow-xs'
                                      : 'bg-purple-950/20 hover:bg-purple-950/40 border-purple-500/15 text-purple-200'
                                  }`}
                                >
                                  <CricketAvatar cricketer={c} size="xs" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold truncate">{c.name}</p>
                                    <p className="text-[9px] text-purple-300/70 truncate">
                                      {c.iplTeam} • #{c.jerseyNumber}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            disabled={!selectedGuessId || isSubmittingTurn}
                            onClick={handleMakeGuess}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-amber-900/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Trophy size={14} />
                            <span>
                              {selectedGuessId
                                ? `Lock in Guess: ${getCricketerById(selectedGuessId)?.name}`
                                : 'Select Cricketer to Guess'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case D: Opponent's turn to ask or guess */}
                  {!isMyTurn && !isAwaitingAnswer && (
                    <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-center space-y-1.5">
                      <div className="inline-flex items-center gap-2 text-xs text-purple-200 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                        <span>@{opponent?.username} is contemplating their next move...</span>
                      </div>
                      <p className="text-[11px] text-purple-300/70">
                        They can ask a Yes/No question or attempt a match-winning guess.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 3: GAME COMPLETED / VICTORY ARENA */}
            {session.status === 'completed' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-center">
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 p-0.5 mx-auto shadow-xl shadow-amber-900/30">
                    <div className="w-full h-full rounded-full bg-[#0c0914] flex items-center justify-center text-3xl">
                      🏆
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400">
                    {session.winner?.toLowerCase().trim() === cleanUser
                      ? 'Congratulations! You Won! 🏅'
                      : `@${session.winner} Won the Match!`}
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-200/90 font-medium max-w-md mx-auto">
                    Winning deduction:{' '}
                    <strong className="text-amber-300 font-bold">{session.winningGuess}</strong>
                  </p>
                </div>

                {/* Secret Cricketers Revealed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                  {/* Player 1 Secret */}
                  {session.revealedPlayer1Cricketer && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/70 to-indigo-950/70 border border-purple-500/30 space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="text-[10px] text-purple-300 uppercase tracking-wider font-bold">
                          @{session.player1.username}&apos;s Secret
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-pink-300 font-bold">
                          #{session.revealedPlayer1Cricketer.jerseyNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <CricketAvatar
                          cricketer={session.revealedPlayer1Cricketer}
                          size="xl"
                          showAttribution
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-sm font-extrabold text-white truncate">
                            {session.revealedPlayer1Cricketer.name}
                          </h4>
                          <p className="text-xs text-purple-200/90 truncate">
                            {session.revealedPlayer1Cricketer.role} • {session.revealedPlayer1Cricketer.country}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 font-semibold">
                              {session.revealedPlayer1Cricketer.iplTeam}
                            </span>
                            <span className="text-purple-300/80">
                              {session.revealedPlayer1Cricketer.era}
                            </span>
                            {session.revealedPlayer1Cricketer.worldCupWinner && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                                🏆 WC Winner
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-purple-200/80 italic bg-black/20 p-2 rounded-xl border border-white/5">
                        &ldquo;{session.revealedPlayer1Cricketer.hint}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Player 2 Secret */}
                  {session.revealedPlayer2Cricketer && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/70 to-pink-950/70 border border-pink-500/30 space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="text-[10px] text-pink-300 uppercase tracking-wider font-bold">
                          @{session.player2.username}&apos;s Secret
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-pink-300 font-bold">
                          #{session.revealedPlayer2Cricketer.jerseyNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <CricketAvatar
                          cricketer={session.revealedPlayer2Cricketer}
                          size="xl"
                          showAttribution
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-sm font-extrabold text-white truncate">
                            {session.revealedPlayer2Cricketer.name}
                          </h4>
                          <p className="text-xs text-purple-200/90 truncate">
                            {session.revealedPlayer2Cricketer.role} • {session.revealedPlayer2Cricketer.country}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-200 font-semibold">
                              {session.revealedPlayer2Cricketer.iplTeam}
                            </span>
                            <span className="text-purple-300/80">
                              {session.revealedPlayer2Cricketer.era}
                            </span>
                            {session.revealedPlayer2Cricketer.worldCupWinner && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                                🏆 WC Winner
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-purple-200/80 italic bg-black/20 p-2 rounded-xl border border-white/5">
                        &ldquo;{session.revealedPlayer2Cricketer.hint}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Post-Game Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleRematch}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-pink-900/40 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                  >
                    <RotateCcw size={16} />
                    <span>Play Again / Rematch</span>
                  </button>

                  {onOpenLeaderboard && (
                    <button
                      type="button"
                      onClick={() => onOpenLeaderboard('leaderboard')}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 text-xs sm:text-sm font-bold border border-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Trophy size={16} />
                      <span>Leaderboard</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    Back to Chat
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
