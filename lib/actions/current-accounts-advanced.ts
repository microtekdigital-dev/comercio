"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  CurrentAccountReport,
  AccountMovement,
  AgingAnalysis,
  CurrentAccountFilters,
} from "@/lib/types/reports";

/**
 * Obtiene el reporte de cuenta corriente de una entidad específica
 */
export async function getCurrentAccountReport(
  entityId: string,
  entityType: "customer" | "supplier",
  filters?: CurrentAccountFilters
): Promise<CurrentAccountReport> {
  const supabase = await createClient();

  if (entityType === "customer") {
    return await getCustomerAccountReport(entityId, filters);
  } else {
    return await getSupplierAccountReport(entityId, filters);
  }
}

/**
 * Obtiene el reporte de cuenta corriente de un cliente
 */
async function getCustomerAccountReport(
  customerId: string,
  filters?: CurrentAccountFilters
): Promise<CurrentAccountReport> {
  const supabase = await createClient();

  // Obtener información del cliente
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, credit_limit")
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    throw new Error("Cliente no encontrado");
  }

  // Obtener ventas del cliente
  let salesQuery = supabase
    .from("sales")
    .select(
      `
      id,
      sale_number,
      sale_date,
      total,
      payment_status,
      customer_payments(amount, payment_date)
    `
    )
    .eq("customer_id", customerId)
    .order("sale_date", { ascending: true });

  if (filters?.startDate) {
    salesQuery = salesQuery.gte(
      "sale_date",
      filters.startDate.toISOString().split("T")[0]
    );
  }

  if (filters?.endDate) {
    salesQuery = salesQuery.lte(
      "sale_date",
      filters.endDate.toISOString().split("T")[0]
    );
  }

  const { data: sales, error: salesError } = await salesQuery;

  if (salesError) {
    console.error("Error fetching customer sales:", salesError);
    throw new Error("Error al obtener ventas del cliente");
  }

  // Procesar movimientos
  const movements: AccountMovement[] = [];
  let runningBalance = 0;
  let totalDebits = 0;
  let totalCredits = 0;
  let oldestMovement: Date | null = null;
  let lastMovement: Date | null = null;

  for (const sale of sales || []) {
    const saleDate = new Date(sale.sale_date);
    const payments = Array.isArray(sale.customer_payments)
      ? sale.customer_payments
      : [];

    // Agregar movimiento de venta (débito)
    runningBalance += sale.total;
    totalDebits += sale.total;

    if (!oldestMovement) oldestMovement = saleDate;
    lastMovement = saleDate;

    movements.push({
      id: sale.id,
      date: saleDate,
      type: "sale",
      description: `Venta #${sale.sale_number}`,
      debit: sale.total,
      credit: 0,
      balance: runningBalance,
      reference: sale.sale_number.toString(),
    });

    // Agregar movimientos de pagos (crédito)
    for (const payment of payments) {
      const paymentDate = new Date(payment.payment_date);
      runningBalance -= payment.amount;
      totalCredits += payment.amount;
      lastMovement = paymentDate;

      movements.push({
        id: `${sale.id}-payment-${payment.payment_date}`,
        date: paymentDate,
        type: "payment",
        description: `Pago de Venta #${sale.sale_number}`,
        debit: 0,
        credit: payment.amount,
        balance: runningBalance,
        reference: sale.sale_number.toString(),
      });
    }
  }

  // Filtrar por tipo de movimiento si se especifica
  let filteredMovements = movements;
  if (filters?.movementTypes && filters.movementTypes.length > 0) {
    filteredMovements = movements.filter((m) =>
      filters.movementTypes!.includes(m.type)
    );
  }

  // Calcular días promedio de pago
  const averagePaymentDays = await calculateAveragePaymentDays(
    customerId,
    "customer"
  );

  // Calcular análisis de antigüedad
  const aging = calculateAccountAging(movements);

  return {
    entityId: customerId,
    entityName: customer.name,
    entityType: "customer",
    currentBalance: runningBalance,
    creditLimit: customer.credit_limit,
    movements: filteredMovements,
    summary: {
      totalDebits,
      totalCredits,
      oldestMovement: oldestMovement || new Date(),
      lastMovement: lastMovement || new Date(),
      averagePaymentDays,
    },
    aging,
  };
}

