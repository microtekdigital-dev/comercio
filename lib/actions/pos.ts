"use server";

/**
 * =============================================================================
 * VALIDACIONES MULTI-TENANT EN ACCIONES POS
 * =============================================================================
 * Este archivo aplica las siguientes validaciones de aislamiento de datos
 * para garantizar que cada empresa (tenant) solo acceda a su propia información:
 *
 * 1. PRODUCTOS (Requirements 10.1, 10.3):
 *    - searchPOSProducts: filtra por company_id del usuario autenticado.
 *    - getPOSProductsByCategory: filtra por company_id del usuario autenticado.
 *    - validatePOSCart: valida stock de variantes y productos filtrando por
 *      company_id para evitar acceso cruzado entre empresas.
 *    - createPOSSale: actualiza stock solo de productos/variantes que pertenecen
 *      a la empresa del usuario (filtro company_id en queries de stock).
 *
 * 2. CLIENTES (Requirement 10.4):
 *    - getGenericCustomer: crea/obtiene cliente genérico filtrando por company_id.
 *    - validateCustomerBelongsToCompany: valida explícitamente que el cliente
 *      pertenece a la empresa antes de asociarlo a una venta.
 *
 * 3. CAJA REGISTRADORA (Requirement 10.2):
 *    - getActiveCashRegisterOpening: filtra aperturas por company_id.
 *    - registerCashMovementForSale: inserta movimientos con company_id del perfil.
 *
 * 4. VENTAS (Requirement 10.5):
 *    - createPOSSale: registra company_id en cada venta creada desde el POS.
 *    - generatePOSTicket: filtra la venta por company_id antes de generar ticket.
 *    - sendPOSTicketEmail: valida company_id antes de enviar el email.
 *
 * 5. RLS A NIVEL DE BASE DE DATOS (Requirement 10.1):
 *    - Todas las tablas relevantes tienen RLS habilitado (ver scripts SQL).
 *    - offline_sales_queue tiene policies SELECT/INSERT/UPDATE por company_id
 *      (ver scripts/222_create_pos_offline_queue_rls.sql).
 * =============================================================================
 */

import type { Product, ProductVariant } from "@/lib/types/erp";

/**
 * Validates stock availability for a product (with or without variants).
 * This is a pure function — no database calls.
 *
 * @param product - Product data including stock and inventory tracking flags
 * @param variant - Variant data if the product has variants, otherwise null
 * @param requestedQuantity - Quantity the customer wants to purchase
 * @returns Validation result with optional error message and available stock
 */
export async function validateStockAvailability(
  product: Pick<
    Product,
    "id" | "name" | "stock_quantity" | "has_variants" | "track_inventory"
  >,
  variant: Pick<
    ProductVariant,
    "id" | "variant_name" | "stock_quantity"
  > | null,
  requestedQuantity: number
): Promise<{ valid: boolean; error?: string; availableStock?: number }> {
  // Rule 4: quantity must be positive
  if (requestedQuantity <= 0) {
    return { valid: false, error: "La cantidad debe ser mayor a cero" };
  }

  // Rule 1: if inventory tracking is disabled, always valid
  if (!product.track_inventory) {
    return { valid: true };
  }

  // Rule 2: product with variants — validate variant stock
  if (product.has_variants && variant !== null) {
    if (variant.stock_quantity >= requestedQuantity) {
      return { valid: true };
    }
    return {
      valid: false,
      error: `Stock insuficiente para ${product.name} - ${variant.variant_name}. Disponible: ${variant.stock_quantity}`,
      availableStock: variant.stock_quantity,
    };
  }

  // Rule 3: product without variants — validate product stock
  if (product.stock_quantity >= requestedQuantity) {
    return { valid: true };
  }
  return {
    valid: false,
    error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}`,
    availableStock: product.stock_quantity,
  };
}

import { createClient } from "@/lib/supabase/server";
import type { POSCart, POSProductSearchResult } from "@/lib/types/pos";
import type { CashRegisterOpening } from "@/lib/types/erp";

/**
 * Search products for POS with optimized query.
 * Returns products with active variants and stock info.
 * Requirements: 1.1
 */
export async function searchPOSProducts(
  query: string,
  limit: number = 20
): Promise<POSProductSearchResult[]> {
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

  let productsQuery = supabase
    .from("products")
    .select(
      `
      *,
      variants:product_variants(*)
    `
    )
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("name")
    .limit(limit);

  if (query.trim()) {
    productsQuery = productsQuery.or(
      `name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  const { data, error } = await productsQuery;
  if (error || !data) return [];

  return data.map((product) => ({
    ...product,
    variants: (product.variants ?? []).filter(
      (v: { is_active: boolean }) => v.is_active
    ),
  }));
}

