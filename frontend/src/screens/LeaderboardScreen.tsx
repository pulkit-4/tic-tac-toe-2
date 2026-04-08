import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { callRpc } from "../nakama";
import { LeaderboardRecord } from "../types";

export default function LeaderboardScreen() {
  const { session, stats } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const data = await callRpc<{ records: LeaderboardRecord[] }>(
          session,
          "get_leaderboard",
          {}
        );
        setRecords(data?.records || []);
      } catch (e: any) {
        setError(e.message || "Failed to load leaderboard");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [session]);

  const userId = session?.user_id;

  return (
    <div className="lb-screen">
      <header className="lb-header">
        <button className="back-btn" onClick={() => navigate("/lobby")}>
          ← Back
        </button>
        <h1>🏆 Leaderboard</h1>
      </header>

      {/* My stats */}
      {stats && (
        <div className="my-stats">
          <h3>Your Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.wins}</span>
              <span className="stat-label">Wins</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.losses}</span>
              <span className="stat-label">Losses</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.draws}</span>
              <span className="stat-label">Draws</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.bestStreak}</span>
              <span className="stat-label">Best Streak</span>
            </div>
          </div>
        </div>
      )}

      <main className="lb-main">
        {isLoading && (
          <div className="loading">
            <div className="spinner" />
          </div>
        )}
        {error && <div className="error-msg">{error}</div>}
        {!isLoading && records.length === 0 && (
          <div className="empty">No rankings yet. Play some games!</div>
        )}
        {records.map((record, i) => {
          const isMe = record.userId === userId;
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
          return (
            <div
              key={record.userId}
              className={`lb-row ${isMe ? "lb-row--me" : ""}`}
            >
              <span className="lb-rank">
                {medal || `#${record.rank}`}
              </span>
              <span className="lb-name">
                {record.username}
                {isMe && <span className="badge">You</span>}
              </span>
              <span className="lb-wins">{record.wins} wins</span>
            </div>
          );
        })}
      </main>

      <style>{`
        .lb-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
        }

        .lb-header {
          background: var(--surface);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid var(--surface2);
        }

        .lb-header h1 {
          font-size: 1.3rem;
          font-weight: 800;
        }

        .back-btn {
          background: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          padding: 6px 10px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: var(--surface2);
          color: var(--text);
        }

        .my-stats {
          background: var(--surface);
          margin: 16px;
          border-radius: var(--radius);
          padding: 16px;
          border: 1px solid var(--surface2);
        }

        .my-stats h3 {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--accent);
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .lb-main {
          flex: 1;
          padding: 0 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
        }

        .loading {
          display: flex;
          justify-content: center;
          padding: 40px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--surface2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty {
          text-align: center;
          color: var(--text-muted);
          padding: 40px;
        }

        .lb-row {
          background: var(--surface);
          border-radius: var(--radius);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }

        .lb-row--me {
          border-color: var(--accent2);
          background: rgba(83, 52, 131, 0.2);
        }

        .lb-rank {
          font-size: 1.1rem;
          min-width: 2.5rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .lb-name {
          flex: 1;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
          flex-shrink: 0;
        }

        .lb-wins {
          font-weight: 700;
          color: var(--accent);
          white-space: nowrap;
        }

        .error-msg {
          background: rgba(233, 69, 96, 0.15);
          border: 1px solid var(--accent);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.875rem;
          color: var(--accent);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
