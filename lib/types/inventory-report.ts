// Types for Inventory Liquidation Report

export interface InventoryReportRow {
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  categoryName: string;
  
  // Unidades
  initialStockUnits: number;
  purchasesUnits: number;
  salesUnits: number;
  finalStockUnits: number;
  
  // Valores monetarios
  initialStockValue: number;
  purchasesValue: number;
  salesValue: number;
  finalStockValue: number;
  
  // Metadatos
  averageCost: number;
}

export interface InventoryReportFilters {
  startDate: Date;
  endDate: Date;
  categoryId?: string;
  productId?: string;
}

export interface InventoryReportParams {
  companyId: string;
  startDate: Date;
  endDate: Date;
  categoryId?: string;
  productId?: string;
}

export interface ExportMetadata {
  companyName: string;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  generatedBy: string;
}

export type ExportFormat = 'excel' | 'csv' | 'pdf';
