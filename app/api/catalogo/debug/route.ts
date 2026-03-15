import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ruta temporal de debug — eliminar en producción
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "microtek";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const keyUsed = serviceKey ? "service_role" : "anon";

  const supabase = createClient(url, serviceKey ?? anonKey, {
    auth: { persistSession: false },
  });

  // Empresa
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada", slug, companyError, keyUsed });
  }

  // Suscripción (igual que la acción)
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("status, plans(name)")
    .eq("company_id", company.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Catálogo settings
  const { data: settings, error: settingsError } = await supabase
    .from("catalog_settings")
    .select("*")
    .eq("company_id", company.id)
    .maybeSingle();

  // Productos con variantes (igual que la acción)
  const { data: productsWithVariants, error: productsWithVariantsError } = await supabase
    .from("products")
    .select(`id, name, published, is_active, product_variants(id, variant_name, is_active)`)
    .eq("company_id", company.id)
    .eq("published", true)
    .eq("is_active", true)
    .order("name");

  // Productos sin join (control)
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, published, is_active")
    .eq("company_id", company.id)
    .eq("published", true)
    .eq("is_active", true);

  return NextResponse.json({
    keyUsed,
    company,
    subscription: subscription ?? null,
    subscriptionError: subError?.message ?? null,
    planName: (subscription?.plans as any)?.name ?? null,
    settings: settings ? { id: settings.id, is_active: settings.is_active } : null,
    settingsError: settingsError?.message ?? null,
    productsWithVariantsCount: productsWithVariants?.length ?? 0,
    productsWithVariantsError: productsWithVariantsError?.message ?? null,
    productsWithVariantsSample: productsWithVariants?.slice(0, 2) ?? [],
    publishedCount: products?.length ?? 0,
    errors: { productsError: productsError?.message ?? null },
  });
}
