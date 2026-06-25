import { ApiResponse, MaterialType } from './besse';

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
// Room Live Overview (v2)
// ─────────────────────────────────────────────────────────────

export type AdminRoomStatus = 'waiting' | 'ready' | 'started' | 'completed';

export interface AdminMaterialAmountMap {
  paper: number;
  metal: number;
  plastic: number;
  wood: number;
  glass: number;
}

export interface AdminRoomLiveOverview {
  roomCode: string;
  room: {
    roomCode: string;
    roomName: string;
    status: AdminRoomStatus;
    isAdminRoom: boolean;
    startedAt: string | null;
    elapsedMs: number;
    elapsedSeconds: number;
    totalDurationSeconds: number;
    remainingSeconds: number;
    isExpired: boolean;
    createdAt: string | null;
    updatedAt: string | null;
  };
  globalMetrics: {
    totalTeams: number;
    avgHealth: number;
    avgCO2: number;
    avgBudget: number;
    totalHealth?: number;
    totalCO2?: number;
    totalBudget?: number;
    totalCompletedProjects: number;
    activeTeams: number;
    completedTeams: number;
    eliminatedTeams: number;
    connectedTeams: number;
    disconnectedTeams: number;
  };
  teams: Array<{
    teamId: string;
    sessionId: string;
    citySlot: number;
    teamName: string;
    players: {
      municipality: string;
      mrf: string;
      broker: string;
    };
    gameStatus: string;
    isEliminated: boolean;
    eliminationReason: string | null;
    rank: number;
    metrics: {
      health: number;
      wallet: number;
      budget: number;
      totalCO2: number;
      completedProjects: number;
      totalProjectScore: number;
      wasteInventory: number;
      totalLandfillTons: number;
      minutesElapsed: number;
    };
    materialFlowSummary: {
      inByType: AdminMaterialAmountMap;
      outByType: AdminMaterialAmountMap;
      currentInventoryByType: AdminMaterialAmountMap;
      wasteByType: AdminMaterialAmountMap;
      projectUsedByType: AdminMaterialAmountMap;
      landfillByType: AdminMaterialAmountMap;
      totalIn: number;
      totalOut: number;
      currentInventoryTotal: number;
      totalWasteLogged: number;
      totalProjectUsed: number;
      totalLandfill: number;
    };
    connection: {
      connectedClients: number;
      hasActiveSocketConnections: boolean;
      isDisconnected: boolean;
    };
  }>;
  rankings: Array<{
    rank: number;
    teamId: string;
    sessionId: string;
    citySlot: number;
    teamName: string;
    totalProjectScore: number;
    health: number;
    totalCO2: number;
    gameStatus: string;
  }>;
  snapshot: unknown;
  materialFlowEvents: Array<{
    roomCode: string;
    teamId: string;
    sessionId: string;
    citySlot: number;
    flowClass: 'material' | 'waste';
    source: string;
    destination: string;
    materialType: MaterialType;
    amount: number;
    eventAt: string;
    metadata?: Record<string, unknown>;
  }>;
  flowQuery?: {
    flowLimit: number;
    flowFrom: string | null;
    flowTo: string | null;
    includeFlowEvents: boolean;
  };
  warnings?: string[];
  generatedAt: string;
  contractVersion: 'admin-room-live-overview/v2';
}

export interface AdminRoomLiveOverviewQuery {
  flowLimit?: number;
  flowFrom?: string;
  flowTo?: string;
  includeFlowEvents?: boolean;
}

export type AdminRoomLiveOverviewResponse = ApiResponse<AdminRoomLiveOverview>;

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
