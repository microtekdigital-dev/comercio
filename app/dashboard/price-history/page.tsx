import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/users"
import { canAccessPriceHistory } from "@/lib/utils/plan-limits"
import { createClient } from "@/lib/supabase/server"
import { getPriceChanges } from "@/lib/actions/price-changes"
import { PriceHistoryTable } from "@/components/dashboard/price-history-table"

export const metadata = {
  title: "Historial de Precios | Dashboard",
  description: "Historial completo de cambios de precios de productos",
}

export default async function PriceHistoryPage() {
  const user = await getCurrentUser()
  
  if (!user?.company_id) {
    redirect("/dashboard")
  }

  // Verificar permisos server-side
  const permission = await canAccessPriceHistory(user.company_id)
  
  if (!permission.allowed) {
    redirect("/dashboard?error=insufficient_permissions")
  }

  const supabase = await createClient()

  // Get all price changes
  const changes = await getPriceChanges()

  // Get employees for filter
  const { data: employees } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("company_id", user.company_id)
    .order("full_name")

  const employeesList = employees?.map(emp => ({
    id: emp.id,
    name: emp.full_name || emp.email
  })) || []

  // Get products for filter
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("company_id", user.company_id)
    .eq("is_active", true)
    .order("name")

  const productsList = products?.map(prod => ({
    id: prod.id,
    name: prod.name
  })) || []

  // Get company currency
  const { data: company } = await supabase
    .from("companies")
    .select("currency")
    .eq("id", user.company_id)
    .single()

  const currencySymbol = company?.currency === "USD" ? "$" : company?.currency === "EUR" ? "€" : "$"

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Historial de Precios</h2>
          <p className="text-muted-foreground">
            Registro completo de todos los cambios de precios de productos
          </p>
        </div>
      </div>

      <PriceHistoryTable 
        changes={changes}
        employees={employeesList}
        products={productsList}
        currencySymbol={currencySymbol}
      />
    </div>
  )
}
