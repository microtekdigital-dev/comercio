"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/utils/permissions";
import type { Supplier, SupplierFormData } from "@/lib/types/erp";
import { canAccessSuppliers } from "@/lib/utils/plan-limits";
import { calculateBalance } from "@/lib/actions/accounts-settlement";

// Tipo para movimientos de cuenta corriente
export interface AccountMovement {
  id: string;
  type: 'purchase' | 'payment';
  date: Date;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

// Get all suppliers
export async function getSuppliers(filters?: {
  search?: string;
  status?: string;
}): Promise<Supplier[]> {
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

    // Verificar acceso a proveedores según el plan
    const access = await canAccessSuppliers(profile.company_id);
    if (!access.allowed) {
      return [];
    }

    let query = supabase
      .from("suppliers")
      .select("*")
      .eq("company_id", profile.company_id);

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    query = query.order("name", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

// Get single supplier
export async function getSupplier(id: string): Promise<Supplier | null> {
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
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return null;
  }
}

// Create supplier
export async function createSupplier(formData: SupplierFormData) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canCreateSuppliers");

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

    // Verificar acceso a proveedores según el plan
    const access = await canAccessSuppliers(profile.company_id);
    if (!access.allowed) {
      return { error: access.message || "No tienes acceso a esta funcionalidad" };
    }

    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        company_id: profile.company_id,
        ...formData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/suppliers");
    return { data };
  } catch (error: any) {
    console.error("Error creating supplier:", error);
    return { error: error.message || "Error al crear el proveedor" };
  }
}

// Update supplier
export async function updateSupplier(id: string, formData: Partial<SupplierFormData>) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canEditSuppliers");

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
      .from("suppliers")
      .update(formData)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/suppliers");
    revalidatePath(`/dashboard/suppliers/${id}`);
    return { data };
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    return { error: error.message || "Error al actualizar el proveedor" };
  }
}

// Delete supplier
export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canDeleteSuppliers");

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

    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) throw error;

    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting supplier:", error);
    return { error: error.message || "Error al eliminar el proveedor" };
  }
}

// Get supplier statistics
export async function getSupplierStats(supplierId: string) {
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

    // Get purchase orders count and total
    const { data: orders } = await supabase
      .from("purchase_orders")
      .select("total, status")
      .eq("supplier_id", supplierId)
      .eq("company_id", profile.company_id);

    // Get payments
    const { data: payments } = await supabase
      .from("supplier_payments")
      .select("amount")
      .eq("supplier_id", supplierId)
      .eq("company_id", profile.company_id);

    const totalOrders = orders?.length || 0;
    const totalPurchased = orders?.reduce((sum, o) => sum + o.total, 0) || 0;
    const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

    return {
      totalOrders,
      totalPurchased,
      totalPaid,
      balance: totalPurchased - totalPaid,
      pendingOrders,
    };
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    return null;
  }
}

// Get supplier balance (total pending purchases - payments)
export async function getSupplierBalance(supplierId: string): Promise<number> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return 0;

    // Get ALL purchase orders for this supplier
    const { data: orders, error: ordersError } = await supabase
      .from("purchase_orders")
      .select("id, total")
      .eq("supplier_id", supplierId)
      .eq("company_id", profile.company_id);

    if (ordersError) throw ordersError;

    // Get all payments for this supplier
    const { data: payments, error: paymentsError } = await supabase
      .from("supplier_payments")
      .select("amount")
      .eq("supplier_id", supplierId)
      .eq("company_id", profile.company_id);

    if (paymentsError) throw paymentsError;

    // Calculate total purchases
    const totalPurchases = (orders || []).reduce((sum, order) => sum + order.total, 0);
    
    // Calculate total payments
    const totalPayments = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);

    // Balance = Total purchases - Total payments
    return totalPurchases - totalPayments;
  } catch (error) {
    console.error("Error calculating supplier balance:", error);
    return 0;
  }
}

// Get supplier account movements (purchases and payments)
export async function getSupplierAccountMovements(supplierId: string): Promise<AccountMovement[]> {
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

    // Get all purchase orders for this supplier
    const { data: orders, error: ordersError } = await supabase
      .from("purchase_orders")
      .select("id, order_number, order_date, total")
      .eq("supplier_id", supplierId)
      .eq("company_id", profile.company_id)
      .order("order_date", { ascending: false });

    if (ordersError) throw ordersError;

    // Get all payments for this supplier
    const { data: payments, error: paymentsError } = await supabase
      .from("supplier_payments")
      .select("id, amount, payment_date, payment_method, reference_number, purchase_order_id")
      .eq("supplier_id", supplierId)
      .eq("company_id", profile.company_id);

    if (paymentsError) throw paymentsError;

    const movements: AccountMovement[] = [];

    // Add purchase orders as debit movements
    for (const order of orders || []) {
      movements.push({
        id: order.id,
        type: 'purchase',
        date: new Date(order.order_date),
        reference: order.order_number,
        description: 'Compra',
        debit: order.total,
        credit: 0,
        balance: 0, // Will be calculated later
      });
    }

    // Add payments as credit movements
    for (const payment of payments || []) {
      movements.push({
        id: payment.id,
        type: 'payment',
        date: new Date(payment.payment_date),
        reference: payment.reference_number || '-',
        description: `Pago - ${payment.payment_method}`,
        debit: 0,
        credit: payment.amount,
        balance: 0, // Will be calculated later
      });
    }

    // Sort by date descending (most recent first)
    movements.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate running balance (from oldest to newest)
    let runningBalance = 0;
    for (let i = movements.length - 1; i >= 0; i--) {
      runningBalance += movements[i].debit - movements[i].credit;
      movements[i].balance = runningBalance;
    }

    return movements;
  } catch (error) {
    console.error("Error fetching supplier account movements:", error);
    return [];
  }
}
