"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/utils/permissions";
import type { Supplier, SupplierFormData } from "@/lib/types/erp";

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
