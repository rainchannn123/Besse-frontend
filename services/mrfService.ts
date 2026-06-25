import api from '../config/api';
import {
  AssignGradeRequest,
  AssignGradeResponse,
  MRFInventoryResponse,
  MRFQueueResponse,
  MRFSendBackToMunicipalityResponse,
  PendingAuctionsResponse,
  ProcessWasteRequest,
  ProcessWasteResponse,
} from '../types/besse';

interface SendBackToMunicipalityRequest {
  auctionId: string;
  sessionId: string;
  mode: 'fast' | 'slow';
}

export const mrfService = {
    async processWaste(data: ProcessWasteRequest): Promise<ProcessWasteResponse> {
    const response = await api.post<ProcessWasteResponse>('/mrf/process-waste', data);
    return response.data;
  },

  async sendToLandfill(data: ProcessWasteRequest): Promise<ProcessWasteResponse> {
    const response = await api.post<ProcessWasteResponse>('/mrf/to-landfill', data);
    return response.data;
  },


  async assignGrade(data: AssignGradeRequest): Promise<AssignGradeResponse> {
    const response = await api.post<AssignGradeResponse>('/mrf/assign-grade', data);
    return response.data;
  },

  async getMRFQueue(sessionId: string): Promise<MRFQueueResponse> {
    const response = await api.get<MRFQueueResponse>(`/mrf/queue/${sessionId}`);
    return response.data;
  },

  async getMRFInventory(sessionId: string): Promise<MRFInventoryResponse> {
    const response = await api.get<MRFInventoryResponse>(`/mrf/inventory/${sessionId}`);
    return response.data;
  },

    async getPendingAuctions(sessionId: string): Promise<PendingAuctionsResponse> {
    const response = await api.get<PendingAuctionsResponse>(`/mrf/pending-auctions/${sessionId}`);
    return response.data;
  },

  async sendBackToMunicipalityWithTransport(
    sessionId: string,
    data: SendBackToMunicipalityRequest
  ): Promise<MRFSendBackToMunicipalityResponse> {
    const response = await api.post<MRFSendBackToMunicipalityResponse>(
      `/mrf/send-back-to-municipality/${sessionId}`,
      data
    );
    return response.data;
  },
};
