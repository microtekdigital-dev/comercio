import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/users";
import { getCompanySubscription } from "@/lib/actions/plans";
import { SubscriptionGuard } from "@/components/dashboard/subscription-guard";
import { Toaster } from "sonner";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  let subscriptionStatus: string | null = null;

  if (profile?.company_id) {
    const subscription = await getCompanySubscription(profile.company_id);
    if (subscription) {
      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null;
      const now = new Date();
      if (subscription.status === "active" && periodEnd && periodEnd <= now) {
        subscriptionStatus = "expired";
      } else {
        subscriptionStatus = subscription.status;
      }
    }
  }

  return (
    <SubscriptionGuard
      subscriptionStatus={subscriptionStatus}
      userRole={profile?.role || null}
    >
      {/* Full screen — no sidebar, no header */}
      <div className="h-screen w-screen overflow-hidden bg-[#d4d0c8]">
        {children}
      </div>
      <Toaster position="top-right" richColors />
    </SubscriptionGuard>
  );
}
