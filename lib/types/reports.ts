// Advanced Reports Types

// ============================================
// Inventory Liquidation Report Types
// ============================================

export interface ProductMovement {
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  categoryName: string;
  units: number;
  value: number;
  turnoverRate?: number;
}

export interface CategoryLiquidation {
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  totalMovements: number;
  totalPurchaseValue: number;
  totalSalesValue: number;
  totalProfit: number;
  profitMargin: number;
}

export interface SupplierLiquidation {
  supplierId: string;
  supplierName: string;
  totalProducts: number;
  totalPurchases: number;
  totalPurchaseValue: number;
  averageCost: number;
}

export interface PeriodComparison {
  period1: {
    startDate: Date;
    endDate: Date;
    totalSales: number;
    totalPurchases: number;
    totalProfit: number;
  };
  period2: {
    startDate: Date;
    endDate: Date;
    totalSales: number;
    totalPurchases: number;
    totalProfit: number;
  };
  changes: {
    salesChange: number;
    salesChangePercent: number;
    purchasesChange: number;
    purchasesChangePercent: number;
    profitChange: number;
    profitChangePercent: number;
  };
}

export interface InventoryLiquidationReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalProducts: number;
    totalMovements: number;
    totalPurchaseValue: number;
    totalSalesValue: number;
    totalProfit: number;
    profitMargin: number;
  };
  byCategory: CategoryLiquidation[];
  byProduct: ProductMovement[];
  bySupplier: SupplierLiquidation[];
  topMovers: ProductMovement[];
  slowMovers: ProductMovement[];
}

// ============================================
// Accounts Settlement Report Types
// ============================================

export interface AccountMovement {
  id: string;
  date: Date;
  type: 'sale' | 'payment' | 'purchase' | 'credit_note' | 'debit_note';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

export interface AgingAnalysis {
  current: number;      // 0-30 días
  days30to60: number;   // 31-60 días
  days61to90: number;   // 61-90 días
  over90: number;       // +90 días
}

export interface AccountDetail {
  entityId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  currentBalance: number;
  overdueAmount: number;
  dueAmount: number;
  movements: AccountMovement[];
  paymentScore: number;
  averagePaymentDays: number;
}

export interface CashFlowProjection {
  date: Date;
  expectedIncome: number;
  expectedExpenses: number;
  projectedBalance: number;
}

export interface AccountsSettlementReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalReceivable: number;
    totalPayable: number;
    netBalance: number;
    overdueReceivable: number;
    overduePayable: number;
  };
  receivables: AccountDetail[];
  payables: AccountDetail[];
  aging: AgingAnalysis;
  projections: CashFlowProjection[];
}

// ============================================
// Cash Status Report Types
// ============================================

export interface CashOpening {
  id: string;
  openingDate: Date;
  shift: string;
  openedBy: string;
  openedByName: string;
  initialCashAmount: number;
}

export interface CashClosure {
  id: string;
  closureDate: Date;
  shift: string;
  closedBy: string;
  closedByName: string;
  totalSalesCount: number;
  totalSalesAmount: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  otherSales: number;
  cashCounted?: number;
  cashDifference?: number;
}

export interface DailyCashStatus {
  date: Date;
  openings: CashOpening[];
  closures: CashClosure[];
  totalSales: number;
  totalDifferences: number;
  efficiency: number;
}

export interface ShiftAnalysis {
  shift: string;
  totalOpenings: number;
  totalClosures: number;
  totalSales: number;
  averageSales: number;
  totalDifferences: number;
  averageDifference: number;
}

export interface PaymentMethodBreakdown {
  cash: number;
  card: number;
  transfer: number;
  other: number;
  total: number;
}

export interface CashTrend {
  date: Date;
  sales: number;
  differences: number;
  efficiency: number;
}

export interface CashPeriodComparison {
  period1: {
    startDate: Date;
    endDate: Date;
    totalSales: number;
    totalDifferences: number;
    averageEfficiency: number;
  };
  period2: {
    startDate: Date;
    endDate: Date;
    totalSales: number;
    totalDifferences: number;
    averageEfficiency: number;
  };
  changes: {
    salesChange: number;
    salesChangePercent: number;
    differencesChange: number;
    differencesChangePercent: number;
    efficiencyChange: number;
  };
}

export interface CashStatusReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalOpenings: number;
    totalClosures: number;
    totalSales: number;
    totalCashSales: number;
    totalDifferences: number;
    averageDifference: number;
  };
  daily: DailyCashStatus[];
  byShift: ShiftAnalysis[];
  byPaymentMethod: PaymentMethodBreakdown;
  trends: CashTrend[];
}

// ============================================
// Current Account Report Types
// ============================================

export interface CurrentAccountReport {
  entityId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  currentBalance: number;
  creditLimit?: number;
  movements: AccountMovement[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    oldestMovement: Date;
    lastMovement: Date;
    averagePaymentDays: number;
  };
  aging: AgingAnalysis;
}

// ============================================
// Filter Types
// ============================================

export interface InventoryReportFilters {
  startDate: Date;
  endDate: Date;
  categoryIds?: string[];
  productIds?: string[];
  supplierIds?: string[];
  groupBy?: 'category' | 'product' | 'supplier';
}

export interface AccountsReportFilters {
  startDate: Date;
  endDate: Date;
  entityType?: 'customer' | 'supplier' | 'both';
  status?: 'current' | 'overdue' | 'due_soon';
  minAmount?: number;
  maxAmount?: number;
}

export interface CashReportFilters {
  startDate: Date;
  endDate: Date;
  shift?: string;
  userId?: string;
}

export interface CurrentAccountFilters {
  startDate?: Date;
  endDate?: Date;
  movementTypes?: string[];
}

// ============================================
// Export Types
// ============================================

export interface CompanyInfo {
  name: string;
  logo?: string;
  currency: string;
}

export interface ReportMetadata {
  companyInfo: CompanyInfo;
  generatedAt: Date;
  generatedBy: string;
  reportType: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
}
