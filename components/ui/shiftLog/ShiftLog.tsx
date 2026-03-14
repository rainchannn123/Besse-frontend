'use client';

import { useGameDay } from '@/hooks/useGameDay';
import { useGameOverCountdown } from '@/hooks/useGameOverCountdown';
import { useShiftCountdown } from '@/hooks/useShiftCountdown';
import clock from '@/public/assets/images/clock.png';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

interface LogItem {
  time: string;
  message: string;
  isLive?: boolean;
  type?: 'info' | 'warning' | 'error';
}

interface GameOverCountdown {
  active: boolean;
  startTime: number | null;
  reason: 'health' | 'budget' | 'time' | null;
}

interface ShiftLogProps {
  logs: LogItem[];
  shiftStart: string;
  shiftStartTime?: number | string;
  gameOverCountdown?: GameOverCountdown;
  onGameOver?: () => void;
}

const ShiftLog: React.FC<ShiftLogProps> = ({
  logs,
  shiftStart,
  shiftStartTime,
  gameOverCountdown,
  onGameOver,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const currentDay = useGameDay(shiftStartTime);
  const shiftCountdown = useShiftCountdown(shiftStartTime);
  const gameOverDisplay = useGameOverCountdown(gameOverCountdown, onGameOver);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Effect 1: Current time clock (independent)
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };

    updateCurrentTime();
    const timer = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to top when a new live log arrives
  useEffect(() => {
    if (!containerRef.current) return;
    if (logs.length === 0) return;
    const newest = logs[0];
    if (newest?.isLive) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="grid 2xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
      {/* Left: Logs */}
      <div
        ref={containerRef}
        className="bg-white border-4 border-dashed border-[#b18c5a] p-3 text-sm rounded-md 2xl:col-span-2 lg:col-span-1 col-span-1 h-[200px] overflow-y-auto"
      >
        {logs.map((log, index) => (
          <div key={index} className="mb-1 flex items-start">
            <p className="font-roboto xl:text-[18px] lg:text-[15px] text-[16px] text-black">
              {log.time} – {log.message}
            </p>
          </div>
        ))}
      </div>

      {/* Right: Time */}
      <div className="flex flex-col justify-center gap-2">
        {/* 30-minute shift countdown - ALWAYS SHOW */}
        <div className="bg-[#8b6647] px-2 rounded-[30px] flex items-center justify-center h-[60px] w-full col-span-1 gap-2">
          <span className="font-bold xl:text-[28px] lg:text-[24px] md:text-[20px] text-[16px] text-white font-roboto pr-3">
            Day {currentDay} -
          </span>
          <span className="font-bold xl:text-[28px] lg:text-[24px] md:text-[20px] text-[16px] text-white font-roboto">
            {shiftCountdown}
          </span>
          <div className="flex-shrink-0">
            <Image src={clock} alt="clock" width={40} height={40} />
          </div>
          {/* Game over countdown - only when active */}
          {gameOverDisplay && (
            <span className="font-bold xl:text-[28px] lg:text-[24px] md:text-[20px] text-[16px] text-white font-roboto animate-pulse">
              {gameOverDisplay}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftLog;
