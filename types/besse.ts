// Core Types
export type MaterialType = 'paper' | 'plastic' | 'metal' | 'glass' | 'wood';
export type QualityGrade = 'A' | 'B' | 'C' | 'F';
export type PlayerRole = 'municipality' | 'mrf' | 'broker';
export type WasteOrigin = 'Residential' | 'Commercial' | 'Industrial';
export type BatchStatus = 'PENDING' | 'DELIVERED' | 'FAILED';
export type GameStatus = 'active' | 'won' | 'lost' | 'complete';

// User Types
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'player' | 'admin';
  currentSession: string | null;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

// NEW: Game Constants
export interface GameConstants {
  // Time & Session - UPDATED to match manual exactly
  REAL_TIME_GAME_DURATION_MINUTES: number; // 30 minutes real-world time
  GAME_DURATION_DAYS: number; // 7 game days
  WASTE_SPAWN_INTERVAL_MINUTES: number; // 2 minutes real-world time
  AUTO_SAVE_INTERVAL_SECONDS: number; // 30 seconds
  BATCH_COLLECTION_DEADLINE_MINUTES: number; // 10 minutes game time
  OVERDUE_BATCH_HEALTH_PENALTY: number; // 2% per overdue batch
  FIXED_DISTANCE_TO_MRF_KM: number; // 10 km fixed distance

  // Starting values
  STARTING_BUDGET: number;
  STARTING_HEALTH: number;
  WINNING_HEALTH: number;
  LOSING_HEALTH: number;

  // CO2 Factors (UPDATED to match manual exactly)
  CO2_TRANSPORT_FACTOR_PER_TON_KM: number; // 120 kg CO2 / ton / km
  CO2_PROCESSING_FACTOR_PER_TON_MIN: number; // 15 kg CO2 / ton / min
  CO2_DUMPING_FACTOR_PER_TON_MIN: number; // 250 kg CO2 / ton / min
  CO2_FACTOR_TRANSPORT: number; // 1.6 tons per truck
  CO2_FACTOR_LANDFILL: number; // 2.5 tons per ton

  // Costs (UPDATED to match manual exactly)
  TRANSPORT_COST_PER_TON_KM: number; // $2.50 / ton / km
  DUMPING_FEE: number; // $50 / ton
  OPERATING_COST: number; // $500 / shift

  // Material Properties (UPDATED to match manual table exactly - includes Wood)
  MATERIAL_PROPERTIES: {
    paper: {
      basePrice: number;
      processRate: number;
      wasteRate: number;
      co2Profile: string;
    };
    plastic: {
      basePrice: number;
      processRate: number;
      wasteRate: number;
      co2Profile: string;
    };
    metal: {
      basePrice: number;
      processRate: number;
      wasteRate: number;
      co2Profile: string;
    };
    glass: {
      basePrice: number;
      processRate: number;
      wasteRate: number;
      co2Profile: string;
    };
    wood: {
      basePrice: number;
      processRate: number;
      wasteRate: number;
      co2Profile: string;
    };
  };

  // Quality Multipliers - UPDATED to match manual exactly
  QUALITY_MULTIPLIERS: {
    material: {
      A: number; // 1.25x
      B: number; // 1.0x
      C: number; // 0.5x
    };
    waste: {
      B: number; // 0.3x
      C: number; // 0.2x
      F: number; // 0.1x
    };
  };

  // Health Calculation (UPDATED to match manual exactly)
  WASTE_PENALTY_THRESHOLD: number; // 100 tons
  CO2_PENALTY_THRESHOLD: number; // 200 tons
  HEALTH_PENALTY_PER_TON_OVER: number; // 1% per ton over waste threshold
  HEALTH_PENALTY_PER_50_TONS_CO2_OVER: number; // 1% per 50 tons over CO2 threshold
  PROJECT_COMPLETION_BONUS: number; // 5% per project

