import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { CRICKETERS, getCricketerById } from '@/data/cricketers';
import type {
  CricketGameSession,
  CricketLeaderboardEntry,
  CricketMatchRecord,
  AnswerType,
} from '@/types/cricketGame';

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
  var __dpsbuzz_cricket_games: Map<string, CricketGameSession> | undefined;
  var __dpsbuzz_cricket_active: Map<string, string> | undefined;
}

if (!globalThis.__dpsbuzz_cricket_games) {
  globalThis.__dpsbuzz_cricket_games = new Map<string, CricketGameSession>();
}
if (!globalThis.__dpsbuzz_cricket_active) {
  globalThis.__dpsbuzz_cricket_active = new Map<string, string>();
}

const gamesCache = globalThis.__dpsbuzz_cricket_games;
const activePointers = globalThis.__dpsbuzz_cricket_active;

// Initial default leaderboard (empty, populated strictly by real student matches)
const DEFAULT_LEADERBOARD: CricketLeaderboardEntry[] = [];

/**
 * Persists raw game session to Supabase app_settings
 */
async function saveRawGameSession(session: CricketGameSession): Promise<void> {
  gamesCache.set(session.gameId, session);

  const p1 = session.player1.username.toLowerCase().trim();
  const p2 = session.player2.username.toLowerCase().trim();

  if (session.status !== 'completed' && session.status !== 'declined' && session.status !== 'abandoned') {
    activePointers.set(p1, session.gameId);
    activePointers.set(p2, session.gameId);
  } else {
    activePointers.delete(p1);
    activePointers.delete(p2);
  }

  try {
    const supabase = getSupabase();
    const nowIso = new Date().toISOString();
    const rows = [
      { key: `cricket_game_${session.gameId}`, value: JSON.stringify(session), updated_at: nowIso },
    ];
    if (session.status !== 'completed' && session.status !== 'declined' && session.status !== 'abandoned') {
      rows.push({ key: `cricket_active_${p1}`, value: session.gameId, updated_at: nowIso });
      rows.push({ key: `cricket_active_${p2}`, value: session.gameId, updated_at: nowIso });
    }
    await supabase.from('app_settings').upsert(rows);

    if (session.status === 'completed' || session.status === 'declined' || session.status === 'abandoned') {
      await supabase.from('app_settings').delete().in('key', [`cricket_active_${p1}`, `cricket_active_${p2}`]);
    }
  } catch (err) {
    console.warn('[cricketGameStore] Failed to save session to Supabase:', err);
  }
}

/**
 * Fetches raw game session (including secret cricketer selections)
 */
export async function getRawGameSession(gameId: string): Promise<CricketGameSession | null> {
  if (gamesCache.has(gameId)) {
    return gamesCache.get(gameId)!;
  }

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `cricket_game_${gameId}`)
      .maybeSingle();

    if (data?.value) {
      const parsed: CricketGameSession = JSON.parse(data.value);
      gamesCache.set(gameId, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn('[cricketGameStore] Failed to fetch session from Supabase:', err);
  }

  return null;
}

/**
 * Returns a SANITIZED game session for the requesting user.
 * SECURITY GUARD: Strips opponent's secret selection so players cannot cheat via network inspection!
 */
export function sanitizeGameSession(
  session: CricketGameSession,
  requestingUsername: string
): CricketGameSession {
  const cleanReq = (requestingUsername || '').toLowerCase().trim();
  const p1U = (session.player1?.username || '').toLowerCase().trim();
  const p2U = (session.player2?.username || '').toLowerCase().trim();
  const isPlayer1 = p1U === cleanReq;
  const isPlayer2 = p2U === cleanReq;
  const isCompleted = session.status === 'completed';

  const sanitized: CricketGameSession = {
    ...session,
    player1: {
      ...session.player1,
      // Only show cricketer ID if user is Player 1 or if game has completed
      selectedCricketerId: isPlayer1 || isCompleted ? session.player1.selectedCricketerId : null,
      hasSelected: Boolean(session.player1.selectedCricketerId),
    },
    player2: {
      ...session.player2,
      // Only show cricketer ID if user is Player 2 or if game has completed
      selectedCricketerId: isPlayer2 || isCompleted ? session.player2.selectedCricketerId : null,
      hasSelected: Boolean(session.player2.selectedCricketerId),
    },
    revealedPlayer1Cricketer: isCompleted ? getCricketerById(session.player1.selectedCricketerId || '') || null : null,
    revealedPlayer2Cricketer: isCompleted ? getCricketerById(session.player2.selectedCricketerId || '') || null : null,
  };

  return sanitized;
}

