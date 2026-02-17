import { getCurrentUser } from "@/lib/actions/users";
import { 
  canAccessPurchaseOrders, 
  canAccessSuppliers,
  canAccessStockHistory,
  canAccessPriceHistory,
  canAccessCashRegister,
  canAccessInventoryLiquidation,
  canAccessAccountsSettlement
} from "@/lib/utils/plan-limits";
import { DashboardSidebar } from "./sidebar";
import type { FeaturePermission } from "@/lib/types/plans";

// Deshabilitar caché para que los permisos se actualicen inmediatamente
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DashboardSidebarServer() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  // Evaluar permisos para TODAS las funcionalidades
  const permissions = {
    purchaseOrders: user.company_id 
      ? await canAccessPurchaseOrders(user.company_id)
      : { allowed: false, requiredPlan: "Básico", message: "Las órdenes de compra están disponibles en el plan Básico o superior." },
    suppliers: user.company_id 
      ? await canAccessSuppliers(user.company_id)
      : { allowed: false, requiredPlan: "Básico", message: "La gestión de proveedores está disponible en el plan Básico o superior." },
    stockHistory: user.company_id
      ? await canAccessStockHistory(user.company_id)
      : { allowed: false, requiredPlan: "Básico", message: "El historial de stock está disponible en planes de pago." },
    priceHistory: user.company_id
      ? await canAccessPriceHistory(user.company_id)
      : { allowed: false, requiredPlan: "Básico", message: "El historial de precios está disponible en planes de pago." },
    cashRegister: user.company_id
      ? await canAccessCashRegister(user.company_id)
      : { allowed: false, requiredPlan: "Básico", message: "El cierre de caja está disponible en planes de pago." },
    inventoryLiquidation: user.company_id
      ? await canAccessInventoryLiquidation(user.company_id)
      : { allowed: false, requiredPlan: "Profesional", message: "La liquidación de inventario está disponible en el plan Profesional o superior." },
    accountsSettlement: user.company_id
      ? await canAccessAccountsSettlement(user.company_id)
      : { allowed: false, requiredPlan: "Profesional", message: "La liquidación de cuentas está disponible en el plan Profesional o superior." },
  };

  // Serializar los datos para evitar problemas de hidratación
  const serializedUser = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    companies: user.companies ? {
      id: user.companies.id,
      name: user.companies.name,
      slug: user.companies.slug,
    } : null,
  };

  return (
    <DashboardSidebar 
      user={serializedUser} 
      permissions={permissions}
    />
  );
}
