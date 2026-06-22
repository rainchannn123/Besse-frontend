'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Copy, LogOut, Users, Crown, Play, Loader2 } from 'lucide-react';
import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Player {
  userId: string;
  name: string;
  role: string | null;
  isLeader: boolean;
}

interface Team {
  teamId: string;
  citySlot: number;
  players: Player[];
  isReady: boolean;
}

interface GameRoomData {
  roomCode: string;
  roomName: string;
  isPrivate: boolean;
  ownerId: string;
  ownerName: string;
  isAdminRoom: boolean;
  teams: Team[];
  maxTeams: number;
  status: 'waiting' | 'ready' | 'started' | 'completed';
  gameSessionId?: string;
  createdAt: string;
}

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { subscribe, isConnected, joinGame } = useWebSocket();

  const [roomData, setRoomData] = useState<GameRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Check if user is admin
  const checkIsAdmin = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data?.user?.accountType === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    checkIsAdmin();
  }, [checkIsAdmin]);

  const fetchRoomData = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/matchmaking/rooms/${roomCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRoomData(data.data.room);
        
        // Check if game has started - redirect to gameplay
        if (data.data.room.status === 'started') {
          const userTeam = data.data.room.teams.find((team: Team) =>
            team.players.some((p: Player) => p.userId === user?._id)
          );
          if (userTeam) {
            const player = userTeam.players.find((p: Player) => p.userId === user?._id);
            if (player?.role === 'municipality') {
              window.location.href = '/dashboard/municipality';
            } else if (player?.role === 'mrf') {
              window.location.href = '/dashboard/mrf-collection';
            } else if (player?.role === 'broker') {
              window.location.href = '/dashboard/broker-inventory';
            }
          }
          // If admin, redirect to admin dashboard
          if (user?.accountType === 'admin') {
            window.location.href = '/admin';
          }
        }
      } else {
        addNotification({
          message: data.message || 'Room not found',
          type: 'error',
        });
        router.push('/dashboard/matchmaking-lobby');
      }
    } catch (error) {
      console.error('Failed to fetch room data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, API_URL, router, addNotification, user?._id, user?.accountType]);

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 3000);
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  // ✅ Join the game room via WebSocket when component mounts
  useEffect(() => {
    if (roomCode && isConnected) {
      joinGame(roomCode);
    }
  }, [roomCode, isConnected, joinGame]);

  // ✅ Listen for room:joined event (team members auto-join)
  useEffect(() => {
    if (!roomCode) return;

    const unsubRoomJoined = subscribe('room:joined', (data: any) => {
      console.log('📢 Team member joined room:', data);
      
      if (data?.roomCode === roomCode && data?.redirect) {
        fetchRoomData();
        addNotification({
          message: '📢 A team has joined the room!',
          type: 'info',
        });
      }
    });

    // ✅ Listen for room:seating:update
    const unsubSeatingUpdate = subscribe('room:seating:update', (data: any) => {
      if (data?.roomCode === roomCode) {
        fetchRoomData();
      }
    });

    // ✅ Listen for room:started - use event data for redirect
    const unsubRoomStarted = subscribe('room:started', (data: any) => {
      console.log('[GameRoom] room:started event received:', data);
      
      if (data?.roomCode === roomCode) {
        addNotification({
          message: '🚀 Game is starting!',
          type: 'success',
        });
        
        // ✅ Use roomData to find the user's role
        const userTeam = roomData?.teams.find((team: Team) =>
          team.players.some((p: Player) => p.userId === user?._id)
        );
        
        if (userTeam) {
          const player = userTeam.players.find((p: Player) => p.userId === user?._id);
          console.log('[GameRoom] Player role from roomData:', player?.role);
          
          if (player?.role === 'municipality') {
            window.location.href = '/dashboard/municipality';
          } else if (player?.role === 'mrf') {
            window.location.href = '/dashboard/mrf-collection';
          } else if (player?.role === 'broker') {
            window.location.href = '/dashboard/broker-inventory';
          }
        } else if (isAdmin) {
          window.location.href = '/admin';
        }
      }
    });

    // ✅ Listen for game-started event (backup for individual players)
    const unsubGameStarted = subscribe('game-started', (data: any) => {
      console.log('[GameRoom] game-started event received:', data);
      
      if (data?.sessionId === user?.currentSession) {
        addNotification({
          message: '🚀 Game is starting! Redirecting...',
          type: 'success',
        });
        
        // Find the user's role from the game state
        const gameState = data.gameState;
        if (gameState) {
          // Find the team for this session
          const team = gameState.teams?.find((t: any) => t.sessionId === user?.currentSession);
          if (team) {
            let role = null;
            if (team.players.municipality === user?._id) role = 'municipality';
            else if (team.players.mrf === user?._id) role = 'mrf';
            else if (team.players.broker === user?._id) role = 'broker';
            
            console.log('[GameRoom] User role from gameState:', role);
            
            if (role === 'municipality') {
              window.location.href = '/dashboard/municipality';
            } else if (role === 'mrf') {
              window.location.href = '/dashboard/mrf-collection';
            } else if (role === 'broker') {
              window.location.href = '/dashboard/broker-inventory';
            }
          }
        }
      }
    });

    return () => {
      unsubRoomJoined && unsubRoomJoined();
      unsubSeatingUpdate && unsubSeatingUpdate();
      unsubRoomStarted && unsubRoomStarted();
      unsubGameStarted && unsubGameStarted();
    };
  }, [roomCode, subscribe, fetchRoomData, addNotification, roomData, user?._id, isAdmin, user?.currentSession]);

  const handleStartGame = async () => {
    if (!roomData) return;

    const currentTeamCount = roomData.teams?.length || 0;
    if (currentTeamCount < 2) {
      addNotification({
        message: `Need at least 2 teams to start the game. Currently ${currentTeamCount} team(s).`,
        type: 'error',
      });
      return;
    }

    // ✅ Only Admin can start the game
    if (!isAdmin) {
      addNotification({
        message: 'Only Admin can start the game',
        type: 'error',
      });
      return;
    }

    setIsStarting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/matchmaking/rooms/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomCode }),
      });
      const data = await response.json();

      if (data.success) {
        addNotification({
          message: '✅ Game starting!',
          type: 'success',
        });

        // Redirect to gameplay based on user's role
        const userTeam = roomData.teams.find((team: Team) =>
          team.players.some((p: Player) => p.userId === user?._id)
        );
        if (userTeam) {
          const player = userTeam.players.find((p: Player) => p.userId === user?._id);
          if (player?.role === 'municipality') {
            window.location.href = '/dashboard/municipality';
          } else if (player?.role === 'mrf') {
            window.location.href = '/dashboard/mrf-collection';
          } else if (player?.role === 'broker') {
            window.location.href = '/dashboard/broker-inventory';
          }
        } else if (isAdmin) {
          // Admin returns to admin dashboard
          window.location.href = '/admin';
        }
      } else {
        addNotification({
          message: data.message || 'Failed to start game',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.message || 'Failed to start game',
        type: 'error',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/matchmaking/rooms/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomCode, sessionId: user?.currentSession }),
      });
      const data = await response.json();

      if (data.success) {
        addNotification({
          message: 'Left the room',
          type: 'info',
        });
        window.location.href = '/dashboard/matchmaking-lobby';
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
      message: 'Room code copied!',
      type: 'success',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#50704C]" />
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex items-center justify-center">
        <p className="text-[#5b3a1f] text-lg">Room not found</p>
      </div>
    );
  }

  const teamCount = roomData.teams?.length || 0;
  const canStart = teamCount >= 2 && isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#efe4d2] via-[#f8f1e6] to-[#e8dcc7] p-4 md:p-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div
          className="bg-cover bg-center rounded-[20px] overflow-hidden"
          style={{ backgroundImage: `url(${woodenBg.src})` }}
        >
          <CustomHeader
            backgroundImage={woodenHeading.src}
            title="Game Room"
            subtitle={`Room: ${roomCode} • ${teamCount}/30 teams`}
          />

          <div className="p-6 space-y-6">
            {/* Room Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#fff9ef] p-4 rounded-lg border border-[#d3c4ad]">
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-2xl text-[#33552C]">{roomCode}</span>
                <button
                  onClick={copyRoomCode}
                  className="text-[#8b7355] hover:text-[#33552C] transition-colors"
                >
                  <Copy size={18} />
                </button>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  roomData.isPrivate ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {roomData.isPrivate ? '🔒 Private' : '🌐 Public'}
                </span>
                {roomData.isAdminRoom && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                    👑 Admin Room
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6d4b2a]">
                  <Users size={16} className="inline mr-1" />
                  {teamCount}/{roomData.maxTeams || 30} teams
                </span>
                <button
                  onClick={handleLeaveRoom}
                  disabled={isLeaving}
                  className="flex items-center gap-2 px-4 py-2 border border-[#a94747] text-[#8d2626] rounded-lg hover:bg-[#fff0f0] transition-colors disabled:opacity-50"
                >
                  <LogOut size={16} />
                  {isLeaving ? 'Leaving...' : 'Leave Room'}
                </button>
              </div>
            </div>

            {/* City Slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Array.from({ length: roomData.maxTeams || 30 }, (_, index) => {
                const cityNumber = index + 1;
                const team = roomData.teams?.find(t => t.citySlot === cityNumber);
                const isOccupied = !!team;

                return (
                  <div
                    key={cityNumber}
                    className={`rounded-lg border-2 p-4 transition-all ${
                      isOccupied
                        ? 'border-[#50704C] bg-[#eef8e4]'
                        : 'border-dashed border-[#d3c4ad] bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-[#4f2d14]">
                        City {cityNumber}
                      </h4>
                      {isOccupied && (
                        <span className="text-xs text-[#50704C] font-semibold">
                          {team.players.filter(p => p.userId !== 'empty').length}/3
                        </span>
                      )}
                    </div>

                    {isOccupied ? (
                      <div className="space-y-2">
                        {team.players.map((player, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                              player.userId === 'empty' 
                                ? 'bg-gray-100 text-gray-400' 
                                : 'bg-white'
                            }`}
                          >
                            <span className={player.userId === 'empty' ? 'text-gray-400' : 'text-[#4f2d14]'}>
                              {player.name}
                              {player.isLeader && player.userId !== 'empty' && (
                                <Crown size={12} className="inline ml-1 text-yellow-500" />
                              )}
                            </span>
                            <span className={`text-xs capitalize ${player.userId === 'empty' ? 'text-gray-400' : 'text-[#8b7355]'}`}>
                              {player.role || (player.userId === 'empty' ? 'Empty' : 'Unassigned')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[104px] text-gray-400 text-sm">
                        Available
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ✅ Start Button - Only Admin can start */}
            <div className="flex justify-center pt-4 border-t border-[#d3c4ad]">
              {isAdmin ? (
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || isStarting}
                  className={`flex items-center gap-3 px-8 py-4 rounded-lg text-white font-bold text-lg transition-all ${
                    canStart && !isStarting
                      ? 'bg-[#50704C] hover:bg-[#3A7D2C] shadow-lg hover:shadow-xl'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Play size={24} />
                  {isStarting ? (
                    <>
                      <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                      Starting...
                    </>
                  ) : teamCount < 2 ? (
                    `Need ${2 - teamCount} more team(s) to start`
                  ) : (
                    `🎮 Start Game (${teamCount} teams)`
                  )}
                </button>
              ) : (
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 w-full">
                  <p className="text-blue-700 font-semibold">
                    ⏳ Waiting for Admin to start the game...
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    {teamCount} teams are ready to play!
                  </p>
                </div>
              )}
            </div>

            {/* Info Messages */}
            {teamCount < 2 && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">
                  Waiting for {2 - teamCount} more team(s) to join...
                </p>
                <p className="text-yellow-600 text-sm mt-1">
                  Share the room code with other teams to start the game
                </p>
              </div>
            )}

            {teamCount >= 2 && !isAdmin && (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700">
                  ⏳ Waiting for Admin to start the game...
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  {teamCount} teams are ready to play!
                </p>
              </div>
            )}

            {teamCount >= 2 && isAdmin && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-700">
                  ✅ {teamCount} teams are ready! Click "Start Game" to begin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}