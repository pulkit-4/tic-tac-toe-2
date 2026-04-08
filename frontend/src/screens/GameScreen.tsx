import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMatch } from "../hooks/useMatch";
import Board from "../components/Board";
import PlayerCard from "../components/PlayerCard";
import Timer from "../components/Timer";

export default function GameScreen() {
  const { matchId: matchIdParam } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { session, socket, refreshStats } = useAuth();
  const {
    gameState,
    gameOver,
    error,
    sendMove,
    sendForfeit,
    joinMatch,
    leaveMatch,
    isConnected,
  } = useMatch(socket, session?.user_id);

  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);

  const userId = session?.user_id;

  // Join match on mount
  useEffect(() => {
    if (!matchIdParam || !socket || joining) return;
    setJoining(true);
    joinMatch(matchIdParam).catch((e) => {
      console.error("Failed to join match:", e);
      navigate("/lobby");
    });
  }, [matchIdParam, socket]);

  // Refresh stats when game is over
  useEffect(() => {
    if (gameOver) {
      refreshStats();
    }
  }, [gameOver, refreshStats]);

  const handleLeave = useCallback(async () => {
    await leaveMatch();
    navigate("/lobby");
  }, [leaveMatch, navigate]);

  const handleCopyMatchId = useCallback(() => {
    if (matchIdParam) {
      navigator.clipboard.writeText(matchIdParam).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [matchIdParam]);

  const myPlayer = gameState?.players.find((p) => p.userId === userId);
  const mySymbol = myPlayer?.symbol;
  const isMyTurn =
    gameState?.status === "playing" && gameState?.currentTurn === userId;
  const isWaiting = gameState?.status === "waiting" || !gameState;

  return (
    <div className="game-screen">
      {/* Header */}
      <header className="game-header">
        <button className="back-btn" onClick={handleLeave}>
          ← Leave
        </button>
        <div className="match-id-container">
          <span className="match-id-label">Match ID:</span>
          <button className="match-id-value" onClick={handleCopyMatchId} title="Click to copy">
            {matchIdParam?.slice(0, 8)}…{" "}
            {copied ? "✓" : "📋"}
          </button>
        </div>
        {gameState?.timedMode && (
          <span className="mode-badge">⏱ Timed</span>
        )}
      </header>

      <main className="game-main">
        {/* Waiting state */}
        {isWaiting && !gameOver && (
          <div className="waiting-card">
            <div className="spinner" />
            <h2>Waiting for opponent…</h2>
            <p>Share this match ID with a friend:</p>
            <div className="match-code-box">
              <code>{matchIdParam}</code>
              <button onClick={handleCopyMatchId}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Game Over overlay */}
        {gameOver && (
          <div className="game-over-card">
            <div className="game-over-icon">
              {gameOver.winner === "draw"
                ? "🤝"
                : gameOver.winner === userId
                ? "🏆"
                : "😔"}
            </div>
            <h2 className="game-over-title">
              {gameOver.winner === "draw"
                ? "It's a Draw!"
                : gameOver.winner === userId
                ? "You Win!"
                : "You Lose"}
            </h2>
            <p className="game-over-reason">
              {gameOver.winReason === "forfeit" && "Opponent forfeited"}
              {gameOver.winReason === "disconnect" && "Opponent disconnected"}
              {gameOver.winReason === "timeout" && "Time ran out"}
              {gameOver.winReason === "win" && "Three in a row!"}
              {gameOver.winReason === "draw" && "All cells filled"}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/lobby")}
            >
              Back to Lobby
            </button>
          </div>
        )}

        {/* Active game */}
        {gameState && !isWaiting && (
          <>
            {/* Players */}
            <div className="players-row">
              {gameState.players.map((player) => (
                <PlayerCard
                  key={player.userId}
                  player={player}
                  isCurrentTurn={
                    gameState.status === "playing" &&
                    gameState.currentTurn === player.userId
                  }
                  isMe={player.userId === userId}
                />
              ))}
            </div>

            {/* Status bar */}
            <div className="status-bar">
              {gameState.status === "playing" && !gameOver && (
                <>
                  <span className={isMyTurn ? "status-my-turn" : "status-wait"}>
                    {isMyTurn
                      ? `Your turn (${mySymbol})`
                      : "Waiting for opponent…"}
                  </span>
                  {gameState.timedMode && (
                    <Timer
                      deadline={gameState.turnDeadline}
                      isMyTurn={isMyTurn}
                    />
                  )}
                </>
              )}
            </div>

            {/* Board */}
            <Board
              board={gameState.board}
              onCellClick={sendMove}
              disabled={!isMyTurn || !!gameOver}
              mySymbol={mySymbol || null}
            />

            {/* Actions */}
            {gameState.status === "playing" && !gameOver && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (
                    window.confirm("Are you sure you want to forfeit?")
                  ) {
                    sendForfeit();
                  }
                }}
              >
                Forfeit
              </button>
            )}
          </>
        )}

        {/* Error toast */}
        {error && <div className="error-toast">{error}</div>}
      </main>

      <style>{`
        .game-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
        }

        .game-header {
          background: var(--surface);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--surface2);
        }

        .back-btn {
          background: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          padding: 6px 10px;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .back-btn:hover {
          background: var(--surface2);
          color: var(--text);
        }

        .match-id-container {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .match-id-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .match-id-value {
          background: var(--surface2);
          color: var(--text);
          font-size: 0.8rem;
          font-family: monospace;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: background 0.2s;
        }

        .match-id-value:hover {
          background: var(--accent2);
        }

        .mode-badge {
          font-size: 0.75rem;
          background: var(--accent2);
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .game-main {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
        }

        .waiting-card {
          background: var(--surface);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--surface2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .waiting-card h2 {
          font-size: 1.3rem;
          font-weight: 700;
        }

        .waiting-card p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .match-code-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg);
          padding: 10px 14px;
          border-radius: 10px;
          width: 100%;
          max-width: 320px;
        }

        .match-code-box code {
          flex: 1;
          font-size: 0.75rem;
          word-break: break-all;
          color: var(--text-muted);
        }

        .match-code-box button {
          background: var(--accent);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .game-over-card {
          background: var(--surface);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .game-over-icon {
          font-size: 4rem;
        }

        .game-over-title {
          font-size: 1.8rem;
          font-weight: 800;
        }

        .game-over-reason {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .players-row {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 40px;
        }

        .status-my-turn {
          font-weight: 700;
          color: var(--success);
          font-size: 1rem;
        }

        .status-wait {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          transition: all 0.2s;
          width: 100%;
          max-width: 240px;
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn-primary {
          background: var(--accent);
          color: white;
        }

        .btn-primary:hover {
          background: #d63851;
        }

        .btn-danger {
          background: rgba(233, 69, 96, 0.15);
          color: var(--accent);
          border: 1px solid var(--accent);
        }

        .btn-danger:hover {
          background: rgba(233, 69, 96, 0.3);
        }

        .error-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(233, 69, 96, 0.9);
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          backdrop-filter: blur(10px);
          z-index: 999;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
