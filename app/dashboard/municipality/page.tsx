'use client';

import MunicipalityCustomHeader from '@/components/layout/header/customheader/MunicipalityCustomHeader';
import GameModeBadge from '@/components/ui/GameModeBadge';
import { MaterialConstructAction } from '@/components/ui/materialConstructAction/MaterialConstructAction';
import { MunicipalityMaterialSelectedBox } from '@/components/ui/selectedBox/MunicipalityMaterialSelectedBox';
import { MunicipalityWasteSelectedBox } from '@/components/ui/selectedBox/MunicipalityWasteSelectedBox';
import ShiftLog from '@/components/ui/shiftLog/ShiftLog';
import { WasteCollectAction } from '@/components/ui/wasteCollectAction/WasteCollectAction';
import { SurrenderButton } from '@/components/ui/surrenderButton/SurrenderButton';
import TransportProgressList from '@/components/ui/TransportProgressList';
import GameChatbot from '@/components/ui/chatbot/GameChatbot';
import LiveTeamRankingToggle from '@/components/ui/LiveTeamRankingToggle';

import { useWebSocket } from '@/hooks/useWebSocket';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHead from '@/public/assets/images/woodenHead.png';
import { gameService } from '@/services/gameService';
import { municipalityService } from '@/services/municipalityService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { CityProject, GameState, Material, TeamData, WasteBatch } from '@/types/besse';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const MATERIAL_LABELS: Record<string, string> = {
  paper: 'Paper',
  plastic: 'Plastic',
  metal: 'Metal',
  glass: 'Glass',
  wood: 'Wood',
};

