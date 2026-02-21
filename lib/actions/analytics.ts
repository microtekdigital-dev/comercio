"use server";

import { createClient } from "@/lib/supabase/server";

// Dashboard stats
export async function getDashboardStats() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return null;

    // Get current month dates
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // This month sales
    const { data: thisMonthSales } = await supabase
      .from("sales")
      .select("total, status")
      .eq("company_id", profile.company_id)
      .gte("sale_date", firstDayThisMonth.toISOString())
      .in("status", ["confirmed", "completed"]);

    // Last month sales
    const { data: lastMonthSales } = await supabase
      .from("sales")
      .select("total")
      .eq("company_id", profile.company_id)
      .gte("sale_date", firstDayLastMonth.toISOString())
      .lte("sale_date", lastDayLastMonth.toISOString())
      .in("status", ["confirmed", "completed"]);

    // Pending sales
    const { data: pendingSales } = await supabase
      .from("sales")
      .select("id")
      .eq("company_id", profile.company_id)
      .eq("status", "pending");

    // Total customers
    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", profile.company_id)
      .eq("status", "active");

    // Total products
    const { data: products } = await supabase
      .from("products")
      .select("id, stock_quantity, min_stock_level, track_inventory")
      .eq("company_id", profile.company_id)
      .eq("is_active", true);

    // Calculate sales revenue
    const thisMonthRevenue = thisMonthSales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
    const lastMonthRevenue = lastMonthSales?.reduce((sum, sale) => sum + sale.total, 0) || 0;

    // Calculate repairs revenue (if repairs module is available)
    let thisMonthRepairsRevenue = 0;
    let lastMonthRepairsRevenue = 0;
    
    try {
      const { canAccessRepairs } = await import('@/lib/utils/plan-limits');
      const access = await canAccessRepairs(profile.company_id);
      
      if (access.allowed) {
        // This month repairs - use repair_completed_date or created_at as fallback
        const { data: thisMonthRepairs } = await supabase
          .from('repair_orders')
          .select('id, repair_completed_date, created_at')
          .eq('company_id', profile.company_id)
          .in('status', ['repaired', 'delivered']);

        // Filter by date in memory to handle NULL delivered_date
        const thisMonthRepairIds = (thisMonthRepairs || [])
          .filter(r => {
            const dateToCheck = r.repair_completed_date || r.created_at;
            return new Date(dateToCheck) >= firstDayThisMonth;
          })
          .map(r => r.id);

        if (thisMonthRepairIds.length > 0) {
          const { data: payments } = await supabase
            .from('repair_payments')
            .select('amount')
            .in('repair_order_id', thisMonthRepairIds);
          
          thisMonthRepairsRevenue = (payments || []).reduce((sum, p) => sum + p.amount, 0);
        }

        // Last month repairs
        const { data: lastMonthRepairs } = await supabase
          .from('repair_orders')
          .select('id, repair_completed_date, created_at')
          .eq('company_id', profile.company_id)
          .in('status', ['repaired', 'delivered']);

        // Filter by date in memory
        const lastMonthRepairIds = (lastMonthRepairs || [])
          .filter(r => {
            const dateToCheck = r.repair_completed_date || r.created_at;
            const date = new Date(dateToCheck);
            return date >= firstDayLastMonth && date <= lastDayLastMonth;
          })
          .map(r => r.id);

        if (lastMonthRepairIds.length > 0) {
          const repairIds = lastMonthRepairIds;
          const { data: payments } = await supabase
            .from('repair_payments')
            .select('amount')
            .in('repair_order_id', repairIds);
          
          lastMonthRepairsRevenue = (payments || []).reduce((sum, p) => sum + p.amount, 0);
        }
      }
    } catch (error) {
      console.log('[getDashboardStats] Repairs module not available or error:', error);
    }

    // Calculate total revenue including repairs
    const totalThisMonthRevenue = thisMonthRevenue + thisMonthRepairsRevenue;
    const totalLastMonthRevenue = lastMonthRevenue + lastMonthRepairsRevenue;
    
    const revenueGrowth = totalLastMonthRevenue > 0 
      ? ((totalThisMonthRevenue - totalLastMonthRevenue) / totalLastMonthRevenue) * 100 
      : 0;

    const salesGrowth = lastMonthSales && lastMonthSales.length > 0
      ? ((thisMonthSales?.length || 0) - lastMonthSales.length) / lastMonthSales.length * 100
      : 0;

    const lowStockProducts = products?.filter(
      p => p.track_inventory && p.stock_quantity <= p.min_stock_level
    ).length || 0;

    return {
      totalSales: thisMonthSales?.length || 0,
      totalRevenue: totalThisMonthRevenue,
      totalCustomers: customers?.length || 0,
      totalProducts: products?.length || 0,
      pendingSales: pendingSales?.length || 0,
      lowStockProducts,
      revenueGrowth,
      salesGrowth,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}

