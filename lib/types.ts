export interface OverviewMetrics {
  totalRevenue: number;
  totalQty: number;
  totalInvoices: number;
  totalStores: number;
  totalSkus: number;
  avgRevenuePerStore: number;
}

export interface MonthlyTrend {
  period: string;
  revenue: number;
  qty: number;
  stores: number;
}

export interface TopStore {
  storeName: string;
  revenue: number;
  qty: number;
  skus: number;
}

export interface RegionSplit {
  region: string;
  revenue: number;
  qty: number;
  stores: number;
}

export interface Freshness {
  latestDate: string | null;
  earliestDate: string | null;
  totalRows: number;
}

export interface OverviewData {
  metrics: OverviewMetrics;
  monthlyTrend: MonthlyTrend[];
  topStores: TopStore[];
  regionSplit: RegionSplit[];
  freshness: Freshness;
}

export interface StoreData {
  storeName: string;
  region: string;
  storeType: string;
  revenue: number;
  qty: number;
  skus: number;
  invoices: number;
  avgPrice: number;
  monthly: Array<{ period: string; revenue: number; qty: number }>;
}

export interface ProductData {
  itemCode: string;
  itemName: string;
  revenue: number;
  qty: number;
  storesSold: number;
  avgPrice: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  qty: number;
  skus: number;
}
