import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sale, Product, Customer } from "@/lib/types/erp";
import { canExportToExcel } from "@/lib/utils/plan-limits";

// Verificar acceso antes de exportar
async function checkExportAccess(companyId: string): Promise<{ allowed: boolean; message?: string }> {
  return await canExportToExcel(companyId);
}

// Helper function to expand products with variants for export
function expandProductsWithVariants(products: Product[]) {
  const expandedProducts: any[] = [];
  
  products.forEach(product => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      // Add each active variant as a separate row
      product.variants
        .filter(v => v.is_active)
        .forEach(variant => {
          expandedProducts.push({
            "SKU": variant.sku || product.sku || "",
            "Nombre": `${product.name} - ${variant.variant_name}`,
            "Descripción": product.description || "",
            "Tipo": product.type === "product" ? "Producto" : "Servicio",
            "Categoría": product.category?.name || "",
            "Precio": variant.price || product.price,
            "Costo": product.cost,
            "Moneda": product.currency,
            "Tasa de Impuesto": product.tax_rate,
            "Stock": variant.stock_quantity,
            "Stock Mínimo": variant.min_stock_level,
            "Controla Inventario": product.track_inventory ? "Sí" : "No",
            "Activo": "Sí",
            "Es Variante": "Sí",
            "Producto Padre": product.name,
          });
        });
    } else {
      // Add simple product as single row
      expandedProducts.push({
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
        "Es Variante": "No",
        "Producto Padre": "",
      });
    }
  });
  
  return expandedProducts;
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

// Sales Export (with item details and variant support)
export function exportSalesToExcel(sales: Sale[]) {
  const data: any[] = [];
  
  sales.forEach(sale => {
    if (sale.items && sale.items.length > 0) {
      // Una fila por cada item de la venta
      sale.items.forEach(item => {
        const productName = item.variant_name
          ? `${item.product_name} - ${item.variant_name}`
          : item.product_name;
        
        data.push({
          "Número de Venta": sale.sale_number,
          "Fecha": new Date(sale.sale_date).toLocaleDateString("es-AR"),
          "Cliente": sale.customer?.name || "Sin cliente",
          "Producto": productName,
          "SKU": item.product_sku || "",
          "Cantidad": item.quantity,
          "Precio Unitario": item.unit_price,
          "Subtotal Item": item.subtotal,
          "Total Item": item.total,
          "Estado Venta": sale.status,
          "Estado de Pago": sale.payment_status,
          "Total Venta": sale.total,
          "Moneda": sale.currency,
        });
      });
    } else {
      // Venta sin items (caso edge)
      data.push({
        "Número de Venta": sale.sale_number,
        "Fecha": new Date(sale.sale_date).toLocaleDateString("es-AR"),
        "Cliente": sale.customer?.name || "Sin cliente",
        "Producto": "",
        "SKU": "",
        "Cantidad": 0,
        "Precio Unitario": 0,
        "Subtotal Item": 0,
        "Total Item": 0,
        "Estado Venta": sale.status,
        "Estado de Pago": sale.payment_status,
        "Total Venta": sale.total,
        "Moneda": sale.currency,
      });
    }
  });

  exportToExcel(data, `ventas-${new Date().toISOString().split("T")[0]}`, "Ventas");
}

export function exportSalesToCSV(sales: Sale[]) {
  const data: any[] = [];
  
  sales.forEach(sale => {
    if (sale.items && sale.items.length > 0) {
      // Una fila por cada item de la venta
      sale.items.forEach(item => {
        const productName = item.variant_name
          ? `${item.product_name} - ${item.variant_name}`
          : item.product_name;
        
        data.push({
          "Número de Venta": sale.sale_number,
          "Fecha": new Date(sale.sale_date).toLocaleDateString("es-AR"),
          "Cliente": sale.customer?.name || "Sin cliente",
          "Producto": productName,
          "SKU": item.product_sku || "",
          "Cantidad": item.quantity,
          "Precio Unitario": item.unit_price,
          "Subtotal Item": item.subtotal,
          "Total Item": item.total,
          "Estado Venta": sale.status,
          "Estado de Pago": sale.payment_status,
          "Total Venta": sale.total,
          "Moneda": sale.currency,
        });
      });
    } else {
      // Venta sin items (caso edge)
      data.push({
        "Número de Venta": sale.sale_number,
        "Fecha": new Date(sale.sale_date).toLocaleDateString("es-AR"),
        "Cliente": sale.customer?.name || "Sin cliente",
        "Producto": "",
        "SKU": "",
        "Cantidad": 0,
        "Precio Unitario": 0,
        "Subtotal Item": 0,
        "Total Item": 0,
        "Estado Venta": sale.status,
        "Estado de Pago": sale.payment_status,
        "Total Venta": sale.total,
        "Moneda": sale.currency,
      });
    }
  });

  exportToCSV(data, `ventas-${new Date().toISOString().split("T")[0]}`);
}