// Top products by revenue (with variant support)
export async function getTopProducts(limit: number = 5) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data } = await supabase
      .from("sale_items")
      .select(`
        product_id,
        product_name,
        variant_id,
        variant_name,
        quantity,
        total,
        sale:sales!inner(company_id, status)
      `)
      .eq("sale.company_id", profile.company_id)
      .in("sale.status", ["confirmed", "completed"]);

    if (!data) return [];

    // Aggregate by product + variant combination
    const itemMap = new Map();
    data.forEach(item => {
      // Use variant_id if exists, otherwise use product_id
      const key = item.variant_id 
        ? `variant-${item.variant_id}` 
        : `product-${item.product_id}`;
      
      const displayName = item.variant_name
        ? `${item.product_name} - ${item.variant_name}`
        : item.product_name;
      
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.total_quantity += item.quantity;
        existing.total_revenue += item.total;
      } else {
        itemMap.set(key, {
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: displayName,
          total_quantity: item.quantity,
          total_revenue: item.total,
        });
      }
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching top products:", error);
    return [];
  }
}

// Top customers by revenue
export async function getTopCustomers(limit: number = 5) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data } = await supabase
      .from("sales")
      .select("customer_id, total, customer:customers(name)")
      .eq("company_id", profile.company_id)
      .in("status", ["confirmed", "completed"])
      .not("customer_id", "is", null);

    if (!data) return [];

    // Aggregate by customer
    const customerMap = new Map();
    data.forEach(sale => {
      if (sale.customer_id) {
        if (customerMap.has(sale.customer_id)) {
          const existing = customerMap.get(sale.customer_id);
          existing.total_sales += 1;
          existing.total_revenue += sale.total;
        } else {
          customerMap.set(sale.customer_id, {
            customer_id: sale.customer_id,
            customer_name: (sale.customer as any)?.name || "Sin nombre",
            total_sales: 1,
            total_revenue: sale.total,
          });
        }
      }
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching top customers:", error);
    return [];
  }
}

// Sales by period (for charts)
export async function getSalesByPeriod(days: number = 30) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from("sales")
      .select("sale_date, total, status")
      .eq("company_id", profile.company_id)
      .gte("sale_date", startDate.toISOString())
      .in("status", ["confirmed", "completed"])
      .order("sale_date", { ascending: true });

    if (!data) return [];

    // Group by date
    const dateMap = new Map();
    data.forEach(sale => {
      const date = sale.sale_date.split("T")[0];
      if (dateMap.has(date)) {
        const existing = dateMap.get(date);
        existing.revenue += sale.total;
        existing.sales += 1;
      } else {
        dateMap.set(date, {
          date,
          revenue: sale.total,
          sales: 1,
        });
      }
    });

    return Array.from(dateMap.values());
  } catch (error) {
    console.error("Error fetching sales by period:", error);
    return [];
  }
}

// Product profitability analysis
export async function getProductProfitability() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, cost")
      .eq("company_id", profile.company_id)
      .eq("is_active", true);

    if (!products) return [];

    const { data: saleItems } = await supabase
      .from("sale_items")
      .select(`
        product_id,
        quantity,
        unit_price,
        total,
        sale:sales!inner(company_id, status)
      `)
      .eq("sale.company_id", profile.company_id)
      .in("sale.status", ["confirmed", "completed"]);

    // Calculate profitability
    const profitabilityMap = new Map();
    
    products.forEach(product => {
      const sales = saleItems?.filter(item => item.product_id === product.id) || [];
      const totalQuantity = sales.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = sales.reduce((sum, item) => sum + item.total, 0);
      const totalCost = totalQuantity * product.cost;
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      profitabilityMap.set(product.id, {
        product_id: product.id,
        product_name: product.name,
        quantity_sold: totalQuantity,
        revenue: totalRevenue,
        cost: totalCost,
        profit,
        profit_margin: profitMargin,
      });
    });

    return Array.from(profitabilityMap.values())
      .filter(p => p.quantity_sold > 0)
      .sort((a, b) => b.profit - a.profit);
  } catch (error) {
    console.error("Error fetching product profitability:", error);
    return [];
  }
}

// Inventory report
export async function getInventoryReport() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data: products } = await supabase
      .from("products")
      .select("id, name, sku, stock_quantity, min_stock_level, price, cost, track_inventory, has_variants, category:categories(name)")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .eq("track_inventory", true)
      .order("stock_quantity", { ascending: true });

    if (!products) return [];

    const inventoryItems: any[] = [];

    for (const product of products) {
      if (product.has_variants) {
        // For products with variants, get each variant's inventory
        const { data: variants } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", product.id)
          .eq("company_id", profile.company_id)
          .eq("is_active", true);

        if (variants) {
          for (const variant of variants) {
            // Only include variants with min_stock_level > 0 (actually tracked)
            // This excludes variants the supplier doesn't manufacture
            if (variant.min_stock_level > 0) {
              inventoryItems.push({
                product_id: product.id,
                product_name: `${product.name} - ${variant.variant_name}`,
                sku: variant.sku || product.sku,
                category: (product.category as any)?.name || "Sin categoría",
                stock_quantity: variant.stock_quantity,
                min_stock_level: variant.min_stock_level,
                stock_value: variant.stock_quantity * product.cost,
                status: variant.stock_quantity <= variant.min_stock_level ? "low" : "ok",
              });
            }
          }
        }
      } else {
        // For simple products, only include if min_stock_level > 0
        if (product.min_stock_level > 0) {
          inventoryItems.push({
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            category: (product.category as any)?.name || "Sin categoría",
            stock_quantity: product.stock_quantity,
            min_stock_level: product.min_stock_level,
            stock_value: product.stock_quantity * product.cost,
            status: product.stock_quantity <= product.min_stock_level ? "low" : "ok",
          });
        }
      }
    }

    return inventoryItems.sort((a, b) => a.stock_quantity - b.stock_quantity);
  } catch (error) {
    console.error("Error fetching inventory report:", error);
    return [];
  }
}

