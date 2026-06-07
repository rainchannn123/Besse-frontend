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
    <div className="flex items-center justify-center py-1">
      <span className="font-roboto font-bold text-[13px] md:text-[14px] text-[#33552C] bg-[#e8dcc8] border border-[#33552C] rounded-[6px] px-3 py-0.5 tracking-wide">
        Game Mode: {label}
      </span>
    </div>
  );
};

export default GameModeBadge;
