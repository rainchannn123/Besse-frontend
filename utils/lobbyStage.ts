import { LobbyStage } from '@/types/besse';

type LobbyRoutePlayer = {
  userId: string;
  selectedRole: string | null;
};

type LobbyRouteState = {
  sessionId: string;
  stage: LobbyStage;
  players: LobbyRoutePlayer[];
};

const getGameplayRouteForRole = (selectedRole: string | null | undefined): string => {
  if (selectedRole === 'broker') {
    return '/dashboard/broker-inventory';
  }

  if (selectedRole === 'mrf') {
    return '/dashboard/mrf-collection';
  }

  return '/dashboard/municipality';
};

export const getLobbyRoute = (
  lobbyState: LobbyRouteState,
  userId?: string | null
): string => {
  switch (lobbyState.stage) {
    case 'waiting-room':
      return '/dashboard/team-members';
    case 'role-selection':
      return '/dashboard/role';
    case 'pairing':
      // ✅ UPDATED: Redirect to Matchmaking Lobby (waiting room removed)
      return '/dashboard/matchmaking-lobby';
    case 'in-game':
    case 'completed': {
      const selectedRole = lobbyState.players.find((player) => player.userId === userId)?.selectedRole;
      return getGameplayRouteForRole(selectedRole);
    }
    default:
      return '/dashboard/team-members';
  }
};

// ✅ Helper function to check if user should be redirected to matchmaking lobby
export const shouldRedirectToMatchmaking = (lobbyState: LobbyRouteState): boolean => {
  return lobbyState.stage === 'pairing';
};

// ✅ Helper function to get matchmaking lobby route
export const getMatchmakingLobbyRoute = (sessionId?: string): string => {
  return sessionId ? `/dashboard/matchmaking-lobby?sessionId=${sessionId}` : '/dashboard/matchmaking-lobby';
};

// ✅ Helper function to get game room route
export const getGameRoomRoute = (roomCode: string): string => {
  return `/dashboard/game-room/${roomCode}`;
};

// ✅ Helper function to get game over route
export const getGameOverRoute = (): string => {
  return '/dashboard/game-over';
};