/**
 * Create a new Guess the Cricketer game session
 */
export async function createGameSession(
  inviter: { username: string; fullName: string; avatar?: string | null },
  opponent: { username: string; fullName: string; avatar?: string | null },
  chatId: string
): Promise<CricketGameSession> {
  const gameId = `cricket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanInviter = inviter.username.toLowerCase().trim();
  const cleanOpponent = opponent.username.toLowerCase().trim();

  const session: CricketGameSession = {
    gameId,
    chatId,
    status: 'waiting_invite',
    player1: {
      username: cleanInviter,
      fullName: inviter.fullName || cleanInviter,
      avatar: inviter.avatar || null,
      selectedCricketerId: null,
      hasSelected: false,
      score: 0,
      correctGuesses: 0,
      incorrectGuesses: 0,
      questionsAsked: 0,
    },
    player2: {
      username: cleanOpponent,
      fullName: opponent.fullName || cleanOpponent,
      avatar: opponent.avatar || null,
      selectedCricketerId: null,
      hasSelected: false,
      score: 0,
      correctGuesses: 0,
      incorrectGuesses: 0,
      questionsAsked: 0,
    },
    currentTurn: cleanInviter,
    turnState: 'ask_or_guess',
    activeQuestion: null,
    timeline: [
      {
        id: uuidv4(),
        type: 'system',
        by: 'system',
        byName: 'DPSBuzz Match Umpire',
        questionText: `@${cleanInviter} invited @${cleanOpponent} to play Guess the Cricketer! 🏏`,
        timestamp: Date.now(),
      },
    ],
    winner: null,
    winningGuess: null,
    startedAt: Date.now(),
    completedAt: null,
  };

  await saveRawGameSession(session);
  return session;
}

/**
 * Accept game invite
 */
export async function acceptGameInvite(
  gameId: string,
  username: string
): Promise<CricketGameSession | null> {
  const session = await getRawGameSession(gameId);
  if (!session) return null;

  const clean = username.toLowerCase().trim();
  const p1 = (session.player1?.username || '').toLowerCase().trim();
  const p2 = (session.player2?.username || '').toLowerCase().trim();
  if (p2 !== clean && p1 !== clean) {
    return null;
  }

  session.status = 'selecting';
  session.timeline.push({
    id: uuidv4(),
    type: 'system',
    by: clean,
    byName: clean === p2 ? (session.player2?.fullName || p2) : (session.player1?.fullName || p1),
    questionText: `Challenge accepted! Both players are now choosing their secret cricketer 🔒`,
    timestamp: Date.now(),
  });

  await saveRawGameSession(session);
  return session;
}

/**
 * Decline game invite
 */
export async function declineGameInvite(
  gameId: string,
  username: string
): Promise<CricketGameSession | null> {
  const session = await getRawGameSession(gameId);
  if (!session) return null;

  session.status = 'declined';
  session.completedAt = Date.now();
  session.timeline.push({
    id: uuidv4(),
    type: 'system',
    by: username.toLowerCase().trim(),
    byName: username,
    questionText: `The challenge was declined.`,
    timestamp: Date.now(),
  });

  await saveRawGameSession(session);
  return session;
}

/**
 * Select a secret cricketer
 */
export async function selectSecretCricketer(
  gameId: string,
  username: string,
  cricketerId: string
): Promise<{ success: boolean; session?: CricketGameSession; error?: string }> {
  const session = await getRawGameSession(gameId);
  if (!session) return { success: false, error: 'Game not found' };

  const cricketer = getCricketerById(cricketerId);
  if (!cricketer) return { success: false, error: 'Invalid cricketer selection' };

  const clean = username.toLowerCase().trim();
  const isP1 = session.player1.username === clean;
  const isP2 = session.player2.username === clean;

  if (!isP1 && !isP2) return { success: false, error: 'Unauthorized player' };

  if (isP1) {
    session.player1.selectedCricketerId = cricketer.id;
    session.player1.hasSelected = true;
  } else {
    session.player2.selectedCricketerId = cricketer.id;
    session.player2.hasSelected = true;
  }

  session.timeline.push({
    id: uuidv4(),
    type: 'system',
    by: clean,
    byName: isP1 ? session.player1.fullName : session.player2.fullName,
    questionText: `@${clean} locked in their secret cricketer! 🔒`,
    timestamp: Date.now(),
  });

  // If both players have selected, advance to in_progress!
  if (session.player1.hasSelected && session.player2.hasSelected) {
    session.status = 'in_progress';
    session.turnState = 'ask_or_guess';
    session.currentTurn = session.player1.username; // Player 1 starts
    session.timeline.push({
      id: uuidv4(),
      type: 'system',
      by: 'system',
      byName: 'DPSBuzz Match Umpire',
      questionText: `Both secret cricketers are locked! Turn 1 starts with @${session.player1.username}. Ask a Yes/No question or guess! 🏏`,
      timestamp: Date.now(),
    });
  }

  await saveRawGameSession(session);
  return { success: true, session };
}

/**
 * Ask a Question about the opponent's secret cricketer
 */
export async function askQuestion(
  gameId: string,
  username: string,
  questionText: string
): Promise<{ success: boolean; session?: CricketGameSession; error?: string }> {
  const session = await getRawGameSession(gameId);
  if (!session) return { success: false, error: 'Game not found' };
  if (session.status !== 'in_progress') return { success: false, error: 'Game is not in progress' };

  const clean = username.toLowerCase().trim();
  if (session.currentTurn !== clean) return { success: false, error: 'Not your turn' };
  if (session.turnState !== 'ask_or_guess') return { success: false, error: 'Waiting for answer to previous question' };

  const cleanQ = questionText.trim();
  if (!cleanQ) return { success: false, error: 'Question cannot be empty' };

  const questionId = uuidv4();
  session.activeQuestion = {
    id: questionId,
    askedBy: clean,
    questionText: cleanQ,
    timestamp: Date.now(),
  };
  session.turnState = 'awaiting_answer';

  const isP1 = session.player1.username === clean;
  if (isP1) {
    session.player1.questionsAsked = (session.player1.questionsAsked || 0) + 1;
  } else {
    session.player2.questionsAsked = (session.player2.questionsAsked || 0) + 1;
  }

  await saveRawGameSession(session);
  return { success: true, session };
}

/**
 * Answer the active question
 */
export async function answerQuestion(
  gameId: string,
  username: string,
  answer: AnswerType
): Promise<{ success: boolean; session?: CricketGameSession; error?: string }> {
  const session = await getRawGameSession(gameId);
  if (!session) return { success: false, error: 'Game not found' };
  if (session.status !== 'in_progress') return { success: false, error: 'Game is not in progress' };
  if (!session.activeQuestion) return { success: false, error: 'No active question to answer' };

  const clean = username.toLowerCase().trim();
  // Only the opponent of the person who asked can answer!
  if (session.activeQuestion.askedBy === clean) {
    return { success: false, error: 'You cannot answer your own question' };
  }

  const askerName =
    session.activeQuestion.askedBy === session.player1.username
      ? session.player1.fullName
      : session.player2.fullName;
  const answererName =
    clean === session.player1.username ? session.player1.fullName : session.player2.fullName;

  session.timeline.push({
    id: session.activeQuestion.id,
    type: 'question',
    by: session.activeQuestion.askedBy,
    byName: askerName,
    questionText: session.activeQuestion.questionText,
    answer,
    timestamp: Date.now(),
  });

  session.activeQuestion = null;
  session.turnState = 'ask_or_guess';
  // Turn passes to the answering player
  session.currentTurn = clean;

  await saveRawGameSession(session);
  return { success: true, session };
}

/**
 * Submit a final guess for the opponent's cricketer
 */
export async function submitGuess(
  gameId: string,
  username: string,
  guessedCricketerId: string
): Promise<{ success: boolean; session?: CricketGameSession; isCorrect?: boolean; error?: string }> {
  const session = await getRawGameSession(gameId);
  if (!session) return { success: false, error: 'Game not found' };
  if (session.status !== 'in_progress') return { success: false, error: 'Game is not in progress' };

  const clean = username.toLowerCase().trim();
  if (session.currentTurn !== clean) return { success: false, error: 'Not your turn' };
  if (session.turnState !== 'ask_or_guess') return { success: false, error: 'Must answer current question first' };

  const guessedCricketer = getCricketerById(guessedCricketerId);
  if (!guessedCricketer) return { success: false, error: 'Invalid cricketer' };

  const isP1 = session.player1.username === clean;
  const targetPlayer = isP1 ? session.player2 : session.player1;
  const guesserPlayer = isP1 ? session.player1 : session.player2;

  const opponentSecretId = targetPlayer.selectedCricketerId || '';
  const isCorrect = opponentSecretId.toLowerCase() === guessedCricketer.id.toLowerCase();

  if (isCorrect) {
    // CORRECT GUESS - GAME WON!
    session.status = 'completed';
    session.winner = clean;
    session.winningGuess = guessedCricketer.name;
    session.completedAt = Date.now();

    guesserPlayer.score += 50;
    guesserPlayer.correctGuesses = (guesserPlayer.correctGuesses || 0) + 1;

    session.timeline.push({
      id: uuidv4(),
      type: 'guess',
      by: clean,
      byName: guesserPlayer.fullName,
      cricketerName: guessedCricketer.name,
      isCorrect: true,
      timestamp: Date.now(),
    });

    session.timeline.push({
      id: uuidv4(),
      type: 'system',
      by: 'system',
      byName: 'DPSBuzz Match Umpire',
      questionText: `🏆 VICTORY! @${clean} correctly deduced that @${targetPlayer.username}'s secret cricketer is ${guessedCricketer.name}!`,
      timestamp: Date.now(),
    });

    // Record completed match and update persistent leaderboard
    await recordMatchCompleted(session);
  } else {
    // INCORRECT GUESS - TURN PASSES TO OPPONENT
    guesserPlayer.score = Math.max(0, guesserPlayer.score - 5);
    guesserPlayer.incorrectGuesses = (guesserPlayer.incorrectGuesses || 0) + 1;

    session.timeline.push({
      id: uuidv4(),
      type: 'guess',
      by: clean,
      byName: guesserPlayer.fullName,
      cricketerName: guessedCricketer.name,
      isCorrect: false,
      timestamp: Date.now(),
    });

    session.timeline.push({
      id: uuidv4(),
      type: 'system',
      by: 'system',
      byName: 'DPSBuzz Match Umpire',
      questionText: `@${clean} guessed ${guessedCricketer.name} — Incorrect! Turn passes to @${targetPlayer.username} ❌`,
      timestamp: Date.now(),
    });

    session.currentTurn = targetPlayer.username;
    session.turnState = 'ask_or_guess';
  }

  await saveRawGameSession(session);
  return { success: true, session, isCorrect };
}

