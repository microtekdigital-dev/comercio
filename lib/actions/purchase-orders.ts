"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PurchaseOrder, PurchaseOrderFormData } from "@/lib/types/erp";
import { canAccessPurchaseOrders } from "@/lib/utils/plan-limits";

// Get all purchase orders
export async function getPurchaseOrders(filters?: {
  search?: string;
  status?: string;
  supplierId?: string;
}): Promise<PurchaseOrder[]> {
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

    // Verificar acceso a órdenes de compra según el plan
    const access = await canAccessPurchaseOrders(profile.company_id);
    if (!access.allowed) {
      return [];
    }

    let query = supabase
      .from("purchase_orders")
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*, product:products(*)),
        payments:supplier_payments(*)
      `)
      .eq("company_id", profile.company_id);

    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.supplierId) {
      query = query.eq("supplier_id", filters.supplierId);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

// Get single purchase order
export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
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

    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*, product:products(*)),
        payments:supplier_payments(*)
      `)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return null;
  }
}

// Create purchase order
export async function createPurchaseOrder(formData: PurchaseOrderFormData) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    if (!["owner", "admin", "member"].includes(profile.role || "")) {
      return { error: "No tienes permisos para crear órdenes de compra" };
    }

    // Verificar acceso a órdenes de compra según el plan
    const access = await canAccessPurchaseOrders(profile.company_id);
    if (!access.allowed) {
      return { error: access.message || "No tienes acceso a esta funcionalidad" };
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    
    const items = formData.items.map(item => {
      const itemSubtotal = item.quantity * item.unit_cost;
      const discount = itemSubtotal * (item.discount_percent / 100);
      const subtotalAfterDiscount = itemSubtotal - discount;
      const itemTax = subtotalAfterDiscount * (item.tax_rate / 100);
      const itemTotal = subtotalAfterDiscount + itemTax;
      
      subtotal += subtotalAfterDiscount;
      taxAmount += itemTax;
      
      return {
        ...item,
        subtotal: itemSubtotal,
        tax_amount: itemTax,
        total: itemTotal,
      };
    });

    const total = subtotal + taxAmount;

    // Generate order number with retry logic
    let order;
    let orderError;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      
      // Get the maximum order number for this company
      const { data: orders } = await supabase
        .from("purchase_orders")
        .select("order_number")
        .eq("company_id", profile.company_id)
        .not("order_number", "is", null)
        .order("order_number", { ascending: false })
        .limit(10);

      let nextNumber = 1;
      if (orders && orders.length > 0) {
        // Find the highest number from all orders
        const numbers = orders
          .map(o => {
            const match = o.order_number?.match(/PO-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(n => !isNaN(n));
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }

      // Add attempt number to avoid collisions on retry
      const orderNumber = `PO-${String(nextNumber + attempts - 1).padStart(6, "0")}`;

      // Try to create purchase order with generated number
      const result = await supabase
        .from("purchase_orders")
        .insert({
          company_id: profile.company_id,
          supplier_id: formData.supplier_id,
          order_number: orderNumber,
          status: formData.status,
          order_date: formData.order_date,
          expected_date: formData.expected_date || null,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: 0,
          total,
          currency: "ARS",
          payment_status: "pending",
          notes: formData.notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      order = result.data;
      orderError = result.error;

      // If successful or error is not duplicate, break
      if (!orderError || orderError.code !== "23505") {
        break;
      }

      // If duplicate, add small delay and retry
      await new Promise(resolve => setTimeout(resolve, 50 * attempts));
    }

    if (orderError) {
      console.error("Error creating purchase order:", orderError);
      throw orderError;
    }
    if (!order) throw new Error("Failed to create order after multiple attempts");

    // Create purchase order items
    const itemsToInsert = items.map(item => ({
      purchase_order_id: order.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      product_sku: item.product_sku || null,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      tax_rate: item.tax_rate,
      discount_percent: item.discount_percent,
      subtotal: item.subtotal,
      tax_amount: item.tax_amount,
      total: item.total,
      received_quantity: 0,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    revalidatePath("/dashboard/purchase-orders");
    revalidatePath("/dashboard/suppliers");
    return { data: order };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return { error: "Error al crear la orden de compra" };
  }
}

// Update purchase order status
export async function updatePurchaseOrderStatus(
  id: string,
  status: "pending" | "confirmed" | "received" | "cancelled"
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const updateData: any = { status };
    
    if (status === "received") {
      updateData.received_date = new Date().toISOString().split("T")[0];
    }

    const { data, error } = await supabase
      .from("purchase_orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/purchase-orders");
    revalidatePath(`/dashboard/purchase-orders/${id}`);
    return { data };
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    return { error: "Error al actualizar el estado" };
  }
}

// Receive items (update stock)
export async function receiveItems(orderId: string, items: { itemId: string; quantity: number }[]) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    const userName = profile.full_name || profile.email;

    // Update received quantities
    for (const item of items) {
      const { data: orderItem } = await supabase
        .from("purchase_order_items")
        .select("product_id, unit_cost, received_quantity")
        .eq("id", item.itemId)
        .single();

      if (orderItem) {
        // Update received quantity
        await supabase
          .from("purchase_order_items")
          .update({
            received_quantity: orderItem.received_quantity + item.quantity,
          })
          .eq("id", item.itemId);

        // Update product stock and cost
        if (orderItem.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity, track_inventory")
            .eq("id", orderItem.product_id)
            .single();

          if (product?.track_inventory) {
            const stockBefore = product.stock_quantity;
            const stockAfter = stockBefore + item.quantity;

            // Update product stock
            await supabase
              .from("products")
              .update({
                stock_quantity: stockAfter,
                last_purchase_cost: orderItem.unit_cost,
                last_purchase_date: new Date().toISOString().split("T")[0],
              })
              .eq("id", orderItem.product_id);

            // Register stock movement
            await supabase
              .from("stock_movements")
              .insert({
                company_id: profile.company_id,
                product_id: orderItem.product_id,
                movement_type: "purchase",
                quantity: item.quantity,
                stock_before: stockBefore,
                stock_after: stockAfter,
                purchase_order_id: orderId,
                created_by: user.id,
                created_by_name: userName,
                notes: "Recepción de mercadería de orden de compra",
              });
          }
        }
      }
    }

    // Check if all items are fully received
    const { data: allItems } = await supabase
      .from("purchase_order_items")
      .select("quantity, received_quantity")
      .eq("purchase_order_id", orderId);

    const fullyReceived = allItems?.every(
      item => item.received_quantity >= item.quantity
    );

    if (fullyReceived) {
      await updatePurchaseOrderStatus(orderId, "received");
    }

    revalidatePath("/dashboard/purchase-orders");
    revalidatePath(`/dashboard/purchase-orders/${orderId}`);
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    console.error("Error receiving items:", error);
    return { error: "Error al recibir los items" };
  }
}

// Add payment to purchase order
export async function addSupplierPayment(
  purchaseOrderId: string,
  amount: number,
  paymentMethod: string,
  referenceNumber?: string,
  notes?: string
) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    // Get purchase order
    const { data: order } = await supabase
      .from("purchase_orders")
      .select("supplier_id, total, payments:supplier_payments(amount)")
      .eq("id", purchaseOrderId)
      .eq("company_id", profile.company_id)
      .single();

    if (!order) return { error: "Orden no encontrada" };

    // Calculate paid amount
    const paidAmount = (order.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const newPaidAmount = paidAmount + amount;

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from("supplier_payments")
      .insert({
        company_id: profile.company_id,
        supplier_id: order.supplier_id,
        purchase_order_id: purchaseOrderId,
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update purchase order payment status
    let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
    if (newPaidAmount >= order.total) {
      paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    }

    await supabase
      .from("purchase_orders")
      .update({ payment_status: paymentStatus })
      .eq("id", purchaseOrderId);

    revalidatePath("/dashboard/purchase-orders");
    revalidatePath(`/dashboard/purchase-orders/${purchaseOrderId}`);
    return { data: payment };
  } catch (error) {
    console.error("Error adding payment:", error);
    return { error: "Error al registrar el pago" };
  }
}

// Delete purchase order
export async function deletePurchaseOrder(id: string) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    if (!["owner", "admin"].includes(profile.role || "")) {
      return { error: "No tienes permisos para eliminar órdenes" };
    }

    const { error } = await supabase
      .from("purchase_orders")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) throw error;

    revalidatePath("/dashboard/purchase-orders");
    return { success: true };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { error: "Error al eliminar la orden" };
  }
}
