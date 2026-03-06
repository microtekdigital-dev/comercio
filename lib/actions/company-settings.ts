"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateCurrencyCode, SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/utils/currency";
import type { CompanySettings } from "@/lib/types/erp";

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

/**
 * Obtiene la configuración de la empresa
 */
export async function getCompanySettings(): Promise<CompanySettings | null> {
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

    const { data: settings, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single();

    if (error) throw error;

    return settings;
  } catch (error) {
    console.error("Error getting company settings:", error);
    return null;
  }
}

/**
 * Actualiza la configuración de moneda de la empresa
 */
export async function updateCurrencySettings(data: {
  currency_code: string;
  currency_symbol: string;
  currency_position: 'before' | 'after';
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    // Validar código de moneda
    const validation = validateCurrencyCode(data.currency_code);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Validar posición de símbolo
    if (!['before', 'after'].includes(data.currency_position)) {
      return { success: false, error: 'Posición de símbolo inválida. Debe ser "before" o "after"' };
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

    // Actualizar configuración de moneda
    const { error: updateError } = await supabase
      .from("company_settings")
      .update({
        currency_code: data.currency_code,
        currency_symbol: data.currency_symbol,
        currency_position: data.currency_position,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", profile.company_id);

    if (updateError) throw updateError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating currency settings:", error);
    return { success: false, error: error.message || "Error al actualizar la configuración de moneda" };
  }
}

/**
 * Actualiza la configuración general de la empresa
 */
export async function updateCompanySettings(data: Partial<CompanySettings>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    // Validar código de moneda si se proporciona
    if (data.currency_code) {
      const validation = validateCurrencyCode(data.currency_code);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    // Validar posición de símbolo si se proporciona
    if (data.currency_position && !['before', 'after'].includes(data.currency_position)) {
      return { success: false, error: 'Posición de símbolo inválida. Debe ser "before" o "after"' };
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

    // Actualizar configuración
    const { error: updateError } = await supabase
      .from("company_settings")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", profile.company_id);

    if (updateError) throw updateError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating company settings:", error);
    return { success: false, error: error.message || "Error al actualizar la configuración" };
  }
}
