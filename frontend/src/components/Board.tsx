import React from "react";
import { CellValue } from "../types";

interface BoardProps {
  board: CellValue[];
  onCellClick: (index: number) => void;
  disabled: boolean;
  mySymbol: "X" | "O" | null;
  winningCells?: number[];
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function findWinningCells(board: CellValue[]): number[] {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return [];
}

export default function Board({
  board,
  onCellClick,
  disabled,
  mySymbol,
}: BoardProps) {
  const winningCells = findWinningCells(board);

  return (
    <div className="board">
      {board.map((cell, index) => {
        const isWinning = winningCells.includes(index);
        const isEmpty = cell === "";
        const isClickable = !disabled && isEmpty;

        return (
          <button
            key={index}
            className={[
              "cell",
              cell ? `cell--${cell.toLowerCase()}` : "",
              isWinning ? "cell--winning" : "",
              isClickable ? "cell--clickable" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => isClickable && onCellClick(index)}
            disabled={!isClickable}
            aria-label={`Cell ${index + 1}: ${cell || "empty"}`}
          >
            {cell && <span className="cell-symbol">{cell}</span>}
          </button>
        );
      })}

      <style>{`
        .board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
          aspect-ratio: 1;
        }

        .cell {
          background: var(--surface2);
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(2rem, 8vw, 3.5rem);
          font-weight: 900;
          transition: all 0.15s ease;
          border: 2px solid transparent;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          min-height: 80px;
        }

        .cell--clickable:hover {
          background: #1a4080;
          border-color: var(--accent2);
          transform: scale(1.03);
        }

        .cell--clickable:active {
          transform: scale(0.97);
        }

        .cell--x .cell-symbol {
          color: var(--x-color);
          text-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
        }

        .cell--o .cell-symbol {
          color: var(--o-color);
          text-shadow: 0 0 20px rgba(0, 180, 216, 0.5);
        }

        .cell--winning {
          background: rgba(255, 255, 255, 0.15);
          border-color: #ffd700;
          animation: pulse 0.6s ease infinite alternate;
        }

        @keyframes pulse {
          from { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          to { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
        }
      `}</style>
    </div>
  );
}
