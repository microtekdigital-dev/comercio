"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { canAccessAdvancedReports, canAccessCompleteReports, canAccessSuppliers, canAccessPurchaseOrders, canExportToExcel } from "@/lib/utils/plan-limits";
import { BasicReports } from "@/components/dashboard/analytics/basic-reports";
import { AdvancedReports } from "@/components/dashboard/analytics/advanced-reports";
import { CompleteReports } from "@/components/dashboard/analytics/complete-reports";
import { UpgradePrompt } from "@/components/dashboard/analytics/upgrade-prompt";
import { Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState("Básico");
  const [hasAdvancedAccess, setHasAdvancedAccess] = useState(false);
  const [hasCompleteAccess, setHasCompleteAccess] = useState(false);
  const [hasSupplierAccess, setHasSupplierAccess] = useState(false);
  const [hasPurchaseOrderAccess, setHasPurchaseOrderAccess] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [advancedMessage, setAdvancedMessage] = useState("");
  const [completeMessage, setCompleteMessage] = useState("");

  useEffect(() => {
    const check = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
        if (!profile?.company_id) return;
        setCompanyId(profile.company_id);
        const [adv, comp, sup, po, exp] = await Promise.all([
          canAccessAdvancedReports(profile.company_id),
          canAccessCompleteReports(profile.company_id),
          canAccessSuppliers(profile.company_id),
          canAccessPurchaseOrders(profile.company_id),
          canExportToExcel(profile.company_id),
        ]);
        setHasAdvancedAccess(adv.allowed);
        setHasCompleteAccess(comp.allowed);
        setHasSupplierAccess(sup.allowed);
        setHasPurchaseOrderAccess(po.allowed);
        setCanExport(exp.allowed);
        setAdvancedMessage(adv.message || "");
        setCompleteMessage(comp.message || "");
        setCurrentPlan(comp.allowed ? "Empresarial" : adv.allowed ? "Pro" : "Básico");
      } finally { setLoading(false); }
    };
    check();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando reportes...
      </div>
    );
  }

  return (
    <div className="space-y-4 text-black">
      {/* Header */}
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">📊 Analítica y Reportes</span>
          <span className="text-blue-200 text-xs">Plan: {currentPlan}</span>
        </div>
      </div>

      {/* Basic Reports */}
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">📈 Reportes Básicos</span>
        </div>
        <div className="bg-[#d4d0c8] p-3">
          <BasicReports canExport={canExport} />
        </div>
      </div>

      {/* Advanced Reports */}
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">📉 Reportes Avanzados</span>
        </div>
        <div className="bg-[#d4d0c8] p-3">
          {hasAdvancedAccess ? (
            <AdvancedReports hasSupplierAccess={hasSupplierAccess} hasPurchaseOrderAccess={hasPurchaseOrderAccess} />
          ) : (
            <UpgradePrompt currentPlan={currentPlan} requiredPlan="Pro" featureName="Reportes Avanzados" message={advancedMessage} />
          )}
        </div>
      </div>

      {/* Complete Reports */}
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1">
          <span className="text-white text-sm font-bold">📋 Reportes Completos</span>
        </div>
        <div className="bg-[#d4d0c8] p-3">
          {hasCompleteAccess ? (
            <CompleteReports />
          ) : (
            <UpgradePrompt currentPlan={currentPlan} requiredPlan="Empresarial" featureName="Reportes Completos" message={completeMessage} />
          )}
        </div>
      </div>
    </div>
  );
}
