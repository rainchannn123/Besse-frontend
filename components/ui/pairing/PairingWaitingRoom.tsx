import React, { useEffect, useState } from 'react';
import styles from './PairingWaitingRoom.module.css';

interface PairingWaitingRoomProps {
  position: number;
  estimatedWaitTime: number; // in seconds
  onLeavingQueue?: () => Promise<boolean>;
  isLoading?: boolean;
}

export const PairingWaitingRoom: React.FC<PairingWaitingRoomProps> = ({
  position,
  estimatedWaitTime,
  onLeavingQueue,
  isLoading = false,
}) => {
  const [displayTime, setDisplayTime] = useState(estimatedWaitTime);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeaveQueue = async () => {
    if (!onLeavingQueue) return;
    setIsLeaving(true);
    const success = await onLeavingQueue();
    if (!success) {
      setIsLeaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>Waiting for Match</h2>
          <p className={styles.subtitle}>You are in the pairing queue</p>
        </div>

        <div className={styles.queueInfo}>
          <div className={styles.positionCard}>
            <div className={styles.positionLabel}>Queue Position</div>
            <div className={styles.positionValue}>{position}</div>
          </div>

          <div className={styles.timerCard}>
            <div className={styles.timerLabel}>Estimated Wait Time</div>
            <div className={styles.timerValue}>{formatTime(displayTime)}</div>
            <div className={styles.timerSubtext}>Time remaining</div>
          </div>
        </div>

        <div className={styles.matchingAnimation}>
          <div className={styles.pulse}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className={styles.matchingText}>Finding your match...</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Teams Ahead</span>
            <span className={styles.statValue}>{Math.max(0, position - 1)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Queue Status</span>
            <span className={styles.statValue}>Active</span>
          </div>
        </div>

        <div className={styles.tips}>
          <h3>💡 While you wait:</h3>
          <ul>
            <li>Review your team strategy</li>
            <li>Check the game rules and objectives</li>
            <li>Plan your role-specific actions</li>
          </ul>
        </div>

        {onLeavingQueue && (
          <button
            className={styles.leaveButton}
            onClick={handleLeaveQueue}
            disabled={isLoading || isLeaving}
          >
            {isLoading || isLeaving ? 'Leaving Queue...' : 'Leave Queue'}
          </button>
        )}
      </div>
    </div>
  );
};
