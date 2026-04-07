'use client';

import MunicipalityCustomHeader from '@/components/layout/header/customheader/MunicipalityCustomHeader';
import GameModeBadge from '@/components/ui/GameModeBadge';
import { MRFCollect } from '@/components/ui/MRFCollect/MRFCollect';
import { PendingAuctionAction } from '@/components/ui/pendingAuctionAction/PendingAuctionAction';
import { MRFCollectionSelectedBox } from '@/components/ui/selectedBox/MRFCollectionSelectedBox';
import {
  MRFPendingAuctionSelectedBox,
  PendingAuction,
} from '@/components/ui/selectedBox/MRFPendingAuctionSelectedBox';
import ShiftLog from '@/components/ui/shiftLog/ShiftLog';
import { SurrenderButton } from '@/components/ui/surrenderButton/SurrenderButton';
import { useWebSocket } from '@/hooks/useWebSocket';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHead from '@/public/assets/images/woodenHead.png';
import { gameService } from '@/services/gameService';
import { mrfService } from '@/services/mrfService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { GameState, Material, WasteBatch } from '@/types/besse';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function MRFCollectionPage() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'collection' | 'inventory' | 'pending-auctions'>(
    'collection'
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Material[]>([]);
  const [pendingAuctions, setPendingAuctions] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<WasteBatch | Material | any | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullPayload, setFullPayload] = useState<any | null>(null);
  const [turnSummary, setTurnSummary] = useState<any | null>(null);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [lastActionType, setLastActionType] = useState<string | null>(null);
  const [gameMode] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('game_mode') : null
  );
  const { getCurrentGameSession, notifications, isConnected, subscribe, joinGame, emit } = useWebSocket();

  // console.log({ currentGame: getCurrentGameSession(), notifications });

  const currentGameState = gameState;
  const fetchGameState = async () => {
    if (!user?.currentSession) {
      setError('No active session found');
      setLoading(false);
      return;
    }

    try {
      const response = await gameService.getGameState(user.currentSession);
      if (response.success && response.data) {
        setGameState(response.data.gameState);
        // Store init_state and current_game_session in localStorage
        if (
          response.data.gameState.gameStatus === 'complete' ||
          response.data.gameState.gameStatus === 'won' ||
          response.data.gameState.gameStatus === 'lost'
        ) {
          router.push('/dashboard/game-over');
        }
        localStorage.setItem('init_state', JSON.stringify(response.data.gameState));
        localStorage.setItem('current_game_session', response.data.gameState.sessionId);
      } else {
        setError(response.message || 'Failed to fetch game state');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch game state');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async () => {
    if (!user?.currentSession) return;
    try {
      const response = await mrfService.getMRFQueue(user.currentSession);
      if (response.success && response.data) {
        setQueue(response.data.queue);
      }
    } catch (err: any) {
      console.error('Failed to fetch MRF queue', err);
    }
  };

  const fetchInventory = async () => {
    if (!user?.currentSession) return;
    try {
      const response = await mrfService.getMRFInventory(user.currentSession);
      if (response.success && response.data) {
        const notListInventory = response.data.inventory.filter(
          (item) => item.owner === 'mrf' && !item.listed
        );
        // console.log('Fetched MRF Inventory:', notListInventory);
        setInventory(notListInventory);
      }
    } catch (err: any) {
      console.error('Failed to fetch MRF inventory', err);
    }
  };

  const fetchPendingAuctions = async () => {
    if (!user?.currentSession) return;
    try {
      const response = await mrfService.getPendingAuctions(user.currentSession);
      if (response.success && response.data) {
        setPendingAuctions(response.data.pendingAuctions);
      }
    } catch (err: any) {
      console.error('Failed to fetch pending auctions', err);
    }
  };

  useEffect(() => {
    fetchGameState();
    fetchQueue();
    fetchInventory();
    fetchPendingAuctions();
  }, []);

  // Clear selected item when switching tabs
  useEffect(() => {
    setSelectedItem(null);
    setSelectedGrade('');
  }, [activeTab]);

  useEffect(() => {
    if (selectedItem && 'quality' in selectedItem) {
      setSelectedGrade(selectedItem.quality);
    } else {
      setSelectedGrade('');
    }
  }, [selectedItem]);

  // Live log items from websocket events (system messages, player actions)
  const [liveLogItems, setLiveLogItems] = useState<
    {
      time: string;
      message: string;
      isLive?: boolean;
      type?: 'info' | 'warning' | 'error';
    }[]
  >([]);
  // throttle helper refs for applying full state
  const lastAppliedRef = useRef<number>(0);
  const pendingPayloadRef = useRef<any | null>(null);
  const shiftStartTimeRef = useRef<number>(0);

  // Join the user's current session when websocket connects
  useEffect(() => {
    if (user?.currentSession && isConnected) {
      // console.log('MRF Collection page: Calling joinGame with sessionId:', user.currentSession);
      joinGame(user.currentSession);
    } else {
      // console.log(
      //   'MRF Collection page: Not joining yet - user.currentSession:',
      //   user?.currentSession,
      //   'isConnected:',
      //   isConnected
      // );
    }
  }, [user?.currentSession, isConnected, joinGame]);

  // Subscribe to realtime events
  useEffect(() => {
    // Game state updates
    const unsubGameStateUpdate = subscribe('game-state-update', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        // Check if game is over
        if (
          data.gameState.gameStatus === 'won' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'complete'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    // Full game state with computed extras (authoritative source)
    const unsubGameStateFull = subscribe('game-state-full', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        // Check if game is over
        if (
          data.gameState.gameStatus === 'won' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'complete'
        ) {
          router.push('/dashboard/game-over');
        }
      }
      if (data?.realtimeUpdate) {
        // Handle realtime update data if needed
      }
      if (data?.turnSummary) setTurnSummary(data.turnSummary);
      if (data?.statistics) setStatistics(data.statistics);
      if (typeof data?.countdownTimeRemaining === 'number')
        setCountdownRemaining(data.countdownTimeRemaining);
      setLastActionType(data?.actionType || null);
    });

    // System check updates (30s interval)
    const unsubSystemCheckUpdate = subscribe('system-check-update', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // Turn ended
    const unsubTurnEnded = subscribe('turn-ended', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // Handle all game actions via game-state-updated event with actionType
    const unsubGameActions = subscribe('game-state-updated', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }

      // Handle specific actions based on actionType
      const actionType = data?.actionType;
      if (actionType === 'waste-collected') {
        // console.log('[MRF Collection] Waste collected - refreshing queue and inventory');
        fetchQueue();
      } else if (actionType === 'waste-processed') {
        // console.log('[MRF Collection] Waste processed - refreshing queue and inventory');
        fetchQueue();
        fetchPendingAuctions();
      } else if (actionType === 'material-graded') {
        // console.log('[MRF Collection] Material graded - refreshing inventory and auctions');

        fetchPendingAuctions();
      } else if (actionType === 'material-sold-external' || actionType === 'material-transferred') {
        // console.log(`[MRF Collection] ${actionType} - refreshing inventory`);
        fetchInventory();
      } else if (actionType === 'auction-updated') {
        // console.log('[MRF Collection] Auction updated - refreshing pending auctions');
        fetchPendingAuctions();
      }
    });

    // COUNTDOWN EXPIRED EVENT - ADDED
    const unsubCountdownExpired = subscribe('countdown-expired', (data: any) => {
      // console.log('Countdown expired received in MRF page:', data);

      // Update game state if provided
      if (data?.gameState) {
        setGameState(data.gameState);

        // Check if game is over
        if (
          data.gameState.gameStatus === 'won' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'complete'
        ) {
          setTimeout(() => {
            router.push('/dashboard/game-over');
          }, 3000); // Redirect after 3 seconds
        }
      }

      // Refresh queue, inventory and pending auctions
      fetchQueue();
      fetchInventory();
      fetchPendingAuctions();
    });

    // COUNTDOWN STARTED EVENT - ADDED
    const unsubCountdownStarted = subscribe('countdown-started', (data: any) => {
      // console.log('Countdown started received in MRF page:', data);
      // Update game state if provided to start the countdown
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // COUNTDOWN CANCELLED EVENT - ADDED
    const unsubCountdownCancelled = subscribe('countdown-cancelled', (data: any) => {
      // console.log('Countdown cancelled received in MRF page:', data);
      // Update game state if provided to clear the countdown
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // Player actions for live log
    const unsubPlayerAction = subscribe('player-action', (data: any) => {
      const st = shiftStartTimeRef.current;
      const elapsed = st ? Math.max(0, Date.now() - new Date(st).getTime()) : 0;
      let durationMin = 15;
      try { const stored = localStorage.getItem('init_state'); if (stored) { const p = JSON.parse(stored); if (p?.constants?.REAL_TIME_GAME_DURATION_MINUTES) durationMin = p.constants.REAL_TIME_GAME_DURATION_MINUTES; } } catch {}
      const remainingMs = Math.max(0, durationMin * 60 * 1000 - elapsed);
      const mins = Math.floor(remainingMs / 60000);
      const secs = Math.floor((remainingMs % 60000) / 1000);
      const time = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}]`;
      const message = data?.playerName
        ? `${data.playerName} ${data.action || ''}`
        : JSON.stringify(data);
      setLiveLogItems((prev) => [...prev, { time, message, isLive: true }].slice(-100));
    });

    // TEMPORARILY COMMENTED OUT - system messages for live log
    const unsubSystemMessage = subscribe('system-message', (_data: any) => {
      // const st = shiftStartTimeRef.current;
      // const elapsed = st ? Math.max(0, Date.now() - new Date(st).getTime()) : 0;
      // let durationMin = 15;
      // try { const stored = localStorage.getItem('init_state'); if (stored) { const p = JSON.parse(stored); if (p?.constants?.REAL_TIME_GAME_DURATION_MINUTES) durationMin = p.constants.REAL_TIME_GAME_DURATION_MINUTES; } } catch {}
      // const remainingMs = Math.max(0, durationMin * 60 * 1000 - elapsed);
      // const mins = Math.floor(remainingMs / 60000);
      // const secs = Math.floor((remainingMs % 60000) / 1000);
      // const time = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}]`;
      // setLiveLogItems((prev) =>
      //   [...prev, { time, message: data.message, isLive: true, type: data.type }].slice(-100)
      // );
    });

    const unsubSurrenderUpdate = subscribe('surrender-update', (data: any) => {
      if (data?.surrenderVotes) {
        setGameState((prev) => prev ? { ...prev, surrenderVotes: data.surrenderVotes } : prev);
      }
    });

    return () => {
      unsubGameStateUpdate && unsubGameStateUpdate();
      unsubGameStateFull && unsubGameStateFull();
      unsubSystemCheckUpdate && unsubSystemCheckUpdate();
      unsubTurnEnded && unsubTurnEnded();
      unsubGameActions && unsubGameActions();
      unsubCountdownExpired && unsubCountdownExpired(); // Added cleanup
      unsubCountdownStarted && unsubCountdownStarted(); // Added cleanup
      unsubCountdownCancelled && unsubCountdownCancelled(); // Added cleanup
      unsubPlayerAction && unsubPlayerAction();
      unsubSystemMessage && unsubSystemMessage();
      unsubSurrenderUpdate && unsubSurrenderUpdate();
    };
  }, [subscribe, router, fetchQueue, fetchInventory, fetchPendingAuctions]);

  // Compute countdown-style timestamps for static logs
  const getDurationMinutes = () => {
    const c = currentGameState?.constants as any;
    if (c?.REAL_TIME_GAME_DURATION_MINUTES) return c.REAL_TIME_GAME_DURATION_MINUTES;
    try {
      const stored = localStorage.getItem('init_state');
      if (stored) { const p = JSON.parse(stored); if (p?.constants?.REAL_TIME_GAME_DURATION_MINUTES) return p.constants.REAL_TIME_GAME_DURATION_MINUTES; }
    } catch {}
    return 15;
  };
  const totalDurMin = getDurationMinutes();
  // TEMPORARILY COMMENTED OUT - static activity log messages
  // const staticLogData =
  //   currentGameState?.activityLog?.map((log, index) => {
  //     const elapsedMin = ((index + 1) / (currentGameState.activityLog?.length || 1)) * (currentGameState.minutesElapsed || 0);
  //     const remainMin = Math.max(0, totalDurMin - elapsedMin);
  //     const remMins = Math.floor(remainMin);
  //     const remSecs = Math.floor((remainMin - remMins) * 60);
  //     return {
  //       time: `[${String(remMins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}]`,
  //       message: log,
  //     };
  //   })?.reverse() || [];
  const staticLogData: { time: string; message: string }[] = [];

  // Use authoritative state from `fullPayload` when available
  const authoritativeState = fullPayload?.gameState ?? currentGameState;

  // For formatted logs, merge static activity log with live websocket logs
  const logData = [...staticLogData, ...liveLogItems];

  // Derived UI: combine summaries for display
  const stats =
    statistics ||
    (authoritativeState as any)?.statistics ||
    (currentGameState as any)?.statistics ||
    null;

  const shiftStart = authoritativeState
    ? `${String(authoritativeState.gameStartTime).padStart(2, '0')}:00`
    : '00:00';

  const shiftStartTime = authoritativeState
    ? Date.now() - (authoritativeState.minutesElapsed || 0) * 60 * 1000
    : 0;

  // Keep ref in sync for use in websocket callbacks
  useEffect(() => {
    shiftStartTimeRef.current = typeof shiftStartTime === 'number' ? shiftStartTime : 0;
  }, [shiftStartTime]);

  const handleStatusLog = useCallback((log: { time: string; message: string; isLive?: boolean; type?: 'info' | 'warning' | 'error' }) => {
    setLiveLogItems((prev) => [...prev, log].slice(-100));
  }, []);

  // Filter waste batches that are in the MRF queue
  const availableBatches = ((gameState as any)?.wasteBatches || []).filter((batch: WasteBatch) =>
    queue.some((q) => q.batchId === batch.id)
  );

  if (loading) {
    return (
      <div className="bg-[#f3e9da] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner border-4 border-gray-200 border-t-blue-600 rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#f3e9da] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleProcessWaste = async () => {
    if (selectedItem && user?.currentSession) {
      const queueItem = queue.find((q) => q.batchId === selectedItem.id);
      if (!queueItem) {
        addNotification({
          message: 'Queue item not found',
          type: 'error',
        });
        return;
      }
      const response = await mrfService.processWaste({
        queueId: queueItem.id,
        sessionId: user.currentSession,
      });
      if (response.success) {
        addNotification({
          message: 'Material Sent to Inventory',
          type: 'success',
        });
        setSelectedItem(null);
        fetchGameState();
        fetchQueue();
        fetchInventory();
      }
    } else {
      addNotification({
        message: 'Already processed or no item selected',
        type: 'error',
      });
    }
  };

  const handleAssignGrade = async (grade: string) => {
    if (selectedItem && 'type' in selectedItem && user?.currentSession) {
      const response = await mrfService.assignGrade({
        materialId: selectedItem.id,
        grade: grade as any,
        sessionId: user.currentSession,
      });
      if (response.success) {
        addNotification({
          message: 'Material Sent to Broker',
          type: 'success',
        });
        setSelectedItem(null);
        setSelectedGrade(grade);
        fetchGameState();
        fetchInventory();
      } else {
        addNotification({
          message: 'Failed to assign grade',
          type: 'error',
        });
      }
    } else {
      addNotification({
        message: 'No material selected',
        type: 'error',
      });
    }
  };

  const handleAssignGradeAndPrice = async (grade: string, customPrice: number) => {
    if (selectedItem && 'materialType' in selectedItem && user?.currentSession) {
      const response = await mrfService.assignGrade({
        auctionId: selectedItem.auctionId,
        grade: grade as any,
        sessionId: user.currentSession,
        customPrice: customPrice,
      });
      if (response.success) {
        addNotification({
          message: 'Auction activated successfully!',
          type: 'success',
        });
        setSelectedItem(null);
        fetchGameState();
        fetchPendingAuctions();
      } else {
        addNotification({
          message: 'Failed to activate auction',
          type: 'error',
        });
      }
    } else {
      addNotification({
        message: 'No pending auction selected',
        type: 'error',
      });
    }
  };
  // console.log(gameState);
  return (
    <div>
      <div className="bg-[#f3e9da] min-h-screen">
        <div className="container mx-auto sm:p-0 p-6">
          <div className="md:-0 p-3">
            <ShiftLog
              logs={logData}
              shiftStart={shiftStart}
              shiftStartTime={authoritativeState?.gameStartTime}
              gameOverCountdown={authoritativeState?.gameOverCountdown}
              onGameOver={() => router.push('/dashboard/game-over')}
              cityHealth={authoritativeState?.cityHealth}
              budget={authoritativeState?.budget}
              totalCO2={authoritativeState?.totalCO2}
              wasteInventory={authoritativeState?.wasteInventory}
              onStatusLog={handleStatusLog}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left side */}
            <div className="xl:col-span-3  lg:col-span-2 col-span-1">
              <div
                className="bg-cover bg-center mx-auto rounded-[20px] mb-8"
                style={{ backgroundImage: `url(${woodenBg.src})` }}
              >
                <MunicipalityCustomHeader
                  backgroundImage={woodenHead.src}
                  title={authoritativeState?.teamRole || currentGameState?.teamRole}
                />
                <GameModeBadge gameMode={gameMode} />
                {/* Tab Navigation */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-lg p-1 shadow-md">
                    <button
                      onClick={() => setActiveTab('collection')}
                      className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                        activeTab === 'collection'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Collection
                    </button>
                    <button
                      onClick={() => setActiveTab('pending-auctions')}
                      className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                        activeTab === 'pending-auctions'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Inventory
                    </button>
                  </div>
                </div>
                <div>
                  {activeTab === 'collection' ? (
                    <MRFCollectionSelectedBox
                      key={availableBatches.map((b: WasteBatch) => b.id).join(',')}
                      batches={availableBatches}
                      selectedBatch={selectedItem as WasteBatch | null}
                      setSelectedBatch={(batch) => setSelectedItem(batch)}
                    />
                  ) : (
                    <MRFPendingAuctionSelectedBox
                      key={pendingAuctions.map((a) => a.id).join(',')}
                      auctions={pendingAuctions as PendingAuction[]}
                      selectedAuction={selectedItem as PendingAuction | null}
                      setSelectedAuction={(auction) => setSelectedItem(auction)}
                    />
                  )}
                </div>
              </div>
            </div>
            {/* Right side */}
            <div className="xl:col-span-1  lg:col-span-2 col-span-1">
              {activeTab === 'collection' ? (
                selectedItem && 'status' in selectedItem ? (
                  <MRFCollect
                    budget={authoritativeState?.budget ?? currentGameState?.budget}
                    totalCO2={authoritativeState?.totalCO2 ?? (currentGameState?.totalCO2 || 0)}
                    selectedItem={selectedItem}
                    handleProcessWaste={handleProcessWaste}
                  />
                ) : null
              ) : activeTab === 'pending-auctions' && selectedItem ? (
                <PendingAuctionAction
                  selectedAuction={selectedItem}
                  handleAssignGradeAndPrice={handleAssignGradeAndPrice}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <SurrenderButton
        playerId={user?._id ?? ''}
        surrenderVotes={authoritativeState?.surrenderVotes ?? []}
        canSurrender={(authoritativeState?.minutesElapsed ?? 0) >= 15}
        onToggle={() => {
          if (user?.currentSession) emit('surrender-toggle', { sessionId: user.currentSession });
        }}
      />
    </div>
  );
}
