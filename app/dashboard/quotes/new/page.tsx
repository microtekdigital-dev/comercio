import { redirect } from "next/navigation"
import { getCustomers } from "@/lib/actions/customers"
import { getProducts } from "@/lib/actions/products"
import QuoteForm from "./quote-form"
import Link from "next/link"

export default async function NewQuotePage() {
  const [customers, products] = await Promise.all([
    getCustomers(),
    getProducts(),
  ])

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">📄 Nuevo Presupuesto</span>
          <Link href="/dashboard/quotes" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>
        <div className="bg-[#d4d0c8] p-4">
          <QuoteForm customers={customers} products={products} />
        </div>
      </div>
    </div>
  )
}
