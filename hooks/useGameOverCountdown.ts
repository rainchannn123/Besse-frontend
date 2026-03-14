import { useEffect, useRef, useState } from 'react';

interface GameOverCountdown {
  active: boolean;
  startTime: number | null;
  reason: 'health' | 'budget' | 'time' | null;
}

export const useGameOverCountdown = (
  gameOverCountdown: GameOverCountdown | undefined,
  onGameOver?: () => void
) => {
  const [gameOverDisplay, setGameOverDisplay] = useState<string>('');
  const onGameOverRef = useRef(onGameOver);
  const gameOverTriggeredRef = useRef<Set<number>>(new Set());

  // Update ref when onGameOver changes
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const updateCountdown = () => {
      if (gameOverCountdown?.active && gameOverCountdown.startTime) {
        const now = Date.now();
        const startTime = gameOverCountdown.startTime;
        const gameOverDurationMs = 3 * 60 * 1000; // 3 minutes
        const targetTime = startTime + gameOverDurationMs;
        const remaining = Math.max(0, targetTime - now);

        const minutesGO = Math.floor(remaining / 60000);
        const secondsGO = Math.floor((remaining % 60000) / 1000);

        if (remaining > 0) {
          setGameOverDisplay(`${minutesGO}:${secondsGO.toString().padStart(2, '0')}`);
        } else {
          // Trigger game over only once per countdown
          if (!gameOverTriggeredRef.current.has(startTime)) {
            gameOverTriggeredRef.current.add(startTime);
            onGameOverRef.current?.();
          }
          setGameOverDisplay('00:00');
        }
      } else {
        // Clear game over display when countdown is not active
        setGameOverDisplay('');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [gameOverCountdown]);

  return gameOverDisplay;
};