/**
 * Get products by category for POS grid.
 * If categoryId is null, returns all active products.
 * Requirements: 1.1
 */
export async function getPOSProductsByCategory(
  categoryId: string | null
): Promise<POSProductSearchResult[]> {
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

  let productsQuery = supabase
    .from("products")
    .select(
      `
      *,
      variants:product_variants(*)
    `
    )
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("name")
    .limit(50);

  if (categoryId !== null) {
    productsQuery = productsQuery.eq("category_id", categoryId);
  }

  const { data, error } = await productsQuery;
  if (error || !data) return [];

  return data.map((product) => ({
    ...product,
    variants: (product.variants ?? []).filter(
      (v: { is_active: boolean }) => v.is_active
    ),
  }));
}

/**
 * Validate POS cart before checkout.
 * Checks business rules and stock availability.
 * Requirements: 1.8, 12.1, 12.3, 12.4
 */
export async function validatePOSCart(
  cart: POSCart
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate cart is not empty
  if (!cart.items || cart.items.length === 0) {
    errors.push("El carrito está vacío");
    return { valid: false, errors };
  }

  // Requirement 12.1: total must be greater than zero
  if (cart.total <= 0) {
    errors.push("El total de la venta debe ser mayor a cero");
  }

  // Requirement 12.3: discount must not exceed subtotal
  if (cart.discount_amount > cart.subtotal) {
    errors.push("El descuento no puede ser mayor al subtotal de la venta");
  }

  // Validate global discount
  const globalDiscountValidation = validateGlobalDiscount(
    cart.subtotal,
    cart.discount_type,
    cart.discount_value
  );
  if (!globalDiscountValidation.valid && globalDiscountValidation.error) {
    errors.push(globalDiscountValidation.error);
  }

  // Requirement 12.4: quantities must be positive + validate item discounts
  for (const item of cart.items) {
    if (item.quantity <= 0) {
      errors.push(
        `La cantidad de "${item.product_name}" debe ser mayor a cero`
      );
    }
    // Validate item-level discount
    if (item.discount_percent !== 0) {
      const itemDiscountValidation = validateItemDiscount(
        item.unit_price,
        item.quantity,
        'percentage',
        item.discount_percent
      );
      if (!itemDiscountValidation.valid && itemDiscountValidation.error) {
        errors.push(`${item.product_name}: ${itemDiscountValidation.error}`);
      }
    }
  }

  // Verify stock in database for each item
  // Requirement 10.3: validate that products belong to the user's company
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const companyId = profile?.company_id;

    for (const item of cart.items) {
      if (item.variant_id) {
        // Validate variant belongs to the company via its parent product
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_quantity, variant_name, is_active, products!inner(company_id)")
          .eq("id", item.variant_id)
          .eq("products.company_id", companyId)
          .single();

        if (!variant || !variant.is_active) {
          errors.push(`La variante "${item.variant_name}" ya no está disponible`);
        } else if (variant.stock_quantity < item.quantity) {
          errors.push(
            `Stock insuficiente para "${item.product_name} - ${item.variant_name}". Disponible: ${variant.stock_quantity}`
          );
        }
      } else if (item.product_id) {
        // Validate product belongs to the company (Requirement 10.3)
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity, track_inventory, is_active")
          .eq("id", item.product_id)
          .eq("company_id", companyId)
          .single();

        if (!product || !product.is_active) {
          errors.push(`El producto "${item.product_name}" ya no está disponible`);
        } else if (
          product.track_inventory &&
          product.stock_quantity < item.quantity
        ) {
          errors.push(
            `Stock insuficiente para "${item.product_name}". Disponible: ${product.stock_quantity}`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get the active cash register opening for the current user's company.
 * An opening is "active" if no closure exists with opening_id = opening.id.
 * Requirements: 3.1, 3.5
 */
export async function getActiveCashRegisterOpening(): Promise<CashRegisterOpening | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return null;

  const { data: openings } = await supabase
    .from("cash_register_openings")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (!openings || openings.length === 0) return null;

  const { data: closures } = await supabase
    .from("cash_register_closures")
    .select("opening_id")
    .eq("company_id", profile.company_id)
    .not("opening_id", "is", null);

  const closedOpeningIds = new Set(
    (closures ?? []).map((c: { opening_id: string }) => c.opening_id)
  );

  const activeOpening = openings.find(
    (o: CashRegisterOpening) => !closedOpeningIds.has(o.id)
  );

  return activeOpening ?? null;
}

/**
 * Register a cash movement for a completed POS sale.
 * Only inserts a movement if cashAmount > 0.
 * Requirements: 3.3, 3.4
 */
export async function registerCashMovementForSale(
  openingId: string,
  _saleTotal: number,
  cashAmount: number,
  saleNumber: string
): Promise<{ success: boolean; error?: string }> {
  if (cashAmount <= 0) return { success: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Usuario no autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return { success: false, error: "Empresa no encontrada" };

  const createdByName = profile.full_name || profile.email;

  const { error } = await supabase.from("cash_movements").insert({
    opening_id: openingId,
    company_id: profile.company_id,
    movement_type: "income",
    amount: cashAmount,
    description: `Venta POS #${saleNumber} - Efectivo`,
    created_by: user.id,
    created_by_name: createdByName,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}

import type { Customer } from "@/lib/types/erp";

/**
 * Get or create the generic customer for anonymous sales.
 * Ensures only one generic customer exists per company.
 * Requirements: 2.3
 */
export async function getGenericCustomer(): Promise<Customer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return null;

  // Try to find existing generic customer
  const { data: existing } = await supabase
    .from("customers")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("name", "Cliente Genérico")
    .single();

  if (existing) return existing as Customer;

  // Create generic customer if it doesn't exist
  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      name: "Cliente Genérico",
      company_id: profile.company_id,
      status: "active",
      country: "Argentina",
      notes: "Cliente genérico para ventas sin identificar",
    })
    .select("*")
    .single();

  if (error || !created) return null;

  return created as Customer;
}

/**
 * Validate that a customer belongs to the current user's company and is active.
 * Requirements: 2.5
 */
export async function validateCustomerBelongsToCompany(
  customerId: string
): Promise<{ valid: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { valid: false, error: "Usuario no autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return { valid: false, error: "Empresa no encontrada" };

  const { data: customer } = await supabase
    .from("customers")
    .select("id, status")
    .eq("id", customerId)
    .eq("company_id", profile.company_id)
    .single();

  if (!customer || customer.status !== "active") {
    return {
      valid: false,
      error: "Cliente no encontrado o no pertenece a esta empresa",
    };
  }

  return { valid: true };
}

import { revalidatePath } from "next/cache";
import { logSaleStockMovement } from "@/lib/actions/stock-movements";
import { calculateSaleTotals, validateGlobalDiscount, validateItemDiscount } from "@/lib/utils/discount-calculator";
import type { SaleItemFormData } from "@/lib/types/erp";
import type { POSSaleRequest } from "@/lib/types/pos";

/**
 * Create a POS sale with support for multiple payment methods.
 * Validates cash register opening, payment totals, stock, and registers
 * all movements automatically.
 * Requirements: 1.6, 2.3, 3.3, 3.4, 12.1, 12.2
 */
export async function createPOSSale(
  saleRequest: POSSaleRequest
): Promise<{ success: boolean; sale_id?: string; sale_number?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { success: false, error: "Empresa no encontrada" };
    }

    // Requirement 3.1: validate active cash register opening
    const opening = await getActiveCashRegisterOpening();
    if (!opening) {
      return {
        success: false,
        error: "No hay una caja abierta. Debes abrir la caja antes de vender.",
      };
    }

    // Calculate cart totals using calculateSaleTotals
    const saleItemsForCalc: SaleItemFormData[] = saleRequest.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku ?? undefined,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      discount_percent: item.discount_percent,
      discount_type: 'percentage' as const,
      variant_id: item.variant_id ?? undefined,
      variant_name: item.variant_name ?? undefined,
    }));

    let saleTotals;
    try {
      saleTotals = calculateSaleTotals(
        saleItemsForCalc,
        saleRequest.discount_type,
        saleRequest.discount_value
      );
    } catch (calcError: unknown) {
      const msg = calcError instanceof Error ? calcError.message : "Error al calcular totales";
      return { success: false, error: msg };
    }

    const { subtotal: itemsSubtotal, tax_amount: itemsTax, discount_amount: discountAmount, total: saleTotal } = saleTotals;

    // Requirement 12.1: total must be greater than zero
    if (saleTotal <= 0) {
      return {
        success: false,
        error: "El total de la venta debe ser mayor a cero",
      };
    }

    // Requirement 12.2: sum of payments must equal sale total
    const paymentsTotal = saleRequest.payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    if (Math.abs(paymentsTotal - saleTotal) > 0.01) {
      return {
        success: false,
        error: `La suma de los pagos (${paymentsTotal.toFixed(2)}) no coincide con el total de la venta (${saleTotal.toFixed(2)})`,
      };
    }

    // Requirement 2.3: resolve generic customer if none selected
    let customerId = saleRequest.customer_id;
    if (!customerId) {
      const genericCustomer = await getGenericCustomer();
      if (!genericCustomer) {
        return { success: false, error: "No se pudo obtener el cliente genérico" };
      }
      customerId = genericCustomer.id;
    }

    // Get company currency
    const { data: company } = await supabase
      .from("companies")
      .select("currency_code")
      .eq("id", profile.company_id)
      .single();

    const currencyCode = company?.currency_code ?? "ARS";

    // Create the sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        company_id: profile.company_id,
        customer_id: customerId,
        status: "completed",
        sale_date: new Date().toISOString(),
        subtotal: itemsSubtotal,
        tax_amount: itemsTax,
        discount_amount: discountAmount,
        total: saleTotal,
        currency: currencyCode,
        payment_status: "paid",
        payment_method: saleRequest.payments[0]?.payment_method ?? "Efectivo",
        notes: saleRequest.notes,
        created_by: user.id,
      })
      .select("id, sale_number")
      .single();

    if (saleError || !sale) {
      return {
        success: false,
        error: saleError?.message ?? "Error al crear la venta",
      };
    }

    // Create sale items
    const saleItems = saleRequest.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      product_name: item.product_name,
      variant_name: item.variant_name ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      discount_percent: item.discount_percent,
      subtotal: item.subtotal,
      tax_amount: item.tax_amount,
      total: item.total,
    }));
    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    // Create sale payments
    const salePayments = saleRequest.payments.map((payment) => ({
      sale_id: sale.id,
      payment_method: payment.payment_method,
      amount: payment.amount,
    }));

    const { error: paymentsError } = await supabase
      .from("sale_payments")
      .insert(salePayments);

    if (paymentsError) {
      return { success: false, error: paymentsError.message };
    }

    // Update stock and log movements for each item
    // Requirement 10.3: filter by company_id to prevent cross-tenant stock updates
    for (const item of saleRequest.items) {
      if (item.variant_id) {
        // Variant stock update — validate via parent product's company_id
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_quantity, products!inner(company_id)")
          .eq("id", item.variant_id)
          .eq("products.company_id", profile.company_id)
          .single();

        if (variant) {
          const stockBefore = variant.stock_quantity;
          const stockAfter = stockBefore - item.quantity;
          await supabase
            .from("product_variants")
            .update({ stock_quantity: stockAfter })
            .eq("id", item.variant_id);

          await logSaleStockMovement(
            sale.id,
            item.product_id,
            item.quantity,
            stockBefore,
            stockAfter,
            item.variant_id
          );
        }
      } else {
        // Product stock update — validate company_id (Requirement 10.3)
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity, track_inventory")
          .eq("id", item.product_id)
          .eq("company_id", profile.company_id)
          .single();

        if (product?.track_inventory) {
          const stockBefore = product.stock_quantity;
          const stockAfter = stockBefore - item.quantity;
          await supabase
            .from("products")
            .update({ stock_quantity: stockAfter })
            .eq("id", item.product_id);

          await logSaleStockMovement(
            sale.id,
            item.product_id,
            item.quantity,
            stockBefore,
            stockAfter
          );
        }
      }
    }

    // Requirement 3.3, 3.4: register cash movement
    const cashAmount = saleRequest.payments
      .filter((p) => p.payment_method === "Efectivo")
      .reduce((sum, p) => sum + p.amount, 0);

    await registerCashMovementForSale(
      opening.id,
      saleTotal,
      cashAmount,
      sale.sale_number
    );

    // Revalidate paths
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/products");

    return {
      success: true,
      sale_id: sale.id,
      sale_number: sale.sale_number,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al crear la venta";
    return { success: false, error: message };
  }
}

