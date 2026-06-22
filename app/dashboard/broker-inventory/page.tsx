'use client';

import MunicipalityCustomHeader from '@/components/layout/header/customheader/MunicipalityCustomHeader';
import GameModeBadge from '@/components/ui/GameModeBadge';
import { BrokerExternalWholesalerSelectedBox } from '@/components/ui/selectedBox/BrokerExternalWholesalerSelectedBox';
import { BrokerGlobalAuctionSelectedBox } from '@/components/ui/selectedBox/BrokerGlobalAuctionSelectedBox';
import ShiftLog from '@/components/ui/shiftLog/ShiftLog';
import { SurrenderButton } from '@/components/ui/surrenderButton/SurrenderButton';
import GameChatbot from '@/components/ui/chatbot/GameChatbot';
import LiveTeamRankingToggle from '@/components/ui/LiveTeamRankingToggle';

import { useWebSocket } from '@/hooks/useWebSocket';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHead from '@/public/assets/images/woodenHead.png';
import { brokerService } from '@/services/brokerService';
import { gameService } from '@/services/gameService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { GameState, TeamData } from '@/types/besse';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function BrokerInventoryPage() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'global-auctions' | 'external-wholesaler'>(
    'global-auctions'
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myTeam, setMyTeam] = useState<TeamData | null>(null);
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
  const [teamTimer, setTeamTimer] = useState<string>('15:00');
  const [gameMode] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('game_mode') : null
  );
  const { getCurrentGameSession, notifications, isConnected, subscribe, joinGame, emit } = useWebSocket();

  const currentGameState = gameState;

  const syncMyTeamFromGameState = useCallback((gs: GameState | null) => {
    if (!gs || !user?.currentSession) return;
    const currentTeam = gs.teams?.find((team: TeamData) => team.sessionId === user.currentSession);
    if (currentTeam) setMyTeam(currentTeam);
  }, [user?.currentSession]);


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
        
        // ✅ Find current team
        const currentTeam = response.data.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user.currentSession
        );
        if (currentTeam) {
          setMyTeam(currentTeam);
        }
        
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
      // ✅ Get auctions from ALL teams in the room
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
        // ✅ Wait for both calls to complete before continuing
        await Promise.all([
          fetchExternalStock(),
          fetchGameState()
        ]);
        // ✅ Force a refresh of the shift log by updating a dummy state if needed
        // The ShiftLog component receives budget from myTeam, which is updated in fetchGameState
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

  // Fetch global auctions every 3 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchGlobalAuctions();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [user?.currentSession]);

  // ✅ Team timer countdown
  useEffect(() => {
    if (!myTeam) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = (now - myTeam.teamStartTime) / 60000; // minutes
      const remaining = Math.max(0, 15 - elapsed);
      const mins = Math.floor(remaining);
      const secs = Math.floor((remaining - mins) * 60);
      setTeamTimer(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [myTeam]);

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

  // One-time per-session auto reload fallback to stabilize initial realtime setup
  useEffect(() => {
    const sessionId = user?.currentSession;
    if (!sessionId) return;

    const key = `role_page_reload_once_${sessionId}_broker`;
    if (sessionStorage.getItem(key) === '1') return;

    sessionStorage.setItem(key, '1');
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [user?.currentSession]);

  useEffect(() => {
    const unsubGameStateUpdate = subscribe('game-state-update', (data: any) => {
            if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
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
        syncMyTeamFromGameState(data.gameState);
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
        syncMyTeamFromGameState(data.gameState);
      }
    });

        const unsubTurnEnded = subscribe('turn-ended', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
      }
    });

        const unsubGameActions = subscribe('game-state-updated', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
      }


      const actionType = data?.actionType;
            if (
        actionType === 'bid-placed' ||
        actionType === 'auction-updated' ||
        actionType === 'auction-resolved' ||
        actionType === 'material-graded'
      ) {
        fetchGlobalAuctions();
        fetchGameState();
      } else if (actionType === 'external-purchase') {
        fetchExternalStock();
        fetchGameState();
      }
    });

        const unsubCountdownExpired = subscribe('countdown-expired', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
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
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
      }
    });

        const unsubCountdownCancelled = subscribe('countdown-cancelled', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
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

        const unsubAuctionResolved = subscribe('auction-resolved', (_data: any) => {
      // Ensure wallet/inventory UI updates immediately for winner/loser teams
      fetchGlobalAuctions();
      fetchGameState();
    });

    const unsubSurrenderUpdate = subscribe('surrender-update', (data: any) => {
      if (data?.surrenderVotes && myTeam) {
        const updatedTeam = { ...myTeam, surrenderVotes: data.surrenderVotes };
        setMyTeam(updatedTeam);
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
      unsubAuctionResolved && unsubAuctionResolved();
      unsubSurrenderUpdate && unsubSurrenderUpdate();
    };
  }, [subscribe, router, fetchGameState, fetchGlobalAuctions, fetchExternalStock, syncMyTeamFromGameState]);

  const getDurationMinutes = () => {
    const c = currentGameState?.constants as any;
    if (c?.TEAM_GAME_DURATION_MINUTES) return c.TEAM_GAME_DURATION_MINUTES;
    try {
      const stored = localStorage.getItem('init_state');
      if (stored) { const p = JSON.parse(stored); if (p?.constants?.TEAM_GAME_DURATION_MINUTES) return p.constants.TEAM_GAME_DURATION_MINUTES; }
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

  // ✅ Get all teams in the room
  const allTeams = currentGameState?.teams || [];
  const teamCount = allTeams.length;

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
              cityHealth={myTeam?.cityHealth}
              budget={myTeam?.budget}
              totalCO2={myTeam?.totalCO2}
              wasteInventory={myTeam?.wasteInventory}
              onStatusLog={handleStatusLog}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 flex-1 lg:min-h-0 lg:overflow-hidden">
            <div className="col-span-1 flex flex-col lg:min-h-0 lg:overflow-hidden">
                            <div
                className="relative bg-cover bg-center mx-auto rounded-[20px] flex flex-col lg:min-h-0 overflow-hidden w-full flex-1"

                style={{ backgroundImage: `url(${woodenBg.src})` }}
              >
                <MunicipalityCustomHeader
                  backgroundImage={woodenHead.src}
                  title={`${myTeam?.teamName || 'Your City'} (${myTeam?.citySlot || '?'}) | ${teamCount} Teams in Room`}
                />
                                {/* <GameModeBadge gameMode={gameMode} /> */}

                <div className="absolute right-3 top-[72px]">
                  <LiveTeamRankingToggle
                    teams={currentGameState?.teams || []}
                    currentSessionId={user?.currentSession || undefined}
                  />
                </div>

                {/* ✅ Team Timer Display */}

                {/* <div className="flex justify-center my-1 flex-shrink-0">
                  <div className="bg-white rounded-lg px-4 py-1 shadow-md border border-[#A99065]">
                    <span className="font-bold text-[#33552C]">
                      ⏱️ Time Remaining: 
                      <span className={`ml-2 ${parseInt(teamTimer) < 3 ? 'text-red-600 animate-pulse' : 'text-[#50704C]'}`}>
                        {teamTimer}
                      </span>
                    </span>
                    {myTeam?.isEliminated && (
                      <span className="ml-4 text-red-600 font-bold">💀 ELIMINATED</span>
                    )}
                    {myTeam?.gameStatus === 'completed' && (
                      <span className="ml-4 text-green-600 font-bold">✅ COMPLETED</span>
                    )}
                  </div>
                </div> */}

                {/* Tab Navigation */}
                <div className="flex justify-center mb-1 flex-shrink-0">
                  <div className="bg-white rounded-lg p-1 shadow-md flex">
                    <button
                      onClick={() => setActiveTab('global-auctions')}
                      className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${
                        activeTab === 'global-auctions'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Global Auctions ({globalAuctions.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('external-wholesaler')}
                      className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${
                        activeTab === 'external-wholesaler'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      External Wholesaler
                    </button>
                  </div>
                                </div>

                <div className="px-3 pb-2 text-center">
                  <p className="inline-block rounded-md bg-white/90 px-3 py-1 text-[11px] font-medium text-[#5C4733] border border-[#D8C9AF]">
                    Auction rule: winning team pays 100% of final bid. Seller receives 90%; 10% is marketplace service fee.
                  </p>
                </div>

                <div className="flex-1 lg:min-h-0 lg:overflow-hidden">

                  {activeTab === 'global-auctions' ? (
                    <BrokerGlobalAuctionSelectedBox
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
            {/* <SurrenderButton
        playerId={user?._id ?? ''}
        surrenderVotes={myTeam?.surrenderVotes ?? []}
        canSurrender={(myTeam?.minutesElapsed ?? 0) >= 15}
        onToggle={() => {
          if (user?.currentSession) emit('surrender-toggle', { sessionId: user.currentSession });
        }}
      /> */}
      <GameChatbot pageContext="broker-inventory" />
    </div>
  );
}