// Sales by category
export async function getSalesByCategory() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data: saleItems } = await supabase
      .from("sale_items")
      .select(`
        product_id,
        quantity,
        total,
        product:products(category_id, category:categories(name)),
        sale:sales!inner(company_id, status)
      `)
      .eq("sale.company_id", profile.company_id)
      .in("sale.status", ["confirmed", "completed"]);

    if (!saleItems) return [];

    // Aggregate by category
    const categoryMap = new Map();
    
    saleItems.forEach(item => {
      const categoryName = (item.product as any)?.category?.name || "Sin categoría";
      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName);
        existing.quantity += item.quantity;
        existing.revenue += item.total;
        existing.sales += 1;
      } else {
        categoryMap.set(categoryName, {
          category: categoryName,
          quantity: item.quantity,
          revenue: item.total,
          sales: 1,
        });
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error("Error fetching sales by category:", error);
    return [];
  }
}

// Cash flow (payments received)
export async function getCashFlow(days: number = 30) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: payments } = await supabase
      .from("sale_payments")
      .select(`
        payment_date,
        amount,
        payment_method,
        sale:sales!inner(company_id)
      `)
      .eq("sale.company_id", profile.company_id)
      .gte("payment_date", startDate.toISOString())
      .order("payment_date", { ascending: true });

    if (!payments) return [];

    // Group by date
    const dateMap = new Map();
    payments.forEach(payment => {
      const date = payment.payment_date.split("T")[0];
      if (dateMap.has(date)) {
        const existing = dateMap.get(date);
        existing.amount += payment.amount;
        existing.count += 1;
      } else {
        dateMap.set(date, {
          date,
          amount: payment.amount,
          count: 1,
        });
      }
    });

    return Array.from(dateMap.values());
  } catch (error) {
    console.error("Error fetching cash flow:", error);
    return [];
  }
}

// ============================================
// ADVANCED ANALYTICS FUNCTIONS (Pro/Empresarial)
// ============================================

/**
 * Calcula márgenes de ganancia por producto
 * Disponible para planes Pro y Empresarial
 */
export async function getProfitMarginsByProduct(
  dateRange?: { start: Date; end: Date }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    // Build query for sale items
    let query = supabase
      .from("sale_items")
      .select(`
        product_id,
        product_name,
        quantity,
        unit_price,
        total,
        product:products(cost),
        sale:sales!inner(company_id, status, sale_date)
      `)
      .eq("sale.company_id", profile.company_id)
      .in("sale.status", ["confirmed", "completed"]);

    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte("sale.sale_date", dateRange.start.toISOString())
        .lte("sale.sale_date", dateRange.end.toISOString());
    }

    const { data: saleItems } = await query;

    if (!saleItems) return [];

    // Aggregate by product
    const productMap = new Map();
    
    saleItems.forEach(item => {
      const key = item.product_id || item.product_name;
      const cost = (item.product as any)?.cost || 0;
      const itemCost = cost * item.quantity;
      
      if (productMap.has(key)) {
        const existing = productMap.get(key);
        existing.revenue += item.total;
        existing.cost += itemCost;
        existing.quantity += item.quantity;
      } else {
        productMap.set(key, {
          id: item.product_id,
          name: item.product_name,
          revenue: item.total,
          cost: itemCost,
          quantity: item.quantity,
        });
      }
    });

    // Calculate profit margins
    return Array.from(productMap.values())
      .map(product => {
        const profit = product.revenue - product.cost;
        const profitMargin = product.revenue > 0 
          ? (profit / product.revenue) * 100 
          : 0;
        
        return {
          ...product,
          profit,
          profitMargin: Math.round(profitMargin * 100) / 100, // Round to 2 decimals
        };
      })
      .sort((a, b) => b.profitMargin - a.profitMargin);
  } catch (error) {
    console.error("Error calculating profit margins by product:", error);
    return [];
  }
}

/**
 * Calcula márgenes de ganancia por categoría
 * Disponible para planes Pro y Empresarial
 */
export async function getProfitMarginsByCategory(
  dateRange?: { start: Date; end: Date }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    // Build query for sale items with category info
    let query = supabase
      .from("sale_items")
      .select(`
        product_id,
        quantity,
        total,
        product:products(cost, category_id, category:categories(id, name)),
        sale:sales!inner(company_id, status, sale_date)
      `)
      .eq("sale.company_id", profile.company_id)
      .in("sale.status", ["confirmed", "completed"]);

    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte("sale.sale_date", dateRange.start.toISOString())
        .lte("sale.sale_date", dateRange.end.toISOString());
    }

    const { data: saleItems } = await query;

    if (!saleItems) return [];

    // Aggregate by category
    const categoryMap = new Map();
    
    saleItems.forEach(item => {
      const category = (item.product as any)?.category;
      const categoryId = category?.id || "uncategorized";
      const categoryName = category?.name || "Sin categoría";
      const cost = (item.product as any)?.cost || 0;
      const itemCost = cost * item.quantity;
      
      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId);
        existing.revenue += item.total;
        existing.cost += itemCost;
        existing.quantity += item.quantity;
      } else {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          revenue: item.total,
          cost: itemCost,
          quantity: item.quantity,
        });
      }
    });

    // Calculate profit margins
    return Array.from(categoryMap.values())
      .map(category => {
        const profit = category.revenue - category.cost;
        const profitMargin = category.revenue > 0 
          ? (profit / category.revenue) * 100 
          : 0;
        
        return {
          ...category,
          profit,
          profitMargin: Math.round(profitMargin * 100) / 100,
        };
      })
      .sort((a, b) => b.profitMargin - a.profitMargin);
  } catch (error) {
    console.error("Error calculating profit margins by category:", error);
    return [];
  }
}

