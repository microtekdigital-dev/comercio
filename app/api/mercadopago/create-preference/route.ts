import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPaymentPreference } from "@/lib/mercadopago/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get request body
    const { planId } = await request.json();
    
    if (!planId) {
      return NextResponse.json({ error: "Plan ID requerido" }, { status: 400 });
    }

    // Get user's profile/company
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: "No se encontró la empresa del usuario" },
        { status: 404 }
      );
    }

    // Only admins and owners can purchase plans
    if (!["owner", "admin"].includes(profile.role || "")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const price = Number(plan.price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const baseUrl = request.nextUrl.origin;

    // Create MercadoPago preference
    const preference = await createPaymentPreference({
      planId: plan.id,
      planName: plan.name,
      planDescription: plan.description || `Suscripción al plan ${plan.name}`,
      price,
      currency: plan.currency,
      companyId: profile.company_id,
      userId: user.id,
      userEmail: user.email || "",
      baseUrl,
    });

    // Record the payment attempt
    await supabase.from("payments").insert({
      company_id: profile.company_id,
      plan_id: planId,
      mp_preference_id: preference.id,
      amount: plan.price,
      currency: plan.currency,
      status: "pending",
      payment_type: "one_time",
      external_reference: preference.external_reference,
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });
  } catch (error) {
    console.error("Error creating preference:", error);
    const message =
      error instanceof Error && error.message.includes("access token")
        ? "MercadoPago no está configurado"
        : "Error al crear la preferencia de pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
