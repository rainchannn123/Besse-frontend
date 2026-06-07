import api from '../config/api';
import {
  ActiveAuctionsResponse,
  BrokerInventoryResponse,
  BuyFromExternalWholesalerRequest,
  BuyFromExternalWholesalerResponse,
  BuyMaterialRequest,
  BuyMaterialResponse,
  ExternalStockResponse,
  MarketplaceResponse,
  PlaceBidRequest,
  PlaceBidResponse,
  ProjectsResponse,
  ResolveAuctionsResponse,
} from '../types/besse';

export const brokerService = {
  async getActiveAuctions(sessionId: string): Promise<ActiveAuctionsResponse> {
    const response = await api.get<ActiveAuctionsResponse>(`/broker/auctions`);
    return response.data;
  },

  async placeBid(data: PlaceBidRequest): Promise<PlaceBidResponse> {
    const response = await api.post<PlaceBidResponse>('/broker/place-bid', data);
    return response.data;
  },

  async resolveExpiredAuctions(sessionId: string): Promise<ResolveAuctionsResponse> {
    const response = await api.post<ResolveAuctionsResponse>(
      `/broker/resolve-auctions/${sessionId}`
    );
    return response.data;
  },

  async buyFromExternalWholesaler(
    data: BuyFromExternalWholesalerRequest
  ): Promise<BuyFromExternalWholesalerResponse> {
    const response = await api.post<BuyFromExternalWholesalerResponse>(
      '/broker/buy-external',
      data
    );
    return response.data;
  },

  async getExternalStock(sessionId: string): Promise<ExternalStockResponse> {
    const response = await api.get<ExternalStockResponse>(`/broker/external-stock/${sessionId}`);
    return response.data;
  },

  async getBrokerInventory(sessionId: string): Promise<BrokerInventoryResponse> {
    const response = await api.get<BrokerInventoryResponse>(`/broker/inventory/${sessionId}`);
    return response.data;
  },

  async getMarketplace(sessionId: string): Promise<MarketplaceResponse> {
    const response = await api.get<MarketplaceResponse>(`/broker/marketplace/${sessionId}`);
    return response.data;
  },

  async getProjects(sessionId: string): Promise<ProjectsResponse> {
    const response = await api.get<ProjectsResponse>(`/broker/projects/${sessionId}`);
    return response.data;
  },

  async buyMaterial(data: BuyMaterialRequest): Promise<BuyMaterialResponse> {
    const response = await api.post<BuyMaterialResponse>('/broker/buy-material', data);
    return response.data;
  },

  async postTransferMunicipalityMaterial(
    sessionId: string,
    projectId: string,
    materialId: string
  ): Promise<any> {
    const response = await api.post(`/broker/transfer-municipality/${sessionId}`, {
      projectId,
      materialId,
    });
    return response.data;
  },

  async postSellExternalMaterial(sessionId: string, materialId: string): Promise<any> {
    const response = await api.post(`/broker/sell-external/${sessionId}`, {
      materialId,
    });
    return response.data;
  },
};