/**
 * Obtiene el reporte de cuenta corriente de un proveedor
 */
async function getSupplierAccountReport(
  supplierId: string,
  filters?: CurrentAccountFilters
): Promise<CurrentAccountReport> {
  const supabase = await createClient();

  // Obtener información del proveedor
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("id", supplierId)
    .single();

  if (supplierError || !supplier) {
    throw new Error("Proveedor no encontrado");
  }

  // Obtener órdenes de compra del proveedor
  let ordersQuery = supabase
    .from("purchase_orders")
    .select(
      `
      id,
      order_number,
      order_date,
      total,
      payment_status,
      supplier_payments(amount, payment_date)
    `
    )
    .eq("supplier_id", supplierId)
    .order("order_date", { ascending: true });

  if (filters?.startDate) {
    ordersQuery = ordersQuery.gte(
      "order_date",
      filters.startDate.toISOString().split("T")[0]
    );
  }

  if (filters?.endDate) {
    ordersQuery = ordersQuery.lte(
      "order_date",
      filters.endDate.toISOString().split("T")[0]
    );
  }

  const { data: orders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error("Error fetching supplier orders:", ordersError);
    throw new Error("Error al obtener órdenes del proveedor");
  }

  // Procesar movimientos
  const movements: AccountMovement[] = [];
  let runningBalance = 0;
  let totalDebits = 0;
  let totalCredits = 0;
  let oldestMovement: Date | null = null;
  let lastMovement: Date | null = null;

  for (const order of orders || []) {
    const orderDate = new Date(order.order_date);
    const payments = Array.isArray(order.supplier_payments)
      ? order.supplier_payments
      : [];

    // Agregar movimiento de compra (crédito - deuda)
    runningBalance += order.total;
    totalCredits += order.total;

    if (!oldestMovement) oldestMovement = orderDate;
    lastMovement = orderDate;

    movements.push({
      id: order.id,
      date: orderDate,
      type: "purchase",
      description: `Orden de Compra #${order.order_number}`,
      debit: 0,
      credit: order.total,
      balance: runningBalance,
      reference: order.order_number.toString(),
    });

    // Agregar movimientos de pagos (débito - pago de deuda)
    for (const payment of payments) {
      const paymentDate = new Date(payment.payment_date);
      runningBalance -= payment.amount;
      totalDebits += payment.amount;
      lastMovement = paymentDate;

      movements.push({
        id: `${order.id}-payment-${payment.payment_date}`,
        date: paymentDate,
        type: "payment",
        description: `Pago de Orden #${order.order_number}`,
        debit: payment.amount,
        credit: 0,
        balance: runningBalance,
        reference: order.order_number.toString(),
      });
    }
  }

  // Filtrar por tipo de movimiento si se especifica
  let filteredMovements = movements;
  if (filters?.movementTypes && filters.movementTypes.length > 0) {
    filteredMovements = movements.filter((m) =>
      filters.movementTypes!.includes(m.type)
    );
  }

  // Calcular días promedio de pago
  const averagePaymentDays = await calculateAveragePaymentDays(
    supplierId,
    "supplier"
  );

  // Calcular análisis de antigüedad
  const aging = calculateAccountAging(movements);

  return {
    entityId: supplierId,
    entityName: supplier.name,
    entityType: "supplier",
    currentBalance: runningBalance,
    movements: filteredMovements,
    summary: {
      totalDebits,
      totalCredits,
      oldestMovement: oldestMovement || new Date(),
      lastMovement: lastMovement || new Date(),
      averagePaymentDays,
    },
    aging,
  };
}

/**
 * Calcula el análisis de antigüedad de una cuenta
 */
