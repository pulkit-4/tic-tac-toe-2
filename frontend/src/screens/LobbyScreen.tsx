import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { callRpc } from "../nakama";

type Tab = "matchmake" | "create" | "join";

export default function LobbyScreen() {
  const { session, logout, stats } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("matchmake");
  const [timedMode, setTimedMode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToGame = (matchId: string) => {
    navigate(`/game/${matchId}`);
  };

  const handleMatchmake = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await callRpc<{ matchId: string }>(session, "find_match", {
        timed: timedMode,
      });
      if (data?.matchId) {
        goToGame(data.matchId);
      }
    } catch (e: any) {
      setError(e.message || "Matchmaking failed");
    } finally {
      setIsLoading(false);
    }
  }, [session, timedMode]);

  const handleCreateRoom = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await callRpc<{ matchId: string }>(session, "create_match", {
        timed: timedMode,
      });
      if (data?.matchId) {
        goToGame(data.matchId);
      }
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    } finally {
      setIsLoading(false);
    }
  }, [session, timedMode]);

  const handleJoinRoom = useCallback(async () => {
    if (!joinCode.trim()) {
      setError("Please enter a match ID");
      return;
    }
    goToGame(joinCode.trim());
  }, [joinCode]);

  const username = session?.username || "Player";

  return (
    <div className="lobby-screen">
      <header className="lobby-header">
        <div className="lobby-title">
          <span className="symbol-x">X</span>
          <span> Tic-Tac-Toe </span>
          <span className="symbol-o">O</span>
        </div>
        <div className="user-info">
          <span className="username">{username}</span>
          {stats && (
            <span className="stats-mini">
              {stats.wins}W · {stats.losses}L · {stats.draws}D
            </span>
          )}
          <button className="btn-link" onClick={() => navigate("/leaderboard")}>
            🏆
          </button>
          <button className="btn-link" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="lobby-main">
        {/* Mode toggle */}
        <div className="mode-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={timedMode}
              onChange={(e) => setTimedMode(e.target.checked)}
            />
            <span>⏱ Timed mode (30s / turn)</span>
          </label>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {(["matchmake", "create", "join"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? "tab--active" : ""}`}
              onClick={() => { setTab(t); setError(null); }}
            >
              {t === "matchmake" ? "🔍 Matchmake" : t === "create" ? "➕ Create Room" : "🔑 Join by Code"}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {tab === "matchmake" && (
            <div className="tab-panel">
              <p className="tab-desc">
                Find an opponent automatically. If no open match is available,
                a new room will be created for you.
              </p>
              <button
                className="btn btn-primary btn-large"
                onClick={handleMatchmake}
                disabled={isLoading}
              >
                {isLoading ? "Finding match…" : "Find Match"}
              </button>
            </div>
          )}

          {tab === "create" && (
            <div className="tab-panel">
              <p className="tab-desc">
                Create a private room and share the match ID with a friend.
              </p>
              <button
                className="btn btn-primary btn-large"
                onClick={handleCreateRoom}
                disabled={isLoading}
              >
                {isLoading ? "Creating…" : "Create Room"}
              </button>
            </div>
          )}

          {tab === "join" && (
            <div className="tab-panel">
              <p className="tab-desc">
                Enter the match ID shared by your opponent.
              </p>
              <input
                className="field-input"
                type="text"
                placeholder="Paste match ID here…"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              <button
                className="btn btn-primary btn-large"
                onClick={handleJoinRoom}
                disabled={isLoading || !joinCode.trim()}
              >
                {isLoading ? "Joining…" : "Join Room"}
              </button>
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}
        </div>
      </main>

      <style>{`
        .lobby-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
        }

        .lobby-header {
          background: var(--surface);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--surface2);
          flex-wrap: wrap;
        }

        .lobby-title {
          font-size: 1.3rem;
          font-weight: 800;
        }

        .symbol-x { color: var(--x-color); }
        .symbol-o { color: var(--o-color); }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .username {
          font-weight: 600;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stats-mini {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: var(--surface2);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .btn-link {
          background: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }

        .btn-link:hover {
          color: var(--text);
          background: var(--surface2);
        }

        .lobby-main {
          flex: 1;
          padding: 24px 20px;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mode-toggle {
          background: var(--surface);
          border-radius: var(--radius);
          padding: 14px 16px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .toggle-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--accent);
          cursor: pointer;
        }

        .tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          background: var(--surface);
          padding: 4px;
          border-radius: var(--radius);
        }

        .tab {
          background: none;
          color: var(--text-muted);
          padding: 10px 4px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab--active {
          background: var(--surface2);
          color: var(--text);
        }

        .tab:hover:not(.tab--active) {
          color: var(--text);
        }

        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-desc {
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .btn {
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          transition: all 0.2s;
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn-primary {
          background: var(--accent);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #d63851;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-large {
          width: 100%;
          padding: 16px;
          font-size: 1.1rem;
        }

        .field-input {
          background: var(--bg);
          border: 2px solid var(--surface2);
          border-radius: 10px;
          padding: 12px 16px;
          color: var(--text);
          font-size: 1rem;
          transition: border-color 0.2s;
          width: 100%;
        }

        .field-input:focus {
          border-color: var(--accent2);
        }

        .field-input::placeholder {
          color: var(--text-muted);
        }

        .error-msg {
          background: rgba(233, 69, 96, 0.15);
          border: 1px solid var(--accent);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.875rem;
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}