  // Game Over Countdown
  COUNTDOWN_DURATION_SECONDS: number; // 180 seconds (3 minutes)
  COUNTDOWN_RECOVERY_HEALTH_THRESHOLD: number; // 5%
  COUNTDOWN_RECOVERY_BUDGET_THRESHOLD: number; // $1,000

  // Auction and Broker settings
  AUCTION_DURATION_SECONDS: number; // 30 seconds
  PLAYER_BID_CAP: number; // 10 active bids
  MARKUP_CONSTANT: number; // 2.5x

  // Penalties
  REFUSE_HEALTH_PENALTY_PER_TON: number; // 0.5% per ton
}

export interface Auction {
  auctionId: string;
  originTeam: string; // sessionId of the team listing the auction
  materialType: 'paper' | 'plastic' | 'metal' | 'glass' | 'wood';
  grade: 'A' | 'B' | 'C' | 'F';
  mass: number;
  currentBid: number; // Current/highest bid amount (starts as entry price set by MRF)
  startingPrice?: number; // Entry price set by MRF (for reference, same as initial currentBid)
  highBidder: string | null; // playerId of highest bidder
  highBidderSessionId?: string | null; // sessionId of highest bidder's team (for self-win detection)
  endTime: number; // timestamp when auction expires
  status: 'pending' | 'active' | 'sold' | 'expired';
}

// API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Error Response
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Auth Types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse
  extends ApiResponse<{
    user: {
      _id: string;
      name: string;
      email: string;
      role: 'player';
      createdAt: string;
      updatedAt: string;
    };
    token: string;
  }> {}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse
  extends ApiResponse<{
    user: {
      _id: string;
      name: string;
      email: string;
      role: 'player';
    };
    token: string;
  }> {}

export interface ProfileResponse
  extends ApiResponse<{
    user: {
      _id: string;
      name: string;
      email: string;
      role: 'player';
      currentSession: string | null;
    };
  }> {}

export type LobbyStage =
  | 'waiting-room'
  | 'role-selection'
  | 'pairing'
  | 'in-game'
  | 'completed';

export interface LobbyState {
  sessionId: string;
  lobbyCode: string; // 6-character alphanumeric code for joining
  leader: string; // User ID of the lobby leader
  stage: LobbyStage;
  players: {
    userId: string;
    name: string;
    selectedRole: 'municipality' | 'mrf' | 'broker' | null;
    joinedAt: Date;
  }[];
  status: 'waiting' | 'ready' | 'active' | 'completed';
  pairId?: string | null;
  partnerSessionId?: string | null;
  teamRole?: 'Team A' | 'Team B' | null;
  pairStatus?: 'active' | 'team_a_eliminated' | 'team_b_eliminated' | 'completed' | null;
  createdAt: Date;
  maxPlayers: number;
}

export interface LobbyListResponse
  extends ApiResponse<{
    lobbies: LobbyState[];
  }> {}

export interface JoinLobbyRequest {
  lobbyCode?: string;
}

export interface CreateLobbyResponse
  extends ApiResponse<{
    lobby: LobbyState;
  }> {}

export interface JoinLobbyResponse
  extends ApiResponse<{
    lobby: LobbyState;
  }> {}

export interface SelectRoleRequest {
  sessionId: string;
  role: PlayerRole;
}

export interface LeaveLobbyRequest {
  sessionId: string;
}

export interface SelectRoleResponse
  extends ApiResponse<{
    lobby: LobbyState;
  }> {}

export interface LobbyStateResponse
  extends ApiResponse<{
    lobbyState: {
      sessionId: string;
      lobbyCode: string;
      leader: string;
      stage: LobbyStage;
      players: Array<{
        userId: string;
        name: string;
        selectedRole: string | null;
        joinedAt: string;
      }>;
      status: 'waiting' | 'ready' | 'active' | 'completed';
      createdAt: string;
      maxPlayers: number;
    };
  }> {}

