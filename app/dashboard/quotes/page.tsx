import { getQuotes } from "@/lib/actions/quotes"
import { getCompanySettings } from "@/lib/actions/company-settings"
import { formatCompanyCurrency } from "@/lib/utils/currency"
import { FileText, Plus } from "lucide-react"
import Link from "next/link"

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", sent: "Enviado", accepted: "Aceptado", rejected: "Rechazado", expired: "Vencido" };
const STATUS_COLORS: Record<string, string> = { draft: "text-gray-600", sent: "text-blue-700", accepted: "text-green-700", rejected: "text-red-600", expired: "text-amber-700" };

export default async function QuotesPage() {
  const quotes = await getQuotes()
  const settings = await getCompanySettings()

  const fmt = (n: number) => settings ? formatCompanyCurrency(n, { currency_symbol: settings.currency_symbol, currency_position: settings.currency_position }) : `$${n.toFixed(2)}`
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-AR")

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">📄 Presupuestos ({quotes.length})</span>
          <Link href="/dashboard/quotes/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
            <Plus className="h-3 w-3" /> Nuevo
          </Link>
        </div>

        <div className="bg-white overflow-x-auto">
          <div className="grid grid-cols-[120px_1fr_120px_100px_100px_60px] border-b-2 border-[#808080] bg-[#d4d0c8]">
            {["N° Presupuesto", "Cliente", "Fecha", "Válido hasta", "Total", "Estado"].map((h, i) => (
              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
            ))}
          </div>

          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">No hay presupuestos</p>
              <Link href="/dashboard/quotes/new" className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 mt-2 text-black">
                <Plus className="h-3 w-3" /> Nuevo Presupuesto
              </Link>
            </div>
          ) : quotes.map((quote, idx) => (
            <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`} className="contents">
              <div className={`grid grid-cols-[120px_1fr_120px_100px_100px_60px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="px-2 py-1.5 text-xs font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{quote.quote_number}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{(quote as any).customer?.name ?? "Sin cliente"}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmtDate(quote.quote_date)}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmtDate(quote.valid_until)}</div>
                <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(quote.total)}</div>
                <div className={`px-2 py-1.5 text-xs font-bold group-hover:text-white ${STATUS_COLORS[quote.status] ?? ""}`}>{STATUS_LABELS[quote.status] ?? quote.status}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1">
          <span className="text-xs text-gray-600">{quotes.length} presupuesto(s)</span>
        </div>
      </div>
    </div>
  )
}
