"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TRIAL_DAYS = 14;

async function ensureCompanyUserMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId: string,
) {
  const { data: existing, error: existingError } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .limit(1)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    console.error("Error checking company_users membership:", existingError);
    return;
  }

  if (existing) return;

  const { error: insertError } = await supabase.from("company_users").insert({
    company_id: companyId,
    user_id: userId,
    role: null,
  });

  if (insertError) {
    console.error("Error creating company_users membership:", insertError);
  }
}

export async function ensureTrialSubscription(companyId?: string | null) {
  if (!companyId) return null;

  const supabase = await createClient();
  const adminClient = createAdminClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      await ensureCompanyUserMembership(supabase, user.id, companyId);
    }

    // Verificar si existe CUALQUIER suscripción (incluyendo canceladas)
    const { data: anySubscription, error: anySubError } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (anySubError && anySubError.code !== "PGRST116") {
      console.error("Error checking any subscription:", anySubError);
      return null;
    }

    // Si existe una suscripción (activa, cancelada, etc.), no crear otra
    if (anySubscription) {
      // Solo retornar si está activa o pendiente
      if (anySubscription.status === "active" || anySubscription.status === "pending") {
        return anySubscription;
      }
      // Si está cancelada, no crear nueva suscripción
      return null;
    }

    // Solo crear Trial si NO existe ninguna suscripción previa
    const trialPlan = await findTrialPlan(supabase);
    if (!trialPlan) return null;

    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + TRIAL_DAYS);

    // Use admin client to bypass RLS when creating subscription
    if (!adminClient) {
      console.error("Admin client not available");
      return null;
    }

    const { data: created, error: insertError } = await adminClient
      .from("subscriptions")
      .insert({
        company_id: companyId,
        plan_id: trialPlan.id,
        status: "active",
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        mp_subscription_id: null,
        cancel_at_period_end: false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating trial subscription:", insertError);
      return null;
    }

    return created;
  } catch (error) {
    console.error("Error ensuring trial subscription:", error);
    return null;
  }
}

async function findTrialPlan(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: byName, error: byNameError } = await supabase
    .from("plans")
    .select("id")
    .eq("is_active", true)
    .ilike("name", "trial")
    .limit(1)
    .single();

  if (byNameError && byNameError.code !== "PGRST116") {
    console.error("Error searching trial plan by name:", byNameError);
  }

  if (byName) return byName;

  const { data: byPrice, error: byPriceError } = await supabase
    .from("plans")
    .select("id")
    .eq("is_active", true)
    .eq("price", 0)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  if (byPriceError && byPriceError.code !== "PGRST116") {
    console.error("Error searching trial plan by price:", byPriceError);
    return null;
  }

  if (!byPrice) {
    console.error("No active trial plan found (name=trial or price=0)." );
  }

  return byPrice || null;
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient();

  try {
    // Verificar que el usuario tenga permisos
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Obtener el perfil del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { error: "Solo los administradores pueden cancelar suscripciones" };
    }

    // Verificar que la suscripción pertenece a la empresa del usuario
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("company_id, plan_id, status")
      .eq("id", subscriptionId)
      .single();

    if (!subscription || subscription.company_id !== profile.company_id) {
      return { error: "Suscripción no encontrada" };
    }

    if (subscription.status === "cancelled") {
      return { error: "La suscripción ya está cancelada" };
    }

    // Cancelar la suscripción
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("Error cancelling subscription:", updateError);
      return { error: "Error al cancelar la suscripción" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in cancelSubscription:", error);
    return { error: "Error al cancelar la suscripción" };
  }
}

/**
 * Verifica si un email ya usó el período Trial
 */
export async function checkTrialAlreadyUsed(email: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .rpc("check_trial_already_used", { p_email: email });

    if (error) {
      console.error("Error checking trial usage:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Error in checkTrialAlreadyUsed:", error);
    return false;
  }
}
