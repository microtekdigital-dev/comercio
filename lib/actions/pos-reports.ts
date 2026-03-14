"use server";

import { createClient } from "@/lib/supabase/server";
import type { POSSalesByCashier, POSTopProduct, POSPaymentMethodReport } from "@/lib/types/pos";

/**
 * Get POS sales report grouped by cashier for a date range.
 * Only includes completed sales belonging to the authenticated user's company.
 * Requirements: 7.1
 */
export async function getPOSReportSalesByCashier({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}): Promise<POSSalesByCashier[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return [];

  // Fetch completed sales in the date range with the cashier profile
  const { data: sales, error } = await supabase
    .from("sales")
    .select(
      `
      id,
      total,
      created_by,
      profiles!sales_created_by_fkey(id, full_name, email)
    `
    )
    .eq("company_id", profile.company_id)
    .eq("status", "completed")
    .gte("sale_date", dateFrom)
    .lte("sale_date", dateTo);

  if (error || !sales) return [];

  // Group in memory by created_by
  const grouped = new Map<
    string,
    { cashier_name: string; total_sales: number; total_amount: number }
  >();

  for (const sale of sales) {
    const cashierId = sale.created_by as string;
    if (!cashierId) continue;

    const cashierProfile = sale.profiles as
      | { id: string; full_name: string | null; email: string | null }
      | null;
    const cashierName =
      cashierProfile?.full_name || cashierProfile?.email || cashierId;

    const existing = grouped.get(cashierId);
    if (existing) {
      existing.total_sales += 1;
      existing.total_amount += Number(sale.total ?? 0);
    } else {
      grouped.set(cashierId, {
        cashier_name: cashierName,
        total_sales: 1,
        total_amount: Number(sale.total ?? 0),
      });
    }
  }

  return Array.from(grouped.entries()).map(([cashier_id, data]) => ({
    cashier_id,
    cashier_name: data.cashier_name,
    total_sales: data.total_sales,
    total_amount: data.total_amount,
  }));
}

/**
 * Get top-selling products in POS for a date range.
 * Groups by product_id, ordered by total quantity sold (descending).
 * Filtered by the authenticated user's company_id (multi-tenant).
 * Requirements: 7.2
 */
export async function getPOSReportTopProducts({
  dateFrom,
  dateTo,
  limit = 10,
}: {
  dateFrom: string;
  dateTo: string;
  limit?: number;
}): Promise<POSTopProduct[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return [];

  // Fetch sale items joined with sales to filter by company_id and date range
  const { data: items, error } = await supabase
    .from("sale_items")
    .select(
      `
      product_id,
      product_name,
      quantity,
      total,
      sales!inner(company_id, sale_date, status)
    `
    )
    .eq("sales.company_id", profile.company_id)
    .eq("sales.status", "completed")
    .gte("sales.sale_date", dateFrom)
    .lte("sales.sale_date", dateTo);

  if (error || !items) return [];

  // Group in memory by product_id
  const grouped = new Map<
    string,
    { product_name: string; total_quantity: number; total_revenue: number }
  >();

  for (const item of items) {
    const productId = item.product_id as string;
    if (!productId) continue;

    const existing = grouped.get(productId);
    if (existing) {
      existing.total_quantity += Number(item.quantity ?? 0);
      existing.total_revenue += Number(item.total ?? 0);
    } else {
      grouped.set(productId, {
        product_name: item.product_name as string,
        total_quantity: Number(item.quantity ?? 0),
        total_revenue: Number(item.total ?? 0),
      });
    }
  }

  // Sort by total_quantity descending and limit
  return Array.from(grouped.entries())
    .map(([product_id, data]) => ({
      product_id,
      product_name: data.product_name,
      total_quantity: data.total_quantity,
      total_revenue: data.total_revenue,
    }))
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, limit);
}

/**
 * Get POS sales report grouped by payment method for a date range.
 * Queries sale_payments joined with sales to filter by company_id and date range.
 * Groups in memory by payment_method, ordered by total_amount descending.
 * Filtered by the authenticated user's company_id (multi-tenant).
 * Requirements: 7.3
 */
export async function getPOSReportPaymentMethods({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}): Promise<POSPaymentMethodReport[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return [];

  // Fetch sale_payments joined with sales to filter by company_id and date range
  const { data: payments, error } = await supabase
    .from("sale_payments")
    .select(
      `
      payment_method,
      amount,
      sales!inner(company_id, sale_date, status)
    `
    )
    .eq("sales.company_id", profile.company_id)
    .eq("sales.status", "completed")
    .gte("sales.sale_date", dateFrom)
    .lte("sales.sale_date", dateTo);

  if (error || !payments) return [];

  // Group in memory by payment_method
  const grouped = new Map<
    string,
    { transaction_count: number; total_amount: number }
  >();

  for (const payment of payments) {
    const method = (payment.payment_method as string) ?? "unknown";
    const existing = grouped.get(method);
    if (existing) {
      existing.transaction_count += 1;
      existing.total_amount += Number(payment.amount ?? 0);
    } else {
      grouped.set(method, {
        transaction_count: 1,
        total_amount: Number(payment.amount ?? 0),
      });
    }
  }

  // Sort by total_amount descending
  return Array.from(grouped.entries())
    .map(([payment_method, data]) => ({
      payment_method,
      transaction_count: data.transaction_count,
      total_amount: data.total_amount,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
}

/**
 * Get POS sales report grouped by hour of day (0-23) for a date range.
 * Returns 24 entries (one per hour). Hours with no sales have sales_count=0 and total_amount=0.
 * Filtered by the authenticated user's company_id (multi-tenant).
 * Requirements: 7.4
 */
export async function getPOSReportSalesByHour({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}): Promise<Array<{ hour: number; sales_count: number; total_amount: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return buildEmptyHours();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return buildEmptyHours();

  const { data: sales, error } = await supabase
    .from("sales")
    .select("sale_date, created_at, total")
    .eq("company_id", profile.company_id)
    .eq("status", "completed")
    .gte("sale_date", dateFrom)
    .lte("sale_date", dateTo);

  if (error || !sales) return buildEmptyHours();

  // Initialize all 24 hours with zeros
  const hourMap = new Map<number, { sales_count: number; total_amount: number }>();
  for (let h = 0; h < 24; h++) {
    hourMap.set(h, { sales_count: 0, total_amount: 0 });
  }

  // Group in memory by hour
  for (const sale of sales) {
    const dateStr = (sale.sale_date ?? sale.created_at) as string | null;
    if (!dateStr) continue;
    const hour = new Date(dateStr).getHours();
    const entry = hourMap.get(hour)!;
    entry.sales_count += 1;
    entry.total_amount += Number(sale.total ?? 0);
  }

  // Return sorted array of 24 entries
  return Array.from(hourMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, data]) => ({
      hour,
      sales_count: data.sales_count,
      total_amount: data.total_amount,
    }));
}

function buildEmptyHours(): Array<{ hour: number; sales_count: number; total_amount: number }> {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sales_count: 0,
    total_amount: 0,
  }));
}
