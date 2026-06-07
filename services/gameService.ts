import api from '../config/api';
import { EndTurnResponse, GameStateResponse, PairDetailsResponse, PlayerRoleResponse } from '../types/besse';

export const gameService = {
  async getGameState(sessionId: string): Promise<GameStateResponse> {
    const response = await api.get<GameStateResponse>(`/games/${sessionId}`);
    return response.data;
  },

  async getPlayerRole(sessionId: string): Promise<PlayerRoleResponse> {
    const response = await api.get<PlayerRoleResponse>(`/games/${sessionId}/player-role`);
    return response.data;
  },

  async endTurn(sessionId: string): Promise<EndTurnResponse> {
    const response = await api.post<EndTurnResponse>(`/games/${sessionId}/end-turn`);
    return response.data;
  },

  async getPairDetails(pairId: string): Promise<PairDetailsResponse> {
    const response = await api.get<PairDetailsResponse>(`/games/pair/${pairId}/details`);
    return response.data;
  },
};
