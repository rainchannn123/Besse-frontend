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
  accountRole?: string;
  accountType?: string;
  currentSession: string | null;
  status: AdminPlayerStatus;
  hasActiveSocketConnections: boolean;
  roleInSession: 'municipality' | 'mrf' | 'broker' | null;
  gameMode: 'waste' | 'energy' | null;
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
  gameMode: 'waste' | 'energy';
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

// ─────────────────────────────────────────────────────────────
// Activity Log types
// ─────────────────────────────────────────────────────────────

export type ActivityCategory =
  | 'auth'
  | 'lobby'
  | 'matchmaking'
  | 'game'
  | 'municipality'
  | 'mrf'
  | 'broker'
  | 'admin'
  | 'system';

export type ActivityStatus = 'success' | 'failure';

export interface ActivityLogEntry {
  _id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  accountType: string | null;
  role: string | null;
  category: ActivityCategory;
  action: string;
  description: string;
  sessionId: string | null;
  targetUserId: string | null;
  targetUserName: string | null;
  status: ActivityStatus;
  statusCode: number | null;
  method: string | null;
  route: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogListData {
  logs: ActivityLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityLogListResponse extends ApiResponse<ActivityLogListData> {}

export interface ActivityLogStatsData {
  totalLogs: number;
  byCategory: Array<{ category: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  last24Hours: number;
  last7Days: number;
}

export interface ActivityLogStatsResponse extends ApiResponse<ActivityLogStatsData> {}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  category?: ActivityCategory | '';
  status?: ActivityStatus | '';
  action?: string;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}
