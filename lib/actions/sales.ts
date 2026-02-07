"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Sale, SaleFormData, SalePayment } from "@/lib/types/erp";
import { requirePermission } from "@/lib/utils/permissions";

// Get all sales for a company with filters
export async function getSales(filters?: {
  search?: string;
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Sale[]> {
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

    let query = supabase
      .from("sales")
      .select(`
        *,
        customer:customers(*),
        items:sale_items(*, product:products(*)),
        payments:sale_payments(*)
      `)
      .eq("company_id", profile.company_id);

    // Apply filters
    if (filters?.search) {
      query = query.or(`sale_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.paymentStatus) {
      query = query.eq("payment_status", filters.paymentStatus);
    }

    if (filters?.customerId) {
      query = query.eq("customer_id", filters.customerId);
    }

    if (filters?.dateFrom) {
      query = query.gte("sale_date", filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte("sale_date", filters.dateTo);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}

// Get single sale
export async function getSale(id: string): Promise<Sale | null> {
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
      .from("sales")
      .select(`
        *,
        customer:customers(*),
        items:sale_items(*, product:products(*)),
        payments:sale_payments(*)
      `)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching sale:", error);
    return null;
  }
}

// Create sale
export async function createSale(formData: SaleFormData) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canCreateSales");

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

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    
    const items = formData.items.map(item => {
      const itemSubtotal = item.quantity * item.unit_price;
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

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        company_id: profile.company_id,
        customer_id: formData.customer_id || null,
        status: formData.status,
        sale_date: formData.sale_date,
        due_date: formData.due_date || null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total,
        currency: "ARS",
        payment_status: "pending",
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // Create sale items
    const itemsToInsert = items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      product_sku: item.product_sku || null,
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
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Update product stock if needed
    for (const item of items) {
      if (item.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity, track_inventory")
          .eq("id", item.product_id)
          .single();

        if (product?.track_inventory) {
          await supabase
            .from("products")
            .update({
              stock_quantity: product.stock_quantity - item.quantity,
            })
            .eq("id", item.product_id);
        }
      }
    }

    // Create notification for new sale
    try {
      await supabase.from("notifications").insert({
        company_id: profile.company_id,
        type: "new_sale",
        title: "Nueva Venta Registrada",
        message: `Se registró la venta #${sale.sale_number} por ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(total)}`,
        link: `/dashboard/sales/${sale.id}`,
        priority: "normal",
        metadata: { sale_id: sale.id, amount: total },
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/products");
    return { data: sale };
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return { error: error.message || "Error al crear la venta" };
  }
}

// Update sale
export async function updateSale(id: string, formData: Partial<SaleFormData>) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canEditSales");

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

    const { data, error } = await supabase
      .from("sales")
      .update({
        status: formData.status,
        notes: formData.notes,
      })
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/sales");
    return { data };
  } catch (error: any) {
    console.error("Error updating sale:", error);
    return { error: error.message || "Error al actualizar la venta" };
  }
}

// Delete sale
export async function deleteSale(id: string) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canDeleteSales");

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

    // Get sale items to restore stock
    const { data: items } = await supabase
      .from("sale_items")
      .select("product_id, quantity")
      .eq("sale_id", id);

    // Restore stock
    if (items) {
      for (const item of items) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity, track_inventory")
            .eq("id", item.product_id)
            .single();

          if (product?.track_inventory) {
            await supabase
              .from("products")
              .update({
                stock_quantity: product.stock_quantity + item.quantity,
              })
              .eq("id", item.product_id);
          }
        }
      }
    }

    const { error } = await supabase
      .from("sales")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) throw error;

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sale:", error);
    return { error: "Error al eliminar la venta" };
  }
}

// Add payment to sale
export async function addSalePayment(
  saleId: string,
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
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { error: "No se encontró la empresa" };
    }

    // Get sale
    const { data: sale } = await supabase
      .from("sales")
      .select("total, payments:sale_payments(amount)")
      .eq("id", saleId)
      .eq("company_id", profile.company_id)
      .single();

    if (!sale) return { error: "Venta no encontrada" };

    // Calculate paid amount
    const paidAmount = (sale.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const newPaidAmount = paidAmount + amount;

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from("sale_payments")
      .insert({
        sale_id: saleId,
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update sale payment status
    let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
    if (newPaidAmount >= sale.total) {
      paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    }

    await supabase
      .from("sales")
      .update({ payment_status: paymentStatus })
      .eq("id", saleId);

    // Create notification for payment received
    try {
      const { data: saleData } = await supabase
        .from("sales")
        .select("sale_number")
        .eq("id", saleId)
        .single();

      await supabase.from("notifications").insert({
        company_id: profile.company_id,
        type: "payment_received",
        title: "Pago Recibido",
        message: `Se registró un pago de ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount)} para la venta #${saleData?.sale_number}`,
        link: `/dashboard/sales/${saleId}`,
        priority: "normal",
        metadata: { sale_id: saleId, amount, payment_status: paymentStatus },
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }

    revalidatePath("/dashboard/sales");
    return { data: payment };
  } catch (error) {
    console.error("Error adding payment:", error);
    return { error: "Error al registrar el pago" };
  }
}
