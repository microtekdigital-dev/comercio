"use server";

import { createClient } from "@/lib/supabase/server";
import type { InventoryReportRow, InventoryReportParams, ExportMetadata, ExportFormat } from "@/lib/types/inventory-report";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Calculate initial stock for all products before the start date
 * Sums all stock movements with movement_date < start_date
 * For products without movements, uses products.stock_quantity as fallback
 * Calculates value based on average cost from purchase orders
 */
export async function calculateInitialStock(
  companyId: string,
  startDate: Date,
  categoryId?: string,
  productId?: string
) {
  const supabase = await createClient();

  // First, get stock movements before start date
  let movementsQuery = supabase
    .from("stock_movements")
    .select(`
      product_id,
      variant_id,
      quantity,
      products!inner(
        name,
        category_id
      ),
      product_variants(
        variant_name
      )
    `)
    .eq("company_id", companyId)
    .lt("created_at", startDate.toISOString());

  // Apply filters
  if (categoryId) {
    movementsQuery = movementsQuery.eq("products.category_id", categoryId);
  }
  if (productId) {
    movementsQuery = movementsQuery.eq("product_id", productId);
  }

  const { data: movements, error: movementsError } = await movementsQuery;

  if (movementsError) {
    console.error("Error calculating initial stock:", movementsError);
    console.error("Error details:", JSON.stringify(movementsError, null, 2));
    throw new Error(`Error al calcular existencia inicial: ${movementsError.message || 'Error desconocido'}`);
  }

  // Get all products to use as fallback for products without movements
  let productsQuery = supabase
    .from("products")
    .select(`
      id,
      name,
      stock_quantity,
      cost,
      category_id,
      categories(name),
      product_variants(
        id,
        variant_name,
        stock_quantity
      )
    `)
    .eq("company_id", companyId);

  if (categoryId) {
    productsQuery = productsQuery.eq("category_id", categoryId);
  }
  if (productId) {
    productsQuery = productsQuery.eq("id", productId);
  }

  const { data: products, error: productsError } = await productsQuery;

  if (productsError) {
    console.error("Error fetching products:", productsError);
    throw new Error(`Error al obtener productos: ${productsError.message || 'Error desconocido'}`);
  }

  // Get average costs from purchase orders before start date
  const startDateStr = startDate.toISOString().split('T')[0];
  
  let purchaseQuery = supabase
    .from("purchase_order_items")
    .select(`
      product_id,
      variant_id,
      quantity,
      unit_cost,
      purchase_orders!inner(
        status,
        received_date,
        company_id
      )
    `)
    .eq("purchase_orders.status", "received")
    .not("purchase_orders.received_date", "is", null)
    .lt("purchase_orders.received_date", startDateStr);

  // Note: RLS policies on purchase_orders table automatically filter by company_id

  if (categoryId) {
    purchaseQuery = purchaseQuery.eq("products.category_id", categoryId);
  }
  if (productId) {
    purchaseQuery = purchaseQuery.eq("product_id", productId);
  }

  const { data: purchaseItems, error: purchaseError } = await purchaseQuery;

  if (purchaseError) {
    console.error("Error fetching purchase costs:", purchaseError);
  }

  // Calculate average cost per product/variant
  const costMap = new Map<string, { totalCost: number; totalQuantity: number }>();
  
  for (const item of purchaseItems || []) {
    const key = `${item.product_id}-${item.variant_id || 'null'}`;
    const existing = costMap.get(key);
    const itemCost = item.quantity * item.unit_cost;

    if (existing) {
      existing.totalCost += itemCost;
      existing.totalQuantity += item.quantity;
    } else {
      costMap.set(key, {
        totalCost: itemCost,
        totalQuantity: item.quantity,
      });
    }
  }

  // Group by product_id and variant_id
  const stockMap = new Map<string, {
    productId: string;
    productName: string;
    variantId: string | null;
    variantName: string | null;
    categoryName: string;
    units: number;
    value: number;
  }>();

  // Process stock movements
  for (const movement of movements || []) {
    const key = `${movement.product_id}-${movement.variant_id || 'null'}`;
    const existing = stockMap.get(key);

    // Handle products and product_variants as arrays (Supabase joins return arrays)
    const productData = Array.isArray(movement.products) ? movement.products[0] : movement.products;
    const variant = Array.isArray(movement.product_variants) ? movement.product_variants[0] : movement.product_variants;

    if (existing) {
      existing.units += movement.quantity;
    } else {
      stockMap.set(key, {
        productId: movement.product_id,
        productName: productData?.name || "Producto desconocido",
        variantId: movement.variant_id,
        variantName: variant?.variant_name || null,
        categoryName: productData?.category_id ? "Sin categoría" : "Sin categoría",
        units: movement.quantity,
        value: 0, // Will be calculated based on average cost
      });
    }
  }

  // Add products without movements (fallback to products.stock_quantity)
  // This handles products created with initial stock but no stock_movements records
  for (const product of products || []) {
    const categoryData = Array.isArray(product.categories) ? product.categories[0] : product.categories;
    const categoryName = categoryData?.name || "Sin categoría";

    // Check if product has variants
    const variants = Array.isArray(product.product_variants) ? product.product_variants : [];

    if (variants.length > 0) {
      // Product with variants - add each variant
      for (const variant of variants) {
        const key = `${product.id}-${variant.id}`;
        
        // Only add if not already in stockMap (no movements exist) AND has stock
        if (!stockMap.has(key)) {
          // Use current stock_quantity as initial stock for products without movements
          const initialStock = variant.stock_quantity || 0;
          
          if (initialStock > 0) {
            stockMap.set(key, {
              productId: product.id,
              productName: product.name,
              variantId: variant.id,
              variantName: variant.variant_name,
              categoryName,
              units: initialStock,
              value: 0, // Will be calculated below
            });
          }
        }
      }
    } else {
      // Product without variants
      const key = `${product.id}-null`;
      
      // Only add if not already in stockMap (no movements exist) AND has stock
      if (!stockMap.has(key)) {
        // Use current stock_quantity as initial stock for products without movements
        const initialStock = product.stock_quantity || 0;
        
        if (initialStock > 0) {
          stockMap.set(key, {
            productId: product.id,
            productName: product.name,
            variantId: null,
            variantName: null,
            categoryName,
            units: initialStock,
            value: 0, // Will be calculated below
          });
        }
      }
    }
  }

  // Calculate values based on average cost from purchases
  for (const [key, stock] of stockMap.entries()) {
    const costData = costMap.get(key);
    if (costData && costData.totalQuantity > 0) {
      // Use average cost from purchases
      const averageCost = costData.totalCost / costData.totalQuantity;
      stock.value = stock.units * averageCost;
    } else {
      // Fallback: use product cost field
      const product = products?.find(p => p.id === stock.productId);
      if (product && product.cost) {
        stock.value = stock.units * product.cost;
      }
    }
  }

  return Array.from(stockMap.values());
}

