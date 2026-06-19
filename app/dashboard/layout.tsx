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
import { GameState, PlayerRole } from '@/types/besse';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const { isAuthenticated, isLoading, initializeAuth, user } = useAuthStore();
  const { notifications, removeNotification } = useNotificationStore();

  // Initialize WebSocket connection for authenticated dashboard users
  const { subscribe, isConnected, joinGame } = useWebSocket();

  useEffect(() => {
    // Initialize auth if not already initialized
    if (isLoading === true) {
      initializeAuth();
    }
  }, [isLoading, initializeAuth]);

  useEffect(() => {
    // Check authentication status
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push('/auth/login');
      } else {
        // Allow access if authenticated
        setIsCheckingAuth(false);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Pages where an active GameSession exists (post-lobby)
  const isGamePage = pathname === '/dashboard/municipality'
    || pathname === '/dashboard/mrf-collection'
    || pathname === '/dashboard/broker-inventory'
    || pathname === '/dashboard/game-over';

  // Fetch game state only on actual game pages
  useEffect(() => {
    if (user?.currentSession && isAuthenticated && isGamePage) {
      const fetchGameState = async () => {
        try {
          const response = await gameService.getGameState(user.currentSession!);
          if (response.success && response.data) {
            setGameState(response.data.gameState);
          }
        } catch (error) {
          console.error('Failed to fetch game state:', error);
        }
      };
      fetchGameState();
    }
  }, [pathname, user?.currentSession, isAuthenticated, isGamePage]);

  // Subscribe to realtime updates for header/footer data on ALL authenticated pages
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Join the game room only on pages where a game actually exists
    if (isConnected && user.currentSession && isGamePage) {
      joinGame(user.currentSession);
    }

    // Game state updates - core game state changes
    const unsubGameStateUpdate = subscribe('game-state-update', (payload: any) => {
      if (payload?.gameState) {
        setGameState(payload.gameState);
        // Check if game is over and redirect
        if (
          payload.gameState.gameStatus === 'complete' ||
          payload.gameState.gameStatus === 'lost' ||
          payload.gameState.gameStatus === 'won'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    // Full game state with computed extras (authoritative source)
    const unsubGameStateFull = subscribe('game-state-full', (payload: any) => {
      if (payload?.gameState) {
        setGameState(payload.gameState);
        // Check if game is over and redirect
        if (
          payload.gameState.gameStatus === 'complete' ||
          payload.gameState.gameStatus === 'lost' ||
          payload.gameState.gameStatus === 'won'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    // System check updates (30s interval) - keeps header/footer data current
    const unsubSystemCheckUpdate = subscribe('system-check-update', (payload: any) => {
      if (payload?.gameState) {
        setGameState(payload.gameState);

        if (
          payload.gameState.gameStatus === 'complete' ||
          payload.gameState.gameStatus === 'lost' ||
          payload.gameState.gameStatus === 'won'
        ) {
          router.push('/dashboard/game-over');
        }
      }
    });

    // Player actions - may affect game state indirectly
    const unsubPlayerAction = subscribe('player-action', (payload: any) => {
      // Player actions might not directly change game state but could trigger updates
      // The system-check-update will keep everything synchronized
    });

    return () => {
      unsubGameStateUpdate && unsubGameStateUpdate();
      unsubGameStateFull && unsubGameStateFull();
      unsubSystemCheckUpdate && unsubSystemCheckUpdate();
      unsubPlayerAction && unsubPlayerAction();
    };
  }, [isAuthenticated, user, isConnected, isGamePage, subscribe, joinGame, router]);

  // Show loading while checking authentication
  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner border-4 border-gray-200 border-t-blue-600 rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }
  // If authenticated, render the dashboard content
  const isMunicipalityPage =
    pathname === '/dashboard/municipality' ||
    pathname === '/dashboard/mrf-collection' ||
    pathname === '/dashboard/broker-inventory';

  const userRole =
    gameState && user
      ? Object.keys(gameState.players).find(
          (role: string) => gameState.players[role as PlayerRole] === user._id
        )
      : null;

  return (
    <div className={isMunicipalityPage && gameState ? "min-h-screen lg:h-screen bg-gray-50 flex flex-col relative lg:overflow-hidden" : "min-h-screen bg-gray-50 flex flex-col relative"}>
      <UserLogoutButton />
      {isMunicipalityPage && gameState ? (
        <MunicipalityHeader
          playerName={user?.name}
          role={userRole || ''}
          cityName={(gameState as any).cityName || 'Clash of the Cities - Mission Net Zero'}
          wasteInventory={(gameState as any).wasteInventory || 0}
          maxCapacity={(gameState as any).maxCapacity || 150}
        />
      ) : (
        <Header />
      )}
      <main className={isMunicipalityPage && gameState ? "flex-1 lg:min-h-0 bgColor lg:overflow-hidden py-3" : "flex-1 bgColor"}>{children}</main>

      <NotificationCenter
        notifications={notifications}
        onDismiss={removeNotification}
      />
      {isMunicipalityPage && gameState ? (
        <MunicipalityFooter
          budget={gameState.budget}
          cityHealth={gameState.cityHealth}
          wasteInventory={(gameState as any).wasteInventory || 0}
          maxCapacity={(gameState as any).maxCapacity || 150}
          totalCO2={gameState.totalCO2}
          teamScore={(gameState as any).teamScore || 0}
          maxTeamScore={(gameState as any).maxTeamScore || 0}
        />
      ) : (
        <Footer />
      )}
    </div>
  );
}
