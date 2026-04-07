import React from 'react';

interface GameModeBadgeProps {
  gameMode: string | null | undefined;
}

const gameModeLabels: Record<string, string> = {
  waste: 'Waste',
  energy: 'Energy',
};

const GameModeBadge: React.FC<GameModeBadgeProps> = ({ gameMode }) => {
  if (!gameMode) return null;

  const label = gameModeLabels[gameMode] || gameMode;

  return (
    <div className="flex items-center justify-center py-2">
      <span className="font-roboto font-bold text-[16px] md:text-[18px] text-[#33552C] bg-[#e8dcc8] border border-[#33552C] rounded-[6px] px-4 py-1 tracking-wide">
        Game Mode: {label}
      </span>
    </div>
  );
};

export default GameModeBadge;
