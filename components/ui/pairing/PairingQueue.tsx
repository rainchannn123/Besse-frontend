import React, { useState } from 'react';
import styles from './PairingQueue.module.css';

export interface PairingQueueProps {
  onJoinQueue: () => Promise<boolean>;
  isLoading: boolean;
  canJoinQueue?: boolean;
  disabledReason?: string;
}

export const PairingQueue: React.FC<PairingQueueProps> = ({
  onJoinQueue,
  isLoading,
  canJoinQueue = true,
  disabledReason,
}) => {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinQueue = async () => {
    setIsJoining(true);
    const success = await onJoinQueue();
    if (!success) {
      setIsJoining(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        <div className={styles.description}>
          <p>
            Press to match with another team! During the queue, you may review the documentation to prepare for the game.
          </p>
        </div>

        <button
          className={styles.joinButton}
          onClick={handleJoinQueue}
          disabled={isLoading || isJoining || !canJoinQueue}
        >
          {isLoading || isJoining ? (
            <>
              <span className={styles.spinner}></span>
              Joining Queue...
            </>
          ) : !canJoinQueue ? (
            'Only Leader Can Start Queueing'
          ) : (
            'Join Pairing Queue'
          )}
        </button>

        {!canJoinQueue && (
          <p className={styles.info}>{disabledReason || 'Only the group leader can start queueing.'}</p>
        )}

        <p className={styles.info}>
          ⏱️ You will be matched with another team shortly. Average wait time: 2-5 minutes
        </p>
      </div>
    </div>
  );
};
