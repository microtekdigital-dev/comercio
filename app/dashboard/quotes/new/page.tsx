import { redirect } from "next/navigation"
import { getCustomers } from "@/lib/actions/customers"
import { getProducts } from "@/lib/actions/products"
import QuoteForm from "./quote-form"

export default async function NewQuotePage() {
  const [customers, products] = await Promise.all([
    getCustomers(),
    getProducts(),
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Presupuesto</h1>
        <p className="text-muted-foreground">Crea un nuevo presupuesto para un cliente</p>
      </div>
      <QuoteForm customers={customers} products={products} />
    </div>
  )
}
