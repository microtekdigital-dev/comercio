"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Obtiene los límites del plan actual de la empresa
 */
export async function getCurrentPlanLimits(companyId: string) {
  const supabase = await createClient();

  try {
    // Obtener la suscripción activa de la empresa
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        id,
        plan:plans (
          id,
          name,
          max_users,
          max_products,
          features
        )
      `)
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      // Si no hay suscripción, retornar límites por defecto (plan básico)
      return {
        maxUsers: 3,
        maxProducts: 500,
        planName: "Básico",
        features: [],
      };
    }

    const plan = subscription.plan as any;

    return {
      maxUsers: plan.max_users || 3,
      maxProducts: plan.max_products || 500,
      planName: plan.name || "Básico",
      features: plan.features || [],
    };
  } catch (error) {
    console.error("Error getting plan limits:", error);
    return {
      maxUsers: 3,
      maxProducts: 500,
      planName: "Básico",
      features: [],
    };
  }
}

/**
 * Verifica si la empresa puede agregar más usuarios
 */
export async function canAddUser(companyId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxUsers: number;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    // Obtener límites del plan
    const limits = await getCurrentPlanLimits(companyId);

    // Contar usuarios actuales de la empresa
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (error) {
      console.error("Error counting users:", error);
      return {
        allowed: false,
        currentCount: 0,
        maxUsers: limits.maxUsers,
        message: "Error al verificar usuarios",
      };
    }

    const currentCount = count || 0;
    const allowed = currentCount < limits.maxUsers;

    return {
      allowed,
      currentCount,
      maxUsers: limits.maxUsers,
      message: allowed
        ? undefined
        : `Has alcanzado el límite de ${limits.maxUsers} usuarios de tu plan ${limits.planName}. Actualiza tu plan para agregar más usuarios.`,
    };
  } catch (error) {
    console.error("Error checking user limit:", error);
    return {
      allowed: false,
      currentCount: 0,
      maxUsers: 3,
      message: "Error al verificar límite de usuarios",
    };
  }
}

/**
 * Verifica si la empresa puede agregar más productos
 */
export async function canAddProduct(companyId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxProducts: number;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    // Obtener límites del plan
    const limits = await getCurrentPlanLimits(companyId);

    // Contar productos actuales de la empresa
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (error) {
      console.error("Error counting products:", error);
      return {
        allowed: false,
        currentCount: 0,
        maxProducts: limits.maxProducts,
        message: "Error al verificar productos",
      };
    }

    const currentCount = count || 0;
    const allowed = currentCount < limits.maxProducts;

    return {
      allowed,
      currentCount,
      maxProducts: limits.maxProducts,
      message: allowed
        ? undefined
        : `Has alcanzado el límite de ${limits.maxProducts} productos de tu plan ${limits.planName}. Actualiza tu plan para agregar más productos.`,
    };
  } catch (error) {
    console.error("Error checking product limit:", error);
    return {
      allowed: false,
      currentCount: 0,
      maxProducts: 500,
      message: "Error al verificar límite de productos",
    };
  }
}

/**
 * Verifica si una funcionalidad está disponible en el plan actual
 */
export async function hasFeature(
  companyId: string,
  featureName: string
): Promise<boolean> {
  const limits = await getCurrentPlanLimits(companyId);

  // Verificar si la funcionalidad está en la lista de features del plan
  const features = limits.features as string[];
  
  // Buscar la funcionalidad en el array de features
  const hasFeature = features.some((feature) =>
    feature.toLowerCase().includes(featureName.toLowerCase())
  );

  return hasFeature;
}

/**
 * Obtiene información de uso actual vs límites del plan
 */
export async function getPlanUsage(companyId: string) {
  const supabase = await createClient();

  try {
    const limits = await getCurrentPlanLimits(companyId);

    // Contar usuarios
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    // Contar productos
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    return {
      planName: limits.planName,
      users: {
        current: userCount || 0,
        max: limits.maxUsers,
        percentage: Math.round(((userCount || 0) / limits.maxUsers) * 100),
        remaining: limits.maxUsers - (userCount || 0),
      },
      products: {
        current: productCount || 0,
        max: limits.maxProducts,
        percentage: Math.round(((productCount || 0) / limits.maxProducts) * 100),
        remaining: limits.maxProducts - (productCount || 0),
      },
      features: limits.features,
    };
  } catch (error) {
    console.error("Error getting plan usage:", error);
    return null;
  }
}
