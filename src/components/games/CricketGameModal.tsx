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
  Heart,
  UserX,
} from 'lucide-react';
import {
  CRICKETERS,
  getCricketerById,
  searchCricketers,
  searchCricketersPaginated,
  SUGGESTED_QUESTIONS,
  isCricketerInLobby,
  Cricketer,
} from '@/data/cricketers';
import { CricketAvatar } from '@/components/games/CricketAvatar';
import { CricketBall3D, CricketBat3D, Trophy3D, GameOver3DSmashTransition } from './Cricket3DObjects';
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

// Popular cricketers for quick 1-tap option answers in the Guess Tab
const POPULAR_OPTION_CRICKETERS = [
  'virat-kohli',
  'rohit-sharma',
  'ms-dhoni',
  'jasprit-bumrah',
  'shubman-gill',
  'hardik-pandya',
  'ravindra-jadeja',
  'kl-rahul',
  'suryakumar-yadav',
  'sachin-tendulkar',
  'rishabh-pant',
  'mohammed-shami',
];

// Reusable high-performance AudioContext singleton to prevent thread hangs
let sharedCricketAudioCtx: AudioContext | null = null;
function getCricketAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCricketAudioCtx || sharedCricketAudioCtx.state === 'closed') {
    sharedCricketAudioCtx = new AudioCtx();
  }
  if (sharedCricketAudioCtx.state === 'suspended') {
    sharedCricketAudioCtx.resume().catch(() => {});
  }
  return sharedCricketAudioCtx;
}