/**
 * Calculate purchases during the period
 * Sums purchase_order_items where status = 'received' and received_date within period
 */
export async function calculatePurchases(
  companyId: string,
  startDate: Date,
  endDate: Date,
  categoryId?: string,
  productId?: string
) {
  const supabase = await createClient();

  // Format dates as YYYY-MM-DD for DATE field comparison
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  let query = supabase
    .from("purchase_order_items")
    .select(`
      product_id,
      variant_id,
      quantity,
      unit_cost,
      purchase_orders!inner(
        status,
        received_date,
        company_id
      ),
      products!inner(
        name,
        category_id
      ),
      product_variants(
        variant_name
      )
    `)
    .eq("purchase_orders.status", "received")
    .not("purchase_orders.received_date", "is", null)
    .gte("purchase_orders.received_date", startDateStr)
    .lte("purchase_orders.received_date", endDateStr);

  // Filter by company_id after the query (RLS handles this automatically, but we add explicit filter for clarity)
  // Note: We removed .eq("purchase_orders.company_id", companyId) because it causes the query to fail
  // The RLS policies on purchase_orders table already filter by company_id

  // Apply filters
  if (categoryId) {
    query = query.eq("products.category_id", categoryId);
  }
  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("Error calculating purchases:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error(`Error al calcular compras del período: ${error.message || 'Error desconocido'}`);
  }

  if (!items || items.length === 0) {
    return [];
  }

  // Get category names separately
  const categoryIds = [...new Set(items?.map(m => {
    const products = Array.isArray(m.products) ? m.products[0] : m.products;
    return products?.category_id;
  }).filter(Boolean))];
  
  let categoryMap = new Map<string, string>();
  
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);

    categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);
  }

  // Group by product_id and variant_id
  const purchasesMap = new Map<string, {
    productId: string;
    productName: string;
    variantId: string | null;
    variantName: string | null;
    categoryName: string;
    units: number;
    value: number;
  }>();

  for (const item of items || []) {
    const key = `${item.product_id}-${item.variant_id || 'null'}`;
    const existing = purchasesMap.get(key);
    const itemValue = item.quantity * item.unit_cost;

    // Handle products and product_variants as arrays (Supabase joins return arrays)
    const products = Array.isArray(item.products) ? item.products[0] : item.products;
    const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;

    if (existing) {
      existing.units += item.quantity;
      existing.value += itemValue;
    } else {
      purchasesMap.set(key, {
        productId: item.product_id,
        productName: products?.name || "Producto desconocido",
        variantId: item.variant_id,
        variantName: variant?.variant_name || null,
        categoryName: categoryMap.get(products?.category_id) || "Sin categoría",
        units: item.quantity,
        value: itemValue,
      });
    }
  }

  return Array.from(purchasesMap.values());
}

