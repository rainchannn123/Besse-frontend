'use client';

import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import GameModeBadge from '@/components/ui/GameModeBadge';
import { useGameWebSocket } from '@/hooks/useWebSocket';
import sideArrow from '@/public/assets/images/sideArrow.png';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { authService } from '@/services/authService';
import { lobbyService } from '@/services/lobbyService';
import { useAuthStore } from '@/stores/authStore';
import { getLobbyRoute } from '@/utils/lobbyStage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type Member = {
  id: string | number;
  name?: string;
  role?: string;
  placeholder?: boolean;
};

const buildMembersWithPlaceholders = (
  currentMembers: Member[],
  totalSeats: number
): Member[] => {
  // ✅ Filter out duplicate members by id
  const seen = new Set<string | number>();
  const uniqueMembers = currentMembers.filter((member) => {
    if (member.placeholder) return true;
    if (seen.has(member.id)) return false;
    seen.add(member.id);
    return true;
  });

  const occupiedMembers = uniqueMembers.filter((member) => !member.placeholder);
  const nextMembers = [...occupiedMembers];

  while (nextMembers.length < totalSeats) {
    nextMembers.push({ 
      id: `placeholder-${nextMembers.length}`, 
      placeholder: true 
    });
  }

  return nextMembers;
};

