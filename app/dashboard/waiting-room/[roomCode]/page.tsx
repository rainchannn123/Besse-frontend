'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Copy, LogOut, Loader2 } from 'lucide-react';
import WaitingRoomTeamCard from '@/components/ui/pairing/WaitingRoomTeamCard';
import ReadyButton from '@/components/ui/pairing/ReadyButton';
import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { gameService } from '@/services/gameService';
import { useWebSocket } from '@/hooks/useWebSocket';

interface TeamData {
  teamRole: 'Team A' | 'Team B';
  teamName: string;
  isReady: boolean;
  players: {
    userId: string;
    name: string;
    role: string | null;
  }[];
}

interface WaitingRoomData {
  roomCode: string;
  status: string;
  teams: TeamData[];
}

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { subscribe, isConnected } = useWebSocket();

  const [waitingRoom, setWaitingRoom] = useState<WaitingRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isTogglingReady, setIsTogglingReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const gameStartedRef = useRef(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Function to redirect user based on their role - UPDATED with hard redirect and fallback
  const redirectToGame = useCallback(async (sessionId: string) => {
    if (gameStartedRef.current) return;
    gameStartedRef.current = true;

    console.log('🎮 Redirecting to game for session:', sessionId);
    
    try {
      const gameStateResponse = await gameService.getGameState(sessionId);
      if (gameStateResponse.success && gameStateResponse.data) {
        const userRole = gameStateResponse.data.userRole;
        localStorage.setItem('init_state', JSON.stringify(gameStateResponse.data.gameState));
        localStorage.setItem('current_game_session', sessionId);
        
        console.log('✅ User role:', userRole, 'Redirecting to dashboard...');
        
        // Use window.location.href for guaranteed redirect (bypasses React router issues)
        if (userRole === 'municipality') {
          window.location.href = '/dashboard/municipality';
        } else if (userRole === 'mrf') {
          window.location.href = '/dashboard/mrf-collection';
        } else if (userRole === 'broker') {
          window.location.href = '/dashboard/broker-inventory';
        } else {
          window.location.href = '/dashboard/pairing';
        }
      } else {
        console.error('Failed to get game state');
        window.location.href = '/dashboard/pairing';
      }
    } catch (error) {
      console.error('Redirect error:', error);
      window.location.href = '/dashboard/pairing';
    }
  }, []);

  const handleStartGame = useCallback(async () => {
    if (gameStartedRef.current) {
      console.log('Game already started, skipping...');
      return;
    }
    
    console.log('🚀 handleStartGame called for room:', roomCode);
    console.log('Current user session:', user?.currentSession);
    
    setIsStarting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/waiting-rooms/start-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomCode }),
      });
      const data = await response.json();

      console.log('Start game response:', data);

      if (data.success) {
        addNotification({
          message: 'Both teams ready! Starting game...',
          type: 'success',
        });

        const currentSessionId = user?.currentSession;
        
        if (currentSessionId) {
          // Store game state in localStorage
          if (data.data.teamAGameState && data.data.teamASessionId === currentSessionId) {
            localStorage.setItem('init_state', JSON.stringify(data.data.teamAGameState));
          } else if (data.data.teamBGameState && data.data.teamBSessionId === currentSessionId) {
            localStorage.setItem('init_state', JSON.stringify(data.data.teamBGameState));
          }
          
          localStorage.setItem('current_game_session', currentSessionId);
          
          // Mark as started before redirect to prevent loops
          gameStartedRef.current = true;
          
          // Fetch game state to get user role and redirect
          const gameStateResponse = await gameService.getGameState(currentSessionId);
          if (gameStateResponse.success && gameStateResponse.data) {
            const userRole = gameStateResponse.data.userRole;
            console.log('User role:', userRole, 'Redirecting...');
            
            // Use window.location for guaranteed redirect
            if (userRole === 'municipality') {
              window.location.href = '/dashboard/municipality';
            } else if (userRole === 'mrf') {
              window.location.href = '/dashboard/mrf-collection';
            } else if (userRole === 'broker') {
              window.location.href = '/dashboard/broker-inventory';
            } else {
              // Fallback - try to get role from game state players mapping
              const playerRoles = gameStateResponse.data.gameState?.players;
              if (playerRoles) {
                let foundRole = null;
                for (const [role, playerId] of Object.entries(playerRoles)) {
                  if (playerId === currentSessionId) {
                    foundRole = role;
                    break;
                  }
                }
                if (foundRole === 'municipality') {
                  window.location.href = '/dashboard/municipality';
                } else if (foundRole === 'mrf') {
                  window.location.href = '/dashboard/mrf-collection';
                } else if (foundRole === 'broker') {
                  window.location.href = '/dashboard/broker-inventory';
                } else {
                  window.location.href = '/dashboard/pairing';
                }
              } else {
                window.location.href = '/dashboard/pairing';
              }
            }
          } else {
            window.location.href = '/dashboard/pairing';
          }
        }
      } else {
        gameStartedRef.current = false;
        addNotification({
          message: data.message || 'Failed to start game',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Start game error:', error);
      gameStartedRef.current = false;
      addNotification({
        message: error.message || 'Failed to start game',
        type: 'error',
      });
    } finally {
      setIsStarting(false);
    }
  }, [roomCode, API_URL, user?.currentSession, addNotification]);

  const fetchWaitingRoom = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/waiting-rooms/${roomCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success && data.data?.waitingRoom) {
        setWaitingRoom(data.data.waitingRoom);
        
        // Check if game should start based on status
        if (data.data.waitingRoom.status === 'ready' && !gameStartedRef.current) {
          console.log('📡 Polling detected room status = ready, starting game...');
          await handleStartGame();
        }
      } else if (data.success === false) {
        addNotification({
          message: data.message || 'Waiting room not found',
          type: 'error',
        });
        router.push('/dashboard/pairing');
      }
    } catch (error) {
      console.error('Failed to fetch waiting room:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, API_URL, router, addNotification, handleStartGame]);

  // WebSocket listener for game-started event
  useEffect(() => {
    if (!isConnected) return;

    const unsubGameStarted = subscribe('game-started', (data: any) => {
      console.log('🔔 Game-started event received via WebSocket:', data);
      if (data?.sessionId === user?.currentSession && !gameStartedRef.current) {
        console.log('🎯 WebSocket triggered redirect for current user');
        redirectToGame(user!.currentSession!);
      }
    });

    return () => {
      if (unsubGameStarted) unsubGameStarted();
    };
  }, [isConnected, subscribe, user?.currentSession, redirectToGame]);

  // Poll for waiting room updates
  useEffect(() => {
    fetchWaitingRoom();
    const interval = setInterval(fetchWaitingRoom, 3000);
    return () => clearInterval(interval);
  }, [fetchWaitingRoom]);

  // Monitor when both teams are present and both become ready
  useEffect(() => {
    if (!waitingRoom || gameStartedRef.current) return;
    
    const teams = waitingRoom.teams;
    if (teams.length === 2) {
      const bothReady = teams.every(t => t.isReady === true);
      console.log('📊 Teams status:', teams.map(t => ({ role: t.teamRole, ready: t.isReady })));
      
      if (bothReady) {
        console.log('🎯 useEffect detected both teams ready, starting game...');
        handleStartGame();
      }
    }
  }, [waitingRoom, handleStartGame]);

  const isTeamLeader = (): boolean => {
    if (!waitingRoom || !user?.currentSession) return false;
    const userTeam = waitingRoom.teams.find(
      (t) => t.players.some((p) => p.userId === user._id)
    );
    return userTeam ? userTeam.players[0]?.userId === user._id : false;
  };

  const isCurrentTeamReady = (): boolean => {
    if (!waitingRoom || !user?.currentSession) return false;
    const userTeam = waitingRoom.teams.find(
      (t) => t.players.some((p) => p.userId === user._id)
    );
    return userTeam?.isReady || false;
  };

  const bothTeamsPresent = (): boolean => {
    return waitingRoom?.teams.length === 2;
  };

  const getCurrentTeam = (): TeamData | null => {
    if (!waitingRoom || !user?.currentSession) return null;
    return (
      waitingRoom.teams.find((t) => t.players.some((p) => p.userId === user._id)) || null
    );
  };

  const getOpponentTeam = (): TeamData | null => {
    if (!waitingRoom || !user?.currentSession) return null;
    return (
      waitingRoom.teams.find((t) => !t.players.some((p) => p.userId === user._id)) || null
    );
  };

  const handleToggleReady = async () => {
    if (!isTeamLeader()) {
      addNotification({
        message: 'Only the team leader can mark the team as ready',
        type: 'error',
      });
      return;
    }

    setIsTogglingReady(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/waiting-rooms/toggle-ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomCode,
          sessionId: user?.currentSession,
          isReady: !isCurrentTeamReady(),
        }),
      });
      const data = await response.json();

      if (data.success) {
        setWaitingRoom(data.data.waitingRoom);

        // Check if both teams are ready
        const teams = data.data.waitingRoom.teams;
        const bothTeamsExist = teams.length === 2;
        const bothReady = bothTeamsExist && teams.every((t: TeamData) => t.isReady === true);
        
        console.log('🔄 Toggle ready response - Teams:', teams.map(t => ({ role: t.teamRole, ready: t.isReady })));
        console.log('Both ready?', bothReady);
        console.log('Current user session:', user?.currentSession);
        
        // CRITICAL FIX: If both teams are ready, start game IMMEDIATELY
        if (bothReady && !gameStartedRef.current) {
          console.log('🏁 Both teams ready! Starting game immediately...');
          // Call handleStartGame directly without setTimeout
          await handleStartGame();
        }
      } else {
        addNotification({
          message: data.message || 'Failed to update ready status',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.message || 'Failed to update ready status',
        type: 'error',
      });
    } finally {
      setIsTogglingReady(false);
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/waiting-rooms/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomCode,
          sessionId: user?.currentSession,
        }),
      });
      const data = await response.json();

      if (data.success) {
        addNotification({
          message: data.data.deleted ? 'Room closed' : 'Left waiting room',
          type: 'info',
        });
        window.location.href = '/dashboard/pairing';
      } else {
        addNotification({
          message: data.message || 'Failed to leave room',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.message || 'Failed to leave room',
        type: 'error',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    addNotification({
      message: 'Room code copied to clipboard!',
      type: 'success',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#50704C]" />
      </div>
    );
  }

  if (!waitingRoom) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex items-center justify-center">
        <p className="text-[#5b3a1f]">Waiting room not found</p>
      </div>
    );
  }

  const currentTeam = getCurrentTeam();
  const opponentTeam = getOpponentTeam();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#efe4d2] via-[#f8f1e6] to-[#e8dcc7] p-4 md:p-8">
      <div className="mx-auto max-w-[1000px] space-y-6">
        <div
          className="bg-cover bg-center rounded-[20px] overflow-hidden"
          style={{ backgroundImage: `url(${woodenBg.src})` }}
        >
          <CustomHeader
            backgroundImage={woodenHeading.src}
            title="Game Waiting Room"
            subtitle="Wait for another team to join"
          />

          <div className="p-6 space-y-6">
            {/* Room Code Display */}
            <div className="flex justify-between items-center p-4 bg-[#fff9ef] rounded-lg border border-[#d3c4ad]">
              <div>
                <p className="text-sm text-[#7a5f41]">Room Code</p>
                <p className="text-2xl font-mono font-bold text-[#33552C]">{roomCode}</p>
              </div>
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-2 px-4 py-2 bg-[#50704C] text-white rounded-lg hover:bg-[#3A7D2C] transition-colors"
              >
                <Copy size={16} />
                Copy Code
              </button>
            </div>

            {/* Teams Display */}
            <div className="grid lg:grid-cols-2 gap-6">
              <WaitingRoomTeamCard
                team={currentTeam}
                title="Your Team"
                isCurrentTeam={true}
              />

              <WaitingRoomTeamCard
                team={opponentTeam}
                title="Opponent Team"
                isCurrentTeam={false}
              />
            </div>

            {/* Ready Button */}
            <ReadyButton
              isReady={isCurrentTeamReady()}
              isLeader={isTeamLeader()}
              bothTeamsPresent={bothTeamsPresent()}
              onToggleReady={handleToggleReady}
              isLoading={isTogglingReady}
            />

            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              disabled={isLeaving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[#a94747] text-[#8d2626] rounded-lg hover:bg-[#fff0f0] transition-colors font-semibold disabled:opacity-50"
            >
              <LogOut size={18} />
              {isLeaving ? 'Leaving...' : 'Leave Room'}
            </button>

            {/* Game Start Indicator */}
            {isStarting && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-[#50704C] mx-auto mb-4" />
                  <p className="text-[#4f2d14] font-semibold">Starting game...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}