import { getCurrentUser } from "@/lib/actions/users";
import { canAccessPurchaseOrders, canAccessSuppliers } from "@/lib/utils/plan-limits";
import { DashboardSidebar } from "./sidebar";

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

  return (
    <DashboardSidebar 
      user={user} 
      canSeePurchaseOrders={canSeePurchaseOrders}
      canSeeSuppliers={canSeeSuppliers}
    />
  );
}
