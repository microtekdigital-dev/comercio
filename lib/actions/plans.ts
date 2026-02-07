"use server";

import { createClient } from "@/lib/supabase/server";
import { createPaymentPreference } from "@/lib/mercadopago/client";
import { Profile } from "@/lib/types";

// ------------------------
// Tipos
// ------------------------
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  interval_count: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  mp_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  plan?: Plan;
}

export interface SubscriptionSummary {
  id: string;
  plan: Plan | null;
  status: string;
  isTrial: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface PlanWithActive extends Plan {
  isActivePlan: boolean;
}

export interface BillingSummary {
  subscription: SubscriptionSummary | null;
  plans: PlanWithActive[];
  hasUsedTrial: boolean;
}

export interface PaymentRecord {
  id: string;
  subscription_id: string | null;
  company_id: string;
  plan_id: string | null;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_type: string | null;
  external_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

async function ensureCompanyUserMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId: string,
  role?: string | null,
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
    role: role ?? null,
  });

  if (insertError) {
    console.error("Error creating company_users membership:", insertError);
  }
}

// ------------------------
// Fetch all active plans
// ------------------------
export async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching plans:", err);
    return [];
  }
}

// ------------------------
// Get current subscription summary and active plans
// ------------------------
export async function getCompanySubscriptionAndPlans(): Promise<BillingSummary> {
  const supabase = await createClient();

  console.log("=== DEBUG: getCompanySubscriptionAndPlans START ===");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("User:", user?.id, "Error:", userError);

  if (userError || !user) {
    console.log("No user found, returning empty");
    return { subscription: null, plans: [], hasUsedTrial: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  console.log("Profile:", profile, "Error:", profileError);

  if (profileError || !profile?.company_id) {
    console.log("No profile or company_id, returning empty");
    return { subscription: null, plans: [], hasUsedTrial: false };
  }

  await ensureCompanyUserMembership(
    supabase,
    user.id,
    profile.company_id,
    profile.role,
  );

  // Check for existing subscription
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_start, current_period_end, cancel_at_period_end, plan:plans(*)")
    .eq("company_id", profile.company_id)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (subscriptionError && subscriptionError.code !== "PGRST116") {
    console.error("Error fetching subscription:", subscriptionError);
  }

  // If no subscription exists, auto-activate trial
  if (!subscriptionData) {
    console.log("No subscription found, attempting to activate trial...");
    await activateTrialForCompany(supabase, profile.company_id);
    
    // Re-fetch subscription after trial activation
    const { data: newSubscriptionData } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_start, current_period_end, cancel_at_period_end, plan:plans(*)")
      .eq("company_id", profile.company_id)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (newSubscriptionData) {
      return buildBillingSummary(supabase, newSubscriptionData, profile.company_id);
    }
  }

  return buildBillingSummary(supabase, subscriptionData, profile.company_id);
}

async function activateTrialForCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
) {
  try {
    // Find trial plan (price = 0)
    const { data: trialPlan } = await supabase
      .from("plans")
      .select("id, interval, interval_count")
      .eq("is_active", true)
      .eq("price", 0)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();

    if (!trialPlan) {
      console.log("No trial plan found");
      return;
    }

    const periodStart = new Date();
    const periodEnd = new Date();
    const intervalCount = Math.max(Number(trialPlan.interval_count) || 14, 1);
    
    if (trialPlan.interval === "year") {
      periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount);
    } else if (trialPlan.interval === "month") {
      periodEnd.setMonth(periodEnd.getMonth() + intervalCount);
    } else {
      // Default to days
      periodEnd.setDate(periodEnd.getDate() + intervalCount);
    }

    // Create trial subscription
    const { data: newSub, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        company_id: companyId,
        plan_id: trialPlan.id,
        status: "active",
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      })
      .select()
      .single();

    if (subError) {
      console.error("Error creating trial subscription:", subError);
    } else {
      console.log("Trial subscription created:", newSub.id);
    }
  } catch (error) {
    console.error("Error in activateTrialForCompany:", error);
  }
}