// Products Export (with variant support)
export function exportProductsToExcel(products: Product[]) {
  const data = expandProductsWithVariants(products);
  exportToExcel(data, `productos-${new Date().toISOString().split("T")[0]}`, "Productos");
}

export function exportProductsToCSV(products: Product[]) {
  const data = expandProductsWithVariants(products);
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

  // Expand products with variants for table
  const tableData: any[] = [];
  
  products.forEach(product => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      product.variants
        .filter(v => v.is_active)
        .forEach(variant => {
          tableData.push([
            variant.sku || product.sku || "-",
            `${product.name}\n${variant.variant_name}`,
            product.type === "product" ? "Producto" : "Servicio",
            `$${(variant.price || product.price).toFixed(2)}`,
            product.track_inventory ? variant.stock_quantity.toString() : "N/A",
          ]);
        });
    } else {
      tableData.push([
        product.sku || "-",
        product.name,
        product.type === "product" ? "Producto" : "Servicio",
        `$${product.price.toFixed(2)}`,
        product.track_inventory ? product.stock_quantity.toString() : "N/A",
      ]);
    }
  });

  autoTable(doc, {
    startY: 75,
    head: [["SKU", "Nombre", "Tipo", "Precio", "Stock"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      1: { cellWidth: 60 }, // Nombre column wider for variants
    },
  });

  doc.save(`reporte-productos-${new Date().toISOString().split("T")[0]}.pdf`);
}

// PDF Export for Sales List
export function exportSalesToPDF(sales: Sale[], companyName: string = "Mi Empresa") {
  const doc = new jsPDF({ orientation: "landscape" });

  // Title
  doc.setFontSize(18);
  doc.text("Listado de Ventas", 14, 15);

  // Company name
  doc.setFontSize(11);
  doc.text(companyName, 14, 22);

  // Date
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}`, 14, 28);

  // Prepare table data with items
  const tableData: any[] = [];
  
  sales.forEach(sale => {
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach(item => {
        const productName = item.variant_name
          ? `${item.product_name} - ${item.variant_name}`
          : item.product_name;
        
        tableData.push([
          sale.sale_number,
          new Date(sale.sale_date).toLocaleDateString("es-AR"),
          sale.customer?.name || "Sin cliente",
          productName,
          item.quantity.toString(),
          item.unit_price.toFixed(2),
          item.total.toFixed(2),
          sale.status,
        ]);
      });
    } else {
      tableData.push([
        sale.sale_number,
        new Date(sale.sale_date).toLocaleDateString("es-AR"),
        sale.customer?.name || "Sin cliente",
        "-",
        "0",
        "0.00",
        sale.total.toFixed(2),
        sale.status,
      ]);
    }
  });

  autoTable(doc, {
    startY: 35,
    head: [["Número", "Fecha", "Cliente", "Producto", "Cant.", "Precio Unit.", "Total", "Estado"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 45 },
      3: { cellWidth: 70 },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
      7: { cellWidth: 25 },
    },
  });

  doc.save(`ventas-${new Date().toISOString().split("T")[0]}.pdf`);
}

// PDF Export for Products List
export function exportProductsToPDF(products: Product[], companyName: string = "Mi Empresa") {
  const doc = new jsPDF({ orientation: "landscape" });

  // Title
  doc.setFontSize(18);
  doc.text("Listado de Productos", 14, 15);

  // Company name
  doc.setFontSize(11);
  doc.text(companyName, 14, 22);

  // Date
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}`, 14, 28);

  // Prepare table data with variants
  const tableData: any[] = [];
  
  products.forEach(product => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      product.variants
        .filter(v => v.is_active)
        .forEach(variant => {
          tableData.push([
            variant.sku || product.sku || "-",
            `${product.name}\n${variant.variant_name}`,
            product.category?.name || "-",
            (variant.price || product.price).toFixed(2),
            product.cost?.toFixed(2) || "-",
            product.track_inventory ? variant.stock_quantity.toString() : "N/A",
            product.is_active ? "Sí" : "No",
          ]);
        });
    } else {
      tableData.push([
        product.sku || "-",
        product.name,
        product.category?.name || "-",
        product.price.toFixed(2),
        product.cost?.toFixed(2) || "-",
        product.track_inventory ? product.stock_quantity.toString() : "N/A",
        product.is_active ? "Sí" : "No",
      ]);
    }
  });

  autoTable(doc, {
    startY: 35,
    head: [["SKU", "Nombre", "Categoría", "Precio", "Costo", "Stock", "Activo"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 20, halign: "center" },
    },
  });

  doc.save(`productos-${new Date().toISOString().split("T")[0]}.pdf`);
}

