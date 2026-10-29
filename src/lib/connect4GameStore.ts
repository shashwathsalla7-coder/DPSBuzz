import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type {
  Connect4Board,
  Connect4Disc,
  Connect4LeaderboardEntry,
  Connect4MatchRecord,
  Connect4Player,
  Connect4Session,
  Connect4Difficulty,
} from '@/types/connect4Game';
import { addServerChatMessage, addServerNotification, getServerStore, updateConnect4InviteInChat } from './serverStore';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdvoeddebquguuqgyscl.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkdm9lZGRlYnF1Z3V1cWd5c2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDE4NjQsImV4cCI6MjEwNzcxNzg2NH0.w7HbWCGQmyK-tayzXR8l06rLzCsPQtIrnGhJQjhzUbg';

function getSupabase() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

// In-memory fast cache
declare global {
  var __dpsbuzz_connect4_games: Map<string, Connect4Session> | undefined;
  var __dpsbuzz_connect4_active: Map<string, string> | undefined;
  var __dpsbuzz_connect4_timestamps: Map<string, number> | undefined;
}

if (!globalThis.__dpsbuzz_connect4_games) {
  globalThis.__dpsbuzz_connect4_games = new Map<string, Connect4Session>();
}
if (!globalThis.__dpsbuzz_connect4_active) {
  globalThis.__dpsbuzz_connect4_active = new Map<string, string>();
}
if (!globalThis.__dpsbuzz_connect4_timestamps) {
  globalThis.__dpsbuzz_connect4_timestamps = new Map<string, number>();
}

const gamesCache = globalThis.__dpsbuzz_connect4_games;
const activePointers = globalThis.__dpsbuzz_connect4_active;
const cacheTimestamps = globalThis.__dpsbuzz_connect4_timestamps;

export const CONNECT4_ROWS = 6;
export const CONNECT4_COLS = 7;

export function createEmptyBoard(): Connect4Board {
  return Array.from({ length: CONNECT4_ROWS }, () =>
    Array.from({ length: CONNECT4_COLS }, () => null)
  );
}

/**
 * Persists raw game session to Supabase app_settings
 */
async function saveRawGameSession(session: Connect4Session): Promise<void> {
  gamesCache.set(session.gameId, session);
  cacheTimestamps.set(session.gameId, Date.now());

  const p1 = session.player1.username.toLowerCase().trim();
  const p2 = session.player2.username.toLowerCase().trim();

  if (session.status !== 'completed' && session.status !== 'declined' && session.status !== 'abandoned') {
    activePointers.set(p1, session.gameId);
    if (!session.player2.isBot) {
      activePointers.set(p2, session.gameId);
    }
  } else {
    activePointers.delete(p1);
    activePointers.delete(p2);
  }

  try {
    const supabase = getSupabase();
    const nowIso = new Date().toISOString();
    const rows = [
      { key: `connect4_game_${session.gameId}`, value: JSON.stringify(session), updated_at: nowIso },
    ];
    if (session.status !== 'completed' && session.status !== 'declined' && session.status !== 'abandoned') {
      rows.push({ key: `connect4_active_${p1}`, value: session.gameId, updated_at: nowIso });
      if (!session.player2.isBot) {
        rows.push({ key: `connect4_active_${p2}`, value: session.gameId, updated_at: nowIso });
      }
    }
    await supabase.from('app_settings').upsert(rows);

    if (session.status === 'completed' || session.status === 'declined' || session.status === 'abandoned') {
      const keysToDelete = [`connect4_active_${p1}`];
      if (!session.player2.isBot) keysToDelete.push(`connect4_active_${p2}`);
      await supabase.from('app_settings').delete().in('key', keysToDelete);
    }
  } catch (err) {
    console.warn('[connect4GameStore] Failed to save session to Supabase:', err);
  }
}

/**
 * Fetches Connect 4 game session with TTL-aware cache and Supabase sync
 */
