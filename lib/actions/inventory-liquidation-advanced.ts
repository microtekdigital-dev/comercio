"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  InventoryLiquidationReport,
  ProductMovement,
  CategoryLiquidation,
  SupplierLiquidation,
  PeriodComparison,
  InventoryReportFilters,
} from "@/lib/types/reports";

/**
 * Obtiene el reporte avanzado de liquidación de inventario
 */
export async function getAdvancedInventoryLiquidation(
  companyId: string,
  filters: InventoryReportFilters
): Promise<InventoryLiquidationReport> {
  const supabase = await createClient();

  // Obtener datos base
  const [byProduct, byCategory, bySupplier] = await Promise.all([
    getProductMovements(companyId, filters),
    getCategoryLiquidation(companyId, filters),
    getSupplierLiquidation(companyId, filters),
  ]);

  // Calcular resumen
  const summary = {
    totalProducts: byProduct.length,
    totalMovements: byProduct.reduce((sum, p) => sum + p.units, 0),
    totalPurchaseValue: byProduct.reduce((sum, p) => sum + (p.value || 0), 0),
    totalSalesValue: byCategory.reduce((sum, c) => sum + c.totalSalesValue, 0),
    totalProfit: byCategory.reduce((sum, c) => sum + c.totalProfit, 0),
    profitMargin: 0,
  };

  // Calcular margen de ganancia
  if (summary.totalSalesValue > 0) {
    summary.profitMargin = (summary.totalProfit / summary.totalSalesValue) * 100;
  }

  // Identificar top y slow movers
  const productsWithTurnover = await getInventoryTurnoverAnalysis(companyId, {
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const topMovers = productsWithTurnover
    .sort((a, b) => (b.turnoverRate || 0) - (a.turnoverRate || 0))
    .slice(0, 10);

  const slowMovers = productsWithTurnover
    .filter((p) => (p.turnoverRate || 0) > 0)
    .sort((a, b) => (a.turnoverRate || 0) - (b.turnoverRate || 0))
    .slice(0, 10);

  return {
    period: {
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    summary,
    byCategory,
    byProduct,
    bySupplier,
    topMovers,
    slowMovers,
  };
}

/**
 * Obtiene movimientos de productos con análisis de rotación
 */
async function getProductMovements(
  companyId: string,
  filters: InventoryReportFilters
): Promise<ProductMovement[]> {
  const supabase = await createClient();

  const startDateStr = filters.startDate.toISOString().split("T")[0];
  const endDateStr = filters.endDate.toISOString().split("T")[0];

  // Obtener ventas del período
  let salesQuery = supabase
    .from("sale_items")
    .select(
      `
      product_id,
      variant_id,
      quantity,
      unit_price,
      sales!inner(
        status,
        sale_date,
        company_id
      ),
      products!inner(
        name,
        category_id,
        categories(name)
      ),
      product_variants(
        variant_name
      )
    `
    )
    .eq("sales.company_id", companyId)
    .in("sales.status", ["completed", "paid"])
    .gte("sales.sale_date", startDateStr)
    .lte("sales.sale_date", endDateStr);

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    salesQuery = salesQuery.in("products.category_id", filters.categoryIds);
  }

  if (filters.productIds && filters.productIds.length > 0) {
    salesQuery = salesQuery.in("product_id", filters.productIds);
  }

  const { data: salesItems, error: salesError } = await salesQuery;

  if (salesError) {
    console.error("Error fetching sales for product movements:", salesError);
    throw new Error("Error al obtener movimientos de productos");
  }

  // Agrupar por producto/variante
  const movementsMap = new Map<string, ProductMovement>();

  for (const item of salesItems || []) {
    const key = `${item.product_id}-${item.variant_id || "null"}`;
    const existing = movementsMap.get(key);

    const products = Array.isArray(item.products) ? item.products[0] : item.products;
    const categories = Array.isArray(products?.categories)
      ? products.categories[0]
      : products?.categories;
    const variant = Array.isArray(item.product_variants)
      ? item.product_variants[0]
      : item.product_variants;

    if (existing) {
      existing.units += item.quantity;
      existing.value += item.quantity * (item.unit_price || 0);
    } else {
      movementsMap.set(key, {
        productId: item.product_id,
        productName: products?.name || "Producto desconocido",
        variantId: item.variant_id,
        variantName: variant?.variant_name || null,
        categoryName: categories?.name || "Sin categoría",
        units: item.quantity,
        value: item.quantity * (item.unit_price || 0),
      });
    }
  }

  return Array.from(movementsMap.values());
}

/**
 * Obtiene liquidación por categoría
 */
async function getCategoryLiquidation(
  companyId: string,
  filters: InventoryReportFilters
): Promise<CategoryLiquidation[]> {
  const supabase = await createClient();

  const startDateStr = filters.startDate.toISOString().split("T")[0];
  const endDateStr = filters.endDate.toISOString().split("T")[0];

  // Obtener ventas por categoría
  let salesQuery = supabase
    .from("sale_items")
    .select(
      `
      product_id,
      quantity,
      unit_price,
      sales!inner(
        status,
        sale_date,
        company_id
      ),
      products!inner(
        category_id,
        cost,
        categories(name)
      )
    `
    )
    .eq("sales.company_id", companyId)
    .in("sales.status", ["completed", "paid"])
    .gte("sales.sale_date", startDateStr)
    .lte("sales.sale_date", endDateStr);

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    salesQuery = salesQuery.in("products.category_id", filters.categoryIds);
  }

  const { data: salesItems, error: salesError } = await salesQuery;

  if (salesError) {
    console.error("Error fetching sales by category:", salesError);
    throw new Error("Error al obtener liquidación por categoría");
  }

  // Obtener compras por categoría
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "received")
    .not("received_date", "is", null)
    .gte("received_date", startDateStr)
    .lte("received_date", endDateStr);

  let purchaseItems: any[] = [];
  if (purchaseOrders && purchaseOrders.length > 0) {
    const purchaseOrderIds = purchaseOrders.map((po) => po.id);

    let purchaseQuery = supabase
      .from("purchase_order_items")
      .select(
        `
        product_id,
        quantity,
        unit_cost,
        products!inner(
          category_id,
          categories(name)
        )
      `
      )
      .in("purchase_order_id", purchaseOrderIds);

    if (filters.categoryIds && filters.categoryIds.length > 0) {
      purchaseQuery = purchaseQuery.in("products.category_id", filters.categoryIds);
    }

    const { data, error } = await purchaseQuery;
    if (!error && data) {
      purchaseItems = data;
    }
  }

  // Agrupar por categoría
  const categoryMap = new Map<string, CategoryLiquidation>();

  // Procesar ventas
  for (const item of salesItems || []) {
    const products = Array.isArray(item.products) ? item.products[0] : item.products;
    const categories = Array.isArray(products?.categories)
      ? products.categories[0]
      : products?.categories;
    const categoryId = products?.category_id || "sin-categoria";
    const categoryName = categories?.name || "Sin categoría";

    const existing = categoryMap.get(categoryId);
    const salesValue = item.quantity * (item.unit_price || 0);
    const purchaseValue = item.quantity * (products?.cost || 0);
    const profit = salesValue - purchaseValue;

    if (existing) {
      existing.totalMovements += item.quantity;
      existing.totalSalesValue += salesValue;
      existing.totalPurchaseValue += purchaseValue;
      existing.totalProfit += profit;
    } else {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName,
        totalProducts: 0, // Se calculará después
        totalMovements: item.quantity,
        totalPurchaseValue: purchaseValue,
        totalSalesValue: salesValue,
        totalProfit: profit,
        profitMargin: 0, // Se calculará después
      });
    }
  }

  // Procesar compras
  for (const item of purchaseItems) {
    const products = Array.isArray(item.products) ? item.products[0] : item.products;
    const categories = Array.isArray(products?.categories)
      ? products.categories[0]
      : products?.categories;
    const categoryId = products?.category_id || "sin-categoria";
    const categoryName = categories?.name || "Sin categoría";

    const existing = categoryMap.get(categoryId);
    const purchaseValue = item.quantity * item.unit_cost;

    if (existing) {
      existing.totalPurchaseValue += purchaseValue;
    } else {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName,
        totalProducts: 0,
        totalMovements: 0,
        totalPurchaseValue: purchaseValue,
        totalSalesValue: 0,
        totalProfit: -purchaseValue,
        profitMargin: 0,
      });
    }
  }

  // Calcular productos únicos por categoría
  const productsByCategory = new Map<string, Set<string>>();
  for (const item of salesItems || []) {
    const products = Array.isArray(item.products) ? item.products[0] : item.products;
    const categoryId = products?.category_id || "sin-categoria";
    if (!productsByCategory.has(categoryId)) {
      productsByCategory.set(categoryId, new Set());
    }
    productsByCategory.get(categoryId)!.add(item.product_id);
  }

  // Actualizar conteo de productos y calcular margen
  for (const [categoryId, category] of categoryMap.entries()) {
    category.totalProducts = productsByCategory.get(categoryId)?.size || 0;
    if (category.totalSalesValue > 0) {
      category.profitMargin = (category.totalProfit / category.totalSalesValue) * 100;
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName)
  );
}