/**
 * Request or start a Rematch
 */
export async function requestRematch(
  gameId: string,
  username: string
): Promise<{ success: boolean; session?: CricketGameSession; error?: string }> {
  const session = await getRawGameSession(gameId);
  if (!session) return { success: false, error: 'Game not found' };

  const clean = username.toLowerCase().trim();
  const isP1 = session.player1.username === clean;
  const isP2 = session.player2.username === clean;
  if (!isP1 && !isP2) return { success: false, error: 'Unauthorized player' };

  // Reset session for a new round between the same players
  session.status = 'selecting';
  session.player1.selectedCricketerId = null;
  session.player1.hasSelected = false;
  session.player2.selectedCricketerId = null;
  session.player2.hasSelected = false;
  session.winner = null;
  session.winningGuess = null;
  session.activeQuestion = null;
  session.turnState = 'ask_or_guess';
  session.completedAt = null;

  session.timeline = [
    {
      id: uuidv4(),
      type: 'rematch',
      by: clean,
      byName: isP1 ? session.player1.fullName : session.player2.fullName,
      questionText: `Rematch started! Choose a new secret cricketer 🔄`,
      timestamp: Date.now(),
    },
  ];

  await saveRawGameSession(session);
  return { success: true, session };
}

/**
 * Get active game for user reconnection after refresh
 */
