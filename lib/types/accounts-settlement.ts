// Types for Accounts Settlement Report

export interface AccountReceivable {
  id: string;
  saleNumber: string;
  customerName: string;
  saleDate: Date;
  total: number;
  paid: number;
  balance: number;          // Calculated: total - paid
  daysOverdue: number;      // Calculated: cutoffDate - saleDate
}

export interface AccountPayable {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: Date;
  total: number;
  paid: number;
  balance: number;          // Calculated: total - paid
  daysOverdue: number;      // Calculated: cutoffDate - orderDate
}

export interface FinancialSummary {
  totalReceivable: number;  // Sum of all receivable balances
  totalPayable: number;     // Sum of all payable balances
  netBalance: number;       // totalReceivable - totalPayable
}

export interface ExportData {
  cutoffDate: Date;
  summary: FinancialSummary;
  accountsReceivable: AccountReceivable[];
  accountsPayable: AccountPayable[];
  companyName: string;
  currency: string;
  generatedAt: Date;
}
