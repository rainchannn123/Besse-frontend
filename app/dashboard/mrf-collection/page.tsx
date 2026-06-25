'use client';

import MRFAnalytics from '@/components/ui/mrfAnalytics/MRFAnalytics';
import MunicipalityCustomHeader from '@/components/layout/header/customheader/MunicipalityCustomHeader';
import GameModeBadge from '@/components/ui/GameModeBadge';
import { MRFCollect } from '@/components/ui/MRFCollect/MRFCollect';
import { PendingAuctionAction } from '@/components/ui/pendingAuctionAction/PendingAuctionAction';
import { MRFSendBackAction } from '@/components/ui/mrfSendBackAction/MRFSendBackAction';
import { MRFCollectionSelectedBox } from '@/components/ui/selectedBox/MRFCollectionSelectedBox';
import {
  MRFPendingAuctionSelectedBox,
  PendingAuction,
} from '@/components/ui/selectedBox/MRFPendingAuctionSelectedBox';
import ShiftLog from '@/components/ui/shiftLog/ShiftLog';
import { SurrenderButton } from '@/components/ui/surrenderButton/SurrenderButton';
import GameChatbot from '@/components/ui/chatbot/GameChatbot';
import LiveTeamRankingToggle from '@/components/ui/LiveTeamRankingToggle';
import TransportProgressList from '@/components/ui/TransportProgressList';

