'use client';

import React from 'react';

interface SurrenderButtonProps {
  /** Current player's user ID */
  playerId: string;
  /** Array of playerIds who have voted to surrender */
  surrenderVotes: string[];
  /** Whether the player has ≥15 minutes elapsed (enables the button) */
  canSurrender: boolean;
  /** Called when the toggle button is pressed */
  onToggle: () => void;
}

export const SurrenderButton: React.FC<SurrenderButtonProps> = ({
  playerId,
  surrenderVotes,
  canSurrender,
  onToggle,
}) => {
  const hasVoted = surrenderVotes.includes(playerId);
  const totalVotes = surrenderVotes.length;

  if (!canSurrender) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1">
      {/* Vote counter badge */}
      {totalVotes > 0 && (
        <div className="bg-red-100 border border-red-300 text-red-700 text-xs font-semibold px-2 py-1 rounded-full shadow">
          {totalVotes}/3 surrendering
        </div>
      )}

      <button
        onClick={onToggle}
        title={
          hasVoted
            ? 'Cancel your surrender vote'
            : 'Vote to surrender (all 3 players must agree)'
        }
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-bold border-2 transition-all duration-200 ${
          hasVoted
            ? 'bg-red-600 border-red-700 text-white hover:bg-red-700'
            : 'bg-white border-red-400 text-red-600 hover:bg-red-50'
        }`}
      >
        {/* Flag icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M4 3a1 1 0 011 1v16a1 1 0 11-2 0V4a1 1 0 011-1zm2 1l12 4-12 4V4z" />
        </svg>
        {hasVoted ? 'Cancel Surrender' : 'Surrender'}
      </button>

      {hasVoted && (
        <p className="text-xs text-red-500 bg-white border border-red-200 rounded px-2 py-0.5 shadow">
          Waiting for team ({totalVotes}/3)
        </p>
      )}
    </div>
  );
};
