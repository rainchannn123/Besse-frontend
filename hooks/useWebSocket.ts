import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ErrorCallback,
  GameEvent,
  GameState,
  GameStateCallback,
  Notification,
  PlayerActionCallback,
  SocketCallback,
  SystemMessageCallback,
} from '../lib/websocket/socketManager';
import { socketManager } from '../lib/websocket/socketManager';

export const useWebSocket = () => {
  const isConnectedRef = useRef(socketManager.isConnected());
  const [isConnected, setIsConnected] = useState(socketManager.isConnected());
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pairingStatus, setPairingStatus] = useState<any>(null);
  const [realtimeUpdate, setRealtimeUpdate] = useState<any>(null);
    const [pairData, setPairData] = useState<any>(null);
  const router = useRouter();

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const notification: Notification = {
      id: Date.now(),
      message,
      type,
    };
    setNotifications((prev) => [...prev.slice(-4), notification]);
  }, []);

  // ✅ Check if this is an admin page
  const isAdminPage = typeof window !== 'undefined' && 
    (window.location.pathname?.startsWith('/admin') || 
     window.location.pathname?.startsWith('/dashboard/admin-game-room/'));

  useEffect(() => {
    // ✅ Skip WebSocket connection for admin pages
    if (isAdminPage) {
      console.log('[useWebSocket] Skipping WebSocket for admin page:', window.location.pathname);
      return;
    }

    socketManager.connect();

    const handleConnect: SocketCallback = () => {
      isConnectedRef.current = true;
      setIsConnected(true);
      addNotification('Connected to game server', 'success');
    };

    const handleDisconnect: SocketCallback = () => {
      isConnectedRef.current = false;
      setIsConnected(false);
      addNotification('Disconnected from game server', 'warning');
    };

    const handleConnectionError: ErrorCallback = (error) => {
      addNotification(`Connection error: ${error.message}`, 'error');
    };

        // Game state updates
    const handleGameStateUpdate: GameStateCallback = (data) => {
      setGameState(data.gameState);
    };

    // Action-level game state updates (same shape, plus action metadata)
    const handleGameStateUpdated: SocketCallback = (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    };

    // Full game state with computed extras (authoritative source)

    const handleGameStateFull: SocketCallback = (data: any) => {
      if (data.gameState) {
        setGameState(data.gameState);
        // Check if game is over
        if (
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'won' ||
          data.gameState.gameStatus === 'complete'
        ) {
          // Individual pages handle navigation to game-over
          router.push('/dashboard/game-over');
        }
      }
      if (data.realtimeUpdate) {
        setRealtimeUpdate(data.realtimeUpdate);
      }
      if (data.pairData) {
        setPairData(data.pairData);
      }
      // Store additional computed data for pages to use
      if (
        data.playerRoles ||
        data.playerNames ||
        data.countdownTimeRemaining ||
        data.turnSummary ||
        data.statistics ||
        data.actionType
      ) {
        // This data is used by individual pages through their event handlers
      }
    };

    // System messages
    const handleSystemMessage: SystemMessageCallback = (data) => {
      addNotification(data.message, data.type);
    };

    // Player actions
    const handlePlayerAction: PlayerActionCallback = (data) => {
      addNotification(`${data.playerName} performed: ${data.action}`, 'info');
    };

    // Game-specific events
    const handleJoinedGame: SocketCallback = (data) => {
      // console.log('Successfully joined game');
      addNotification('Successfully joined game room', 'success');
    };

    const handleWasteCollected: GameStateCallback = (data) => {
      setGameState(data.gameState);
      addNotification('Waste collected successfully', 'success');
    };

    const handleWasteRejected: GameStateCallback = (data) => {
      setGameState(data.gameState);
      addNotification('Waste rejected - landfill penalties applied', 'warning');
    };

    const handleWasteProcessed: GameStateCallback = (data) => {
      setGameState(data.gameState);
      addNotification('Waste processed into materials', 'success');
    };

    const handleMaterialGraded: GameStateCallback = (data) => {
      setGameState(data.gameState);
      addNotification('Material graded', 'info');
    };

    const handleMaterialOrdered: GameStateCallback = (data) => {
      setGameState(data.gameState);
      addNotification('Material order placed', 'success');
    };

    const handleMaterialSoldExternal: GameStateCallback = (data) => {
      setGameState(data.gameState);
      addNotification('Material sold to external market', 'success');
    };

    const handleMaterialTransferred: GameStateCallback = (data) => {
      setGameState(data.gameState);
      addNotification('Material transferred to municipality', 'info');
    };

    const handleGameComplete: SocketCallback = (data: any) => {
      if (data.gameState) {
        setGameState(data.gameState);
      }
      addNotification(
        `Game Complete! Pair Score: ${data.pairAverageHealth?.toFixed(1) || 'N/A'}%`,
        'success'
      );
      router.push('/dashboard/game-over');
    };

    const handleSystemCheckUpdate: GameStateCallback = (data) => {
      setGameState(data.gameState);
      // Optional: Show subtle update indicator
    };

    const handleTurnEnded: GameStateCallback = (data) => {
      setGameState(data.gameState);
      addNotification(`Turn ${data.gameState?.currentTurn || 'unknown'} completed`, 'info');
    };

    // Pairing system events - NOTE: These are handled by usePairingSystem hook
    // We still set up basic handlers here for logging/notifications, but
    // usePairingSystem is responsible for state management
    const handlePairingJoined: SocketCallback = (data: any) => {
      // console.log('[useWebSocket] pairing-joined event:', data);
      // Don't update state here - let usePairingSystem handle it
    };

    const handlePairingStatusUpdate: SocketCallback = (data: any) => {
      // console.log('[useWebSocket] pairing-status-update event:', data);
      // Don't update state here - let usePairingSystem handle it
    };

    const handleTeamsPaired: SocketCallback = (data: any) => {
      // console.log('[useWebSocket] teams-paired event:', data);
      // Don't update state here - let usePairingSystem handle it
      // Just show a notification
      addNotification(`Teams paired! You are ${data.teamRole}`, 'success');
    };

    const handlePartnerEliminated: SocketCallback = (data: any) => {
      // console.log('[useWebSocket] partner-eliminated event:', data);
      addNotification(
        `Partner team ${data.partnerSessionId} eliminated: ${data.reason}`,
        'warning'
      );
      // Don't update state here - let usePairingSystem handle it
    };

    const handlePairingLeft: SocketCallback = (data: any) => {
      // console.log('[useWebSocket] pairing-left event:', data);
      // Don't update state here - let usePairingSystem handle it
    };

    const handleError: ErrorCallback = (error) => {
      // Skip non-critical access errors (stale session on reconnect)
      if (error?.message === 'You do not have access to this game session') return;
      console.error('Game error:', error);
      addNotification(`Error: ${error.message || 'Something went wrong'}`, 'error');
    };

    // Subscribe to all events
    socketManager.on('connected', handleConnect);
    socketManager.on('disconnected', handleDisconnect);
    socketManager.on('connection_error', handleConnectionError);
        socketManager.on('game-state-update', handleGameStateUpdate);
    socketManager.on('game-state-updated', handleGameStateUpdated);
    socketManager.on('game-state-full', handleGameStateFull);

    const handleLobbyStateUpdate: SocketCallback = (_data: any) => {
      addNotification('Lobby state updated', 'info');
    };
    socketManager.on('lobby-state-update', handleLobbyStateUpdate);
    socketManager.on('system-message', handleSystemMessage);
    socketManager.on('player-action', handlePlayerAction);
    socketManager.on('joined-game', handleJoinedGame);
    socketManager.on('waste-collected', handleWasteCollected);
    socketManager.on('waste-rejected', handleWasteRejected);
    socketManager.on('waste-processed', handleWasteProcessed);
    socketManager.on('material-graded', handleMaterialGraded);
    socketManager.on('material-ordered', handleMaterialOrdered);
    socketManager.on('material-sold-external', handleMaterialSoldExternal);
    socketManager.on('material-transferred', handleMaterialTransferred);
    socketManager.on('system-check-update', handleSystemCheckUpdate);
    socketManager.on('turn-ended', handleTurnEnded);
    socketManager.on('game-complete', handleGameComplete);
    socketManager.on('pairing-joined', handlePairingJoined);
    socketManager.on('pairing-status-update', handlePairingStatusUpdate);
    socketManager.on('teams-paired', handleTeamsPaired);
    socketManager.on('partner-eliminated', handlePartnerEliminated);
        socketManager.on('pairing-left', handlePairingLeft);
    const handlePairScoreUpdated: SocketCallback = (data: any) => {
      addNotification(`Pair score updated: ${data.averagePairHealth}%`, 'info');
    };
    const handleCountdownExpired: SocketCallback = () => {
      addNotification('Countdown expired!', 'warning');
    };
    const handleCountdownStarted: SocketCallback = (data: any) => {
      const reason = data?.reason || 'unknown';
      addNotification(`Game over countdown started: ${reason}`, 'warning');
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    };
    const handleCountdownCancelled: SocketCallback = (data: any) => {
      addNotification('Countdown cancelled!', 'info');
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    };
    const handleAuctionUpdated: SocketCallback = (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    };
    const handleLobbyActivated: SocketCallback = () => {
      addNotification('Game is starting...', 'success');
    };
    const handleGameStarted: SocketCallback = (data: any) => {
      addNotification('Game has started!', 'success');
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    };

    socketManager.on('pair-score-updated', handlePairScoreUpdated);
    socketManager.on('countdown-expired', handleCountdownExpired);
    socketManager.on('countdown-started', handleCountdownStarted);
    socketManager.on('countdown-cancelled', handleCountdownCancelled);
    socketManager.on('auction-updated', handleAuctionUpdated);
    socketManager.on('lobby-activated', handleLobbyActivated);
    socketManager.on('game-started', handleGameStarted);
    socketManager.on('error', handleError);

    return () => {
      // Clean up all event listeners
      socketManager.off('connected', handleConnect);
      socketManager.off('disconnected', handleDisconnect);
      socketManager.off('connection_error', handleConnectionError);
            socketManager.off('game-state-update', handleGameStateUpdate);
      socketManager.off('game-state-updated', handleGameStateUpdated);
      socketManager.off('game-state-full', handleGameStateFull);

      socketManager.off('lobby-state-update', handleLobbyStateUpdate);
      socketManager.off('system-message', handleSystemMessage);
      socketManager.off('player-action', handlePlayerAction);
      socketManager.off('joined-game', handleJoinedGame);
      socketManager.off('waste-collected', handleWasteCollected);
      socketManager.off('waste-rejected', handleWasteRejected);
      socketManager.off('waste-processed', handleWasteProcessed);
      socketManager.off('material-graded', handleMaterialGraded);
      socketManager.off('material-ordered', handleMaterialOrdered);
      socketManager.off('material-sold-external', handleMaterialSoldExternal);
      socketManager.off('material-transferred', handleMaterialTransferred);
      socketManager.off('system-check-update', handleSystemCheckUpdate);
      socketManager.off('turn-ended', handleTurnEnded);
      socketManager.off('game-complete', handleGameComplete);
      socketManager.off('pairing-joined', handlePairingJoined);
      socketManager.off('pairing-status-update', handlePairingStatusUpdate);
      socketManager.off('teams-paired', handleTeamsPaired);
      socketManager.off('partner-eliminated', handlePartnerEliminated);
            socketManager.off('pairing-left', handlePairingLeft);
      socketManager.off('pair-score-updated', handlePairScoreUpdated);
      socketManager.off('countdown-expired', handleCountdownExpired);
      socketManager.off('countdown-started', handleCountdownStarted);
      socketManager.off('countdown-cancelled', handleCountdownCancelled);
      socketManager.off('auction-updated', handleAuctionUpdated);
      socketManager.off('lobby-activated', handleLobbyActivated);
      socketManager.off('game-started', handleGameStarted);
      socketManager.off('error', handleError);
    };
  }, [addNotification, isAdminPage, router]);

  

  const subscribe = useCallback((event: GameEvent, callback: SocketCallback) => {
    socketManager.on(event, callback);
    return () => {
      socketManager.off(event, callback);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketManager.emit(event, data);
  }, []);

  // Game-specific methods
  const joinGame = useCallback((sessionId: string) => {
    socketManager.joinGame(sessionId);
  }, []);

  const leaveGame = useCallback((sessionId: string) => {
    socketManager.leaveGame(sessionId);
  }, []);

  const getCurrentGameSession = useCallback(() => {
    return socketManager.getCurrentGameSession();
  }, []);

  // Game actions
  const collectWaste = useCallback((data: any) => {
    socketManager.collectWaste(data);
  }, []);

  const rejectWaste = useCallback((data: any) => {
    socketManager.rejectWaste(data);
  }, []);

  const orderMaterial = useCallback((data: any) => {
    socketManager.orderMaterial(data);
  }, []);

  const endTurn = useCallback((data: any) => {
    socketManager.endTurn(data);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Memoize return value to prevent unnecessary re-renders
  const api = useMemo(
    () => ({
      isConnected,
      gameState,
      notifications,
      pairingStatus,
      realtimeUpdate,
      pairData,
      subscribe,
      emit,
      joinGame,
      leaveGame,
      getCurrentGameSession,
      collectWaste,
      rejectWaste,
      orderMaterial,
      endTurn,
      clearNotifications,
      removeNotification,
      addNotification,
    }),
    [
      isConnected,
      gameState,
      notifications,
      pairingStatus,
      realtimeUpdate,
      subscribe,
      emit,
      joinGame,
      leaveGame,
      getCurrentGameSession,
      clearNotifications,
      removeNotification,
      addNotification,
    ]
  );

  return api;
};

// Specialized hook for game sessions
export const useGameWebSocket = (
  sessionId?: string,
  setPairingStatus?: (status: any) => void,
  setRealtimeUpdate?: (update: any) => void,
  setPairData?: (pairData: any) => void
) => {
  const {
    isConnected,
    gameState,
    notifications,
    pairingStatus,
    realtimeUpdate,
    pairData,
    subscribe,
    emit,
    joinGame,
    leaveGame,
    getCurrentGameSession,
    collectWaste,
    rejectWaste,
    orderMaterial,
    endTurn,
    clearNotifications,
    removeNotification,
    addNotification,
  } = useWebSocket();

  useEffect(() => {
    if (sessionId && isConnected) {
      joinGame(sessionId);
    }

    return () => {
      if (sessionId) {
        leaveGame(sessionId);
      }
    };
  }, [sessionId, isConnected, joinGame, leaveGame]);

  // Sync pairing status with external store if provided
  useEffect(() => {
    if (setPairingStatus && pairingStatus !== undefined) {
      setPairingStatus(pairingStatus);
    }
  }, [pairingStatus, setPairingStatus]);

  // Sync realtime update with external store if provided
  useEffect(() => {
    if (setRealtimeUpdate && realtimeUpdate !== undefined) {
      setRealtimeUpdate(realtimeUpdate);
    }
  }, [realtimeUpdate, setRealtimeUpdate]);

  // Sync pair data with external store if provided
  useEffect(() => {
    if (setPairData && pairData !== undefined) {
      setPairData(pairData);
    }
  }, [pairData, setPairData]);

  return {
    isConnected,
    gameState,
    notifications,
    pairingStatus,
    realtimeUpdate,
    pairData,
    subscribe,
    emit,
    collectWaste,
    rejectWaste,
    orderMaterial,
    endTurn,
    clearNotifications,
    removeNotification,
    addNotification,
    joinGame,
    leaveGame,
    currentGameSession: getCurrentGameSession(),
  };
};