async function buildBillingSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subscriptionData: any,
  companyId: string
): Promise<BillingSummary> {
  const planData = subscriptionData?.plan;
  const isTrial = planData
    ? (Array.isArray(planData) 
        ? (planData[0] && Number(planData[0].price) === 0)
        : Number((planData as any).price) === 0)
    : false;

  const isActiveOrTrial = subscriptionData
    ? ["active", "pending"].includes(subscriptionData.status)
    : false;

  const subscription: SubscriptionSummary | null = subscriptionData
    ? {
        id: subscriptionData.id,
        plan: Array.isArray(subscriptionData.plan) ? subscriptionData.plan[0] ?? null : subscriptionData.plan,
        status: isActiveOrTrial ? "activado" : subscriptionData.status,
        isTrial,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        cancel_at_period_end: subscriptionData.cancel_at_period_end ?? false,
      }
    : null;

  const { data: plansData, error: plansError } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  console.log("Plans query result:");
  console.log("- Data:", plansData);
  console.log("- Error:", plansError);
  console.log("- Count:", plansData?.length || 0);

  if (plansError) {
    console.error("Error fetching plans:", plansError);
  }

  const activePlanId =
    subscription && isActiveOrTrial && subscription.plan
      ? subscription.plan.id
      : null;

  const plans: PlanWithActive[] = (plansData || []).map((plan) => ({
    ...plan,
    isActivePlan: activePlanId === plan.id,
  }));

  console.log("Final result:");
  console.log("- Plans count:", plans.length);
  console.log("- Subscription:", subscription ? "exists" : "null");
  console.log("- Active plan ID:", activePlanId);
  console.log("=== DEBUG: getCompanySubscriptionAndPlans END ===");

  return { subscription, plans, hasUsedTrial: false };
}

// ------------------------
// Get current subscription for a company
// ------------------------
export async function getCompanySubscription(companyId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      await ensureCompanyUserMembership(supabase, user.id, companyId, null);
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("company_id", companyId)
      .in("status", ["active", "pending", "trialing", "trial"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch (err) {
    console.error("Error fetching subscription:", err);
    return null;
  }
}

// ------------------------
// Get payment history for a company
// ------------------------
export async function getCompanyPayments(companyId: string): Promise<PaymentRecord[]> {
  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      await ensureCompanyUserMembership(supabase, user.id, companyId, null);
    }

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching payments:", err);
    return [];
  }
}

// ------------------------
// Create a payment preference for a plan
// ------------------------
export async function createPlanPayment(planId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return { error: "No autenticado" };

  // ------------------------
  // Get user's profile
  // ------------------------
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return { error: "No se encontró el perfil del usuario" };
  }

  let profile: Profile = profileData;

  // ------------------------
  // Create company if missing
  // ------------------------
  if (!profile.company_id) {
    const { data: newCompany, error: newCompanyError } = await supabase
      .from("companies")
      .insert({ name: `Empresa de ${user.email ?? "Usuario"}` })
      .select("id")
      .single();

    if (newCompanyError || !newCompany?.id)
      return { error: "No se pudo crear la empresa automáticamente" };

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ company_id: newCompany.id })
      .eq("id", user.id);

    if (updateProfileError) return { error: "No se pudo asignar la empresa al perfil del usuario" };

    profile.company_id = newCompany.id;
  }

  // ------------------------
  // Null-safe variables
  // ------------------------
  const companyId: string = profile.company_id!; // TS ya sabe que no es null
  const userEmail: string = user.email ?? "";    // fallback seguro

  // ------------------------
  // Check role
  // ------------------------
  if (!["owner", "admin"].includes(profile.role ?? "")) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  // ------------------------
  // Get plan details
  // ------------------------
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (planError || !plan) return { error: "Plan no encontrado" };

  // ------------------------
  // Create MercadoPago preference
  // ------------------------
  try {
    const preference = await createPaymentPreference({
      planId: plan.id,
      planName: plan.name,
      planDescription: plan.description || `Suscripción al plan ${plan.name}`,
      price: Number(plan.price),
      currency: plan.currency,
      companyId,
      userId: user.id,
      userEmail,
    });

    // ------------------------
    // Record payment in DB
    // ------------------------
    await supabase.from("payments").insert({
      company_id: companyId,
      plan_id: planId,
      mp_preference_id: preference.id,
      amount: plan.price,
      currency: plan.currency,
      status: "pending",
      payment_type: "one_time",
      external_reference: preference.external_reference,
    });

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    };
  } catch (err) {
    console.error("Error creating payment preference:", err);
    return { error: "Error al crear el pago. Intenta nuevamente." };
  }
}

// ------------------------
// Cancel subscription
// ------------------------
export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return { error: "No autenticado" };

  // ------------------------
  // Get profile
  // ------------------------
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData?.company_id) {
    return { error: "No se encontró la empresa del usuario" };
  }

  const profile: Profile = profileData;
  const companyId: string = profile.company_id!; // TS seguro que no es null

  // Only admins and owners can cancel subscriptions
  if (!["owner", "admin"].includes(profile.role ?? "")) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const now = new Date().toISOString();

  // Cancel subscription immediately
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at_period_end: false,
      current_period_end: now,
      updated_at: now,
    })
    .eq("id", subscriptionId)
    .eq("company_id", companyId);

  if (updateError) {
    console.error("Error cancelling subscription:", updateError);
    return { error: "Error al cancelar la suscripción" };
  }

  return { success: true };
}
