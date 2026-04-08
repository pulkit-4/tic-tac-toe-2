/// <reference path="../types/nakama-runtime.d.ts" />
// RPC handlers for matchmaking and room management

const MATCH_NAME = "tic_tac_toe";

// RPC: Create a new match (optionally timed mode)
const rpcCreateMatch: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  let timed = false;
  if (payload) {
    try {
      const params = JSON.parse(payload);
      timed = params.timed === true;
    } catch (_e) {}
  }

  const matchId = nk.matchCreate(MATCH_NAME, { timed: String(timed) });
  logger.info("Created match %s (timed=%s)", matchId, String(timed));
  return JSON.stringify({ matchId });
};

// RPC: Find open matches or create one
const rpcFindMatch: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  let timed = false;
  if (payload) {
    try {
      const params = JSON.parse(payload);
      timed = params.timed === true;
    } catch (_e) {}
  }

  // Search for open matches
  const label = JSON.stringify({ open: true, timed });
  const matches = nk.matchList(10, true, label, 0, 1, "*");

  if (matches.length > 0) {
    const match = matches[0];
    logger.info("Found open match %s for player %s", match.matchId, ctx.userId);
    return JSON.stringify({ matchId: match.matchId });
  }

  // No open match found, create a new one
  const matchId = nk.matchCreate(MATCH_NAME, { timed: String(timed) });
  logger.info(
    "No open match found, created new match %s for player %s",
    matchId,
    ctx.userId
  );
  return JSON.stringify({ matchId });
};

// RPC: Get player stats
const rpcGetStats: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const userId = ctx.userId;
  const defaultStats = {
    wins: 0,
    losses: 0,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0,
  };

  try {
    const records = nk.storageRead([
      { collection: "player_stats", key: "stats", userId },
    ]);
    if (records.length > 0) {
      return JSON.stringify(JSON.parse(records[0].value));
    }
    return JSON.stringify(defaultStats);
  } catch (e: any) {
    logger.error("Error reading stats for %s: %s", userId, e.message || String(e));
    return JSON.stringify(defaultStats);
  }
};

// RPC: Get leaderboard
const rpcGetLeaderboard: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  try {
    const result = nk.leaderboardRecordsList(
      "global_wins",
      [],
      20,
      undefined,
      undefined
    );
    const records = result.records.map((r) => ({
      rank: r.rank,
      userId: r.ownerId,
      username: r.username,
      wins: r.score,
      subscore: r.subscore,
    }));
    return JSON.stringify({ records });
  } catch (e: any) {
    logger.error("Error reading leaderboard: %s", e.message || String(e));
    return JSON.stringify({ records: [] });
  }
};

export const rpcs = {
  rpcCreateMatch,
  rpcFindMatch,
  rpcGetStats,
  rpcGetLeaderboard,
};
