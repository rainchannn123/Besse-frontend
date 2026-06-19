'use client';

import MunicipalityCustomHeader from '@/components/layout/header/customheader/MunicipalityCustomHeader';
import GameModeBadge from '@/components/ui/GameModeBadge';
import { MaterialConstructAction } from '@/components/ui/materialConstructAction/MaterialConstructAction';
import { MunicipalityMaterialSelectedBox } from '@/components/ui/selectedBox/MunicipalityMaterialSelectedBox';
import { MunicipalityWasteSelectedBox } from '@/components/ui/selectedBox/MunicipalityWasteSelectedBox';
import ShiftLog from '@/components/ui/shiftLog/ShiftLog';
import { WasteCollectAction } from '@/components/ui/wasteCollectAction/WasteCollectAction';
import { SurrenderButton } from '@/components/ui/surrenderButton/SurrenderButton';
import GameChatbot from '@/components/ui/chatbot/GameChatbot';
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
        // Store init_state and current_game_session in localStorage
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
      // console.log('Municipality page: Calling joinGame with sessionId:', user.currentSession);
      joinGame(user.currentSession);
    } else {
      // console.log(
      //   'Municipality page: Not joining yet - user.currentSession:',
      //   user?.currentSession,
      //   'isConnected:',
      //   isConnected
      // );
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

  // Subscribe to realtime events
  useEffect(() => {
    // Game state updates
    const unsubGameStateUpdate = subscribe('game-state-update', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);

        // Update waste batches directly from gameState for real-time updates
        if (data.gameState.wasteBatches) {
          setWasteBatches(
            data.gameState.wasteBatches.filter((batch: WasteBatch) => batch.status === 'PENDING')
          );
        }

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

        // Update waste batches directly from gameState for real-time updates
        if (data.gameState.wasteBatches) {
          setWasteBatches(
            data.gameState.wasteBatches.filter((batch: WasteBatch) => batch.status === 'PENDING')
          );
        }

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

        // Update waste batches directly from gameState for real-time updates
        if (data.gameState.wasteBatches) {
          setWasteBatches(
            data.gameState.wasteBatches.filter((batch: WasteBatch) => batch.status === 'PENDING')
          );
        }
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

        // Update waste batches directly from gameState for real-time updates
        if (data.gameState.wasteBatches) {
          const pendingBatches = data.gameState.wasteBatches.filter(
            (batch: WasteBatch) => batch.status === 'PENDING'
          );
          // console.log('[Municipality] Updating waste batches from real-time event:', {
          //   total: data.gameState.wasteBatches.length,
          //   pending: pendingBatches.length,
          //   actionType: data?.actionType,
          // });
          setWasteBatches(pendingBatches);
        }
      }

      // Handle specific actions based on actionType
      const actionType = data?.actionType;
      if (actionType === 'waste-collected' || actionType === 'waste-rejected') {
        // console.log(
        //   '[Municipality] Waste action detected - batches already updated from gameState'
        // );
        // No need to call fetchWasteBatches() - already updated from gameState above
      } else if (actionType === 'project-constructed') {
        // console.log('[Municipality] Project constructed - refreshing projects');
        fetchCityProjects();
      }
    });

    // COUNTDOWN EXPIRED EVENT
    const unsubCountdownExpired = subscribe('countdown-expired', (data: any) => {
      // console.log('Countdown expired received in Municipality page:', data);
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

      // Refresh data
      fetchWasteBatches();
      fetchCityProjects();
    });

    // COUNTDOWN STARTED EVENT
    const unsubCountdownStarted = subscribe('countdown-started', (data: any) => {
      // console.log('Countdown started received in Municipality page:', data);
      // Update game state if provided to start the countdown
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // COUNTDOWN CANCELLED EVENT
    const unsubCountdownCancelled = subscribe('countdown-cancelled', (data: any) => {
      // console.log('Countdown cancelled received in Municipality page:', data);
      // Update game state if provided to clear the countdown
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // Player actions for live log
    const unsubPlayerAction = subscribe('player-action', (data: any) => {
      const time = getCountdownTime();
      const message = data?.playerName
        ? `${data.playerName} ${data.action || ''}`
        : JSON.stringify(data);
      setLiveLogItems((prev) => [...prev, { time, message, isLive: true }].slice(-100));
    });

    // TEMPORARILY COMMENTED OUT - system messages for live log
    const unsubSystemMessage = subscribe('system-message', (_data: any) => {
      // const time = getCountdownTime();
      // setLiveLogItems((prev) =>
      //   [...prev, { time, message: data.message, isLive: true, type: data.type }].slice(-100)
      // );
    });

    const unsubAuctionsResolved = subscribe('auctions-resolved', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });
    //external-purchase
    const unsubExternalPurchase = subscribe('external-purchase', (data: any) => {
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // Surrender vote updates from other players
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
      unsubSurrenderUpdate && unsubSurrenderUpdate();
    };
  }, [subscribe, router, fetchWasteBatches, fetchCityProjects]);

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

  // Create selectable materials from municipalInventory
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

  // For formatted logs, merge static activity log with live websocket logs
  const logData = [...staticLogData, ...liveLogItems];

  // Derived UI: combine summaries for display
  const turn = turnSummary || null;
  const stats = statistics || null;

  const shiftStart = authoritativeState
    ? `${String(authoritativeState.gameStartTime).padStart(2, '0')}:00`
    : '00:00';

  const shiftStartTime = authoritativeState
    ? Date.now() - (authoritativeState.minutesElapsed || 0) * 60 * 1000
    : 0;

  // Keep ref in sync for use in websocket callbacks (avoids re-subscription)
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
  const handleCollectWaste = async () => {
    if (!user?.currentSession) {
      addNotification({
        message: 'No active session',
        type: 'error',
      });
      return;
    }

    // Check if selectedItem is a WasteBatch (has status property)
    if (selectedItem && 'status' in selectedItem) {
      if (selectedItem.status === 'PENDING') {
        // Pre-check: ensure sufficient budget before attempting collection
        const constants = authoritativeState?.constants;
        const costPerTon =
          (constants?.FIXED_DISTANCE_TO_MRF_KM ?? 10) *
          (constants?.TRANSPORT_COST_PER_TON_KM ?? 2.5);
        const estimatedCost = (selectedItem as WasteBatch).mass * costPerTon;
        const currentBudget = authoritativeState?.budget ?? 0;
        if (currentBudget < estimatedCost) {
          addNotification({
            message: `Insufficient budget. This collection costs $${estimatedCost.toFixed(2)} but your budget is $${currentBudget.toFixed(2)}.`,
            type: 'error',
          });
          return;
        }

        try {
          const response = await municipalityService.collectWaste(user.currentSession, {
            batchId: selectedItem.id,
            sessionId: user.currentSession,
          });
          if (response.success) {
            addNotification({
              message: 'Waste Sent to MRF',
              type: 'success',
            });
            setSelectedItem(null);
            fetchGameState();
            fetchWasteBatches();
          } else {
            addNotification({
              message: response.message || 'Failed to collect waste',
              type: 'error',
            });
          }
        } catch (err: any) {
          addNotification({
            message:
              err?.response?.data?.message ||
              err?.message ||
              'Insufficient budget for waste collection',
            type: 'error',
          });
        }
      } else {
        addNotification({
          message: `Batch is already ${selectedItem.status}`,
          type: 'error',
        });
      }
    } else {
      addNotification({
        message: 'Please select a waste batch to collect',
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
    <div className="bg-[#f3e9da] min-h-screen flex flex-col pb-6 lg:pb-8">
      <div className="container mx-auto sm:p-0 px-4 flex flex-col gap-3">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="xl:col-span-3 lg:col-span-2 col-span-1 flex flex-col">
            <div
              className="bg-cover bg-center mx-auto rounded-[20px] flex flex-col lg:min-h-0 lg:max-h-[calc(100vh-21rem)] hoverflow-hidden w-full flex-1"
              style={{ backgroundImage: `url(${woodenBg.src})` }}
            >
              <MunicipalityCustomHeader
                backgroundImage={woodenHead.src}
                title={authoritativeState?.teamRole || currentGameState?.teamRole}
              />
              {/* <GameModeBadge gameMode={gameMode} /> */}

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

              <div className="flex-1 min-h-0 overflow-hidden">
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

          <div className="xl:col-span-1 lg:col-span-2 col-span-1 lg:max-h-[calc(100vh-21rem)] lg:overflow-y-auto lg:pr-1">
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
                  handleCollectWaste={handleCollectWaste}
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

        {/* <SurrenderButton
          playerId={user?._id ?? ''}
          surrenderVotes={surrenderVotes}
          canSurrender={canSurrender}
          onToggle={handleSurrenderToggle}
        /> */}
      </div>

      <GameChatbot pageContext="municipality" />
    </div>
  );
}