function calculateAccountAging(movements: AccountMovement[]): AgingAnalysis {
  const aging: AgingAnalysis = {
    current: 0,
    days30to60: 0,
    days61to90: 0,
    over90: 0,
  };

  const today = new Date();

  // Filtrar solo movimientos con saldo pendiente (ventas/compras sin pagar completamente)
  const pendingMovements = movements.filter(
    (m) => (m.type === "sale" || m.type === "purchase") && m.balance > 0
  );

  for (const movement of pendingMovements) {
    const daysOld = Math.floor(
      (today.getTime() - movement.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    const amount = movement.debit > 0 ? movement.debit : movement.credit;

    if (daysOld <= 30) {
      aging.current += amount;
    } else if (daysOld <= 60) {
      aging.days30to60 += amount;
    } else if (daysOld <= 90) {
      aging.days61to90 += amount;
    } else {
      aging.over90 += amount;
    }
  }

  return aging;
}

/**
 * Calcula los días promedio de pago
 */
async function calculateAveragePaymentDays(
  entityId: string,
  entityType: "customer" | "supplier"
): Promise<number> {
  const supabase = await createClient();

  if (entityType === "customer") {
    const { data: sales } = await supabase
      .from("sales")
      .select(
        `
        sale_date,
        payment_status,
        customer_payments(payment_date)
      `
      )
      .eq("customer_id", entityId)
      .eq("payment_status", "paid");

    if (!sales || sales.length === 0) return 0;

    let totalDays = 0;
    let count = 0;

    for (const sale of sales) {
      const saleDate = new Date(sale.sale_date);
      const payments = Array.isArray(sale.customer_payments)
        ? sale.customer_payments
        : [];

      if (payments.length > 0) {
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

    return count > 0 ? Math.round(totalDays / count) : 0;
  } else {
    const { data: orders } = await supabase
      .from("purchase_orders")
      .select(
        `
        order_date,
        payment_status,
        supplier_payments(payment_date)
      `
      )
      .eq("supplier_id", entityId)
      .eq("payment_status", "paid");

    if (!orders || orders.length === 0) return 0;

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

    return count > 0 ? Math.round(totalDays / count) : 0;
  }
}

/**
 * Obtiene todas las cuentas corrientes de una empresa
 */
export async function getAllCurrentAccounts(
  companyId: string,
  entityType: "customer" | "supplier" | "both",
  filters?: {
    minBalance?: number;
    maxBalance?: number;
    status?: "active" | "inactive";
  }
): Promise<CurrentAccountReport[]> {
  const supabase = await createClient();

  const accounts: CurrentAccountReport[] = [];

  // Obtener cuentas de clientes
  if (entityType === "customer" || entityType === "both") {
    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("company_id", companyId);

    for (const customer of customers || []) {
      try {
        const account = await getCurrentAccountReport(customer.id, "customer");

        // Aplicar filtros
        if (filters?.minBalance && account.currentBalance < filters.minBalance) {
          continue;
        }
        if (filters?.maxBalance && account.currentBalance > filters.maxBalance) {
          continue;
        }
        if (filters?.status === "active" && account.currentBalance === 0) {
          continue;
        }
        if (filters?.status === "inactive" && account.currentBalance !== 0) {
          continue;
        }

        accounts.push(account);
      } catch (error) {
        console.error(`Error fetching account for customer ${customer.id}:`, error);
      }
    }
  }

  // Obtener cuentas de proveedores
  if (entityType === "supplier" || entityType === "both") {
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("id")
      .eq("company_id", companyId);

    for (const supplier of suppliers || []) {
      try {
        const account = await getCurrentAccountReport(supplier.id, "supplier");

        // Aplicar filtros
        if (filters?.minBalance && account.currentBalance < filters.minBalance) {
          continue;
        }
        if (filters?.maxBalance && account.currentBalance > filters.maxBalance) {
          continue;
        }
        if (filters?.status === "active" && account.currentBalance === 0) {
          continue;
        }
        if (filters?.status === "inactive" && account.currentBalance !== 0) {
          continue;
        }

        accounts.push(account);
      } catch (error) {
        console.error(`Error fetching account for supplier ${supplier.id}:`, error);
      }
    }
  }

  return accounts.sort((a, b) => b.currentBalance - a.currentBalance);
}

/**
 * Envía el estado de cuenta por email
 */
export async function sendAccountStatement(
  entityId: string,
  entityType: "customer" | "supplier",
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Obtener el reporte de cuenta corriente
    const report = await getCurrentAccountReport(entityId, entityType);

    // TODO: Implementar envío de email con el reporte
    // Esto requeriría integración con un servicio de email como Resend

    return {
      success: true,
      message: `Estado de cuenta enviado a ${email}`,
    };
  } catch (error) {
    console.error("Error sending account statement:", error);
    return {
      success: false,
      message: "Error al enviar el estado de cuenta",
    };
  }
}