export interface LeaveLobbyResponse
  extends ApiResponse<{
    leaveResult: {
      sessionId: string;
      leftUserId: string;
      leftUserName: string;
      leader: string | null;
      status: 'waiting' | 'ready' | 'active' | 'completed' | 'closed';
      currentSessionCleared: boolean;
      lobbyDeleted: boolean;
      playersRemaining: number;
      alreadyLeft: boolean;
      lobbyState: LobbyState | null;
    };
  }> {}

export interface StartGameRequest {
  sessionId: string;
}

export interface ContinueToRoleSelectionRequest {
  sessionId: string;
}

export interface ContinueToPairingRequest {
  sessionId: string;
}

export interface ContinueToRoleSelectionResponse
  extends ApiResponse<{
    lobbyState: LobbyState;
  }> {}

export interface ContinueToPairingResponse
  extends ApiResponse<{
    lobbyState: LobbyState;
  }> {}

export interface StartGameResponse
  extends ApiResponse<{
    gameState: GameState;
  }> {}

// Pairing Types
export interface JoinPairingQueueRequest {
  sessionId: string;
}

export interface JoinPairingQueueResponse
  extends ApiResponse<{
    result: {
      queuePosition: number;
      message: string;
    };
  }> {}

export interface PairingStatusResponse
  extends ApiResponse<{
    status: {
      queuePosition: number | null;
      totalInQueue: number;
      message: string;
    };
  }> {}

export interface LeavePairingQueueRequest {
  sessionId: string;
}

export interface LeavePairingQueueResponse extends ApiResponse<{}> {}

export interface PartnerMetricsResponse
  extends ApiResponse<{
    metrics: {
      sessionId: string;
      pairId: string;
      budget: number;
      cityHealth: number;
      totalCO2: number;
      currentTurn: number;
      gameStatus: GameStatus;
    };
  }> {}

export interface PairingResultResponse
  extends ApiResponse<{
    result: {
      pairId: string;
      partnerSessionId: string;
      teamRole: 'Team A' | 'Team B';
      pairStatus: 'Active' | 'Team A Eliminated' | 'Team B Eliminated' | 'Pair Completed';
    };
  }> {}

// NEW: Pairing System Types
export interface PairingStatus {
  isInQueue: boolean;
  position: number;
  estimatedWaitTime: number; // seconds
  isPaired: boolean;
  pairId: string | null;
  partnerSessionId: string | null;
  teamRole: 'Team A' | 'Team B' | null;
}

export interface PartnerMetrics {
  sessionId: string;
  pairId: string;
  budget: number;
  cityHealth: number;
  totalCO2: number;
  currentTurn: number;
  gameStatus: GameStatus;
}

// NEW: Pair Data Payload
export interface PairDataPayload {
  pairId: string;
  partnerSessionId: string;
  teamRole: 'Team A' | 'Team B';
  pairStatus: 'active' | 'team_a_eliminated' | 'team_b_eliminated' | 'completed';
  partnerHealth?: number;
  partnerBudget?: number;
  partnerCO2?: number;
  partnerGameStatus?: 'active' | 'lost' | 'complete';
}

// NEW: Enhanced Transaction Types
export interface Transaction {
  id: string;
  turn: number;
  buyer: string; // "broker", "municipality", or "External Market"
  seller: string; // "mrf", "broker", etc.
  itemType: MaterialType;
  itemId: string;
  mass: number;
  price: number;
  transactionType: 'external_sale' | 'internal_transfer';
  revenue: number;
}

