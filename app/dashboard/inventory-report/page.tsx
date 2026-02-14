import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InventoryLiquidationReport } from "@/components/dashboard/inventory-liquidation-report"
import { getCategories } from "@/lib/actions/categories"
import { getProducts } from "@/lib/actions/products"

export default async function InventoryReportPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's company
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile?.company_id) {
    redirect("/dashboard")
  }

  // Get company details
  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url, currency")
    .eq("id", profile.company_id)
    .single()

  // Get categories and products for filters
  const [categories, products] = await Promise.all([
    getCategories(profile.company_id),
    getProducts(profile.company_id),
  ])

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Liquidación de Inventario</h1>
        <p className="text-muted-foreground mt-2">
          Reporte contable de movimientos de inventario por período
        </p>
      </div>

      <InventoryLiquidationReport
        companyId={profile.company_id}
        companyName={company?.name || "Mi Empresa"}
        companyLogo={company?.logo_url || undefined}
        categories={categories}
        products={products}
        currency={company?.currency || "ARS"}
      />
    </div>
  )
}
