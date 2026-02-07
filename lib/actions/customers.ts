"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/utils/permissions";
import type { Customer, CustomerFormData } from "@/lib/types/erp";

// Get all customers for a company with filters
export async function getCustomers(filters?: {
  search?: string;
  status?: string;
}): Promise<Customer[]> {
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
      .from("customers")
      .select("*")
      .eq("company_id", profile.company_id);

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

// Get single customer
export async function getCustomer(id: string): Promise<Customer | null> {
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
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

// Create customer
export async function createCustomer(formData: CustomerFormData) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canCreateCustomers");

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
      .from("customers")
      .insert({
        ...formData,
        company_id: profile.company_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/customers");
    return { data };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return { error: error.message || "Error al crear el cliente" };
  }
}

// Update customer
export async function updateCustomer(id: string, formData: CustomerFormData) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canEditCustomers");

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
      .from("customers")
      .update(formData)
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/customers");
    return { data };
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return { error: error.message || "Error al actualizar el cliente" };
  }
}

// Delete customer
export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  
  try {
    // Verificar permisos
    await requirePermission("canDeleteCustomers");

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
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) throw error;

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return { error: error.message || "Error al eliminar el cliente" };
  }
}

// Search customers
export async function searchCustomers(query: string): Promise<Customer[]> {
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

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("company_id", profile.company_id)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,document_number.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching customers:", error);
    return [];
  }
}
