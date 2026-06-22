'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, RefreshCw, Users, Loader2 } from 'lucide-react';
import AvailableRoomsTable from '@/components/ui/pairing/AvailableRoomsTable';
import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';

interface WaitingRoom {
  roomCode: string;
  createdAt: string;
  teams: {
    teamName: string;
    players: { name: string; userId: string; role: string | null }[];
    sessionId: string;
  }[];
  status: string;
}

export default function PairingDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [availableRooms, setAvailableRooms] = useState<WaitingRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Check if this team already has a waiting room
  useEffect(() => {
    const checkExistingRoom = async () => {
      if (!user?.currentSession) {
        setCheckingExisting(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/waiting-rooms/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        
        if (data.success && data.data?.rooms) {
          // Check if any room has this team's session
          const existingRoom = data.data.rooms.find((room: any) =>
            room.teams?.some((t: any) => t.sessionId === user.currentSession)
          );
          if (existingRoom) {
            console.log('✅ Found existing room, redirecting:', existingRoom.roomCode);
            window.location.href = `/dashboard/waiting-room/${existingRoom.roomCode}`;
            return;
          }
        }
      } catch (error) {
        console.error('Error checking existing room:', error);
      } finally {
        setCheckingExisting(false);
      }
    };
    
    checkExistingRoom();
  }, [user?.currentSession, API_URL]);

  const fetchAvailableRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/waiting-rooms/available`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAvailableRooms(data.data?.rooms || []);
      }
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAvailableRooms();
    const interval = setInterval(fetchAvailableRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchAvailableRooms]);

  const handleCreateRoom = async () => {
    if (!user?.currentSession) {
      addNotification({
        message: 'Please complete role selection first',
        type: 'error',
      });
      router.push('/dashboard/role');
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/waiting-rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: user.currentSession,
          teamName: user.name,
        }),
      });
      const data = await response.json();

      if (data.success) {
        addNotification({
          message: `Waiting room created! Code: ${data.data.waitingRoom.roomCode}`,
          type: 'success',
        });
        window.location.href = `/dashboard/waiting-room/${data.data.waitingRoom.roomCode}`;
      } else {
        addNotification({
          message: data.message || 'Failed to create waiting room',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.message || 'Failed to create waiting room',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ✅ UPDATED: Handle join room with auto-redirect
  const handleJoinRoom = async (roomCode: string) => {
    if (!user?.currentSession) {
      addNotification({
        message: 'Please complete role selection first',
        type: 'error',
      });
      router.push('/dashboard/role');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      
      // ✅ First, check if this team already has a waiting room
      const checkResponse = await fetch(`${API_URL}/waiting-rooms/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const checkData = await checkResponse.json();
      
      if (checkData.success && checkData.data?.rooms) {
        // Check if this team already has a room
        const existingRoom = checkData.data.rooms.find((room: any) =>
          room.teams?.some((t: any) => t.sessionId === user.currentSession)
        );
        
        if (existingRoom) {
          // ✅ Auto-redirect to existing room
          addNotification({
            message: `You are already in a waiting room. Redirecting...`,
            type: 'info',
          });
          window.location.href = `/dashboard/waiting-room/${existingRoom.roomCode}`;
          return;
        }
      }
      
      // ✅ If no existing room, proceed to join
      const response = await fetch(`${API_URL}/waiting-rooms/join`, {
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
          message: `Joined room ${roomCode}!`,
          type: 'success',
        });
        window.location.href = `/dashboard/waiting-room/${roomCode}`;
      } else {
        // ✅ If the error is "already has active waiting room", redirect to that room
        if (data.message?.includes('already has an active waiting room')) {
          // Try to find the existing room and redirect
          try {
            const refreshResponse = await fetch(`${API_URL}/waiting-rooms/available`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const refreshData = await refreshResponse.json();
            
            if (refreshData.success && refreshData.data?.rooms) {
              const existingRoom = refreshData.data.rooms.find((room: any) =>
                room.teams?.some((t: any) => t.sessionId === user.currentSession)
              );
              if (existingRoom) {
                addNotification({
                  message: `You are already in a waiting room. Redirecting...`,
                  type: 'info',
                });
                window.location.href = `/dashboard/waiting-room/${existingRoom.roomCode}`;
                return;
              }
            }
          } catch (refreshError) {
            console.error('Failed to find existing room:', refreshError);
          }
        }
        
        addNotification({
          message: data.message || 'Failed to join waiting room',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.message || 'Failed to join waiting room',
        type: 'error',
      });
    }
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#50704C]" />
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
            title="Game Lobby"
            subtitle="Create or join a waiting room to find your opponent"
          />

          <div className="p-6 space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="flex items-center gap-2 px-6 py-3 bg-[#50704C] text-white rounded-lg hover:bg-[#3A7D2C] transition-colors font-semibold disabled:opacity-50"
              >
                <Plus size={20} />
                {isCreating ? 'Creating...' : 'Create New Room'}
              </button>

              <button
                onClick={fetchAvailableRooms}
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
                Available Waiting Rooms
              </h2>
                            <AvailableRoomsTable
                rooms={availableRooms}
                onJoinRoom={handleJoinRoom}
                isLoading={isLoading}
                isLeader={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}