"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  SaleReturn,
  CreateReturnInput,
  ReturnFilters,
} from "@/lib/types/erp";
import { logAuditEvent } from "@/lib/actions/audit-log";

// =====================================================
// createReturn — transacción atómica de devolución
// =====================================================
export async function createReturn(
  input: CreateReturnInput
): Promise<{ data?: SaleReturn; error?: string }> {
  const supabase = await createClient();

  try {
    // 1. Autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return { error: "No se encontró la empresa" };

    const { data: fullProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const createdByName =
      fullProfile?.full_name?.trim() ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Usuario";

    // 2. Validar motivo
    if (!input.reason) return { error: "Debe seleccionar un motivo de devolución" };
    if (
      input.reason === "other" &&
      (!input.reason_notes || input.reason_notes.trim().length < 10)
    ) {
      return {
        error: "Debe ingresar una descripción cuando el motivo es 'Otro' (mínimo 10 caracteres)",
      };
    }

    // 3. Cargar la venta con sus ítems y cliente
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*, items:sale_items(*), customer:customers(id)")
      .eq("id", input.sale_id)
      .eq("company_id", profile.company_id)
      .single();

    if (saleError || !sale) return { error: "Venta no encontrada" };

    // 4. Validar estado de la venta
    if (sale.status !== "completed") {
      return { error: "Solo se pueden devolver ventas completadas" };
    }

    // 5. Validar método customer_credit requiere cliente
    if (input.refund_method === "customer_credit" && !sale.customer_id) {
      return {
        error: "Se requiere un cliente asociado para aplicar crédito",
      };
    }

    // 6. Calcular cantidades ya devueltas por ítem
    const { data: existingReturnItems } = await supabase
      .from("sale_return_items")
      .select("sale_item_id, quantity, return:sale_returns!inner(sale_id, status)")
      .eq("return.sale_id", input.sale_id)
      .eq("return.status", "completed");

    const returnedQtyBySaleItem: Record<string, number> = {};
    for (const ri of existingReturnItems ?? []) {
      returnedQtyBySaleItem[ri.sale_item_id] =
        (returnedQtyBySaleItem[ri.sale_item_id] ?? 0) + ri.quantity;
    }

    // 7. Validar ítems de la devolución
    if (!input.items || input.items.length === 0) {
      return { error: "Debe seleccionar al menos un ítem para devolver" };
    }

    const saleItemsMap: Record<string, any> = {};
    for (const si of sale.items ?? []) {
      saleItemsMap[si.id] = si;
    }

    const returnItemsData: Array<{
      sale_item_id: string;
      product_id: string | null;
      variant_id: string | null;
      product_name: string;
      variant_name: string | null;
      quantity: number;
      unit_price: number;
      tax_rate: number;
      discount_percent: number;
      subtotal: number;
      tax_amount: number;
      total: number;
    }> = [];

    let totalAmount = 0;

    for (const inputItem of input.items) {
      if (inputItem.quantity <= 0) {
        return { error: "La cantidad a devolver debe ser mayor a cero" };
      }

      const saleItem = saleItemsMap[inputItem.sale_item_id];
      if (!saleItem) {
        return { error: "Ítem de venta no encontrado" };
      }

      const alreadyReturned = returnedQtyBySaleItem[inputItem.sale_item_id] ?? 0;
      const available = saleItem.quantity - alreadyReturned;

      if (inputItem.quantity > available) {
        return {
          error: `La cantidad a devolver supera la disponible para ${saleItem.product_name}`,
        };
      }

      // Calcular totales proporcionales al ítem original
      const ratio = inputItem.quantity / saleItem.quantity;
      const subtotal = parseFloat((saleItem.subtotal * ratio).toFixed(2));
      const taxAmount = parseFloat((saleItem.tax_amount * ratio).toFixed(2));
      const total = parseFloat((saleItem.total * ratio).toFixed(2));

      totalAmount += total;

      returnItemsData.push({
        sale_item_id: inputItem.sale_item_id,
        product_id: saleItem.product_id ?? null,
        variant_id: saleItem.variant_id ?? null,
        product_name: saleItem.product_name,
        variant_name: saleItem.variant_name ?? null,
        quantity: inputItem.quantity,
        unit_price: saleItem.unit_price,
        tax_rate: saleItem.tax_rate,
        discount_percent: saleItem.discount_percent,
        subtotal,
        tax_amount: taxAmount,
        total,
      });
    }

    totalAmount = parseFloat(totalAmount.toFixed(2));

    // 8. Validar monto > 0
    if (totalAmount <= 0) {
      return { error: "El monto a devolver debe ser mayor a cero" };
    }

    // 9. Verificar que no se haya devuelto el total ya
    const totalAlreadyReturned = Object.entries(returnedQtyBySaleItem).reduce(
      (sum, [saleItemId, qty]) => {
        const si = saleItemsMap[saleItemId];
        if (!si) return sum;
        const ratio = qty / si.quantity;
        return sum + si.total * ratio;
      },
      0
    );

    if (totalAlreadyReturned >= sale.total) {
      return { error: "Esta venta ya fue devuelta en su totalidad" };
    }

    // =====================================================
    // TRANSACCIÓN ATÓMICA (manual con compensación)
    // =====================================================

    // 10. Generar return_number
    const { count: returnCount } = await supabase
      .from("sale_returns")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id);

    const returnNumber = `DEV-${String((returnCount ?? 0) + 1).padStart(4, "0")}`;

    // 11. Insertar sale_return
    const { data: saleReturn, error: returnError } = await supabase
      .from("sale_returns")
      .insert({
        company_id: profile.company_id,
        sale_id: input.sale_id,
        return_number: returnNumber,
        total_amount: totalAmount,
        refund_method: input.refund_method,
        reason: input.reason,
        reason_notes: input.reason_notes ?? null,
        status: "completed",
        created_by: user.id,
      })
      .select()
      .single();

    if (returnError || !saleReturn) {
      return { error: "Error al crear la devolución" };
    }

    // 12. Insertar sale_return_items
    const itemsToInsert = returnItemsData.map((item) => ({
      ...item,
      return_id: saleReturn.id,
    }));

    const { error: itemsError } = await supabase
      .from("sale_return_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Compensar: eliminar el return creado
      await supabase.from("sale_returns").delete().eq("id", saleReturn.id);
      return { error: "Error al registrar los ítems de la devolución" };
    }

    // 13. Generar nota de crédito
    const { count: noteCount } = await supabase
      .from("credit_notes")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id);

    const noteNumber = `NC-${String((noteCount ?? 0) + 1).padStart(4, "0")}`;
    const creditNoteStatus =
      input.refund_method === "customer_credit" ? "applied" : "pending";

    const { data: creditNote, error: creditNoteError } = await supabase
      .from("credit_notes")
      .insert({
        company_id: profile.company_id,
        return_id: saleReturn.id,
        sale_id: input.sale_id,
        customer_id: sale.customer_id ?? null,
        note_number: noteNumber,
        amount: totalAmount,
        status: creditNoteStatus,
        applied_at:
          input.refund_method === "customer_credit" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (creditNoteError || !creditNote) {
      await supabase.from("sale_returns").delete().eq("id", saleReturn.id);
      return { error: "Error al generar la nota de crédito" };
    }

    // 14. Reponer stock
    for (const item of returnItemsData) {
      if (!item.product_id) continue;

      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity, track_inventory, has_variants")
        .eq("id", item.product_id)
        .single();

      if (!product?.track_inventory) continue;

      if (product.has_variants && item.variant_id) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.variant_id)
          .single();

        if (variant) {
          const stockBefore = variant.stock_quantity;
          const stockAfter = stockBefore + item.quantity;

          await supabase
            .from("product_variants")
            .update({ stock_quantity: stockAfter })
            .eq("id", item.variant_id);

          await supabase.from("stock_movements").insert({
            company_id: profile.company_id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            movement_type: "return_in",
            quantity: item.quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            sale_id: input.sale_id,
            return_id: saleReturn.id,
            created_by: user.id,
            created_by_name: createdByName,
            notes: `Devolución ${returnNumber}`,
          });
        }
      } else {
        const stockBefore = product.stock_quantity;
        const stockAfter = stockBefore + item.quantity;

        await supabase
          .from("products")
          .update({ stock_quantity: stockAfter })
          .eq("id", item.product_id);

        await supabase.from("stock_movements").insert({
          company_id: profile.company_id,
          product_id: item.product_id,
          variant_id: null,
          movement_type: "return_in",
          quantity: item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          sale_id: input.sale_id,
          return_id: saleReturn.id,
          created_by: user.id,
          created_by_name: createdByName,
          notes: `Devolución ${returnNumber}`,
        });
      }
    }

    // 15. Crédito al cliente si aplica
    if (input.refund_method === "customer_credit" && sale.customer_id) {
      await supabase.from("customer_credits").insert({
        company_id: profile.company_id,
        customer_id: sale.customer_id,
        credit_note_id: creditNote.id,
        amount: totalAmount,
        description: `Crédito por devolución ${returnNumber}`,
      });
    }

    // 16. Actualizar payment_status de la venta
    const newTotalReturned = totalAlreadyReturned + totalAmount;
    let newPaymentStatus: string;
    if (newTotalReturned >= sale.total) {
      newPaymentStatus = "refunded";
    } else {
      newPaymentStatus = "partial_refund";
    }

    await supabase
      .from("sales")
      .update({ payment_status: newPaymentStatus })
      .eq("id", input.sale_id);

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/returns");
    revalidatePath("/dashboard/products");

    void logAuditEvent({
      module: "devoluciones",
      action: "procesar",
      entityType: "sale_return",
      entityId: saleReturn.id,
      metadata: { return_number: returnNumber, total_amount: totalAmount, refund_method: input.refund_method, reason: input.reason },
    });

    return { data: saleReturn as SaleReturn };
  } catch (error: any) {
    console.error("Error creating return:", error);
    return {
      error: error.message || "Error al procesar la devolución. No se realizaron cambios.",
    };
  }
}

