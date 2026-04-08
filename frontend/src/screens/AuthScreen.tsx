import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthScreen() {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username || undefined);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="logo">
          <span className="logo-x">X</span>
          <span className="logo-sep">vs</span>
          <span className="logo-o">O</span>
        </div>
        <h1 className="title">Tic-Tac-Toe</h1>
        <p className="subtitle">Multiplayer · Authoritative · Real-time</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="field-label">Display Name (optional)</label>
            <input
              className="field-input"
              type="text"
              placeholder="Enter your name…"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={32}
              autoFocus
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Connecting…" : "Play Now"}
          </button>
        </form>
      </div>

      <style>{`
        .auth-screen {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          min-height: 100dvh;
        }

        .auth-card {
          background: var(--surface);
          border-radius: 20px;
          padding: 40px 32px;
          width: 100%;
          max-width: 380px;
          box-shadow: var(--shadow);
          text-align: center;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 3rem;
          font-weight: 900;
        }

        .logo-x { color: var(--x-color); }
        .logo-sep { color: var(--text-muted); font-size: 1.5rem; font-weight: 400; }
        .logo-o { color: var(--o-color); }

        .title {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .subtitle {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 32px;
          letter-spacing: 0.05em;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .field-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
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
      `}</style>
    </div>
  );
}
