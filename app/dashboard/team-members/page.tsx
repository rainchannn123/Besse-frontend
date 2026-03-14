'use client';

import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import { useGameWebSocket } from '@/hooks/useWebSocket';
import sideArrow from '@/public/assets/images/sideArrow.png';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { authService } from '@/services/authService';
import { lobbyService } from '@/services/lobbyService';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Member = {
  id: string | number;
  name?: string;
  role?: string;
  placeholder?: boolean;
};

export default function TeamMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [active, setActive] = useState<string | number | null>(0);
  const [lobbyCode, setLobbyCode] = useState<string>('');
  const [leader, setLeader] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number>(3);
  const [subtitle, setSubtitle] = useState<string>('3 Players is needed to start playing the game');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { user } = useAuthStore();
  const router = useRouter();

  // Use WebSocket for real-time updates - joinGame is called automatically by useGameWebSocket
  const { isConnected, subscribe, joinGame } = useGameWebSocket(user?.currentSession || undefined);

  const getLobbyState = async () => {
    setLoading(true);
    if (isRefreshing) return; // Prevent multiple simultaneous calls
    setIsRefreshing(true);

    const profileResponse = await authService.getProfile();
    if (!profileResponse.success || !profileResponse.data) {
      throw new Error('Failed to get profile');
    }
    const userData = profileResponse.data.user;
    if (!userData?.currentSession) {
      setError('No active session found');
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setError('');
      if (!userData.currentSession) {
        throw new Error('No active session');
      }
      let response = await lobbyService.getLobbyState(userData.currentSession);
      console.log('Lobby State Response:', response);
      if (
        response.data?.lobbyState.status === 'ready' ||
        response.data?.lobbyState.status === 'waiting' ||
        response.data?.lobbyState.status === 'completed'
      ) {
        const lobbyState = response.data.lobbyState;
        setLeader(lobbyState.leader);
        setLobbyCode(lobbyState.lobbyCode);
        setMaxPlayers(lobbyState.maxPlayers);
        setSubtitle(`${lobbyState.maxPlayers} Players are needed to start playing the game`);

        const mappedMembers: Member[] = lobbyState.players.map((player, index) => ({
          id: player.userId,
          name: player.name,
          role: player.userId === lobbyState.leader ? 'Group Leader' : 'Team Member',
        }));

        while (mappedMembers.length < lobbyState.maxPlayers) {
          mappedMembers.push({ id: mappedMembers.length, placeholder: true });
        }

        setMembers(mappedMembers);
      } else {
        setError('Lobby not in valid state');
      }
    } catch (err: any) {
      console.error('Error fetching lobby state:', err);
      setError(err.response?.data?.message || 'Failed to load lobby state');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    getLobbyState();
  }, [user?.currentSession]);

  // Ensure we're connected to the game room to receive game-started events
  useEffect(() => {
    if (user?.currentSession && isConnected) {
      console.log('Team Members page: Joining game room with sessionId:', user.currentSession);
      joinGame(user.currentSession);
    }
  }, [user?.currentSession, isConnected, joinGame]);

  // Removed polling to reduce auto refreshes, relying on WebSocket updates
  // Helper function to extract players from the game state
  const extractPlayers = (data: any): Array<{ userId: string; selectedRole: string }> => {
    const players: Array<{ userId: string; selectedRole: string }> = [];

    // First try to get playerRoles mapping
    if (data?.playerRoles && typeof data.playerRoles === 'object') {
      // Convert the role-to-userId mapping to player objects
      Object.entries(data.playerRoles).forEach(([role, userId]) => {
        players.push({
          userId: userId as string,
          selectedRole: role,
        });
      });
    }

    // Also check for gameState.players (same structure)
    if (data?.gameState?.players && typeof data.gameState.players === 'object') {
      Object.entries(data.gameState.players).forEach(([role, userId]) => {
        // Only add if not already added from playerRoles
        if (!players.find((p) => p.userId === userId)) {
          players.push({
            userId: userId as string,
            selectedRole: role,
          });
        }
      });
    }

    return players;
  };
  // Listen for WebSocket events that might indicate lobby changes
  useEffect(() => {
    if (!user?.currentSession) return;

    const unsubscribeSystemMessage = subscribe('system-message', () => {
      getLobbyState();
    });

    const unsubscribePlayerAction = subscribe('player-action', () => {
      getLobbyState();
    });

    const unSubcribeGameStarted = subscribe('game-started', (data: any) => {
      console.log('Game started event received in role page:', data);
      if (data?.sessionId === user?.currentSession) {
        const players = extractPlayers(data);
        const currentPlayer = players.find((player: any) => player.userId === user._id);

        if (currentPlayer) {
          if (currentPlayer.selectedRole === 'broker') {
            router.push('/dashboard/broker-inventory');
          } else if (currentPlayer.selectedRole === 'mrf') {
            router.push('/dashboard/mrf-collection');
          } else if (currentPlayer.selectedRole === 'municipality') {
            router.push('/dashboard/municipality');
          }
        }
      }
    });

    const unsubLobbyActivated = subscribe('lobby-activated', (data: any) => {
      console.log('Lobby activated event received: in role page', data);

      if (data?.lobby?.status === 'active') {
        // For lobby-activated event, the structure might be different
        let players: Array<{ userId: string; selectedRole: string }> = [];

        if (Array.isArray(data?.lobby?.players)) {
          // If players is an array with full player objects
          players = data.lobby.players.map((player: any) => ({
            userId: player.userId || player._id,
            selectedRole: player.selectedRole,
          }));
        } else if (data?.lobby?.players && typeof data.lobby.players === 'object') {
          // If it's a role-to-userId mapping
          Object.entries(data.lobby.players).forEach(([role, userId]) => {
            players.push({
              userId: userId as string,
              selectedRole: role,
            });
          });
        }

        const currentPlayer = players.find((player: any) => player.userId === user._id);

        if (currentPlayer) {
          if (currentPlayer.selectedRole === 'broker') {
            router.push('/dashboard/broker-inventory');
          } else if (currentPlayer.selectedRole === 'mrf') {
            router.push('/dashboard/mrf-collection');
          } else if (currentPlayer.selectedRole === 'municipality') {
            router.push('/dashboard/municipality');
          }
        }
      }
    });

    return () => {
      unsubscribePlayerAction && unsubscribePlayerAction();
      unsubLobbyActivated && unsubLobbyActivated();
      unSubcribeGameStarted && unSubcribeGameStarted();
      unsubscribeSystemMessage && unsubscribeSystemMessage();
    };
  }, [user?.currentSession, subscribe]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bgColor p-6">
        <div className="text-center">
          <div className="spinner border-4 border-gray-200 border-t-blue-600 rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bgColor p-6">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="xl:pt-16 lg:pt-12 md:pt-0 flex justify-center items-center">
      <div
        className="bg-cover bg-center rounded-[20px] container mx-auto flex flex-col"
        style={{
          backgroundImage: `url(${woodenBg.src})`,
        }}
      >
        <CustomHeader
          backgroundImage={woodenHeading.src}
          title="Team Member"
          subtitle={subtitle}
          lobbyCode={lobbyCode}
        />
        <div className="flex-1 space-y-2 bg-center flex flex-col justify-between">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 md:px-8 px-4 pt-6 w-full flex-1">
            {members.map((m) => {
              const isActive = active === m.id;

              return (
                <button
                  key={m.id}
                  // onClick={() => setActive(m.id)}
                  className={
                    `relative w-full text-left p-6 transform transition-all duration-150 focus:outline-none ` +
                    (isActive
                      ? 'bg-[#5C9850] text-white font-roboto translate-y-0'
                      : 'bg-white text-[#33552C] hover:-translate-y-0.5')
                  }
                  style={{ boxShadow: '0 6px 4px #00000040' }}
                >
                  {m.placeholder ? (
                    <div className="lg:h-[200px] md:h-[120px] h-20 flex justify-center items-center">
                      <p className="md:text-[24px] sm:text-[18px] text-[14px] font-style: italic">
                        Waiting for member
                      </p>
                    </div>
                  ) : (
                    <div className="lg:h-[200px] md:h-[120px] h-20 flex justify-center items-center">
                      <div className="text-center">
                        <h3 className="font-bold md:text-[40px] sm:text-[28px] text-[20px]">
                          {m.name}
                        </h3>
                        <p className="font-medium md:text-[24px] sm:text-[18px] text-[14px]">
                          {m.role}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="my-3">
            <div className="flex justify-center pb-3">
              <button
                onClick={() => {
                  router.push('/dashboard/role');
                }}
                className={`flex justify-center items-center gap-10 px-3 py-2 rounded-[5px] bg-[#E1E1E1] cursor-pointer`}
                style={{ boxShadow: '0 3px 7px rgba(0, 0, 0, 0.4)' }}
              >
                <p className="text-[#6D924B] font-bold md:text-[27px] text-[24px] font-roboto">
                  Continue
                </p>
                <div className="bg-[#C0D066] w-[38px] h-[38px] flex justify-center items-center rounded-[50%]">
                  <Image src={sideArrow} alt="sideArrow" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