import { useWebSocket } from '@/hooks/useWebSocket';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHead from '@/public/assets/images/woodenHead.png';
import { gameService } from '@/services/gameService';
import { mrfService } from '@/services/mrfService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { GameState, Material, TeamData, WasteBatch } from '@/types/besse';
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
  const [myTeam, setMyTeam] = useState<TeamData | null>(null);
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
  const [teamTimer, setTeamTimer] = useState<string>('15:00');
  const [teamCount, setTeamCount] = useState<number>(0);
    const [activeTransports, setActiveTransports] = useState<any[]>([]);
  const [pendingActionChoice, setPendingActionChoice] = useState<'auction' | 'municipality' | null>(null);
  const [isSubmittingCollectionAction, setIsSubmittingCollectionAction] = useState(false);

  const [gameMode] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('game_mode') : null
  );
  const { getCurrentGameSession, notifications, isConnected, subscribe, joinGame, emit } = useWebSocket();

  const currentGameState = gameState;

  const syncMyTeamFromGameState = useCallback((gs: GameState | null) => {
    if (!gs || !user?.currentSession) return;
    const currentTeam = gs.teams?.find((team: TeamData) => team.sessionId === user.currentSession);
    if (!currentTeam) return;

        setMyTeam(currentTeam);
    setQueue(currentTeam.mrfQueue || []);
    setActiveTransports(currentTeam.activeTransports || []);
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
          setQueue(currentTeam.mrfQueue || []);
          setActiveTransports(currentTeam.activeTransports || []);
        }
        
        // ✅ Get team count
        if (response.data.gameState.teams) {
          setTeamCount(response.data.gameState.teams.length);
        }
        
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

    useEffect(() => {
    setSelectedItem(null);
    setSelectedGrade('');
    setPendingActionChoice(null);
  }, [activeTab]);

    useEffect(() => {
    if (selectedItem && 'quality' in selectedItem) {
      setSelectedGrade(selectedItem.quality);
    } else {
      setSelectedGrade('');
    }

    if (!selectedItem) {
      setPendingActionChoice(null);
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

  // One-time per-session auto reload fallback to stabilize initial realtime setup
  useEffect(() => {
    const sessionId = user?.currentSession;
    if (!sessionId) return;

    const key = `role_page_reload_once_${sessionId}_mrf`;
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
        
        const currentTeam = data.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
                if (currentTeam) {
          setMyTeam(currentTeam);
          setQueue(currentTeam.mrfQueue || []);
          setActiveTransports(currentTeam.activeTransports || []);
        }
        
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
        syncMyTeamFromGameState(data.gameState);
        
        const currentTeam = data.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
                if (currentTeam) {
          setMyTeam(currentTeam);
          setQueue(currentTeam.mrfQueue || []);
          setActiveTransports(currentTeam.activeTransports || []);
        }
        
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
        syncMyTeamFromGameState(data.gameState);
        
        const currentTeam = data.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
                if (currentTeam) {
          setMyTeam(currentTeam);
          setQueue(currentTeam.mrfQueue || []);
          setActiveTransports(currentTeam.activeTransports || []);
        }
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
        
        const currentTeam = data.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
                if (currentTeam) {
          setMyTeam(currentTeam);
          setQueue(currentTeam.mrfQueue || []);
          setActiveTransports(currentTeam.activeTransports || []);
        }
      }

            const actionType = data?.actionType;
            if (actionType === 'waste-collected') {
        fetchQueue();
      } else if (actionType === 'waste-processed' || actionType === 'waste-landfilled') {
        fetchQueue();
        fetchInventory();
        fetchPendingAuctions();
      } else if (actionType === 'material-graded') {

        fetchInventory();
        fetchPendingAuctions();
      } else if (actionType === 'material-sold-external' || actionType === 'material-transferred') {
        fetchInventory();
      } else if (
        actionType === 'auction-updated' ||
        actionType === 'auction-resolved' ||
        actionType === 'transport-started' ||
        actionType === 'transport-completed'
      ) {
        fetchPendingAuctions();
        fetchInventory();
      }
    });

    const unsubCountdownExpired = subscribe('countdown-expired', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
        
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
        syncMyTeamFromGameState(data.gameState);
      }
    });

    const unsubCountdownCancelled = subscribe('countdown-cancelled', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
      }
    });

        const unsubTransportStarted = subscribe('transport-started', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
        const currentTeam = data.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
        if (currentTeam?.activeTransports) {
          setActiveTransports(currentTeam.activeTransports);
        }
      }

      if (data?.source === 'mrf' && data?.destination === 'municipality') {
        addNotification({
          message: `Transport started: ${data?.mode?.toUpperCase()} mode, ${Number(data?.batchMass || 0).toFixed(1)}t to Municipality.`,
          type: 'info',
        });
      }
    });

    const unsubTransportCompleted = subscribe('transport-completed', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
        const currentTeam = data.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
        if (currentTeam?.activeTransports) {
          setActiveTransports(currentTeam.activeTransports);
        }
      }

      if (data?.source === 'mrf' && data?.destination === 'municipality') {
        addNotification({
          message: `Transport completed: ${Number(data?.batchMass || 0).toFixed(1)}t delivered to Municipality inventory.`,
          type: 'success',
        });
      }
    });

    const unsubPlayerAction = subscribe('player-action', (data: any) => {
      const st = shiftStartTimeRef.current;
      const elapsed = st ? Math.max(0, Date.now() - new Date(st).getTime()) : 0;
      let durationMin = 15;
      try { const stored = localStorage.getItem('init_state'); if (stored) { const p = JSON.parse(stored); if (p?.constants?.TEAM_GAME_DURATION_MINUTES) durationMin = p.constants.TEAM_GAME_DURATION_MINUTES; } } catch {}
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
            unsubTransportStarted && unsubTransportStarted();
      unsubTransportCompleted && unsubTransportCompleted();
      unsubPlayerAction && unsubPlayerAction();
      unsubSystemMessage && unsubSystemMessage();
      unsubSurrenderUpdate && unsubSurrenderUpdate();
    };
  }, [
    subscribe,
    router,
    fetchQueue,
    fetchInventory,
    fetchPendingAuctions,
    myTeam,
    syncMyTeamFromGameState,
    addNotification,
    user?.currentSession,
  ]);

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

  const availableBatches = (myTeam?.wasteBatches || []).filter((batch: WasteBatch) =>
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
    if (myTeam?.isEliminated) {
      addNotification({
        message: 'Your team has been eliminated. Cannot process waste.',
        type: 'error',
      });
      return;
    }

    if (!selectedItem || !user?.currentSession) {
      addNotification({
        message: 'Already processed or no item selected',
        type: 'error',
      });
      return;
    }

    const queueItem = queue.find((q) => q.batchId === selectedItem.id);
    if (!queueItem) {
      addNotification({
        message: 'Queue item not found',
        type: 'error',
      });
      return;
    }

    try {
      setIsSubmittingCollectionAction(true);
      const response = await mrfService.processWaste({
        queueId: queueItem.id,
        sessionId: user.currentSession,
      });

      if (response.success) {
        addNotification({
          message: 'Material sent to recycled material tab.',
          type: 'success',
        });
        setSelectedItem(null);
        fetchGameState();
        fetchQueue();
        fetchInventory();
      } else {
        addNotification({
          message: response.message || 'Failed to process waste',
          type: 'error',
        });
      }
    } catch (err: any) {
      addNotification({
        message: err?.message || 'Failed to process waste',
        type: 'error',
      });
    } finally {
      setIsSubmittingCollectionAction(false);
    }
  };


    const handleSendToLandfill = async () => {
    if (myTeam?.isEliminated) {
      addNotification({
        message: 'Your team has been eliminated. Cannot landfill waste.',
        type: 'error',
      });
      return;
    }

    if (!selectedItem || !user?.currentSession) {
      addNotification({
        message: 'No waste batch selected',
        type: 'error',
      });
      return;
    }

    const queueItem = queue.find((q) => q.batchId === selectedItem.id);
    if (!queueItem) {
      addNotification({
        message: 'Queue item not found',
        type: 'error',
      });
      return;
    }

    try {
      setIsSubmittingCollectionAction(true);
      const response = await mrfService.sendToLandfill({
        queueId: queueItem.id,
        sessionId: user.currentSession,
      });

      if (response.success) {
        addNotification({
          message: 'Waste batch sent directly to landfill.',
          type: 'warning',
        });
        setSelectedItem(null);
        fetchGameState();
        fetchQueue();
      } else {
        addNotification({
          message: response.message || 'Failed to send waste to landfill',
          type: 'error',
        });
      }
    } catch (err: any) {
      addNotification({
        message: err?.message || 'Failed to send waste to landfill',
        type: 'error',
      });
    } finally {
      setIsSubmittingCollectionAction(false);
    }
  };

  const handleAssignGrade = async (grade: string) => {

    if (myTeam?.isEliminated) {
      addNotification({
        message: 'Your team has been eliminated. Cannot assign grades.',
        type: 'error',
      });
      return;
    }

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
    if (myTeam?.isEliminated) {
      addNotification({
        message: 'Your team has been eliminated. Cannot activate auctions.',
        type: 'error',
      });
      return;
    }

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

  const handleSendBackToMunicipality = async (mode: 'fast' | 'slow') => {
    if (!user?.currentSession || !selectedItem || !('materialType' in selectedItem)) {
      addNotification({ message: 'No recycled material selected', type: 'error' });
      return;
    }

    const auctionId = selectedItem.auctionId || selectedItem.id;
    const response = await mrfService.sendBackToMunicipalityWithTransport(user.currentSession, {
      auctionId,
      sessionId: user.currentSession,
      mode,
    });

    if (response.success) {
      addNotification({ message: 'Transport started successfully', type: 'success' });
      setSelectedItem(null);
      fetchGameState();
      fetchPendingAuctions();
    } else {
      addNotification({ message: response.message || 'Failed to start transport', type: 'error' });
    }
  };

    return (
    <div className="lg:h-full flex flex-col lg:overflow-hidden">
      <div className="bg-[#f3e9da] flex-1 flex flex-col lg:min-h-0 lg:overflow-hidden">
        <div className="container mx-auto sm:p-0 px-4 flex flex-col flex-1 lg:min-h-0 lg:overflow-hidden gap-3">
          <TransportProgressList transports={activeTransports} />

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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 lg:min-h-0 lg:overflow-hidden">
            {/* Left side */}
            <div className="xl:col-span-3 lg:col-span-2 col-span-1 flex flex-col lg:min-h-0 lg:overflow-hidden">
                            <div
                className="relative bg-cover bg-center mx-auto rounded-[20px] flex flex-col lg:min-h-0 overflow-hidden w-full flex-1"

                style={{ backgroundImage: `url(${woodenBg.src})` }}
              >
                <MunicipalityCustomHeader
                  backgroundImage={woodenHead.src}
                  title={`${myTeam?.teamName || 'Your City'} (${myTeam?.citySlot || '?'}) | ${teamCount} Teams`}
                />
                {/* <GameModeBadge gameMode={gameMode} /> */}

                <div className="absolute right-3 top-[72px]">
                  <LiveTeamRankingToggle
                    teams={currentGameState?.teams || []}
                    currentSessionId={user?.currentSession || undefined}
                  />
                </div>

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
                      Unprocessed Material
                    </button>
                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                        activeTab === 'pending'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Recycled Material
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
                  </div>
                </div>

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
                      wasteBatches={myTeam?.wasteBatches || []}
                      inventory={inventory}
                      marketplaceListing={myTeam?.marketplaceListing || []}
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

            {/* Right side */}
                        <div className="xl:col-span-1 lg:col-span-2 col-span-1 lg:overflow-y-auto lg:min-h-0">
              {activeTab === 'collection' ? (
                selectedItem && 'status' in selectedItem ? (
                                    <MRFCollect
                    budget={myTeam?.budget ?? 0}
                    totalCO2={myTeam?.totalCO2 ?? 0}
                    selectedItem={selectedItem}
                    handleProcessWaste={handleProcessWaste}
                    handleSendToLandfill={handleSendToLandfill}
                    isSubmitting={isSubmittingCollectionAction}
                  />

                ) : null
              ) : activeTab === 'pending' && selectedItem ? (
                <div className="space-y-3">
                  <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-3">
                    <h3 className="text-center text-[20px] font-bold text-black mb-2">Choose Action</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPendingActionChoice('auction')}
                        className={`rounded-md py-2 px-2 text-sm font-semibold transition-colors ${
                          pendingActionChoice === 'auction'
                            ? 'bg-[#3A7D2C] text-white'
                            : 'bg-[#F2E9DC] text-[#5A452A] hover:bg-[#e6dac7]'
                        }`}
                      >
                        Sell in Auction
                      </button>
                      <button
                        onClick={() => setPendingActionChoice('municipality')}
                        className={`rounded-md py-2 px-2 text-sm font-semibold transition-colors ${
                          pendingActionChoice === 'municipality'
                            ? 'bg-[#3A7D2C] text-white'
                            : 'bg-[#F2E9DC] text-[#5A452A] hover:bg-[#e6dac7]'
                        }`}
                      >
                        Send Back to Muni
                      </button>
                    </div>
                  </div>

                  {pendingActionChoice === 'auction' ? (
                    <PendingAuctionAction
                      selectedAuction={selectedItem}
                      handleAssignGradeAndPrice={handleAssignGradeAndPrice}
                    />
                  ) : pendingActionChoice === 'municipality' ? (
                    <MRFSendBackAction
                      budget={myTeam?.budget ?? 0}
                      selectedAuction={selectedItem}
                      onSendBack={handleSendBackToMunicipality}
                    />
                  ) : null}
                </div>
              ) : null}
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
      <GameChatbot pageContext="mrf-collection" />
    </div>
  );
}
