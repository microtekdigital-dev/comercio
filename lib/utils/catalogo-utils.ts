import type { PlanTier } from "@/lib/types/catalogo";

export function getPlanTier(planName: string): PlanTier {
  const name = planName.toLowerCase();
  if (name.includes("empresarial")) return "empresarial";
  if (name.includes("profesional")) return "profesional";
  return "basico";
}
