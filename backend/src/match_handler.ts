/// <reference path="../types/nakama-runtime.d.ts" />
import {
  MatchState,
  PlayerInfo,
  CellValue,
  OP_STATE_UPDATE,
  OP_GAME_OVER,
  OP_ERROR,
  OP_WAITING,
  OP_TIMER_UPDATE,
  OP_MOVE,
  OP_FORFEIT,
  ERR_NOT_YOUR_TURN,
  ERR_INVALID_POSITION,
  ERR_CELL_TAKEN,
  ERR_GAME_NOT_ACTIVE,
  BOARD_SIZE,
  TURN_TIME_SECONDS,
  checkWinner,
  checkDraw,
  buildStateUpdate,
  GameOverReason,
  StateUpdateMessage,
  GameOverMessage,
  ErrorMessage,
} from "./types";

const DISCONNECT_GRACE_TICKS = 10; // ~10 seconds at 1 tick/s before forfeit

const matchInit: nkruntime.MatchInitFunction<MatchState> = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  params: { [key: string]: string }
): { state: MatchState; tickRate: number; label: string } {
  const timedMode = params["timed"] === "true";
  const label = JSON.stringify({
    open: true,
    timed: timedMode,
  });

  const state: MatchState = {
    board: new Array<CellValue>(BOARD_SIZE).fill(""),
    players: {},
    playerOrder: [],
    currentTurn: "",
    status: "waiting",
    winner: null,
    winReason: null,
    moveCount: 0,
    timedMode,
    turnDeadline: null,
    tickRate: 1,
    label,
    disconnectTimers: {},
  };

  logger.info("Match initialized, timed=%s", String(timedMode));
  return { state, tickRate: 1, label };
};

const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction<MatchState> =
  function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: MatchState,
    presence: nkruntime.Presence,
    metadata: { [key: string]: any }
  ): { state: MatchState; accept: boolean; rejectMessage?: string } {
    // Allow if game is waiting and < 2 players, or if reconnecting
    const existingPlayer = state.players[presence.userId];
    if (existingPlayer) {
      // Reconnect
      logger.info("Player %s reconnecting", presence.userId);
      return { state, accept: true };
    }
    if (state.status !== "waiting") {
      return {
        state,
        accept: false,
        rejectMessage: "Match already in progress",
      };
    }
    if (state.playerOrder.length >= 2) {
      return { state, accept: false, rejectMessage: "Match is full" };
    }
    return { state, accept: true };
  };

const matchJoin: nkruntime.MatchJoinFunction<MatchState> = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } | null {
  for (const presence of presences) {
    const userId = presence.userId;
    const existingPlayer = state.players[userId];

    if (existingPlayer) {
      // Reconnect: restore presence
      existingPlayer.presence = presence;
      existingPlayer.connected = true;
      delete state.disconnectTimers[userId];
      logger.info("Player %s reconnected", userId);
    } else {
      // New player
      const symbol: "X" | "O" =
        state.playerOrder.length === 0 ? "X" : "O";
      const playerInfo: PlayerInfo = {
        userId,
        username: presence.username,
        symbol,
        presence,
        connected: true,
      };
      state.players[userId] = playerInfo;
      state.playerOrder.push(userId);
      logger.info(
        "Player %s joined as %s",
        presence.username,
        symbol
      );
    }

    // Start game when 2 players have joined
    if (state.playerOrder.length === 2 && state.status === "waiting") {
      state.status = "playing";
      state.currentTurn = state.playerOrder[0]; // X goes first
      if (state.timedMode) {
        state.turnDeadline = Date.now() + TURN_TIME_SECONDS * 1000;
      }
      // Update label - game no longer open
      const newLabel = JSON.stringify({ open: false, timed: state.timedMode });
      state.label = newLabel;
      dispatcher.matchLabelUpdate(newLabel);
      logger.info("Game started!");
    }
  }

  // Broadcast current state to all
  const msg: StateUpdateMessage = buildStateUpdate(state);
  dispatcher.broadcastMessage(
    OP_STATE_UPDATE,
    JSON.stringify(msg),
    null,
    null,
    true
  );

  return { state };
};

