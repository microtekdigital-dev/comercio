"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  canAccessAdvancedReports,
  canAccessCompleteReports,
  canAccessSuppliers,
  canAccessPurchaseOrders,
} from "@/lib/utils/plan-limits";
import { BasicReports } from "@/components/dashboard/analytics/basic-reports";
import { AdvancedReports } from "@/components/dashboard/analytics/advanced-reports";
import { CompleteReports } from "@/components/dashboard/analytics/complete-reports";
import { UpgradePrompt } from "@/components/dashboard/analytics/upgrade-prompt";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState("Básico");
  const [hasAdvancedAccess, setHasAdvancedAccess] = useState(false);
  const [hasCompleteAccess, setHasCompleteAccess] = useState(false);
  const [hasSupplierAccess, setHasSupplierAccess] = useState(false);
  const [hasPurchaseOrderAccess, setHasPurchaseOrderAccess] = useState(false);
  const [advancedMessage, setAdvancedMessage] = useState("");
  const [completeMessage, setCompleteMessage] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      setCompanyId(profile.company_id);

      // Check all access levels
      const [advancedAccess, completeAccess, supplierAccess, poAccess] = await Promise.all([
        canAccessAdvancedReports(profile.company_id),
        canAccessCompleteReports(profile.company_id),
        canAccessSuppliers(profile.company_id),
        canAccessPurchaseOrders(profile.company_id),
      ]);

      setHasAdvancedAccess(advancedAccess.allowed);
      setHasCompleteAccess(completeAccess.allowed);
      setHasSupplierAccess(supplierAccess.allowed);
      setHasPurchaseOrderAccess(poAccess.allowed);
      setAdvancedMessage(advancedAccess.message || "");
      setCompleteMessage(completeAccess.message || "");

      // Determine current plan based on access
      if (completeAccess.allowed) {
        setCurrentPlan("Empresarial");
      } else if (advancedAccess.allowed) {
        setCurrentPlan("Pro");
      } else {
        setCurrentPlan("Básico");
      }
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Analítica y Reportes</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Análisis detallado de tu negocio • Plan actual: <span className="font-semibold">{currentPlan}</span>
        </p>
      </div>

      {/* Basic Reports - Always visible */}
      <BasicReports />

      <Separator className="my-8" />

      {/* Advanced Reports - Conditional */}
      {hasAdvancedAccess ? (
        <AdvancedReports
          hasSupplierAccess={hasSupplierAccess}
          hasPurchaseOrderAccess={hasPurchaseOrderAccess}
        />
      ) : (
        <UpgradePrompt
          currentPlan={currentPlan}
          requiredPlan="Pro"
          featureName="Reportes Avanzados"
          message={advancedMessage}
        />
      )}

      <Separator className="my-8" />

      {/* Complete Reports - Conditional */}
      {hasCompleteAccess ? (
        <CompleteReports />
      ) : (
        <UpgradePrompt
          currentPlan={currentPlan}
          requiredPlan="Empresarial"
          featureName="Reportes Completos"
          message={completeMessage}
        />
      )}
    </div>
  );
}
