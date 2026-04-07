import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useMemo, useState } from 'react';

export const useGameDay = (shiftStartTime: number | string | undefined) => {
  const [currentDay, setCurrentDay] = useState<number>(1);
  const { gameState } = useWebSocket();

  // Read constants from WebSocket gameState first, then fall back to localStorage init_state
  const durationMinutes = useMemo(() => {
    if (gameState?.constants?.REAL_TIME_GAME_DURATION_MINUTES) {
      return gameState.constants.REAL_TIME_GAME_DURATION_MINUTES;
    }
    try {
      const stored = localStorage.getItem('init_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.constants?.REAL_TIME_GAME_DURATION_MINUTES) {
          return parsed.constants.REAL_TIME_GAME_DURATION_MINUTES;
        }
      }
    } catch {}
    return null;
  }, [gameState?.constants?.REAL_TIME_GAME_DURATION_MINUTES]);

  const startTime = gameState?.gameStartTime ?? shiftStartTime;

  useEffect(() => {
    if (!durationMinutes || !startTime) return;

    const updateDay = () => {
      const startMs = new Date(startTime).getTime();
      const now = Date.now();
      const elapsedMs = now - startMs;
      const elapsedMinutes = elapsedMs / (1000 * 60);
      const calculatedDay = Math.floor((elapsedMinutes / durationMinutes) * 7) + 1;
      setCurrentDay(calculatedDay);
    };

    updateDay();
    const timer = setInterval(updateDay, 1000);
    return () => clearInterval(timer);
  }, [startTime, durationMinutes]);

  return currentDay;
};
