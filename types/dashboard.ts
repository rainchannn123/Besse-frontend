export interface MunicipalityData {
  id: string;
  name: string;
  city: string;
  inventory: InventoryItem[];
  orders: Order[];
}

export interface InventoryItem {
  id: string;
  material: string;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  material: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface MRFCollectionData {
  id: string;
  location: string;
  materials: Material[];
  collectedAt: string;
}

export interface Material {
  type: string;
  weight: number;
  quality: string;
}

export interface BrokerData {
  id: string;
  name: string;
  inventory: InventoryItem[];
  relationships: string[];
}

export interface LeaderBoardData {
  rank: number;
  user: string;
  score: number;
}

export interface MarketPlaceData {
  items: MarketItem[];
  vendors: Vendor[];
}

export interface MarketItem {
  id: string;
  name: string;
  price: number;
  seller: string;
}

export interface Vendor {
  id: string;
  name: string;
  items: MarketItem[];
}

// Add more as needed for other dashboards