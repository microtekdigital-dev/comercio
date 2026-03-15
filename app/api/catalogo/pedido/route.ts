import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanTier } from "@/lib/utils/catalogo-utils";
import type { OnlineOrderItem } from "@/lib/types/catalogo";

interface PedidoPayload {
  slug: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_address?: string;
  visitor_notes?: string;
  items: Array<{
    product_id: string;
    variant_id?: string | null;
    quantity: number;
  }>;
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
  }

  let body: PedidoPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const { slug, visitor_name, visitor_phone, visitor_address, visitor_notes, items } = body;

  // Validación de campos obligatorios
  if (!visitor_name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  if (!visitor_phone?.trim()) {
    return NextResponse.json({ error: "El teléfono es obligatorio" }, { status: 400 });
  }
  if (!slug?.trim()) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  // 1. Obtener empresa por slug
  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Catálogo no encontrado" }, { status: 404 });
  }

  // 2. Verificar catálogo activo
  const { data: settings } = await supabase
    .from("catalog_settings")
    .select("is_active")
    .eq("company_id", company.id)
    .single();

  if (!settings?.is_active) {
    return NextResponse.json({ error: "El catálogo no está disponible" }, { status: 404 });
  }

  // 3. Verificar suscripción activa y plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plans(name)")
    .eq("company_id", company.id)
    .eq("status", "active")
    .single();

  if (!subscription) {
    return NextResponse.json({ error: "El catálogo no está disponible" }, { status: 404 });
  }

  const planName = (subscription.plans as any)?.name ?? "";
  const planTier = getPlanTier(planName);

  if (planTier === "basico") {
    return NextResponse.json(
      { error: "Los pedidos online no están disponibles en el plan actual" },
      { status: 403 }
    );
  }

  // 4. Verificar límite mensual para Plan Profesional
  if (planTier === "profesional") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("online_orders")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .neq("status", "rechazado")
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= 50) {
      return NextResponse.json(
        { error: "Los pedidos online están temporalmente deshabilitados este mes" },
        { status: 429 }
      );
    }
  }

  // 5. Verificar stock y construir snapshot de ítems
  const orderItems: OnlineOrderItem[] = [];
  let total = 0;

  for (const item of items) {
    if (item.variant_id) {
      // Producto con variante
      const { data: variant } = await supabase
        .from("product_variants")
        .select("id, variant_name, price, stock_quantity, product_id")
        .eq("id", item.variant_id)
        .single();

      if (!variant) {
        return NextResponse.json(
          { error: `Variante no encontrada` },
          { status: 409 }
        );
      }
      if ((variant.stock_quantity ?? 0) < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para la variante ${variant.variant_name}` },
          { status: 409 }
        );
      }

      const { data: product } = await supabase
        .from("products")
        .select("name, price")
        .eq("id", item.product_id)
        .single();

      const unitPrice = variant.price ?? product?.price ?? 0;
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      orderItems.push({
        product_id: item.product_id,
        product_name: product?.name ?? "",
        variant_id: variant.id,
        variant_name: variant.variant_name,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      });
    } else {
      // Producto sin variante
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity")
        .eq("id", item.product_id)
        .eq("company_id", company.id)
        .single();

      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado` },
          { status: 409 }
        );
      }
      if ((product.stock_quantity ?? 0) < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}` },
          { status: 409 }
        );
      }

      const unitPrice = product.price ?? 0;
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        variant_id: null,
        variant_name: null,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      });
    }
  }

  // 6. Generar número de pedido secuencial
  const { count: existingCount } = await supabase
    .from("online_orders")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company.id);

  const orderNumber = `PO-${String((existingCount ?? 0) + 1).padStart(4, "0")}`;

  // 7. Insertar pedido
  const { data: newOrder, error: insertError } = await supabase
    .from("online_orders")
    .insert({
      company_id: company.id,
      order_number: orderNumber,
      status: "pendiente",
      visitor_name: visitor_name.trim(),
      visitor_phone: visitor_phone.trim(),
      visitor_address: visitor_address?.trim() ?? null,
      visitor_notes: visitor_notes?.trim() ?? null,
      items: orderItems,
      subtotal: total,
      total,
      currency: "ARS",
    })
    .select("id")
    .single();

  if (insertError || !newOrder) {
    console.error("Error al crear pedido:", insertError);
    return NextResponse.json({ error: "Error al procesar el pedido" }, { status: 500 });
  }

  // 8. Crear notificación en el sistema existente
  await supabase.from("notifications").insert({
    company_id: company.id,
    type: "new_sale",
    title: "Nuevo pedido online",
    message: `${visitor_name.trim()} realizó el pedido ${orderNumber} por $${total.toFixed(2)}`,
    link: `/dashboard/catalogo`,
    priority: "normal",
    is_read: false,
  });

  return NextResponse.json({ success: true, order_number: orderNumber }, { status: 201 });
}