/**
 * Calcula tendencias de ventas con comparaciones
 * Disponible para planes Pro y Empresarial
 */
export async function getSalesTrends(
  period: 'month' | 'year' = 'month'
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const now = new Date();
    let periodsToFetch = 12; // Default for months
    let periodLength = 1; // 1 month
    
    if (period === 'year') {
      periodsToFetch = 5; // Last 5 years
      periodLength = 12; // 12 months
    }

    // Fetch sales data for the required periods
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - (periodsToFetch * periodLength));

    const { data: sales } = await supabase
      .from("sales")
      .select("sale_date, total, status")
      .eq("company_id", profile.company_id)
      .gte("sale_date", startDate.toISOString())
      .in("status", ["confirmed", "completed"])
      .order("sale_date", { ascending: true });

    if (!sales) return [];

    // Group by period
    const periodMap = new Map();
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.sale_date);
      let periodKey: string;
      
      if (period === 'month') {
        periodKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      } else {
        periodKey = String(saleDate.getFullYear());
      }
      
      if (periodMap.has(periodKey)) {
        const existing = periodMap.get(periodKey);
        existing.value += sale.total;
        existing.count += 1;
      } else {
        periodMap.set(periodKey, {
          period: periodKey,
          value: sale.total,
          count: 1,
        });
      }
    });

    // Calculate growth percentages
    const periods = Array.from(periodMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    return periods.map(([periodKey, data], index) => {
      let previousValue = 0;
      let growthPercentage = 0;
      let growthDirection: 'up' | 'down' | 'flat' = 'flat';
      
      if (index > 0) {
        previousValue = periods[index - 1][1].value;
        if (previousValue > 0) {
          growthPercentage = ((data.value - previousValue) / previousValue) * 100;
          growthDirection = growthPercentage > 0 ? 'up' : growthPercentage < 0 ? 'down' : 'flat';
        }
      }
      
      return {
        period: periodKey,
        currentValue: data.value,
        previousValue,
        growthPercentage: Math.round(growthPercentage * 100) / 100,
        growthDirection,
        salesCount: data.count,
      };
    });
  } catch (error) {
    console.error("Error calculating sales trends:", error);
    return [];
  }
}

/**
 * Segmenta clientes por comportamiento de compra (RFM Analysis)
 * Disponible para planes Pro y Empresarial
 */
