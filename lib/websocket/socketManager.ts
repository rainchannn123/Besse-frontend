import { GameState } from '@/types/besse';
import { secureStorage } from '@/utils/secureStorage';
import { io, Socket } from 'socket.io-client';

// Define event types for better TypeScript support
export type GameEvent =
  | 'connected'
  | 'disconnected'
  | 'connection_error'
  | 'joined-game'
  | 'game-state-update'
  | 'game-state-full'
  | 'lobby-state-update'
  | 'waste-collected'
  | 'waste-rejected'
  | 'material-ordered'
  | 'waste-processed'
  | 'material-graded'
  | 'material-sold-external'
  | 'material-transferred'
  | 'system-check-update'
  | 'turn-ended'
  | 'game-complete'
  | 'system-message'
  | 'player-action'
  | 'pairing-joined'
  | 'pairing-status-update'
  | 'teams-paired'
  | 'partner-eliminated'
  | 'pairing-left'
  | 'pair-score-updated'
  | 'countdown-expired'
  | 'countdown-started'
  | 'countdown-cancelled'
  | 'error'
  | 'external-purchase'
  | string;

// Define specific callback types
export type SocketCallback = (...args: any[]) => void;
export type GameStateCallback = (data: { gameState: GameState }) => void;
export type SystemMessageCallback = (data: SystemMessageData) => void;
export type PlayerActionCallback = (data: PlayerActionData) => void;
export type ErrorCallback = (error: any) => void;

export interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// Re-export GameState from types
export type { GameState };

export interface SystemMessageData {
  message: string;
  type: Notification['type'];
}