export default function MunicipalityPage() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'waste-collection' | 'city-projects' | 'project-details'>(
    'waste-collection'
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myTeam, setMyTeam] = useState<TeamData | null>(null);
  const [wasteBatches, setWasteBatches] = useState<WasteBatch[]>([]);
  const [cityProjects, setCityProjects] = useState<CityProject[]>([]);
    const [selectedItem, setSelectedItem] = useState<WasteBatch | CityProject | Material | null>(
    null
  );
  const [selectedBatch, setSelectedBatch] = useState<WasteBatch | null>(null);
  const [selectedWasteBatchId, setSelectedWasteBatchId] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<CityProject | null>(null);
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
  const [activeTransports, setActiveTransports] = useState<any[]>([]);
  const [teamTimer, setTeamTimer] = useState<string>('15:00');
  const [teamCount, setTeamCount] = useState<number>(0);
  const { getCurrentGameSession, notifications, isConnected, subscribe, joinGame, emit } = useWebSocket();

  const currentGameState = gameState;

  const syncMyTeamFromGameState = useCallback((gs: GameState | null) => {
    if (!gs || !user?.currentSession) return;
    const currentTeam = gs.teams?.find((team: TeamData) => team.sessionId === user.currentSession);
    if (!currentTeam) return;

    setMyTeam(currentTeam);
    setWasteBatches(
      currentTeam.wasteBatches?.filter((batch: WasteBatch) => batch.status === 'PENDING') || []
    );
    setCityProjects(currentTeam.cityProjects || []);
    if (currentTeam.activeTransports) {
      setActiveTransports(currentTeam.activeTransports);
    }
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
          setWasteBatches(
            currentTeam.wasteBatches?.filter((batch: WasteBatch) => batch.status === 'PENDING') || []
          );
          setCityProjects(currentTeam.cityProjects || []);
          if (currentTeam.activeTransports) {
            setActiveTransports(currentTeam.activeTransports);
          }
        }
        
        // ✅ Get team count
        if (response.data.gameState.teams) {
          setTeamCount(response.data.gameState.teams.length);
        }
        
        if (
          response.data.gameState.gameStatus === 'won' ||
          response.data.gameState.gameStatus === 'lost' ||
          response.data.gameState.gameStatus === 'complete'
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

    const fetchWasteBatches = useCallback(async () => {
    if (!user?.currentSession) return;
    try {
      const response = await municipalityService.getWasteBatches(user.currentSession);
      if (response.success && response.data) {
        setWasteBatches(
          response.data.batches.filter((batch: WasteBatch) => batch.status === 'PENDING')
        );
      }
    } catch (err: any) {
      console.error('Failed to fetch waste batches', err);
    }
  }, [user?.currentSession]);

    const fetchCityProjects = useCallback(async () => {
    if (!user?.currentSession) return;
    try {
      const response = await municipalityService.getCityProjects(user.currentSession);
      if (response.success && response.data) {
        setCityProjects(response.data.projects);
      }
    } catch (err: any) {
      console.error('Failed to fetch city projects', err);
    }
  }, [user?.currentSession]);

  useEffect(() => {
    fetchGameState();
    fetchWasteBatches();
    fetchCityProjects();
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

    const key = `role_page_reload_once_${sessionId}_municipality`;
    if (sessionStorage.getItem(key) === '1') return;

    sessionStorage.setItem(key, '1');
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [user?.currentSession]);

  // One-time per-session auto reload fallback to stabilize initial realtime setup
  useEffect(() => {
    const sessionId = user?.currentSession;
    if (!sessionId) return;

    const key = `role_page_reload_once_${sessionId}_municipality`;
    if (sessionStorage.getItem(key) === '1') return;

    sessionStorage.setItem(key, '1');
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [user?.currentSession]);

  const authoritativeState = fullPayload?.gameState ?? currentGameState;

  useEffect(() => {
    if (myTeam?.activeTransports) {
      setActiveTransports(myTeam.activeTransports);
    }
  }, [myTeam?.activeTransports]);

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
          setWasteBatches(
            currentTeam.wasteBatches?.filter((batch: WasteBatch) => batch.status === 'PENDING') || []
          );
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
          setWasteBatches(
            currentTeam.wasteBatches?.filter((batch: WasteBatch) => batch.status === 'PENDING') || []
          );
          setCityProjects(currentTeam.cityProjects || []);
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
          setWasteBatches(
            currentTeam.wasteBatches?.filter((batch: WasteBatch) => batch.status === 'PENDING') || []
          );
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
          const pendingBatches = currentTeam.wasteBatches?.filter(
            (batch: WasteBatch) => batch.status === 'PENDING'
          ) || [];
          setWasteBatches(pendingBatches);
        }
      }

            const actionType = data?.actionType;
      if (actionType === 'waste-collected' || actionType === 'waste-rejected') {
      } else if (actionType === 'project-constructed') {
        fetchCityProjects();
      } else if (actionType === 'auction-resolved' || actionType === 'external-purchase') {
        fetchGameState();
        fetchCityProjects();
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

      fetchWasteBatches();
      fetchCityProjects();
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
      const time = getCountdownTime();
      const message = data?.playerName
        ? `${data.playerName} ${data.action || ''}`
        : JSON.stringify(data);
      setLiveLogItems((prev) => [...prev, { time, message, isLive: true }].slice(-100));
    });

    const unsubSystemMessage = subscribe('system-message', (_data: any) => {});

    const unsubAuctionsResolved = subscribe('auctions-resolved', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        syncMyTeamFromGameState(data.gameState);
      }
    });

    const unsubExternalPurchase = subscribe('external-purchase', (data: any) => {
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
      addNotification({
        message: `🚛 ${data?.mode?.toUpperCase()} transport started! ${data?.batchMass?.toFixed(1)} tons will arrive in ${data?.durationSec || 30}s`,
        type: 'info',
      });
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
      addNotification({
        message: `✅ Transport completed! ${data?.batchMass?.toFixed(1)} tons delivered to MRF.`,
        type: 'success',
      });
      fetchWasteBatches();
    });

        const unsubSurrenderUpdate = subscribe('surrender-update', (data: any) => {
      if (data?.surrenderVotes) {
        setMyTeam((prev) => (prev ? { ...prev, surrenderVotes: data.surrenderVotes } : prev));
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
      unsubAuctionsResolved && unsubAuctionsResolved();
      unsubExternalPurchase && unsubExternalPurchase();
      unsubTransportStarted && unsubTransportStarted();
      unsubTransportCompleted && unsubTransportCompleted();
      unsubSurrenderUpdate && unsubSurrenderUpdate();
    };
  }, [subscribe, router, fetchWasteBatches, fetchCityProjects, addNotification, syncMyTeamFromGameState]);

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

    const selectableMaterials = myTeam?.municipalInventory
    ? Object.entries(myTeam.municipalInventory)
        .filter(([_, amount]) => (amount as number) >= 0.01)
        .map(([type, mass]) => ({
          id: type,
          type: type as 'paper' | 'plastic' | 'metal' | 'glass' | 'wood',
          mass: mass as number,
          materialOrWaste: true as boolean,
          quality: 'A' as 'A',
          contamination: 0,
          owner: 'municipality' as 'municipality',
          listed: false,
        }))
    : [];

    const effectiveSelectedBatch =
    (selectedWasteBatchId
      ? wasteBatches.find((b) => b.id === selectedWasteBatchId) || null
      : null) ??
    selectedBatch ??
    (selectedItem && 'status' in selectedItem ? (selectedItem as WasteBatch) : null);

  const logData = [...staticLogData, ...liveLogItems];

  const turn = turnSummary || null;
  const stats = statistics || null;

  const shiftStart = authoritativeState
    ? `${String(authoritativeState.gameStartTime).padStart(2, '0')}:00`
    : '00:00';

  const shiftStartTime = authoritativeState
    ? Date.now() - (authoritativeState.minutesElapsed || 0) * 60 * 1000
    : 0;

  useEffect(() => {
    shiftStartTimeRef.current = typeof shiftStartTime === 'number' ? shiftStartTime : 0;
  }, [shiftStartTime]);

  const getCountdownTime = useCallback(() => {
    const st = shiftStartTimeRef.current;
    if (!st) return '[--:--]';
    const elapsed = Math.max(0, Date.now() - new Date(st).getTime());
    let durationMin = 15;
    try {
      const stored = localStorage.getItem('init_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.constants?.TEAM_GAME_DURATION_MINUTES) durationMin = parsed.constants.TEAM_GAME_DURATION_MINUTES;
      }
    } catch {}
    const remainingMs = Math.max(0, durationMin * 60 * 1000 - elapsed);
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    return `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}]`;
  }, []);

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

    const handleCollectWasteWithTransport = async (mode: 'fast' | 'slow') => {
    if (!user?.currentSession || !effectiveSelectedBatch) {
      addNotification({
        message: 'No active session or no batch selected',
        type: 'error',
      });
      return;
    }

    if (effectiveSelectedBatch.status !== 'PENDING') {
      addNotification({
        message: `Batch is already ${effectiveSelectedBatch.status}`,
        type: 'error',
      });
      return;
    }

    const mass = effectiveSelectedBatch.mass;
    const cost = mode === 'fast' ? mass * 50 : mass * 25;
    const currentBudget = myTeam?.budget ?? 0;

    if (currentBudget < cost) {
      addNotification({
        message: `Insufficient budget. ${mode} transport costs $${cost.toFixed(2)} but your budget is $${currentBudget.toFixed(2)}.`,
        type: 'error',
      });
      return;
    }

    if (myTeam?.isEliminated) {
      addNotification({
        message: 'Your team has been eliminated. Cannot perform actions.',
        type: 'error',
      });
      return;
    }

    try {
      const response = await municipalityService.collectWasteWithTransport(
        user.currentSession,
        {
          batchId: effectiveSelectedBatch.id,
          sessionId: user.currentSession,
          mode: mode,
        }
      );
      
      if (response.success) {
        addNotification({
          message: `${mode.toUpperCase()} transport started! Waste will arrive in ${mode === 'fast' ? '30' : '60'} seconds.`,
          type: 'success',
        });
                setSelectedItem(null);
        setSelectedBatch(null);
        setSelectedWasteBatchId(null);
        fetchGameState();
        fetchWasteBatches();
      } else {
        addNotification({
          message: response.message || 'Failed to start transport',
          type: 'error',
        });
      }
    } catch (err: any) {
      console.error('API error:', err);
      addNotification({
        message: err?.response?.data?.message || err?.message || 'Failed to start transport',
        type: 'error',
      });
    }
  };

  const handleConstructProject = async (
    materialType: string,
    projectId: string,
    materialAmount: number
  ) => {
    if (!user?.currentSession) {
      addNotification({
        message: 'No active session',
        type: 'error',
      });
      return;
    }

    if (myTeam?.isEliminated) {
      addNotification({
        message: 'Your team has been eliminated. Cannot perform actions.',
        type: 'error',
      });
      return;
    }

    try {
      const response = await municipalityService.constructProject(user.currentSession, {
        projectId,
        materialType: materialType as 'paper' | 'plastic' | 'metal' | 'glass' | 'wood',
        materialAmount,
        sessionId: user.currentSession,
      });

      if (response.success) {
        addNotification({
          message: 'Material contributed to project successfully!',
          type: 'success',
        });
        setSelectedMaterial(null);
        setSelectedProject(null);
        fetchGameState();
        fetchCityProjects();
      } else {
        addNotification({
          message: response.message || 'Failed to construct project',
          type: 'error',
        });
      }
    } catch (err: any) {
      addNotification({
        message: err?.response?.data?.message || err?.message || 'Failed to construct project',
        type: 'error',
      });
    }
  };

  const handleSurrenderToggle = () => {
    if (!user?.currentSession) return;
    if (myTeam?.isEliminated) {
      addNotification({
        message: 'Your team has been eliminated. Cannot surrender.',
        type: 'error',
      });
      return;
    }
    emit('surrender-toggle', { sessionId: user.currentSession });
  };

  const surrenderVotes = myTeam?.surrenderVotes ?? [];
  const canSurrender = (myTeam?.minutesElapsed ?? 0) >= 15;

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

                {/* ✅ Team Timer Display

                <div className="flex justify-center my-1 flex-shrink-0">
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
                
                <div className="flex justify-center mb-1 flex-shrink-0">
                  <div className="bg-white rounded-lg p-1 shadow-md">
                    <button
                                            onClick={() => {
                        setActiveTab('waste-collection');
                                                setSelectedItem(null);
                        setSelectedBatch(null);
                        setSelectedWasteBatchId(null);
                        setSelectedMaterial(null);
                        setSelectedProject(null);
                      }}
                      className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${
                        activeTab === 'waste-collection'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Waste Collection
                    </button>
                    <button
                                            onClick={() => {
                        setActiveTab('city-projects');
                                                setSelectedItem(null);
                        setSelectedBatch(null);
                        setSelectedWasteBatchId(null);
                        setSelectedMaterial(null);
                        setSelectedProject(null);
                      }}
                      className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${
                        activeTab === 'city-projects'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Inventory
                    </button>
                     <button
                    onClick={() => {
                      setActiveTab('project-details');
                      setSelectedItem(null);
                      setSelectedMaterial(null);
                      setSelectedProject(null);
                    }}
                    className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${
                      activeTab === 'project-details'
                        ? 'bg-[#3A7D2C] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Project Details
                  </button>
                </div>
              </div>

              <div className="flex-1 lg:min-h-0 lg:overflow-hidden">
                {activeTab === 'waste-collection' ? (
                  <MunicipalityWasteSelectedBox
                    key={wasteBatches.map((b) => b.id).join(',')}
                    wasteBatches={wasteBatches}
                    selectedBatch={effectiveSelectedBatch}
                    setSelectedBatch={(batch) => {
                      setSelectedWasteBatchId(batch.id);
                      setSelectedBatch(batch);
                      setSelectedItem(batch);
                      setSelectedMaterial(null);
                      setSelectedProject(null);
                    }}
                  />
                ) : activeTab === 'city-projects' ? (
                  <MunicipalityMaterialSelectedBox
                    key={selectableMaterials.map((m) => m.id).join(',')}
                    materials={selectableMaterials}
                    selectedMaterial={
                      selectedItem && 'type' in selectedItem && !('status' in selectedItem)
                        ? (selectedItem as Material)
                        : null
                    }
                    setSelectedMaterial={(material) => {
                      setSelectedItem(material);
                      setSelectedBatch(null);
                      setSelectedWasteBatchId(null);
                      setSelectedMaterial((material as any).type);
                      setSelectedProject(null);
                    }}
                  />
                ) : (
                  <div className="h-full px-3 pb-3 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cityProjects.map((project) => (
                        <div
                          key={project.id}
                          className="bg-white/95 rounded-xl border border-[#C7B292] shadow-sm p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[16px] font-bold text-[#3f2c1b] leading-tight">
                              {project.name}
                            </h3>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                                project.completed
                                  ? 'bg-[#D9F3D6] text-[#2B6B2F]'
                                  : 'bg-[#F2E7D8] text-[#7A5A34]'
                              }`}
                            >
                              {project.completed ? 'Completed' : 'Available'}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#5c4733] mt-1">
                            {project.description || 'City sustainability development project.'}
                          </p>

                          <div className="mt-2 border-t border-[#E5D7C1] pt-2">
                            <p className="text-[12px] font-semibold text-[#4a3722] mb-1">
                              Required Materials Remaining
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(() => {
                                const requiredMaterials =
                                  (project as any).requiredMaterials ||
                                  (project as any).materialRequirements ||
                                  {};

                                const addedMaterials = (project as any).addedMaterials || {};

                                const entries = Object.entries(requiredMaterials)
                                  .map(([material, qty]) => {
                                    const required = Number(qty || 0);
                                    const added = Number((addedMaterials as Record<string, number>)[material] || 0);
                                    const remaining = Math.max(0, required - added);
                                    return [material, remaining] as const;
                                  })
                                  .filter(([, remaining]) => remaining > 0);

                                if (!entries.length) {
                                  return (
                                    <span className="text-[11px] text-[#7A5A34] italic">
                                      All required materials have been fulfilled.
                                    </span>
                                  );
                                }

                                return entries.map(([material, qty]) => (
                                  <span
                                    key={`${project.id}-required-${material}`}
                                    className="inline-flex items-center rounded-md bg-[#F7F2EA] px-2 py-1 text-[11px] font-medium text-[#5a442b] border border-[#E6D8C2]"
                                  >
                                    {MATERIAL_LABELS[material] || material}: {Number(qty || 0).toFixed(1)} tons
                                  </span>
                                ));
                              })()}
                            </div>

                            <p className="text-[12px] font-semibold text-[#4a3722] mb-1 mt-2">
                              Rewards
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="inline-flex items-center rounded-md bg-[#EEF7EE] px-2 py-1 text-[11px] font-medium text-[#2B6B2F] border border-[#CDE8CE]">
                                Health Bonus: +{Number(project.healthBonus || 0).toFixed(1)}%
                              </span>
                                                            <span className="inline-flex items-center rounded-md bg-[#EEF3FB] px-2 py-1 text-[11px] font-medium text-[#234A8B] border border-[#D6E2F7]">
                                Wallet Credit: +${Number(project.budgetBonus || 0).toFixed(0)}
                              </span>
                              <span className="inline-flex items-center rounded-md bg-[#F3F0FF] px-2 py-1 text-[11px] font-medium text-[#5B3FA8] border border-[#DED3FB]">
                                Score Bonus: +{Number((project as any).scoreBonus || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
              </div>
            </div>
            <div className="xl:col-span-1 lg:col-span-2 col-span-1 lg:overflow-y-auto lg:min-h-0">
              {activeTab === 'waste-collection' ? (
                effectiveSelectedBatch ? (
                  <WasteCollectAction
                    budget={myTeam?.budget ?? 0}
                    totalCO2={myTeam?.totalCO2 ?? 0}
                    wasteInventory={myTeam?.wasteInventory ?? 0}
                    maxCapacity={150}
                    selectedBatch={effectiveSelectedBatch}
                    handleCollectWaste={handleCollectWasteWithTransport}
                    transportCostPerTon={
                      (currentGameState?.constants?.FIXED_DISTANCE_TO_MRF_KM ?? 10) *
                      (currentGameState?.constants?.TRANSPORT_COST_PER_TON_KM ?? 2.5)
                    }
                  />
                ) : null
              ) : selectedMaterial ? (
                <MaterialConstructAction
                  selectedMaterial={selectedMaterial}
                  cityProjects={cityProjects}
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  municipalInventory={
                    myTeam?.municipalInventory ?? {
                      paper: 0,
                      plastic: 0,
                      metal: 0,
                      glass: 0,
                      wood: 0,
                    }
                  }
                  handleConstructProject={handleConstructProject}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <GameChatbot pageContext="municipality" />
    </div>
  );
}