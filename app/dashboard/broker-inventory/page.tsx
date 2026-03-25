'use client';

import MunicipalityCustomHeader from '@/components/layout/header/customheader/MunicipalityCustomHeader';
import { BrokerExternalWholesalerSelectedBox } from '@/components/ui/selectedBox/BrokerExternalWholesalerSelectedBox';
import { BrokerGlobalAuctionSelectedBox } from '@/components/ui/selectedBox/BrokerGlobalAuctionSelectedBox';
import ShiftLog from '@/components/ui/shiftLog/ShiftLog';
import { SurrenderButton } from '@/components/ui/surrenderButton/SurrenderButton';
import { useWebSocket } from '@/hooks/useWebSocket';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHead from '@/public/assets/images/woodenHead.png';
import { brokerService } from '@/services/brokerService';
import { gameService } from '@/services/gameService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { GameState } from '@/types/besse';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function BrokerInventoryPage() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'global-auctions' | 'external-wholesaler'>(
    'global-auctions'
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [globalAuctions, setGlobalAuctions] = useState<any[]>([]);
  const [externalStock, setExternalStock] = useState<any[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullPayload, setFullPayload] = useState<any | null>(null);
  const [turnSummary, setTurnSummary] = useState<any | null>(null);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [lastActionType, setLastActionType] = useState<string | null>(null);
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
          response.data.gameState.gameStatus === 'lost' ||
          response.data.gameState.gameStatus === 'won'
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

  const fetchGlobalAuctions = async () => {
    if (!user?.currentSession) return;
    try {
      const response = await brokerService.getActiveAuctions(user.currentSession);
      if (response.success && response.data) {
        setGlobalAuctions(response.data.auctions);
      }
    } catch (err: any) {
      console.error('Failed to fetch global auctions', err);
    }
  };

  const fetchExternalStock = async () => {
    if (!user?.currentSession) return;
    try {
      const response = await brokerService.getExternalStock(user.currentSession);
      if (response.success && response.data) {
        setExternalStock(response.data.externalStock);
      }
    } catch (err: any) {
      console.error('Failed to fetch external stock', err);
    }
  };

  const handlePlaceBid = async (auctionId: string) => {
    if (!user?.currentSession) {
      addNotification({
        message: 'No active session',
        type: 'error',
      });
      return;
    }

    try {
      const response = await brokerService.placeBid({
        auctionId,
        sessionId: user.currentSession,
      });
      if (response.success) {
        addNotification({
          message: 'Bid placed successfully!',
          type: 'success',
        });
        fetchGlobalAuctions();
        fetchGameState();
      } else {
        addNotification({
          message: response.message || 'Failed to place bid',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.response?.data?.message || 'Failed to place bid',
        type: 'error',
      });
    }
  };

  const handleBuyFromWholesaler = async (materialType: string, amount: number) => {
    if (!user?.currentSession) {
      addNotification({
        message: 'No active session',
        type: 'error',
      });
      return;
    }

    try {
      const response = await brokerService.buyFromExternalWholesaler({
        materialType,
        requestedAmount: amount,
        sessionId: user.currentSession,
      });
      if (response.success) {
        addNotification({
          message: `Successfully purchased ${amount}t of ${materialType}!`,
          type: 'success',
        });
        fetchExternalStock();
        fetchGameState();
      } else {
        addNotification({
          message: response.message || 'Failed to purchase material',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.response?.data?.message || 'Failed to purchase material',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    fetchGameState();
    fetchGlobalAuctions();
    fetchExternalStock();
  }, []);

  // Fetch global auctions every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchGlobalAuctions();
    }, 3000); // 3 seconds

    return () => clearInterval(intervalId);
  }, [user?.currentSession]);

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

  useEffect(() => {
    if (user?.currentSession && isConnected) {
      console.log('Broker Inventory page: Calling joinGame with sessionId:', user.currentSession);
      joinGame(user.currentSession);
    } else {
      console.log(
        'Broker Inventory page: Not joining yet - user.currentSession:',
        user?.currentSession,
        'isConnected:',
        isConnected
      );
    }
  }, [user?.currentSession, isConnected, joinGame]);

  useEffect(() => {
    const unsubGameStateUpdate = subscribe('game-state-update', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        if (
          data.gameState.gameStatus === 'complete' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'won'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    const unsubGameStateFull = subscribe('game-state-full', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        if (
          data.gameState.gameStatus === 'complete' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'won'
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
      if (
        actionType === 'bid-placed' ||
        actionType === 'auction-updated' ||
        actionType === 'material-graded'
      ) {
        console.log('[Broker] Auction action - refreshing auctions');
        fetchGlobalAuctions();
      } else if (actionType === 'external-purchase') {
        console.log('[Broker] External purchase - refreshing stock');
        fetchExternalStock();
      }
    });

    const unsubCountdownExpired = subscribe('countdown-expired', (data: any) => {
      console.log('Countdown expired received in Broker page:', data);

      if (data?.gameState) {
        setGameState(data.gameState);

        if (
          data.gameState.gameStatus === 'complete' ||
          data.gameState.gameStatus === 'lost' ||
          data.gameState.gameStatus === 'won'
        ) {
          setTimeout(() => {
            router.push('/dashboard/game-over');
          }, 3000);
        }
      }

      fetchGlobalAuctions();
      fetchExternalStock();
    });

    const unsubCountdownStarted = subscribe('countdown-started', (data: any) => {
      console.log('Countdown started received in Broker page:', data);
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    const unsubCountdownCancelled = subscribe('countdown-cancelled', (data: any) => {
      console.log('Countdown cancelled received in Broker page:', data);
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    const unsubPlayerAction = subscribe('player-action', (data: any) => {
      const time = data?.timestamp
        ? new Date(data.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
          })
        : new Date().toLocaleTimeString('en-US', { hour12: false });
      const message = data?.playerName
        ? `${data.playerName} ${data.action || ''}`
        : JSON.stringify(data);
      setLiveLogItems((prev) => [{ time, message, isLive: true }, ...prev].slice(0, 100));
    });

    const unsubSystemMessage = subscribe('system-message', (data: any) => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLiveLogItems((prev) =>
        [{ time, message: data.message, isLive: true, type: data.type }, ...prev].slice(0, 100)
      );
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
      unsubCountdownExpired && unsubCountdownExpired();
      unsubCountdownStarted && unsubCountdownStarted();
      unsubCountdownCancelled && unsubCountdownCancelled();
      unsubPlayerAction && unsubPlayerAction();
      unsubSystemMessage && unsubSystemMessage();
      unsubSurrenderUpdate && unsubSurrenderUpdate();
    };
  }, [subscribe, router, fetchGameState, fetchGlobalAuctions, fetchExternalStock]);

  const staticLogData =
    currentGameState?.activityLog?.map((log, index) => ({
      time: `[${String(currentGameState.currentGameHour).padStart(2, '0')}:${String(
        (index * 15) % 60
      ).padStart(2, '0')}]`,
      message: log,
    })) || [];

  const authoritativeState = fullPayload?.gameState ?? currentGameState;

  const logData = [...staticLogData];

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
            />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="col-span-1">
              <div
                className="bg-cover bg-center mx-auto rounded-[20px] mb-8"
                style={{ backgroundImage: `url(${woodenBg.src})` }}
              >
                <MunicipalityCustomHeader
                  backgroundImage={woodenHead.src}
                  title={authoritativeState?.teamRole || currentGameState?.teamRole}
                />
                {/* Tab Navigation */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-lg p-1 shadow-md flex">
                    <button
                      onClick={() => setActiveTab('global-auctions')}
                      className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                        activeTab === 'global-auctions'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Global Auctions
                    </button>
                    <button
                      onClick={() => setActiveTab('external-wholesaler')}
                      className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                        activeTab === 'external-wholesaler'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      External Wholesaler
                    </button>
                  </div>
                </div>
                <div>
                  {activeTab === 'global-auctions' ? (
                    <BrokerGlobalAuctionSelectedBox
                      key={globalAuctions.map((a) => a.auctionId).join(',')}
                      auctions={globalAuctions}
                      selectedAuction={selectedAuction}
                      setSelectedAuction={setSelectedAuction}
                      currentUserId={user?._id}
                      onPlaceBid={handlePlaceBid}
                    />
                  ) : (
                    <BrokerExternalWholesalerSelectedBox
                      key={externalStock.map((s) => s.materialType).join(',')}
                      stock={externalStock}
                      selectedStock={selectedStock}
                      setSelectedStock={setSelectedStock}
                      onBuy={handleBuyFromWholesaler}
                    />
                  )}
                </div>
              </div>
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
