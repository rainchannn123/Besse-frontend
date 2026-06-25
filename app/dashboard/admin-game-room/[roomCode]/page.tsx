'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/notificationStore';
import { Copy, Users, Crown, Play, ArrowLeft, BarChart3 } from 'lucide-react';
import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';

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

export default function AdminGameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;
  const { addNotification } = useNotificationStore();

  const [roomData, setRoomData] = useState<GameRoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [teamCount, setTeamCount] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const getAdminToken = (): string | null => {
    return localStorage.getItem('admin_monitor_token') || localStorage.getItem('auth_token');
  };

  // ✅ Check if admin token exists
  const hasAdminToken = (): boolean => {
    const token = getAdminToken();
    console.log('[AdminGameRoom] Checking token:', token ? 'Found' : 'Not found');
    return !!token;
  };

  const fetchRoomData = useCallback(async () => {
    try {
      const token = getAdminToken();
      
      if (!token) {
        console.log('[AdminGameRoom] No token, redirecting to login');
        router.push('/auth/login');
        return;
      }
      
      console.log('[AdminGameRoom] Fetching room:', roomCode);
      const response = await fetch(`${API_URL}/matchmaking/rooms/${roomCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('[AdminGameRoom] Response status:', response.status);
      console.log('[AdminGameRoom] Response data:', data);
      
            if (data.success) {
        const fetchedRoom = data.data.room as GameRoomData;

        if (fetchedRoom.status === 'started') {
          router.replace(`/dashboard/admin-game-room/${roomCode}/live`);
          return;
        }

        setRoomData(fetchedRoom);
        setTeamCount(fetchedRoom.teams?.length || 0);
      } else {
        if (response.status === 401 || response.status === 403) {
          console.log('[AdminGameRoom] Unauthorized, redirecting to login');
          router.push('/auth/login');
          return;
        }
        
        addNotification({
          message: data.message || 'Room not found',
          type: 'error',
        });
        router.push('/admin');
      }
    } catch (error) {
      console.error('Failed to fetch room data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, API_URL, router, addNotification]);

  // ✅ Check token on mount - NO REDIRECT if token exists
  useEffect(() => {
    console.log('[AdminGameRoom] Page mounted, roomCode:', roomCode);
    
    // Check if token exists
    const tokenExists = hasAdminToken();
    console.log('[AdminGameRoom] Token exists:', tokenExists);
    
    if (!tokenExists) {
      console.log('[AdminGameRoom] No token, redirecting to login');
      router.push('/auth/login');
      return;
    }
    
    // Token exists, fetch room data
    console.log('[AdminGameRoom] Token exists, fetching room data');
    fetchRoomData();
    
    const interval = setInterval(() => {
      if (hasAdminToken()) {
        fetchRoomData();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchRoomData, router]);

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

    const confirmStart = confirm(
      `Start game for ${currentTeamCount} teams in room ${roomCode}?`
    );

    if (!confirmStart) return;

    setIsStarting(true);
    try {
      const token = getAdminToken();
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
          message: `Game started for ${currentTeamCount} teams. Redirecting to live monitor...`,
          type: 'success',
        });
        router.replace(`/dashboard/admin-game-room/${roomCode}/live`);
      } else {
        addNotification({
          message: data.message || 'Failed to start game',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Start game error:', error);
      addNotification({
        message: error.message || 'Failed to start game',
        type: 'error',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleGoBack = () => {
    if (confirm('Are you sure you want to leave this room?')) {
      router.push('/admin');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#50704C]"></div>
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

  const isRoomStarted = roomData.status === 'started';
  const canStart = teamCount >= 2 && !isRoomStarted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#efe4d2] via-[#f8f1e6] to-[#e8dcc7] p-4 md:p-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div
          className="bg-cover bg-center rounded-[20px] overflow-hidden"
          style={{ backgroundImage: `url(${woodenBg.src})` }}
        >
          <CustomHeader
            backgroundImage={woodenHeading.src}
            title="Admin Game Room"
            subtitle={`Room: ${roomCode} • ${teamCount}/30 teams joined`}
          />

          <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#fff9ef] p-4 rounded-lg border border-[#d3c4ad]">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-[#6d4b2a] hover:text-[#33552C] transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm font-medium">Back to Dashboard</span>
                </button>
                <span className="font-mono font-bold text-2xl text-[#33552C]">{roomCode}</span>
                <button
                  onClick={copyRoomCode}
                  className="text-[#8b7355] hover:text-[#33552C] transition-colors"
                >
                  <Copy size={18} />
                </button>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                  👑 Admin Room
                </span>
              </div>
                            <div className="flex items-center gap-3">
                <span className="text-sm text-[#6d4b2a]">
                  <Users size={16} className="inline mr-1" />
                  {teamCount}/{roomData.maxTeams || 30} teams
                </span>
                {isRoomStarted && (
                  <button
                    onClick={() => router.push(`/dashboard/admin-game-room/${roomCode}/live`)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#50704C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3A7D2C]"
                  >
                    <BarChart3 size={14} />
                    Open Live Monitor
                  </button>
                )}
              </div>
            </div>

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

            <div className="flex justify-center pt-4 border-t border-[#d3c4ad]">
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
                  `Start Game (${teamCount} teams)`
                )}
              </button>
            </div>

            {teamCount < 2 && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">
                  Waiting for {2 - teamCount} more team(s) to join...
                </p>
              </div>
            )}

                        {teamCount >= 2 && !isRoomStarted && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-700">
                  {teamCount} teams have joined. Click Start Game to begin.
                </p>
              </div>
            )}

            {isRoomStarted && (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700 font-medium">
                  This room is already in progress.
                </p>
                <button
                  onClick={() => router.push(`/dashboard/admin-game-room/${roomCode}/live`)}
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#50704C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3A7D2C]"
                >
                  <BarChart3 size={16} />
                  Go to Live Monitor
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}