/**
 * Obtiene liquidación por proveedor
 */
async function getSupplierLiquidation(
  companyId: string,
  filters: InventoryReportFilters
): Promise<SupplierLiquidation[]> {
  const supabase = await createClient();

  const startDateStr = filters.startDate.toISOString().split("T")[0];
  const endDateStr = filters.endDate.toISOString().split("T")[0];

  // Obtener órdenes de compra del período
  let poQuery = supabase
    .from("purchase_orders")
    .select(
      `
      id,
      supplier_id,
      suppliers(name)
    `
    )
    .eq("company_id", companyId)
    .eq("status", "received")
    .not("received_date", "is", null)
    .gte("received_date", startDateStr)
    .lte("received_date", endDateStr);

  if (filters.supplierIds && filters.supplierIds.length > 0) {
    poQuery = poQuery.in("supplier_id", filters.supplierIds);
  }

  const { data: purchaseOrders, error: poError } = await poQuery;

  if (poError) {
    console.error("Error fetching purchase orders by supplier:", poError);
    throw new Error("Error al obtener liquidación por proveedor");
  }

  if (!purchaseOrders || purchaseOrders.length === 0) {
    return [];
  }

  const purchaseOrderIds = purchaseOrders.map((po) => po.id);

  // Obtener items de las órdenes
  const { data: items, error: itemsError } = await supabase
    .from("purchase_order_items")
    .select(
      `
      product_id,
      quantity,
      unit_cost,
      purchase_order_id
    `
    )
    .in("purchase_order_id", purchaseOrderIds);

  if (itemsError) {
    console.error("Error fetching purchase order items:", itemsError);
    throw new Error("Error al obtener items de órdenes de compra");
  }

  // Agrupar por proveedor
  const supplierMap = new Map<string, SupplierLiquidation>();

  for (const po of purchaseOrders) {
    const supplierId = po.supplier_id || "sin-proveedor";
    const suppliers = Array.isArray(po.suppliers) ? po.suppliers[0] : po.suppliers;
    const supplierName = suppliers?.name || "Sin proveedor";

    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, {
        supplierId,
        supplierName,
        totalProducts: 0,
        totalPurchases: 0,
        totalPurchaseValue: 0,
        averageCost: 0,
      });
    }

    const supplier = supplierMap.get(supplierId)!;
    const poItems = items?.filter((item) => item.purchase_order_id === po.id) || [];

    const uniqueProducts = new Set(poItems.map((item) => item.product_id));
    supplier.totalProducts += uniqueProducts.size;

    for (const item of poItems) {
      supplier.totalPurchases += item.quantity;
      supplier.totalPurchaseValue += item.quantity * item.unit_cost;
    }
  }

  // Calcular costo promedio
  for (const supplier of supplierMap.values()) {
    if (supplier.totalPurchases > 0) {
      supplier.averageCost = supplier.totalPurchaseValue / supplier.totalPurchases;
    }
  }

  return Array.from(supplierMap.values()).sort((a, b) =>
    a.supplierName.localeCompare(b.supplierName)
  );
}

