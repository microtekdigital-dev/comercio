import { getCurrentUser } from "@/lib/actions/users";
import { canAccessPurchaseOrders, canAccessSuppliers } from "@/lib/utils/plan-limits";
import { DashboardSidebar } from "./sidebar";

// Deshabilitar caché para que los permisos se actualicen inmediatamente
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DashboardSidebarServer() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  // Verificar acceso a funcionalidades premium
  const canSeePurchaseOrders = user.company_id 
    ? (await canAccessPurchaseOrders(user.company_id)).allowed 
    : false;
    
  const canSeeSuppliers = user.company_id 
    ? (await canAccessSuppliers(user.company_id)).allowed 
    : false;

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
      canSeePurchaseOrders={canSeePurchaseOrders}
      canSeeSuppliers={canSeeSuppliers}
    />
  );
}