// =====================================================
// getReturns — listado con filtros
// =====================================================
export async function getReturns(filters?: ReturnFilters): Promise<SaleReturn[]> {
  const supabase = await createClient();

  try {
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

    let query = supabase
      .from("sale_returns")
      .select(`*, items:sale_return_items(*), credit_note:credit_notes(*), sale:sales(id, sale_number, customer_id, customer:customers(name))`)
      .eq("company_id", profile.company_id);

    if (filters?.saleId) query = query.eq("sale_id", filters.saleId);
    if (filters?.dateFrom) query = query.gte("return_date", filters.dateFrom);
    if (filters?.dateTo) query = query.lte("return_date", filters.dateTo);
    if (filters?.reason) query = query.eq("reason", filters.reason);
    if (filters?.refundMethod) query = query.eq("refund_method", filters.refundMethod);

    query = query.order("return_date", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data as SaleReturn[]) ?? [];
  } catch (error) {
    console.error("Error fetching returns:", error);
    return [];
  }
}

// =====================================================
// getReturn — detalle de una devolución
// =====================================================
export async function getReturn(id: string): Promise<SaleReturn | null> {
  const supabase = await createClient();

  try {
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

    const { data, error } = await supabase
      .from("sale_returns")
      .select(`*, items:sale_return_items(*), credit_note:credit_notes(*), sale:sales(*, items:sale_items(*), customer:customers(*))`)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) throw error;
    return data as SaleReturn;
  } catch (error) {
    console.error("Error fetching return:", error);
    return null;
  }
}

// =====================================================
// getReturnsBySale — devoluciones de una venta
// =====================================================
export async function getReturnsBySale(saleId: string): Promise<SaleReturn[]> {
  return getReturns({ saleId });
}

// =====================================================
// getCustomerCredit — saldo de crédito de un cliente
// =====================================================
export async function getCustomerCredit(customerId: string): Promise<number> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return 0;

    const { data, error } = await supabase
      .from("customer_credits")
      .select("amount")
      .eq("company_id", profile.company_id)
      .eq("customer_id", customerId);

    if (error) throw error;
    return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  } catch (error) {
    console.error("Error fetching customer credit:", error);
    return 0;
  }
}
