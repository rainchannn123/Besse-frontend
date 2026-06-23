'use client';

import { useGameDay } from '@/hooks/useGameDay';
import { useGameOverCountdown } from '@/hooks/useGameOverCountdown';
import { useShiftCountdown } from '@/hooks/useShiftCountdown';
import clock from '@/public/assets/images/clock.png';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  cityHealth?: number;
  budget?: number;
  totalCO2?: number;
  wasteInventory?: number;
  onStatusLog?: (log: LogItem) => void;
  teamTimer?: string; // ✅ NEW: Team timer prop
  isEliminated?: boolean; // ✅ NEW: Elimination status
  teamStatus?: string; // ✅ NEW: Team status
}

const ShiftLog: React.FC<ShiftLogProps> = ({
  logs,
  shiftStart,
  shiftStartTime,
  gameOverCountdown,
  onGameOver,
  cityHealth,
  budget,
  totalCO2,
  wasteInventory,
  onStatusLog,
  teamTimer,
  isEliminated,
  teamStatus,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const currentDay = useGameDay(shiftStartTime);
  const shiftCountdown = useShiftCountdown(shiftStartTime, onGameOver);
  const gameOverDisplay = useGameOverCountdown(gameOverCountdown, onGameOver);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastStatusMinuteRef = useRef<number>(-1);
  const isUserScrolledUpRef = useRef(false);

  // Refs for status values — prevents the interval from resetting on every game-state update
  const cityHealthRef = useRef(cityHealth);
  const budgetRef = useRef(budget);
  const totalCO2Ref = useRef(totalCO2);
  const wasteInventoryRef = useRef(wasteInventory);

  useEffect(() => { cityHealthRef.current = cityHealth; }, [cityHealth]);
  useEffect(() => { budgetRef.current = budget; }, [budget]);
  useEffect(() => { totalCO2Ref.current = totalCO2; }, [totalCO2]);
  useEffect(() => { wasteInventoryRef.current = wasteInventory; }, [wasteInventory]);

  const getCountdownTimestamp = useCallback(() => {
    if (!shiftStartTime) return '[--:--]';
    const startMs = new Date(shiftStartTime).getTime();
    const elapsed = Math.max(0, Date.now() - startMs);
    // Read game duration from localStorage (same source as useShiftCountdown)
    let durationMinutes = 15; // default
    try {
      const stored = localStorage.getItem('init_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.constants?.TEAM_GAME_DURATION_MINUTES) {
          durationMinutes = parsed.constants.TEAM_GAME_DURATION_MINUTES;
        }
      }
    } catch {}
    const remainingMs = Math.max(0, durationMinutes * 60 * 1000 - elapsed);
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}]`;
  }, [shiftStartTime]);

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

  // Periodic status summary — fires immediately on mount, then every 1 minute
  useEffect(() => {
    if (!onStatusLog || !shiftStartTime) return;

    const checkAndEmitStatus = () => {
      const startMs = new Date(shiftStartTime).getTime();
      if (isNaN(startMs)) return;
      const elapsedMinutes = Math.floor((Date.now() - startMs) / 60000);

      if (elapsedMinutes > lastStatusMinuteRef.current) {
        lastStatusMinuteRef.current = elapsedMinutes;
        const statusParts: string[] = [];
        if (cityHealthRef.current !== undefined) statusParts.push(`Health: ${cityHealthRef.current}`);
        if (budgetRef.current !== undefined) statusParts.push(`Budget: $${Math.round(budgetRef.current)}`);
        if (totalCO2Ref.current !== undefined) statusParts.push(`CO₂: ${totalCO2Ref.current.toFixed(1)}t`);
        if (wasteInventoryRef.current !== undefined) statusParts.push(`Waste: ${wasteInventoryRef.current.toFixed(1)}t`);

        // ✅ Add team status if available
        if (isEliminated !== undefined && isEliminated) {
          statusParts.push(`💀 ELIMINATED`);
        } else if (teamStatus === 'completed') {
          statusParts.push(`✅ COMPLETED`);
        }

        // ✅ Add timer if available
        if (teamTimer) {
          statusParts.push(`⏱️ ${teamTimer}`);
        }

        if (statusParts.length > 0) {
          onStatusLog({
            time: getCountdownTimestamp(),
            message: `Status Update — ${statusParts.join(' | ')}`,
            type: isEliminated ? 'error' : 'info',
          });
        }
      }
    };

    // Fire immediately so the board is never empty
    checkAndEmitStatus();

    const interval = setInterval(checkAndEmitStatus, 10000);
    return () => clearInterval(interval);
  }, [shiftStartTime, onStatusLog, getCountdownTimestamp, isEliminated, teamStatus, teamTimer]);

  // Track if user has manually scrolled up
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 30;
      isUserScrolledUpRef.current = !isAtBottom;
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new logs arrive (unless user scrolled up)
  useEffect(() => {
    if (!containerRef.current || logs.length === 0) return;
    // Use requestAnimationFrame to ensure DOM has rendered new items
    requestAnimationFrame(() => {
      if (!containerRef.current || isUserScrolledUpRef.current) return;
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    });
  }, [logs.length, logs]);

  return (
    <div className="grid 2xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-2">
      {/* Left: Logs */}
      <div
        ref={containerRef}
        className="bg-white border-4 border-dashed border-[#b18c5a] p-2 text-sm rounded-md 2xl:col-span-2 lg:col-span-1 col-span-1 h-[140px] overflow-y-auto flex flex-col"
      >
        <div className="mt-auto" />
        {logs.map((log, index) => (
          <div key={index} className="mb-0.5 flex items-start">
            <p className="font-poppins xl:text-[12px] lg:text-[11px] text-[11px] leading-[1.4] text-black">
              {log.time} - {log.message}
            </p>
          </div>
        ))}
      </div>

            {/* Right: Time & Status */}
      <div className="flex flex-col justify-center gap-1">
        <div
                                        className={`bg-[#8b6647] rounded-[28px] h-[48px] w-fit min-w-[320px] md:min-w-[400px] max-w-full mx-auto px-4 flex items-center justify-center ${
            isEliminated ? 'border-2 border-red-500' : ''
          }`}


        >
          <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
            <div className="flex-shrink-0">
              <Image src={clock} alt="clock" width={28} height={28} />
            </div>

            {gameOverDisplay ? (
              <span className="font-bold xl:text-[22px] lg:text-[18px] md:text-[16px] text-[14px] text-white font-roboto animate-pulse leading-none">
                {gameOverDisplay}
              </span>
            ) : teamTimer ? (
              <span
                className={`font-bold xl:text-[22px] lg:text-[18px] md:text-[16px] text-[14px] font-roboto leading-none ${
                  isEliminated
                    ? 'text-red-400'
                    : parseInt(teamTimer) < 3
                      ? 'text-red-400 animate-pulse'
                      : 'text-white'
                }`}
              >
                {teamTimer}
              </span>
            ) : (
              <span className="font-bold xl:text-[22px] lg:text-[18px] md:text-[16px] text-[14px] text-white font-roboto leading-none">
                {shiftCountdown}
              </span>
            )}

                        <span className="font-bold xl:text-[22px] lg:text-[18px] md:text-[16px] text-[14px] text-white font-roboto leading-none">
              (Day {currentDay})
            </span>


            {isEliminated && (
              <span className="bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                ELIMINATED
              </span>
            )}
            {!isEliminated && teamStatus === 'completed' && (
              <span className="bg-green-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                COMPLETED
              </span>
            )}
            {!isEliminated && teamStatus === 'active' && (
              <span className="bg-blue-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full leading-none">
                ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftLog;