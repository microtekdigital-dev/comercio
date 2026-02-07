import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sale, Product, Customer } from "@/lib/types/erp";
import { canExportToExcel } from "@/lib/utils/plan-limits";

// Verificar acceso antes de exportar
async function checkExportAccess(companyId: string): Promise<{ allowed: boolean; message?: string }> {
  return await canExportToExcel(companyId);
}

// Export to Excel/CSV
export function exportToExcel(data: any[], filename: string, sheetName: string = "Data") {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Sales Export
export function exportSalesToExcel(sales: Sale[]) {
  const data = sales.map((sale) => ({
    "Número": sale.sale_number,
    "Fecha": new Date(sale.sale_date).toLocaleDateString("es-AR"),
    "Cliente": sale.customer?.name || "Sin cliente",
    "Estado": sale.status,
    "Estado de Pago": sale.payment_status,
    "Subtotal": sale.subtotal,
    "Impuestos": sale.tax_amount,
    "Descuento": sale.discount_amount,
    "Total": sale.total,
    "Moneda": sale.currency,
    "Método de Pago": sale.payment_method || "",
    "Items": sale.items?.length || 0,
    "Notas": sale.notes || "",
  }));

  exportToExcel(data, `ventas-${new Date().toISOString().split("T")[0]}`, "Ventas");
}

export function exportSalesToCSV(sales: Sale[]) {
  const data = sales.map((sale) => ({
    "Número": sale.sale_number,
    "Fecha": new Date(sale.sale_date).toLocaleDateString("es-AR"),
    "Cliente": sale.customer?.name || "Sin cliente",
    "Estado": sale.status,
    "Estado de Pago": sale.payment_status,
    "Subtotal": sale.subtotal,
    "Impuestos": sale.tax_amount,
    "Descuento": sale.discount_amount,
    "Total": sale.total,
    "Moneda": sale.currency,
    "Método de Pago": sale.payment_method || "",
    "Items": sale.items?.length || 0,
    "Notas": sale.notes || "",
  }));

  exportToCSV(data, `ventas-${new Date().toISOString().split("T")[0]}`);
}

// Products Export
export function exportProductsToExcel(products: Product[]) {
  const data = products.map((product) => ({
    "SKU": product.sku || "",
    "Nombre": product.name,
    "Descripción": product.description || "",
    "Tipo": product.type === "product" ? "Producto" : "Servicio",
    "Categoría": product.category?.name || "",
    "Precio": product.price,
    "Costo": product.cost,
    "Moneda": product.currency,
    "Tasa de Impuesto": product.tax_rate,
    "Stock": product.stock_quantity,
    "Stock Mínimo": product.min_stock_level,
    "Controla Inventario": product.track_inventory ? "Sí" : "No",
    "Activo": product.is_active ? "Sí" : "No",
  }));

  exportToExcel(data, `productos-${new Date().toISOString().split("T")[0]}`, "Productos");
}

export function exportProductsToCSV(products: Product[]) {
  const data = products.map((product) => ({
    "SKU": product.sku || "",
    "Nombre": product.name,
    "Descripción": product.description || "",
    "Tipo": product.type === "product" ? "Producto" : "Servicio",
    "Categoría": product.category?.name || "",
    "Precio": product.price,
    "Costo": product.cost,
    "Moneda": product.currency,
    "Tasa de Impuesto": product.tax_rate,
    "Stock": product.stock_quantity,
    "Stock Mínimo": product.min_stock_level,
    "Controla Inventario": product.track_inventory ? "Sí" : "No",
    "Activo": product.is_active ? "Sí" : "No",
  }));

  exportToCSV(data, `productos-${new Date().toISOString().split("T")[0]}`);
}

// Customers Export
export function exportCustomersToExcel(customers: Customer[]) {
  const data = customers.map((customer) => ({
    "Nombre": customer.name,
    "Email": customer.email || "",
    "Teléfono": customer.phone || "",
    "Tipo de Documento": customer.document_type || "",
    "Número de Documento": customer.document_number || "",
    "Dirección": customer.address || "",
    "Ciudad": customer.city || "",
    "Provincia": customer.state || "",
    "País": customer.country,
    "Código Postal": customer.postal_code || "",
    "Estado": customer.status,
    "Notas": customer.notes || "",
  }));

  exportToExcel(data, `clientes-${new Date().toISOString().split("T")[0]}`, "Clientes");
}

export function exportCustomersToCSV(customers: Customer[]) {
  const data = customers.map((customer) => ({
    "Nombre": customer.name,
    "Email": customer.email || "",
    "Teléfono": customer.phone || "",
    "Tipo de Documento": customer.document_type || "",
    "Número de Documento": customer.document_number || "",
    "Dirección": customer.address || "",
    "Ciudad": customer.city || "",
    "Provincia": customer.state || "",
    "País": customer.country,
    "Código Postal": customer.postal_code || "",
    "Estado": customer.status,
    "Notas": customer.notes || "",
  }));

  exportToCSV(data, `clientes-${new Date().toISOString().split("T")[0]}`);
}

// PDF Export for Reports
export function exportSalesReportToPDF(
  sales: Sale[],
  stats: {
    totalRevenue: number;
    totalSales: number;
    averageTicket: number;
  },
  companyName: string = "Mi Empresa"
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text("Reporte de Ventas", 14, 20);

  // Company name
  doc.setFontSize(12);
  doc.text(companyName, 14, 28);

  // Date
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 14, 35);

  // Stats
  doc.setFontSize(12);
  doc.text("Resumen", 14, 45);
  doc.setFontSize(10);
  doc.text(`Total de Ventas: ${stats.totalSales}`, 14, 52);
  doc.text(`Ingresos Totales: $${stats.totalRevenue.toFixed(2)}`, 14, 59);
  doc.text(`Ticket Promedio: $${stats.averageTicket.toFixed(2)}`, 14, 66);

  // Table
  const tableData = sales.map((sale) => [
    sale.sale_number,
    new Date(sale.sale_date).toLocaleDateString("es-AR"),
    sale.customer?.name || "Sin cliente",
    sale.status,
    `$${sale.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [["Número", "Fecha", "Cliente", "Estado", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  doc.save(`reporte-ventas-${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportProductsReportToPDF(
  products: Product[],
  stats: {
    totalProducts: number;
    lowStockProducts: number;
    totalValue: number;
  },
  companyName: string = "Mi Empresa"
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text("Reporte de Productos", 14, 20);

  // Company name
  doc.setFontSize(12);
  doc.text(companyName, 14, 28);

  // Date
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 14, 35);

  // Stats
  doc.setFontSize(12);
  doc.text("Resumen", 14, 45);
  doc.setFontSize(10);
  doc.text(`Total de Productos: ${stats.totalProducts}`, 14, 52);
  doc.text(`Productos con Stock Bajo: ${stats.lowStockProducts}`, 14, 59);
  doc.text(`Valor Total de Inventario: $${stats.totalValue.toFixed(2)}`, 14, 66);

  // Table
  const tableData = products.map((product) => [
    product.sku || "-",
    product.name,
    product.type === "product" ? "Producto" : "Servicio",
    `$${product.price.toFixed(2)}`,
    product.track_inventory ? product.stock_quantity.toString() : "N/A",
  ]);

  autoTable(doc, {
    startY: 75,
    head: [["SKU", "Nombre", "Tipo", "Precio", "Stock"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  doc.save(`reporte-productos-${new Date().toISOString().split("T")[0]}.pdf`);
}
