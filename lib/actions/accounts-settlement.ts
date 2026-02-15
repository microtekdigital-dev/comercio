import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sale, PurchaseOrder } from "@/lib/types/erp";
import type {
  AccountReceivable,
  AccountPayable,
  FinancialSummary,
  ExportData,
} from "@/lib/types/accounts-settlement";

// Calculate balance (total - sum of payments)
export function calculateBalance(total: number, payments: { amount: number }[]): number {
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return total - paid;
}

// Calculate days overdue (cutoffDate - transactionDate)
export function calculateDaysOverdue(cutoffDate: Date, transactionDate: Date): number {
  const diff = cutoffDate.getTime() - new Date(transactionDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Filter by payment status
export function filterByPaymentStatus<T extends { payment_status: string }>(
  transactions: T[],
  statuses: string[]
): T[] {
  return transactions.filter(t => statuses.includes(t.payment_status));
}

// Filter by date (transaction date <= cutoffDate)
export function filterByDate<T extends { sale_date?: string; order_date?: string }>(
  transactions: T[],
  cutoffDate: Date
): T[] {
  return transactions.filter(t => {
    const transactionDate = new Date(t.sale_date || t.order_date || "");
    return transactionDate <= cutoffDate;
  });
}

// Sort by days overdue (descending)
export function sortByDaysOverdue<T extends { daysOverdue: number }>(accounts: T[]): T[] {
  return [...accounts].sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// Calculate financial summary
export function calculateFinancialSummary(
  receivables: AccountReceivable[],
  payables: AccountPayable[]
): FinancialSummary {
  const totalReceivable = receivables.reduce((sum, r) => sum + r.balance, 0);
  const totalPayable = payables.reduce((sum, p) => sum + p.balance, 0);
  const netBalance = totalReceivable - totalPayable;

  return {
    totalReceivable,
    totalPayable,
    netBalance,
  };
}

// Process sales into accounts receivable
export function processAccountsReceivable(
  sales: Sale[],
  cutoffDate: Date
): AccountReceivable[] {
  const pendingSales = filterByPaymentStatus(sales, ["pending", "partial"]);
  const filteredSales = filterByDate(pendingSales, cutoffDate);

  const accounts = filteredSales.map(sale => {
    const paid = (sale.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = sale.total - paid;
    const daysOverdue = calculateDaysOverdue(cutoffDate, new Date(sale.sale_date));

    return {
      id: sale.id,
      saleNumber: sale.sale_number,
      customerName: sale.customer?.name || "Cliente General",
      saleDate: new Date(sale.sale_date),
      total: sale.total,
      paid,
      balance,
      daysOverdue,
    };
  });

  return sortByDaysOverdue(accounts);
}

// Process purchase orders into accounts payable
export function processAccountsPayable(
  orders: PurchaseOrder[],
  cutoffDate: Date
): AccountPayable[] {
  const pendingOrders = filterByPaymentStatus(orders, ["pending", "partial"]);
  const filteredOrders = filterByDate(pendingOrders, cutoffDate);

  const accounts = filteredOrders.map(order => {
    const paid = (order.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = order.total - paid;
    const daysOverdue = calculateDaysOverdue(cutoffDate, new Date(order.order_date));

    return {
      id: order.id,
      orderNumber: order.order_number,
      supplierName: order.supplier?.name || "Sin proveedor",
      orderDate: new Date(order.order_date),
      total: order.total,
      paid,
      balance,
      daysOverdue,
    };
  });

  return sortByDaysOverdue(accounts);
}

// Export to Excel
export function exportAccountsSettlementToExcel(data: ExportData): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Resumen
  const summaryData = [
    ["Reporte de Liquidación de Cuentas"],
    ["Empresa:", data.companyName],
    ["Fecha de Corte:", data.cutoffDate.toLocaleDateString("es-AR")],
    ["Generado:", data.generatedAt.toLocaleDateString("es-AR") + " " + data.generatedAt.toLocaleTimeString("es-AR")],
    [],
    ["Resumen Financiero"],
    ["Total Cuentas por Cobrar:", data.summary.totalReceivable],
    ["Total Cuentas por Pagar:", data.summary.totalPayable],
    ["Balance Neto:", data.summary.netBalance],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  // Sheet 2: Cuentas por Cobrar
  const receivablesData = data.accountsReceivable.map(r => ({
    "Cliente": r.customerName,
    "Fecha Venta": r.saleDate.toLocaleDateString("es-AR"),
    "Total": r.total,
    "Pagado": r.paid,
    "Saldo Pendiente": r.balance,
    "Días Vencido": r.daysOverdue,
  }));
  const receivablesSheet = XLSX.utils.json_to_sheet(receivablesData);
  XLSX.utils.book_append_sheet(workbook, receivablesSheet, "Cuentas por Cobrar");

  // Sheet 3: Cuentas por Pagar
  const payablesData = data.accountsPayable.map(p => ({
    "Proveedor": p.supplierName,
    "Fecha Orden": p.orderDate.toLocaleDateString("es-AR"),
    "Total": p.total,
    "Pagado": p.paid,
    "Saldo Pendiente": p.balance,
    "Días Vencido": p.daysOverdue,
  }));
  const payablesSheet = XLSX.utils.json_to_sheet(payablesData);
  XLSX.utils.book_append_sheet(workbook, payablesSheet, "Cuentas por Pagar");

  // Generate filename with cutoff date
  const filename = `liquidacion-cuentas-${data.cutoffDate.toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// Export to PDF
export function exportAccountsSettlementToPDF(data: ExportData): void {
  const doc = new jsPDF({ orientation: "landscape" });

  // Title
  doc.setFontSize(18);
  doc.text("Reporte de Liquidación de Cuentas", 14, 15);

  // Company name
  doc.setFontSize(11);
  doc.text(data.companyName, 14, 22);

  // Date info
  doc.setFontSize(9);
  doc.text(`Fecha de Corte: ${data.cutoffDate.toLocaleDateString("es-AR")}`, 14, 28);
  doc.text(`Generado: ${data.generatedAt.toLocaleDateString("es-AR")} ${data.generatedAt.toLocaleTimeString("es-AR")}`, 14, 33);

  // Summary section
  doc.setFontSize(12);
  doc.text("Resumen Financiero", 14, 43);
  doc.setFontSize(9);
  doc.text(`Total Cuentas por Cobrar: $${data.summary.totalReceivable.toFixed(2)}`, 14, 50);
  doc.text(`Total Cuentas por Pagar: $${data.summary.totalPayable.toFixed(2)}`, 14, 56);
  doc.text(`Balance Neto: $${data.summary.netBalance.toFixed(2)}`, 14, 62);

  // Accounts Receivable Table
  doc.setFontSize(11);
  doc.text("Cuentas por Cobrar", 14, 72);

  const receivablesTableData = data.accountsReceivable.map(r => [
    r.customerName,
    r.saleDate.toLocaleDateString("es-AR"),
    `$${r.total.toFixed(2)}`,
    `$${r.paid.toFixed(2)}`,
    `$${r.balance.toFixed(2)}`,
    r.daysOverdue.toString(),
  ]);

  autoTable(doc, {
    startY: 76,
    head: [["Cliente", "Fecha Venta", "Total", "Pagado", "Saldo Pendiente", "Días Vencido"]],
    body: receivablesTableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  // Accounts Payable Table
  const finalY = (doc as any).lastAutoTable.finalY || 76;
  doc.setFontSize(11);
  doc.text("Cuentas por Pagar", 14, finalY + 10);

  const payablesTableData = data.accountsPayable.map(p => [
    p.supplierName,
    p.orderDate.toLocaleDateString("es-AR"),
    `$${p.total.toFixed(2)}`,
    `$${p.paid.toFixed(2)}`,
    `$${p.balance.toFixed(2)}`,
    p.daysOverdue.toString(),
  ]);

  autoTable(doc, {
    startY: finalY + 14,
    head: [["Proveedor", "Fecha Orden", "Total", "Pagado", "Saldo Pendiente", "Días Vencido"]],
    body: payablesTableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  // Generate filename with cutoff date
  const filename = `liquidacion-cuentas-${data.cutoffDate.toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
