'use client';

import MunicipalityCustomHeader from '@/components/layout/header/customheader/MunicipalityCustomHeader';
import { MaterialConstructAction } from '@/components/ui/materialConstructAction/MaterialConstructAction';
import { MunicipalityMaterialSelectedBox } from '@/components/ui/selectedBox/MunicipalityMaterialSelectedBox';
import { MunicipalityWasteSelectedBox } from '@/components/ui/selectedBox/MunicipalityWasteSelectedBox';
import ShiftLog from '@/components/ui/shiftLog/ShiftLog';
import { WasteCollectAction } from '@/components/ui/wasteCollectAction/WasteCollectAction';
import { SurrenderButton } from '@/components/ui/surrenderButton/SurrenderButton';
import { useWebSocket } from '@/hooks/useWebSocket';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHead from '@/public/assets/images/woodenHead.png';
import { gameService } from '@/services/gameService';
import { municipalityService } from '@/services/municipalityService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { CityProject, GameState, Material, WasteBatch } from '@/types/besse';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

  // Join the user's current session when websocket connects
  useEffect(() => {
    if (user?.currentSession && isConnected) {
      console.log('Municipality page: Calling joinGame with sessionId:', user.currentSession);
      joinGame(user.currentSession);
    } else {
      console.log(
        'Municipality page: Not joining yet - user.currentSession:',
        user?.currentSession,
        'isConnected:',
        isConnected
      );
    }
  }, [user?.currentSession, isConnected, joinGame]);

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
          console.log('[Municipality] Updating waste batches from real-time event:', {
            total: data.gameState.wasteBatches.length,
            pending: pendingBatches.length,
            actionType: data?.actionType,
          });
          setWasteBatches(pendingBatches);
        }
      }

      // Handle specific actions based on actionType
      const actionType = data?.actionType;
      if (actionType === 'waste-collected' || actionType === 'waste-rejected') {
        console.log(
          '[Municipality] Waste action detected - batches already updated from gameState'
        );
        // No need to call fetchWasteBatches() - already updated from gameState above
      } else if (actionType === 'project-constructed') {
        console.log('[Municipality] Project constructed - refreshing projects');
        fetchCityProjects();
      }
    });

    // COUNTDOWN EXPIRED EVENT
    const unsubCountdownExpired = subscribe('countdown-expired', (data: any) => {
      console.log('Countdown expired received in Municipality page:', data);
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
      console.log('Countdown started received in Municipality page:', data);
      // Update game state if provided to start the countdown
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // COUNTDOWN CANCELLED EVENT
    const unsubCountdownCancelled = subscribe('countdown-cancelled', (data: any) => {
      console.log('Countdown cancelled received in Municipality page:', data);
      // Update game state if provided to clear the countdown
      if (data?.gameState) {
        setGameState(data.gameState);
      }
    });

    // Player actions for live log
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

    // System messages for live log
    const unsubSystemMessage = subscribe('system-message', (data: any) => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLiveLogItems((prev) =>
        [{ time, message: data.message, isLive: true, type: data.type }, ...prev].slice(0, 100)
      );
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

  const staticLogData =
    currentGameState?.activityLog?.map((log, index) => ({
      time: `[${String(currentGameState.currentGameHour).padStart(2, '0')}:${String(
        (index * 15) % 60
      ).padStart(2, '0')}]`,
      message: log,
    })) || [];

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

  // For formatted logs, always use staticLogData which is properly formatted with time+message
  // Merge live websocket logs (newest first) with the static activity log
  const logData = [...staticLogData];

  // Derived UI: combine summaries for display
  const turn = turnSummary || null;
  const stats = statistics || null;

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
                {/* Tab Navigation */}
                <div className="flex justify-center mb-4">
                  <div className="bg-white rounded-lg p-1 shadow-md">
                    <button
                      onClick={() => {
                        setActiveTab('waste-collection');
                        setSelectedItem(null);
                        setSelectedMaterial(null);
                        setSelectedProject(null);
                      }}
                      className={`px-6 py-2 rounded-md font-semibold transition-colors ${
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
                      className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                        activeTab === 'city-projects'
                          ? 'bg-[#3A7D2C] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Inventory
                    </button>
                  </div>
                </div>
                <div>
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
            {/* Right side */}
            <div className="xl:col-span-1  lg:col-span-2 col-span-1">
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
