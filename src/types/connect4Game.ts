export type Connect4Disc = 'p1' | 'p2' | null;
export type Connect4Board = Connect4Disc[][]; // 6 rows (0-5) by 7 columns (0-6). Row 5 is bottom, Row 0 is top.

export type Connect4Status =
  | 'waiting_invite'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'abandoned';

export type Connect4Difficulty = 'easy' | 'hard' | 'impossible';

export interface Connect4Player {
  username: string;
  fullName: string;
  avatar?: string | null;
  color: 'red' | 'yellow'; // p1 is red, p2 is yellow
  isBot?: boolean;
  botDifficulty?: Connect4Difficulty;
}

export interface Connect4Session {
  gameId: string;
  gameType: 'connect4';
  chatId: string;
  player1: Connect4Player;
  player2: Connect4Player;
  board: Connect4Board;
  currentTurn: string; // username
  status: Connect4Status;
  winner?: string | 'draw' | null;
  winningCells?: [number, number][]; // [[row, col], ...] 4 coordinates
  lastMove?: { row: number; col: number; player: 'p1' | 'p2' } | null;
  moveCount: number;
  forfeitedBy?: string | null;
  botDifficulty?: Connect4Difficulty;
  createdAt: number;
  updatedAt: number;
}

export interface Connect4LeaderboardEntry {
  username: string;
  fullName: string;
  avatar?: string | null;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // percentage
  points: number; // Formula: (wins * 50) + (losses * 10) + (draws * 20)
  rank?: number;
}

export interface Connect4MatchRecord {
  matchId: string;
  gameId: string;
  player1: Connect4Player;
  player2: Connect4Player;
  winner: string | 'draw';
  forfeitedBy?: string | null;
  totalMoves: number;
  playedAt: number;
}

export interface Connect4InviteData {
  gameId: string;
  gameType: 'connect4';
  inviterUsername: string;
  inviterName: string;
  opponentUsername: string;
  opponentName: string;
  status: Connect4Status;
  winner?: string | 'draw' | null;
  forfeitedBy?: string | null;
  botDifficulty?: Connect4Difficulty;
}
