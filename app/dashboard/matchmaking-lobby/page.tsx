'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { RefreshCw, Users, Lock, Unlock, Copy, Crown } from 'lucide-react';
import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { useWebSocket } from '@/hooks/useWebSocket';  // ✅ ADD THIS
import { lobbyService } from '@/services/lobbyService';

interface Room {
  roomCode: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  isPrivate: boolean;
  isAdminRoom: boolean;
  maxTeams: number;
  teams: Array<{
    teamId: string;
    citySlot: number;
    players: Array<{
      userId: string;
      name: string;
      role: string | null;
      isLeader: boolean;
    }>;
    isReady: boolean;
  }>;
  status: 'waiting' | 'ready' | 'started' | 'completed';
  gameSessionId?: string;
  createdAt: string;
}

export default function MatchmakingLobbyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { subscribe, isConnected } = useWebSocket();  // ✅ ADD THIS
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
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
    };
    checkAdmin();
  }, [API_URL]);

  // ✅ FIXED: Use lobbyService instead of fetch
  const checkIsTeamLeader = useCallback(async (): Promise<boolean> => {
    if (!user?.currentSession) {
      console.log('[isLeader] No current session');
      return false;
    }
    
    try {
      console.log('[isLeader] Checking lobby for session:', user.currentSession);
      const response = await lobbyService.getLobbyState(user.currentSession);
      console.log('[isLeader] Lobby response:', response);
      
      if (response.success && response.data?.lobbyState) {
        const lobby = response.data.lobbyState;
        console.log('[isLeader] Lobby leader:', lobby.leader);
        console.log('[isLeader] Current user ID:', user._id);
        const isLeaderResult = lobby.leader === user._id;
        console.log('[isLeader] Is leader?', isLeaderResult);
        return isLeaderResult;
      }
      console.log('[isLeader] No lobby state found');
      return false;
    } catch (error) {
      console.error('[isLeader] Failed to check team leader status:', error);
      return false;
    }
  }, [user?.currentSession, user?._id]);

  useEffect(() => {
    const checkLeader = async () => {
      if (user?._id) {
        const leader = await checkIsTeamLeader();
        setIsLeader(leader);
      }
    };
    checkLeader();
  }, [checkIsTeamLeader, user?._id]);

  const fetchRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/matchmaking/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('[MatchmakingLobby] Fetch rooms response:', data);
      
      if (data.success) {
        const availableRooms = (data.data?.rooms || []).filter(
          (room: Room) => room.status === 'waiting' || room.status === 'ready'
        );
        console.log('[MatchmakingLobby] Available rooms:', availableRooms);
        setRooms(availableRooms);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // ✅ WebSocket listener for room:joined - redirects ALL team members
  useEffect(() => {
    if (!isConnected) return;

    const unsubRoomJoined = subscribe('room:joined', (data: any) => {
      console.log('📢 [room:joined] Event received:', data);
      
      if (data?.roomCode && data?.redirect) {
        console.log('✅ [room:joined] Redirecting to:', data.redirect);
        addNotification({
          message: `✅ Team joined room ${data.roomCode}! Redirecting...`,
          type: 'success',
        });
        
        // ✅ Redirect ALL team members to the game room
        window.location.href = data.redirect;
      }
    });

    return () => {
      unsubRoomJoined && unsubRoomJoined();
    };
  }, [isConnected, subscribe, addNotification]);

  // Join room - ONLY team leader can do this
  const handleJoinRoom = async (roomCode: string) => {
    if (!user?.currentSession) {
      addNotification({
        message: 'Please complete role selection first',
        type: 'error',
      });
      router.push('/dashboard/role');
      return;
    }

    // Check if user is team leader
    const leader = await checkIsTeamLeader();
    if (!leader) {
      addNotification({
        message: 'Only the team leader can join a game room',
        type: 'error',
      });
      return;
    }

    setJoiningRoom(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      // ✅ Check if this team already has a room
      const checkResponse = await fetch(`${API_URL}/matchmaking/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const checkData = await checkResponse.json();
      
      if (checkData.success && checkData.data?.rooms) {
        const existingRoom = checkData.data.rooms.find((room: Room) =>
          room.teams?.some((t: any) => t.sessionId === user.currentSession)
        );
        
        if (existingRoom) {
          addNotification({
            message: `Your team is already in a game room. Redirecting...`,
            type: 'info',
          });
          window.location.href = `/dashboard/game-room/${existingRoom.roomCode}`;
          return;
        }
      }
      
      // ✅ Join the room
      const response = await fetch(`${API_URL}/matchmaking/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomCode,
          sessionId: user.currentSession,
          teamName: user.name,
        }),
      });
      const data = await response.json();

      if (data.success) {
        addNotification({
          message: `✅ Team joined room ${roomCode}! All team members will be redirected.`,
          type: 'success',
        });
        
        // The WebSocket event will redirect all team members
        window.location.href = `/dashboard/game-room/${roomCode}`;
      } else {
        if (data.message?.includes('already has an active game room')) {
          try {
            const refreshResponse = await fetch(`${API_URL}/matchmaking/rooms`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const refreshData = await refreshResponse.json();
            
            if (refreshData.success && refreshData.data?.rooms) {
              const existingRoom = refreshData.data.rooms.find((room: Room) =>
                room.teams?.some((t: any) => t.sessionId === user.currentSession)
              );
              if (existingRoom) {
                addNotification({
                  message: `Your team is already in a game room. Redirecting...`,
                  type: 'info',
                });
                window.location.href = `/dashboard/game-room/${existingRoom.roomCode}`;
                return;
              }
            }
          } catch (refreshError) {
            console.error('Failed to find existing room:', refreshError);
          }
        }
        
        addNotification({
          message: data.message || 'Failed to join game room',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.message || 'Failed to join game room',
        type: 'error',
      });
    } finally {
      setJoiningRoom(false);
    }
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addNotification({
      message: 'Room code copied!',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#efe4d2] via-[#f8f1e6] to-[#e8dcc7] p-4 md:p-8">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <div
          className="bg-cover bg-center rounded-[20px] overflow-hidden"
          style={{ backgroundImage: `url(${woodenBg.src})` }}
        >
          <CustomHeader
            backgroundImage={woodenHeading.src}
            title="Matchmaking Lobby"
            subtitle="Join a game room to find opponents"
          />

          <div className="p-6 space-y-6">
            {/* Header with info */}
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-[#50704C]" />
                <div>
                  <p className="text-sm text-[#6d4b2a]">
                    {isLeader ? '👑 You are the team leader' : 'Only the team leader can join a room'}
                  </p>
                  {!isLeader && (
                    <p className="text-xs text-[#8b7355]">Ask your team leader to select a room</p>
                  )}
                </div>
              </div>
              <button
                onClick={fetchRooms}
                className="flex items-center gap-2 px-4 py-2 border border-[#5b7f3b] rounded-lg text-[#2e4a1f] hover:bg-[#eef8e4] transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {/* Rooms Table */}
            <div>
              <h2 className="text-xl font-bold text-[#4f2d14] mb-4 flex items-center gap-2">
                <Users size={24} />
                Available Game Rooms ({rooms.length})
              </h2>

              {rooms.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-[#d3c4ad]">
                  <Users className="mx-auto h-12 w-12 text-[#8b7355] mb-3" />
                  <p className="text-[#6d4b2a] text-lg">No rooms available</p>
                  <p className="text-[#8b7355] text-sm mt-1">Wait for an admin to create a game room</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-[#7a5f41]">
                        <th className="px-4 py-2">Room Code</th>
                        <th className="px-4 py-2">Room Name</th>
                        <th className="px-4 py-2">Created By</th>
                        <th className="px-4 py-2">Teams</th>
                        <th className="px-4 py-2">Visibility</th>
                        <th className="px-4 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => {
                        const teamCount = room.teams?.length || 0;
                        const isFull = teamCount >= (room.maxTeams || 30);

                        return (
                          <tr
                            key={room.roomCode}
                            className="bg-white rounded-lg shadow-[0_1px_6px_rgba(52,37,12,0.08)] hover:shadow-md transition-shadow"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#33552C] text-lg">
                                  {room.roomCode}
                                </span>
                                <button
                                  onClick={() => copyRoomCode(room.roomCode)}
                                  className="text-[#8b7355] hover:text-[#33552C] transition-colors"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#4f2d14]">
                              {room.roomName}
                              {room.isAdminRoom && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                  Admin
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#4f2d14]">
                              {room.ownerName}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold text-[#33552C]">
                                {teamCount}/{room.maxTeams || 30}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {room.isPrivate ? (
                                  <>
                                    <Lock size={14} className="text-[#8d2626]" />
                                    <span className="text-sm text-[#8d2626]">Private</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock size={14} className="text-[#33552C]" />
                                    <span className="text-sm text-[#33552C]">Public</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isFull ? (
                                <span className="text-sm text-gray-500">Full</span>
                              ) : isLeader ? (
                                <button
                                  onClick={() => handleJoinRoom(room.roomCode)}
                                  disabled={joiningRoom}
                                  className="px-4 py-2 bg-[#50704C] text-white rounded-md hover:bg-[#3A7D2C] transition-colors text-sm font-semibold disabled:opacity-50"
                                >
                                  {joiningRoom ? 'Joining...' : 'Join Room'}
                                </button>
                              ) : (
                                <span className="text-sm text-[#8b7355] flex items-center gap-1">
                                  <Crown size={14} className="inline" />
                                  Leader only
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Admin Info Section */}
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-700 text-sm">
                📋 Game rooms are created by admins. 
                {isLeader ? ' As the team leader, select a room to join.' : ' Ask your team leader to join a room.'}
              </p>
              {isAdmin && (
                <p className="text-blue-600 text-xs mt-1">
                  👑 You are an admin. Go to the Admin Dashboard to create game rooms.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}