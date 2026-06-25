import React from 'react';
import styles from './PairingStatus.module.css';

interface PartnerMetrics {
  sessionId: string;
  pairId: string;
  budget: number;
  cityHealth: number;
  totalCO2: number;
  currentTurn: number;
  gameStatus: 'active' | 'won' | 'lost';
}

interface PairingStatusProps {
  teamRole: 'Team A' | 'Team B';
  partnerSessionId: string;
  pairId: string;
  partnerMetrics?: PartnerMetrics | null;
  onStartGame?: () => void;
  isLoading?: boolean;
  autoStartCountdown: number | null;
}

export const PairingStatus: React.FC<PairingStatusProps> = ({
  teamRole,
  partnerSessionId,
  pairId,
  partnerMetrics,
  onStartGame,
  isLoading = false,
  autoStartCountdown,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>Teams Paired!</h2>
          <p className={styles.subtitle}>Ready for competitive gameplay</p>
        </div>

        <div className={styles.teamInfo}>
          <div className={styles.teamCard}>
            <div className={styles.teamLabel}>Your Team</div>
            <div className={styles.teamRole}>{teamRole}</div>
            <div className={styles.teamStatus}>Ready</div>
          </div>

          <div className={styles.divider}>vs</div>

          <div className={styles.teamCard}>
            <div className={styles.teamLabel}>Opponent Team</div>
            <div className={styles.teamRole}>{teamRole === 'Team A' ? 'Team B' : 'Team A'}</div>
            <div className={styles.teamStatus}>Ready</div>
          </div>
        </div>

        {partnerMetrics && (
          <div className={styles.metricsCard}>
            <h3 className={styles.metricsTitle}>Opponent Metrics</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <span className={styles.label}>Budget</span>
                <span className={styles.value}>${partnerMetrics.budget.toLocaleString()}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>City Health</span>
                <span className={styles.value}>{partnerMetrics.cityHealth}%</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Total CO₂</span>
                <span className={styles.value}>{partnerMetrics.totalCO2} tons</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Current Turn</span>
                <span className={styles.value}>{partnerMetrics.currentTurn}</span>
              </div>
            </div>
          </div>
        )}
{/* 
        <div className={styles.pairingInfo}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Pair ID:</span>
            <span className={styles.value}>{pairId}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Partner Session:</span>
            <span className={styles.value}>{partnerSessionId.substring(0, 12)}...</span>
          </div>
        </div> */}

        <div className={styles.readyStatus}>
          <div className={styles.checkmark}>✓</div>
          <p>
            {autoStartCountdown !== null && autoStartCountdown > 0
              ? `Game starting automatically in ${autoStartCountdown} seconds...`
              : autoStartCountdown === 0
              ? 'Starting game...'
              : 'Both teams are ready. Start the game to begin competitive gameplay!'}
          </p>
        </div>

        {onStartGame && autoStartCountdown === null && (
          <button className={styles.startButton} onClick={onStartGame} disabled={isLoading}>
            {isLoading ? 'Starting Game...' : 'Start Competitive Game'}
          </button>
        )}
      </div>
    </div>
  );
};
