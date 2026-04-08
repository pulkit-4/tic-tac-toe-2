import React from "react";
import { PlayerInfo } from "../types";

interface PlayerCardProps {
  player: PlayerInfo;
  isCurrentTurn: boolean;
  isMe: boolean;
}

export default function PlayerCard({
  player,
  isCurrentTurn,
  isMe,
}: PlayerCardProps) {
  const symbolColor =
    player.symbol === "X" ? "var(--x-color)" : "var(--o-color)";

  return (
    <div
      className={[
        "player-card",
        isCurrentTurn ? "player-card--active" : "",
        !player.connected ? "player-card--disconnected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="player-symbol" style={{ color: symbolColor }}>
        {player.symbol}
      </div>
      <div className="player-info">
        <div className="player-name">
          {player.username}
          {isMe && <span className="badge">You</span>}
        </div>
        {!player.connected && (
          <div className="player-status">⚠ Disconnected</div>
        )}
        {isCurrentTurn && player.connected && (
          <div className="player-status player-status--active">● Thinking…</div>
        )}
      </div>

      <style>{`
        .player-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--surface);
          border-radius: var(--radius);
          border: 2px solid transparent;
          transition: all 0.2s;
          flex: 1;
          min-width: 0;
        }

        .player-card--active {
          border-color: ${symbolColor};
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
        }

        .player-card--disconnected {
          opacity: 0.6;
        }

        .player-symbol {
          font-size: 1.8rem;
          font-weight: 900;
          min-width: 2rem;
          text-align: center;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .player-name {
          font-weight: 600;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .badge {
          font-size: 0.65rem;
          background: var(--accent2);
          color: white;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .player-status {
          font-size: 0.75rem;
          color: var(--warning);
          margin-top: 2px;
        }

        .player-status--active {
          color: var(--success);
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
