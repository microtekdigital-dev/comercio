"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentPreference } from "@/lib/mercadopago/client";
import { Profile } from "@/lib/types";

// ------------------------
// Types
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
  is_popular?: boolean;
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

// ------------------------
// Helper Functions
// ------------------------
async function ensureCompanyUserMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId: string,
  role?: string | null,
) {
  // CRITICAL: Use admin client to bypass RLS for system operations
  const adminClient = createAdminClient();
  
  if (!adminClient) {
    console.error("Admin client not available");
    return;
  }
  
  const { data: existing, error: existingError } = await adminClient
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

  const { error: insertError } = await adminClient.from("company_users").insert({
    company_id: companyId,
    user_id: userId,
    role: role ?? null,
  });

  if (insertError) {
    console.error("Error creating company_users membership:", insertError);
  }
}

// REMOVED: activateTrialForCompany function
// Trials are created ONLY by database trigger on user signup
// This function is no longer needed

async function buildBillingSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subscriptionData: any
): Promise<BillingSummary> {
  console.log("[buildBillingSummary] Building summary for subscription:", subscriptionData);
  
  const planData = subscriptionData?.plan;
  const isTrial = planData
    ? (Array.isArray(planData) 
        ? (planData[0] && Number(planData[0].price) === 0)
        : Number((planData as any).price) === 0)
    : false;

  // IMPORTANT: Only consider active or pending as "activado"
  // Cancelled subscriptions should show as "cancelled"
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

  console.log("[buildBillingSummary] Built subscription summary:", subscription);

  const { data: plansData, error: plansError } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

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

  // Check if trial was used: if there's a cancelled trial subscription
  const hasUsedTrial = subscriptionData && isTrial && subscriptionData.status === "cancelled";

  return { subscription, plans, hasUsedTrial };
}

// ------------------------
// Public Functions
// ------------------------

// Fetch all active plans
export async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true});

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching plans:", err);
    return [];
  }
}

// Get current subscription summary and active plans
export async function getCompanySubscriptionAndPlans(): Promise<BillingSummary> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { subscription: null, plans: [], hasUsedTrial: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    return { subscription: null, plans: [], hasUsedTrial: false };
  }

  await ensureCompanyUserMembership(
    supabase,
    user.id,
    profile.company_id,
    profile.role,
  );

  console.log("[getCompanySubscriptionAndPlans] Checking subscriptions for company:", profile.company_id);

  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_start, current_period_end, cancel_at_period_end, plan:plans(*)")
    .eq("company_id", profile.company_id)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  
  console.log("[getCompanySubscriptionAndPlans] Found subscription:", subscriptionData);

  if (subscriptionError && subscriptionError.code !== "PGRST116") {
    console.error("Error fetching subscription:", subscriptionError);
  }

  // ============================================================================
  // CRITICAL FIX: AUTO-TRIAL CREATION COMPLETELY DISABLED
  // Trials are ONLY created by database trigger on user signup
  // This prevents trial recreation after cancellation
  // ============================================================================
  if (!subscriptionData) {
    console.log("[getCompanySubscriptionAndPlans] No subscription found - AUTO-TRIAL DISABLED");
    
    // Get all plans
    const { data: plansData } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    
    const plans: PlanWithActive[] = (plansData || []).map((plan) => ({
      ...plan,
      isActivePlan: false,
    }));
    
    // Return empty state - user must select a plan
    return { subscription: null, plans, hasUsedTrial: false };
  }
  // ============================================================================
  
  console.log("[getCompanySubscriptionAndPlans] Subscription exists with status:", subscriptionData.status);

  // Return the existing subscription (even if cancelled)
  return buildBillingSummary(supabase, subscriptionData);
}

// Get current subscription for a company
export async function getCompanySubscription(companyId: string): Promise<Subscription | null> {
  // CRITICAL: Use admin client to bypass RLS for system queries
  const adminClient = createAdminClient();
  const supabase = await createClient();
  
  if (!adminClient) {
    console.error("Admin client not available");
    return null;
  }
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      await ensureCompanyUserMembership(supabase, user.id, companyId, null);
    }

    // CRITICAL FIX: Only fetch active or pending subscriptions
    // This prevents cancelled subscriptions from blocking access
    // Use admin client to bypass RLS
    const { data, error } = await adminClient
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("company_id", companyId)
      .in("status", ["active", "pending"])
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

// Get payment history for a company
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

// Create a payment preference for a plan
export async function createPlanPayment(planId: string) {
  const supabase = await createClient();

  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return { error: "No autenticado" };

  // Get user's profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return { error: "No se encontró el perfil del usuario" };
  }

  let profile: Profile = profileData;

  // Create company if missing
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

  // Null-safe variables
  const companyId: string = profile.company_id!;
  const userEmail: string = user.email ?? "";

  // Check role
  if (!["owner", "admin"].includes(profile.role ?? "")) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  // Get plan details
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (planError || !plan) return { error: "Plan no encontrado" };

  // Create MercadoPago preference
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

    // Record payment in DB
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
