import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { CRICKETERS, getCricketerById } from '@/data/cricketers';
import type {
  CricketGameSession,
  CricketLeaderboardEntry,
  CricketMatchRecord,
  AnswerType,
} from '@/types/cricketGame';
import { getServerStore, addServerNotification, updateCricketInviteInChat, addServerChatMessage } from './serverStore';

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
      remainingGuesses: 3,
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
      remainingGuesses: 3,
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
  const accepterName = clean === p2 ? (session.player2?.fullName || p2) : (session.player1?.fullName || p1);
  session.timeline.push({
    id: uuidv4(),
    type: 'system',
    by: clean,
    byName: accepterName,
    questionText: `Challenge accepted! Both players are now choosing their secret cricketer 🔒`,
    timestamp: Date.now(),
  });

  await saveRawGameSession(session);

  // Update chat message invite card to 'selecting'
  updateCricketInviteInChat(gameId, 'selecting').catch(() => {});

  // Send in-app notification to the opponent (so they know challenge was accepted and they should pick!)
  const otherUser = clean === p1 ? p2 : p1;
  addServerNotification({
    userId: otherUser,
    type: 'cricket',
    title: 'Challenge Accepted! 🏏',
    body: `@${clean} (${accepterName}) accepted your cricket challenge! Choose your secret cricketer to start.`,
    link: `/chats`,
  }).catch(() => {});

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
  updateCricketInviteInChat(gameId, 'declined').catch(() => {});
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

    updateCricketInviteInChat(gameId, 'in_progress').catch(() => {});

    // Notify both players that the match is live!
    addServerNotification({
      userId: session.player1.username,
      type: 'cricket',
      title: 'Cricket Duel Live! 🏏',
      body: `Both secret cricketers are locked! It's your turn to ask or guess.`,
      link: `/chats`,
    }).catch(() => {});
    addServerNotification({
      userId: session.player2.username,
      type: 'cricket',
      title: 'Cricket Duel Live! 🏏',
      body: `Both secret cricketers are locked! Turn 1 is with @${session.player1.username}.`,
      link: `/chats`,
    }).catch(() => {});
  } else {
    // Only one player has selected so far - notify the opponent that their challenger has locked in!
    const targetOpponent = isP1 ? session.player2.username : session.player1.username;
    addServerNotification({
      userId: targetOpponent,
      type: 'cricket',
      title: 'Opponent Picked! 🔒',
      body: `@${clean} locked in their secret cricketer! Tap to choose yours now to begin.`,
      link: `/chats`,
    }).catch(() => {});
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

  // Ensure remainingGuesses is initialized to 3
  if (guesserPlayer.remainingGuesses === undefined) {
    guesserPlayer.remainingGuesses = 3;
  }
  if (targetPlayer.remainingGuesses === undefined) {
    targetPlayer.remainingGuesses = 3;
  }

  const opponentSecretId = targetPlayer.selectedCricketerId || '';
  const mySecretId = guesserPlayer.selectedCricketerId || '';

  // A player can guess ANY cricketer, including the cricketer they picked,
  // because both players can secretly pick the exact same cricketer!
  // First to correctly deduce the opponent's secret cricketer WINS!

  // Rule B: First to correctly deduce the opponent's cricketer WINS!
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
    updateCricketInviteInChat(gameId, 'completed', { winner: clean, winningGuess: guessedCricketer.name }).catch(() => {});
    if (session.chatId) {
      addServerChatMessage(session.chatId, {
        id: `msg-win-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conversationId: session.chatId,
        text: `🏆 Victory: @${clean} correctly deduced @${targetPlayer.username}'s secret cricketer was ${guessedCricketer.name}! @${clean} wins the match! 🏅`,
        sender: 'them',
        senderUsername: 'system',
        time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }
  } else {
    // Rule C: Wrong Guess consumes 1 of 3 lives
    guesserPlayer.remainingGuesses = Math.max(0, guesserPlayer.remainingGuesses - 1);
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

    if (guesserPlayer.remainingGuesses <= 0) {
      // 3rd Wrong Guess: LOST THE MATCH!
      session.status = 'completed';
      session.winner = targetPlayer.username;
      const targetCricketerName = getCricketerById(opponentSecretId)?.name || 'their secret cricketer';
      session.winningGuess = `@${clean} used all 3 guesses! Secret was ${targetCricketerName}`;
      session.completedAt = Date.now();

      session.timeline.push({
        id: uuidv4(),
        type: 'system',
        by: 'system',
        byName: 'DPSBuzz Match Umpire',
        questionText: `❌ OUT! @${clean} has exhausted all 3 guesses! @${targetPlayer.username} wins the match! 🏆 (Secret was ${targetCricketerName})`,
        timestamp: Date.now(),
      });

      await recordMatchCompleted(session);
      updateCricketInviteInChat(gameId, 'completed', {
        winner: targetPlayer.username,
        winningGuess: targetCricketerName,
      }).catch(() => {});
      if (session.chatId) {
        addServerChatMessage(session.chatId, {
          id: `msg-3lives-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          conversationId: session.chatId,
          text: `❌ Match Over: @${clean} used all 3 guess attempts! @${targetPlayer.username} wins the match! 🏆 (Secret was ${targetCricketerName})`,
          sender: 'them',
          senderUsername: 'system',
          time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      }
    } else {
      // Lives remain: turn passes to opponent
      session.timeline.push({
        id: uuidv4(),
        type: 'system',
        by: 'system',
        byName: 'DPSBuzz Match Umpire',
        questionText: `@${clean} guessed ${guessedCricketer.name} — Incorrect! (${guesserPlayer.remainingGuesses}/3 attempts left). Turn passes to @${targetPlayer.username} ❌`,
        timestamp: Date.now(),
      });

      session.currentTurn = targetPlayer.username;
      session.turnState = 'ask_or_guess';
    }
  }

  await saveRawGameSession(session);
  return { success: true, session, isCorrect };
}

/**
 * Forfeit / Quit an ongoing match
 */
export async function forfeitGameSession(
  gameId: string,
  username: string
): Promise<{ success: boolean; session?: CricketGameSession; error?: string }> {
  const session = await getRawGameSession(gameId);
  if (!session) return { success: false, error: 'Game not found' };

  const clean = username.toLowerCase().trim();
  const p1 = (session.player1?.username || '').toLowerCase().trim();
  const p2 = (session.player2?.username || '').toLowerCase().trim();

  if (clean !== p1 && clean !== p2) {
    return { success: false, error: 'Unauthorized player' };
  }

  // If already ended, return as is
  if (session.status === 'completed' || session.status === 'abandoned' || session.status === 'declined') {
    return { success: true, session };
  }

  const quitter = clean === p1 ? session.player1 : session.player2;
  const opponent = clean === p1 ? session.player2 : session.player1;

  session.status = 'completed';
  session.winner = opponent.username;
  session.winningGuess = `@${quitter.username} quit the match`;
  session.forfeitedBy = clean;
  session.completedAt = Date.now();
  session.rematchRequestedBy = null;

  session.timeline.push({
    id: uuidv4(),
    type: 'forfeit',
    by: clean,
    byName: quitter.fullName || clean,
    questionText: `⚠️ @${quitter.username} (${quitter.fullName}) quit the match! @${opponent.username} (${opponent.fullName}) wins by forfeit! 🏆`,
    timestamp: Date.now(),
  });

  await recordMatchCompleted(session);
  await saveRawGameSession(session);

  // Update chat message invite card with forfeit status
  updateCricketInviteInChat(gameId, 'completed', {
    winner: opponent.username,
    winningGuess: `@${quitter.username} quit`,
    forfeitedBy: quitter.username,
  }).catch(() => {});

  // Add system announcement chat message directly into the conversation
  try {
    if (session.chatId) {
      addServerChatMessage(session.chatId, {
        id: `msg-forfeit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conversationId: session.chatId,
        text: `🏏 Match Over: @${quitter.username} has quit the match! @${opponent.username} wins the match! 🏆`,
        sender: 'them',
        senderUsername: 'system',
        time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }
  } catch {}

  // Send in-app notification to the opponent
  addServerNotification({
    userId: opponent.username,
    type: 'cricket',
    title: 'Opponent Quit - You Won! 🏆',
    body: `@${quitter.username} quit the match. You have been awarded the victory by forfeit!`,
    link: `/chats`,
  }).catch(() => {});

  return { success: true, session };
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
  session.player1.remainingGuesses = 3;
  session.player2.selectedCricketerId = null;
  session.player2.hasSelected = false;
  session.player2.remainingGuesses = 3;
  session.winner = null;
  session.winningGuess = null;
  session.forfeitedBy = null;
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

    const TEST_DUMMIES = new Set(['rohan728', 'p1_deduction_test', 'p2_deduction_test', 'testuser1', 'testuser2', 'arjun_8a', 'priya_7b', 'arjun', 'priya']);
    const leaderboard: CricketLeaderboardEntry[] = lbData?.value
      ? JSON.parse(lbData.value).filter((e: CricketLeaderboardEntry) => !TEST_DUMMIES.has(e.username.toLowerCase()))
      : [];

    // Helper to update player stats with 100% accurate points formula:
    // Base = 0, Win = +50 points, Participation = +10 points
    // Points = (wins * 50) + (losses * 10)
    // WinRate = round((wins / matches) * 100)
    const updatePlayerStats = (player: typeof session.player1, isWinner: boolean) => {
      let entry = leaderboard.find((e) => e.username.toLowerCase() === player.username.toLowerCase());
      if (!entry) {
        entry = {
          username: player.username,
          fullName: player.fullName,
          avatar: player.avatar,
          points: 0,
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
        entry.correctGuesses += 1;
      }
      // Accurate point formula: 50 pts per win, 10 pts per completed match
      entry.points = (entry.wins * 50) + (Math.max(0, entry.matches - entry.wins) * 10);
      entry.incorrectGuesses += player.incorrectGuesses || 0;
      entry.winRate = entry.matches > 0 ? Math.round((entry.wins / entry.matches) * 100) : 0;
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
 * Get persistent leaderboard with privacy filtering
 * If a player has a private account, they are only displayed to their followers (or themselves).
 * If a player has a public account, they are displayed to all!
 */
export async function getCricketLeaderboard(viewerUsername?: string): Promise<CricketLeaderboardEntry[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'cricket_leaderboard')
      .maybeSingle();

    if (data?.value) {
      const parsed: CricketLeaderboardEntry[] = JSON.parse(data.value);
      const TEST_DUMMIES = new Set(['rohan728', 'p1_deduction_test', 'p2_deduction_test', 'testuser1', 'testuser2', 'arjun_8a', 'priya_7b', 'arjun', 'priya']);
      const filtered = parsed
        .filter((e) => !TEST_DUMMIES.has(e.username.toLowerCase()))
        .map((e) => ({
          ...e,
          points: (e.wins * 50) + (Math.max(0, e.matches - e.wins) * 10),
          winRate: e.matches > 0 ? Math.round((e.wins / e.matches) * 100) : 0,
        }))
        .sort((a, b) => b.points - a.points || b.wins - a.wins);

      const store = await getServerStore();
      const cleanViewer = (viewerUsername || '').toLowerCase().trim();
      const isAdmin = cleanViewer === 'shashwath71845';

      return filtered.filter((entry) => {
        const u = entry.username.toLowerCase().trim();
        if (isAdmin || u === cleanViewer) return true;

        const prof = (store.profiles || []).find((p) => p.username.toLowerCase().trim() === u);
        // If profile is public (not private), display in Match Centre to all!
        if (!prof || !prof.isPrivate) return true;

        // If private, ONLY display to their accepted followers!
        const isFollower = (store.follows || []).some(
          (f) => (f.follower || '').toLowerCase().trim() === cleanViewer && (f.following || '').toLowerCase().trim() === u
        );
        return isFollower;
      });
    }
  } catch {}

  return [];
}

/**
 * Get completed match history with privacy filtering
 * If players in a match are private, only display to their followers (or participants).
 * If public, display in Match Centre to all!
 */
export async function getCricketMatchHistory(username?: string, viewerUsername?: string): Promise<CricketMatchRecord[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'cricket_match_history')
      .maybeSingle();

    if (data?.value) {
      const records: CricketMatchRecord[] = JSON.parse(data.value);
      const TEST_DUMMIES = new Set(['rohan728', 'p1_deduction_test', 'p2_deduction_test', 'testuser1', 'testuser2', 'arjun_8a', 'priya_7b', 'arjun', 'priya']);
      let filtered = records.filter(
        (r) =>
          !TEST_DUMMIES.has(r.player1Username.toLowerCase()) &&
          !TEST_DUMMIES.has(r.player2Username.toLowerCase())
      );
      if (username) {
        const clean = username.toLowerCase().trim();
        filtered = filtered.filter(
          (r) => r.player1Username.toLowerCase() === clean || r.player2Username.toLowerCase() === clean
        );
      }

      const store = await getServerStore();
      const cleanViewer = (viewerUsername || '').toLowerCase().trim();
      const isAdmin = cleanViewer === 'shashwath71845';

      return filtered.filter((r) => {
        const p1 = r.player1Username.toLowerCase().trim();
        const p2 = r.player2Username.toLowerCase().trim();
        if (isAdmin || p1 === cleanViewer || p2 === cleanViewer) return true;

        const prof1 = (store.profiles || []).find((p) => p.username.toLowerCase().trim() === p1);
        const prof2 = (store.profiles || []).find((p) => p.username.toLowerCase().trim() === p2);

        // If player 1 is private, viewer must be a follower
        if (prof1?.isPrivate) {
          const followsP1 = (store.follows || []).some(
            (f) => (f.follower || '').toLowerCase().trim() === cleanViewer && (f.following || '').toLowerCase().trim() === p1
          );
          if (!followsP1) return false;
        }

        // If player 2 is private, viewer must be a follower
        if (prof2?.isPrivate) {
          const followsP2 = (store.follows || []).some(
            (f) => (f.follower || '').toLowerCase().trim() === cleanViewer && (f.following || '').toLowerCase().trim() === p2
          );
          if (!followsP2) return false;
        }

        return true;
      });
    }
  } catch {}

  return [];
}
