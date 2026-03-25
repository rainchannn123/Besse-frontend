
import api from '../config/api';
import {
  ContinueToPairingRequest,
  ContinueToPairingResponse,
  ContinueToRoleSelectionRequest,
  ContinueToRoleSelectionResponse,
  CreateLobbyResponse,
  JoinLobbyRequest,
  JoinLobbyResponse,
  JoinPairingQueueRequest,
  JoinPairingQueueResponse,
  LeaveLobbyRequest,
  LeaveLobbyResponse,
  LeavePairingQueueRequest,
  LeavePairingQueueResponse,
  LobbyListResponse,
  LobbyStateResponse,
  PairingResultResponse,
  PairingStatusResponse,
  PartnerMetricsResponse,
  SelectRoleRequest,
  SelectRoleResponse,
  StartGameRequest,
  StartGameResponse,
} from '../types/besse';

export const lobbyService = {
  async getAvailableLobbies(): Promise<LobbyListResponse> {
    const response = await api.get<LobbyListResponse>('/lobby/available');
    return response.data;
  },

  async joinLobby(data: JoinLobbyRequest): Promise<JoinLobbyResponse> {
    const response = await api.post<JoinLobbyResponse>('/lobby/join', data);
    return response.data;
  },

  async createLobby(): Promise<CreateLobbyResponse> {
    const response = await api.post<CreateLobbyResponse>('/lobby/create');
    return response.data;
  },

  async selectRole(data: SelectRoleRequest): Promise<SelectRoleResponse> {
    const response = await api.post<SelectRoleResponse>('/lobby/select-role', data);
    return response.data;
  },

  async deSelectRole(data: SelectRoleRequest): Promise<SelectRoleResponse> {
    const response = await api.post<SelectRoleResponse>('/lobby/deselect-role', data);
    return response.data;
  },

  async getLobbyState(sessionId: string): Promise<LobbyStateResponse> {
    const response = await api.get<LobbyStateResponse>(`/lobby/${sessionId}`);
    return response.data;
  },

  async leaveLobby(data: LeaveLobbyRequest): Promise<LeaveLobbyResponse> {
    const response = await api.post<LeaveLobbyResponse>('/lobby/leave', data);
    return response.data;
  },

  async continueToRoleSelection(
    data: ContinueToRoleSelectionRequest
  ): Promise<ContinueToRoleSelectionResponse> {
    const response = await api.post<ContinueToRoleSelectionResponse>(
      '/lobby/continue-to-role-selection',
      data
    );
    return response.data;
  },

  async continueToPairing(
    data: ContinueToPairingRequest
  ): Promise<ContinueToPairingResponse> {
    const response = await api.post<ContinueToPairingResponse>(
      '/lobby/continue-to-pairing',
      data
    );
    return response.data;
  },

  async startGame(data: StartGameRequest): Promise<StartGameResponse> {
    const response = await api.post<StartGameResponse>('/lobby/start-game', data);
    return response.data;
  },

  async joinPairingQueue(data: JoinPairingQueueRequest): Promise<JoinPairingQueueResponse> {
    const response = await api.post<JoinPairingQueueResponse>('/lobby/pairing/join', data);
    return response.data;
  },

  async getPairingStatus(sessionId: string): Promise<PairingStatusResponse> {
    const response = await api.get<PairingStatusResponse>(`/lobby/pairing/status/${sessionId}`);
    return response.data;
  },

  async leavePairingQueue(data: LeavePairingQueueRequest): Promise<LeavePairingQueueResponse> {
    const response = await api.post<LeavePairingQueueResponse>('/lobby/pairing/leave', data);
    return response.data;
  },

  async getPartnerMetrics(sessionId: string): Promise<PartnerMetricsResponse> {
    const response = await api.get<PartnerMetricsResponse>(`/lobby/pairing/partner/${sessionId}`);
    return response.data;
  },

  async getPairingResult(sessionId: string): Promise<PairingResultResponse> {
    const response = await api.get<PairingResultResponse>(`/lobby/pairing/result/${sessionId}`);
    return response.data;
  },

  async startNewGame(sessionId: string): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await api.post('/lobby/start-new-game', { sessionId });
    return response.data;
  },
};