// PDF Export for Customers List
export function exportCustomersToPDF(customers: Customer[], companyName: string = "Mi Empresa") {
  const doc = new jsPDF({ orientation: "landscape" });

  // Title
  doc.setFontSize(18);
  doc.text("Listado de Clientes", 14, 15);

  // Company name
  doc.setFontSize(11);
  doc.text(companyName, 14, 22);

  // Date
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}`, 14, 28);

  // Prepare table data
  const tableData = customers.map((customer) => [
    customer.name,
    customer.email || "-",
    customer.phone || "-",
    customer.document_type ? `${customer.document_type}: ${customer.document_number || ""}` : "-",
    customer.city || "-",
    customer.state || "-",
    customer.status,
  ]);

  autoTable(doc, {
    startY: 35,
    head: [["Nombre", "Email", "Teléfono", "Documento", "Ciudad", "Provincia", "Estado"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 45 },
      4: { cellWidth: 35 },
      5: { cellWidth: 30 },
      6: { cellWidth: 25, halign: "center" },
    },
  });

  doc.save(`clientes-${new Date().toISOString().split("T")[0]}.pdf`);
}

// Repairs Export Functions

export function exportRepairsToExcel(repairs: any[]) {
  const data: any[] = [];
  
  repairs.forEach(repair => {
    const r = repair.repair;
    const customerName = (r.customer as any)?.name || 'Sin cliente';
    const technicianName = (r.technician as any)?.name || 'Sin asignar';
    
    // Add main repair row
    data.push({
      "Orden": r.order_number,
      "Fecha Ingreso": new Date(r.received_date).toLocaleDateString("es-AR"),
      "Fecha Entrega": r.delivered_date ? new Date(r.delivered_date).toLocaleDateString("es-AR") : '-',
      "Días": repair.repair_days || '-',
      "Cliente": customerName,
      "Técnico": technicianName,
      "Dispositivo": r.device_type,
      "Marca": r.brand,
      "Modelo": r.model,
      "Estado": r.status,
      "Costo Repuestos": repair.parts_cost,
      "Mano de Obra": r.labor_cost || 0,
      "Costo Total": repair.total_cost,
      "Total Cobrado": repair.total_paid,
      "Saldo": repair.balance,
    });
  });

  exportToExcel(data, `reparaciones-${new Date().toISOString().split("T")[0]}`, "Reparaciones");
}

export function exportRepairsToCSV(repairs: any[]) {
  const data: any[] = [];
  
  repairs.forEach(repair => {
    const r = repair.repair;
    const customerName = (r.customer as any)?.name || 'Sin cliente';
    const technicianName = (r.technician as any)?.name || 'Sin asignar';
    
    data.push({
      "Orden": r.order_number,
      "Fecha Ingreso": new Date(r.received_date).toLocaleDateString("es-AR"),
      "Fecha Entrega": r.delivered_date ? new Date(r.delivered_date).toLocaleDateString("es-AR") : '-',
      "Días": repair.repair_days || '-',
      "Cliente": customerName,
      "Técnico": technicianName,
      "Dispositivo": r.device_type,
      "Marca": r.brand,
      "Modelo": r.model,
      "Estado": r.status,
      "Costo Repuestos": repair.parts_cost,
      "Mano de Obra": r.labor_cost || 0,
      "Costo Total": repair.total_cost,
      "Total Cobrado": repair.total_paid,
      "Saldo": repair.balance,
    });
  });

  exportToCSV(data, `reparaciones-${new Date().toISOString().split("T")[0]}`);
}

export function exportRepairsToPDF(repairs: any[], companyName: string = "Mi Empresa") {
  const doc = new jsPDF({ orientation: "landscape" });

  // Title
  doc.setFontSize(18);
  doc.text("Reporte de Reparaciones Realizadas", 14, 15);

  // Company name
  doc.setFontSize(11);
  doc.text(companyName, 14, 22);

  // Date
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}`, 14, 28);

  // Summary stats
  const totalRepairs = repairs.length;
  const totalRevenue = repairs.reduce((sum, r) => sum + r.total_paid, 0);
  const totalCost = repairs.reduce((sum, r) => sum + r.total_cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgDays = repairs.filter(r => r.repair_days).length > 0
    ? Math.round(repairs.filter(r => r.repair_days).reduce((sum, r) => sum + (r.repair_days || 0), 0) / repairs.filter(r => r.repair_days).length)
    : 0;

  doc.setFontSize(10);
  doc.text(`Total Reparaciones: ${totalRepairs}`, 14, 35);
  doc.text(`Ingresos: $${totalRevenue.toFixed(2)}`, 80, 35);
  doc.text(`Costos: $${totalCost.toFixed(2)}`, 140, 35);
  doc.text(`Ganancia: $${totalProfit.toFixed(2)}`, 200, 35);
  doc.text(`Tiempo Promedio: ${avgDays} días`, 14, 42);

  // Prepare table data
  const tableData: any[] = [];
  
  repairs.forEach(repair => {
    const r = repair.repair;
    const customerName = (r.customer as any)?.name || 'Sin cliente';
    const technicianName = (r.technician as any)?.name || 'Sin asignar';
    
    tableData.push([
      r.order_number.toString(),
      new Date(r.received_date).toLocaleDateString("es-AR"),
      r.delivered_date ? new Date(r.delivered_date).toLocaleDateString("es-AR") : '-',
      customerName,
      `${r.device_type}\n${r.brand} ${r.model}`,
      technicianName,
      repair.total_cost.toFixed(2),
      repair.total_paid.toFixed(2),
      r.status,
    ]);
  });

  autoTable(doc, {
    startY: 50,
    head: [["Orden", "Ingreso", "Entrega", "Cliente", "Dispositivo", "Técnico", "Costo", "Cobrado", "Estado"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontSize: 7 },
    styles: { fontSize: 6, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 40 },
      4: { cellWidth: 50 },
      5: { cellWidth: 35 },
      6: { cellWidth: 25, halign: "right" },
      7: { cellWidth: 25, halign: "right" },
      8: { cellWidth: 25, halign: "center" },
    },
  });

  doc.save(`reparaciones-${new Date().toISOString().split("T")[0]}.pdf`);
}