export async function getCustomerSegmentation() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    const { data: sales } = await supabase
      .from("sales")
      .select("customer_id, sale_date, total, status, customer:customers(name)")
      .eq("company_id", profile.company_id)
      .in("status", ["confirmed", "completed"])
      .not("customer_id", "is", null)
      .order("sale_date", { ascending: false });

    if (!sales) return [];

    const now = new Date();
    const customerMap = new Map();

    // Calculate RFM metrics for each customer
    sales.forEach(sale => {
      if (!sale.customer_id) return;
      
      const saleDate = new Date(sale.sale_date);
      const daysSinceLastPurchase = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (customerMap.has(sale.customer_id)) {
        const existing = customerMap.get(sale.customer_id);
        existing.frequency += 1;
        existing.monetary += sale.total;
        existing.recency = Math.min(existing.recency, daysSinceLastPurchase);
        existing.lastPurchaseDate = saleDate > existing.lastPurchaseDate ? saleDate : existing.lastPurchaseDate;
      } else {
        customerMap.set(sale.customer_id, {
          customerId: sale.customer_id,
          customerName: (sale.customer as any)?.name || "Sin nombre",
          recency: daysSinceLastPurchase,
          frequency: 1,
          monetary: sale.total,
          lastPurchaseDate: saleDate,
        });
      }
    });

    const customers = Array.from(customerMap.values());

    // Calculate quartiles for segmentation
    const recencies = customers.map(c => c.recency).sort((a, b) => a - b);
    const frequencies = customers.map(c => c.frequency).sort((a, b) => b - a);
    const monetaries = customers.map(c => c.monetary).sort((a, b) => b - a);

    const getQuartile = (value: number, sortedArray: number[]) => {
      const index = sortedArray.indexOf(value);
      const percentile = index / sortedArray.length;
      if (percentile <= 0.25) return 4;
      if (percentile <= 0.5) return 3;
      if (percentile <= 0.75) return 2;
      return 1;
    };

    // Assign segments based on RFM scores
    const segmentedCustomers = customers.map(customer => {
      const rScore = getQuartile(customer.recency, recencies);
      const fScore = getQuartile(customer.frequency, frequencies);
      const mScore = getQuartile(customer.monetary, monetaries);
      const rfmScore = rScore + fScore + mScore;

      let segment = "Regular";
      if (rfmScore >= 10) segment = "Champions";
      else if (rfmScore >= 8) segment = "Loyal";
      else if (rfmScore >= 6) segment = "Potential";
      else if (rScore <= 2) segment = "At Risk";
      else if (fScore === 1 && mScore === 1) segment = "Lost";

      return {
        ...customer,
        segment,
        rfmScore,
      };
    });

    // Aggregate by segment
    const segmentMap = new Map();
    
    segmentedCustomers.forEach(customer => {
      if (segmentMap.has(customer.segment)) {
        const existing = segmentMap.get(customer.segment);
        existing.customerCount += 1;
        existing.totalRevenue += customer.monetary;
        existing.totalPurchases += customer.frequency;
        existing.avgRecency += customer.recency;
      } else {
        segmentMap.set(customer.segment, {
          segmentName: customer.segment,
          customerCount: 1,
          totalRevenue: customer.monetary,
          totalPurchases: customer.frequency,
          avgRecency: customer.recency,
        });
      }
    });

    return Array.from(segmentMap.values())
      .map(segment => ({
        ...segment,
        averageOrderValue: segment.totalRevenue / segment.totalPurchases,
        purchaseFrequency: segment.totalPurchases / segment.customerCount,
        lastPurchaseDays: Math.round(segment.avgRecency / segment.customerCount),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error) {
    console.error("Error calculating customer segmentation:", error);
    return [];
  }
}

/**
 * Calcula rotación de inventario
 * Disponible para planes Pro y Empresarial
 */
export async function getInventoryTurnover(
  dateRange?: { start: Date; end: Date }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return [];

    // Get products with inventory tracking
    const { data: products } = await supabase
      .from("products")
      .select("id, name, stock_quantity, track_inventory, category:categories(name)")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .eq("track_inventory", true);

    if (!products) return [];

    // Build query for sale items
    let query = supabase
      .from("sale_items")
      .select(`
        product_id,
        quantity,
        sale:sales!inner(company_id, status, sale_date)
      `)
      .eq("sale.company_id", profile.company_id)
      .in("sale.status", ["confirmed", "completed"]);

    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte("sale.sale_date", dateRange.start.toISOString())
        .lte("sale.sale_date", dateRange.end.toISOString());
    } else {
      // Default to last 90 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      query = query.gte("sale.sale_date", startDate.toISOString());
    }

    const { data: saleItems } = await query;

    // Calculate turnover for each product
    const turnoverData = products.map(product => {
      const productSales = saleItems?.filter(item => item.product_id === product.id) || [];
      const unitsSold = productSales.reduce((sum, item) => sum + item.quantity, 0);
      const averageInventory = product.stock_quantity + (unitsSold / 2); // Simplified average
      const turnoverRate = averageInventory > 0 ? unitsSold / averageInventory : 0;
      const daysToSell = turnoverRate > 0 ? 365 / turnoverRate : 0;

      let status: 'fast' | 'normal' | 'slow' = 'normal';
      if (turnoverRate > 4) status = 'fast';
      else if (turnoverRate < 1) status = 'slow';

      return {
        productId: product.id,
        productName: product.name,
        category: (product.category as any)?.name || "Sin categoría",
        unitsSold,
        averageInventory: Math.round(averageInventory * 100) / 100,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        daysToSell: Math.round(daysToSell),
        status,
      };
    });

    return turnoverData
      .filter(item => item.unitsSold > 0)
      .sort((a, b) => b.turnoverRate - a.turnoverRate);
  } catch (error) {
    console.error("Error calculating inventory turnover:", error);
    return [];
  }
}

/**
 * Calcula métricas de rendimiento de proveedores
 * Solo disponible si el plan tiene acceso a proveedores
 */