export async function getActiveGameForUser(username: string): Promise<CricketGameSession | null> {
  const clean = username.toLowerCase().trim();
  let gameId = activePointers.get(clean);

  if (!gameId) {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', `cricket_active_${clean}`)
        .maybeSingle();

      if (data?.value) {
        gameId = data.value;
      }
    } catch {}
  }

  if (gameId) {
    const raw = await getRawGameSession(gameId);
    if (raw && raw.status !== 'completed' && raw.status !== 'declined' && raw.status !== 'abandoned') {
      return sanitizeGameSession(raw, clean);
    }
  }

  return null;
}

/**
 * Record a completed match to persistent history and update leaderboard
 */
async function recordMatchCompleted(session: CricketGameSession): Promise<void> {
  const p1Cricketer = getCricketerById(session.player1.selectedCricketerId || '')?.name || 'Unknown';
  const p2Cricketer = getCricketerById(session.player2.selectedCricketerId || '')?.name || 'Unknown';

  const matchRecord: CricketMatchRecord = {
    id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    gameId: session.gameId,
    player1Username: session.player1.username,
    player1Name: session.player1.fullName,
    player1Cricketer: p1Cricketer,
    player2Username: session.player2.username,
    player2Name: session.player2.fullName,
    player2Cricketer: p2Cricketer,
    winnerUsername: session.winner || 'Draw',
    winnerName: session.winner === session.player1.username ? session.player1.fullName : session.player2.fullName,
    turns: session.timeline.length,
    completedAt: Date.now(),
  };

  try {
    const supabase = getSupabase();
    // 1. Fetch current match history
    const { data: histData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'cricket_match_history')
      .maybeSingle();

    const history: CricketMatchRecord[] = histData?.value ? JSON.parse(histData.value) : [];
    history.unshift(matchRecord);
    // Keep top 50 recent matches
    const trimmedHistory = history.slice(0, 50);

    // 2. Fetch current leaderboard
    const { data: lbData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'cricket_leaderboard')
      .maybeSingle();

    const TEST_DUMMIES = new Set(['rohan728', 'p1_deduction_test', 'p2_deduction_test', 'testuser1', 'testuser2']);
    const leaderboard: CricketLeaderboardEntry[] = lbData?.value
      ? JSON.parse(lbData.value).filter((e: CricketLeaderboardEntry) => !TEST_DUMMIES.has(e.username.toLowerCase()))
      : [];

    // Helper to update player stats
    const updatePlayerStats = (player: typeof session.player1, isWinner: boolean) => {
      let entry = leaderboard.find((e) => e.username.toLowerCase() === player.username.toLowerCase());
      if (!entry) {
        entry = {
          username: player.username,
          fullName: player.fullName,
          avatar: player.avatar,
          points: 100,
          wins: 0,
          matches: 0,
          correctGuesses: 0,
          incorrectGuesses: 0,
          winRate: 0,
        };
        leaderboard.push(entry);
      }
      entry.matches += 1;
      if (isWinner) {
        entry.wins += 1;
        entry.points += 60;
        entry.correctGuesses += 1;
      } else {
        entry.points += 15; // Participation points
      }
      entry.incorrectGuesses += player.incorrectGuesses || 0;
      entry.winRate = Math.round((entry.wins / entry.matches) * 100);
    };

    updatePlayerStats(session.player1, session.winner === session.player1.username);
    updatePlayerStats(session.player2, session.winner === session.player2.username);

    // Sort leaderboard by points desc
    leaderboard.sort((a, b) => b.points - a.points);

    const nowIso = new Date().toISOString();
    await supabase.from('app_settings').upsert([
      { key: 'cricket_match_history', value: JSON.stringify(trimmedHistory), updated_at: nowIso },
      { key: 'cricket_leaderboard', value: JSON.stringify(leaderboard), updated_at: nowIso },
    ]);
  } catch (err) {
    console.warn('[cricketGameStore] Failed to update leaderboard / match history in Supabase:', err);
  }
}