// Game Types
export interface GameState {
  sessionId: string;
  currentTurn: number;
  budget: number;
  cityHealth: number;
  totalCO2: number;
  wasteInventory: number;
  maxCapacity: number;
  constants: GameConstants;
  wasteBatches: WasteBatch[];
  mrfQueue: MRFQueue[];
  materialInventory: Material[];
  transactions: Transaction[];
  cityProjects: CityProject[];
  activityLog: string[];
  gameStatus: GameStatus;
  players: {
    municipality: string;
    mrf: string;
    broker: string;
  };
  playerNames: {
    municipality: string;
    mrf: string;
    broker: string;
  };
  // NEW: Real-time game mechanics
  gameStartTime: number; // Timestamp when game started
  lastWasteSpawnTime: number; // Timestamp of last waste spawn
  lastAutoSaveTime: number; // Timestamp of last auto-save
  minutesElapsed: number; // Real-world minutes elapsed
  currentGameDay: number; // Current game day (1-7)
  currentGameHour: number; // Current hour in game day
  // NEW: Active locks for concurrent processing prevention
  activeLocks: {
    [key: string]: {
      playerId: string;
      timestamp: number;
      type: 'batch' | 'queue' | 'material';
    };
  };
  // NEW: Pairing information for paired-team mode
  pairId?: string | null;
  partnerSessionId?: string | null;
  teamRole?: 'Team A' | 'Team B' | null;
  pairStatus?: 'active' | 'team_a_eliminated' | 'team_b_eliminated' | 'completed' | null;
  // NEW: Game Over Countdown System
  gameOverCountdown: {
    active: boolean;
    startTime: number | null;
    reason: 'health' | 'budget' | 'time' | null;
  };
  // NEW: Transport tracking
  totalTransportTrips: number;
  totalLandfillTons: number;

  // NEW: Municipal Inventory for materials available for projects
  municipalInventory: {
    paper: number;
    plastic: number;
    metal: number;
    glass: number;
    wood: number;
  };

  // NEW: Surrender voting — all 3 must vote to end the game early
  surrenderVotes?: string[]; // array of playerIds who have voted to surrender

  // NEW: Marketplace Listing for live auctions
  marketplaceListing: Auction[];

  // NEW: External wholesaler stock (randomized at game start)
  externalStock: {
    paper: number;
    plastic: number;
    metal: number;
    glass: number;
    wood: number;
  };

  // NEW: Active bids tracking per player (for bid cap enforcement)
  activeBids: {
    [playerId: string]: number; // playerId -> count of active bids
  };
}

export interface GameStateResponse
  extends ApiResponse<{
    gameState: GameState;
    userRole: PlayerRole;
    userRoles: string[];
    countdownTimeRemaining: number | null;
  }> {}

export interface PlayerRoleResponse
  extends ApiResponse<{
    role: PlayerRole;
  }> {}

export interface EndTurnResponse
  extends ApiResponse<{
    gameState: GameState;
    userRole: PlayerRole;
  }> {}

export interface PairDetailsResponse
  extends ApiResponse<{
    pairDetails: {
      pairId: string;
      averagePairHealth: number;
      teamAHealth: number | null;
      teamBHealth: number | null;
      teamABudget: number;
      teamBBudget: number;
      teamACO2: number;
      teamBCO2: number;
      teamAGameStatus: string; // "active", "lost", "complete"
      teamBGameStatus: string; // "active", "lost", "complete"
      teamAPairStatus: string; // "active", "eliminated"
      teamBPairStatus: string; // "active", "eliminated"
      teamASessionId: string;
      teamBSessionId: string;
      status: string; // "Active", "Team A Eliminated", "Team B Eliminated"
      gameEndTimestamp: Date;
    };
  }> {}

// Municipality Types
export interface CollectWasteRequest {
  batchId: string;
  sessionId: string;
}

export interface CollectWasteResponse
  extends ApiResponse<{
    gameState: GameState;
  }> {}

export interface RejectWasteRequest {
  batchId: string;
  sessionId: string;
}

export interface RejectWasteResponse
  extends ApiResponse<{
    gameState: GameState;
  }> {}