/**
 * Calculate sales during the period
 * Sums sale_items where status IN ('completed', 'paid') and sale_date within period
 */
export async function calculateSales(
  companyId: string,
  startDate: Date,
  endDate: Date,
  categoryId?: string,
  productId?: string
) {
  const supabase = await createClient();

  // Format dates as YYYY-MM-DD for DATE field comparison
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  let query = supabase
    .from("sale_items")
    .select(`
      product_id,
      variant_id,
      quantity,
      unit_price,
      sales!inner(
        status,
        sale_date
      ),
      products!inner(
        name,
        category_id
      ),
      product_variants(
        variant_name
      )
    `)
    .eq("sales.company_id", companyId)
    .in("sales.status", ["completed", "paid"])
    .gte("sales.sale_date", startDateStr)
    .lte("sales.sale_date", endDateStr);

  // Apply filters
  if (categoryId) {
    query = query.eq("products.category_id", categoryId);
  }
  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("Error calculating sales:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error(`Error al calcular ventas del período: ${error.message || 'Error desconocido'}`);
  }

  if (!items || items.length === 0) {
    return [];
  }

  // Get category names separately
  const categoryIds = [...new Set(items?.map(m => {
    const products = Array.isArray(m.products) ? m.products[0] : m.products;
    return products?.category_id;
  }).filter(Boolean))];
  
  let categoryMap = new Map<string, string>();
  
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);

    categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);
  }

  // Group by product_id and variant_id
  const salesMap = new Map<string, {
    productId: string;
    productName: string;
    variantId: string | null;
    variantName: string | null;
    categoryName: string;
    units: number;
    value: number;
  }>();

  for (const item of items || []) {
    const key = `${item.product_id}-${item.variant_id || 'null'}`;
    const existing = salesMap.get(key);
    const itemValue = item.quantity * (item.unit_price || 0);

    // Handle products and product_variants as arrays (Supabase joins return arrays)
    const products = Array.isArray(item.products) ? item.products[0] : item.products;
    const variant = Array.isArray(item.product_variants) ? item.product_variants[0] : item.product_variants;

    if (existing) {
      existing.units += item.quantity;
      existing.value += itemValue;
    } else {
      salesMap.set(key, {
        productId: item.product_id,
        productName: products?.name || "Producto desconocido",
        variantId: item.variant_id,
        variantName: variant?.variant_name || null,
        categoryName: categoryMap.get(products?.category_id) || "Sin categoría",
        units: item.quantity,
        value: itemValue,
      });
    }
  }

  return Array.from(salesMap.values());
}


/**
 * Generate complete inventory liquidation report
 * Combines initial stock, purchases, sales and calculates final stock
 */
