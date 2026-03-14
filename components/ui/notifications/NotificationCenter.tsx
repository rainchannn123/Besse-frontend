import React, { useEffect } from 'react';
import styles from './NotificationCenter.module.css';

export interface Notification {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss?: (id: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismiss,
}) => {
  useEffect(() => {
    // Auto-dismiss notifications after duration
    const timers = notifications.map((notification) => {
      if (notification.duration !== 0) {
        const timeout = setTimeout(
          () => onDismiss?.(notification.id),
          notification.duration || 5000
        );
        return timeout;
      }
      return null;
    });

    return () => {
      timers.forEach((timer) => timer && clearTimeout(timer));
    };
  }, [notifications, onDismiss]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[`notification-${notification.type}`]}`}
          role="alert"
        >
          <div className={styles.content}>
            <span className={styles.icon}>
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '✕'}
              {notification.type === 'warning' && '⚠'}
              {notification.type === 'info' && 'ℹ'}
            </span>
            <span className={styles.message}>{notification.message}</span>
          </div>
          {onDismiss && (
            <button
              className={styles.closeButton}
              onClick={() => onDismiss(notification.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