export async function getSupplierPerformance(
  dateRange?: { start: Date; end: Date }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Usuario no autenticado", data: [] };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa no encontrada", data: [] };

    // Check supplier access
    const { canAccessSuppliers } = await import("@/lib/utils/plan-limits");
    const access = await canAccessSuppliers(profile.company_id);
    
    if (!access.allowed) {
      return { error: access.message, data: [] };
    }

    // Build query for purchase orders
    let query = supabase
      .from("purchase_orders")
      .select(`
        id,
        supplier_id,
        order_date,
        expected_date,
        received_date,
        status,
        total,
        supplier:suppliers(id, name)
      `)
      .eq("company_id", profile.company_id);

    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte("order_date", dateRange.start.toISOString())
        .lte("order_date", dateRange.end.toISOString());
    }

    const { data: purchaseOrders } = await query;

    if (!purchaseOrders || purchaseOrders.length === 0) {
      return { error: null, data: [] };
    }

    // Aggregate by supplier
    const supplierMap = new Map();
    
    purchaseOrders.forEach(po => {
      const supplierId = po.supplier_id;
      const supplierName = (po.supplier as any)?.name || "Sin nombre";
      
      // Calculate delivery metrics
      const isCompleted = po.status === "received";
      const expectedDate = po.expected_date ? new Date(po.expected_date) : null;
      const receivedDate = po.received_date ? new Date(po.received_date) : null;
      const orderDate = new Date(po.order_date);
      
      let isOnTime = false;
      let leadTimeDays = 0;
      
      if (isCompleted && receivedDate && expectedDate) {
        isOnTime = receivedDate <= expectedDate;
        leadTimeDays = Math.floor((receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      if (supplierMap.has(supplierId)) {
        const existing = supplierMap.get(supplierId);
        existing.totalOrders += 1;
        existing.totalSpend += po.total;
        if (isCompleted) {
          existing.completedOrders += 1;
          if (isOnTime) existing.onTimeOrders += 1;
          if (leadTimeDays > 0) {
            existing.totalLeadTime += leadTimeDays;
            existing.leadTimeCount += 1;
          }
        }
      } else {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName,
          totalOrders: 1,
          completedOrders: isCompleted ? 1 : 0,
          onTimeOrders: isOnTime ? 1 : 0,
          totalSpend: po.total,
          totalLeadTime: leadTimeDays > 0 ? leadTimeDays : 0,
          leadTimeCount: leadTimeDays > 0 ? 1 : 0,
        });
      }
    });

    // Calculate performance metrics
    const performanceData = Array.from(supplierMap.values())
      .map(supplier => {
        const onTimeDeliveryRate = supplier.completedOrders > 0
          ? (supplier.onTimeOrders / supplier.completedOrders) * 100
          : 0;
        
        const averageLeadTimeDays = supplier.leadTimeCount > 0
          ? supplier.totalLeadTime / supplier.leadTimeCount
          : 0;
        
        // Simple quality score based on on-time delivery
        const qualityScore = Math.round(onTimeDeliveryRate);
        
        // Performance score: weighted average of on-time rate and order completion
        const completionRate = (supplier.completedOrders / supplier.totalOrders) * 100;
        const performanceScore = Math.round((onTimeDeliveryRate * 0.7) + (completionRate * 0.3));
        
        return {
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          totalOrders: supplier.totalOrders,
          onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
          averageLeadTimeDays: Math.round(averageLeadTimeDays * 10) / 10,
          totalSpend: supplier.totalSpend,
          qualityScore,
          performanceScore,
        };
      })
      .sort((a, b) => b.performanceScore - a.performanceScore);

    return { error: null, data: performanceData };
  } catch (error) {
    console.error("Error calculating supplier performance:", error);
    return { error: "Error al calcular rendimiento de proveedores", data: [] };
  }
}

/**
 * Genera analíticas de órdenes de compra
 * Solo disponible si el plan tiene acceso a órdenes de compra
 */
export async function getPurchaseOrderAnalytics(
  dateRange?: { start: Date; end: Date }
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Usuario no autenticado", data: null };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa no encontrada", data: null };

    // Check purchase order access
    const { canAccessPurchaseOrders } = await import("@/lib/utils/plan-limits");
    const access = await canAccessPurchaseOrders(profile.company_id);
    
    if (!access.allowed) {
      return { error: access.message, data: null };
    }

    // Build query for purchase orders
    let query = supabase
      .from("purchase_orders")
      .select("id, order_date, status, total, payment_status")
      .eq("company_id", profile.company_id);

    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte("order_date", dateRange.start.toISOString())
        .lte("order_date", dateRange.end.toISOString());
    }

    const { data: purchaseOrders } = await query;

    if (!purchaseOrders || purchaseOrders.length === 0) {
      return { 
        error: null, 
        data: {
          totalOrders: 0,
          totalSpend: 0,
          averageOrderValue: 0,
          fulfillmentRate: 0,
          paymentRate: 0,
          byStatus: {},
          byMonth: [],
        }
      };
    }

    // Calculate metrics
    const totalOrders = purchaseOrders.length;
    const totalSpend = purchaseOrders.reduce((sum, po) => sum + po.total, 0);
    const averageOrderValue = totalSpend / totalOrders;
    
    const fulfilledOrders = purchaseOrders.filter(po => po.status === "received").length;
    const fulfillmentRate = (fulfilledOrders / totalOrders) * 100;
    
    const paidOrders = purchaseOrders.filter(po => po.payment_status === "paid").length;
    const paymentRate = (paidOrders / totalOrders) * 100;

    // Group by status
    const byStatus: Record<string, number> = {};
    purchaseOrders.forEach(po => {
      byStatus[po.status] = (byStatus[po.status] || 0) + 1;
    });

    // Group by month
    const monthMap = new Map();
    purchaseOrders.forEach(po => {
      const date = new Date(po.order_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthMap.has(monthKey)) {
        const existing = monthMap.get(monthKey);
        existing.orders += 1;
        existing.spend += po.total;
      } else {
        monthMap.set(monthKey, {
          month: monthKey,
          orders: 1,
          spend: po.total,
        });
      }
    });

    const byMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    return {
      error: null,
      data: {
        totalOrders,
        totalSpend: Math.round(totalSpend * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
        paymentRate: Math.round(paymentRate * 100) / 100,
        byStatus,
        byMonth,
      },
    };
  } catch (error) {
    console.error("Error calculating purchase order analytics:", error);
    return { error: "Error al calcular analíticas de órdenes de compra", data: null };
  }
}

// ============================================
// COMPLETE REPORTS FUNCTIONS (Empresarial only)
// ============================================

/**
 * Genera pronóstico de ventas basado en datos históricos
 * Disponible solo para plan Empresarial
 */
