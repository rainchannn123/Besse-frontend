import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState } from 'react';

export const useShiftCountdown = (shiftStartTime: number | string | undefined) => {
  const [shiftCountdown, setShiftCountdown] = useState<string>('30:00');
  const { gameState } = useWebSocket();

  useEffect(() => {
    const updateCountdown = () => {
      if (gameState?.gameStartTime) {
        // Use realtime data from backend
        const startTime = new Date(gameState.gameStartTime).getTime();
        const now = Date.now();
        const elapsedMs = now - startTime;
        const remainingMs = Math.max(0, 30 * 60 * 1000 - elapsedMs);
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        setShiftCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else if (shiftStartTime) {
        // Fallback to local calculation
        const now = Date.now();
        const startMs = new Date(shiftStartTime).getTime();
        const shiftDurationMs = 30 * 60 * 1000;
        const target = startMs + shiftDurationMs;
        const remaining = Math.max(0, target - now);

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setShiftCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [gameState?.gameStartTime]);

  return shiftCountdown;
};
