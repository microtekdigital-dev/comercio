"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  AccountsSettlementReport,
  AccountDetail,
  AccountMovement,
  AgingAnalysis,
  CashFlowProjection,
  AccountsReportFilters,
} from "@/lib/types/reports";

/**
 * Obtiene el reporte avanzado de liquidación de cuentas
 */
export async function getAdvancedAccountsSettlement(
  companyId: string,
  filters: AccountsReportFilters
): Promise<AccountsSettlementReport> {
  const [receivables, payables] = await Promise.all([
    getAccountsReceivable(companyId, filters),
    getAccountsPayable(companyId, filters),
  ]);

  // Calcular resumen
  const summary = {
    totalReceivable: receivables.reduce((sum, r) => sum + r.currentBalance, 0),
    totalPayable: payables.reduce((sum, p) => sum + p.currentBalance, 0),
    netBalance: 0,
    overdueReceivable: receivables.reduce((sum, r) => sum + r.overdueAmount, 0),
    overduePayable: payables.reduce((sum, p) => sum + p.overdueAmount, 0),
  };

  summary.netBalance = summary.totalReceivable - summary.totalPayable;

  // Calcular análisis de antigüedad
  const aging = calculateAgingAnalysis(receivables, payables);

  // Calcular proyecciones de flujo de caja
  const projections = await getCashFlowProjection(companyId, 30);

  return {
    period: {
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    summary,
    receivables,
    payables,
    aging,
    projections,
  };
}

/**
 * Obtiene cuentas por cobrar (clientes)
 */
async function getAccountsReceivable(
  companyId: string,
  filters: AccountsReportFilters
): Promise<AccountDetail[]> {
  const supabase = await createClient();

  if (filters.entityType === "supplier") {
    return [];
  }

  const startDateStr = filters.startDate.toISOString().split("T")[0];
  const endDateStr = filters.endDate.toISOString().split("T")[0];

  // Obtener ventas pendientes o parcialmente pagadas
  let salesQuery = supabase
    .from("sales")
    .select(
      `
      id,
      sale_number,
      sale_date,
      total,
      payment_status,
      customer_id,
      customers(name),
      customer_payments(amount, payment_date)
    `
    )
    .eq("company_id", companyId)
    .in("payment_status", ["pending", "partial"])
    .gte("sale_date", startDateStr)
    .lte("sale_date", endDateStr);

  const { data: sales, error: salesError } = await salesQuery;

  if (salesError) {
    console.error("Error fetching accounts receivable:", salesError);
    throw new Error("Error al obtener cuentas por cobrar");
  }

  // Agrupar por cliente
  const customerMap = new Map<string, AccountDetail>();

  for (const sale of sales || []) {
    const customerId = sale.customer_id || "general";
    const customers = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
    const customerName = customers?.name || "Cliente General";

    const payments = Array.isArray(sale.customer_payments)
      ? sale.customer_payments
      : [];
    const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = sale.total - paid;

    // Calcular días vencidos (asumiendo 30 días de crédito)
    const saleDate = new Date(sale.sale_date);
    const dueDate = new Date(saleDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const today = new Date();
    const daysOverdue = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const movement: AccountMovement = {
      id: sale.id,
      date: saleDate,
      type: "sale",
      description: `Venta #${sale.sale_number}`,
      debit: sale.total,
      credit: paid,
      balance: balance,
      reference: sale.sale_number.toString(),
    };

    if (customerMap.has(customerId)) {
      const existing = customerMap.get(customerId)!;
      existing.currentBalance += balance;
      existing.movements.push(movement);

      if (daysOverdue > 0) {
        existing.overdueAmount += balance;
      }
    } else {
      customerMap.set(customerId, {
        entityId: customerId,
        entityName: customerName,
        entityType: "customer",
        currentBalance: balance,
        overdueAmount: daysOverdue > 0 ? balance : 0,
        dueAmount: daysOverdue === 0 ? balance : 0,
        movements: [movement],
        paymentScore: 0, // Se calculará después
        averagePaymentDays: 0, // Se calculará después
      });
    }
  }

  // Calcular métricas de pago para cada cliente
  for (const account of customerMap.values()) {
    const paymentMetrics = await calculatePaymentScore(
      companyId,
      account.entityId,
      "customer"
    );
    account.paymentScore = paymentMetrics.score;
    account.averagePaymentDays = paymentMetrics.averageDays;
  }

  // Aplicar filtros adicionales
  let accounts = Array.from(customerMap.values());

  if (filters.status) {
    accounts = accounts.filter((a) => {
      if (filters.status === "current") return a.overdueAmount === 0;
      if (filters.status === "overdue") return a.overdueAmount > 0;
      if (filters.status === "due_soon") {
        // Vence en los próximos 7 días
        return a.dueAmount > 0 && a.overdueAmount === 0;
      }
      return true;
    });
  }

  if (filters.minAmount !== undefined) {
    accounts = accounts.filter((a) => a.currentBalance >= filters.minAmount!);
  }

  if (filters.maxAmount !== undefined) {
    accounts = accounts.filter((a) => a.currentBalance <= filters.maxAmount!);
  }

  return accounts.sort((a, b) => b.currentBalance - a.currentBalance);
}

/**
 * Obtiene cuentas por pagar (proveedores)
 */
async function getAccountsPayable(
  companyId: string,
  filters: AccountsReportFilters
): Promise<AccountDetail[]> {
  const supabase = await createClient();

  if (filters.entityType === "customer") {
    return [];
  }

  const startDateStr = filters.startDate.toISOString().split("T")[0];
  const endDateStr = filters.endDate.toISOString().split("T")[0];

  // Obtener órdenes de compra pendientes o parcialmente pagadas
  let poQuery = supabase
    .from("purchase_orders")
    .select(
      `
      id,
      order_number,
      order_date,
      total,
      payment_status,
      supplier_id,
      suppliers(name),
      supplier_payments(amount, payment_date)
    `
    )
    .eq("company_id", companyId)
    .in("payment_status", ["pending", "partial"])
    .gte("order_date", startDateStr)
    .lte("order_date", endDateStr);

  const { data: orders, error: ordersError } = await poQuery;

  if (ordersError) {
    console.error("Error fetching accounts payable:", ordersError);
    throw new Error("Error al obtener cuentas por pagar");
  }

  // Agrupar por proveedor
  const supplierMap = new Map<string, AccountDetail>();

  for (const order of orders || []) {
    const supplierId = order.supplier_id || "sin-proveedor";
    const suppliers = Array.isArray(order.suppliers)
      ? order.suppliers[0]
      : order.suppliers;
    const supplierName = suppliers?.name || "Sin proveedor";

    const payments = Array.isArray(order.supplier_payments)
      ? order.supplier_payments
      : [];
    const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = order.total - paid;

    // Calcular días vencidos (asumiendo 30 días de crédito)
    const orderDate = new Date(order.order_date);
    const dueDate = new Date(orderDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const today = new Date();
    const daysOverdue = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const movement: AccountMovement = {
      id: order.id,
      date: orderDate,
      type: "purchase",
      description: `Orden de Compra #${order.order_number}`,
      debit: 0,
      credit: order.total,
      balance: balance,
      reference: order.order_number.toString(),
    };

    if (supplierMap.has(supplierId)) {
      const existing = supplierMap.get(supplierId)!;
      existing.currentBalance += balance;
      existing.movements.push(movement);

      if (daysOverdue > 0) {
        existing.overdueAmount += balance;
      }
    } else {
      supplierMap.set(supplierId, {
        entityId: supplierId,
        entityName: supplierName,
        entityType: "supplier",
        currentBalance: balance,
        overdueAmount: daysOverdue > 0 ? balance : 0,
        dueAmount: daysOverdue === 0 ? balance : 0,
        movements: [movement],
        paymentScore: 0,
        averagePaymentDays: 0,
      });
    }
  }

  // Calcular métricas de pago para cada proveedor
  for (const account of supplierMap.values()) {
    const paymentMetrics = await calculatePaymentScore(
      companyId,
      account.entityId,
      "supplier"
    );
    account.paymentScore = paymentMetrics.score;
    account.averagePaymentDays = paymentMetrics.averageDays;
  }

  // Aplicar filtros adicionales
  let accounts = Array.from(supplierMap.values());

  if (filters.status) {
    accounts = accounts.filter((a) => {
      if (filters.status === "current") return a.overdueAmount === 0;
      if (filters.status === "overdue") return a.overdueAmount > 0;
      if (filters.status === "due_soon") {
        return a.dueAmount > 0 && a.overdueAmount === 0;
      }
      return true;
    });
  }

  if (filters.minAmount !== undefined) {
    accounts = accounts.filter((a) => a.currentBalance >= filters.minAmount!);
  }

  if (filters.maxAmount !== undefined) {
    accounts = accounts.filter((a) => a.currentBalance <= filters.maxAmount!);
  }

  return accounts.sort((a, b) => b.currentBalance - a.currentBalance);
}

/**
 * Calcula el análisis de antigüedad de saldos
 */
function calculateAgingAnalysis(
  receivables: AccountDetail[],
  payables: AccountDetail[]
): AgingAnalysis {
  const aging: AgingAnalysis = {
    current: 0,
    days30to60: 0,
    days61to90: 0,
    over90: 0,
  };

  const allAccounts = [...receivables, ...payables];

  for (const account of allAccounts) {
    for (const movement of account.movements) {
      const today = new Date();
      const movementDate = new Date(movement.date);
      const daysOld = Math.floor(
        (today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOld <= 30) {
        aging.current += movement.balance;
      } else if (daysOld <= 60) {
        aging.days30to60 += movement.balance;
      } else if (daysOld <= 90) {
        aging.days61to90 += movement.balance;
      } else {
        aging.over90 += movement.balance;
      }
    }
  }

  return aging;
}

/**
 * Obtiene análisis de antigüedad de saldos
 */
export async function getAgingAnalysis(
  companyId: string,
  entityType: "customer" | "supplier"
): Promise<AgingAnalysis> {
  const filters: AccountsReportFilters = {
    startDate: new Date(0), // Desde el inicio
    endDate: new Date(), // Hasta hoy
    entityType,
  };

  const report = await getAdvancedAccountsSettlement(companyId, filters);
  return report.aging;
}

/**
 * Calcula la proyección de flujo de caja
 */
export async function getCashFlowProjection(
  companyId: string,
  days: number
): Promise<CashFlowProjection[]> {
  const supabase = await createClient();

  const today = new Date();
  const projections: CashFlowProjection[] = [];

  // Obtener ventas pendientes con fechas de vencimiento
  const { data: sales } = await supabase
    .from("sales")
    .select(
      `
      id,
      sale_date,
      total,
      payment_status,
      customer_payments(amount)
    `
    )
    .eq("company_id", companyId)
    .in("payment_status", ["pending", "partial"]);

  // Obtener órdenes de compra pendientes
  const { data: orders } = await supabase
    .from("purchase_orders")
    .select(
      `
      id,
      order_date,
      total,
      payment_status,
      supplier_payments(amount)
    `
    )
    .eq("company_id", companyId)
    .in("payment_status", ["pending", "partial"]);

  // Generar proyecciones para cada día
  for (let i = 0; i < days; i++) {
    const projectionDate = new Date(today);
    projectionDate.setDate(projectionDate.getDate() + i);

    let expectedIncome = 0;
    let expectedExpenses = 0;

    // Calcular ingresos esperados (ventas que vencen ese día)
    for (const sale of sales || []) {
      const saleDate = new Date(sale.sale_date);
      const dueDate = new Date(saleDate);
      dueDate.setDate(dueDate.getDate() + 30); // Asumiendo 30 días de crédito

      if (
        dueDate.toISOString().split("T")[0] ===
        projectionDate.toISOString().split("T")[0]
      ) {
        const payments = Array.isArray(sale.customer_payments)
          ? sale.customer_payments
          : [];
        const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        expectedIncome += sale.total - paid;
      }
    }

    // Calcular gastos esperados (compras que vencen ese día)
    for (const order of orders || []) {
      const orderDate = new Date(order.order_date);
      const dueDate = new Date(orderDate);
      dueDate.setDate(dueDate.getDate() + 30);

      if (
        dueDate.toISOString().split("T")[0] ===
        projectionDate.toISOString().split("T")[0]
      ) {
        const payments = Array.isArray(order.supplier_payments)
          ? order.supplier_payments
          : [];
        const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        expectedExpenses += order.total - paid;
      }
    }

    projections.push({
      date: projectionDate,
      expectedIncome,
      expectedExpenses,
      projectedBalance: expectedIncome - expectedExpenses,
    });
  }

  return projections;
}

/**
 * Calcula el score de pago de un cliente o proveedor
 */
export async function calculatePaymentScore(
  companyId: string,
  entityId: string,
  entityType: "customer" | "supplier"
): Promise<{ score: number; averageDays: number }> {
  const supabase = await createClient();

  if (entityType === "customer") {
    // Obtener ventas pagadas del cliente
    const { data: sales } = await supabase
      .from("sales")
      .select(
        `
        id,
        sale_date,
        payment_status,
        customer_payments(payment_date)
      `
      )
      .eq("company_id", companyId)
      .eq("customer_id", entityId)
      .eq("payment_status", "paid");

    if (!sales || sales.length === 0) {
      return { score: 50, averageDays: 0 }; // Score neutral si no hay historial
    }

    let totalDays = 0;
    let count = 0;

    for (const sale of sales) {
      const saleDate = new Date(sale.sale_date);
      const payments = Array.isArray(sale.customer_payments)
        ? sale.customer_payments
        : [];

      if (payments.length > 0) {
        // Usar la última fecha de pago
        const lastPayment = payments.sort(
          (a, b) =>
            new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        )[0];
        const paymentDate = new Date(lastPayment.payment_date);
        const daysToPay = Math.floor(
          (paymentDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        totalDays += daysToPay;
        count++;
      }
    }

    const averageDays = count > 0 ? totalDays / count : 0;

    // Calcular score (100 = paga en 0-15 días, 0 = paga en más de 60 días)
    let score = 100;
    if (averageDays > 15) score = 80;
    if (averageDays > 30) score = 60;
    if (averageDays > 45) score = 40;
    if (averageDays > 60) score = 20;

    return { score, averageDays };
  } else {
    // Similar para proveedores
    const { data: orders } = await supabase
      .from("purchase_orders")
      .select(
        `
        id,
        order_date,
        payment_status,
        supplier_payments(payment_date)
      `
      )
      .eq("company_id", companyId)
      .eq("supplier_id", entityId)
      .eq("payment_status", "paid");

    if (!orders || orders.length === 0) {
      return { score: 50, averageDays: 0 };
    }

    let totalDays = 0;
    let count = 0;

    for (const order of orders) {
      const orderDate = new Date(order.order_date);
      const payments = Array.isArray(order.supplier_payments)
        ? order.supplier_payments
        : [];

      if (payments.length > 0) {
        const lastPayment = payments.sort(
          (a, b) =>
            new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        )[0];
        const paymentDate = new Date(lastPayment.payment_date);
        const daysToPay = Math.floor(
          (paymentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        totalDays += daysToPay;
        count++;
      }
    }

    const averageDays = count > 0 ? totalDays / count : 0;

    let score = 100;
    if (averageDays > 15) score = 80;
    if (averageDays > 30) score = 60;
    if (averageDays > 45) score = 40;
    if (averageDays > 60) score = 20;

    return { score, averageDays };
  }
}

/**
 * Obtiene alertas de cuentas vencidas
 */
export async function getOverdueAlerts(
  companyId: string
): Promise<AccountDetail[]> {
  const filters: AccountsReportFilters = {
    startDate: new Date(0),
    endDate: new Date(),
    status: "overdue",
  };

  const report = await getAdvancedAccountsSettlement(companyId, filters);
  return [...report.receivables, ...report.payables].filter(
    (a) => a.overdueAmount > 0
  );
}
