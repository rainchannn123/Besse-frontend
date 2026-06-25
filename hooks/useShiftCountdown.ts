import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useMemo, useRef, useState } from 'react';

export const useShiftCountdown = (
  shiftStartTime: number | string | undefined,
  onTimeUp?: () => void
) => {
  const [shiftCountdown, setShiftCountdown] = useState<string>('--:--');
  const { gameState } = useWebSocket();
  const timeUpFiredRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

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

    const updateCountdown = () => {
      const startMs = new Date(startTime).getTime();
      const now = Date.now();
      const elapsedMs = now - startMs;
      const remainingMs = Math.max(0, durationMinutes * 60 * 1000 - elapsedMs);
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      setShiftCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);

      // Fire onTimeUp once when the countdown reaches zero
      if (remainingMs === 0 && !timeUpFiredRef.current) {
        timeUpFiredRef.current = true;
        onTimeUpRef.current?.();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    // Re-check immediately when tab becomes visible (intervals throttled in background)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updateCountdown();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [startTime, durationMinutes]);

  return shiftCountdown;
};
