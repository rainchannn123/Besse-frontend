import React, { useState } from 'react';
import styles from './PairingQueue.module.css';

interface PairingQueueProps {
  onJoinQueue: () => Promise<boolean>;
  isLoading: boolean;
}

export const PairingQueue: React.FC<PairingQueueProps> = ({ onJoinQueue, isLoading }) => {
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
        <h2 className={styles.title}>Team Pairing</h2>
        <p className={styles.subtitle}>Ready to compete?</p>

        <div className={styles.description}>
          <p>
            Join the pairing queue to be matched with another team for competitive gameplay. Teams
            compete against each other to achieve the best results in the game.
          </p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.icon}>🎯</span>
            <p>Competitive Pairing</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.icon}>🏆</span>
            <p>Real-Time Competition</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.icon}>📊</span>
            <p>Performance Tracking</p>
          </div>
        </div>

        <button
          className={styles.joinButton}
          onClick={handleJoinQueue}
          disabled={isLoading || isJoining}
        >
          {isLoading || isJoining ? (
            <>
              <span className={styles.spinner}></span>
              Joining Queue...
            </>
          ) : (
            'Join Pairing Queue'
          )}
        </button>

        <p className={styles.info}>
          ⏱️ You will be matched with another team shortly. Average wait time: 2-5 minutes
        </p>
      </div>
    </div>
  );
};
