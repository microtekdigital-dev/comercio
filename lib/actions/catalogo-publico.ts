import { createClient } from "@supabase/supabase-js";
import { getPlanTier } from "@/lib/utils/catalogo-utils";
import type { CatalogoPublicoData, CatalogoProduct, CatalogoVariant } from "@/lib/types/catalogo";

// Cliente con service role (bypasa RLS) o anon como fallback
function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  console.log("[catalogo-publico] createPublicClient keyUsed:", serviceKey ? "service_role" : "anon");
  return createClient(url, key, { auth: { persistSession: false } });
}

// =====================================================
// getCatalogoPublico
// Obtiene datos públicos del catálogo usando el cliente anónimo.
// Las políticas RLS permiten lectura pública de catalog_settings
// (is_active=true) y products (published=true).
// Retorna null si el catálogo no existe, está inactivo
// o la suscripción está vencida.
// =====================================================
export async function getCatalogoPublico(
  slug: string
): Promise<CatalogoPublicoData | null> {
  try {
  const supabase = createPublicClient();

  // 1. Obtener empresa por slug
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (companyError || !company) {
    console.error("[catalogo-publico] Empresa no encontrada para slug:", slug, companyError?.message);
    return null;
  }

  // 2. Verificar suscripción activa
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("status, plans(name)")
    .eq("company_id", company.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log("[catalogo-publico] subscription check:", { found: !!subscription, error: subError?.message ?? null });

  if (!subscription) {
    console.error("[catalogo-publico] Sin suscripción activa para company_id:", company.id, subError?.message);
    return null;
  }

  // 3. Verificar catálogo activo
  const { data: settings, error: settingsError } = await supabase
    .from("catalog_settings")
    .select("*")
    .eq("company_id", company.id)
    .maybeSingle();

  console.log("[catalogo-publico] settings check:", { found: !!settings, is_active: settings?.is_active, error: settingsError?.message ?? null });

  if (!settings?.is_active) {
    console.error("[catalogo-publico] Catálogo inactivo o sin configuración para company_id:", company.id, settingsError?.message);
    return null;
  }

  // 4. Obtener productos publicados con variantes
  // Primero verificamos todos los productos de esta empresa
  const { data: allProducts, error: allProductsError } = await supabase
    .from("products")
    .select("id, name, published, is_active")
    .eq("company_id", company.id);
  
  console.log("[v0] All products for company:", { 
    company_id: company.id, 
    count: allProducts?.length ?? 0, 
    products: allProducts?.map(p => ({ name: p.name, published: p.published, is_active: p.is_active })),
    error: allProductsError?.message ?? null 
  });

  const { data: rawProducts, error: rawProductsError } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      currency,
      image_url,
      stock_quantity,
      product_variants(id, variant_name, price, stock_quantity, is_active)
    `)
    .eq("company_id", company.id)
    .eq("published", true)
    .eq("is_active", true)
    .order("name");

  console.log("[v0] Filtered products query:", { count: rawProducts?.length ?? 0, error: rawProductsError?.message ?? null });

  const products: CatalogoProduct[] = (rawProducts ?? []).map((p: any) => {
    const activeVariants: CatalogoVariant[] = (p.product_variants ?? [])
      .filter((v: any) => v.is_active)
      .map((v: any) => ({
        id: v.id,
        variant_name: v.variant_name,
        price: v.price ?? null,
        stock_quantity: v.stock_quantity ?? 0,
      }));

    return {
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      price: p.price ?? 0,
      currency: p.currency ?? "ARS",
      image_url: p.image_url ?? null,
      stock_quantity: p.stock_quantity ?? 0,
      has_variants: activeVariants.length > 0,
      variants: activeVariants,
    };
  });

  // 5. Contar pedidos del mes (para límite Pro)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: ordersThisMonth } = await supabase
    .from("online_orders")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company.id)
    .neq("status", "rechazado")
    .gte("created_at", startOfMonth.toISOString());

  const planName = (subscription.plans as any)?.name ?? "";
  const planTier = getPlanTier(planName);

  console.log("[catalogo-publico] Returning data:", {
    slug,
    companyId: company.id,
    productsCount: products.length,
    planName,
    planTier,
    isActive: settings.is_active,
  });

  return {
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo_url: company.logo_url ?? null,
    },
    settings: {
      id: settings.id,
      company_id: settings.company_id,
      is_active: settings.is_active,
      primary_color: settings.primary_color ?? "#3B82F6",
      logo_url: settings.logo_url ?? null,
      created_at: settings.created_at,
      updated_at: settings.updated_at,
    },
    products,
    plan_tier: planTier,
    orders_this_month: ordersThisMonth ?? 0,
  };
  } catch (err) {
    console.error("[catalogo-publico] Error inesperado:", err);
    return null;
  }
}
