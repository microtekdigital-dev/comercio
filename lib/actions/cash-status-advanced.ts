"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  CashStatusReport,
  DailyCashStatus,
  ShiftAnalysis,
  PaymentMethodBreakdown,
  CashTrend,
  CashPeriodComparison,
  CashReportFilters,
  CashOpening,
  CashClosure,
} from "@/lib/types/reports";

/**
 * Obtiene el reporte avanzado de estado de caja
 */
export async function getAdvancedCashStatus(
  companyId: string,
  filters: CashReportFilters
): Promise<CashStatusReport> {
  const supabase = await createClient();

  const startDateStr = filters.startDate.toISOString().split("T")[0];
  const endDateStr = filters.endDate.toISOString().split("T")[0];

  // Obtener aperturas de caja
  let openingsQuery = supabase
    .from("cash_register_openings")
    .select(
      `
      id,
      opening_date,
      shift,
      opened_by,
      initial_cash_amount,
      profiles!cash_register_openings_opened_by_fkey(full_name)
    `
    )
    .eq("company_id", companyId)
    .gte("opening_date", startDateStr)
    .lte("opening_date", endDateStr);

  if (filters.shift) {
    openingsQuery = openingsQuery.eq("shift", filters.shift);
  }

  if (filters.userId) {
    openingsQuery = openingsQuery.eq("opened_by", filters.userId);
  }

  const { data: openings, error: openingsError } = await openingsQuery;

  if (openingsError) {
    console.error("Error fetching cash openings:", openingsError);
    throw new Error("Error al obtener aperturas de caja");
  }

  // Obtener cierres de caja
  let closuresQuery = supabase
    .from("cash_register_closures")
    .select(
      `
      id,
      closure_date,
      shift,
      closed_by,
      total_sales_count,
      total_sales_amount,
      cash_sales,
      card_sales,
      transfer_sales,
      other_sales,
      cash_counted,
      cash_difference,
      profiles!cash_register_closures_closed_by_fkey(full_name)
    `
    )
    .eq("company_id", companyId)
    .gte("closure_date", startDateStr)
    .lte("closure_date", endDateStr);

  if (filters.shift) {
    closuresQuery = closuresQuery.eq("shift", filters.shift);
  }

  if (filters.userId) {
    closuresQuery = closuresQuery.eq("closed_by", filters.userId);
  }

  const { data: closures, error: closuresError } = await closuresQuery;

  if (closuresError) {
    console.error("Error fetching cash closures:", closuresError);
    throw new Error("Error al obtener cierres de caja");
  }

  // Procesar datos
  const daily = processDailyCashStatus(openings || [], closures || []);
  const byShift = processShiftAnalysis(closures || []);
  const byPaymentMethod = processPaymentMethodBreakdown(closures || []);
  const trends = processCashTrends(daily);

  // Calcular resumen
  const summary = {
    totalOpenings: openings?.length || 0,
    totalClosures: closures?.length || 0,
    totalSales: closures?.reduce((sum, c) => sum + (c.total_sales_amount || 0), 0) || 0,
    totalCashSales: closures?.reduce((sum, c) => sum + (c.cash_sales || 0), 0) || 0,
    totalDifferences:
      closures?.reduce((sum, c) => sum + Math.abs(c.cash_difference || 0), 0) || 0,
    averageDifference: 0,
  };

  if (summary.totalClosures > 0) {
    summary.averageDifference = summary.totalDifferences / summary.totalClosures;
  }

  return {
    period: {
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    summary,
    daily,
    byShift,
    byPaymentMethod,
    trends,
  };
}

/**
 * Procesa el estado de caja diario
 */
function processDailyCashStatus(
  openings: any[],
  closures: any[]
): DailyCashStatus[] {
  const dailyMap = new Map<string, DailyCashStatus>();

  // Procesar aperturas
  for (const opening of openings) {
    const dateKey = new Date(opening.opening_date).toISOString().split("T")[0];
    const profiles = Array.isArray(opening.profiles)
      ? opening.profiles[0]
      : opening.profiles;

    const cashOpening: CashOpening = {
      id: opening.id,
      openingDate: new Date(opening.opening_date),
      shift: opening.shift || "Mañana",
      openedBy: opening.opened_by,
      openedByName: profiles?.full_name || "Usuario desconocido",
      initialCashAmount: opening.initial_cash_amount || 0,
    };

    if (dailyMap.has(dateKey)) {
      dailyMap.get(dateKey)!.openings.push(cashOpening);
    } else {
      dailyMap.set(dateKey, {
        date: new Date(dateKey),
        openings: [cashOpening],
        closures: [],
        totalSales: 0,
        totalDifferences: 0,
        efficiency: 100,
      });
    }
  }

  // Procesar cierres
  for (const closure of closures) {
    const dateKey = new Date(closure.closure_date).toISOString().split("T")[0];
    const profiles = Array.isArray(closure.profiles)
      ? closure.profiles[0]
      : closure.profiles;

    const cashClosure: CashClosure = {
      id: closure.id,
      closureDate: new Date(closure.closure_date),
      shift: closure.shift || "Mañana",
      closedBy: closure.closed_by,
      closedByName: profiles?.full_name || "Usuario desconocido",
      totalSalesCount: closure.total_sales_count || 0,
      totalSalesAmount: closure.total_sales_amount || 0,
      cashSales: closure.cash_sales || 0,
      cardSales: closure.card_sales || 0,
      transferSales: closure.transfer_sales || 0,
      otherSales: closure.other_sales || 0,
      cashCounted: closure.cash_counted,
      cashDifference: closure.cash_difference || 0,
    };

    if (dailyMap.has(dateKey)) {
      const daily = dailyMap.get(dateKey)!;
      daily.closures.push(cashClosure);
      daily.totalSales += cashClosure.totalSalesAmount;
      daily.totalDifferences += Math.abs(cashClosure.cashDifference);
    } else {
      dailyMap.set(dateKey, {
        date: new Date(dateKey),
        openings: [],
        closures: [cashClosure],
        totalSales: cashClosure.totalSalesAmount,
        totalDifferences: Math.abs(cashClosure.cashDifference),
        efficiency: 100,
      });
    }
  }

  // Calcular eficiencia para cada día
  for (const daily of dailyMap.values()) {
    if (daily.totalSales > 0) {
      daily.efficiency = 100 - (daily.totalDifferences / daily.totalSales) * 100;
      daily.efficiency = Math.max(0, Math.min(100, daily.efficiency));
    }
  }

  return Array.from(dailyMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

/**
 * Procesa el análisis por turno
 */
function processShiftAnalysis(closures: any[]): ShiftAnalysis[] {
  const shiftMap = new Map<string, ShiftAnalysis>();

  for (const closure of closures) {
    const shift = closure.shift || "Mañana";

    if (shiftMap.has(shift)) {
      const analysis = shiftMap.get(shift)!;
      analysis.totalClosures++;
      analysis.totalSales += closure.total_sales_amount || 0;
      analysis.totalDifferences += Math.abs(closure.cash_difference || 0);
    } else {
      shiftMap.set(shift, {
        shift,
        totalOpenings: 0, // Se calculará después
        totalClosures: 1,
        totalSales: closure.total_sales_amount || 0,
        averageSales: 0,
        totalDifferences: Math.abs(closure.cash_difference || 0),
        averageDifference: 0,
      });
    }
  }

  // Calcular promedios
  for (const analysis of shiftMap.values()) {
    if (analysis.totalClosures > 0) {
      analysis.averageSales = analysis.totalSales / analysis.totalClosures;
      analysis.averageDifference = analysis.totalDifferences / analysis.totalClosures;
    }
  }

  return Array.from(shiftMap.values()).sort((a, b) =>
    a.shift.localeCompare(b.shift)
  );
}

/**
 * Procesa el desglose por método de pago
 */
function processPaymentMethodBreakdown(closures: any[]): PaymentMethodBreakdown {
  const breakdown: PaymentMethodBreakdown = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
    total: 0,
  };

  for (const closure of closures) {
    breakdown.cash += closure.cash_sales || 0;
    breakdown.card += closure.card_sales || 0;
    breakdown.transfer += closure.transfer_sales || 0;
    breakdown.other += closure.other_sales || 0;
  }

  breakdown.total =
    breakdown.cash + breakdown.card + breakdown.transfer + breakdown.other;

  return breakdown;
}

/**
 * Procesa las tendencias de caja
 */
function processCashTrends(daily: DailyCashStatus[]): CashTrend[] {
  return daily.map((d) => ({
    date: d.date,
    sales: d.totalSales,
    differences: d.totalDifferences,
    efficiency: d.efficiency,
  }));
}

/**
 * Obtiene las tendencias de caja
 */
export async function getCashTrends(
  companyId: string,
  period: { startDate: Date; endDate: Date }
): Promise<CashTrend[]> {
  const report = await getAdvancedCashStatus(companyId, {
    startDate: period.startDate,
    endDate: period.endDate,
  });

  return report.trends;
}

/**
 * Obtiene el análisis por turno
 */
export async function getShiftAnalysis(
  companyId: string,
  period: { startDate: Date; endDate: Date }
): Promise<ShiftAnalysis[]> {
  const report = await getAdvancedCashStatus(companyId, {
    startDate: period.startDate,
    endDate: period.endDate,
  });

  return report.byShift;
}

/**
 * Compara dos períodos de caja
 */
export async function compareCashPeriods(
  companyId: string,
  period1: { startDate: Date; endDate: Date },
  period2: { startDate: Date; endDate: Date }
): Promise<CashPeriodComparison> {
  const [report1, report2] = await Promise.all([
    getAdvancedCashStatus(companyId, {
      startDate: period1.startDate,
      endDate: period1.endDate,
    }),
    getAdvancedCashStatus(companyId, {
      startDate: period2.startDate,
      endDate: period2.endDate,
    }),
  ]);

  // Calcular eficiencia promedio
  const avgEfficiency1 =
    report1.daily.length > 0
      ? report1.daily.reduce((sum, d) => sum + d.efficiency, 0) / report1.daily.length
      : 0;

  const avgEfficiency2 =
    report2.daily.length > 0
      ? report2.daily.reduce((sum, d) => sum + d.efficiency, 0) / report2.daily.length
      : 0;

  // Calcular cambios
  const salesChange = report2.summary.totalSales - report1.summary.totalSales;
  const differencesChange =
    report2.summary.totalDifferences - report1.summary.totalDifferences;
  const efficiencyChange = avgEfficiency2 - avgEfficiency1;

  const salesChangePercent =
    report1.summary.totalSales > 0
      ? (salesChange / report1.summary.totalSales) * 100
      : 0;

  const differencesChangePercent =
    report1.summary.totalDifferences > 0
      ? (differencesChange / report1.summary.totalDifferences) * 100
      : 0;

  return {
    period1: {
      startDate: period1.startDate,
      endDate: period1.endDate,
      totalSales: report1.summary.totalSales,
      totalDifferences: report1.summary.totalDifferences,
      averageEfficiency: avgEfficiency1,
    },
    period2: {
      startDate: period2.startDate,
      endDate: period2.endDate,
      totalSales: report2.summary.totalSales,
      totalDifferences: report2.summary.totalDifferences,
      averageEfficiency: avgEfficiency2,
    },
    changes: {
      salesChange,
      salesChangePercent,
      differencesChange,
      differencesChangePercent,
      efficiencyChange,
    },
  };
}

/**
 * Calcula la eficiencia de caja
 */
export async function calculateCashEfficiency(
  companyId: string,
  period: { startDate: Date; endDate: Date }
): Promise<number> {
  const report = await getAdvancedCashStatus(companyId, {
    startDate: period.startDate,
    endDate: period.endDate,
  });

  if (report.summary.totalSales === 0) {
    return 100;
  }

  const efficiency =
    100 - (report.summary.totalDifferences / report.summary.totalSales) * 100;
  return Math.max(0, Math.min(100, efficiency));
}

/**
 * Obtiene alertas de diferencias significativas
 */
export async function getCashDifferenceAlerts(
  companyId: string,
  threshold: number = 100
): Promise<CashClosure[]> {
  const supabase = await createClient();

  const { data: closures, error } = await supabase
    .from("cash_register_closures")
    .select(
      `
      id,
      closure_date,
      shift,
      closed_by,
      total_sales_count,
      total_sales_amount,
      cash_sales,
      card_sales,
      transfer_sales,
      other_sales,
      cash_counted,
      cash_difference,
      profiles!cash_register_closures_closed_by_fkey(full_name)
    `
    )
    .eq("company_id", companyId)
    .gte("closure_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("closure_date", { ascending: false });

  if (error) {
    console.error("Error fetching cash difference alerts:", error);
    throw new Error("Error al obtener alertas de diferencias");
  }

  // Filtrar cierres con diferencias significativas
  const alerts = (closures || [])
    .filter((c) => Math.abs(c.cash_difference || 0) >= threshold)
    .map((c) => {
      const profiles = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;

      return {
        id: c.id,
        closureDate: new Date(c.closure_date),
        shift: c.shift || "Mañana",
        closedBy: c.closed_by,
        closedByName: profiles?.full_name || "Usuario desconocido",
        totalSalesCount: c.total_sales_count || 0,
        totalSalesAmount: c.total_sales_amount || 0,
        cashSales: c.cash_sales || 0,
        cardSales: c.card_sales || 0,
        transferSales: c.transfer_sales || 0,
        otherSales: c.other_sales || 0,
        cashCounted: c.cash_counted,
        cashDifference: c.cash_difference || 0,
      };
    });

  return alerts;
}
