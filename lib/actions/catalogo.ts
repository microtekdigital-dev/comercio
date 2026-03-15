"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CatalogSettings,
  OnlineOrder,
  PlanTier,
} from "@/lib/types/catalogo";
import { getPlanTier } from "@/lib/utils/catalogo-utils";

// =====================================================
// Helper: obtener company_id del usuario autenticado
// =====================================================
async function getCompanyId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  return profile?.company_id ?? null;
}

// =====================================================
// Helper: obtener plan tier de la empresa
// =====================================================
async function getCompanyPlanTier(
  companyId: string
): Promise<PlanTier> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plans(name)")
    .eq("company_id", companyId)
    .eq("status", "active")
    .single();

  const planName = (data?.plans as any)?.name ?? "";
  return getPlanTier(planName);
}

// =====================================================
// getCatalogoConfig
// =====================================================
export async function getCatalogoConfig(): Promise<{
  settings: CatalogSettings | null;
  planTier: PlanTier;
  catalogUrl: string | null;
} | null> {
  const supabase = await createClient();
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("slug")
    .eq("id", companyId)
    .single();

  const { data: settings } = await supabase
    .from("catalog_settings")
    .select("*")
    .eq("company_id", companyId)
    .single();

  const planTier = await getCompanyPlanTier(companyId);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const catalogUrl = company?.slug
    ? `${baseUrl}/catalogo/${company.slug}`
    : null;

  return {
    settings: settings ?? null,
    planTier,
    catalogUrl,
  };
}

// =====================================================
// toggleCatalogo
// =====================================================
export async function toggleCatalogo(
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("catalog_settings")
    .upsert(
      { company_id: companyId, is_active: isActive },
      { onConflict: "company_id" }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/catalogo");
  return { success: true };
}

// =====================================================
// getProductosParaCatalogo
// =====================================================
export async function getProductosParaCatalogo() {
  const supabase = await createClient();
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, price, stock_quantity, is_active, published, image_url")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");

  if (error) return [];
  return data ?? [];
}

// =====================================================
// toggleProductoPublicado
// =====================================================
export async function toggleProductoPublicado(
  productId: string,
  published: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("products")
    .update({ published })
    .eq("id", productId)
    .eq("company_id", companyId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/catalogo");
  return { success: true };
}

// =====================================================
// getPedidosOnline
// =====================================================
export async function getPedidosOnline(filtros?: {
  status?: "pendiente" | "confirmado" | "rechazado";
}): Promise<OnlineOrder[]> {
  const supabase = await createClient();
  const companyId = await getCompanyId();
  if (!companyId) return [];

  let query = supabase
    .from("online_orders")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (filtros?.status) {
    query = query.eq("status", filtros.status);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as OnlineOrder[];
}

// =====================================================
// confirmarPedidoOnline
// =====================================================
export async function confirmarPedidoOnline(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("online_orders")
    .update({ status: "confirmado", confirmed_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("company_id", companyId)
    .eq("status", "pendiente");

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/catalogo");
  return { success: true };
}

// =====================================================
// rechazarPedidoOnline
// =====================================================
export async function rechazarPedidoOnline(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("online_orders")
    .update({ status: "rechazado", rejected_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("company_id", companyId)
    .eq("status", "pendiente");

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/catalogo");
  return { success: true };
}

// =====================================================
// guardarPersonalizacion (solo Plan Empresarial)
// =====================================================
export async function guardarPersonalizacion(
  color: string,
  logoUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const companyId = await getCompanyId();
  if (!companyId) return { success: false, error: "No autenticado" };

  const planTier = await getCompanyPlanTier(companyId);
  if (planTier !== "empresarial") {
    return { success: false, error: "Esta función requiere el Plan Empresarial" };
  }

  const updateData: Record<string, string> = { primary_color: color };
  if (logoUrl !== undefined) updateData.logo_url = logoUrl;

  const { error } = await supabase
    .from("catalog_settings")
    .upsert(
      { company_id: companyId, ...updateData },
      { onConflict: "company_id" }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/catalogo");
  return { success: true };
}
