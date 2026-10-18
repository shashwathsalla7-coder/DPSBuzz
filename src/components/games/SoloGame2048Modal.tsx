'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  HelpCircle,
  Sparkles,
  Award,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  CheckCircle,
  Lock,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  SoloTile3D,
  play2048SlideSound,
  play2048MergeSound,
  play2048WinSound,
  play2048LevelUpSound,
  play2048GameOverSound,
} from './Solo20483DObjects';
import { DataStore } from '@/lib/dataStore';

interface SoloGame2048ModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
  onOpenLeaderboard?: () => void;
}

type BoardGrid = number[][];

export interface GameLevel {
  level: number;
  name: string;
  subtitle: string;
  badge: string;
  gridSize: number; // 3, 4, 5, 6
  targetTile: number; // 128, 512, 2048, 4096, 8192
  scoreMultiplier: number;
  starPointsReward: number;
  themeColor: string;
  badgeBg: string;
}

export const GAME_LEVELS: GameLevel[] = [
  {
    level: 1,
    name: 'Honey Sprout',
    subtitle: '3x3 Quick Starter',
    badge: '🌱 Lvl 1',
    gridSize: 3,
    targetTile: 128,
    scoreMultiplier: 1.0,
    starPointsReward: 50,
    themeColor: 'from-emerald-400 to-teal-500',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    level: 2,
    name: 'School Scout',
    subtitle: '4x4 Classic Arena',
    badge: '🐝 Lvl 2',
    gridSize: 4,
    targetTile: 512,
    scoreMultiplier: 1.5,
    starPointsReward: 100,
    themeColor: 'from-amber-400 to-orange-500',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    level: 3,
    name: 'Hive Champion',
    subtitle: '4x4 Master 2048',
    badge: '👑 Lvl 3',
    gridSize: 4,
    targetTile: 2048,
    scoreMultiplier: 2.0,
    starPointsReward: 200,
    themeColor: 'from-rose-500 to-pink-600',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    level: 4,
    name: 'Royal Guard',
    subtitle: '5x5 Epic Expansion',
    badge: '🛡️ Lvl 4',
    gridSize: 5,
    targetTile: 4096,
    scoreMultiplier: 2.5,
    starPointsReward: 350,
    themeColor: 'from-purple-500 to-indigo-600',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    level: 5,
    name: 'Cosmic Apex',
    subtitle: '6x6 Galactic Titan',
    badge: '🌌 Lvl 5',
    gridSize: 6,
    targetTile: 8192,
    scoreMultiplier: 3.0,
    starPointsReward: 500,
    themeColor: 'from-cyan-400 via-sky-500 to-indigo-600',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
];

/* =====================================================================
   UNIVERSAL BOARD LOGIC (Supports any grid size N x N)
   ===================================================================== */

function createEmptyBoard(size: number): BoardGrid {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function getRandomEmptyCell(board: BoardGrid, size: number): [number, number] | null {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}

function spawnRandomTile(board: BoardGrid, size: number): BoardGrid {
  const cell = getRandomEmptyCell(board, size);
  if (!cell) return board;
  const [r, c] = cell;
  const newBoard = board.map((row) => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

function initNewGame(size: number): BoardGrid {
  let b = createEmptyBoard(size);
  b = spawnRandomTile(b, size);
  b = spawnRandomTile(b, size);
  return b;
}

function checkGameOver(board: BoardGrid, size: number): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) return false;
      if (c < size - 1 && board[r][c] === board[r][c + 1]) return false;
      if (r < size - 1 && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

function getMaxTile(board: BoardGrid): number {
  let max = 0;
  for (const row of board) {
    for (const val of row) {
      if (val > max) max = val;
    }
  }
  return max;
}

function rotateClockwise(grid: BoardGrid, size: number): BoardGrid {
  const res = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      res[c][size - 1 - r] = grid[r][c];
    }
  }
  return res;
}

export function SoloGame2048Modal({
  isOpen,
  onClose,
  currentUsername = 'student',
  onOpenLeaderboard,
}: SoloGame2048ModalProps) {
  // Level state
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(1); // Default: Level 2 (Classic 4x4)
  const [unlockedMaxLevel, setUnlockedMaxLevel] = useState<number>(3); // Levels 1, 2, 3 open by default

  const currentLevel = GAME_LEVELS[currentLevelIndex] || GAME_LEVELS[1];
  const gridSize = currentLevel.gridSize;

  // Board and score states
  const [board, setBoard] = useState<BoardGrid>(() => initNewGame(currentLevel.gridSize));
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [previousBoard, setPreviousBoard] = useState<BoardGrid | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Victory / Level Clear state
  const [levelCleared, setLevelCleared] = useState<boolean>(false);
  const [dismissedLevelClear, setDismissedLevelClear] = useState<boolean>(false);
  const [clearedRewardNotice, setClearedRewardNotice] = useState<string | null>(null);

  // Settings & feedback
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [lastDirection, setLastDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const [invalidMoveShake, setInvalidMoveShake] = useState<boolean>(false);

  // Gesture Tracker Ref (supports pointer/mouse/touch)
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // Load unlocked levels & settings from storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedMaxLvl = localStorage.getItem('dpsbuzz_2048_unlocked_max_level');
      if (savedMaxLvl) {
        const parsed = parseInt(savedMaxLvl, 10);
        if (parsed >= 1 && parsed <= GAME_LEVELS.length) {
          setUnlockedMaxLevel(parsed);
        }
      }

      const savedSound = localStorage.getItem('dpsbuzz_2048_sound');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');

      const savedLvlIndex = localStorage.getItem('dpsbuzz_2048_selected_level');
      if (savedLvlIndex !== null) {
        const idx = parseInt(savedLvlIndex, 10);
        if (idx >= 0 && idx < GAME_LEVELS.length) {
          setCurrentLevelIndex(idx);
        }
      }
    } catch {}
  }, []);

  // Load board state whenever currentLevelIndex changes or modal opens
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;

    try {
      const lvl = currentLevel.level;
      const size = currentLevel.gridSize;

      const savedBest = localStorage.getItem(`dpsbuzz_2048_best_lvl_${lvl}`);
      if (savedBest) {
        setBestScore(parseInt(savedBest, 10) || 0);
      } else {
        setBestScore(0);
      }

      const savedBoard = localStorage.getItem(`dpsbuzz_2048_board_lvl_${lvl}`);
      const savedScore = localStorage.getItem(`dpsbuzz_2048_score_lvl_${lvl}`);

      if (savedBoard && savedScore) {
        const parsed = JSON.parse(savedBoard);
        if (Array.isArray(parsed) && parsed.length === size && parsed[0].length === size) {
          // If the saved board was already game over, start fresh so player can make moves!
          if (checkGameOver(parsed, size)) {
            const fresh = initNewGame(size);
            setBoard(fresh);
            setScore(0);
            setIsGameOver(false);
          } else {
            setBoard(parsed);
            setScore(parseInt(savedScore, 10) || 0);
            setIsGameOver(false);
          }
          setPreviousBoard(null);
          setPreviousScore(null);
          setCanUndo(false);
          setLevelCleared(false);
          setDismissedLevelClear(false);
          return;
        }
      }
    } catch {}

    // Initialize fresh board if no saved state
    const fresh = initNewGame(currentLevel.gridSize);
    setBoard(fresh);
    setScore(0);
    setIsGameOver(false);
    setLevelCleared(false);
    setDismissedLevelClear(false);
    setPreviousBoard(null);
    setPreviousScore(null);
    setCanUndo(false);
    setMovesCount(0);
  }, [currentLevelIndex, isOpen]);

  // Persist current level board & score
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;
    const lvl = currentLevel.level;
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem(`dpsbuzz_2048_best_lvl_${lvl}`, score.toString());
    }
    if (board.some((row) => row.some((c) => c > 0))) {
      localStorage.setItem(`dpsbuzz_2048_board_lvl_${lvl}`, JSON.stringify(board));
      localStorage.setItem(`dpsbuzz_2048_score_lvl_${lvl}`, score.toString());
    }
  }, [board, score, bestScore, currentLevel.level, isOpen]);

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('dpsbuzz_2048_sound', next.toString());
  };

  // Switch Level
  const handleSelectLevel = (index: number) => {
    const targetLvl = GAME_LEVELS[index];
    if (!targetLvl) return;
    if (targetLvl.level > unlockedMaxLevel) return; // Locked

    // Save current level state before switching
    try {
      localStorage.setItem(`dpsbuzz_2048_board_lvl_${currentLevel.level}`, JSON.stringify(board));
      localStorage.setItem(`dpsbuzz_2048_score_lvl_${currentLevel.level}`, score.toString());
      localStorage.setItem('dpsbuzz_2048_selected_level', index.toString());
    } catch {}

    setCurrentLevelIndex(index);
    if (soundEnabled) play2048SlideSound();
  };

  // Reset / New Game
  const handleNewGame = () => {
    const fresh = initNewGame(gridSize);
    setPreviousBoard(null);
    setPreviousScore(null);
    setCanUndo(false);
    setBoard(fresh);
    setScore(0);
    setIsGameOver(false);
    setLevelCleared(false);
    setDismissedLevelClear(false);
    setMovesCount(0);
    setClearedRewardNotice(null);
    if (soundEnabled) play2048SlideSound();
  };

  // Undo last move
  const handleUndo = () => {
    if (!previousBoard || previousScore === null || !canUndo) return;
    setBoard(previousBoard);
    setScore(previousScore);
    setCanUndo(false);
    setPreviousBoard(null);
    setPreviousScore(null);
    setIsGameOver(false);
    if (soundEnabled) play2048SlideSound();
  };

  // Core 2048 Slide Engine (Dynamic for any gridSize)
  const makeMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      // If modal overlay is showing level cleared, don't move until dismissed
      if (levelCleared && !dismissedLevelClear) return;

      // If game over, provide visual feedback
      if (isGameOver) {
        setInvalidMoveShake(true);
        setTimeout(() => setInvalidMoveShake(false), 300);
        return;
      }

      setLastDirection(direction);

      let moved = false;
      let pointsGained = 0;
      let maxMergedTile = 0;
      const size = gridSize;

      // Deep copy
      const newGrid = board.map((row) => [...row]);

      let rotated = newGrid;
      const rotationsNeeded = {
        left: 0,
        up: 3,
        right: 2,
        down: 1,
      }[direction];

      for (let i = 0; i < rotationsNeeded; i++) {
        rotated = rotateClockwise(rotated, size);
      }

      // Slide and combine tiles to the left
      for (let r = 0; r < size; r++) {
        let row = rotated[r].filter((val) => val !== 0);

        for (let c = 0; c < row.length - 1; c++) {
          if (row[c] === row[c + 1]) {
            const mergedVal = row[c] * 2;
            row[c] = mergedVal;
            row[c + 1] = 0;
            // Apply level score multiplier
            const earned = Math.round(mergedVal * currentLevel.scoreMultiplier);
            pointsGained += earned;
            if (mergedVal > maxMergedTile) maxMergedTile = mergedVal;
            c++;
          }
        }

        row = row.filter((val) => val !== 0);
        while (row.length < size) {
          row.push(0);
        }

        for (let c = 0; c < size; c++) {
          if (rotated[r][c] !== row[c]) {
            moved = true;
          }
          rotated[r][c] = row[c];
        }
      }

      const rotationsToRestore = (4 - rotationsNeeded) % 4;
      for (let i = 0; i < rotationsToRestore; i++) {
        rotated = rotateClockwise(rotated, size);
      }

      // If no tile could move in this direction, trigger gentle shake
      if (!moved) {
        setInvalidMoveShake(true);
        setTimeout(() => setInvalidMoveShake(false), 250);
        return;
      }

      // Save for Undo
      setPreviousBoard(board.map((row) => [...row]));
      setPreviousScore(score);
      setCanUndo(true);

      // Spawn new tile
      const finalBoard = spawnRandomTile(rotated, size);
      setBoard(finalBoard);
      const nextScore = score + pointsGained;
      setScore(nextScore);
      setMovesCount((prev) => prev + 1);

      // Audio feedback
      if (soundEnabled) {
        if (maxMergedTile > 0) {
          play2048MergeSound(maxMergedTile);
        } else {
          play2048SlideSound();
        }
      }

      // Check Level Clear condition (Target Tile Reached!)
      const currentMax = getMaxTile(finalBoard);
      if (currentMax >= currentLevel.targetTile && !levelCleared && !dismissedLevelClear) {
        setLevelCleared(true);
        if (soundEnabled) play2048LevelUpSound();

        // Unlock next level
        const nextLvlNumber = currentLevel.level + 1;
        if (nextLvlNumber <= GAME_LEVELS.length && nextLvlNumber > unlockedMaxLevel) {
          setUnlockedMaxLevel(nextLvlNumber);
          try {
            localStorage.setItem('dpsbuzz_2048_unlocked_max_level', nextLvlNumber.toString());
          } catch {}
        }

        // Award Star Points
        try {
          DataStore.addSpiritPoints(
            currentUsername,
            currentLevel.starPointsReward,
            `Cleared 2048 ${currentLevel.name} (${currentLevel.targetTile} Tile)! 🐝🌟`
          );
          setClearedRewardNotice(`+${currentLevel.starPointsReward} Star Points Added to Profile! ✨`);
        } catch {}
      }

      // Check Game Over
      if (checkGameOver(finalBoard, size)) {
        setIsGameOver(true);
        if (soundEnabled) play2048GameOverSound();
      }
    },
    [
      board,
      score,
      gridSize,
      isGameOver,
      levelCleared,
      dismissedLevelClear,
      currentLevel,
      unlockedMaxLevel,
      soundEnabled,
      currentUsername,
    ]
  );

  // Advance to next level after level clear
  const handleAdvanceNextLevel = () => {
    const nextIndex = currentLevelIndex + 1;
    if (nextIndex < GAME_LEVELS.length) {
      handleSelectLevel(nextIndex);
    } else {
      setDismissedLevelClear(true);
    }
  };

  // Keyboard navigation listener (Arrow keys + WASD + Undo)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling on arrow keys & space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          makeMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          makeMove('right');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          makeMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          makeMove('down');
          break;
        case 'z':
        case 'Z':
        case 'u':
        case 'U':
          if (e.ctrlKey || e.metaKey || e.key === 'u' || e.key === 'U') {
            handleUndo();
          }
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey) handleNewGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, makeMove]);

  // Unified Pointer Gestures (Mouse Drag + Mobile Touch + Stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Left click only for mouse
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;

    const minSwipeDistance = 18; // Fast, super responsive swipe
    if (Math.hypot(deltaX, deltaY) < minSwipeDistance) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) makeMove('right');
      else makeMove('left');
    } else {
      if (deltaY > 0) makeMove('down');
      else makeMove('up');
    }
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
  };

  if (!isOpen) return null;

  const currentMaxTile = getMaxTile(board);

  // Calculate Level Progression XP towards Target Tile
  // Log2 based progress gives smooth visual feedback per merge tier
  const targetTile = currentLevel.targetTile;
  const currentTilePower = Math.log2(Math.max(2, currentMaxTile));
  const targetTilePower = Math.log2(targetTile);
  const progressRatio = Math.min(1, Math.max(0, currentTilePower / targetTilePower));
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-[85] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xl select-none"
      role="dialog"
      aria-modal="true"
      aria-label="2048 Solo Game Arena"
      tabIndex={-1}
    >
      {/* Dynamic Ambient Glow matching the active Level */}
      {/* Ambient background glow - DPS Buzz Brand Colors */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-[140px] pointer-events-none opacity-20 bg-[#833AB4]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[140px] pointer-events-none opacity-20 bg-[#F77737]" />

      {/* Main Apple Liquid Glass Modal Shell */}
      <div className="relative w-full max-w-[490px] max-h-[96vh] overflow-y-auto rounded-[28px] sm:rounded-[36px] bg-[#0A0D18]/96 border border-[#F77737]/30 p-4 sm:p-5 shadow-[0_30px_90px_rgba(247,119,55,0.25)] text-white space-y-3.5">
        {/* Specular Rim Light */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#F77737]/60 to-transparent pointer-events-none" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#F77737] p-0.5 shadow-md flex items-center justify-center text-xl">
              <div className="w-full h-full bg-[#0D101D] rounded-[14px] flex items-center justify-center text-lg">
                🐝
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white tracking-tight bg-gradient-to-r from-[#833AB4] via-[#C13584] to-[#F77737] bg-clip-text text-transparent">
                  2048 Buzz Rush
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${currentLevel.badgeBg}`}>
                  {currentLevel.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentLevel.gridSize}x{currentLevel.gridSize} Grid • Target: <strong className="text-amber-400">{currentLevel.targetTile}</strong> Tile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              type="button"
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
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
              onClick={onClose}
              type="button"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close arena"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Level Progression Selector Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] px-0.5">
            <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap size={12} className="text-amber-400" />
              <span>Select Level & Difficulty:</span>
            </span>
            <span className="text-amber-400 font-extrabold text-[11px]">
              Multiplier: {currentLevel.scoreMultiplier}x
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {GAME_LEVELS.map((lvl, idx) => {
              const isSelected = idx === currentLevelIndex;
              const isLocked = lvl.level > unlockedMaxLevel;

              return (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => handleSelectLevel(idx)}
                  disabled={isLocked}
                  className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                    isSelected
                      ? `bg-gradient-to-r ${lvl.themeColor} text-slate-950 font-black border-white/40 shadow-md scale-105`
                      : isLocked
                      ? 'bg-white/[0.03] text-slate-500 border-white/5 cursor-not-allowed opacity-60'
                      : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
                  }`}
                  title={
                    isLocked
                      ? `Locked! Reach ${GAME_LEVELS[idx - 1]?.targetTile} tile in Level ${idx} to unlock!`
                      : `${lvl.name} (${lvl.gridSize}x${lvl.gridSize}) - Target: ${lvl.targetTile}`
                  }
                >
                  {isLocked ? (
                    <Lock size={11} className="text-slate-500" />
                  ) : (
                    <span>{lvl.badge}</span>
                  )}
                  <span>({lvl.gridSize}x{lvl.gridSize})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Level Progress (XP) Bar */}
        <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <span>Goal:</span>
              <strong className="text-amber-400">{currentLevel.targetTile} Tile</strong>
            </span>
            <span className="text-xs font-black text-amber-400">
              {progressPercent}% Complete
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden relative border border-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${currentLevel.themeColor} transition-all duration-300 shadow-sm`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scoreboard Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
              Score ({currentLevel.scoreMultiplier}x)
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center relative overflow-hidden">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center justify-center gap-1">
              <Trophy size={11} className="text-yellow-400" />
              <span>Level Best</span>
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {bestScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Undo 1 move (Ctrl+Z or U)"
            >
              <RotateCcw size={13} />
              <span>Undo</span>
            </button>

            <button
              onClick={handleNewGame}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Restart</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Highest:</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
              {currentMaxTile}
            </span>
          </div>
        </div>

        {/* Rules Accordion */}
        {showRules && (
          <div className="p-3 rounded-2xl bg-[#111728] border border-cyan-500/30 space-y-1.5 text-xs text-slate-300 animate-scale-in">
            <h4 className="font-extrabold text-white flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-cyan-400" />
              <span>How To Play & Controls</span>
            </h4>
            <p>
              • <strong>Swipe with Mouse or Touch</strong> anywhere across the board, or click the <strong>D-Pad buttons</strong> below.
            </p>
            <p>
              • <strong>Arrow Keys</strong> (↑ ↓ ← →) or <strong>WASD</strong> on desktop keyboard also make instant moves.
            </p>
            <p>
              • Merge identical tiles together to level up and reach the <strong>{currentLevel.targetTile} Tile</strong> to unlock <strong>+{currentLevel.starPointsReward} Star Points</strong>!
            </p>
          </div>
        )}

        {/* Interactive Dynamic Grid Board with Perimeter Arrow Clickers & Pointer Events */}
        <div className="relative w-full max-w-[390px] mx-auto select-none">
          {/* Top Edge Arrow Bumper */}
          <button
            type="button"
            onClick={() => makeMove('up')}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-16 h-5 rounded-full bg-white/10 hover:bg-amber-500/30 active:bg-amber-500 text-slate-300 active:text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-sm border border-white/20"
            aria-label="Slide Up"
            title="Slide Up (W or ↑)"
          >
            <ArrowUp size={13} />
          </button>

          {/* Left Edge Arrow Bumper */}
          <button
            type="button"
            onClick={() => makeMove('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-5 h-16 rounded-full bg-white/10 hover:bg-amber-500/30 active:bg-amber-500 text-slate-300 active:text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-sm border border-white/20"
            aria-label="Slide Left"
            title="Slide Left (A or ←)"
          >
            <ArrowLeft size={13} />
          </button>

          {/* Right Edge Arrow Bumper */}
          <button
            type="button"
            onClick={() => makeMove('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-5 h-16 rounded-full bg-white/10 hover:bg-amber-500/30 active:bg-amber-500 text-slate-300 active:text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-sm border border-white/20"
            aria-label="Slide Right"
            title="Slide Right (D or →)"
          >
            <ArrowRight size={13} />
          </button>

          {/* Bottom Edge Arrow Bumper */}
          <button
            type="button"
            onClick={() => makeMove('down')}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-16 h-5 rounded-full bg-white/10 hover:bg-amber-500/30 active:bg-amber-500 text-slate-300 active:text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-sm border border-white/20"
            aria-label="Slide Down"
            title="Slide Down (S or ↓)"
          >
            <ArrowDown size={13} />
          </button>

          {/* Board Container */}
          <div
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{ touchAction: 'none' }}
            className={`relative aspect-square w-full p-2.5 sm:p-3 rounded-3xl bg-[#070A12] border-2 border-white/15 shadow-2xl flex flex-col justify-between cursor-grab active:cursor-grabbing ${
              invalidMoveShake ? 'animate-shake' : ''
            }`}
          >
            {/* Background shimmer */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />

            {/* Dynamic Board Rows */}
            {board.map((row, r) => (
              <div
                key={r}
                className="flex justify-between gap-1.5 sm:gap-2"
                style={{ height: `${100 / gridSize - 2}%` }}
              >
                {row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="flex-1 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center relative overflow-hidden"
                  >
                    {val > 0 && <SoloTile3D value={val} size="auto" gridSize={gridSize} />}
                  </div>
                ))}
              </div>
            ))}

            {/* Level Cleared Victory Overlay Screen */}
            {levelCleared && !dismissedLevelClear && (
              <div className="absolute inset-0 z-20 rounded-3xl bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-3xl flex items-center justify-center shadow-lg shadow-amber-500/50 animate-bounce">
                  🏆
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Level Cleared!
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1">
                    Reached {currentLevel.targetTile} Tile!
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Magnificent play! You unlocked the next arena level.
                  </p>
                  {clearedRewardNotice && (
                    <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center justify-center gap-1">
                      <CheckCircle size={14} />
                      <span>{clearedRewardNotice}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 w-full max-w-[260px] pt-1">
                  {currentLevelIndex < GAME_LEVELS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleAdvanceNextLevel}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Next Level</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDismissedLevelClear(true)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer"
                    >
                      Keep Going 🚀
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDismissedLevelClear(true)}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Endless Mode
                  </button>
                </div>
              </div>
            )}

            {/* Game Over Overlay Screen */}
            {isGameOver && (
              <div className="absolute inset-0 z-20 rounded-3xl bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 animate-scale-in">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-2xl flex items-center justify-center">
                  🏁
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">No More Moves!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Final Score: <strong className="text-amber-400">{score.toLocaleString()}</strong> • Highest: <strong>{currentMaxTile}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewGame}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-xs shadow-lg shadow-orange-950/50 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Try Again 🔁
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tactile On-Screen D-Pad Controller (Visible on ALL devices - Desktop & Mobile!) */}
        <div className="pt-1 flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Tap / Click Controls (Or Swipe & Keyboard WASD):
          </span>

          <div className="flex flex-col items-center gap-1">
            {/* UP Button */}
            <button
              type="button"
              onClick={() => makeMove('up')}
              className="w-14 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:bg-amber-500/40 active:scale-90 flex flex-col items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10 shadow-sm"
              aria-label="Slide Up"
            >
              <ArrowUp size={16} />
              <span className="text-[8px] font-bold text-slate-400 -mt-0.5">W / ↑</span>
            </button>

            {/* Horizontal Row (LEFT, CENTER ICON, RIGHT) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => makeMove('left')}
                className="w-14 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:bg-amber-500/40 active:scale-90 flex flex-col items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10 shadow-sm"
                aria-label="Slide Left"
              >
                <ArrowLeft size={16} />
                <span className="text-[8px] font-bold text-slate-400 -mt-0.5">A / ←</span>
              </button>

              <div className="w-12 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Moves</span>
                <span className="text-xs font-black text-amber-400 leading-none">{movesCount}</span>
              </div>

              <button
                type="button"
                onClick={() => makeMove('right')}
                className="w-14 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:bg-amber-500/40 active:scale-90 flex flex-col items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10 shadow-sm"
                aria-label="Slide Right"
              >
                <ArrowRight size={16} />
                <span className="text-[8px] font-bold text-slate-400 -mt-0.5">D / →</span>
              </button>
            </div>

            {/* DOWN Button */}
            <button
              type="button"
              onClick={() => makeMove('down')}
              className="w-14 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:bg-amber-500/40 active:scale-90 flex flex-col items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10 shadow-sm"
              aria-label="Slide Down"
            >
              <ArrowDown size={16} />
              <span className="text-[8px] font-bold text-slate-400 -mt-0.5">S / ↓</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar: Star Board & Close */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Arena:</span>
            <strong className="text-amber-400">{currentLevel.name}</strong>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trophy size={14} className="text-amber-400" />
                <span>Rankings</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
