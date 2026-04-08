/// <reference path="../types/nakama-runtime.d.ts" />
// Opcodes for client -> server messages
export const OP_MOVE = 1;
export const OP_FORFEIT = 2;

// Opcodes for server -> client messages
export const OP_STATE_UPDATE = 101;
export const OP_GAME_OVER = 102;
export const OP_ERROR = 103;
export const OP_WAITING = 104;
export const OP_TIMER_UPDATE = 105;

// Error codes
export const ERR_NOT_YOUR_TURN = 1;
export const ERR_INVALID_POSITION = 2;
export const ERR_CELL_TAKEN = 3;
export const ERR_GAME_NOT_ACTIVE = 4;

// Game constants
export const TURN_TIME_SECONDS = 30;
export const BOARD_SIZE = 9;

// Win conditions (indices)
export const WIN_CONDITIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type CellValue = "" | "X" | "O";
export type MatchStatus = "waiting" | "playing" | "finished";
export type GameOverReason = "win" | "draw" | "forfeit" | "disconnect" | "timeout";

export interface PlayerInfo {
  userId: string;
  username: string;
  symbol: "X" | "O";
  presence: nkruntime.Presence;
  connected: boolean;
}

export interface MatchState {
  board: CellValue[];
  players: { [userId: string]: PlayerInfo };
  playerOrder: string[]; // [X player, O player]
  currentTurn: string; // userId
  status: MatchStatus;
  winner: string | null; // userId or 'draw'
  winReason: GameOverReason | null;
  moveCount: number;
  timedMode: boolean;
  turnDeadline: number | null; // epoch ms
  tickRate: number;
  label: string;
  disconnectTimers: { [userId: string]: number }; // ticks remaining before forfeit
}

export interface MoveMessage {
  position: number;
}

export interface StateUpdateMessage {
  board: CellValue[];
  currentTurn: string;
  status: MatchStatus;
  winner: string | null;
  winReason: GameOverReason | null;
  players: Array<{
    userId: string;
    username: string;
    symbol: "X" | "O";
    connected: boolean;
  }>;
  timedMode: boolean;
  turnDeadline: number | null;
}

export interface GameOverMessage {
  winner: string | null; // userId or 'draw' or null
  winReason: GameOverReason;
  players: Array<{
    userId: string;
    username: string;
    symbol: "X" | "O";
  }>;
}

export interface ErrorMessage {
  code: number;
  message: string;
}

export function checkWinner(board: CellValue[]): CellValue | null {
  for (const [a, b, c] of WIN_CONDITIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function checkDraw(board: CellValue[]): boolean {
  return board.every((cell) => cell !== "");
}

export function buildStateUpdate(state: MatchState): StateUpdateMessage {
  return {
    board: state.board,
    currentTurn: state.currentTurn,
    status: state.status,
    winner: state.winner,
    winReason: state.winReason,
    players: state.playerOrder.map((uid) => {
      const p = state.players[uid];
      return {
        userId: p.userId,
        username: p.username,
        symbol: p.symbol,
        connected: p.connected,
      };
    }),
    timedMode: state.timedMode,
    turnDeadline: state.turnDeadline,
  };
}
