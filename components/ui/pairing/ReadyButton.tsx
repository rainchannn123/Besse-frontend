'use client';

import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ReadyButtonProps {
  isReady: boolean;
  isLeader: boolean;
  bothTeamsPresent: boolean;
  onToggleReady: () => void;
  isLoading: boolean;
}

const ReadyButton: React.FC<ReadyButtonProps> = ({
  isReady,
  isLeader,
  bothTeamsPresent,
  onToggleReady,
  isLoading,
}) => {
  // ✅ If not leader, show message
  if (!isLeader) {
    return (
      <div className="text-center p-4 bg-gray-100 rounded-lg">
        <p className="text-[#8b7355] text-sm">
          Only the team leader can mark the team as ready
        </p>
      </div>
    );
  }

  // ✅ If leader but no opponent yet, show disabled button with message
  if (!bothTeamsPresent) {
    return (
      <div className="space-y-3">
        <button
          onClick={onToggleReady}
          disabled={true}
          className="w-full py-3 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 bg-gray-300 text-gray-500 cursor-not-allowed"
        >
          <CheckCircle className="h-5 w-5" />
          Waiting for Opponent
        </button>
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-700 text-sm">
            Waiting for another team to join...
          </p>
          <p className="text-yellow-600 text-xs mt-1">
            Share your room code with another team to start the game
          </p>
        </div>
      </div>
    );
  }

  // ✅ Both teams present - show toggle button
  return (
    <button
      onClick={onToggleReady}
      disabled={isLoading}
      className={`w-full py-3 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
        isReady
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
          : 'bg-[#50704C] hover:bg-[#3A7D2C] text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <CheckCircle className="h-5 w-5" />
      )}
      {isReady ? 'Cancel Ready' : 'Ready to Play'}
    </button>
  );
};

export default ReadyButton;