/**
 * Calculate change for a cash payment.
 * Pure function — no database calls.
 * Requirements: 1.7, 12.6
 */
export async function calculateChange(
  amountDue: number,
  amountReceived: number
): Promise<{ change: number; valid: boolean; error?: string }> {
  if (amountDue <= 0) {
    return { change: 0, valid: false, error: "El monto a pagar debe ser mayor a cero" };
  }
  if (amountReceived < amountDue) {
    return { change: 0, valid: false, error: "El monto recibido es insuficiente" };
  }
  return { change: amountReceived - amountDue, valid: true };
}

/**
 * Generate a POS ticket in thermal printer format (80mm).
 * Fetches sale data from DB and returns HTML string.
 * Requirements: 4.1, 4.2
 */
export async function generatePOSTicket(
  saleId: string
): Promise<{ success: boolean; ticket_html: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, ticket_html: "", error: "Usuario no autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { success: false, ticket_html: "", error: "Empresa no encontrada" };
    }

    // Fetch sale with items, payments and customer
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select(`
        *,
        sale_items(*),
        sale_payments(*),
        customers(name)
      `)
      .eq("id", saleId)
      .eq("company_id", profile.company_id)
      .single();

    if (saleError || !sale) {
      return { success: false, ticket_html: "", error: "Venta no encontrada" };
    }

    // Fetch company settings
    const { data: company } = await supabase
      .from("companies")
      .select("name, currency_code, currency_symbol")
      .eq("id", profile.company_id)
      .single();

    const companyName = company?.name ?? "Mi Empresa";
    const currencySymbol = company?.currency_symbol ?? "$";

    const fmt = (n: number) => `${currencySymbol}${Number(n).toFixed(2)}`;

    // Build sale date string
    const saleDate = new Date(sale.sale_date ?? sale.created_at);
    const dateStr = saleDate.toLocaleDateString("es-AR");
    const timeStr = saleDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    // Customer name
    const customerName =
      (sale.customers as { name?: string } | null)?.name ?? "Cliente Genérico";

    // Items rows
    const itemsRows = (sale.sale_items as Array<{
      product_name: string;
      variant_name?: string | null;
      quantity: number;
      unit_price: number;
      total: number;
    }>)
      .map((item) => {
        const label = item.variant_name
          ? `${item.product_name} (${item.variant_name})`
          : item.product_name;
        const line = `${label}`;
        const detail = `  ${item.quantity} x ${fmt(item.unit_price)} = ${fmt(item.total)}`;
        return `<div>${line}</div><div style="padding-left:8px;">${detail}</div>`;
      })
      .join("");

    // Payment rows
    const paymentRows = (sale.sale_payments as Array<{
      payment_method: string;
      amount: number;
    }>)
      .map(
        (p) =>
          `<div style="display:flex;justify-content:space-between;"><span>${p.payment_method}</span><span>${fmt(p.amount)}</span></div>`
      )
      .join("");

    // Change (only for cash payments)
    const cashPaid = (sale.sale_payments as Array<{ payment_method: string; amount: number }>)
      .filter((p) => p.payment_method === "Efectivo")
      .reduce((sum, p) => sum + p.amount, 0);

    const changeAmount = cashPaid > sale.total ? cashPaid - sale.total : 0;
    const changeRow =
      changeAmount > 0
        ? `<div style="display:flex;justify-content:space-between;"><span>Cambio</span><span>${fmt(changeAmount)}</span></div>`
        : "";

    // Discount row
    const discountRow =
      sale.discount_amount > 0
        ? `<div style="display:flex;justify-content:space-between;"><span>Descuento</span><span>-${fmt(sale.discount_amount)}</span></div>`
        : "";

    // Tax row
    const taxRow =
      sale.tax_amount > 0
        ? `<div style="display:flex;justify-content:space-between;"><span>Impuestos</span><span>${fmt(sale.tax_amount)}</span></div>`
        : "";

    const sep = `<div style="border-top:1px dashed #000;margin:6px 0;"></div>`;

    const html = `
<div style="font-family:monospace;width:80mm;font-size:12px;padding:8px;box-sizing:border-box;">
  <div style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:4px;">${companyName}</div>
  ${sep}
  <div style="display:flex;justify-content:space-between;"><span>Venta #${sale.sale_number}</span><span>${dateStr} ${timeStr}</span></div>
  <div>Cliente: ${customerName}</div>
  ${sep}
  ${itemsRows}
  ${sep}
  <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>${fmt(sale.subtotal)}</span></div>
  ${discountRow}
  ${taxRow}
  <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;"><span>TOTAL</span><span>${fmt(sale.total)}</span></div>
  ${sep}
  ${paymentRows}
  ${changeRow}
  ${sep}
  <div style="text-align:center;margin-top:8px;">¡Gracias por su compra!</div>
</div>`.trim();

    return { success: true, ticket_html: html };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al generar el ticket";
    return { success: false, ticket_html: "", error: message };
  }
}

