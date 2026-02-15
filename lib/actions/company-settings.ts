"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Configura el importe inicial de caja para una empresa
 */
export async function setInitialCashAmount(amount: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    // Validate amount > 0
    if (amount <= 0) {
      return { success: false, error: "El importe inicial debe ser mayor a cero" };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { success: false, error: "No se encontró la empresa" };
    }

    // Check if initial cash amount is already configured
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("initial_cash_amount")
      .eq("id", profile.company_id)
      .single();

    if (existingCompany?.initial_cash_amount !== null && existingCompany?.initial_cash_amount !== undefined) {
      return { success: false, error: "El importe inicial ya fue configurado para esta empresa" };
    }

    // Update companies table with initial cash amount
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        initial_cash_amount: amount,
        initial_cash_configured_at: new Date().toISOString(),
      })
      .eq("id", profile.company_id);

    if (updateError) throw updateError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cash-register");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error setting initial cash amount:", error);
    return { success: false, error: error.message || "Error al configurar el importe inicial" };
  }
}

/**
 * Obtiene el importe inicial de caja configurado
 */
export async function getInitialCashAmount(): Promise<number | null> {
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

    const { data: company, error } = await supabase
      .from("companies")
      .select("initial_cash_amount")
      .eq("id", profile.company_id)
      .single();

    if (error) throw error;

    return company?.initial_cash_amount || null;
  } catch (error) {
    console.error("Error getting initial cash amount:", error);
    return null;
  }
}

/**
 * Verifica si la empresa necesita configurar caja inicial
 */
export async function needsInitialCashSetup(): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return false;

    const { data: company, error } = await supabase
      .from("companies")
      .select("initial_cash_amount")
      .eq("id", profile.company_id)
      .single();

    if (error) throw error;

    // Returns true if initial_cash_amount is null or undefined
    return company?.initial_cash_amount === null || company?.initial_cash_amount === undefined;
  } catch (error) {
    console.error("Error checking if needs initial cash setup:", error);
    return false;
  }
}
