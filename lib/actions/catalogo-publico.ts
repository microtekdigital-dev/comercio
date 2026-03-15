import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getPlanTier } from "@/lib/utils/catalogo-utils";
import type { CatalogoPublicoData, CatalogoProduct, CatalogoVariant } from "@/lib/types/catalogo";

// Usa service_role para bypasear RLS en el catálogo público.
// Corre SOLO en el servidor (Server Component / Route Handler).
function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("[catalogo-publico] NEXT_PUBLIC_SUPABASE_URL no definida");

  const key = serviceKey ?? anonKey;
  if (!key) throw new Error("[catalogo-publico] No hay Supabase key disponible");

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getCatalogoPublico(
  slug: string
): Promise<CatalogoPublicoData | null> {
  let supabase: SupabaseClient;

  try {
    supabase = createServiceClient();
  } catch (err) {
    console.error("[catalogo-publico] Error creando cliente:", err);
    return null;
  }

  try {
    // 1. Empresa por slug
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, slug, logo_url")
      .eq("slug", slug)
      .maybeSingle();

    if (companyError) {
      console.error("[catalogo-publico] Error buscando empresa:", companyError.message);
      return null;
    }
    if (!company) {
      console.error("[catalogo-publico] Empresa no encontrada para slug:", slug);
      return null;
    }

    // 2. Suscripción activa
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, status, plans(name)")
      .eq("company_id", company.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("[catalogo-publico] Error buscando suscripción:", subError.message);
    }

    if (!subscription) {
      console.error("[catalogo-publico] Sin suscripción activa para company_id:", company.id);
      return null;
    }

    // 3. Catálogo activo
    const { data: settings, error: settingsError } = await supabase
      .from("catalog_settings")
      .select("*")
      .eq("company_id", company.id)
      .maybeSingle();

    if (settingsError) {
      console.error("[catalogo-publico] Error buscando catalog_settings:", settingsError.message);
    }

    if (!settings?.is_active) {
      console.error("[catalogo-publico] Catálogo inactivo o sin configuración para company_id:", company.id);
      return null;
    }

    // 4. Productos publicados con variantes
    const { data: rawProducts, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        currency,
        image_url,
        stock_quantity,
        product_variants(id, variant_name, stock_quantity, is_active)
      `)
      .eq("company_id", company.id)
      .eq("published", true)
      .eq("is_active", true)
      .order("name");

    if (productsError) {
      console.error("[catalogo-publico] Error buscando productos:", productsError.message);
    }

    const products: CatalogoProduct[] = (rawProducts ?? []).map((p: any) => {
      const activeVariants: CatalogoVariant[] = (p.product_variants ?? [])
        .filter((v: any) => v.is_active)
        .map((v: any) => ({
          id: v.id,
          variant_name: v.variant_name,
          price: null, // columna price no existe en product_variants hasta migración 204
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

    // 5. Pedidos del mes
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