export async function generateInventoryReport(
  params: InventoryReportParams
): Promise<InventoryReportRow[]> {
  const { companyId, startDate, endDate, categoryId, productId } = params;

  // Calculate all components in parallel
  const [initialStock, purchases, sales] = await Promise.all([
    calculateInitialStock(companyId, startDate, categoryId, productId),
    calculatePurchases(companyId, startDate, endDate, categoryId, productId),
    calculateSales(companyId, startDate, endDate, categoryId, productId),
  ]);

  // Create a map to combine all data
  const reportMap = new Map<string, InventoryReportRow>();

  // Add initial stock
  for (const item of initialStock) {
    const key = `${item.productId}-${item.variantId || 'null'}`;
    reportMap.set(key, {
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantName: item.variantName,
      categoryName: item.categoryName,
      initialStockUnits: item.units,
      purchasesUnits: 0,
      salesUnits: 0,
      finalStockUnits: item.units,
      initialStockValue: item.value,
      purchasesValue: 0,
      salesValue: 0,
      finalStockValue: item.value,
      averageCost: item.units > 0 ? item.value / item.units : 0,
    });
  }

  // Add purchases
  for (const item of purchases) {
    const key = `${item.productId}-${item.variantId || 'null'}`;
    const existing = reportMap.get(key);

    if (existing) {
      existing.purchasesUnits = item.units;
      existing.purchasesValue = item.value;
      existing.finalStockUnits += item.units;
      existing.finalStockValue += item.value;
    } else {
      reportMap.set(key, {
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        variantName: item.variantName,
        categoryName: item.categoryName,
        initialStockUnits: 0,
        purchasesUnits: item.units,
        salesUnits: 0,
        finalStockUnits: item.units,
        initialStockValue: 0,
        purchasesValue: item.value,
        salesValue: 0,
        finalStockValue: item.value,
        averageCost: item.units > 0 ? item.value / item.units : 0,
      });
    }
  }

  // Add sales
  for (const item of sales) {
    const key = `${item.productId}-${item.variantId || 'null'}`;
    const existing = reportMap.get(key);

    if (existing) {
      existing.salesUnits = item.units;
      existing.salesValue = item.value;
      existing.finalStockUnits -= item.units;
      existing.finalStockValue -= item.value;
    } else {
      // Product with sales but no initial stock or purchases
      reportMap.set(key, {
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        variantName: item.variantName,
        categoryName: item.categoryName,
        initialStockUnits: 0,
        purchasesUnits: 0,
        salesUnits: item.units,
        finalStockUnits: -item.units,
        initialStockValue: 0,
        purchasesValue: 0,
        salesValue: item.value,
        finalStockValue: -item.value,
        averageCost: item.units > 0 ? item.value / item.units : 0,
      });
    }
  }

  // Calculate average cost for each row
  for (const row of reportMap.values()) {
    const totalUnits = row.initialStockUnits + row.purchasesUnits;
    const totalValue = row.initialStockValue + row.purchasesValue;
    row.averageCost = totalUnits > 0 ? totalValue / totalUnits : 0;
  }

  // Convert to array and sort alphabetically
  const report = Array.from(reportMap.values()).sort((a, b) => {
    // Sort by product name first
    const nameCompare = a.productName.localeCompare(b.productName);
    if (nameCompare !== 0) return nameCompare;

    // Then by variant name
    const variantA = a.variantName || '';
    const variantB = b.variantName || '';
    return variantA.localeCompare(variantB);
  });

  return report;
}


/**
 * Export inventory report to Excel format
 */