export default function TeamMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [active, setActive] = useState<string | number | null>(0);
  const [lobbyCode, setLobbyCode] = useState<string>('');
  const [lobbyState, setLobbyState] = useState<any>(null);
  const [leader, setLeader] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number>(3);
  const [subtitle, setSubtitle] = useState<string>('3 Players is needed to start playing the game');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const isFetchingLobbyRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { subscribe, leaveGame } = useGameWebSocket(user?.currentSession || undefined);

  const applyLobbyState = useCallback((nextLobbyState: any) => {
    setLobbyState(nextLobbyState);
    setLeader(nextLobbyState.leader);
    setLobbyCode(nextLobbyState.lobbyCode);
    setMaxPlayers(nextLobbyState.maxPlayers);
    setSubtitle(`${nextLobbyState.maxPlayers} Players are needed to start playing the game`);

    if (nextLobbyState.gameMode) {
      localStorage.setItem('game_mode', nextLobbyState.gameMode);
    }

    const mappedMembers: Member[] = nextLobbyState.players.map((player: any) => ({
      id: player.userId,
      name: player.name,
      role: player.userId === nextLobbyState.leader ? 'Group Leader' : 'Team Member',
    }));

    setMembers(buildMembersWithPlaceholders(mappedMembers, nextLobbyState.maxPlayers));
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

  const getLobbyState = useCallback(async (showLoader = false) => {
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
      updateUser(userData);

      if (!userData?.currentSession) {
        setError('');
        setMembers(buildMembersWithPlaceholders([], maxPlayers));
        clearLobbyClientState(userData);
        router.replace('/dashboard/besse-group');
        return;
      }

      setError('');
      const response = await lobbyService.getLobbyState(userData.currentSession);

      if (response.data?.lobbyState) {
        const lobbyState = response.data.lobbyState;
        const currentPlayer = lobbyState.players.find(
          (player) => player.userId === userData._id
        );

        if (!currentPlayer) {
          clearLobbyClientState({
            ...userData,
            currentSession: null,
          });
          router.replace('/dashboard/besse-group');
          return;
        }

        const nextRoute = getLobbyRoute(lobbyState, userData._id);
        if (nextRoute !== '/dashboard/team-members') {
          router.replace(nextRoute);
          return;
        }

        applyLobbyState(lobbyState);
      } else {
        setError('Lobby not in valid state');
      }
    } catch (err: any) {
      console.error('Error fetching lobby state:', err);
      setError(err.response?.data?.message || 'Failed to load lobby state');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      isFetchingLobbyRef.current = false;
    }
  }, [applyLobbyState, clearLobbyClientState, maxPlayers, router, updateUser]);

  const scheduleLobbyRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      void getLobbyState(false);
    }, 200);
  }, [getLobbyState]);

  useEffect(() => {
    void getLobbyState(true);
  }, [getLobbyState, user?.currentSession]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const extractPlayers = (data: any): Array<{ userId: string; selectedRole: string }> => {
    const players: Array<{ userId: string; selectedRole: string }> = [];

    if (data?.playerRoles && typeof data.playerRoles === 'object') {
      Object.entries(data.playerRoles).forEach(([role, userId]) => {
        players.push({
          userId: userId as string,
          selectedRole: role,
        });
      });
    }

    if (data?.gameState?.players && typeof data.gameState.players === 'object') {
      Object.entries(data.gameState.players).forEach(([role, userId]) => {
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

  useEffect(() => {
    if (!user?.currentSession) return;

    const unsubscribeLobbyStateUpdate = subscribe('lobby-state-update', (data: any) => {
      if (!data?.sessionId || data.sessionId === user.currentSession) {
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

    const unsubscribePlayerJoined = subscribe('joined-game', (data:any) => {
      if (data?.sessionId && data.sessionId !== user.currentSession) {
        return;
      }
      scheduleLobbyRefresh();
    });

    const unsubscribePlayerLeft = subscribe('player-left', (data: any) => {
      if (data?.sessionId && data.sessionId !== user.currentSession) {
        return;
      }

      const leftUserId = data?.userId || data?.playerId || data?.leftUserId || data?.player?._id;

      if (data?.lobbyState) {
        applyLobbyState(data.lobbyState);
      } else if (leftUserId) {
        setMembers((prevMembers) => {
          const filteredMembers = prevMembers.filter(
            (member) => !member.placeholder && String(member.id) !== String(leftUserId)
          );
          return buildMembersWithPlaceholders(filteredMembers, maxPlayers);
        });
      }

      if (String(leftUserId) === String(user._id)) {
        clearLobbyClientState({
          ...user,
          currentSession: null,
        });
        router.replace('/dashboard/besse-group');
        return;
      }

      scheduleLobbyRefresh();
    });

    const unSubcribeGameStarted = subscribe('game-started', (data: any) => {
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
      if (data?.lobby?.status === 'active') {
        let players: Array<{ userId: string; selectedRole: string }> = [];

        if (Array.isArray(data?.lobby?.players)) {
          players = data.lobby.players.map((player: any) => ({
            userId: player.userId || player._id,
            selectedRole: player.selectedRole,
          }));
        } else if (data?.lobby?.players && typeof data.lobby.players === 'object') {
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
      unsubscribeLobbyStateUpdate && unsubscribeLobbyStateUpdate();
      unsubscribePlayerAction && unsubscribePlayerAction();
      unsubscribeRoleSelected && unsubscribeRoleSelected();
      unsubscribeRoleDeselected && unsubscribeRoleDeselected();
      unsubscribePlayerJoined && unsubscribePlayerJoined();
      unsubscribePlayerLeft && unsubscribePlayerLeft();
      unsubLobbyActivated && unsubLobbyActivated();
      unSubcribeGameStarted && unSubcribeGameStarted();
      unsubscribeSystemMessage && unsubscribeSystemMessage();
    };
  }, [applyLobbyState, clearLobbyClientState, maxPlayers, router, scheduleLobbyRefresh, subscribe, user]);

  const handleLeaveLobby = useCallback(async () => {
    if (!user?.currentSession || isLeaving) {
      return;
    }

    setIsLeaving(true);
    setError('');

    try {
      await lobbyService.leaveLobby({ sessionId: user.currentSession });
      clearLobbyClientState({
        ...user,
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
  }, [clearLobbyClientState, isLeaving, router, updateUser, user]);

  const joinedPlayersCount = members.filter((member) => !member.placeholder).length;
  const isLeader = user?._id === leader;
  const canContinue = isLeader && joinedPlayersCount === maxPlayers && !isLeaving && !isContinuing;

  const handleContinue = useCallback(async () => {
    if (!user?.currentSession || isContinuing) {
      return;
    }

    setIsContinuing(true);
    setError('');

    try {
      await lobbyService.continueToRoleSelection({
        sessionId: user.currentSession,
      });
    } catch (err: any) {
      console.error('Continue to role selection error:', err);
      setError(err.response?.data?.message || 'Failed to continue to role selection');
      scheduleLobbyRefresh();
    } finally {
      setIsContinuing(false);
    }
  }, [isContinuing, scheduleLobbyRefresh, user?.currentSession]);

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
        <GameModeBadge gameMode={lobbyState?.gameMode} />
        <div className="flex-1 space-y-2 bg-center flex flex-col justify-between">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 md:px-8 px-4 pt-6 w-full flex-1">
            {members.map((m, index) => {
              const isActive = active === m.id;
              // ✅ Use a combination of id and index for unique keys
              const uniqueKey = m.placeholder ? `placeholder-${index}` : m.id;

              return (
                <button
                  key={uniqueKey}
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
            <div className="flex flex-wrap justify-center gap-4 pb-3">
              <button
                onClick={handleLeaveLobby}
                disabled={isLeaving}
                className="flex justify-center items-center gap-4 px-6 py-2 rounded-[5px] bg-[#9C4F40] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 3px 7px rgba(0, 0, 0, 0.4)' }}
              >
                <p className="text-white font-bold md:text-[27px] text-[24px] font-roboto">
                  {isLeaving ? 'Quitting...' : 'Quit Lobby'}
                </p>
              </button>
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                title={
                  !isLeader
                    ? 'Only the group leader can continue'
                    : joinedPlayersCount !== maxPlayers
                    ? 'Continue is enabled only when all 3 players have joined'
                    : 'Continue to role selection'
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
                  {isContinuing ? 'Continuing...' : 'Continue'}
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
      </div>
    </div>
  );
}