// Simple Web Audio API sound synthesizer (0ms latency, zero thread lock)
function playSound(type: 'click' | 'question' | 'answer' | 'win' | 'wrong' | 'heart_loss') {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getCricketAudioContext();
    if (!ctx) return;
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
    } else if (type === 'wrong' || type === 'heart_loss') {
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

    const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#fbbf24', '#60a5fa', '#f43f5e'];
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

function CricketGameModalContent({
  isOpen,
  gameId,
  currentUsername,
  onClose,
  onOpenLeaderboard,
}: CricketGameModalProps) {
  const [session, setSession] = useState<CricketGameSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quit / Forfeit confirmation state
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);
  const [isForfeiting, setIsForfeiting] = useState<boolean>(false);
  const [showGameOverSmash, setShowGameOverSmash] = useState<boolean>(false);
  const hasTriggeredSmashRef = useRef<boolean>(false);

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

  // Trigger 3D smash & thriller transition when game concludes
  useEffect(() => {
    if (session?.status === 'completed') {
      if (!hasTriggeredSmashRef.current) {
        hasTriggeredSmashRef.current = true;
        setShowGameOverSmash(true);
      }
    } else {
      hasTriggeredSmashRef.current = false;
      setShowGameOverSmash(false);
    }
  }, [session?.status]);

  const cleanUser = (currentUsername || '').toLowerCase().trim();

  // Instant notification to other clients/tabs via BroadcastChannel & window events
  const notifyRealtime = () => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('dpsbuzz_cricket_realtime');
        bc.postMessage({ type: 'update', gameId });
        bc.close();
      }
      window.dispatchEvent(new CustomEvent('dpsbuzz_cricket_update', { detail: { gameId } }));
    } catch {}
  };

  // Polling & sync session
  const fetchSession = async (silent = false) => {
    if (!gameId) return;
    if (!silent) setIsLoading(true);

    try {
      const res = await fetch(`/api/games/cricket?gameId=${encodeURIComponent(gameId)}&username=${encodeURIComponent(cleanUser)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.session) {
        const next = data.session;
        setSession((prev) => {
          if (!prev) return next;
          if (
            prev.status === next.status &&
            prev.currentTurn === next.currentTurn &&
            prev.turnState === next.turnState &&
            prev.activeQuestion?.id === next.activeQuestion?.id &&
            prev.winner === next.winner &&
            prev.winningGuess === next.winningGuess &&
            prev.forfeitedBy === next.forfeitedBy &&
            prev.timeline?.length === next.timeline?.length &&
            prev.player1?.hasSelected === next.player1?.hasSelected &&
            prev.player2?.hasSelected === next.player2?.hasSelected &&
            prev.player1?.remainingGuesses === next.player1?.remainingGuesses &&
            prev.player2?.remainingGuesses === next.player2?.remainingGuesses &&
            prev.player1?.selectedCricketerId === next.player1?.selectedCricketerId &&
            prev.player2?.selectedCricketerId === next.player2?.selectedCricketerId
          ) {
            return prev;
          }
          return next;
        });
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
    } catch {
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

    // Instant cross-tab real-time listener via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('dpsbuzz_cricket_realtime');
        bc.onmessage = (ev) => {
          if (ev.data?.gameId === gameId) {
            fetchSession(true);
          }
        };
      }
    } catch {}

    // Window event listener for in-window component updates
    const onCustomUpdate = (ev: Event) => {
      const customEv = ev as CustomEvent;
      if (!customEv.detail?.gameId || customEv.detail.gameId === gameId) {
        fetchSession(true);
      }
    };
    window.addEventListener('dpsbuzz_cricket_update', onCustomUpdate);

    // Polling fallback when window is active (700ms for fast real-time responsiveness)
    const timer = setInterval(() => {
      if (sessionRef.current?.status === 'completed' || sessionRef.current?.status === 'abandoned' || sessionRef.current?.status === 'declined') {
        return;
      }
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchSession(true);
    }, 700);

    return () => {
      clearInterval(timer);
      if (bc) bc.close();
      window.removeEventListener('dpsbuzz_cricket_update', onCustomUpdate);
    };
  }, [isOpen, gameId, cleanUser]);

  // Auto-scroll timeline to bottom on update
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.timeline?.length]);

  // Filtered lists for selector
  const paginatedSelector = useMemo(() => {
    return searchCricketersPaginated(selectorSearch, selectorRole, selectorCountry, selectorPage, 18);
  }, [selectorSearch, selectorRole, selectorCountry, selectorPage]);

  const guessCricketers = useMemo(() => {
    return searchCricketers(guessSearch);
  }, [guessSearch]);

  // Curated quick options for 1-tap guessing
  const quickOptionCricketers = useMemo(() => {
    return POPULAR_OPTION_CRICKETERS.map((id) => getCricketerById(id)).filter(Boolean) as Cricketer[];
  }, []);

  if (!isOpen) return null;

  // Derive players
  const p1User = (session?.player1?.username || '').toLowerCase().trim();
  const p2User = (session?.player2?.username || '').toLowerCase().trim();
  const isPlayer1 = p1User === cleanUser;
  const isPlayer2 = p2User === cleanUser;
  const me = isPlayer1 ? session?.player1 : (isPlayer2 ? session?.player2 : session?.player1);
  const opponent = isPlayer1 ? session?.player2 : session?.player1;

  const currentTurnUser = (session?.currentTurn || '').toLowerCase().trim();
  const isMyTurn = session?.status === 'in_progress' && Boolean(currentTurnUser) && currentTurnUser === cleanUser;
  const isAwaitingAnswer = session?.turnState === 'awaiting_answer';
  const askedByUser = (session?.activeQuestion?.askedBy || '').toLowerCase().trim();
  const amITheAnswerer = isAwaitingAnswer && Boolean(askedByUser) && askedByUser !== cleanUser;

  // My chosen cricketer (if selected)
  const mySecretCricketer = me?.selectedCricketerId ? getCricketerById(me.selectedCricketerId) : null;

  // --- SAFE EXIT / FORFEIT HANDLER ---
  const handleAttemptClose = () => {
    if (!session) {
      onClose();
      return;
    }
    // If game is in active progress or selecting, confirm forfeit
    if (session.status === 'in_progress' || session.status === 'selecting') {
      setShowQuitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleForfeitMatch = async () => {
    if (!gameId || isForfeiting) return;
    setIsForfeiting(true);
    playSound('wrong');

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forfeit',
          gameId,
          username: cleanUser,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        notifyRealtime();
      }
    } catch {
      // ignore
    } finally {
      setIsForfeiting(false);
      setShowQuitConfirm(false);
    }
  };

  // --- ACTIONS ---
  const handleSelectCricketer = async () => {
    if (!gameId || !selectedCricketerId || !session) return;
    setIsSubmittingSelection(true);
    playSound('click');

    const chosenId = selectedCricketerId;
    const previousSession = session;

    // Apple-style optimistic UI update (0ms instant transition):
    setSession((prev) => {
      if (!prev) return prev;
      const isP1 = prev.player1.username.toLowerCase() === cleanUser;
      return {
        ...prev,
        player1: isP1 ? { ...prev.player1, hasSelected: true, selectedCricketerId: chosenId } : prev.player1,
        player2: !isP1 ? { ...prev.player2, hasSelected: true, selectedCricketerId: chosenId } : prev.player2,
      };
    });

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select_cricketer',
          gameId,
          username: cleanUser,
          cricketerId: chosenId,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        setSelectedCricketerId(null);
        notifyRealtime();
      } else {
        setSession(previousSession);
        alert(data.error || 'Failed to select cricketer');
      }
    } catch {
      setSession(previousSession);
      alert('Network error submitting cricketer selection');
    } finally {
      setIsSubmittingSelection(false);
    }
  };

  const handleAskQuestion = async (text: string) => {
    if (!gameId || !text.trim() || isSubmittingTurn || !session) return;
    const trimmed = text.trim();
    setIsSubmittingTurn(true);
    playSound('question');

    // Apple-style optimistic instant UI feedback (0ms perceived latency):
    const previousSession = session;
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        turnState: 'awaiting_answer',
        activeQuestion: {
          id: `q_opt_${Date.now()}`,
          askedBy: cleanUser,
          questionText: trimmed,
          timestamp: Date.now(),
        },
      };
    });
    setCustomQuestion('');

    try {
      const res = await fetch('/api/games/cricket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask_question',
          gameId,
          username: cleanUser,
          questionText: trimmed,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        notifyRealtime();
      } else {
        setSession(previousSession);
        alert(data.error || 'Failed to ask question');
      }
    } catch {
      setSession(previousSession);
      alert('Network error sending question');
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const handleAnswerQuestion = async (answer: AnswerType) => {
    if (!gameId || isSubmittingTurn || !session?.activeQuestion) return;
    setIsSubmittingTurn(true);
    playSound('answer');

    // Apple-style optimistic instant feedback (0ms perceived latency):
    const currentQ = session.activeQuestion;
    const answeredItem: TimelineItem = {
      id: currentQ.id || `q_${Date.now()}`,
      type: 'question',
      by: currentQ.askedBy,
      byName: currentQ.askedBy === session.player1.username ? session.player1.fullName : session.player2.fullName,
      questionText: currentQ.questionText,
      answer,
      timestamp: Date.now(),
    };

    const previousSession = session;
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        turnState: 'ask_or_guess',
        activeQuestion: null,
        timeline: [...prev.timeline, answeredItem],
      };
    });

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
        notifyRealtime();
      } else {
        setSession(previousSession);
        alert(data.error || 'Failed to answer question');
      }
    } catch {
      setSession(previousSession);
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
        notifyRealtime();
        if (data.isCorrect) {
          playSound('win');
        } else {
          playSound('heart_loss');
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
        notifyRealtime();
      } else {
        alert(data.error || 'Failed to restart match');
      }
    } catch {
      alert('Network error requesting rematch');
    } finally {
      setIsLoading(false);
    }
  };

  const myRemainingGuesses = me?.remainingGuesses ?? 3;
  const oppRemainingGuesses = opponent?.remainingGuesses ?? 3;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Guess the Cricketer Game Arena"
    >
      {/* Background Ambience - DPS Buzz Brand Colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[#833AB4]/20 blur-[140px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[#C13584]/20 blur-[140px]" />
      </div>

      {/* Main Container - Apple Style Liquid Glass with Brand Border */}
      <div className="relative w-full max-w-2xl bg-[#090D18]/95 backdrop-blur-3xl border border-[#C13584]/30 rounded-[28px] sm:rounded-[36px] shadow-[0_30px_90px_rgba(193,53,132,0.25)] overflow-hidden flex flex-col max-h-[94vh] text-white">
        {/* Apple specular top rim highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C13584]/50 to-transparent pointer-events-none z-20" />

        {/* Victory Confetti overlay */}
        {session?.status === 'completed' && <ConfettiCanvas />}

        {/* TOP BAR */}
        <div className="p-3.5 sm:px-5 sm:py-3.5 bg-gradient-to-r from-[#121626]/90 via-[#0E121E]/90 to-[#121626]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center p-0.5">
              <CricketBall3D size="sm" spinning={true} />
              <div className="absolute -right-2 -top-1 pointer-events-none">
                <CricketBat3D size="sm" angle={22} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] bg-clip-text text-transparent">
                  Guess the Cricketer
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C13584]/20 text-pink-300 font-extrabold border border-[#C13584]/40">
                  DPS Buzz Arena
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
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
              onClick={handleAttemptClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all cursor-pointer"
              aria-label="Exit Game"
              title="Close Arena"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* LOADING & ERROR STATES */}
        {isLoading && !session && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs text-blue-300/80 font-medium animate-pulse">
              Connecting to cricket arena...
            </p>
          </div>
        )}

        {errorMsg && !session && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
            <AlertTriangle size={36} className="text-amber-400" />
            <p className="text-sm text-rose-300 font-semibold">{errorMsg}</p>
            <button
              type="button"
              onClick={() => fetchSession(false)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {session && (
          <>
            {/* SCOREBOARD BANNER (Visible in all active states) */}
            {session.status !== 'waiting_invite' && session.status !== 'declined' && (
              <div className="px-3 py-2.5 sm:px-5 sm:py-3 bg-[#111722] border-b border-[#1F293D] shrink-0">
                <div className="grid grid-cols-7 items-center gap-1">
                  {/* Left: You */}
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-blue-500/40">
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
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="text-cyan-400 font-semibold">{me?.score || 0} pts</span>
                        <span>•</span>
                        {/* 3 Lives visual representation */}
                        <div className="flex items-center gap-0.5" title={`${myRemainingGuesses}/3 Guess Lives Remaining`}>
                          {[1, 2, 3].map((heartIndex) => (
                            <Heart
                              key={heartIndex}
                              size={11}
                              className={
                                heartIndex <= myRemainingGuesses
                                  ? 'text-rose-500 fill-rose-500'
                                  : 'text-slate-600 fill-slate-700'
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center: Turn Status Badge with 3D Cricket Ball */}
                  <div className="col-span-1 text-center">
                    <div className="inline-flex flex-col items-center justify-center">
                      <CricketBall3D size="sm" spinning={session.status === 'in_progress'} />
                      <span className="text-[9px] font-black text-amber-400 tracking-wider mt-0.5">
                        VS
                      </span>
                    </div>
                  </div>

                  {/* Right: Opponent */}
                  <div className="col-span-3 flex items-center justify-end gap-2 min-w-0 text-right">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isMyTurn && session.status === 'in_progress' && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                        <span className="text-xs font-bold truncate text-white">
                          @{opponent?.username}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
                        {/* Opponent lives */}
                        <div className="flex items-center gap-0.5" title={`Opponent has ${oppRemainingGuesses}/3 Guess Lives`}>
                          {[1, 2, 3].map((heartIndex) => (
                            <Heart
                              key={heartIndex}
                              size={11}
                              className={
                                heartIndex <= oppRemainingGuesses
                                  ? 'text-rose-500 fill-rose-500'
                                  : 'text-slate-600 fill-slate-700'
                              }
                            />
                          ))}
                        </div>
                        <span>•</span>
                        <span className="text-cyan-400 font-semibold">{opponent?.score || 0} pts</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-slate-600">
                      {opponent?.fullName?.charAt(0) || 'O'}
                    </div>
                  </div>
                </div>

                {/* Sub-strip: My Secret Preview Reminder */}
                {session.status === 'in_progress' && mySecretCricketer && (
                  <div className="mt-2 pt-2 border-t border-[#1F293D] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <CricketAvatar cricketer={mySecretCricketer} size="xs" />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Lock size={12} className="text-emerald-400" />
                        <span>Your Secret:</span>
                        <strong className="text-emerald-400 font-bold">
                          {mySecretCricketer.name} ({mySecretCricketer.iplTeam}, #{mySecretCricketer.jerseyNumber})
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMySecretDetails(!showMySecretDetails)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                    >
                      {showMySecretDetails ? <EyeOff size={11} /> : <Eye size={11} />}
                      <span>{showMySecretDetails ? 'Hide Details' : 'View Clues'}</span>
                    </button>
                  </div>
                )}

                {/* Secret facts expansion */}
                {showMySecretDetails && mySecretCricketer && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#172030] border border-[#25324A] text-[11px] text-slate-300 space-y-1 animate-fade-in">
                    <p>
                      <strong>Role:</strong> {mySecretCricketer.role} ({mySecretCricketer.battingStyle},{' '}
                      {mySecretCricketer.bowlingStyle})
                    </p>
                    <p>
                      <strong>World Cup Winner:</strong> {mySecretCricketer.worldCupWinner ? 'Yes 🏆' : 'No'} |{' '}
                      <strong>Era:</strong> {mySecretCricketer.era}
                    </p>
                    <p className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <span>🏟️ Lobby Status:</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                        Kept in our Match Lobby (Yes) ✅
                      </span>
                    </p>
                    <p className="text-slate-400 italic">
                      💡 Hint: {mySecretCricketer.hint}
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
                  <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-xl">
                      🔒
                    </div>
                    <h3 className="text-base font-bold text-emerald-300">
                      Your Secret Cricketer is Locked!
                    </h3>
                    <p className="text-xs text-emerald-200/80 max-w-md mx-auto">
                      Waiting for <strong className="text-white">@{opponent?.username}</strong> to secretly choose their cricketer. The deduction arena starts automatically once both players are ready!
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Waiting for opponent...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {opponent?.hasSelected && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-blue-500/20 to-cyan-500/20 border border-amber-500/40 flex items-center gap-3 animate-pulse shadow-lg shadow-amber-500/10">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center text-lg shrink-0">
                          ⚡
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <span>@{opponent?.username} is ready!</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                              Locked 🔒
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Your opponent has locked in their secret cricketer! Select yours below to start Turn 1.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#111722] to-[#151D2A] border border-blue-500/30">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Pick Your Secret Cricketer</span>
                        <Lock size={14} className="text-cyan-400" />
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Select a cricketer that your opponent must deduce by asking Yes/No questions. Keep it a secret!
                      </p>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="space-y-2.5">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={selectorSearch}
                          onChange={(e) => {
                            setSelectorSearch(e.target.value);
                            setSelectorPage(1);
                          }}
                          placeholder="Search 200+ cricketers by name, country, IPL team, role, jersey #..."
                          className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-[#172030] border border-[#25324A] text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                          <span className="text-[10px] font-semibold text-slate-400 bg-[#0F131B] px-2 py-0.5 rounded-md border border-[#25324A]">
                            {paginatedSelector.total}
                          </span>
                        </div>
                      </div>

                      {/* Role Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-0.5">
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
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                              selectorRole === role
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#172030] hover:bg-[#1E293B] text-slate-300'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>

                      {/* Country Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-0.5">
                          Country:
                        </span>
                        {['All', 'India', 'Australia', 'England', 'South Africa', 'New Zealand', 'West Indies', 'Pakistan'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setSelectorCountry(c);
                              setSelectorPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                              selectorCountry === c
                                ? 'bg-cyan-600 text-white'
                                : 'bg-[#172030] hover:bg-[#1E293B] text-slate-300'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cricketer Grid */}
                    {paginatedSelector.items.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-[#111722] border border-[#1F293D]">
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
                                  ? 'bg-gradient-to-br from-blue-900/90 to-cyan-950/90 border-cyan-400 shadow-md ring-2 ring-cyan-500/50'
                                  : 'bg-[#172030] hover:bg-[#1E293B] border-[#25324A]'
                              }`}
                            >
                              <CricketAvatar cricketer={c} size="md" showAttribution />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs font-bold text-white truncate">
                                    {c.name}
                                  </h4>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-300 shrink-0">
                                    #{c.jerseyNumber}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-300 truncate">
                                  {c.role} • {c.country}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400">
                                  <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-200 font-semibold truncate max-w-[85px]">
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
                          className="px-3 py-1.5 rounded-xl bg-[#172030] hover:bg-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed border border-[#25324A] text-white font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <ChevronLeft size={14} />
                          <span>Prev</span>
                        </button>

                        <span className="text-[11px] font-medium text-slate-300">
                          Page <strong className="text-white font-bold">{paginatedSelector.currentPage}</strong> of{' '}
                          <strong className="text-white font-bold">{paginatedSelector.totalPages}</strong>{' '}
                          <span className="text-slate-400">({paginatedSelector.total} players)</span>
                        </span>

                        <button
                          type="button"
                          disabled={paginatedSelector.currentPage >= paginatedSelector.totalPages}
                          onClick={() => setSelectorPage((p) => Math.min(paginatedSelector.totalPages, p + 1))}
                          className="px-3 py-1.5 rounded-xl bg-[#172030] hover:bg-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed border border-[#25324A] text-white font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
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
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-[#111722] px-3 py-1 rounded-full border border-[#1F293D]">
                      Match Deduction Feed
                    </span>
                  </div>

                  {session.timeline.map((item: TimelineItem) => {
                    const isSystem = item.type === 'system';
                    const isGuess = item.type === 'guess';
                    const isQuestion = item.type === 'question';
                    const isForfeit = item.type === 'forfeit';
                    const isFromMe = (item.by || '').toLowerCase().trim() === cleanUser;

                    if (isSystem || isForfeit) {
                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border text-center text-[11px] font-medium ${
                            isForfeit
                              ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                              : 'bg-[#111722] border-[#1F293D] text-slate-300'
                          }`}
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
                              {item.isCorrect ? '+50 pts' : '-5 pts (1 Life Lost)'}
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
                              ? 'ml-auto bg-gradient-to-r from-blue-950/80 to-[#141F32] border-blue-500/35 text-white'
                              : 'mr-auto bg-[#172030] border-[#25324A] text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-cyan-400">
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
                <div className="p-3 sm:p-4 bg-[#111722] border-t border-[#1F293D] shrink-0 space-y-3">
                  {/* Case A: Answer prompt (when opponent asked a question and waiting for my answer) */}
                  {amITheAnswerer && session.activeQuestion && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#131B29] to-[#1A2538] border border-blue-500/40 space-y-2.5 animate-slide-up">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <HelpCircle size={15} />
                          <span>@{session.activeQuestion.askedBy} asks you:</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Respond honestly</span>
                      </div>
                      <p className="text-sm font-bold text-white bg-black/40 p-2.5 rounded-xl border border-white/10">
                        &ldquo;{session.activeQuestion.questionText}&rdquo;
                      </p>

                      {session.activeQuestion.questionText.toLowerCase().includes('lobby') && mySecretCricketer && (
                        <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-950/70 to-[#0F1D1C] border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center gap-2">
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>
                            Lobby Clue: Your secret is <strong>{mySecretCricketer.name}</strong>, which is kept in our match lobby! (Tap <strong>Yes</strong>)
                          </span>
                        </div>
                      )}

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
                    <div className="p-3.5 rounded-2xl bg-[#172030] border border-[#25324A] text-center space-y-2">
                      <div className="inline-flex items-center gap-2 text-xs text-slate-200 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>Waiting for @{opponent?.username} to answer:</span>
                      </div>
                      <p className="text-xs text-white/90 italic bg-black/30 p-2 rounded-xl">
                        &ldquo;{session.activeQuestion?.questionText}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Case C: My turn to ask or guess */}
                  {isMyTurn && !isAwaitingAnswer && (
                    <div className="space-y-2.5">
                      {/* Tabs: Ask Question vs Guess Cricketer */}
                      <div className="flex p-1 rounded-xl bg-[#0B0E14] border border-[#1F293D]">
                        <button
                          type="button"
                          onClick={() => setGameplayTab('question')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            gameplayTab === 'question'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
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
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Trophy size={14} />
                          <span>Make a Guess ({myRemainingGuesses} Lives left)</span>
                        </button>
                      </div>

                      {/* Tab 1: Ask Question Controls */}
                      {gameplayTab === 'question' && (
                        <div className="space-y-2.5">
                          {/* 🏟️ Dedicated Match Lobby Deduction Box */}
                          <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#833AB4]/25 via-[#C13584]/25 to-[#F77737]/25 border border-[#C13584]/45 space-y-2 shadow-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">🏟️</span>
                                <span className="text-[11px] font-black text-amber-300 tracking-wide uppercase">
                                  Lobby Deduction Box
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C13584]/40 text-pink-200 font-extrabold border border-[#C13584]/40">
                                  1-Tap Questions
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">Match Roster</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={isSubmittingTurn}
                                onClick={() => handleAskQuestion('Is this cricketer from our lobby?')}
                                className="p-2.5 rounded-xl bg-gradient-to-r from-[#833AB4] to-[#C13584] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#C13584]/30 flex items-center justify-between gap-2 transition-all active:scale-98 cursor-pointer group text-left"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] sm:text-xs font-black text-white group-hover:text-amber-200 truncate">
                                    &ldquo;Is this cricketer from our lobby?&rdquo;
                                  </p>
                                  <p className="text-[9px] text-pink-200/80 truncate">
                                    Ask if secret is from our lobby roster
                                  </p>
                                </div>
                                <Send size={13} className="shrink-0 text-white" />
                              </button>

                              <button
                                type="button"
                                disabled={isSubmittingTurn}
                                onClick={() => handleAskQuestion('Is this cricketer kept in our lobby?')}
                                className="p-2.5 rounded-xl bg-gradient-to-r from-[#C13584] to-[#F77737] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#F77737]/30 flex items-center justify-between gap-2 transition-all active:scale-98 cursor-pointer group text-left"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] sm:text-xs font-black text-white group-hover:text-amber-200 truncate">
                                    &ldquo;Is this cricketer kept in our lobby?&rdquo;
                                  </p>
                                  <p className="text-[9px] text-amber-100/80 truncate">
                                    Check if kept here in the match box
                                  </p>
                                </div>
                                <Send size={13} className="shrink-0 text-white" />
                              </button>
                            </div>
                          </div>

                          {/* Category chips */}
                          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                            {SUGGESTED_QUESTIONS.map((cat, idx) => (
                              <button
                                key={cat.category}
                                type="button"
                                onClick={() => setActiveCategoryIndex(idx)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all cursor-pointer ${
                                  activeCategoryIndex === idx
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[#172030] hover:bg-[#1E293B] text-slate-300'
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
                                className="p-2 text-left rounded-xl bg-[#172030] hover:bg-[#1E293B] border border-[#25324A] hover:border-blue-500/40 text-[11px] text-slate-200 hover:text-white font-medium transition-all active:scale-98 cursor-pointer truncate"
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
                              className="flex-1 px-3 py-2 rounded-xl bg-[#172030] border border-[#25324A] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Send size={13} />
                              <span>Ask</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Make Final Guess Controls (with 3 Lives & Option Answers) */}
                      {gameplayTab === 'guess' && (() => {
                        const isSameAsMySecret = Boolean(selectedGuessId && mySecretCricketer && selectedGuessId.toLowerCase() === mySecretCricketer.id.toLowerCase());
                        const selectedCricketerObj = selectedGuessId ? getCricketerById(selectedGuessId) : null;

                        return (
                          <div className="space-y-3">
                            {/* 3 MATCH RULES & LIVES HEADER */}
                            <div className="p-3 rounded-2xl bg-[#0F1420] border border-blue-500/30 space-y-2">
                              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                                  <Trophy size={14} className="text-amber-400" />
                                  <span>GUESS TO WIN RULES</span>
                                </span>
                                <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full border border-amber-500/30">
                                  <span className="text-[10px] text-slate-300 font-bold">Your Lives:</span>
                                  {[1, 2, 3].map((heartIndex) => (
                                    <Heart
                                      key={heartIndex}
                                      size={12}
                                      className={
                                        heartIndex <= myRemainingGuesses
                                          ? 'text-rose-500 fill-rose-500'
                                          : 'text-slate-600 fill-slate-700'
                                      }
                                    />
                                  ))}
                                  <span className="font-extrabold text-amber-400 text-xs">({myRemainingGuesses}/3)</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
                                <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                                  🥇 <strong className="text-white">1st to Guess Wins:</strong> Correctly deducing opponent&apos;s secret cricketer wins immediately!
                                </div>
                                <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200">
                                  ❤️ <strong className="text-white">3 Lives Only:</strong> You have 3 guess attempts. 3 wrong guesses = you lose the match!
                                </div>
                                <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 font-semibold">
                                  👥 <strong className="text-white">Same Player Allowed:</strong> Opponent can pick your same cricketer! You can guess any cricketer freely.
                                </div>
                              </div>
                            </div>

                            {/* Same as Secret Cricketer Info Banner */}
                            {isSameAsMySecret && (
                              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 text-xs font-semibold flex items-center gap-2 shadow-md">
                                <Sparkles size={16} className="text-cyan-400 shrink-0" />
                                <span>
                                  💡 <strong>Same Pick Allowed:</strong> You secretly chose {selectedCricketerObj?.name} too! If your opponent also selected {selectedCricketerObj?.name}, this guess will WIN the match!
                                </span>
                              </div>
                            )}

                            {/* Option Answers: 1-Tap Cricketer Chips */}
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles size={13} className="text-amber-400" />
                                  <span>Quick Option Answers (Tap to Select):</span>
                                </span>
                                <span className="text-[10px] text-cyan-400 font-medium">12 Popular Stars</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                                {quickOptionCricketers.map((c) => {
                                  const isSelected = selectedGuessId === c.id;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => setSelectedGuessId(c.id)}
                                      className={`p-2 rounded-xl text-left transition-all border flex items-center gap-2 cursor-pointer ${
                                        isSelected
                                          ? 'bg-gradient-to-r from-amber-600/40 to-yellow-600/30 border-amber-400 ring-2 ring-amber-500/40 shadow-md text-white'
                                          : 'bg-[#151D2A] hover:bg-[#1A2536] border-[#222F44] text-slate-200'
                                      }`}
                                    >
                                      <CricketAvatar cricketer={c} size="xs" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold truncate text-white">{c.name}</p>
                                        <p className="text-[9px] text-slate-400 truncate">
                                          {c.iplTeam} • #{c.jerseyNumber}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Search Bar for all 200+ cricketers */}
                            <div className="space-y-1.5">
                              <div className="relative">
                                <Search
                                  size={14}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                  type="text"
                                  value={guessSearch}
                                  onChange={(e) => setGuessSearch(e.target.value)}
                                  placeholder="Or search any of 200+ cricketers by name, team, role..."
                                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#151D2A] border border-[#222F44] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              {guessSearch.trim() && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                                  {guessCricketers.slice(0, 36).map((c) => {
                                    const isSelected = selectedGuessId === c.id;
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setSelectedGuessId(c.id)}
                                        className={`p-1.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                                          isSelected
                                            ? 'bg-amber-600/40 border-amber-400 text-white shadow-xs'
                                            : 'bg-[#151D2A] hover:bg-[#1A2536] border-[#222F44] text-slate-200'
                                        }`}
                                      >
                                        <CricketAvatar cricketer={c} size="xs" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold truncate">{c.name}</p>
                                          <p className="text-[9px] text-slate-400 truncate">
                                            {c.iplTeam} • #{c.jerseyNumber}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Submit Guess Button */}
                            <button
                              type="button"
                              disabled={!selectedGuessId || isSubmittingTurn || myRemainingGuesses <= 0}
                              onClick={handleMakeGuess}
                              className="w-full py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-40 shadow-amber-950/40"
                            >
                              <Trophy size={16} />
                              <span>
                                {selectedGuessId
                                  ? `Lock in Guess: ${selectedCricketerObj?.name} (Attempt ${4 - myRemainingGuesses}/3) 🎯`
                                  : 'Select an Option Answer above to Guess'}
                              </span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Case D: Opponent's turn to ask or guess */}
                  {!isMyTurn && !isAwaitingAnswer && (
                    <div className="p-4 rounded-2xl bg-[#172030] border border-[#25324A] text-center space-y-1.5">
                      <div className="inline-flex items-center gap-2 text-xs text-slate-200 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>@{opponent?.username} is contemplating their next move...</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        They can ask a Yes/No question or attempt a match-winning guess ({oppRemainingGuesses} lives remaining).
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
                    <div className="w-full h-full rounded-full bg-[#0B0E14] flex items-center justify-center text-3xl">
                      🏆
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-blue-400 to-cyan-400">
                    {session.forfeitedBy
                      ? (session.forfeitedBy || '').toLowerCase().trim() === cleanUser
                        ? 'You Quit the Match'
                        : 'Congratulations! You Won! 🏅'
                      : (session.winner || '').toLowerCase().trim() === cleanUser
                      ? 'Congratulations! You Won! 🏅'
                      : `@${session.winner} Won the Match!`}
                  </h3>

                  {/* Forfeit vs Normal win banner */}
                  {session.forfeitedBy ? (
                    <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-semibold max-w-md mx-auto space-y-1 shadow-lg">
                      <div className="flex items-center justify-center gap-2 text-rose-300 font-extrabold text-sm sm:text-base">
                        <UserX size={18} />
                        <span>@{session.forfeitedBy} has quit the match!</span>
                      </div>
                      <p className="text-white text-xs">
                        Winner: <strong className="text-amber-400 font-extrabold">@{session.winner}</strong> 🏆 (Opponent quit)
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto">
                      Winning deduction:{' '}
                      <strong className="text-amber-300 font-bold">{session.winningGuess}</strong>
                    </p>
                  )}
                </div>

                {/* Secret Cricketers Revealed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                  {/* Player 1 Secret */}
                  {session.revealedPlayer1Cricketer && (
                    <div className="p-4 rounded-2xl bg-[#111722] border border-[#1F293D] space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                          @{session.player1.username}&apos;s Secret
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-300 font-bold">
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
                          <p className="text-xs text-slate-300 truncate">
                            {session.revealedPlayer1Cricketer.role} • {session.revealedPlayer1Cricketer.country}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 font-semibold">
                              {session.revealedPlayer1Cricketer.iplTeam}
                            </span>
                            <span className="text-slate-400">
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

                      <p className="text-[10px] text-slate-300 italic bg-black/30 p-2 rounded-xl border border-white/5">
                        &ldquo;{session.revealedPlayer1Cricketer.hint}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Player 2 Secret */}
                  {session.revealedPlayer2Cricketer && (
                    <div className="p-4 rounded-2xl bg-[#111722] border border-[#1F293D] space-y-2.5">
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                          @{session.player2.username}&apos;s Secret
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-cyan-300 font-bold">
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
                          <p className="text-xs text-slate-300 truncate">
                            {session.revealedPlayer2Cricketer.role} • {session.revealedPlayer2Cricketer.country}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 font-semibold">
                              {session.revealedPlayer2Cricketer.iplTeam}
                            </span>
                            <span className="text-slate-400">
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

                      <p className="text-[10px] text-slate-300 italic bg-black/30 p-2 rounded-xl border border-white/5">
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
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
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
                    onClick={() => setShowGameOverSmash(true)}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.97]"
                  >
                    <Sparkles size={15} />
                    <span>Replay 3D Winner Smash 🎬</span>
                  </button>

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

      {/* CINEMATIC GAME OVER 3D SMASH & THRILLER TRANSITION */}
      {session && session.status === 'completed' && (
        <GameOver3DSmashTransition
          isOpen={showGameOverSmash}
          winnerName={
            session.forfeitedBy
              ? (session.forfeitedBy || '').toLowerCase().trim() === cleanUser
                ? opponent?.fullName || opponent?.username || 'Opponent'
                : me?.fullName || me?.username || 'You'
              : (session.winner || '').toLowerCase().trim() === cleanUser
              ? me?.fullName || me?.username || 'You'
              : opponent?.fullName || opponent?.username || session.winner || 'Opponent'
          }
          winnerUsername={session.winner || 'Winner'}
          winnerAvatar={
            session.winner === session.player1.username
              ? session.player1.avatar
              : session.player2.avatar
          }
          isMyVictory={
            session.forfeitedBy
              ? (session.forfeitedBy || '').toLowerCase().trim() !== cleanUser
              : (session.winner || '').toLowerCase().trim() === cleanUser
          }
          winningCricketerName={session.winningGuess || undefined}
          forfeit={Boolean(session.forfeitedBy)}
          quitterUsername={session.forfeitedBy || undefined}
          onPlayAgain={handleRematch}
          onClose={() => setShowGameOverSmash(false)}
          onOpenLeaderboard={onOpenLeaderboard ? () => onOpenLeaderboard('leaderboard') : undefined}
        />
      )}

      {/* QUIT / FORFEIT CONFIRMATION MODAL */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0B0E14] border border-[#1F293D] rounded-3xl p-6 text-center text-white space-y-4 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-2xl mx-auto">
              <UserX className="text-rose-400" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Leave Match Arena?</h3>
              <p className="text-xs text-slate-300">
                You can minimize the game to view your chats and resume anytime, or resign the match.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowQuitConfirm(false);
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-950/40"
              >
                Minimize Game (Keep Playing) 💬
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  Stay Here
                </button>
                <button
                  type="button"
                  disabled={isForfeiting}
                  onClick={handleForfeitMatch}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-rose-950/40"
                >
                  {isForfeiting ? 'Forfeiting...' : 'Resign & Forfeit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

class CricketGameErrorBoundary extends React.Component<
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
  componentDidCatch(error: any) {
    console.error('[CricketGameModal] Caught error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0B0E14] border border-[#1F293D] rounded-3xl p-6 text-center text-white space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl mx-auto">
              🏏
            </div>
            <h3 className="text-sm font-bold text-white">Cricket Arena Reconnecting</h3>
            <p className="text-xs text-slate-400">
              The game session encountered a brief glitch. Click below to reconnect or return to chat.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-all"
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

export function CricketGameModal(props: CricketGameModalProps) {
  if (!props.isOpen) return null;
  return (
    <CricketGameErrorBoundary onClose={props.onClose}>
      <CricketGameModalContent {...props} />
    </CricketGameErrorBoundary>
  );
}