// Print function for repairs report
export function printRepairsReport(repairs: any[], companyName: string = "Mi Empresa") {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes para imprimir');
    return;
  }

  const totalRepairs = repairs.length;
  const totalRevenue = repairs.reduce((sum, r) => sum + r.total_paid, 0);
  const totalCost = repairs.reduce((sum, r) => sum + r.total_cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgDays = repairs.filter(r => r.repair_days).length > 0
    ? Math.round(repairs.filter(r => r.repair_days).reduce((sum, r) => sum + (r.repair_days || 0), 0) / repairs.filter(r => r.repair_days).length)
    : 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Reparaciones</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          font-size: 12px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        h2 {
          font-size: 16px;
          color: #666;
          margin-top: 0;
        }
        .header {
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .summary {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .summary-item {
          padding: 10px;
          background: white;
          border-radius: 3px;
        }
        .summary-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 5px;
        }
        .summary-value {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          font-size: 10px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reporte de Reparaciones Realizadas</h1>
        <h2>${companyName}</h2>
        <p>Generado: ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}</p>
      </div>

      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total Reparaciones</div>
            <div class="summary-value">${totalRepairs}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Ingresos Totales</div>
            <div class="summary-value">$${totalRevenue.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Ganancia Total</div>
            <div class="summary-value">$${totalProfit.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Costos Totales</div>
            <div class="summary-value">$${totalCost.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Tiempo Promedio</div>
            <div class="summary-value">${avgDays} días</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Margen Promedio</div>
            <div class="summary-value">${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center">Orden</th>
            <th>Fecha Ingreso</th>
            <th>Fecha Entrega</th>
            <th>Cliente</th>
            <th>Dispositivo</th>
            <th>Técnico</th>
            <th class="text-right">Costo</th>
            <th class="text-right">Cobrado</th>
            <th class="text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${repairs.map(repair => {
            const r = repair.repair;
            const customerName = (r.customer as any)?.name || 'Sin cliente';
            const technicianName = (r.technician as any)?.name || 'Sin asignar';
            
            return `
              <tr>
                <td class="text-center">#${r.order_number}</td>
                <td>${new Date(r.received_date).toLocaleDateString("es-AR")}</td>
                <td>${r.delivered_date ? new Date(r.delivered_date).toLocaleDateString("es-AR") : '-'}</td>
                <td>${customerName}</td>
                <td>${r.device_type} ${r.brand} ${r.model}</td>
                <td>${technicianName}</td>
                <td class="text-right">$${repair.total_cost.toFixed(2)}</td>
                <td class="text-right">$${repair.total_paid.toFixed(2)}</td>
                <td class="text-center">${r.status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Este reporte fue generado automáticamente por el sistema ERP</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
