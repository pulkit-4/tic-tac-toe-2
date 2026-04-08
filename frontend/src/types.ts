// Game types shared between frontend and backend

export type CellValue = "" | "X" | "O";
export type MatchStatus = "waiting" | "playing" | "finished";
export type GameOverReason = "win" | "draw" | "forfeit" | "disconnect" | "timeout";

export interface PlayerInfo {
  userId: string;
  username: string;
  symbol: "X" | "O";
  connected: boolean;
}

export interface GameState {
  board: CellValue[];
  currentTurn: string; // userId
  status: MatchStatus;
  winner: string | null; // userId, 'draw', or null
  winReason: GameOverReason | null;
  players: PlayerInfo[];
  timedMode: boolean;
  turnDeadline: number | null; // epoch ms
}

export interface GameOverMessage {
  winner: string | null;
  winReason: GameOverReason;
  players: PlayerInfo[];
}

export interface TimerUpdate {
  remaining: number;
  currentTurn: string;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
}

export interface LeaderboardRecord {
  rank: number;
  userId: string;
  username: string;
  wins: number;
}

// Opcodes (must match backend)
export const OP_MOVE = 1;
export const OP_FORFEIT = 2;
export const OP_STATE_UPDATE = 101;
export const OP_GAME_OVER = 102;
export const OP_ERROR = 103;
export const OP_WAITING = 104;
export const OP_TIMER_UPDATE = 105;
