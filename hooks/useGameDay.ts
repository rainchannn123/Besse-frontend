import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState } from 'react';

export const useGameDay = (shiftStartTime: number | string | undefined) => {
  const [currentDay, setCurrentDay] = useState<number>(1);
  const { gameState } = useWebSocket();

  useEffect(() => {
    const updateDay = () => {
      if (gameState?.gameStartTime) {
        const startTime = new Date(gameState.gameStartTime).getTime();
        const now = Date.now();
        const elapsedMs = now - startTime;
        const elapsedMinutes = elapsedMs / (1000 * 60);
        const calculatedDay = Math.floor((elapsedMinutes / 30) * 7) + 1;
        setCurrentDay(calculatedDay);
      } else if (shiftStartTime) {
        const startTime = new Date(shiftStartTime).getTime();
        const now = Date.now();
        const elapsedMs = now - startTime;
        const elapsedMinutes = elapsedMs / (1000 * 60);
        const calculatedDay = Math.floor((elapsedMinutes / 30) * 7) + 1;
        setCurrentDay(calculatedDay);
      }
    };

    updateDay();
    const timer = setInterval(updateDay, 1000);
    return () => clearInterval(timer);
  }, [gameState?.gameStartTime]);

  return currentDay;
};