export async function getConnect4Session(gameId: string, forceFresh: boolean = false): Promise<Connect4Session | null> {
  const cached = gamesCache.get(gameId);
  const cachedAt = cacheTimestamps.get(gameId) || 0;
  const isFresh = Date.now() - cachedAt < 1200;

  // If cache is fresh and not forced, return immediately
  if (!forceFresh && cached && (isFresh || cached.status === 'completed' || cached.status === 'declined')) {
    return cached;
  }

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `connect4_game_${gameId}`)
      .maybeSingle();

    if (data?.value) {
      const parsed: Connect4Session = JSON.parse(data.value);
      // If parsed has equal or newer moveCount/updatedAt, update cache
      if (!cached || parsed.updatedAt >= cached.updatedAt || parsed.moveCount >= cached.moveCount) {
        gamesCache.set(gameId, parsed);
        cacheTimestamps.set(gameId, Date.now());
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[connect4GameStore] Failed to fetch session from Supabase:', err);
  }

  return cached || null;
}

/**
 * Checks for 4-in-a-row given the last placed piece
 */
export function checkConnect4Win(
  board: Connect4Board,
  lastRow: number,
  lastCol: number
): { hasWon: boolean; winningCells?: [number, number][]; isDraw?: boolean } {
  const target = board[lastRow][lastCol];
  if (!target) return { hasWon: false };

  const directions: [number, number][] = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal Down-Right
    [1, -1],  // Diagonal Down-Left
  ];

  for (const [dr, dc] of directions) {
    const forwardCells: [number, number][] = [];
    const backwardCells: [number, number][] = [];

    // Look forward
    let r = lastRow + dr;
    let c = lastCol + dc;
    while (r >= 0 && r < CONNECT4_ROWS && c >= 0 && c < CONNECT4_COLS && board[r][c] === target) {
      forwardCells.push([r, c]);
      r += dr;
      c += dc;
    }

    // Look backward
    r = lastRow - dr;
    c = lastCol - dc;
    while (r >= 0 && r < CONNECT4_ROWS && c >= 0 && c < CONNECT4_COLS && board[r][c] === target) {
      backwardCells.push([r, c]);
      r -= dr;
      c -= dc;
    }

    const reversedBackward = [...backwardCells].reverse();
    const lineCells: [number, number][] = [
      ...reversedBackward,
      [lastRow, lastCol],
      ...forwardCells,
    ];

    if (lineCells.length >= 4) {
      const targetIndex = reversedBackward.length;
      let startIndex = Math.max(0, targetIndex - 3);
      if (startIndex + 4 > lineCells.length) {
        startIndex = lineCells.length - 4;
      }
      const strictlyOrdered4 = lineCells.slice(startIndex, startIndex + 4);
      return { hasWon: true, winningCells: strictlyOrdered4 };
    }
  }

  // Check if board is full (Draw)
  let isFull = true;
  for (let c = 0; c < CONNECT4_COLS; c++) {
    if (board[0][c] === null) {
      isFull = false;
      break;
    }
  }

  if (isFull) {
    return { hasWon: false, isDraw: true };
  }

  return { hasWon: false };
}

/**
 * Intelligent AI Bot move calculation with 3 distinct difficulty tiers:
 * - Easy: Casual & forgiving. Makes random moves 65% of the time, misses blocks, allows human to easily win.
 * - Hard: Tough and tactical. 100% takes immediate wins, 100% blocks opponent, avoids suicide columns, center control.
 * - Impossible: 4-ply Minimax with Alpha-Beta pruning + instant win/block reflex. Evaluates forks, multi-move traps, center dominance. Gives no easy chances, but is 100% fair and beatable by skilled humans.
 */
