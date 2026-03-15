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

  // Productos
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, published, is_active")
    .eq("company_id", company.id)
    .eq("published", true)
    .eq("is_active", true);

  // Todos los productos (sin filtro published)
  const { data: allProducts, error: allError } = await supabase
    .from("products")
    .select("id, name, published, is_active")
    .eq("company_id", company.id);

  return NextResponse.json({
    keyUsed,
    company,
    publishedProducts: products ?? [],
    publishedCount: products?.length ?? 0,
    allProducts: allProducts ?? [],
    allCount: allProducts?.length ?? 0,
    errors: { productsError, allError },
  });
}
