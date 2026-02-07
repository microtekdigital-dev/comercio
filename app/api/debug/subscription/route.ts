import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role, email")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: "No se encontró la empresa" }, { status: 404 });
    }

    // Get ALL subscriptions for this company
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("id, status, created_at, updated_at, current_period_start, current_period_end, cancel_at_period_end, plan:plans(name, price)")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    // Get the most recent subscription
    const { data: latestSubscription } = await supabase
      .from("subscriptions")
      .select("id, status, created_at, updated_at, plan:plans(name, price)")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        company_id: profile.company_id,
        role: profile.role,
        email: profile.email,
      },
      subscriptions: {
        total: subscriptions?.length || 0,
        all: subscriptions || [],
        latest: latestSubscription || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
