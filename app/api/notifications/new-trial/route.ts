import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNewSubscriptionNotification } from "@/lib/email/resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const { company_id } = await request.json();

    if (!company_id) {
      return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
    }

    // Get company details
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", company_id)
      .single();

    // Get admin user details
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, id")
      .eq("company_id", company_id)
      .eq("role", "admin")
      .single();

    if (profile && company) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      
      if (authUser?.user?.email) {
        await sendNewSubscriptionNotification(
          authUser.user.email,
          profile.full_name || "Usuario",
          company.name || "Empresa",
          "Trial - 14 días",
          true // Is a trial
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending trial notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