export async function getSalesForecast(forecastDays: number = 30) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Usuario no autenticado", data: [] };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa no encontrada", data: [] };

    // Query at least 90 days of historical data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const { data: sales } = await supabase
      .from("sales")
      .select("sale_date, total, status")
      .eq("company_id", profile.company_id)
      .gte("sale_date", startDate.toISOString())
      .lte("sale_date", endDate.toISOString())
      .in("status", ["confirmed", "completed"])
      .order("sale_date", { ascending: true });

    if (!sales || sales.length < 30) {
      return { 
        error: "Se requieren al menos 30 días de datos históricos para generar un pronóstico", 
        data: [] 
      };
    }

    // Group by day
    const dailyMap = new Map();
    sales.forEach(sale => {
      const date = sale.sale_date.split("T")[0];
      if (dailyMap.has(date)) {
        dailyMap.set(date, dailyMap.get(date) + sale.total);
      } else {
        dailyMap.set(date, sale.total);
      }
    });

    const historicalData = Array.from(dailyMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Simple moving average forecast
    const windowSize = 7; // 7-day moving average
    const values = historicalData.map(d => d.value);
    
    // Calculate moving average
    const movingAvg = values.slice(-windowSize).reduce((sum, val) => sum + val, 0) / windowSize;
    
    // Calculate standard deviation for confidence intervals
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Generate forecast
    const forecast = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      // Simple forecast with slight trend adjustment
      const trend = (values[values.length - 1] - values[0]) / values.length;
      const forecastedValue = movingAvg + (trend * i);
      
      forecast.push({
        date: forecastDate.toISOString().split("T")[0],
        forecastedValue: Math.max(0, Math.round(forecastedValue * 100) / 100),
        confidenceLower: Math.max(0, Math.round((forecastedValue - stdDev * 1.96) * 100) / 100),
        confidenceUpper: Math.round((forecastedValue + stdDev * 1.96) * 100) / 100,
      });
    }

    return { error: null, data: forecast };
  } catch (error) {
    console.error("Error generating sales forecast:", error);
    return { error: "Error al generar pronóstico de ventas", data: [] };
  }
}

/**
 * Calcula métricas de analítica predictiva
 * Disponible solo para plan Empresarial
 */
