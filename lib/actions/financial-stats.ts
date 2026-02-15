"use server";

import { createClient } from "@/lib/supabase/server";
import { getCustomerBalance } from "@/lib/actions/customers";
import { getSupplierBalance } from "@/lib/actions/suppliers";

export interface FinancialStats {
  dailySales: number;
  currentCashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  monthlyProfit: number;
  currency: string;
  lastUpdated: Date;
}

/**
 * Obtiene todas las estadísticas financieras para el dashboard
 */
export async function getFinancialStats(): Promise<FinancialStats | null> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[FinancialStats] No user found");
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      console.log("[FinancialStats] No company_id found for user");
      return null;
    }

    console.log("[FinancialStats] Calculating stats for company:", profile.company_id);

    const currency = "ARS"; // Default currency

    // Calculate all metrics in parallel
    const [dailySales, currentCashBalance, accountsReceivable, accountsPayable, monthlyProfit] = await Promise.all([
      calculateDailySales(profile.company_id),
      calculateCurrentCashBalance(profile.company_id),
      calculateAccountsReceivable(profile.company_id),
      calculateAccountsPayable(profile.company_id),
      calculateMonthlyProfit(profile.company_id),
    ]);

    console.log("[FinancialStats] Results:", {
      dailySales,
      currentCashBalance,
      accountsReceivable,
      accountsPayable,
      monthlyProfit,
    });

    return {
      dailySales,
      currentCashBalance,
      accountsReceivable,
      accountsPayable,
      monthlyProfit,
      currency,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("[FinancialStats] Error fetching financial stats:", error);
    return null;
  }
}

/**
 * Calcula las ventas del día actual
 */
async function calculateDailySales(companyId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("sales")
      .select("total")
      .eq("company_id", companyId)
      .gte("sale_date", today)
      .lt("sale_date", new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0])
      .in("status", ["confirmed", "completed"]);

    if (error) throw error;

    return (data || []).reduce((sum, sale) => sum + sale.total, 0);
  } catch (error) {
    console.error("Error calculating daily sales:", error);
    return 0;
  }
}

/**
 * Calcula el saldo de caja actual
 */
async function calculateCurrentCashBalance(companyId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    // Get the latest cash register opening
    const { data: opening, error: openingError } = await supabase
      .from("cash_register_openings")
      .select("id, initial_cash_amount, opened_at:opening_date")
      .eq("company_id", companyId)
      .order("opening_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openingError) {
      console.error("[FinancialStats] Error fetching cash register opening:", openingError);
    }

    // If no opening exists, try to get initial_cash_amount from company
    if (!opening) {
      console.log("[FinancialStats] No cash register opening found, using company initial_cash_amount");
      const { data: company } = await supabase
        .from("companies")
        .select("initial_cash_amount")
        .eq("id", companyId)
        .single();
      
      return company?.initial_cash_amount || 0;
    }

    console.log("[FinancialStats] Found opening with initial amount:", opening.initial_cash_amount);

    // For now, just return the initial cash amount from the opening
    // TODO: When cash_register table is created, calculate actual balance with movements
    return opening.initial_cash_amount;
  } catch (error) {
    console.error("[FinancialStats] Error calculating current cash balance:", error);
    return 0;
  }
}

/**
 * Calcula el total de cuentas por cobrar
 */
async function calculateAccountsReceivable(companyId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    // Get all customers for the company
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", companyId)
      .eq("status", "active");

    if (error) throw error;

    if (!customers || customers.length === 0) {
      return 0;
    }

    // Calculate balance for each customer
    const balances = await Promise.all(
      customers.map(customer => getCustomerBalance(customer.id))
    );

    // Sum all positive balances
    return balances.reduce((sum, balance) => sum + (balance > 0 ? balance : 0), 0);
  } catch (error) {
    console.error("Error calculating accounts receivable:", error);
    return 0;
  }
}

/**
 * Calcula el total de cuentas por pagar
 */
async function calculateAccountsPayable(companyId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    // Get all suppliers for the company
    const { data: suppliers, error } = await supabase
      .from("suppliers")
      .select("id")
      .eq("company_id", companyId)
      .eq("status", "active");

    if (error) throw error;

    if (!suppliers || suppliers.length === 0) {
      return 0;
    }

    // Calculate balance for each supplier
    const balances = await Promise.all(
      suppliers.map(supplier => getSupplierBalance(supplier.id))
    );

    // Sum all positive balances
    return balances.reduce((sum, balance) => sum + (balance > 0 ? balance : 0), 0);
  } catch (error) {
    console.error("Error calculating accounts payable:", error);
    return 0;
  }
}

/**
 * Calcula la ganancia del mes actual
 */
async function calculateMonthlyProfit(companyId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    // Get start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Get all sales for the current month with their items
    const { data: sales, error } = await supabase
      .from("sales")
      .select(`
        id,
        items:sale_items(
          quantity,
          unit_price,
          product_id
        )
      `)
      .eq("company_id", companyId)
      .gte("sale_date", startOfMonth)
      .lte("sale_date", endOfMonth)
      .in("status", ["confirmed", "completed"]);

    if (error) throw error;

    if (!sales || sales.length === 0) {
      return 0;
    }

    // Get product costs for all products in sales
    const productIds = Array.from(new Set(
      sales.flatMap(sale => 
        (sale.items || [])
          .map(item => item.product_id)
          .filter(Boolean)
      )
    ));

    const { data: products } = await supabase
      .from("products")
      .select("id, cost")
      .in("id", productIds);

    const productCosts = new Map(
      (products || []).map(p => [p.id, p.cost || 0])
    );

    // Calculate profit: sum(unit_price * quantity - cost * quantity)
    let totalProfit = 0;

    for (const sale of sales) {
      for (const item of sale.items || []) {
        const revenue = item.unit_price * item.quantity;
        const cost = (productCosts.get(item.product_id) || 0) * item.quantity;
        totalProfit += revenue - cost;
      }
    }

    return totalProfit;
  } catch (error) {
    console.error("Error calculating monthly profit:", error);
    return 0;
  }
}