export interface PlayerActionData {
  playerName: string;
  action: string;
}

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Store event listeners for the pub/sub pattern
  private eventListeners: Map<string, Set<SocketCallback>> = new Map();

  // Game-specific state
  private currentGameSession: string | null = null;
  private lastJoinedSession: string | null = null;
  private lastJoinedSocketId: string | null = null;

  connect(): void {
    if (this.socket?.connected) {
      // console.log('Socket already connected');
      return;
    }

    // Restore game session from localStorage before connecting
    // This ensures we can rejoin the game room immediately after connection
    this.restoreGameSession();

    const token = secureStorage.getItem('auth_token');
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    if (!socketUrl) {
      console.error('NEXT_PUBLIC_SOCKET_URL is not defined');
      return;
    }

    if (!token) {
      console.warn('No auth token found, cannot connect');
      return;
    }

    // console.log('Attempting to connect to socket:', socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    this.setupEventHandlers();
    this.setupGameEventForwarding();
  }

  disconnect(): void {
    // Leave current game if connected
    if (this.currentGameSession) {
      this.leaveGame(this.currentGameSession);
      this.currentGameSession = null;
      this.persistGameSession(null);
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear all event listeners
    this.eventListeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Enhanced event handling with pub/sub pattern
  on(event: GameEvent, callback: SocketCallback): void {
    // Store callback for internal pub/sub
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Also set up socket.io listener for game events
    if (this.isGameEvent(event)) {
      this.socket?.on(event, callback);
    }
  }

  off(event: GameEvent, callback?: SocketCallback): void {
    // Remove from internal pub/sub
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      if (callback) {
        listeners.delete(callback);
      } else {
        listeners.clear();
      }

      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }

    // Remove from socket.io
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  // Game-specific methods
  joinGame(sessionId: string): void {
    this.currentGameSession = sessionId;
    this.persistGameSession(sessionId);
    // console.log(
    //   '[SocketManager] joinGame called:',
    //   'sessionId:',
    //   sessionId,
    //   'socket connected:',
    //   this.socket?.connected,
    //   'socket exists:',
    //   !!this.socket
    // );

    if (!this.socket?.connected) {
      console.warn(
        '[SocketManager] Cannot emit join-game yet: WebSocket not connected. Stored sessionId, will rejoin when socket connects.'
      );
      return;
    }

    const socketId = this.socket.id || null;
    if (this.lastJoinedSession === sessionId && this.lastJoinedSocketId === socketId) {
      return;
    }

    // console.log('[SocketManager] EMITTING join-game event for sessionId:', sessionId);
    this.socket.emit('join-game', { sessionId });
    this.lastJoinedSession = sessionId;
    this.lastJoinedSocketId = socketId;
  }

  leaveGame(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-game', { sessionId });
    }

    if (this.lastJoinedSession === sessionId) {
      this.lastJoinedSession = null;
      this.lastJoinedSocketId = null;
    }

    if (this.currentGameSession === sessionId) {
      this.currentGameSession = null;
      this.persistGameSession(null);
    }
  }

  // Game actions
  collectWaste(data: any): void {
    this.emit('collect-waste', data);
  }

  rejectWaste(data: any): void {
    this.emit('reject-waste', data);
  }

  orderMaterial(data: any): void {
    this.emit('order-material', data);
  }

  endTurn(data: any): void {
    this.emit('end-turn', data);
  }

  getCurrentGameSession(): string | null {
    // If currentGameSession is null, try to restore from localStorage
    if (!this.currentGameSession) {
      this.restoreGameSession();
    }
    return this.currentGameSession;
  }

  /**
   * Persist the current game session to localStorage so it survives page reloads
   */
  private persistGameSession(sessionId: string | null): void {
    if (sessionId) {
      try {
        localStorage.setItem('current_game_session', sessionId);
        // console.log('Persisted game session to localStorage:', sessionId);
      } catch (e) {
        console.warn('Failed to persist game session to localStorage:', e);
      }
    } else {
      try {
        localStorage.removeItem('current_game_session');
        // console.log('Cleared game session from localStorage');
      } catch (e) {
        console.warn('Failed to clear game session from localStorage:', e);
      }
    }
  }

  /**
   * Restore the current game session from localStorage after page reload
   */
  private restoreGameSession(): void {
    try {
      const sessionId = localStorage.getItem('current_game_session');
      if (sessionId) {
        this.currentGameSession = sessionId;
        // console.log('Restored game session from localStorage:', sessionId);
      }
    } catch (e) {
      console.warn('Failed to restore game session from localStorage:', e);
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      // console.log('[SocketManager] WebSocket CONNECTED, socket id:', this.socket?.id);
      this.reconnectAttempts = 0; // Reset counter on successful connect
      this.emitEvent('connected');

      // Ensure we have the latest session from localStorage
      // (in case it was set while we were disconnected)
      if (!this.currentGameSession) {
        this.restoreGameSession();
      }

      // Re-join game if we were in one before disconnect or page reload
      if (this.currentGameSession) {
        // console.log('[SocketManager] AUTO-REJOINING game session:', this.currentGameSession);
        // Use setTimeout to ensure the connection is fully established
        setTimeout(() => {
          if (this.currentGameSession) {
            this.joinGame(this.currentGameSession);
          }
        }, 100);
      } else {
        // console.log('[SocketManager] No currentGameSession to rejoin');
      }
    });

    this.socket.on('disconnect', (reason: any) => {
      // console.log('WebSocket disconnected:', reason);
      this.lastJoinedSession = null;
      this.lastJoinedSocketId = null;
      this.emitEvent('disconnected');
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      this.emitEvent('connection_error', error);
      this.handleReconnect();
    });

    this.socket.on('reconnect_attempt', (attempt: any) => {
      // console.log(`WebSocket reconnect attempt ${attempt}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnect failed');
    });

    // Default error handler
    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      this.emitEvent('error', error);
    });

    // Forward any incoming event to the internal event system so listeners
    // can subscribe to events that aren't listed in `gameEvents` above.
    // This makes the socketManager resilient to new backend events like
    // `waste-generated` without needing to update the hard-coded list.
    this.socket.onAny((event: string, ...args: any[]) => {
      try {
        const payload = args.length === 1 ? args[0] : args;
        // console.log(`[SocketManager] Received event: '${event}'`, payload);
        this.emitEvent(event as GameEvent, payload);
      } catch (err) {
        console.error('Error forwarding event', event, err);
      }
    });
  }

  private setupGameEventForwarding(): void {
    if (!this.socket) return;

    const gameEvents: GameEvent[] = [
      'joined-game',
      'game-state-update',
      'game-state-full',
      'lobby-state-update',
      'waste-collected',
      'waste-rejected',
      'material-ordered',
      'waste-processed',
      'material-graded',
      'material-sold-external',
      'material-transferred',
      'system-check-update',
      'turn-ended',
      'game-complete',
      'system-message',
      'player-action',
      'pairing-joined',
      'pairing-status-update',
      'teams-paired',
      'partner-eliminated',
      'pairing-left',
      'pair-score-updated',
      'countdown-expired',
      'countdown-started',
      'countdown-cancelled',
      'external-purchase',
      'lobby-activated',
      'game-started',
    ];

    gameEvents.forEach((event) => {
      this.socket?.on(event, (data: any) => {
        // Forward to internal event system
        this.emitEvent(event, data);
      });
    });
  }

  private emitEvent(event: GameEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private isGameEvent(event: string): boolean {
    const gameEvents = [
      'joined-game',
      'game-state-update',
      'game-state-full',
      'lobby-state-update',
      'waste-collected',
      'waste-rejected',
      'material-ordered',
      'waste-processed',
      'material-graded',
      'material-sold-external',
      'material-transferred',
      'system-check-update',
      'turn-ended',
      'game-complete',
      'system-message',
      'player-action',
      'pairing-joined',
      'pairing-status-update',
      'teams-paired',
      'partner-eliminated',
      'pairing-left',
      'pair-score-updated',
      'countdown-expired',
      'countdown-started',
      'countdown-cancelled',
      'auction-updated',
      'bid-placed',
      'material-graded',
      'external-purchase',
      'lobby-activated',
      'game-started',
    ];
    return gameEvents.includes(event);
  }

  private handleReconnect(): void {
    // Socket.io has built-in reconnection now, so we just log attempts
    // console.log(`Reconnect attempts: ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
  }
}

export const socketManager = new SocketManager();