export interface WasteBatch {
  id: string;
  playerId: string; // Player who initiated collection
  turnGenerated: number;
  generationTime: number; // Timestamp when batch was generated
  origin: 'Residential' | 'Commercial' | 'Industrial';
  mass: number;
  composition: {
    paper: number;
    plastic: number;
    metal: number;
    glass: number;
    wood?: number;
  };
  status: 'PENDING' | 'DELIVERED' | 'FAILED';
  collectionDeadline: number; // Timestamp deadline for collection
  lockToken: string | null; // Lock token to prevent double processing
  lockedAt: number | null; // Timestamp when batch was locked
  penalized: boolean; // Whether health penalty has been applied for being overdue
}

export interface WasteBatchesResponse
  extends ApiResponse<{
    batches: WasteBatch[];
    wasteInventory: number;
    maxCapacity: number;
    budget: number;
  }> {}

export interface Material {
  id: string;
  type: 'paper' | 'plastic' | 'metal' | 'glass' | 'wood';
  materialOrWaste: boolean; // TRUE = material, FALSE = waste
  quality: 'A' | 'B' | 'C' | 'F';
  mass: number;
  contamination: number;
  owner: 'mrf' | 'broker' | 'municipality';
  listed: boolean;
}

export interface BrokerMaterialsResponse
  extends ApiResponse<{
    materials: Material[];
    municipalityBudget: number;
  }> {}

export interface PlaceOrderRequest {
  materialId: string;
  quantity: number;
}

export interface PlaceOrderResponse
  extends ApiResponse<{
    gameState: GameState;
  }> {}

export interface CityProject {
  id: string;
  name: string;
  requiredMaterials: Partial<Record<MaterialType, number>>;
  addedMaterials?: Partial<Record<MaterialType, number>>;
  progress: number;
  completed: boolean;
  healthBonus: number;
  budgetBonus: number;
  deadline: number;
}

export interface CityProjectsResponse
  extends ApiResponse<{
    projects: CityProject[];
    inventory: Record<MaterialType, number>;
  }> {}

export interface ConstructProjectRequest {
  projectId: string;
  materialType: 'paper' | 'plastic' | 'metal' | 'glass' | 'wood';
  materialAmount: number;
  sessionId: string;
}

export interface ConstructProjectResponse
  extends ApiResponse<{
    message: string;
    updatedInventory: Record<MaterialType, number>;
    healthBonusApplied: number;
    budgetBonusApplied?: number;
  }> {}

// MRF Types
export interface ProcessWasteRequest {
  queueId: string;
  sessionId: string;
}

export interface ProcessWasteResponse
  extends ApiResponse<{
    gameState: GameState;
  }> {}

export interface AssignGradeRequest {
  materialId?: string;
  auctionId?: string;
  grade: QualityGrade;
  sessionId: string;
  customPrice?: number;
}

export interface AssignGradeResponse
  extends ApiResponse<{
    gameState: GameState;
  }> {}

export interface MRFQueue {
  id: string;
  batchId: string;
  playerId: string; // Player who initiated MRF processing
  arrivalTime: number; // Timestamp
  delivered: boolean; // If TRUE, hide from "IN TRANSIT" list
  lockToken: string | null; // Lock token to prevent double processing
  penaltyApplied?: boolean; // If TRUE, 5-minute penalty has been applied
}

export interface MRFQueueResponse
  extends ApiResponse<{
    queue: Array<{
      id: string;
      batchId: string;
      arrivalTime: number;
      processed: boolean;
    }>;
  }> {}

export interface MRFInventoryResponse
  extends ApiResponse<{
    inventory: Material[];
  }> {}

export interface PendingAuctionsResponse
  extends ApiResponse<{
    pendingAuctions: Array<{
      id: string;
      materialType: MaterialType;
      mass: number;
      createdAt: string;
    }>;
  }> {}

// Broker Types
export interface BuyMaterialRequest {
  materialId: string;
  buyer: 'municipality' | 'broker';
  sessionId: string;
}

