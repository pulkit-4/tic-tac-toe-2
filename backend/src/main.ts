/// <reference path="../types/nakama-runtime.d.ts" />
import { matchHandler } from "./match_handler";
import { rpcs } from "./rpcs";

// Nakama runtime entry point
// This function is called by the Nakama runtime on startup
export function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
): void {
  // Register the authoritative match handler
  initializer.registerMatch("tic_tac_toe", matchHandler);

  // Register RPC functions
  initializer.registerRpc("create_match", rpcs.rpcCreateMatch);
  initializer.registerRpc("find_match", rpcs.rpcFindMatch);
  initializer.registerRpc("get_stats", rpcs.rpcGetStats);
  initializer.registerRpc("get_leaderboard", rpcs.rpcGetLeaderboard);

  // Create the leaderboard if it doesn't exist
  try {
    nk.leaderboardCreate(
      "global_wins",
      false,
      nkruntime.SortOrder.DESCENDING,
      nkruntime.Operator.SET,
      nkruntime.ResetSchedule.NEVER,
      {},
      false
    );
    logger.info("Leaderboard created/verified: global_wins");
  } catch (e: any) {
    // May already exist
    logger.debug("Leaderboard setup: %s", e.message || String(e));
  }

  logger.info("Tic-Tac-Toe module initialized successfully");
}