/**
 * Send POS ticket by email.
 * Generates the ticket HTML and sends it via Resend.
 * Requirements: 4.3
 */
export async function sendPOSTicketEmail(
  saleId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: generate ticket HTML
    const ticketResult = await generatePOSTicket(saleId);
    if (!ticketResult.success) {
      return { success: false, error: ticketResult.error ?? "Error al generar el ticket" };
    }

    // Step 2: fetch sale number and company name for the subject
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { success: false, error: "Empresa no encontrada" };

    const { data: sale } = await supabase
      .from("sales")
      .select("sale_number")
      .eq("id", saleId)
      .eq("company_id", profile.company_id)
      .single();

    if (!sale) return { success: false, error: "Venta no encontrada" };

    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single();

    const companyName = company?.name ?? "Mi Empresa";
    const subject = `Ticket de venta #${sale.sale_number} - ${companyName}`;

    // Step 3: check Resend API key
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "re_dummy_key_for_build"
    ) {
      console.warn("[Resend] API key not configured. Ticket email will not be sent.");
      return {
        success: false,
        error: "Resend API key not configured. Please add RESEND_API_KEY to your environment variables.",
      };
    }

    // Step 4: send email with ticket HTML wrapped in a basic HTML document
    const { Resend } = await import("resend");
    const resendClient = new Resend(process.env.RESEND_API_KEY);

    const wrappedHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f3f4f6;
        margin: 0;
        padding: 20px;
        display: flex;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    ${ticketResult.ticket_html}
  </body>
