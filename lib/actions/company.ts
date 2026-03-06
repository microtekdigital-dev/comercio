"use server";

import { createClient } from "@/lib/supabase/server";
import { validateCurrencyCode } from "@/lib/utils/currency";

export async function getCompanyInfo() {
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
      .select("*")
      .eq("id", profile.company_id)
      .single();

    if (error) throw error;
    
    return company;
  } catch (error) {
    console.error("Error fetching company info:", error);
    return null;
  }
}

export async function updateCompanySettings(companyData: {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  logo_url?: string;
  default_tax_rate?: number;
  invoice_prefix?: string;
  invoice_next_number?: number;
  terms_and_conditions?: string;
  currency_code?: string;
  currency_symbol?: string;
  currency_position?: 'before' | 'after';
}) {
  const supabase = await createClient();
  
  try {
    // Validar código de moneda si se proporciona
    if (companyData.currency_code) {
      const validation = validateCurrencyCode(companyData.currency_code);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    // Validar posición de símbolo si se proporciona
    if (companyData.currency_position && !['before', 'after'].includes(companyData.currency_position)) {
      return { success: false, error: 'Posición de símbolo inválida. Debe ser "before" o "after"' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return { success: false, error: "No se encontró la empresa" };
    }

    // Only owner and admin can update company settings
    if (!["owner", "admin"].includes(profile.role || "")) {
      return { success: false, error: "No tienes permisos para actualizar la configuración" };
    }

    const { error } = await supabase
      .from("companies")
      .update(companyData)
      .eq("id", profile.company_id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating company settings:", error);
    return { success: false, error: "Error al actualizar la configuración" };
  }
}

