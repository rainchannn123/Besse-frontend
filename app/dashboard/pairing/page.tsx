'use client';

import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { NotificationCenter } from '../../../components/ui/notifications/NotificationCenter';
import { PairingQueue } from '../../../components/ui/pairing/PairingQueue';
import { PairingStatus } from '../../../components/ui/pairing/PairingStatus';
import { PairingWaitingRoom } from '../../../components/ui/pairing/PairingWaitingRoom';
import { usePairingSystem } from '../../../hooks/usePairingSystem';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { gameService } from '../../../services/gameService';
import { lobbyService } from '../../../services/lobbyService';
import { useUserStore } from '../../../stores/userStore';
import styles from './page.module.css';

interface PairingPageProps {
  searchParams: Promise<{
    sessionId?: string;
  }>;
}

export default function PairingPage({ searchParams }: PairingPageProps) {
  const router = useRouter();
  const { currentUser, updateUser } = useUserStore();
  const params = use(searchParams);
  const { user } = useAuthStore();
  const { subscribe, joinGame, isConnected } = useWebSocket();
  const sessionId =
    params?.sessionId || localStorage.getItem('pairing_session_id') || user?.currentSession;
  if (sessionId && !params?.sessionId && localStorage.getItem('pairing_session_id') === sessionId) {
    localStorage.removeItem('pairing_session_id');
  }
  console.log('Pairing Page sessionId:', sessionId);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(new Set());
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null);
  const [isLeader, setIsLeader] = useState(false);

  const {
    pairingStatus,
    notifications,
    isLoading,
    partnerMetrics,
    joinPairingQueue,
    leavePairingQueue,
    getPairingResult,
  } = usePairingSystem(sessionId!, true);
  console.log(sessionId);

  useEffect(() => {
    const checkLeader = async () => {
      if (!sessionId || !user?._id) {
        setIsLeader(false);
        return;
      }

      try {
        const response = await lobbyService.getLobbyState(sessionId);
        const leaderId = response.data?.lobbyState?.leader;
        setIsLeader(leaderId === user._id);
      } catch (error) {
        console.error('Failed to verify lobby leader:', error);
        setIsLeader(false);
      }
    };

    void checkLeader();
  }, [sessionId, user?._id]);

  const handleJoinQueueAsLeaderOnly = useCallback(async () => {
    if (!isLeader) {
      return false;
    }

    return joinPairingQueue();
  }, [isLeader, joinPairingQueue]);

  useEffect(() => {
    // If not paired and sessionId exists, check for existing pairing result
    if (!pairingStatus?.isPaired && sessionId) {
      getPairingResult();
    }
  }, [sessionId, pairingStatus?.isPaired, getPairingResult]);

  // Join WebSocket room when session is available and connected
  // This is CRITICAL - we must join the room to receive teams-paired events
  useEffect(() => {
    if (sessionId && isConnected) {
      console.log('Pairing page: Joining game room for sessionId:', sessionId);
      joinGame(sessionId);
    }

    // Cleanup: leave the room when component unmounts or sessionId changes
    return () => {
      if (sessionId) {
        console.log('Pairing page: Cleanup - would leave game room for sessionId:', sessionId);
        // Note: We don't actually call leaveGame here to avoid disconnecting
        // if user is navigating to game page
      }
    };
  }, [sessionId, isConnected, joinGame]);

  // CRITICAL: Listen for teams-paired event directly on this page
  // This ensures we catch the event even if usePairingSystem doesn't update in time
  useEffect(() => {
    if (!sessionId) return;

    const handleTeamsPaired = (data: any) => {
      console.log('🎯🎯🎯 Pairing page: TEAMS-PAIRED EVENT RECEIVED 🎯🎯🎯');
      console.log('Pairing page: Event data:', JSON.stringify(data, null, 2));
      console.log('Pairing page: My sessionId:', sessionId);
      console.log('Pairing page: Partner sessionId:', data.partnerSessionId);
      console.log('Pairing page: My team role:', data.teamRole);
      console.log('Pairing page: Pair ID:', data.pairId);

      // Force update the pairing status in the store
      // This will trigger the UI to change from waiting to paired state
      if (data.pairId && data.partnerSessionId && data.teamRole) {
        console.log('Pairing page: All required data present, UI should update now');
        // The usePairingSystem should handle this, but we log it here to debug
      }
    };

    console.log('Pairing page: Setting up teams-paired listener for sessionId:', sessionId);
    const unsubscribe = subscribe('teams-paired', handleTeamsPaired);

    return () => {
      console.log('Pairing page: Cleaning up teams-paired listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sessionId, subscribe]);

  // Listen for game-state-full or game-state-update events (game actually started)
  useEffect(() => {
    const unsubGameStateFull = subscribe('game-state-full', (data: any) => {
      if (data?.gameState && data.gameState.gameStatus === 'active') {
        console.log('Game is now active, auto-redirecting...');
        // Game has started, trigger navigation
        if (autoStartCountdown === null) {
          setAutoStartCountdown(3); // Quick countdown before redirect
        }
      }
    });

    const unsubGameStateUpdate = subscribe('game-state-update', (data: any) => {
      if (data?.gameState && data.gameState.gameStatus === 'active') {
        console.log('Game state updated to active, auto-redirecting...');
        if (autoStartCountdown === null) {
          setAutoStartCountdown(3);
        }
      }
    });

    return () => {
      if (unsubGameStateFull) {
        unsubGameStateFull();
      }
      if (unsubGameStateUpdate) {
        unsubGameStateUpdate();
      }
    };
  }, [subscribe, autoStartCountdown]);

  // Auto-start countdown when paired
  useEffect(() => {
    if (pairingStatus?.isPaired && autoStartCountdown === null) {
      setAutoStartCountdown(5);
    }
  }, [pairingStatus?.isPaired, autoStartCountdown]);

  const handleStartGame = useCallback(async () => {
    if (!sessionId) {
      console.error('No session ID');
      return;
    }

    setIsStartingGame(true);
    try {
      // Call getGameState API
      const response = await gameService.getGameState(sessionId);
      if (response.success && response.data?.gameState) {
        const gameState = response.data.gameState;

        // Store initial state
        const { secureStorage } = await import('@/utils/secureStorage');
        secureStorage.setItem('init_state', JSON.stringify(gameState));
        localStorage.setItem('current_game_session', sessionId);
        // Determine user role — prefer currentUser but fall back to authStore user
        const userId = currentUser?._id || user?._id;
        let userRole: string | null = null;
        if (userId && gameState.players) {
          for (const [role, playerId] of Object.entries(gameState.players)) {
            if (playerId === userId) {
              userRole = role;
              break;
            }
          }
        }
        // Update user store with current session
        updateUser({ currentSession: sessionId });
        if (userRole === 'broker') {
          router.push('/dashboard/broker-inventory');
        } else if (userRole === 'mrf') {
          router.push('/dashboard/mrf-collection');
        } else {
          router.push('/dashboard/municipality');
        }
      } else {
        console.error('Failed to get game state:', response.message);
        setIsStartingGame(false);
      }
    } catch (error) {
      console.error('Failed to get game state:', error);
      setIsStartingGame(false);
    }
  }, [sessionId, currentUser?._id, router, updateUser]);

  // Countdown timer
  useEffect(() => {
    if (autoStartCountdown && autoStartCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoStartCountdown(autoStartCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoStartCountdown === 0) {
      handleStartGame();
    }
  }, [autoStartCountdown, handleStartGame]);

  const handleDismissNotification = (id: number) => {
    setDismissedNotifications((prev) => new Set([...prev, id]));
  };

  const visibleNotifications = notifications.filter((n) => !dismissedNotifications.has(n.id));

  return (
    <div className="min-h-screen flex items-center justify-center bgColor p-6">
      <div
        className="bg-cover bg-center container mx-auto rounded-[20px] relative w-full"
        style={{
          backgroundImage: `url(${woodenBg.src})`,
        }}
      >
        <CustomHeader
          backgroundImage={woodenHeading.src}
          title="Team Pairing"
          subtitle="Find your game partner and start playing"
        />

        <div className="md:px-8 px-4 pt-16 pb-6">
          {/* Notifications */}
          <NotificationCenter
            notifications={visibleNotifications}
            onDismiss={handleDismissNotification}
          />

          {/* Pairing States */}
          <div className={styles.page}>
            {!pairingStatus?.isInQueue && !pairingStatus?.isPaired ? (
              <PairingQueue
                onJoinQueue={handleJoinQueueAsLeaderOnly}
                isLoading={isLoading}
                canJoinQueue={isLeader}
                disabledReason="Only the group leader can start queueing."
              />
            ) : pairingStatus?.isInQueue && !pairingStatus?.isPaired ? (
              <PairingWaitingRoom
                position={pairingStatus.position}
                estimatedWaitTime={pairingStatus.estimatedWaitTime}
                onLeavingQueue={leavePairingQueue}
                isLoading={isLoading}
              />
            ) : pairingStatus?.isPaired ? (
              <PairingStatus
                teamRole={pairingStatus.teamRole || 'Team A'}
                partnerSessionId={pairingStatus.partnerSessionId || ''}
                pairId={pairingStatus.pairId || ''}
                partnerMetrics={partnerMetrics}
                onStartGame={handleStartGame}
                isLoading={isStartingGame}
                autoStartCountdown={autoStartCountdown}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
