import { useState, useEffect, useCallback, useRef } from "react";
import { Socket, MatchData } from "@heroiclabs/nakama-js";
import {
  GameState,
  GameOverMessage,
  TimerUpdate,
  OP_STATE_UPDATE,
  OP_GAME_OVER,
  OP_ERROR,
  OP_TIMER_UPDATE,
  OP_MOVE,
  OP_FORFEIT,
} from "../types";

interface UseMatchResult {
  gameState: GameState | null;
  gameOver: GameOverMessage | null;
  timerRemaining: number | null;
  error: string | null;
  sendMove: (position: number) => void;
  sendForfeit: () => void;
  joinMatch: (matchId: string) => Promise<void>;
  leaveMatch: () => Promise<void>;
  matchId: string | null;
  isConnected: boolean;
}

export function useMatch(
  socket: Socket | null,
  userId: string | undefined
): UseMatchResult {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameOver, setGameOver] = useState<GameOverMessage | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const matchIdRef = useRef<string | null>(null);

  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

  // Set up socket message handler
  useEffect(() => {
    if (!socket) return;

    const onMatchData = (data: MatchData) => {
      const currentMatchId = matchIdRef.current;
      if (currentMatchId && data.match_id !== currentMatchId) return;

      let parsed: any;
      try {
        const raw =
          typeof data.data === "string"
            ? data.data
            : new TextDecoder().decode(data.data as Uint8Array);
        parsed = JSON.parse(raw);
      } catch (_e) {
        return;
      }

      switch (data.op_code) {
        case OP_STATE_UPDATE:
          setGameState(parsed as GameState);
          break;
        case OP_GAME_OVER:
          setGameOver(parsed as GameOverMessage);
          setTimerRemaining(null);
          break;
        case OP_ERROR:
          setError(parsed.message || "Server error");
          setTimeout(() => setError(null), 3000);
          break;
        case OP_TIMER_UPDATE:
          const tu = parsed as TimerUpdate;
          if (tu.currentTurn === userId) {
            setTimerRemaining(tu.remaining);
          } else {
            setTimerRemaining(tu.remaining);
          }
          break;
        default:
          break;
      }
    };

    socket.onmatchdata = onMatchData;

    return () => {
      // @ts-ignore
      socket.onmatchdata = undefined;
    };
  }, [socket, userId]);

  const joinMatch = useCallback(
    async (id: string) => {
      if (!socket) throw new Error("Not connected");
      setGameState(null);
      setGameOver(null);
      setTimerRemaining(null);
      setError(null);

      await socket.joinMatch(id);
      setMatchId(id);
      setIsConnected(true);
    },
    [socket]
  );

  const leaveMatch = useCallback(async () => {
    if (!socket || !matchIdRef.current) return;
    try {
      await socket.leaveMatch(matchIdRef.current);
    } catch (_e) {}
    setMatchId(null);
    setGameState(null);
    setGameOver(null);
    setTimerRemaining(null);
    setIsConnected(false);
  }, [socket]);

  const sendMove = useCallback(
    (position: number) => {
      if (!socket || !matchIdRef.current) return;
      const data = JSON.stringify({ position });
      socket.sendMatchState(matchIdRef.current, OP_MOVE, data);
    },
    [socket]
  );

  const sendForfeit = useCallback(() => {
    if (!socket || !matchIdRef.current) return;
    socket.sendMatchState(matchIdRef.current, OP_FORFEIT, "{}");
  }, [socket]);

  return {
    gameState,
    gameOver,
    timerRemaining,
    error,
    sendMove,
    sendForfeit,
    joinMatch,
    leaveMatch,
    matchId,
    isConnected,
  };
}