export async function getPredictiveAnalytics() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Usuario no autenticado", data: null };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa no encontrada", data: null };

    // Get recent sales data (last 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const { data: recentSales } = await supabase
      .from("sale_items")
      .select(`
        product_id,
        product_name,
        quantity,
        total,
        sale:sales!inner(company_id, status, sale_date, customer_id)
      `)
      .eq("sale.company_id", profile.company_id)
      .gte("sale.sale_date", startDate.toISOString())
      .in("sale.status", ["confirmed", "completed"]);

    if (!recentSales || recentSales.length === 0) {
      return { error: null, data: { trendingProducts: [], atRiskCustomers: [], seasonalPatterns: [] } };
    }

    // Identify trending products (increasing sales velocity)
    const productMap = new Map();
    const now = new Date();
    
    recentSales.forEach(item => {
      const saleDate = new Date((item.sale as any).sale_date);
      const daysAgo = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      const period = daysAgo < 30 ? "recent" : "older";
      
      const key = item.product_id || item.product_name;
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: item.product_id,
          productName: item.product_name,
          recentSales: 0,
          olderSales: 0,
          recentRevenue: 0,
          olderRevenue: 0,
        });
      }
      
      const product = productMap.get(key);
      if (period === "recent") {
        product.recentSales += item.quantity;
        product.recentRevenue += item.total;
      } else {
        product.olderSales += item.quantity;
        product.olderRevenue += item.total;
      }
    });

    const trendingProducts = Array.from(productMap.values())
      .map(p => ({
        ...p,
        trend: p.olderSales > 0 ? ((p.recentSales - p.olderSales) / p.olderSales) * 100 : 0,
      }))
      .filter(p => p.trend > 20) // At least 20% growth
      .sort((a, b) => b.trend - a.trend)
      .slice(0, 5);

    // Identify at-risk customers (haven't purchased recently)
    const customerMap = new Map();
    
    recentSales.forEach(item => {
      const customerId = (item.sale as any).customer_id;
      if (!customerId) return;
      
      const saleDate = new Date((item.sale as any).sale_date);
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          lastPurchaseDate: saleDate,
          purchaseCount: 1,
          totalSpent: item.total,
        });
      } else {
        const customer = customerMap.get(customerId);
        customer.purchaseCount += 1;
        customer.totalSpent += item.total;
        if (saleDate > customer.lastPurchaseDate) {
          customer.lastPurchaseDate = saleDate;
        }
      }
    });

    const atRiskCustomers = Array.from(customerMap.values())
      .map(c => {
        const daysSinceLastPurchase = Math.floor((now.getTime() - c.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        return { ...c, daysSinceLastPurchase };
      })
      .filter(c => c.daysSinceLastPurchase > 45 && c.purchaseCount > 2) // Regular customers who haven't purchased in 45+ days
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Identify seasonal patterns (day of week analysis)
    const dayOfWeekMap = new Map();
    
    recentSales.forEach(item => {
      const saleDate = new Date((item.sale as any).sale_date);
      const dayOfWeek = saleDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (!dayOfWeekMap.has(dayOfWeek)) {
        dayOfWeekMap.set(dayOfWeek, { sales: 0, revenue: 0 });
      }
      
      const day = dayOfWeekMap.get(dayOfWeek);
      day.sales += item.quantity;
      day.revenue += item.total;
    });

    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const seasonalPatterns = Array.from(dayOfWeekMap.entries())
      .map(([day, data]) => ({
        day: dayNames[day],
        sales: data.sales,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      error: null,
      data: {
        trendingProducts,
        atRiskCustomers,
        seasonalPatterns,
      },
    };
  } catch (error) {
    console.error("Error calculating predictive analytics:", error);
    return { error: "Error al calcular analítica predictiva", data: null };
  }
}

/**
 * Genera reportes consolidados multi-empresa
 * Solo para usuarios con acceso a múltiples empresas
 */
export async function getMultiCompanyReport(companyIds: string[]) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Usuario no autenticado", data: [] };

    if (!companyIds || companyIds.length === 0) {
      return { error: "Debe especificar al menos una empresa", data: [] };
    }

    // Validate user has access to all specified companies
    const { data: userCompanies } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id);

    const accessibleCompanyIds = userCompanies?.map(p => p.company_id) || [];
    const unauthorizedCompanies = companyIds.filter(id => !accessibleCompanyIds.includes(id));
    
    if (unauthorizedCompanies.length > 0) {
      return { error: "No tiene acceso a todas las empresas especificadas", data: [] };
    }

    // Query aggregated data across companies
    const { data: sales } = await supabase
      .from("sales")
      .select("company_id, total, status, sale_date")
      .in("company_id", companyIds)
      .in("status", ["confirmed", "completed"]);

    if (!sales || sales.length === 0) {
      return { error: null, data: [] };
    }

    // Get company names
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds);

    const companyNameMap = new Map(companies?.map(c => [c.id, c.name]) || []);

    // Aggregate by company
    const companyMap = new Map();
    
    sales.forEach(sale => {
      if (!companyMap.has(sale.company_id)) {
        companyMap.set(sale.company_id, {
          companyId: sale.company_id,
          companyName: companyNameMap.get(sale.company_id) || "Sin nombre",
          totalSales: 0,
          totalRevenue: 0,
        });
      }
      
      const company = companyMap.get(sale.company_id);
      company.totalSales += 1;
      company.totalRevenue += sale.total;
    });

    const consolidatedData = Array.from(companyMap.values())
      .map(company => ({
        ...company,
        averageOrderValue: company.totalRevenue / company.totalSales,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return { error: null, data: consolidatedData };
  } catch (error) {
    console.error("Error generating multi-company report:", error);
    return { error: "Error al generar reporte multi-empresa", data: [] };
  }
}

/**
 * Ejecuta consulta de reporte personalizado
 * Disponible solo para plan Empresarial
 */
export async function executeCustomReport(reportConfig: {
  name: string;
  dataSource: 'sales' | 'products' | 'customers';
  metrics: string[];
  dateRange?: { start: Date; end: Date };
}) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Usuario no autenticado", data: [] };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa no encontrada", data: [] };

    // Basic validation
    if (!reportConfig.dataSource || !reportConfig.metrics || reportConfig.metrics.length === 0) {
      return { error: "Configuración de reporte inválida", data: [] };
    }

    // Execute query based on data source
    let data: any[] = [];
    
    if (reportConfig.dataSource === 'sales') {
      let query = supabase
        .from("sales")
        .select("id, sale_date, total, status, customer:customers(name)")
        .eq("company_id", profile.company_id);
      
      if (reportConfig.dateRange) {
        query = query
          .gte("sale_date", reportConfig.dateRange.start.toISOString())
          .lte("sale_date", reportConfig.dateRange.end.toISOString());
      }
      
      const { data: salesData } = await query;
      data = salesData || [];
    } else if (reportConfig.dataSource === 'products') {
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, sku, price, cost, stock_quantity, category:categories(name)")
        .eq("company_id", profile.company_id)
        .eq("is_active", true);
      
      data = productsData || [];
    } else if (reportConfig.dataSource === 'customers') {
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, name, email, phone, status")
        .eq("company_id", profile.company_id);
      
      data = customersData || [];
    }

    return { error: null, data, reportName: reportConfig.name };
  } catch (error) {
    console.error("Error executing custom report:", error);
    return { error: "Error al ejecutar reporte personalizado", data: [] };
  }
}

/**
 * Exporta datos de reporte en formato especificado
 * Disponible para planes con acceso a exportación
 */
export async function exportReport(
  reportData: any[],
  format: 'pdf' | 'excel' | 'csv',
  reportName: string,
  metadata?: {
    companyName?: string;
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
  }
) {
  try {
    const { data: { user } } = await (await import("@/lib/supabase/server")).createClient().auth.getUser();
    if (!user) return { error: "Usuario no autenticado", data: null };

    const { data: profile } = await (await import("@/lib/supabase/server")).createClient()
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "Empresa no encontrada", data: null };

    // Check export access
    const { canExportToExcel } = await import("@/lib/utils/plan-limits");
    const access = await canExportToExcel(profile.company_id);
    
    if (!access.allowed) {
      return { error: access.message, data: null };
    }

    // Generate export based on format
    if (format === 'csv') {
      // Simple CSV export
      if (reportData.length === 0) {
        return { error: "No hay datos para exportar", data: null };
      }
      
      const headers = Object.keys(reportData[0]);
      const csvRows = [headers.join(',')];
      
      reportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      
      return {
        error: null,
        data: {
          content: csvContent,
          filename: `${reportName}_${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv',
        },
      };
    }
    
    // For PDF and Excel, return a placeholder (would need additional libraries)
    return {
      error: `Exportación a ${format.toUpperCase()} no implementada aún`,
      data: null,
    };
  } catch (error) {
    console.error("Error exporting report:", error);
    return { error: "Error al exportar reporte", data: null };
  }
}
