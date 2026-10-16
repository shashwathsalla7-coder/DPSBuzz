import type { Cricketer } from '@/data/cricketers';

export type CricketGameStatus =
  | 'waiting_invite'
  | 'declined'
  | 'selecting'
  | 'in_progress'
  | 'completed'
  | 'abandoned';

export type TurnState = 'ask_or_guess' | 'awaiting_answer';

export type AnswerType = 'yes' | 'no' | 'partially' | 'cant_say';

export interface TimelineItem {
  id: string;
  type: 'question' | 'guess' | 'system' | 'rematch';
  by: string;
  byName: string;
  questionText?: string;
  answer?: AnswerType;
  cricketerName?: string;
  isCorrect?: boolean;
  timestamp: number;
}

export interface CricketPlayer {
  username: string;
  fullName: string;
  avatar: string | null;
  /** Secret ID - MUST NEVER be sent to the opponent until the game completes */
  selectedCricketerId?: string | null;
  hasSelected: boolean;
  score: number;
  correctGuesses: number;
  incorrectGuesses: number;
  questionsAsked: number;
}

export interface CricketGameSession {
  gameId: string;
  chatId: string;
  status: CricketGameStatus;
  player1: CricketPlayer;
  player2: CricketPlayer;
  currentTurn: string; // username of current player
  turnState: TurnState;
  activeQuestion: {
    id: string;
    askedBy: string;
    questionText: string;
    timestamp: number;
  } | null;
  timeline: TimelineItem[];
  winner: string | null;
  winningGuess: string | null;
  revealedPlayer1Cricketer?: Cricketer | null;
  revealedPlayer2Cricketer?: Cricketer | null;
  startedAt: number;
  completedAt: number | null;
  rematchRequestedBy?: string | null;
}

export interface CricketLeaderboardEntry {
  username: string;
  fullName: string;
  avatar: string | null;
  points: number;
  wins: number;
  matches: number;
  correctGuesses: number;
  incorrectGuesses: number;
  winRate: number; // percentage, e.g. 75
}

export interface CricketMatchRecord {
  id: string;
  gameId: string;
  player1Username: string;
  player1Name: string;
  player1Cricketer: string;
  player2Username: string;
  player2Name: string;
  player2Cricketer: string;
  winnerUsername: string;
  winnerName: string;
  turns: number;
  completedAt: number;
}
