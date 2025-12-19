
export interface GroceryItem {
  id: string;
  name: string;
  category?: string;
}

export interface MarketProduct {
  name: string;
  price: number;
  unit: string;
  category: string;
  isCheapest: boolean;
  isPrivateLabel?: boolean;
}

export interface Market {
  id: string;
  name: string;
  address: string;
  distance: string;
  lat: number;
  lng: number;
  officialUrl?: string;
  flyerUrl?: string;
  products: { [itemName: string]: MarketProduct };
  totalCost: number;
}

export interface OptimizationResult {
  markets: Market[];
  summary: {
    totalOriginalEstimate: number;
    totalOptimizedCost: number;
    savings: number;
    currencySymbol: string;
  };
}

export interface SavedList {
  id: string;
  name: string;
  iconName: string;
  items: GroceryItem[];
  createdAt: number;
}