/**
 * Obtiene análisis de rotación de inventario
 */
export async function getInventoryTurnoverAnalysis(
  companyId: string,
  period: { startDate: Date; endDate: Date }
): Promise<ProductMovement[]> {
  const supabase = await createClient();

  const startDateStr = period.startDate.toISOString().split("T")[0];
  const endDateStr = period.endDate.toISOString().split("T")[0];

  // Obtener stock promedio del período
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      stock_quantity,
      category_id,
      categories(name),
      product_variants(
        id,
        variant_name,
        stock_quantity
      )
    `
    )
    .eq("company_id", companyId);

  if (productsError) {
    console.error("Error fetching products for turnover:", productsError);
    throw new Error("Error al obtener productos");
  }

  // Obtener ventas del período
  const { data: salesItems, error: salesError } = await supabase
    .from("sale_items")
    .select(
      `
      product_id,
      variant_id,
      quantity,
      sales!inner(
        status,
        sale_date,
        company_id
      )
    `
    )
    .eq("sales.company_id", companyId)
    .in("sales.status", ["completed", "paid"])
    .gte("sales.sale_date", startDateStr)
    .lte("sales.sale_date", endDateStr);

  if (salesError) {
    console.error("Error fetching sales for turnover:", salesError);
    throw new Error("Error al obtener ventas");
  }

  // Calcular rotación por producto/variante
  const turnoverMap = new Map<string, ProductMovement>();

  for (const product of products || []) {
    const categories = Array.isArray(product.categories)
      ? product.categories[0]
      : product.categories;
    const variants = Array.isArray(product.product_variants)
      ? product.product_variants
      : [];

    if (variants.length > 0) {
      // Producto con variantes
      for (const variant of variants) {
        const key = `${product.id}-${variant.id}`;
        const sales =
          salesItems?.filter(
            (item) => item.product_id === product.id && item.variant_id === variant.id
          ) || [];
        const totalSold = sales.reduce((sum, item) => sum + item.quantity, 0);
        const avgStock = variant.stock_quantity || 0;

        // Calcular tasa de rotación (ventas / stock promedio)
        const turnoverRate = avgStock > 0 ? totalSold / avgStock : 0;

        turnoverMap.set(key, {
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantName: variant.variant_name,
          categoryName: categories?.name || "Sin categoría",
          units: totalSold,
          value: 0, // No calculamos valor aquí
          turnoverRate,
        });
      }
    } else {
      // Producto sin variantes
      const key = `${product.id}-null`;
      const sales =
        salesItems?.filter(
          (item) => item.product_id === product.id && !item.variant_id
        ) || [];
      const totalSold = sales.reduce((sum, item) => sum + item.quantity, 0);
      const avgStock = product.stock_quantity || 0;

      const turnoverRate = avgStock > 0 ? totalSold / avgStock : 0;

      turnoverMap.set(key, {
        productId: product.id,
        productName: product.name,
        variantId: null,
        variantName: null,
        categoryName: categories?.name || "Sin categoría",
        units: totalSold,
        value: 0,
        turnoverRate,
      });
    }
  }

  return Array.from(turnoverMap.values());
}

/**
 * Compara dos períodos de inventario
 */
export async function compareInventoryPeriods(
  companyId: string,
  period1: { startDate: Date; endDate: Date },
  period2: { startDate: Date; endDate: Date }
): Promise<PeriodComparison> {
  // Obtener reportes de ambos períodos
  const [report1, report2] = await Promise.all([
    getAdvancedInventoryLiquidation(companyId, {
      startDate: period1.startDate,
      endDate: period1.endDate,
    }),
    getAdvancedInventoryLiquidation(companyId, {
      startDate: period2.startDate,
      endDate: period2.endDate,
    }),
  ]);

  // Calcular cambios
  const salesChange = report2.summary.totalSalesValue - report1.summary.totalSalesValue;
  const purchasesChange =
    report2.summary.totalPurchaseValue - report1.summary.totalPurchaseValue;
  const profitChange = report2.summary.totalProfit - report1.summary.totalProfit;

  const salesChangePercent =
    report1.summary.totalSalesValue > 0
      ? (salesChange / report1.summary.totalSalesValue) * 100
      : 0;
  const purchasesChangePercent =
    report1.summary.totalPurchaseValue > 0
      ? (purchasesChange / report1.summary.totalPurchaseValue) * 100
      : 0;
  const profitChangePercent =
    report1.summary.totalProfit > 0
      ? (profitChange / report1.summary.totalProfit) * 100
      : 0;

  return {
    period1: {
      startDate: period1.startDate,
      endDate: period1.endDate,
      totalSales: report1.summary.totalSalesValue,
      totalPurchases: report1.summary.totalPurchaseValue,
      totalProfit: report1.summary.totalProfit,
    },
    period2: {
      startDate: period2.startDate,
      endDate: period2.endDate,
      totalSales: report2.summary.totalSalesValue,
      totalPurchases: report2.summary.totalPurchaseValue,
      totalProfit: report2.summary.totalProfit,
    },
    changes: {
      salesChange,
      salesChangePercent,
      purchasesChange,
      purchasesChangePercent,
      profitChange,
      profitChangePercent,
    },
  };
}

/**
 * Obtiene productos con mayor movimiento (top movers)
 */
export async function getTopMovers(
  companyId: string,
  period: { startDate: Date; endDate: Date },
  limit: number = 10
): Promise<ProductMovement[]> {
  const analysis = await getInventoryTurnoverAnalysis(companyId, period);
  return analysis
    .sort((a, b) => (b.turnoverRate || 0) - (a.turnoverRate || 0))
    .slice(0, limit);
}

/**
 * Obtiene productos con menor movimiento (slow movers)
 */
export async function getSlowMovers(
  companyId: string,
  period: { startDate: Date; endDate: Date },
  limit: number = 10
): Promise<ProductMovement[]> {
  const analysis = await getInventoryTurnoverAnalysis(companyId, period);
  return analysis
    .filter((p) => (p.turnoverRate || 0) > 0)
    .sort((a, b) => (a.turnoverRate || 0) - (b.turnoverRate || 0))
    .slice(0, limit);
}
