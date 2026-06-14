'use client';

import MRFAnalytics from '@/components/ui/mrfAnalytics/MRFAnalytics';
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
import GameChatbot from '@/components/ui/chatbot/GameChatbot';
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
  const [activeTab, setActiveTab] = useState<'collection' | 'analytics' | 'pending'>(
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
        const allInventory = response.data.inventory.filter(
          (item) => item.owner === 'mrf'
        );
        setInventory(allInventory);
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

  const [liveLogItems, setLiveLogItems] = useState<
    {
      time: string;
      message: string;
      isLive?: boolean;
      type?: 'info' | 'warning' | 'error';
    }[]
  >([]);
  const lastAppliedRef = useRef<number>(0);
  const pendingPayloadRef = useRef<any | null>(null);
  const shiftStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (user?.currentSession && isConnected) {
      joinGame(user.currentSession);
    }
  }, [user?.currentSession, isConnected, joinGame]);

  useEffect(() => {
    const unsubGameStateUpdate = subscribe('game-state-update', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        if (
          data.gameState.gameStatus === 'won' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'complete'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    const unsubGameStateFull = subscribe('game-state-full', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        if (
          data.gameState.gameStatus === 'won' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'complete'
        ) {
          router.push('/dashboard/game-over');
        }
      }
      if (data?.realtimeUpdate) {
      }
      if (data?.turnSummary) setTurnSummary(data.turnSummary);
      if (data?.statistics) setStatistics(data.statistics);
      if (typeof data?.countdownTimeRemaining === 'number')
        setCountdownRemaining(data.countdownTimeRemaining);
      setLastActionType(data?.actionType || null);
    });

    const unsubSystemCheckUpdate = subscribe('system-check-update', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    const unsubTurnEnded = subscribe('turn-ended', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    const unsubGameActions = subscribe('game-state-updated', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }

      const actionType = data?.actionType;
      if (actionType === 'waste-collected') {
        fetchQueue();
      } else if (actionType === 'waste-processed') {
        fetchQueue();
        fetchInventory();
        fetchPendingAuctions();
      } else if (actionType === 'material-graded') {
        fetchInventory();
        fetchPendingAuctions();
      } else if (actionType === 'material-sold-external' || actionType === 'material-transferred') {
        fetchInventory();
      } else if (actionType === 'auction-updated') {
        fetchPendingAuctions();
        fetchInventory();
      }
    });

    const unsubCountdownExpired = subscribe('countdown-expired', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        if (
          data.gameState.gameStatus === 'won' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'complete'
        ) {
          setTimeout(() => {
            router.push('/dashboard/game-over');
          }, 3000);
        }
      }
      fetchQueue();
      fetchInventory();
      fetchPendingAuctions();
    });

    const unsubCountdownStarted = subscribe('countdown-started', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    const unsubCountdownCancelled = subscribe('countdown-cancelled', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

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

    const unsubSystemMessage = subscribe('system-message', (_data: any) => {});

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
      unsubCountdownExpired && unsubCountdownExpired();
      unsubCountdownStarted && unsubCountdownStarted();
      unsubCountdownCancelled && unsubCountdownCancelled();
      unsubPlayerAction && unsubPlayerAction();
      unsubSystemMessage && unsubSystemMessage();
      unsubSurrenderUpdate && unsubSurrenderUpdate();
    };
  }, [subscribe, router, fetchQueue, fetchInventory, fetchPendingAuctions]);

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
  const staticLogData: { time: string; message: string }[] = [];

  const authoritativeState = fullPayload?.gameState ?? currentGameState;

  const logData = [...staticLogData, ...liveLogItems];

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

  useEffect(() => {
    shiftStartTimeRef.current = typeof shiftStartTime === 'number' ? shiftStartTime : 0;
  }, [shiftStartTime]);

  const handleStatusLog = useCallback((log: { time: string; message: string; isLive?: boolean; type?: 'info' | 'warning' | 'error' }) => {
    setLiveLogItems((prev) => [...prev, log].slice(-100));
  }, []);

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

  return (
    <div className="lg:h-full flex flex-col lg:overflow-hidden">
      <div className="bg-[#f3e9da] flex-1 flex flex-col lg:min-h-0 lg:overflow-hidden">
        <div className="container mx-auto sm:p-0 px-4 flex flex-col flex-1 lg:min-h-0 lg:overflow-hidden gap-3">
          <div className="flex-shrink-0">
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
          
          {/* MAIN CONTENT - Takes full width on all tabs */}
          <div
            className="bg-cover bg-center mx-auto rounded-[20px] flex flex-col lg:min-h-0 overflow-hidden w-full flex-1"
            style={{ backgroundImage: `url(${woodenBg.src})` }}
          >
            <MunicipalityCustomHeader
              backgroundImage={woodenHead.src}
              title={authoritativeState?.teamRole || currentGameState?.teamRole}
            />
            <GameModeBadge gameMode={gameMode} />
            
            {/* Tab Navigation */}
            <div className="flex justify-center mb-3 flex-shrink-0 mt-2">
              <div className="bg-white rounded-lg p-1 shadow-md flex gap-1">
                <button
                  onClick={() => setActiveTab('collection')}
                  className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                    activeTab === 'collection'
                      ? 'bg-[#3A7D2C] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Collection
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-[#3A7D2C] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                    activeTab === 'pending'
                      ? 'bg-[#3A7D2C] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Materials Ready
                </button>
              </div>
            </div>
            
            {/* CONTENT AREA - Changes based on active tab */}
            <div className="flex-1 lg:min-h-0 lg:overflow-y-auto p-4">
              {activeTab === 'collection' && (
                <MRFCollectionSelectedBox
                  key={availableBatches.map((b: WasteBatch) => b.id).join(',')}
                  batches={availableBatches}
                  selectedBatch={selectedItem as WasteBatch | null}
                  setSelectedBatch={(batch) => setSelectedItem(batch)}
                />
              )}
              
              {activeTab === 'analytics' && (
                <MRFAnalytics
                  wasteBatches={gameState?.wasteBatches || []}
                  inventory={inventory}
                />
              )}
              
              {activeTab === 'pending' && (
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
      </div>
      
      {/* RIGHT SIDE ACTION PANEL - Fixed position on the right side of screen */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-10 w-80">
        {activeTab === 'collection' && selectedItem && 'status' in selectedItem && (
          <MRFCollect
            budget={authoritativeState?.budget ?? currentGameState?.budget}
            totalCO2={authoritativeState?.totalCO2 ?? (currentGameState?.totalCO2 || 0)}
            selectedItem={selectedItem}
            handleProcessWaste={handleProcessWaste}
          />
        )}
        
        {activeTab === 'pending' && selectedItem && (
          <PendingAuctionAction
            selectedAuction={selectedItem}
            handleAssignGradeAndPrice={handleAssignGradeAndPrice}
          />
        )}
      </div>
      <GameChatbot pageContext="mrf-collection" />
      
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