const matchLeave: nkruntime.MatchLeaveFunction<MatchState> = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: MatchState,
  presences: nkruntime.Presence[]
): { state: MatchState } | null {
  for (const presence of presences) {
    const userId = presence.userId;
    const player = state.players[userId];
    if (player) {
      player.connected = false;
      logger.info("Player %s disconnected", presence.username);

      if (state.status === "playing") {
        // Give grace period before forfeit
        state.disconnectTimers[userId] = DISCONNECT_GRACE_TICKS;
      } else if (state.status === "waiting") {
        // Remove player if game hasn't started
        delete state.players[userId];
        state.playerOrder = state.playerOrder.filter((id) => id !== userId);
      }
    }
  }

  // Broadcast updated state
  const msg: StateUpdateMessage = buildStateUpdate(state);
  dispatcher.broadcastMessage(
    OP_STATE_UPDATE,
    JSON.stringify(msg),
    null,
    null,
    true
  );

  return { state };
};

const matchLoop: nkruntime.MatchLoopFunction<MatchState> = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: MatchState,
  messages: nkruntime.MatchMessage[]
): { state: MatchState } | null {
  // If match is finished or empty, terminate
  if (
    state.status === "finished" &&
    Object.keys(state.players).length === 0
  ) {
    return null;
  }

  // Process disconnect timers
  if (state.status === "playing") {
    for (const userId of Object.keys(state.disconnectTimers)) {
      state.disconnectTimers[userId]--;
      if (state.disconnectTimers[userId] <= 0) {
        // Forfeit disconnected player
        logger.info("Player %s forfeited due to disconnect", userId);
        endGame(nk, logger, dispatcher, state, userId, "disconnect");
        delete state.disconnectTimers[userId];
        return { state };
      }
    }

    // Check turn timer
    if (state.timedMode && state.turnDeadline !== null) {
      if (Date.now() > state.turnDeadline) {
        logger.info("Player %s timed out", state.currentTurn);
        endGame(nk, logger, dispatcher, state, state.currentTurn, "timeout");
        return { state };
      }
      // Broadcast timer update every tick
      const remaining = Math.max(
        0,
        Math.floor((state.turnDeadline - Date.now()) / 1000)
      );
      dispatcher.broadcastMessage(
        OP_TIMER_UPDATE,
        JSON.stringify({ remaining, currentTurn: state.currentTurn }),
        null,
        null,
        false
      );
    }
  }

  // Process messages
  for (const message of messages) {
    const userId = message.sender.userId;
    const player = state.players[userId];

    if (!player) {
      continue;
    }

    switch (message.opCode) {
      case OP_MOVE: {
        if (state.status !== "playing") {
          sendError(dispatcher, message.sender, ERR_GAME_NOT_ACTIVE, "Game is not active");
          break;
        }
        if (state.currentTurn !== userId) {
          sendError(dispatcher, message.sender, ERR_NOT_YOUR_TURN, "It is not your turn");
          break;
        }

        let moveData: { position: number };
        try {
          moveData = JSON.parse(nk.binaryToString(message.data));
        } catch (e) {
          sendError(dispatcher, message.sender, ERR_INVALID_POSITION, "Invalid message format");
          break;
        }

        const position = moveData.position;
        if (
          typeof position !== "number" ||
          position < 0 ||
          position >= BOARD_SIZE ||
          !Number.isInteger(position)
        ) {
          sendError(dispatcher, message.sender, ERR_INVALID_POSITION, "Invalid board position");
          break;
        }

        if (state.board[position] !== "") {
          sendError(dispatcher, message.sender, ERR_CELL_TAKEN, "Cell already occupied");
          break;
        }

        // Apply move
        state.board[position] = player.symbol;
        state.moveCount++;

        // Check win
        const winSymbol = checkWinner(state.board);
        if (winSymbol) {
          const winnerId = state.playerOrder.find(
            (uid) => state.players[uid].symbol === winSymbol
          )!;
          endGame(nk, logger, dispatcher, state, winnerId, "win");
          break;
        }

        // Check draw
        if (checkDraw(state.board)) {
          endGame(nk, logger, dispatcher, state, null, "draw");
          break;
        }

        // Next turn
        state.currentTurn =
          state.playerOrder.find((uid) => uid !== userId) || userId;
        if (state.timedMode) {
          state.turnDeadline = Date.now() + TURN_TIME_SECONDS * 1000;
        }

        // Broadcast updated state
        const stateMsg: StateUpdateMessage = buildStateUpdate(state);
        dispatcher.broadcastMessage(
          OP_STATE_UPDATE,
          JSON.stringify(stateMsg),
          null,
          null,
          true
        );
        break;
      }

      case OP_FORFEIT: {
        if (state.status !== "playing") {
          sendError(dispatcher, message.sender, ERR_GAME_NOT_ACTIVE, "Game is not active");
          break;
        }
        logger.info("Player %s forfeited voluntarily", userId);
        endGame(nk, logger, dispatcher, state, userId, "forfeit");
        break;
      }

      default:
        logger.warn("Unknown opcode %d from %s", message.opCode, userId);
    }
  }

  return { state };
};