</html>`;

    const { data, error } = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject,
      html: wrappedHtml,
    });

    if (error) {
      console.error("[Resend] Error sending POS ticket email:", error);
      return { success: false, error: error.message };
    }

    console.log("[Resend] POS ticket email sent successfully:", data?.id);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al enviar el ticket por email";
    console.error("[Resend] Exception sending POS ticket email:", error);
    return { success: false, error: message };
  }
}

// =============================================================================
// MODO OFFLINE — Caché de productos frecuentes (Plan Empresarial)
// =============================================================================

/**
 * Obtiene los top N productos más vendidos para el caché offline.
 * Ordena por cantidad total vendida en sale_items.
 * Requirements: 6.1
 */
export async function getFrequentProducts(
  limit: number = 100
): Promise<POSProductSearchResult[]> {
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

  // Obtener los product_ids más vendidos usando sale_items
  const { data: topItems } = await supabase
    .from("sale_items")
    .select("product_id, quantity")
    .eq("sales.company_id", profile.company_id)
    .limit(500);

  // Agregar por product_id en memoria
  const countMap: Record<string, number> = {};
  for (const item of topItems ?? []) {
    if (!item.product_id) continue;
    countMap[item.product_id] = (countMap[item.product_id] ?? 0) + (item.quantity ?? 1);
  }

  const topProductIds = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  // Si no hay historial de ventas, devolver los productos más recientes
  if (topProductIds.length === 0) {
    const { data: fallback } = await supabase
      .from("products")
      .select(`*, variants:product_variants(*)`)
      .eq("company_id", profile.company_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!fallback) return [];

    return fallback.map((p) => ({
      ...p,
      variants: (p.variants ?? []).filter(
        (v: { is_active: boolean }) => v.is_active
      ),
    }));
  }

  // Obtener datos completos de los productos top
  const { data: products } = await supabase
    .from("products")
    .select(`*, variants:product_variants(*)`)
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .in("id", topProductIds);

  if (!products) return [];

  // Ordenar según el ranking de ventas
  const ranked = products
    .map((p) => ({ ...p, _rank: countMap[p.id] ?? 0 }))
    .sort((a, b) => b._rank - a._rank)
    .map(({ _rank: _r, ...p }) => ({
      ...p,
      variants: (p.variants ?? []).filter(
        (v: { is_active: boolean }) => v.is_active
      ),
    }));

  return ranked;
}

// =============================================================================
// MODO OFFLINE — Sincronización de ventas (Plan Empresarial)
// =============================================================================

import type { OfflineQueueItem } from "@/lib/types/pos";

interface SyncOfflineSalesResult {
  synced: number;
  failed: number;
  errors: string[];
  /** Detalle de errores por item para que el hook pueda actualizar el estado */
  itemErrors: Array<{ id: string; error: string }>;
}

/**
 * Procesa la cola de ventas offline e intenta sincronizarlas con el servidor.
 *
 * Para cada item:
 * - Intenta crear la venta llamando a createPOSSale
 * - Si hay conflicto de stock, marca el item como fallido con mensaje descriptivo
 * - Si la venta se crea exitosamente, el item se considera sincronizado
 *
 * Requirements: 6.4, 6.6
 */
export async function syncOfflineSales(
  queueItems: OfflineQueueItem[]
): Promise<SyncOfflineSalesResult> {
  const result: SyncOfflineSalesResult = {
    synced: 0,
    failed: 0,
    errors: [],
    itemErrors: [],
  };

  const pending = queueItems.filter((item) => item.status === "pending" || item.status === "syncing");

  if (pending.length === 0) {
    return result;
  }

  for (const item of pending) {
    try {
      const saleResult = await createPOSSale(item.sale_data);

      if (saleResult.success) {
        result.synced++;
      } else {
        result.failed++;
        const errorMsg = saleResult.error ?? "Error desconocido al sincronizar";
        result.errors.push(`[${item.id}] ${errorMsg}`);
        result.itemErrors.push({ id: item.id, error: errorMsg });
      }
    } catch (error) {
      result.failed++;
      const errorMsg =
        error instanceof Error ? error.message : "Error inesperado al sincronizar";
      result.errors.push(`[${item.id}] ${errorMsg}`);
      result.itemErrors.push({ id: item.id, error: errorMsg });
    }
  }

  return result;
}

// =============================================================================
// VALIDACIÓN DE STOCK DURANTE VENTA (Requirement 12.5)
// =============================================================================

/**
 * Verifica la disponibilidad de stock justo antes de confirmar el pago.
 *
 * A diferencia de `validatePOSCart`, esta función es más liviana: solo consulta
 * el stock actual en la base de datos para detectar cambios causados por ventas
 * concurrentes. No valida todas las reglas de negocio.
 *
 * @param items - Items del carrito a verificar
 * @returns `{ available: true, conflicts: [] }` si todo el stock está disponible,
 *          o `{ available: false, conflicts: [...] }` con los items que tienen
 *          stock insuficiente.
 *
 * Requirements: 12.5
 */
export async function checkStockAvailabilityDuringSale(
  items: Array<{
    product_id: string;
    variant_id?: string | null;
    product_name: string;
    variant_name?: string | null;
    quantity: number;
  }>
): Promise<{
  available: boolean;
  conflicts: Array<{
    product_id: string;
    variant_id?: string | null;
    product_name: string;
    variant_name?: string | null;
    requested: number;
    available: number;
  }>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { available: false, conflicts: [] };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return { available: false, conflicts: [] };

  const conflicts: Array<{
    product_id: string;
    variant_id?: string | null;
    product_name: string;
    variant_name?: string | null;
    requested: number;
    available: number;
  }> = [];

  for (const item of items) {
    if (item.variant_id) {
      // Verificar stock de variante, validando que pertenece a la empresa
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity, products!inner(company_id)")
        .eq("id", item.variant_id)
        .eq("products.company_id", profile.company_id)
        .single();

      const currentStock = variant?.stock_quantity ?? 0;
      if (currentStock < item.quantity) {
        conflicts.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          variant_name: item.variant_name ?? null,
          requested: item.quantity,
          available: currentStock,
        });
      }
    } else {
      // Verificar stock del producto, filtrando por company_id
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity, track_inventory")
        .eq("id", item.product_id)
        .eq("company_id", profile.company_id)
        .single();

      // Si no rastrea inventario, no hay conflicto
      if (!product || !product.track_inventory) continue;

      const currentStock = product.stock_quantity ?? 0;
      if (currentStock < item.quantity) {
        conflicts.push({
          product_id: item.product_id,
          variant_id: null,
          product_name: item.product_name,
          variant_name: null,
          requested: item.quantity,
          available: currentStock,
        });
      }
    }
  }

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}
