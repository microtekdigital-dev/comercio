"use server";

import { createClient } from "@/lib/supabase/server";
import { getCompanySubscription } from "@/lib/actions/plans";

// =====================================================
// POS Plan Restrictions
// Requirements: 8.1-8.7
// =====================================================

export interface POSPlanRestrictions {
  canUseOfflineMode: boolean;
  canAccessReports: boolean;
  maxCashRegisters: number; // -1 = ilimitado
  currentPlan: string;
  upgradeMessage?: string;
}

// Plan names as stored in the database
const PLAN_NAMES = {
  BASICO: "Básico",
  PROFESIONAL: "Profesional",
  EMPRESARIAL: "Empresarial",
} as const;

// Plan restrictions configuration
// Requirements: 8.1-8.6
const PLAN_RESTRICTIONS: Record<string, Omit<POSPlanRestrictions, "currentPlan" | "upgradeMessage">> = {
  [PLAN_NAMES.BASICO]: {
    canUseOfflineMode: false,   // Req 8.1: sin offline
    canAccessReports: false,    // Req 8.1: sin reportes avanzados
    maxCashRegisters: 1,        // Req 8.2: máximo 1 caja
  },
  [PLAN_NAMES.PROFESIONAL]: {
    canUseOfflineMode: false,   // Req 8.3: sin offline
    canAccessReports: true,     // Req 8.3: con reportes
    maxCashRegisters: 3,        // Req 8.4: máximo 3 cajas
  },
  [PLAN_NAMES.EMPRESARIAL]: {
    canUseOfflineMode: true,    // Req 8.5: con offline
    canAccessReports: true,     // Req 8.6: con reportes
    maxCashRegisters: -1,       // Req 8.6: ilimitado
  },
};

// Default restrictions when no plan is found (same as Básico)
const DEFAULT_RESTRICTIONS: Omit<POSPlanRestrictions, "currentPlan" | "upgradeMessage"> = {
  canUseOfflineMode: false,
  canAccessReports: false,
  maxCashRegisters: 1,
};

function getUpgradeMessage(planName: string): string | undefined {
  switch (planName) {
    case PLAN_NAMES.BASICO:
      return "Actualiza al plan Profesional para acceder a reportes avanzados y hasta 3 cajas registradoras, o al plan Empresarial para cajas ilimitadas y modo offline.";
    case PLAN_NAMES.PROFESIONAL:
      return "Actualiza al plan Empresarial para habilitar el modo offline y cajas registradoras ilimitadas.";
    default:
      return undefined;
  }
}

/**
 * Obtiene el companyId del usuario autenticado.
 */
async function getCurrentCompanyId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  return profile?.company_id ?? null;
}

/**
 * Obtiene las restricciones del POS según el plan de suscripción de la empresa.
 * Acepta un companyId explícito o lo resuelve desde el usuario autenticado.
 * Requirements: 8.1-8.7
 */
export async function checkPOSPlanRestrictions(
  companyId?: string
): Promise<POSPlanRestrictions> {
  const resolvedCompanyId = companyId ?? (await getCurrentCompanyId());

  if (!resolvedCompanyId) {
    return {
      ...DEFAULT_RESTRICTIONS,
      currentPlan: "Sin plan",
      upgradeMessage:
        "Activa un plan para acceder a todas las funcionalidades del POS.",
    };
  }

  const subscription = await getCompanySubscription(resolvedCompanyId);

  // No subscription or no plan data → apply default (Básico) restrictions
  if (!subscription || !subscription.plan) {
    return {
      ...DEFAULT_RESTRICTIONS,
      currentPlan: "Sin plan",
      upgradeMessage:
        "Activa un plan para acceder a todas las funcionalidades del POS.",
    };
  }
  const planName: string = subscription.plan.name;
  const restrictions = PLAN_RESTRICTIONS[planName] ?? DEFAULT_RESTRICTIONS;

  return {
    ...restrictions,
    currentPlan: planName,
    upgradeMessage: getUpgradeMessage(planName),
  };
}