/**
 * Get persistent leaderboard
 */
export async function getCricketLeaderboard(): Promise<CricketLeaderboardEntry[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'cricket_leaderboard')
      .maybeSingle();

    if (data?.value) {
      const parsed: CricketLeaderboardEntry[] = JSON.parse(data.value);
      const TEST_DUMMIES = new Set(['rohan728', 'p1_deduction_test', 'p2_deduction_test', 'testuser1', 'testuser2']);
      return parsed.filter((e) => !TEST_DUMMIES.has(e.username.toLowerCase()));
    }
  } catch {}

  return [];
}

/**
 * Get completed match history
 */
export async function getCricketMatchHistory(username?: string): Promise<CricketMatchRecord[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'cricket_match_history')
      .maybeSingle();

    if (data?.value) {
      const records: CricketMatchRecord[] = JSON.parse(data.value);
      const TEST_DUMMIES = new Set(['rohan728', 'p1_deduction_test', 'p2_deduction_test', 'testuser1', 'testuser2']);
      const filtered = records.filter(
        (r) =>
          !TEST_DUMMIES.has(r.player1Username.toLowerCase()) &&
          !TEST_DUMMIES.has(r.player2Username.toLowerCase())
      );
      if (username) {
        const clean = username.toLowerCase().trim();
        return filtered.filter(
          (r) => r.player1Username.toLowerCase() === clean || r.player2Username.toLowerCase() === clean
        );
      }
      return filtered;
    }
  } catch {}

  return [];
}
