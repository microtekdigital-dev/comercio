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

    const { data: existing, error: existingError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("company_id", companyId)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Error checking existing subscription:", existingError);
      return null;
    }

    if (existing) return existing;

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