const matchTerminate: nkruntime.MatchTerminateFunction<MatchState> = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: MatchState,
  graceSeconds: number
): { state: MatchState } | null {
  logger.info("Match terminating with %d grace seconds", graceSeconds);
  return null;
};

const matchSignal: nkruntime.MatchSignalFunction<MatchState> = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: MatchState,
  data: string
): { state: MatchState; data?: string } | null {
  return { state, data: "" };
};

function sendError(
  dispatcher: nkruntime.MatchDispatcher,
  presence: nkruntime.Presence,
  code: number,
  message: string
): void {
  const err: ErrorMessage = { code, message };
  dispatcher.broadcastMessage(
    OP_ERROR,
    JSON.stringify(err),
    [presence],
    null,
    true
  );
}

function endGame(
  nk: nkruntime.Nakama,
  logger: nkruntime.Logger,
  dispatcher: nkruntime.MatchDispatcher,
  state: MatchState,
  forfeiterOrWinner: string | null,
  reason: GameOverReason
): void {
  state.status = "finished";
  state.winReason = reason;
  state.turnDeadline = null;

  if (reason === "win") {
    state.winner = forfeiterOrWinner;
  } else if (reason === "draw") {
    state.winner = "draw";
  } else {
    // forfeit / disconnect / timeout: other player wins
    if (forfeiterOrWinner) {
      state.winner =
        state.playerOrder.find((uid) => uid !== forfeiterOrWinner) || null;
    }
  }

  // Update player stats
  updatePlayerStats(nk, logger, state);

  // Broadcast final state
  const stateMsg: StateUpdateMessage = buildStateUpdate(state);
  dispatcher.broadcastMessage(
    OP_STATE_UPDATE,
    JSON.stringify(stateMsg),
    null,
    null,
    true
  );

  // Broadcast game over
  const gameOverMsg: GameOverMessage = {
    winner: state.winner,
    winReason: reason,
    players: state.playerOrder.map((uid) => ({
      userId: state.players[uid].userId,
      username: state.players[uid].username,
      symbol: state.players[uid].symbol,
    })),
  };
  dispatcher.broadcastMessage(
    OP_GAME_OVER,
    JSON.stringify(gameOverMsg),
    null,
    null,
    true
  );

  logger.info(
    "Game over: winner=%s, reason=%s",
    String(state.winner),
    reason
  );
}

function updatePlayerStats(
  nk: nkruntime.Nakama,
  logger: nkruntime.Logger,
  state: MatchState
): void {
  try {
    for (const userId of state.playerOrder) {
      const isWinner =
        state.winner === userId;
      const isDraw = state.winner === "draw";
      const isLoser = !isWinner && !isDraw;

      // Read existing stats
      const collection = "player_stats";
      const key = "stats";
      let stats = {
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreak: 0,
        bestStreak: 0,
      };

      try {
        const existing = nk.storageRead([
          { collection, key, userId },
        ]);
        if (existing.length > 0) {
          stats = JSON.parse(existing[0].value);
        }
      } catch (_e) {
        // First time player, use defaults
      }

      if (isWinner) {
        stats.wins++;
        stats.currentStreak++;
        if (stats.currentStreak > stats.bestStreak) {
          stats.bestStreak = stats.currentStreak;
        }
      } else if (isDraw) {
        stats.draws++;
        // streak is not broken on draw
      } else if (isLoser) {
        stats.losses++;
        stats.currentStreak = 0;
      }

      // Write stats
      nk.storageWrite([
        {
          collection,
          key,
          userId,
          value: JSON.stringify(stats),
          permissionRead: 2, // public
          permissionWrite: 0, // server only
        },
      ]);

      // Update leaderboard (wins-based)
      if (isWinner) {
        nk.leaderboardRecordWrite(
          "global_wins",
          userId,
          state.players[userId].username,
          stats.wins,
          0,
          {},
          undefined
        );
      }
    }
  } catch (e: any) {
    logger.error("Error updating player stats: %s", e.message || String(e));
  }
}

export const matchHandler: nkruntime.MatchHandler<MatchState> = {
  matchInit,
  matchJoinAttempt,
  matchJoin,
  matchLeave,
  matchLoop,
  matchTerminate,
  matchSignal,
};
