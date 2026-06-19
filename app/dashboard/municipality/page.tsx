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
import { useWebSocket } from '@/hooks/useWebSocket';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHead from '@/public/assets/images/woodenHead.png';
import { gameService } from '@/services/gameService';
import { municipalityService } from '@/services/municipalityService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { CityProject, GameState, Material, WasteBatch } from '@/types/besse';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function MunicipalityPage() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'waste-collection' | 'city-projects'>(
    'waste-collection'
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [wasteBatches, setWasteBatches] = useState<WasteBatch[]>([]);
  const [cityProjects, setCityProjects] = useState<CityProject[]>([]);
  const [selectedItem, setSelectedItem] = useState<WasteBatch | CityProject | Material | null>(
    null
  );
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

  const fetchWasteBatches = async () => {
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
  };

  const fetchCityProjects = async () => {
    if (!user?.currentSession) return;
    try {
      const response = await municipalityService.getCityProjects(user.currentSession);
      if (response.success && response.data) {
        setCityProjects(response.data.projects);
      }
    } catch (err: any) {
      console.error('Failed to fetch city projects', err);
    }
  };

  useEffect(() => {
    fetchGameState();
    fetchWasteBatches();
    fetchCityProjects();
  }, []);

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

  const authoritativeState = fullPayload?.gameState ?? currentGameState;

  useEffect(() => {
    if (authoritativeState?.activeTransports) {
      setActiveTransports(authoritativeState.activeTransports);
    }
  }, [authoritativeState?.activeTransports]);

  useEffect(() => {
    const unsubGameStateUpdate = subscribe('game-state-update', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);

        if (data.gameState.wasteBatches) {
          setWasteBatches(
            data.gameState.wasteBatches.filter((batch: WasteBatch) => batch.status === 'PENDING')
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

        if (data.gameState.wasteBatches) {
          setWasteBatches(
            data.gameState.wasteBatches.filter((batch: WasteBatch) => batch.status === 'PENDING')
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

        if (data.gameState.wasteBatches) {
          setWasteBatches(
            data.gameState.wasteBatches.filter((batch: WasteBatch) => batch.status === 'PENDING')
          );
        }
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

        if (data.gameState.wasteBatches) {
          const pendingBatches = data.gameState.wasteBatches.filter(
            (batch: WasteBatch) => batch.status === 'PENDING'
          );
          setWasteBatches(pendingBatches);
        }
      }

      const actionType = data?.actionType;
      if (actionType === 'waste-collected' || actionType === 'waste-rejected') {
      } else if (actionType === 'project-constructed') {
        fetchCityProjects();
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

      fetchWasteBatches();
      fetchCityProjects();
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
      }
    });

    const unsubExternalPurchase = subscribe('external-purchase', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    const unsubTransportStarted = subscribe('transport-started', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
        if (data.gameState.activeTransports) {
          setActiveTransports(data.gameState.activeTransports);
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
        if (data.gameState.activeTransports) {
          setActiveTransports(data.gameState.activeTransports);
        }
      }
      addNotification({
        message: `✅ Transport completed! ${data?.batchMass?.toFixed(1)} tons delivered to MRF.`,
        type: 'success',
      });
      fetchWasteBatches();
    });

    const unsubSurrenderUpdate = subscribe('surrender-update', (data: any) => {
      if (data?.surrenderVotes && gameState) {
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
      unsubAuctionsResolved && unsubAuctionsResolved();
      unsubExternalPurchase && unsubExternalPurchase();
      unsubTransportStarted && unsubTransportStarted();
      unsubTransportCompleted && unsubTransportCompleted();
      unsubSurrenderUpdate && unsubSurrenderUpdate();
    };
  }, [subscribe, router, fetchWasteBatches, fetchCityProjects, addNotification]);

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

  const selectableMaterials = authoritativeState?.municipalInventory
    ? Object.entries(authoritativeState.municipalInventory)
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
        if (parsed?.constants?.REAL_TIME_GAME_DURATION_MINUTES) durationMin = parsed.constants.REAL_TIME_GAME_DURATION_MINUTES;
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
    console.log('=== handleCollectWasteWithTransport CALLED ===');
    console.log('mode:', mode);
    console.log('user:', user);
    console.log('currentSession:', user?.currentSession);
    console.log('selectedItem:', selectedItem);
    
    if (!user?.currentSession || !selectedItem || !('status' in selectedItem)) {
      console.log('FAILED: No active session or no batch selected');
      addNotification({
        message: 'No active session or no batch selected',
        type: 'error',
      });
      return;
    }

    console.log('selectedItem.status:', selectedItem.status);
    
    if (selectedItem.status !== 'PENDING') {
      console.log('FAILED: Batch status is not PENDING');
      addNotification({
        message: `Batch is already ${selectedItem.status}`,
        type: 'error',
      });
      return;
    }

    const mass = (selectedItem as WasteBatch).mass;
    const cost = mode === 'fast' ? mass * 50 : mass * 25;
    const currentBudget = authoritativeState?.budget ?? 0;

    console.log('mass:', mass);
    console.log('cost:', cost);
    console.log('currentBudget:', currentBudget);

    if (currentBudget < cost) {
      console.log('FAILED: Insufficient budget');
      addNotification({
        message: `Insufficient budget. ${mode} transport costs $${cost.toFixed(2)} but your budget is $${currentBudget.toFixed(2)}.`,
        type: 'error',
      });
      return;
    }

    console.log('Making API call to:', `/municipality/collect-waste-transport/${user.currentSession}`);
    console.log('Request body:', {
      batchId: selectedItem.id,
      sessionId: user.currentSession,
      mode: mode,
    });
    
    try {
      const response = await municipalityService.collectWasteWithTransport(
        user.currentSession,
        {
          batchId: selectedItem.id,
          sessionId: user.currentSession,
          mode: mode,
        }
      );
      
      console.log('API response:', response);
      
      if (response.success) {
        addNotification({
          message: `${mode.toUpperCase()} transport started! Waste will arrive in ${mode === 'fast' ? '30' : '60'} seconds.`,
          type: 'success',
        });
        setSelectedItem(null);
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
      console.error('Error response:', err?.response);
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
    emit('surrender-toggle', { sessionId: user.currentSession });
  };

  const surrenderVotes = authoritativeState?.surrenderVotes ?? [];
  const canSurrender = (authoritativeState?.minutesElapsed ?? 0) >= 15;

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
              cityHealth={authoritativeState?.cityHealth}
              budget={authoritativeState?.budget}
              totalCO2={authoritativeState?.totalCO2}
              wasteInventory={authoritativeState?.wasteInventory}
              onStatusLog={handleStatusLog}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 lg:min-h-0 lg:overflow-hidden">
            <div className="xl:col-span-3 lg:col-span-2 col-span-1 flex flex-col lg:min-h-0 lg:overflow-hidden">
              <div
                className="bg-cover bg-center mx-auto rounded-[20px] flex flex-col lg:min-h-0 overflow-hidden w-full flex-1"
                style={{ backgroundImage: `url(${woodenBg.src})` }}
              >
                <MunicipalityCustomHeader
                  backgroundImage={woodenHead.src}
                  title={authoritativeState?.teamRole || currentGameState?.teamRole}
                />
                <GameModeBadge gameMode={gameMode} />
                <div className="flex justify-center mb-1 flex-shrink-0">
                  <div className="bg-white rounded-lg p-1 shadow-md">
                    <button
                      onClick={() => {
                        setActiveTab('waste-collection');
                        setSelectedItem(null);
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
                  </div>
                </div>
                <div className="flex-1 lg:min-h-0 lg:overflow-hidden">
                  {activeTab === 'waste-collection' ? (
                    <MunicipalityWasteSelectedBox
                      key={wasteBatches.map((b) => b.id).join(',')}
                      wasteBatches={wasteBatches}
                      selectedBatch={
                        selectedItem && 'status' in selectedItem
                          ? (selectedItem as WasteBatch)
                          : null
                      }
                      setSelectedBatch={(batch) => {
                        setSelectedItem(batch);
                        setSelectedMaterial(null);
                        setSelectedProject(null);
                      }}
                    />
                  ) : (
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
                        setSelectedMaterial((material as any).type);
                        setSelectedProject(null);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="xl:col-span-1 lg:col-span-2 col-span-1 lg:overflow-y-auto lg:min-h-0">
              {activeTab === 'waste-collection' ? (
                selectedItem && 'status' in selectedItem ? (
                  <WasteCollectAction
                    budget={authoritativeState?.budget ?? currentGameState?.budget}
                    totalCO2={authoritativeState?.totalCO2 ?? (currentGameState?.totalCO2 || 0)}
                    wasteInventory={
                      authoritativeState?.wasteInventory ?? currentGameState?.wasteInventory
                    }
                    maxCapacity={authoritativeState?.maxCapacity ?? currentGameState?.maxCapacity}
                    selectedBatch={selectedItem}
                    handleCollectWaste={handleCollectWasteWithTransport}
                    transportCostPerTon={
                      (authoritativeState?.constants?.FIXED_DISTANCE_TO_MRF_KM ?? 10) *
                      (authoritativeState?.constants?.TRANSPORT_COST_PER_TON_KM ?? 2.5)
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
                    authoritativeState?.municipalInventory ?? currentGameState?.municipalInventory
                  }
                  handleConstructProject={handleConstructProject}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <SurrenderButton
        playerId={user?._id ?? ''}
        surrenderVotes={surrenderVotes}
        canSurrender={canSurrender}
        onToggle={handleSurrenderToggle}
      />
    </div>
  );
}