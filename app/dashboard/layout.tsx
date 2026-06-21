'use client';

import { Footer } from '@/components/layout/footer/Footer';
import { MunicipalityFooter } from '@/components/layout/footer/MunicipalityFooter';
import { Header } from '@/components/layout/header/Header';
import { MunicipalityHeader } from '@/components/layout/header/MunicipalityHeader';
import { UserLogoutButton } from '@/components/layout/header/UserLogoutButton';
import { NotificationCenter } from '@/components/ui/notifications/NotificationCenter';
import { useWebSocket } from '@/hooks/useWebSocket';
import { gameService } from '@/services/gameService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { GameState, TeamData, PlayerRole } from '@/types/besse';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myTeam, setMyTeam] = useState<TeamData | null>(null);

  const { isAuthenticated, isLoading, initializeAuth, user } = useAuthStore();
  const { notifications, removeNotification } = useNotificationStore();

  // ✅ Skip WebSocket and auth for admin game room
  const isAdminGameRoom = pathname?.startsWith('/dashboard/admin-game-room/');
  
  const { subscribe, isConnected, joinGame } = useWebSocket();

  useEffect(() => {
    if (isLoading === true) {
      initializeAuth();
    }
  }, [isLoading, initializeAuth]);

  // ✅ FIXED: Skip auth check for admin game room
  useEffect(() => {
    if (!isLoading) {
      if (!isAdminGameRoom && !isAuthenticated) {
        router.push('/auth/login');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [isAuthenticated, isLoading, router, isAdminGameRoom]);

  // ✅ Skip WebSocket connection for admin game room
  useEffect(() => {
    if (isAdminGameRoom) {
      return;
    }
    
    if (user?.currentSession && isConnected && !isAdminGameRoom) {
      joinGame(user.currentSession);
    }
  }, [user?.currentSession, isConnected, joinGame, isAdminGameRoom]);

  // ✅ Pages where a game actually exists (not lobby/role selection)
  const isGamePage = pathname === '/dashboard/municipality'
    || pathname === '/dashboard/mrf-collection'
    || pathname === '/dashboard/broker-inventory'
    || pathname === '/dashboard/game-over'
    || pathname === '/dashboard/game-room/[roomCode]'
    || pathname.startsWith('/dashboard/game-room/');

  // ✅ Pages where user is in lobby/pre-game (don't fetch game state)
  const isPreGamePage = pathname === '/dashboard/besse-group'
    || pathname === '/dashboard/team-members'
    || pathname === '/dashboard/role'
    || pathname === '/dashboard/matchmaking-lobby'
    || pathname === '/dashboard/pairing'
    || pathname === '/dashboard/game-mode'
    || pathname.startsWith('/dashboard/waiting-room/')
    || isAdminGameRoom;

  // ✅ Only fetch game state on actual game pages
  useEffect(() => {
    if (user?.currentSession && isAuthenticated && isGamePage && !isPreGamePage && !isAdminGameRoom) {
      const fetchGameState = async () => {
        try {
          const response = await gameService.getGameState(user.currentSession!);
          if (response.success && response.data) {
            setGameState(response.data.gameState);
            
            const currentTeam = response.data.gameState.teams?.find(
              (team: TeamData) => team.sessionId === user.currentSession
            );
            if (currentTeam) {
              setMyTeam(currentTeam);
            }
          }
        } catch (error) {
          console.debug('No active game session yet');
        }
      };
      fetchGameState();
    } else {
      setGameState(null);
      setMyTeam(null);
    }
  }, [pathname, user?.currentSession, isAuthenticated, isGamePage, isPreGamePage, isAdminGameRoom]);

  // ✅ Subscribe to realtime updates for header/footer data on ALL authenticated pages
  useEffect(() => {
    if (!isAuthenticated || !user || isAdminGameRoom) return;

    if (isConnected && user.currentSession && isGamePage) {
      joinGame(user.currentSession);
    }

    const unsubGameStateUpdate = subscribe('game-state-update', (payload: any) => {
      if (payload?.gameState) {
        setGameState(payload.gameState);
        
        const currentTeam = payload.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
        if (currentTeam) {
          setMyTeam(currentTeam);
        }
        
        if (
          payload.gameState.gameStatus === 'complete' ||
          payload.gameState.gameStatus === 'lost' ||
          payload.gameState.gameStatus === 'won'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    const unsubGameStateFull = subscribe('game-state-full', (payload: any) => {
      if (payload?.gameState) {
        setGameState(payload.gameState);
        
        const currentTeam = payload.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
        if (currentTeam) {
          setMyTeam(currentTeam);
        }
        
        if (
          payload.gameState.gameStatus === 'complete' ||
          payload.gameState.gameStatus === 'lost' ||
          payload.gameState.gameStatus === 'won'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    const unsubSystemCheckUpdate = subscribe('system-check-update', (payload: any) => {
      if (payload?.gameState) {
        setGameState(payload.gameState);
        
        const currentTeam = payload.gameState.teams?.find(
          (team: TeamData) => team.sessionId === user?.currentSession
        );
        if (currentTeam) {
          setMyTeam(currentTeam);
        }

        if (
          payload.gameState.gameStatus === 'complete' ||
          payload.gameState.gameStatus === 'lost' ||
          payload.gameState.gameStatus === 'won'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    const unsubPlayerAction = subscribe('player-action', (payload: any) => {});

    const unsubTeamEliminated = subscribe('team-eliminated', (payload: any) => {
      if (payload?.teamId && myTeam?.teamId === payload.teamId) {
        setMyTeam((prev) => prev ? {
          ...prev,
          isEliminated: true,
          gameStatus: 'eliminated',
          eliminationReason: payload.reason,
        } : null);
      }
    });

    return () => {
      unsubGameStateUpdate && unsubGameStateUpdate();
      unsubGameStateFull && unsubGameStateFull();
      unsubSystemCheckUpdate && unsubSystemCheckUpdate();
      unsubPlayerAction && unsubPlayerAction();
      unsubTeamEliminated && unsubTeamEliminated();
    };
  }, [isAuthenticated, user, isConnected, isGamePage, subscribe, joinGame, router, myTeam?.teamId, isAdminGameRoom]);

  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner border-4 border-gray-200 border-t-blue-600 rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  // ✅ Check if we should show municipality header/footer
  const isMunicipalityPage =
    pathname === '/dashboard/municipality' ||
    pathname === '/dashboard/mrf-collection' ||
    pathname === '/dashboard/broker-inventory' ||
    pathname === '/dashboard/game-over' ||
    pathname === '/dashboard/matchmaking-lobby' ||
    pathname.startsWith('/dashboard/game-room/');

  const userRole = myTeam && user
    ? Object.keys(myTeam.players).find(
        (role: string) => myTeam.players[role as PlayerRole] === user._id
      )
    : null;

  // ✅ Only show Municipality header/footer if we have game state
  const showMunicipalityUI = isMunicipalityPage && gameState !== null && !isAdminGameRoom;

  return (
    <div className={showMunicipalityUI ? "min-h-screen lg:h-screen bg-gray-50 flex flex-col relative lg:overflow-hidden" : "min-h-screen bg-gray-50 flex flex-col relative"}>
      <UserLogoutButton />
      {showMunicipalityUI ? (
        <MunicipalityHeader
          playerName={user?.name}
          role={userRole || ''}
          cityName={myTeam?.teamName || 'BESSE City'}
          wasteInventory={myTeam?.wasteInventory || 0}
          maxCapacity={150}
        />
      ) : (
        <Header />
      )}
      <main className={showMunicipalityUI ? "flex-1 lg:min-h-0 bgColor lg:overflow-hidden py-3" : "flex-1 bgColor"}>{children}</main>

      <NotificationCenter
        notifications={notifications}
        onDismiss={removeNotification}
      />
      {showMunicipalityUI ? (
        <MunicipalityFooter
          budget={myTeam?.budget || 0}
          cityHealth={myTeam?.cityHealth || 0}
          wasteInventory={myTeam?.wasteInventory || 0}
          maxCapacity={150}
          totalCO2={myTeam?.totalCO2 || 0}
          //added below
          teamScore={myTeam?.teamScore || 0}
          maxTeamScore={myTeam?.maxTeamScore || 0}
        />
      ) : (
        <Footer />
      )}
    </div>
  );
}