export function getConnect4BotMove(
  board: Connect4Board,
  botDisc: Connect4Disc = 'p2',
  difficulty: Connect4Difficulty = 'hard'
): number {
  const oppDisc: Connect4Disc = botDisc === 'p1' ? 'p2' : 'p1';

  // Work on a detached clone: NEVER mutate caller's live board
  const bCopy: Connect4Board = board.map((r) => [...r]);

  // Helper to find lowest open row in column
  const getOpenRow = (b: Connect4Board, col: number): number => {
    for (let r = CONNECT4_ROWS - 1; r >= 0; r--) {
      if (b[r][col] === null) return r;
    }
    return -1;
  };

  const getValidCols = (b: Connect4Board): number[] => {
    const valid: number[] = [];
    for (let c = 0; c < CONNECT4_COLS; c++) {
      if (b[0][c] === null) valid.push(c);
    }
    return valid;
  };

  const validCols = getValidCols(bCopy);
  if (validCols.length === 0) return 3;

  // ==========================================
  // LEVEL 1: EASY BOT
  // Casual & forgiving: human players are most likely to win!
  // ==========================================
  if (difficulty === 'easy') {
    // 65% of the time, pick a random open column
    if (Math.random() < 0.65) {
      return validCols[Math.floor(Math.random() * validCols.length)];
    }

    // 35% check for immediate bot win only (does not actively block human)
    for (const c of validCols) {
      const r = getOpenRow(bCopy, c);
      if (r !== -1) {
        bCopy[r][c] = botDisc;
        const winCheck = checkConnect4Win(bCopy, r, c);
        bCopy[r][c] = null;
        if (winCheck.hasWon) return c;
      }
    }

    // Default to a random column
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // ==========================================
  // LEVEL 2: HARD BOT
  // Solid, tough tactical play:
  // - 100% immediate win execution
  // - 100% immediate block rate
  // - Avoids giving opponent an immediate win above
  // - Prefers center columns (3, 2, 4, 1, 5, 0, 6)
  // ==========================================
  if (difficulty === 'hard') {
    // 1. Can Bot win this turn? 100% Take it!
    for (const c of validCols) {
      const r = getOpenRow(bCopy, c);
      if (r !== -1) {
        bCopy[r][c] = botDisc;
        const winCheck = checkConnect4Win(bCopy, r, c);
        bCopy[r][c] = null;
        if (winCheck.hasWon) return c;
      }
    }

    // 2. Can Opponent win next turn? 100% Block them!
    for (const c of validCols) {
      const r = getOpenRow(bCopy, c);
      if (r !== -1) {
        bCopy[r][c] = oppDisc;
        const winCheck = checkConnect4Win(bCopy, r, c);
        bCopy[r][c] = null;
        if (winCheck.hasWon) return c;
      }
    }

    // 3. Avoid moves that give opponent an immediate win on top
    const safeCols: number[] = [];
    const preferenceOrder = [3, 2, 4, 1, 5, 0, 6];

    for (const c of preferenceOrder) {
      if (!validCols.includes(c)) continue;
      const r = getOpenRow(bCopy, c);
      if (r !== -1) {
        if (r > 0) {
          bCopy[r][c] = botDisc;
          bCopy[r - 1][c] = oppDisc;
          const wouldOppWin = checkConnect4Win(bCopy, r - 1, c).hasWon;
          bCopy[r - 1][c] = null;
          bCopy[r][c] = null;
          if (!wouldOppWin) {
            safeCols.push(c);
          }
        } else {
          safeCols.push(c);
        }
      }
    }

    if (safeCols.length > 0) {
      return safeCols[0];
    }

    return validCols[0];
  }

  // ==========================================
  // LEVEL 3: IMPOSSIBLE BOT
  // Reflex win/block + 4-ply Minimax with Alpha-Beta Pruning.
  // Evaluates complete 4-window lines, forks, and center dominance in ~5-15ms.
  // ==========================================
  // 1. Immediate reflex win
  for (const c of validCols) {
    const r = getOpenRow(bCopy, c);
    if (r !== -1) {
      bCopy[r][c] = botDisc;
      const winCheck = checkConnect4Win(bCopy, r, c);
      bCopy[r][c] = null;
      if (winCheck.hasWon) return c;
    }
  }

  // 2. Immediate reflex block
  for (const c of validCols) {
    const r = getOpenRow(bCopy, c);
    if (r !== -1) {
      bCopy[r][c] = oppDisc;
      const winCheck = checkConnect4Win(bCopy, r, c);
      bCopy[r][c] = null;
      if (winCheck.hasWon) return c;
    }
  }

  const evaluateWindow = (w: Connect4Disc[]): number => {
    let pCount = 0;
    let oppCount = 0;
    let emptyCount = 0;

    for (const d of w) {
      if (d === botDisc) pCount++;
      else if (d === oppDisc) oppCount++;
      else emptyCount++;
    }

    if (pCount === 4) return 100000;
    if (oppCount === 4) return -100000;
    if (pCount === 3 && emptyCount === 1) return 1200;
    if (pCount === 2 && emptyCount === 2) return 60;
    if (oppCount === 3 && emptyCount === 1) return -1500; // Urgent block required
    if (oppCount === 2 && emptyCount === 2) return -70;

    return 0;
  };

  const evaluateBoard = (b: Connect4Board): number => {
    let score = 0;

    // Center column dominance
    for (let r = 0; r < CONNECT4_ROWS; r++) {
      if (b[r][3] === botDisc) score += 35;
      else if (b[r][3] === oppDisc) score -= 35;

      if (b[r][2] === botDisc || b[r][4] === botDisc) score += 15;
      else if (b[r][2] === oppDisc || b[r][4] === oppDisc) score -= 15;
    }

    // Horizontal windows
    for (let r = 0; r < CONNECT4_ROWS; r++) {
      for (let c = 0; c < CONNECT4_COLS - 3; c++) {
        score += evaluateWindow([b[r][c], b[r][c + 1], b[r][c + 2], b[r][c + 3]]);
      }
    }

    // Vertical windows
    for (let c = 0; c < CONNECT4_COLS; c++) {
      for (let r = 0; r < CONNECT4_ROWS - 3; r++) {
        score += evaluateWindow([b[r][c], b[r + 1][c], b[r + 2][c], b[r + 3][c]]);
      }
    }

    // Diagonal positive slope
    for (let r = 3; r < CONNECT4_ROWS; r++) {
      for (let c = 0; c < CONNECT4_COLS - 3; c++) {
        score += evaluateWindow([b[r][c], b[r - 1][c + 1], b[r - 2][c + 2], b[r - 3][c + 3]]);
      }
    }

    // Diagonal negative slope
    for (let r = 0; r < CONNECT4_ROWS - 3; r++) {
      for (let c = 0; c < CONNECT4_COLS - 3; c++) {
        score += evaluateWindow([b[r][c], b[r + 1][c + 1], b[r + 2][c + 2], b[r + 3][c + 3]]);
      }
    }

    return score;
  };

  const minimax = (
    b: Connect4Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): { col: number; score: number } => {
    const valid = getValidCols(b);
    const centerOrder = [3, 2, 4, 1, 5, 0, 6].filter((c) => valid.includes(c));

    if (depth === 0 || valid.length === 0) {
      return { col: centerOrder[0] ?? 3, score: evaluateBoard(b) };
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      let bestCol = centerOrder[0] ?? 3;

      for (const c of centerOrder) {
        const r = getOpenRow(b, c);
        if (r === -1) continue;
        b[r][c] = botDisc;
        const win = checkConnect4Win(b, r, c).hasWon;
        let score: number;
        if (win) {
          score = 100000 + depth;
        } else {
          score = minimax(b, depth - 1, alpha, beta, false).score;
        }
        b[r][c] = null;

        if (score > maxScore) {
          maxScore = score;
          bestCol = c;
        }
        alpha = Math.max(alpha, maxScore);
        if (alpha >= beta) break; // Beta cutoff
      }
      return { col: bestCol, score: maxScore };
    } else {
      let minScore = Infinity;
      let bestCol = centerOrder[0] ?? 3;

      for (const c of centerOrder) {
        const r = getOpenRow(b, c);
        if (r === -1) continue;
        b[r][c] = oppDisc;
        const oppWin = checkConnect4Win(b, r, c).hasWon;
        let score: number;
        if (oppWin) {
          score = -100000 - depth;
        } else {
          score = minimax(b, depth - 1, alpha, beta, true).score;
        }
        b[r][c] = null;

        if (score < minScore) {
          minScore = score;
          bestCol = c;
        }
        beta = Math.min(beta, minScore);
        if (alpha >= beta) break; // Alpha cutoff
      }
      return { col: bestCol, score: minScore };
    }
  };

  // 4-ply Minimax with Alpha-Beta pruning (evaluates in ~5-15ms)
  const result = minimax(bCopy, 4, -Infinity, Infinity, true);
  return result.col;
}

/**
 * Creates a new Connect 4 Game Session
 */
export async function createConnect4Session(
  inviter: { username: string; fullName: string; avatar?: string | null },
  opponent: { username: string; fullName: string; avatar?: string | null; isBot?: boolean; difficulty?: Connect4Difficulty },
  chatId: string,
  botDifficulty: Connect4Difficulty = 'hard'
): Promise<Connect4Session> {
  const gameId = `c4_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanInviter = inviter.username.toLowerCase().trim();
  const cleanOpponent = opponent.username.toLowerCase().trim();
  const isBot = Boolean(opponent.isBot || cleanOpponent === 'buzzbot');
  const chosenDifficulty = opponent.difficulty || botDifficulty || 'hard';

  const session: Connect4Session = {
    gameId,
    gameType: 'connect4',
    chatId,
    player1: {
      username: cleanInviter,
      fullName: inviter.fullName || cleanInviter,
      avatar: inviter.avatar || null,
      color: 'red',
    },
    player2: {
      username: isBot ? 'buzzbot' : cleanOpponent,
      fullName: isBot ? 'BuzzBot 🤖' : opponent.fullName || cleanOpponent,
      avatar: isBot ? null : opponent.avatar || null,
      color: 'yellow',
      isBot,
      botDifficulty: isBot ? chosenDifficulty : undefined,
    },
    board: createEmptyBoard(),
    currentTurn: cleanInviter,
    status: isBot ? 'in_progress' : 'waiting_invite',
    botDifficulty: isBot ? chosenDifficulty : undefined,
    moveCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveRawGameSession(session);

  // Send server chat notification
  if (!isBot) {
    await addServerNotification({
      userId: cleanOpponent,
      type: 'connect4',
      title: '🔴 Connect 4 Challenge!',
      body: `@${cleanInviter} challenged you to a Connect 4 duel!`,
      link: '/chats',
    }).catch(() => {});
  }

  return session;
}

/**
 * Accepts a Connect 4 Game Invite
 */
export async function acceptConnect4Invite(gameId: string, username: string): Promise<Connect4Session | null> {
  const session = await getConnect4Session(gameId);
  if (!session) return null;

  const cleanUser = username.toLowerCase().trim();
  const p2User = session.player2.username.toLowerCase().trim();

  if (cleanUser !== p2User && !session.player2.isBot) {
    return null;
  }

  session.status = 'in_progress';
  session.updatedAt = Date.now();
  await saveRawGameSession(session);
  updateConnect4InviteInChat(gameId, 'in_progress').catch(() => {});

  return session;
}

/**
 * Declines a Connect 4 Game Invite
 */
export async function declineConnect4Invite(gameId: string, username: string): Promise<Connect4Session | null> {
  const session = await getConnect4Session(gameId);
  if (!session) return null;

  session.status = 'declined';
  session.updatedAt = Date.now();
  await saveRawGameSession(session);
  updateConnect4InviteInChat(gameId, 'declined').catch(() => {});
  return session;
}

/**
 * Drops a piece into a column
 */
export async function dropConnect4Piece(
  gameId: string,
  username: string,
  col: number
): Promise<{
  success: boolean;
  session?: Connect4Session;
  humanMove?: { row: number; col: number; player: Connect4Disc };
  botMove?: { row: number; col: number; player: Connect4Disc } | null;
  error?: string;
}> {
  const session = await getConnect4Session(gameId, true);
  if (!session) return { success: false, error: 'Game session not found' };

  if (session.status !== 'in_progress') {
    return { success: false, error: 'Game is not currently in progress' };
  }

  if (col < 0 || col >= CONNECT4_COLS) {
    return { success: false, error: 'Invalid column' };
  }

  const cleanUser = username.toLowerCase().trim();
  const isP1 = session.player1.username.toLowerCase().trim() === cleanUser;
  const isP2 = session.player2.username.toLowerCase().trim() === cleanUser;

  if (!isP1 && !isP2) {
    return { success: false, error: 'You are not a player in this game' };
  }

  if (session.currentTurn.toLowerCase().trim() !== cleanUser) {
    return { success: false, error: 'It is not your turn' };
  }

  // Find open row
  let targetRow = -1;
  for (let r = CONNECT4_ROWS - 1; r >= 0; r--) {
    if (session.board[r][col] === null) {
      targetRow = r;
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, error: 'Column is already full' };
  }

  const currentDisc: Connect4Disc = isP1 ? 'p1' : 'p2';
  session.board[targetRow][col] = currentDisc;
  session.moveCount += 1;
  session.lastMove = { row: targetRow, col, player: currentDisc };
  session.updatedAt = Date.now();

  // Check for win
  const winCheck = checkConnect4Win(session.board, targetRow, col);

  if (winCheck.hasWon) {
    session.status = 'completed';
    session.winner = cleanUser;
    session.winningCells = winCheck.winningCells;
    await recordConnect4MatchResults(session);
    await saveRawGameSession(session);
    return {
      success: true,
      session,
      humanMove: { row: targetRow, col, player: currentDisc },
      botMove: null,
    };
  }

  if (winCheck.isDraw) {
    session.status = 'completed';
    session.winner = 'draw';
    await recordConnect4MatchResults(session);
    await saveRawGameSession(session);
    return {
      success: true,
      session,
      humanMove: { row: targetRow, col, player: currentDisc },
      botMove: null,
    };
  }

  // Switch turn
  const nextUser = isP1 ? session.player2.username : session.player1.username;
  session.currentTurn = nextUser;

  let botMove: { row: number; col: number; player: Connect4Disc } | null = null;

  // Handle Bot Turn if next player is BuzzBot
  const isP2Bot = Boolean(session.player2.isBot || session.player2.username.toLowerCase().trim() === 'buzzbot');
  const isP1Bot = Boolean(session.player1.isBot || session.player1.username.toLowerCase().trim() === 'buzzbot');
  const isBotNext =
    (isP2Bot && nextUser.toLowerCase().trim() === session.player2.username.toLowerCase().trim()) ||
    (isP1Bot && nextUser.toLowerCase().trim() === session.player1.username.toLowerCase().trim());

  if (isBotNext) {
    const botDisc: Connect4Disc =
      isP2Bot && nextUser.toLowerCase().trim() === session.player2.username.toLowerCase().trim() ? 'p2' : 'p1';
    const botDiff = session.botDifficulty || 'hard';
    const botCol = getConnect4BotMove(session.board, botDisc, botDiff);
    let botRow = -1;
    for (let r = CONNECT4_ROWS - 1; r >= 0; r--) {
      if (session.board[r][botCol] === null) {
        botRow = r;
        break;
      }
    }

    if (botRow !== -1) {
      session.board[botRow][botCol] = botDisc;
      session.moveCount += 1;
      session.lastMove = { row: botRow, col: botCol, player: botDisc };
      botMove = { row: botRow, col: botCol, player: botDisc };

      const botWinCheck = checkConnect4Win(session.board, botRow, botCol);
      if (botWinCheck.hasWon) {
        session.status = 'completed';
        session.winner = nextUser;
        session.winningCells = botWinCheck.winningCells;
        await recordConnect4MatchResults(session);
      } else if (botWinCheck.isDraw) {
        session.status = 'completed';
        session.winner = 'draw';
        await recordConnect4MatchResults(session);
      } else {
        session.currentTurn = isP1 ? session.player1.username : session.player2.username;
      }
    }
  }

  await saveRawGameSession(session);
  return {
    success: true,
    session,
    humanMove: { row: targetRow, col, player: currentDisc },
    botMove,
  };
}

/**
 * Forfeits / Resigns a game
 */
export async function forfeitConnect4Game(
  gameId: string,
  username: string
): Promise<Connect4Session | null> {
  const session = await getConnect4Session(gameId);
  if (!session) return null;

  const cleanUser = username.toLowerCase().trim();
  const isP1 = session.player1.username.toLowerCase().trim() === cleanUser;
  const isP2 = session.player2.username.toLowerCase().trim() === cleanUser;

  if (!isP1 && !isP2) return null;

  session.status = 'completed';
  session.forfeitedBy = cleanUser;
  session.winner = isP1 ? session.player2.username : session.player1.username;
  session.updatedAt = Date.now();

  await recordConnect4MatchResults(session);
  await saveRawGameSession(session);
  return session;
}

/**
 * Requests a rematch
 */
export async function requestConnect4Rematch(
  gameId: string,
  username: string,
  difficulty?: Connect4Difficulty
): Promise<Connect4Session | null> {
  const oldSession = await getConnect4Session(gameId);
  if (!oldSession) return null;

  const botDiff = difficulty || oldSession.botDifficulty || 'hard';

  if (oldSession.player2.isBot) {
    const newSession = await createConnect4Session(
      {
        username: oldSession.player1.username,
        fullName: oldSession.player1.fullName,
        avatar: oldSession.player1.avatar,
      },
      {
        username: 'buzzbot',
        fullName: 'BuzzBot 🤖',
        avatar: null,
        isBot: true,
        difficulty: botDiff,
      },
      oldSession.chatId,
      botDiff
    );
    return newSession;
  }

  // Swap starter on human vs human rematch
  const newSession = await createConnect4Session(
    {
      username: oldSession.player2.username,
      fullName: oldSession.player2.fullName,
      avatar: oldSession.player2.avatar,
    },
    {
      username: oldSession.player1.username,
      fullName: oldSession.player1.fullName,
      avatar: oldSession.player1.avatar,
      isBot: false,
    },
    oldSession.chatId
  );

  return newSession;
}

/**
 * Updates bot difficulty on an active or finished session
 */
export async function setConnect4Difficulty(
  gameId: string,
  difficulty: Connect4Difficulty
): Promise<Connect4Session | null> {
  const session = await getConnect4Session(gameId);
  if (!session) return null;
  session.botDifficulty = difficulty;
  if (session.player2.isBot) {
    session.player2.botDifficulty = difficulty;
  }
  session.updatedAt = Date.now();
  await saveRawGameSession(session);
  return session;
}

/**
 * Reconnect active game for user
 */
export async function getActiveConnect4GameForUser(username: string): Promise<Connect4Session | null> {
  const clean = username.toLowerCase().trim();
  const cachedGid = activePointers.get(clean);
  if (cachedGid) {
    const s = await getConnect4Session(cachedGid);
    if (s && s.status === 'in_progress') return s;
  }

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `connect4_active_${clean}`)
      .maybeSingle();

    if (data?.value) {
      const s = await getConnect4Session(data.value);
      if (s && s.status === 'in_progress') return s;
    }
  } catch {}

  return null;
}

/**
 * Records match results, updates leaderboard and match history in Supabase
 */
async function recordConnect4MatchResults(session: Connect4Session): Promise<void> {
  try {
    const supabase = getSupabase();
    const p1 = session.player1.username.toLowerCase().trim();
    const p2 = session.player2.username.toLowerCase().trim();
    const isBot = session.player2.isBot;

    const matchRecord: Connect4MatchRecord = {
      matchId: uuidv4(),
      gameId: session.gameId,
      player1: session.player1,
      player2: session.player2,
      winner: session.winner || 'draw',
      forfeitedBy: session.forfeitedBy || null,
      totalMoves: session.moveCount,
      playedAt: Date.now(),
    };

    // 1. Append to match history
    let history: Connect4MatchRecord[] = [];
    const { data: histData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'connect4_match_history')
      .maybeSingle();

    if (histData?.value) {
      try {
        history = JSON.parse(histData.value);
      } catch {}
    }
    history.unshift(matchRecord);
    if (history.length > 100) history = history.slice(0, 100);

    // 2. Update Leaderboard
    let leaderboard: Connect4LeaderboardEntry[] = [];
    const { data: lbData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'connect4_leaderboard')
      .maybeSingle();

    if (lbData?.value) {
      try {
        leaderboard = JSON.parse(lbData.value);
      } catch {}
    }

    const updatePlayerStats = (player: Connect4Player, didWin: boolean, didDraw: boolean) => {
      if (player.isBot || player.username === 'buzzbot') return;

      const idx = leaderboard.findIndex((e) => e.username.toLowerCase().trim() === player.username.toLowerCase().trim());
      const existing = idx !== -1 ? leaderboard[idx] : null;

      const wins = (existing?.wins || 0) + (didWin ? 1 : 0);
      const draws = (existing?.draws || 0) + (didDraw ? 1 : 0);
      const losses = (existing?.losses || 0) + (!didWin && !didDraw ? 1 : 0);
      const matchesPlayed = wins + losses + draws;
      const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
      // Formula: (wins * 50) + (losses * 10) + (draws * 20) with 0 base points
      const points = wins * 50 + losses * 10 + draws * 20;

      const updated: Connect4LeaderboardEntry = {
        username: player.username,
        fullName: player.fullName,
        avatar: player.avatar || null,
        matchesPlayed,
        wins,
        losses,
        draws,
        winRate,
        points,
      };

      if (idx !== -1) {
        leaderboard[idx] = updated;
      } else {
        leaderboard.push(updated);
      }
    };

    const isDraw = session.winner === 'draw';
    const p1Won = session.winner?.toLowerCase().trim() === p1;
    const p2Won = session.winner?.toLowerCase().trim() === p2;

    updatePlayerStats(session.player1, p1Won, isDraw);
    if (!isBot) {
      updatePlayerStats(session.player2, p2Won, isDraw);
    }

    // Sort leaderboard by points descending, then winRate, then wins
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.wins - a.wins;
    });

    leaderboard = leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    await supabase.from('app_settings').upsert([
      { key: 'connect4_match_history', value: JSON.stringify(history), updated_at: new Date().toISOString() },
      { key: 'connect4_leaderboard', value: JSON.stringify(leaderboard), updated_at: new Date().toISOString() },
    ]);

    updateConnect4InviteInChat(session.gameId, 'completed', {
      winner: session.winner || undefined,
      forfeitedBy: session.forfeitedBy || undefined,
    }).catch(() => {});
  } catch (err) {
    console.warn('[connect4GameStore] Error recording match results:', err);
  }
}

/**
 * Fetches Connect 4 Leaderboard
 */
export async function getConnect4Leaderboard(viewerUsername?: string): Promise<Connect4LeaderboardEntry[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'connect4_leaderboard')
      .maybeSingle();

    if (data?.value) {
      const parsed: Connect4LeaderboardEntry[] = JSON.parse(data.value);
      // Guarantee exact mathematical score
      return parsed.map((entry, idx) => {
        const calculatedPoints = entry.wins * 50 + entry.losses * 10 + (entry.draws || 0) * 20;
        const total = entry.wins + entry.losses + (entry.draws || 0);
        const rate = total > 0 ? Math.round((entry.wins / total) * 100) : 0;
        return {
          ...entry,
          points: calculatedPoints,
          matchesPlayed: total,
          winRate: rate,
          rank: idx + 1,
        };
      });
    }
  } catch {}

  return [];
}

/**
 * Fetches Connect 4 Match History
 */
export async function getConnect4MatchHistory(
  targetUsername?: string,
  viewerUsername?: string
): Promise<Connect4MatchRecord[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'connect4_match_history')
      .maybeSingle();

    if (data?.value) {
      let list: Connect4MatchRecord[] = JSON.parse(data.value);
      if (targetUsername) {
        const clean = targetUsername.toLowerCase().trim();
        list = list.filter(
          (m) =>
            m.player1.username.toLowerCase().trim() === clean ||
            m.player2.username.toLowerCase().trim() === clean
        );
      }
      return list;
    }
  } catch {}

  return [];
}
