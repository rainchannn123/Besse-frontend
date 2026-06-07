'use client';

import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import GameModeBadge from '@/components/ui/GameModeBadge';
import { useWebSocket } from '@/hooks/useWebSocket';
import factory from '@/public/assets/images/Factory.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { authService } from '@/services/authService';
import { lobbyService } from '@/services/lobbyService';
import { useAuthStore } from '@/stores/authStore';
import { PlayerRole } from '@/types/besse';
import { getLobbyRoute } from '@/utils/lobbyStage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function RolePage() {
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [openDetailId, setOpenDetailId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [lobbyState, setLobbyState] = useState<any>(null);
  const [leader, setLeader] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);

  const { user, updateUser } = useAuthStore();
  const { subscribe, isConnected, joinGame, leaveGame } = useWebSocket();
  const router = useRouter();
  const isFetchingLobbyRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyLobbyState = useCallback((nextLobbyState: any, currentUserId?: string) => {
    setLobbyState(nextLobbyState);
    setLeader(nextLobbyState.leader);
    setError('');

    const roleToId: Record<string, number> = {
      municipality: 1,
      mrf: 2,
      broker: 3,
    };

    const currentPlayer = nextLobbyState.players.find(
      (player: any) => player.userId === currentUserId
    );

    if (currentPlayer?.selectedRole && roleToId[currentPlayer.selectedRole]) {
      setSelectedRole(roleToId[currentPlayer.selectedRole]);
    } else {
      setSelectedRole(null);
    }
  }, []);

  const clearLobbyClientState = useCallback(
    (nextUser?: typeof user) => {
      if (user?.currentSession) {
        leaveGame(user.currentSession);
      }

      localStorage.removeItem('pairing_session_id');
      localStorage.removeItem('current_game_session');
      localStorage.removeItem('init_state');

      if (nextUser) {
        updateUser(nextUser);
      } else if (user) {
        updateUser({
          ...user,
          currentSession: null,
        });
      }
    },
    [leaveGame, updateUser, user]
  );

  const getRolesWithPlayerNames = () => {
    const baseRoles = [
      {
        id: 1,
        title: 'Municipality',
        role: 'municipality' as PlayerRole,
        name: '',
        description: [
          "Collect the city's waste and manage transportation",
          "Develop the city's waste management strategy",
          "Lead the city's development"
        ],
      },
      {
        id: 2,
        title: 'MRF',
        role: 'mrf' as PlayerRole,
        name: '',
        description: [
          "Responsible for Waste Processing",
          "Bridge communication and connection between Municipality and Broker",
          "Manage the sales of recyclable materials"
        ],
      },
      {
        id: 3,
        title: 'Broker',
        role: 'broker' as PlayerRole,
        name: '',
        description: [
          "Responsible for useful material procurement",
          "Develop the business strategy to maximize profit, while balancing the city's emissions and health",
          "Important role for negotiation and deal-making with Municipality and MRF, as well as the competitors"
        ],
      },
    ];

    if (!lobbyState?.players) return baseRoles;

    return baseRoles.map((role) => {
      const player = lobbyState.players.find((p: any) => p.selectedRole === role.role);
      return {
        ...role,
        name: player ? player.name : role.name,
      };
    });
  };

  const fetchLobbyState = useCallback(async (showLoader = false) => {
    if (isFetchingLobbyRef.current) return;
    isFetchingLobbyRef.current = true;

    if (showLoader) {
      setLoading(true);
    }

    try {
      const profileResponse = await authService.getProfile();
      if (!profileResponse.success || !profileResponse.data) {
        throw new Error('Failed to get profile');
      }

      const userData = profileResponse.data.user;
      setUserInfo(userData);
      updateUser(userData);

      if (!userData?.currentSession) {
        clearLobbyClientState(userData);
        router.replace('/dashboard/besse-group');
        return;
      }

      const response = await lobbyService.getLobbyState(userData.currentSession);
      if (response.data?.lobbyState) {
        const nextLobbyState = response.data.lobbyState;
        const currentPlayer = nextLobbyState.players.find(
          (player: any) => player.userId === userData._id
        );

        if (!currentPlayer) {
          clearLobbyClientState({
            ...userData,
            currentSession: null,
          });
          router.replace('/dashboard/besse-group');
          return;
        }

        const nextRoute = getLobbyRoute(nextLobbyState, userData._id);
        if (nextRoute !== '/dashboard/role') {
          router.replace(nextRoute);
          return;
        }

        applyLobbyState(nextLobbyState, userData._id);
      }
    } catch (err: any) {
      console.error('Failed to fetch lobby state:', err);
      setError(err.response?.data?.message || 'Failed to load lobby state');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      isFetchingLobbyRef.current = false;
    }
  }, [applyLobbyState, clearLobbyClientState, router, updateUser]);

  const scheduleLobbyRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      void fetchLobbyState(false);
    }, 200);
  }, [fetchLobbyState]);

  useEffect(() => {
    void fetchLobbyState(true);
  }, [fetchLobbyState, user?.currentSession]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

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

  // Subscribe to lobby state updates via WebSocket
  useEffect(() => {
    if (!userInfo?.currentSession) return;

    const isCurrentSessionEvent = (data: any) => {
      const payloadSessionId = data?.sessionId || data?.lobby?.sessionId;
      return !payloadSessionId || payloadSessionId === userInfo.currentSession;
    };

    const unsubscribe = subscribe('lobby-state-update', (data: any) => {
      if (isCurrentSessionEvent(data)) {
        scheduleLobbyRefresh();
      }
    });

    const unsubscribeSystemMessage = subscribe('system-message', () => {
      scheduleLobbyRefresh();
    });

    const unsubscribePlayerAction = subscribe('player-action', () => {
      scheduleLobbyRefresh();
    });

    const unsubscribeRoleSelected = subscribe('role-selected', () => {
      scheduleLobbyRefresh();
    });

    const unsubscribeRoleDeselected = subscribe('role-deselected', () => {
      scheduleLobbyRefresh();
    });

    const unsubscribePlayerJoined = subscribe('player-joined', () => {
      scheduleLobbyRefresh();
    });

    const unsubscribePlayerLeft = subscribe('player-left', () => {
      scheduleLobbyRefresh();
    });

    const unsubscribePlayerLeftOptimistic = subscribe('player-left', (data: any) => {
      if (!isCurrentSessionEvent(data)) {
        return;
      }

      const leftUserId = data?.userId || data?.playerId || data?.leftUserId || data?.player?._id;

      if (data?.lobbyState) {
        applyLobbyState(data.lobbyState, userInfo._id);
      } else if (leftUserId) {
        setLobbyState((prevState: any) => {
          if (!prevState?.players) {
            return prevState;
          }

          return {
            ...prevState,
            leader: data?.leader || prevState.leader,
            status: data?.status || prevState.status,
            players: prevState.players.filter(
              (player: any) => String(player.userId) !== String(leftUserId)
            ),
          };
        });
      }

      if (String(leftUserId) === String(userInfo._id)) {
        clearLobbyClientState({
          ...userInfo,
          currentSession: null,
        });
        router.replace('/dashboard/besse-group');
        return;
      }

      scheduleLobbyRefresh();
    });

    const unSubcribeGameStarted = subscribe('game-started', (data: any) => {
      // console.log('Game started event received in role page:', data);
      if (data?.sessionId === userInfo?.currentSession) {
        const players = extractPlayers(data);
        const currentPlayer = players.find((player: any) => player.userId === userInfo._id);

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
      // console.log('Lobby activated event received: in role page', data);
      scheduleLobbyRefresh();

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

        const currentPlayer = players.find((player: any) => player.userId === userInfo._id);

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
      unsubscribe && unsubscribe();
      unsubscribeSystemMessage && unsubscribeSystemMessage();
      unsubscribePlayerAction && unsubscribePlayerAction();
      unsubscribeRoleSelected && unsubscribeRoleSelected();
      unsubscribeRoleDeselected && unsubscribeRoleDeselected();
      unsubscribePlayerJoined && unsubscribePlayerJoined();
      unsubscribePlayerLeft && unsubscribePlayerLeft();
      unsubscribePlayerLeftOptimistic && unsubscribePlayerLeftOptimistic();
      unsubLobbyActivated && unsubLobbyActivated();
      unSubcribeGameStarted && unSubcribeGameStarted();
    };
  }, [applyLobbyState, clearLobbyClientState, router, scheduleLobbyRefresh, subscribe, userInfo]);

  // Ensure we're connected to the game room to receive game-started events
  useEffect(() => {
    if (userInfo?.currentSession && isConnected) {
      // console.log('Role page: Joining game room with sessionId:', userInfo.currentSession);
      joinGame(userInfo.currentSession);
    }
  }, [userInfo?.currentSession, isConnected, joinGame]);

  const toggleDetail = (id: number) => {
    setOpenDetailId((prev) => (prev === id ? null : id));
  };

  const handleRoleSelection = async (sRole: number) => {
    if (!sRole || !userInfo?.currentSession) {
      setError('No role selected or session not found');
      return;
    }
    const roles = getRolesWithPlayerNames();
    const selectedRoleData = roles.find((role) => role.id === sRole);
    if (!selectedRoleData) {
      setError('Invalid role selection');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if this role is already selected by the current user
      const currentPlayer = lobbyState?.players.find(
        (player: any) => player.userId === userInfo?._id
      );
      const isAlreadySelected = currentPlayer?.selectedRole === selectedRoleData.role;

      if (isAlreadySelected) {
        // Deselect the role
        await lobbyService.deSelectRole({
          sessionId: userInfo.currentSession,
          role: selectedRoleData.role,
        });
        setSelectedRole(null);
      } else {
        // Select the role
        await lobbyService.selectRole({
          sessionId: userInfo.currentSession,
          role: selectedRoleData.role,
        });
        setSelectedRole(sRole);
      }

      // Refresh lobby state after role change
      await fetchLobbyState(false);
    } catch (err: any) {
      console.error('Role selection error:', err);
      setError(err.response?.data?.message || 'Failed to select role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (lobbyState?.status !== 'ready') {
      setError("All players didn't select the roles yet. Lobby is not ready.");
      return;
    }

    if (userInfo?._id !== leader) {
      setError('Only the lobby leader can continue to the next step.');
      return;
    }

    if (!userInfo?.currentSession) {
      setError('Session not found. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await lobbyService.continueToPairing({
        sessionId: userInfo.currentSession,
      });

      localStorage.setItem('pairing_session_id', userInfo.currentSession);
      router.push(`/dashboard/pairing?sessionId=${userInfo.currentSession}`);
    } catch (err: any) {
      console.error('Continue to pairing error:', err);
      setError(err.response?.data?.message || 'Failed to continue to pairing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveLobby = useCallback(async () => {
    if (!userInfo?.currentSession || isLeaving) {
      return;
    }

    setIsLeaving(true);
    setError('');

    try {
      await lobbyService.leaveLobby({ sessionId: userInfo.currentSession });
      clearLobbyClientState({
        ...(userInfo || user),
        currentSession: null,
      });

      const profileResponse = await authService.getProfile();
      if (profileResponse.success && profileResponse.data?.user) {
        updateUser(profileResponse.data.user);
      }

      router.push('/dashboard/besse-group');
    } catch (err: any) {
      console.error('Leave lobby error:', err);
      setError(err.response?.data?.message || 'Failed to leave lobby');
    } finally {
      setIsLeaving(false);
    }
  }, [clearLobbyClientState, isLeaving, router, updateUser, user, userInfo]);

  // Allow leader to continue when all roles are selected (lobby is ready)
  const canContinue = Boolean(
    selectedRole && lobbyState?.status === 'ready' && userInfo?._id === leader
  );

  return (
    <div className="h-full flex items-center justify-center bgColor p-6">
      <div
        className="bg-cover bg-center container mx-auto rounded-[20px] relative w-full"
        style={{
          backgroundImage: `url(${woodenBg.src})`,
        }}
      >
        <CustomHeader
          backgroundImage={woodenHeading.src}
          title="Select Role"
          subtitle="Select a role to start playing the game"
        />
        <GameModeBadge gameMode={lobbyState?.gameMode} />

        <div className="md:px-8 px-4 pt-16 pb-6">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 lg:gap-6 gap-18 sm:gap-12">
            {getRolesWithPlayerNames().map((role) => (
              <div
                key={role.id}
                className={`relative flex flex-col items-center cursor-pointer min-h-[400px] sm:min-h-[450px] transition-all duration-300 ${
                  selectedRole === role.id ? 'bg-[#5C9850]' : 'bg-white'
                }`}
                style={{ boxShadow: '0 5px 8px rgba(0, 0, 0, 0.4)' }}
              >
                {/* Decorative top element */}
                <div className="absolute top-[-45px] w-10 h-[90px] bg-[#A77F46B2] z-10"></div>

                {/* Main Content */}
                <div
                  className={`flex flex-col items-center w-full  ${
                    openDetailId === role.id
                      ? 'opacity-0 max-h-0 overflow-hidden'
                      : 'opacity-100 max-h-[500px]'
                  }`}
                  onClick={() => {
                    setSelectedRole(role.id);
                    handleRoleSelection(role.id);
                  }}
                >
                  <div className="mt-14 flex justify-center w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto  xl:px-0  px-4">
                    <Image src={factory} alt="factory" className=" h-auto object-cover" priority />
                  </div>

                  <h2
                    className={`font-bold lg:text-[40px] md:text-[30px] text-[24px] font-roboto mt-4 text-center ${
                      selectedRole === role.id ? 'text-white' : 'text-[#33552C]'
                    }`}
                  >
                    {role.title}
                  </h2>

                  <p
                    className={`font-medium text-[24px] font-roboto ${
                      selectedRole === role.id ? 'text-white' : 'text-[#33552C]'
                    }`}
                  >
                    {role.name}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDetail(role.id);
                    }}
                    className={`px-6 py-2 text-[18px] sm:text-[20px] font-roboto mt-5 mb-6  ${
                      selectedRole === role.id
                        ? 'bg-white text-[#563212] hover:bg-gray-100'
                        : 'bg-[#5C9850] text-white hover:bg-[#4a7a3f]'
                    }`}
                  >
                    Role Detail
                  </button>
                </div>

                {/* Detail Content */}
                <div
                  className={`w-full h-full  ${
                    openDetailId === role.id
                      ? 'opacity-100 visible'
                      : 'opacity-0 invisible absolute'
                  }`}
                >
                  <div
                    className={`h-full w-full flex flex-col justify-between p-4 sm:p-6 ${
                      selectedRole === role.id ? 'bg-[#5C9850]' : 'bg-white'
                    }`}
                  >
                    <div className="flex-1">
                      <h2
                        className={`text-center font-bold lg:text-[36px] md:text-[28px] text-[22px] font-roboto mt-4 sm:mt-6 ${
                          selectedRole === role.id ? 'text-white' : 'text-[#33552C]'
                        }`}
                      >
                        {role.title}
                      </h2>
                      <div className="mt-3 sm:mt-4 space-y-2">
                        {role.description.map((desc, index) => (
                          <div key={index} className="flex gap-2 px-2 sm:px-3 items-start">
                            <div
                              className={`min-w-1.5 min-h-1.5 sm:min-w-2 sm:min-h-2 rounded-full mt-2 shrink-0 ${
                                selectedRole === role.id ? 'bg-white' : 'bg-[#33552C]'
                              }`}
                            ></div>
                            <p
                              className={`text-[13px] sm:text-[15px] md:text-[16px] font-roboto leading-[1.4] sm:leading-[25px] ${
                                selectedRole === role.id ? 'text-white' : 'text-[#33552C]'
                              }`}
                            >
                              {desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center mt-4 sm:mt-6">
                      <button
                        onClick={() => toggleDetail(role.id)}
                        className={`px-8 sm:px-16 py-2 text-[16px] sm:text-[20px] font-roboto transition-colors duration-200 ${
                          selectedRole === role.id
                            ? 'bg-white text-[#563212] hover:bg-gray-100'
                            : 'bg-[#5C9850] text-white hover:bg-[#4a7a3f]'
                        }`}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-3 px-4">
          <div>
            <div className="flex flex-wrap justify-center gap-4 pb-3">
              <button
                onClick={handleLeaveLobby}
                disabled={isLeaving || loading}
                className="px-6 py-3 rounded-[5px] bg-[#9C4F40] text-white font-bold md:text-[24px] text-[20px] font-roboto disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 3px 7px rgba(0, 0, 0, 0.4)' }}
              >
                {isLeaving ? 'Quitting...' : 'Quit Lobby'}
              </button>
              <button
                onClick={handleContinue}
                disabled={!canContinue || isLeaving}
                title={
                  !selectedRole
                    ? 'Select a role to continue'
                    : lobbyState?.status !== 'ready'
                    ? "All players didn't select the roles yet"
                    : userInfo?._id !== leader
                    ? 'Only the lobby leader can continue'
                    : 'Continue to pairing'
                }
                className={`flex justify-center items-center gap-10 px-3 py-2 rounded-[5px] transition-colors duration-150 ${
                  canContinue
                    ? 'bg-[#E1E1E1] hover:brightness-95 cursor-pointer'
                    : 'bg-gray-200 opacity-60 cursor-not-allowed'
                }`}
                style={{ boxShadow: '0 3px 7px rgba(0, 0, 0, 0.4)' }}
              >
                <p
                  className={`font-bold md:text-[27px] text-[24px] font-roboto ${
                    canContinue ? 'text-[#6D924B]' : 'text-gray-600'
                  }`}
                >
                  Continue
                </p>
                <div
                  className={`w-[38px] h-[38px] flex justify-center items-center rounded-[50%] ${
                    canContinue ? 'bg-[#C0D066]' : 'bg-gray-300'
                  }`}
                >
                  <Image src={sideArrow} alt="sideArrow" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 mb-4">
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
