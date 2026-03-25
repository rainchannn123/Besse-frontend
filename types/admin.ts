import { ApiResponse } from './besse';

export type AdminPlayerStatus =
  | 'offline'
  | 'waiting-room'
  | 'role-selection'
  | 'pairing'
  | 'in-game'
  | 'completed'
  | 'session-unknown';

export interface AdminPlayerRow {
  userId: string;
  name: string;
  email: string;
  accountRole: string;
  currentSession: string | null;
  status: AdminPlayerStatus;
  hasActiveSocketConnections: boolean;
  roleInSession: 'municipality' | 'mrf' | 'broker' | null;
  teamRole: 'Team A' | 'Team B' | null;
  isLobbyLeader: boolean;
  pairId: string | null;
  partnerSessionId: string | null;
  teammateNames: string[];
  competitorNames: string[];
  gameStatus: 'active' | 'won' | 'lost' | 'complete' | null;
  gameDay: number | null;
  gameMinutesElapsed: number | null;
  cityHealth: number | null;
  budget: number | null;
  totalCO2: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMatchTeam {
  sessionId: string;
  lobbyCode: string;
  teamRole: 'Team A' | 'Team B' | null;
  stage: string;
  status: string;
  leaderId: string;
  leaderName: string;
  playerCount: number;
  players: Array<{
    userId: string;
    name: string;
    selectedRole: 'municipality' | 'mrf' | 'broker' | null;
  }>;
}

export interface AdminMatchGroup {
  pairId: string;
  pairStatus:
    | 'active'
    | 'team_a_eliminated'
    | 'team_b_eliminated'
    | 'completed'
    | null;
  teams: AdminMatchTeam[];
}

export interface AdminMonitorOverviewData {
  summary: {
    totalUsers: number;
    inGame: number;
    waitingRoom: number;
    roleSelection: number;
    pairing: number;
    offline: number;
    activeLobbies: number;
    activePairs: number;
  };
  players: AdminPlayerRow[];
  matchGroups: AdminMatchGroup[];
  generatedAt: string;
}

export interface AdminLoginResponse
  extends ApiResponse<{
    token: string;
    username: string;
  }> {}

export interface AdminOverviewResponse extends ApiResponse<AdminMonitorOverviewData> {}

export interface AdminForceExitResponse
  extends ApiResponse<{
    userId: string;
    name: string;
    previousSession: string | null;
    currentSession: string | null;
  }> {}

export interface AdminPlayerGameRecord {
  sessionId: string;
  roleInGame: 'municipality' | 'mrf' | 'broker' | null;
  playerNames: {
    municipality: string;
    mrf: string;
    broker: string;
  };
  competitorNames: string[];
  gameStatus: 'active' | 'won' | 'lost' | 'complete' | null;
  cityHealth: number | null;
  budget: number | null;
  totalCO2: number | null;
  currentGameDay: number | null;
  minutesElapsed: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPlayerHistoryData {
  userId: string;
  total: number;
  limit: number;
  skip: number;
  history: AdminPlayerGameRecord[];
}

export interface AdminPlayerHistoryResponse extends ApiResponse<AdminPlayerHistoryData> {}