export async function exportInventoryReportToExcel(
  data: InventoryReportRow[],
  metadata: ExportMetadata
): Promise<Buffer> {
  // Prepare data with metadata header
  const exportData = data.map(row => ({
    "Producto": row.productName,
    "Variante": row.variantName || "-",
    "Categoría": row.categoryName,
    "Existencia Inicial (Unidades)": row.initialStockUnits,
    "Existencia Inicial (Valor)": row.initialStockValue.toFixed(2),
    "Compras (Unidades)": row.purchasesUnits,
    "Compras (Valor)": row.purchasesValue.toFixed(2),
    "Ventas (Unidades)": row.salesUnits,
    "Ventas (Valor)": row.salesValue.toFixed(2),
    "Existencia Final (Unidades)": row.finalStockUnits,
    "Existencia Final (Valor)": row.finalStockValue.toFixed(2),
    "Costo Promedio": row.averageCost.toFixed(2),
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Add metadata header rows at the top
  XLSX.utils.sheet_add_aoa(worksheet, [
    ["Reporte de Liquidación de Inventario"],
    [`Empresa: ${metadata.companyName}`],
    [`Período: ${metadata.periodStart.toLocaleDateString("es-AR")} - ${metadata.periodEnd.toLocaleDateString("es-AR")}`],
    [`Generado: ${metadata.generatedAt.toLocaleDateString("es-AR")} ${metadata.generatedAt.toLocaleTimeString("es-AR")}`],
    [], // Empty row
  ], { origin: "A1" });

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Liquidación");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/**
 * Export inventory report to CSV format
 */
export async function exportInventoryReportToCSV(
  data: InventoryReportRow[],
  metadata: ExportMetadata
): Promise<Buffer> {
  // Prepare data with metadata header
  const exportData = data.map(row => ({
    "Producto": row.productName,
    "Variante": row.variantName || "-",
    "Categoría": row.categoryName,
    "Existencia Inicial (Unidades)": row.initialStockUnits,
    "Existencia Inicial (Valor)": row.initialStockValue.toFixed(2),
    "Compras (Unidades)": row.purchasesUnits,
    "Compras (Valor)": row.purchasesValue.toFixed(2),
    "Ventas (Unidades)": row.salesUnits,
    "Ventas (Valor)": row.salesValue.toFixed(2),
    "Existencia Final (Unidades)": row.finalStockUnits,
    "Existencia Final (Valor)": row.finalStockValue.toFixed(2),
    "Costo Promedio": row.averageCost.toFixed(2),
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Add metadata header rows
  XLSX.utils.sheet_add_aoa(worksheet, [
    ["Reporte de Liquidación de Inventario"],
    [`Empresa: ${metadata.companyName}`],
    [`Período: ${metadata.periodStart.toLocaleDateString("es-AR")} - ${metadata.periodEnd.toLocaleDateString("es-AR")}`],
    [`Generado: ${metadata.generatedAt.toLocaleDateString("es-AR")} ${metadata.generatedAt.toLocaleTimeString("es-AR")}`],
    [], // Empty row
  ], { origin: "A1" });

  // Convert to CSV
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const buffer = Buffer.from(csv, "utf-8");
  return buffer;
}

/**
 * Export inventory report to PDF format
 */
export async function exportInventoryReportToPDF(
  data: InventoryReportRow[],
  metadata: ExportMetadata,
  companyLogo?: string
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "landscape" });

  // Add company logo if available
  if (companyLogo) {
    try {
      doc.addImage(companyLogo, "PNG", 14, 10, 30, 30);
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
    }
  }

  // Title
  doc.setFontSize(18);
  doc.text("Reporte de Liquidación de Inventario", companyLogo ? 50 : 14, 20);

  // Company name
  doc.setFontSize(12);
  doc.text(metadata.companyName, companyLogo ? 50 : 14, 28);

  // Period and generation date
  doc.setFontSize(10);
  doc.text(
    `Período: ${metadata.periodStart.toLocaleDateString("es-AR")} - ${metadata.periodEnd.toLocaleDateString("es-AR")}`,
    companyLogo ? 50 : 14,
    35
  );
  doc.text(
    `Generado: ${metadata.generatedAt.toLocaleDateString("es-AR")} ${metadata.generatedAt.toLocaleTimeString("es-AR")}`,
    companyLogo ? 50 : 14,
    42
  );

  // Prepare table data
  const tableData = data.map(row => [
    row.productName,
    row.variantName || "-",
    row.categoryName,
    row.initialStockUnits.toString(),
    row.initialStockValue.toFixed(2),
    row.purchasesUnits.toString(),
    row.purchasesValue.toFixed(2),
    row.salesUnits.toString(),
    row.salesValue.toFixed(2),
    row.finalStockUnits.toString(),
    row.finalStockValue.toFixed(2),
  ]);

  // Add table
  autoTable(doc, {
    startY: 50,
    head: [[
      "Producto",
      "Variante",
      "Categoría",
      "Exist. Inicial\n(Unid.)",
      "Exist. Inicial\n(Valor)",
      "Compras\n(Unid.)",
      "Compras\n(Valor)",
      "Ventas\n(Unid.)",
      "Ventas\n(Valor)",
      "Exist. Final\n(Unid.)",
      "Exist. Final\n(Valor)",
    ]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      fontSize: 8,
      halign: "center",
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Producto
      1: { cellWidth: 25 }, // Variante
      2: { cellWidth: 25 }, // Categoría
      3: { cellWidth: 15, halign: "right" }, // Exist. Inicial Unid.
      4: { cellWidth: 18, halign: "right" }, // Exist. Inicial Valor
      5: { cellWidth: 15, halign: "right" }, // Compras Unid.
      6: { cellWidth: 18, halign: "right" }, // Compras Valor
      7: { cellWidth: 15, halign: "right" }, // Ventas Unid.
      8: { cellWidth: 18, halign: "right" }, // Ventas Valor
      9: { cellWidth: 15, halign: "right" }, // Exist. Final Unid.
      10: { cellWidth: 18, halign: "right" }, // Exist. Final Valor
    },
  });

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}

/**
 * Export inventory report in the specified format
 */
export async function exportInventoryReport(
  data: InventoryReportRow[],
  metadata: ExportMetadata,
  format: ExportFormat,
  companyLogo?: string
): Promise<Buffer> {
  try {
    switch (format) {
      case "excel":
        return await exportInventoryReportToExcel(data, metadata);
      case "csv":
        return await exportInventoryReportToCSV(data, metadata);
      case "pdf":
        return await exportInventoryReportToPDF(data, metadata, companyLogo);
      default:
        throw new Error(`Formato de exportación no soportado: ${format}`);
    }
  } catch (error) {
    console.error(`Error exporting inventory report to ${format}:`, error);
    throw new Error(`Error al generar el archivo ${format.toUpperCase()}. Intente nuevamente.`);
  }
}
