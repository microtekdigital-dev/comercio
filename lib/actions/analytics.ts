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

    // Calculate stats
    const thisMonthRevenue = thisMonthSales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
    const lastMonthRevenue = lastMonthSales?.reduce((sum, sale) => sum + sale.total, 0) || 0;
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    const salesGrowth = lastMonthSales && lastMonthSales.length > 0
      ? ((thisMonthSales?.length || 0) - lastMonthSales.length) / lastMonthSales.length * 100
      : 0;

    const lowStockProducts = products?.filter(
      p => p.track_inventory && p.stock_quantity <= p.min_stock_level
    ).length || 0;

    return {
      totalSales: thisMonthSales?.length || 0,
      totalRevenue: thisMonthRevenue,
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

// Top products by revenue
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
        quantity,
        total,
        sale:sales!inner(company_id, status)
      `)
      .eq("sale.company_id", profile.company_id)
      .in("sale.status", ["confirmed", "completed"]);

    if (!data) return [];

    // Aggregate by product
    const productMap = new Map();
    data.forEach(item => {
      const key = item.product_id || item.product_name;
      if (productMap.has(key)) {
        const existing = productMap.get(key);
        existing.total_quantity += item.quantity;
        existing.total_revenue += item.total;
      } else {
        productMap.set(key, {
          product_id: item.product_id,
          product_name: item.product_name,
          total_quantity: item.quantity,
          total_revenue: item.total,
        });
      }
    });

    return Array.from(productMap.values())
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
      .select("id, name, sku, stock_quantity, min_stock_level, price, cost, track_inventory, category:categories(name)")
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .eq("track_inventory", true)
      .order("stock_quantity", { ascending: true });

    if (!products) return [];

    return products.map(product => ({
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      category: (product.category as any)?.name || "Sin categoría",
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      stock_value: product.stock_quantity * product.cost,
      status: product.stock_quantity <= product.min_stock_level ? "low" : "ok",
    }));
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
