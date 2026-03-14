import api from '../config/api';
import {
  BrokerMaterialsResponse,
  CityProjectsResponse,
  CollectWasteRequest,
  CollectWasteResponse,
  ConstructProjectRequest,
  ConstructProjectResponse,
  PlaceOrderRequest,
  PlaceOrderResponse,
  RejectWasteRequest,
  RejectWasteResponse,
  WasteBatchesResponse,
} from '../types/besse';

export const municipalityService = {
  async collectWaste(sessionId: string, data: CollectWasteRequest): Promise<CollectWasteResponse> {
    const response = await api.post<CollectWasteResponse>(
      `/municipality/collect-waste/${sessionId}`,
      data
    );
    return response.data;
  },

  async rejectWaste(data: RejectWasteRequest): Promise<RejectWasteResponse> {
    const response = await api.post<RejectWasteResponse>('/municipality/reject-waste', data);
    return response.data;
  },

  async getWasteBatches(sessionId: string): Promise<WasteBatchesResponse> {
    const response = await api.get<WasteBatchesResponse>(
      `/municipality/waste-batches/${sessionId}`
    );
    return response.data;
  },

  async viewBrokerMaterials(sessionId: string): Promise<BrokerMaterialsResponse> {
    const response = await api.get<BrokerMaterialsResponse>(
      `/municipality/broker-materials/${sessionId}`
    );
    return response.data;
  },

  async placeOrder(sessionId: string, data: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    const response = await api.post<PlaceOrderResponse>(
      `/municipality/place-order/${sessionId}`,
      data
    );
    return response.data;
  },

  async getCityProjects(sessionId: string): Promise<CityProjectsResponse> {
    const response = await api.get<CityProjectsResponse>(
      `/municipality/city-projects/${sessionId}`
    );
    return response.data;
  },

  async constructProject(
    sessionId: string,
    data: ConstructProjectRequest
  ): Promise<ConstructProjectResponse> {
    const response = await api.post<ConstructProjectResponse>(
      `/municipality/construct-project/${sessionId}`,
      data
    );
    return response.data;
  },
};
