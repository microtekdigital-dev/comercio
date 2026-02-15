"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/utils/permissions";
import type { Customer, CustomerFormData } from "@/lib/types/erp";
import { calculateBalance } from "@/lib/actions/accounts-settlement";

// Tipo para movimientos de cuenta corriente
export interface AccountMovement {
  id: string;
  type: 'sale' | 'payment';
  date: Date;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

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

// Get customer balance (total pending sales - payments)
export async function getCustomerBalance(customerId: string): Promise<number> {
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

    // Get ALL sales for this customer with payments (not just pending/partial)
    const { data: sales, error } = await supabase
      .from("sales")
      .select(`
        id,
        total,
        payment_status,
        payments:sale_payments(amount)
      `)
      .eq("customer_id", customerId)
      .eq("company_id", profile.company_id);

    if (error) throw error;

    // Calculate total pending balance from all sales
    const totalPending = (sales || []).reduce((sum, sale) => {
      const balance = calculateBalance(sale.total, sale.payments || []);
      return sum + balance;
    }, 0);

    return totalPending;
  } catch (error) {
    console.error("Error calculating customer balance:", error);
    return 0;
  }
}

// Get customer account movements (sales and payments)
export async function getCustomerAccountMovements(customerId: string): Promise<AccountMovement[]> {
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

    // Get all sales for this customer with payments
    const { data: sales, error } = await supabase
      .from("sales")
      .select(`
        id,
        sale_number,
        sale_date,
        total,
        payments:sale_payments(
          id,
          amount,
          payment_date,
          payment_method,
          reference_number
        )
      `)
      .eq("customer_id", customerId)
      .eq("company_id", profile.company_id)
      .order("sale_date", { ascending: false });

    if (error) throw error;

    const movements: AccountMovement[] = [];

    // Transform sales and payments into movements
    for (const sale of sales || []) {
      // Add sale as debit movement
      movements.push({
        id: sale.id,
        type: 'sale',
        date: new Date(sale.sale_date),
        reference: sale.sale_number,
        description: 'Venta',
        debit: sale.total,
        credit: 0,
        balance: 0, // Will be calculated later
      });

      // Add payments as credit movements
      for (const payment of sale.payments || []) {
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
    console.error("Error fetching customer account movements:", error);
    return [];
  }
}