export interface BuyMaterialResponse
  extends ApiResponse<{
    gameState: GameState;
  }> {}

export interface UseMaterialRequest {
  materialId: string;
  projectId: string;
  sessionId: string;
}

export interface UseMaterialResponse
  extends ApiResponse<{
    gameState: GameState;
  }> {}

export interface MarketplaceResponse
  extends ApiResponse<{
    marketplace: Material[];
  }> {}

export interface ProjectsResponse
  extends ApiResponse<{
    projects: CityProject[];
  }> {}

export interface BrokerInventoryResponse
  extends ApiResponse<{
    inventory: Material[];
  }> {}

export interface MunicipalityInventoryResponse
  extends ApiResponse<{
    inventory: Material[];
  }> {}

export interface TransactionHistoryResponse
  extends ApiResponse<{
    transactions: Transaction[];
  }> {}

export interface PlaceBidRequest {
  auctionId: string;
  sessionId: string;
}

export interface PlaceBidResponse {
  success: boolean;
  message: string;
  auction?: {
    id: string;
    materialType: string;
    grade: string;
    currentBid: number;
    highestBidder?: string;
    endsAt: string;
  };
}

export interface BuyFromExternalWholesalerRequest {
  materialType: string;
  requestedAmount: number;
  sessionId: string;
}

export interface BuyFromExternalWholesalerResponse {
  success: boolean;
  message: string;
  purchase?: {
    materialType: string;
    amountPurchased: number;
    totalCost: number;
  };
}

export interface ActiveAuctionsResponse {
  success: boolean;
  message: string;
  data: {
    auctions: Array<{
      id: string;
      materialType: string;
      grade: string;
      entryPrice: number;
      currentBid: number;
      highestBidder?: string;
      mass: number;
      seller: string;
      endsAt: string;
      status: 'active' | 'expired' | 'pending';
    }>;
  };
}

export interface ResolveAuctionsResponse {
  success: boolean;
  message: string;
  data: {
    resolvedAuctions: Array<{
      auctionId: string;
      winner?: string;
      finalPrice: number;
      materialType: string;
      grade: string;
      mass: number;
    }>;
  };
}

export interface ExternalStockResponse {
  success: boolean;
  message: string;
  data: {
    externalStock: Array<{
      materialType: string;
      availableAmount: number;
      pricePerUnit: number;
      lastUpdated: string;
    }>;
  };
}

// WebSocket Events
export interface WebSocketEventData {
  'joined-game': {
    sessionId: string;
    userId: string;
    userName: string;
  };
  'game-state-update': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'game-state-full': {
    gameState: GameState;
    playerRoles: Record<string, PlayerRole>;
    playerNames: Record<string, string>;
    countdownTimeRemaining: number | null;
    turnSummary: any;
    statistics: any;
    realtimeUpdate: RealtimeUpdatePayload;
    actionType: string;
    actionDetails: any;
    sessionId: string;
    timestamp: number;
  };
  'lobby-state-update': {
    sessionId: string;
    lobbyState: {
      sessionId: string;
      lobbyCode: string;
      leader: string;
      stage: LobbyStage;
      players: Array<{
        userId: string;
        name: string;
        selectedRole: string | null;
        joinedAt: string;
      }>;
      status: 'waiting' | 'ready' | 'active' | 'completed';
      createdAt: string;
      maxPlayers: 3;
    };
    reason?: string;
    timestamp: number;
  };
  'waste-collected': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'waste-rejected': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'material-ordered': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'waste-processed': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'material-graded': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'material-sold-external': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'material-transferred': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'system-check-update': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'turn-ended': {
    sessionId: string;
    gameState: GameState;
    timestamp: number;
  };
  'game-complete': {
    pairAverageHealth: number;
    teamAHealth: number;
    teamBHealth: number;
    teamABudget: number;
    teamBBudget: number;
    teamACO2: number;
    teamBCO2: number;
    sessionId: string;
    timestamp: number;
  };
  'system-message': {
    message: string;
    type: 'info' | 'warning' | 'error';
    timestamp: number;
  };
  'player-action': {
    playerId: string;
    playerName: string;
    action: string;
    details: any;
    timestamp: number;
  };
  'pairing-joined': {
    sessionId: string;
    position: number;
    estimatedWaitTime: number;
    timestamp: number;
  };
  'pairing-status-update': {
    sessionId: string;
    status: {
      isPaired: boolean;
      pairId?: string;
      partnerSessionId?: string;
      teamRole?: 'Team A' | 'Team B';
    };
    timestamp: number;
  };
  'teams-paired': {
    sessionId: string;
    pairId: string;
    partnerSessionId: string;
    teamRole: 'Team A' | 'Team B';
    timestamp: number;
  };
  'partner-eliminated': {
    sessionId: string;
    partnerSessionId: string;
    reason: string;
    timestamp: number;
  };
  'pairing-left': {
    sessionId: string;
    timestamp: number;
  };
  'pair-score-updated': {
    pairId: string;
    averagePairHealth: number;
    teamAHealth: number;
    teamBHealth: number;
    pairStatus: string;
    sessionId: string;
    timestamp: number;
  };
  error: {
    message: string;
  };
}

