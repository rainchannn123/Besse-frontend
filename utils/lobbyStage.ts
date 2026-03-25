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
      return `/dashboard/pairing?sessionId=${lobbyState.sessionId}`;
    case 'in-game':
    case 'completed': {
      const selectedRole = lobbyState.players.find((player) => player.userId === userId)?.selectedRole;
      return getGameplayRouteForRole(selectedRole);
    }
    default:
      return '/dashboard/team-members';
  }
};