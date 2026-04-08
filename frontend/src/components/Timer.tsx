import React, { useEffect, useState } from "react";

interface TimerProps {
  deadline: number | null; // epoch ms
  isMyTurn: boolean;
}

export default function Timer({ deadline, isMyTurn }: TimerProps) {
  const [remaining, setRemaining] = useState<number>(30);

  useEffect(() => {
    if (!deadline) {
      setRemaining(30);
      return;
    }

    const update = () => {
      const now = Date.now();
      const secs = Math.max(0, Math.ceil((deadline - now) / 1000));
      setRemaining(secs);
    };

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;

  const pct = remaining / 30;
  const isUrgent = remaining <= 10;
  const color = isMyTurn
    ? isUrgent
      ? "#e94560"
      : "#4caf50"
    : isUrgent
    ? "#ff9800"
    : "var(--text-muted)";

  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <div className="timer" style={{ color }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.3s" }}
        />
        <text
          x="28"
          y="33"
          textAnchor="middle"
          fill={color}
          fontSize="14"
          fontWeight="bold"
          fontFamily="inherit"
        >
          {remaining}
        </text>
      </svg>
      {isMyTurn && (
        <span className="timer-label" style={{ color }}>
          {isUrgent ? "⚡ Hurry!" : "Your turn"}
        </span>
      )}

      <style>{`
        .timer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: color 0.3s;
        }
        .timer-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