// NEW: Real-time Update Payload
export interface RealtimeUpdatePayload {
  sessionId: string;
  currentBudget: number;
  totalCO2: number;
  wastePending: {
    batch_id: string;
    mass: number;
    deadline: string;
    status: string;
  } | null;
  materialAvailable: {
    item_id: string;
    type: string;
    grade: string;
    mass: number;
  } | null;
}

// Zod Schemas
export const registerSchema = {
  body: {
    name: { type: 'string', min: 2 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', min: 6 },
  },
};

export const loginSchema = {
  body: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', min: 1 },
  },
};

export const createLobbySchema = {
  body: {},
};

export const joinLobbySchema = {
  body: {
    lobbyCode: { type: 'string', pattern: '^[A-Z0-9]{6}$' },
  },
};

export const selectRoleSchema = {
  body: {
    sessionId: { type: 'string', min: 1 },
    role: { type: 'enum', values: ['municipality', 'mrf', 'broker'] },
  },
};

export const collectWasteSchema = {
  body: {
    batchId: { type: 'string', min: 1 },
  },
  params: {
    sessionId: { type: 'string', min: 1 },
  },
};

export const placeMaterialOrderSchema = {
  body: {
    materialId: { type: 'string', min: 1 },
    quantity: { type: 'number', positive: true },
  },
  params: {
    sessionId: { type: 'string', min: 1 },
  },
};

export const processWasteSchema = {
  body: {
    queueId: { type: 'string', min: 1 },
    sessionId: { type: 'string', min: 1 },
  },
};

export const assignGradeSchema = {
  body: {
    auctionId: { type: 'string', min: 1 },
    grade: { type: 'enum', values: ['A', 'B', 'C', 'F'] },
    sessionId: { type: 'string', min: 1 },
    customPrice: { type: 'number' },
  },
};

export const sellMaterialSchema = {
  body: {
    materialId: { type: 'string', min: 1 },
    transactionType: { type: 'enum', values: ['external_sale', 'internal_transfer'] },
    projectId: { type: 'string' },
    sessionId: { type: 'string', min: 1 },
  },
};

export const placeBidSchema = {
  body: {
    auctionId: { type: 'string', min: 1 },
    sessionId: { type: 'string', min: 1 },
  },
};

export const buyFromExternalWholesalerSchema = {
  body: {
    materialType: { type: 'enum', values: ['paper', 'plastic', 'metal', 'glass', 'wood'] },
    requestedAmount: { type: 'number', positive: true },
    sessionId: { type: 'string', min: 1 },
  },
};
