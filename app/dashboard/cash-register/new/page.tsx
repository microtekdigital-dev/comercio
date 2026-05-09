"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createCashRegisterClosure, getCashRegisterOpenings, getCashRegisterClosures, previewCashRegisterClosure } from "@/lib/actions/cash-register"
import { getCompanySettings } from "@/lib/actions/company-settings"
import { formatCompanyCurrency } from "@/lib/utils/currency"
import type { CompanySettings } from "@/lib/types/erp"
import { Loader2, DollarSign, CreditCard, Smartphone, Wallet, AlertTriangle, CheckCircle, Clock, TrendingDown } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { CashRegisterOpening } from "@/lib/types/erp"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080]">
      <div className="bg-[#c0c0c0] border-b border-[#808080] px-3 py-1">
        <span className="text-xs font-bold">{title}</span>
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  )
}

export default function NewCashRegisterClosurePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [activeOpenings, setActiveOpenings] = useState<CashRegisterOpening[]>([])
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [closureDate, setClosureDate] = useState(new Date().toISOString().split("T")[0])
  const [shift, setShift] = useState("")
  const [cashCounted, setCashCounted] = useState("")
  const [notes, setNotes] = useState("")
  const [preview, setPreview] = useState<{
    totalSalesCount: number; totalSalesAmount: number
    cashSales: number; cardSales: number; transferSales: number; otherSales: number
    supplierPaymentsTotal: number; supplierPaymentsCash: number
    supplierPaymentsCard: number; supplierPaymentsTransfer: number
    supplierPaymentsOther: number; supplierPaymentsCount: number
    opening?: { id: string; initial_cash_amount: number; opened_by_name: string; shift: string } | null
    hasOpening: boolean
  } | null>(null)

  useEffect(() => { if (closureDate) calculatePreview() }, [closureDate, shift, activeOpenings])
  useEffect(() => { loadActiveOpenings(); getCompanySettings().then(setSettings).catch(console.error) }, [])

  const loadActiveOpenings = async () => {
    try {
      const [openings, closures] = await Promise.all([getCashRegisterOpenings(), getCashRegisterClosures()])
      const active = openings.filter(op => !closures.some(c => c.opening_id === op.id))
      setActiveOpenings(active)
      if (active.length === 1) setShift(active[0].shift)
    } catch (error) { console.error("Error loading active openings:", error) }
  }

  const fmt = (n: number) => settings ? formatCompanyCurrency(n, settings) : `$${n.toFixed(2)}`

  const fmtDate = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate().toString().padStart(2,"0")}/${(dt.getMonth()+1).toString().padStart(2,"0")}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2,"0")}:${dt.getMinutes().toString().padStart(2,"0")}`
  }

  const calculatePreview = async () => {
    setCalculating(true)
    try {
      const result = await previewCashRegisterClosure(closureDate)
      if (result.error) { toast.error("Error al calcular: " + result.error); return }
      setPreview({
        totalSalesCount: result.totalSalesCount, totalSalesAmount: result.totalSalesAmount,
        cashSales: result.cashSales, cardSales: result.cardSales,
        transferSales: result.transferSales, otherSales: result.otherSales,
        supplierPaymentsTotal: result.supplierPaymentsTotal, supplierPaymentsCash: result.supplierPaymentsCash,
        supplierPaymentsCard: 0, supplierPaymentsTransfer: 0, supplierPaymentsOther: 0,
        supplierPaymentsCount: result.supplierPaymentsCount,
        opening: result.opening ?? null, hasOpening: !!result.opening,
      })
    } catch { toast.error("Error al calcular el resumen") }
    finally { setCalculating(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const result = await createCashRegisterClosure({
        closure_date: closureDate,
        shift: shift && shift !== "sin-turno" ? shift : undefined,
        cash_counted: cashCounted ? Number(cashCounted) : undefined,
        notes: notes || undefined,
      })
      if (result.error) { toast.error(result.error) }
      else {
        if (result.warning) toast.warning(result.warning)
        toast.success("Cierre de caja creado exitosamente")
        router.push("/pos")
      }
    } catch { toast.error("Error al crear el cierre de caja") }
    finally { setLoading(false) }
  }

  const cashDifference = cashCounted && preview
    ? Number(cashCounted) - (preview.cashSales + (preview.opening?.initial_cash_amount || 0) - preview.supplierPaymentsCash)
    : null

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
  const l = "text-xs font-bold text-black block mb-0.5"

  const Row = ({ label, value, color = "" }: { label: string; value: string; color?: string }) => (
    <div className="flex items-center justify-between border-b border-[#e0e0e0] py-1.5 last:border-b-0">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
    </div>
  )

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🏦 Nuevo Cierre de Caja</span>
          <Link href="/pos" className="text-blue-200 text-xs hover:text-white">← Volver al POS</Link>
        </div>

        <div className="bg-[#d4d0c8] p-4">
          <div className="grid gap-4 md:grid-cols-2">

            {/* LEFT: Form */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Active openings */}
              {activeOpenings.length > 0 ? (
                <div className="border-2 border-blue-400 bg-blue-50 p-3 space-y-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-800">
                    <Clock className="h-3.5 w-3.5" /> Aperturas Activas ({activeOpenings.length})
                  </div>
                  {activeOpenings.map(op => (
                    <div key={op.id} className="flex items-center justify-between border border-blue-200 bg-white px-3 py-2">
                      <div>
                        <span className="text-xs font-bold border border-[#808080] bg-[#d4d0c8] px-1.5 py-0.5 mr-2">{op.shift}</span>
                        <span className="text-xs text-gray-600">{fmtDate(op.opening_date)}</span>
                        <div className="text-[10px] text-gray-500 mt-0.5">Por: {op.opened_by_name}</div>
                      </div>
                      <span className="text-sm font-bold font-mono text-green-700">{fmt(op.initial_cash_amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-red-400 bg-red-50 px-3 py-2 flex items-center gap-2 text-xs text-red-700 font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> No hay aperturas activas
                </div>
              )}

              <Section title="Información del Cierre">
                <div>
                  <label className={l}>Fecha *</label>
                  <input type="date" required value={closureDate} onChange={e => setClosureDate(e.target.value)} className={f} />
                </div>
                <div>
                  <label className={l}>Turno (opcional)</label>
                  <select value={shift} onChange={e => setShift(e.target.value)} className={f}>
                    <option value="">Sin turno</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                    <option value="Completo">Día Completo</option>
                  </select>
                </div>
                <div>
                  <label className={l}>Efectivo Contado (opcional)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={cashCounted} onChange={e => setCashCounted(e.target.value)} className={f} />
                  <span className="text-[10px] text-gray-500">Ingresá el monto físico contado</span>
                </div>
                <div>
                  <label className={l}>Notas (opcional)</label>
                  <textarea placeholder="Observaciones del cierre..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={f + " resize-none"} />
                </div>
              </Section>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => router.back()} disabled={loading}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading || calculating || activeOpenings.length === 0}
                  className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                  {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "🏦 Cerrar Caja"}
                </button>
              </div>
            </form>

            {/* RIGHT: Preview */}
            <div className="space-y-3">

              {/* Apertura encontrada */}
              {preview?.opening && (
                <div className="border-2 border-green-400 bg-green-50 px-3 py-2 space-y-0.5">
                  <div className="flex items-center gap-1 text-xs font-bold text-green-800">
                    <CheckCircle className="h-3.5 w-3.5" /> Apertura encontrada
                  </div>
                  <div className="text-xs text-green-700">Turno: {preview.opening.shift} · Por: {preview.opening.opened_by_name}</div>
                  <div className="text-xs font-bold text-green-800">Monto inicial: {fmt(preview.opening.initial_cash_amount)}</div>
                </div>
              )}

              {/* Ventas */}
              <Section title="📊 Resumen de Ventas">
                {calculating ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Calculando...
                  </div>
                ) : preview ? (
                  <>
                    <div className="border-2 border-[#808080] bg-[#d4d0c8] px-3 py-2 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#000080]" />
                        <span className="text-xs font-bold">Total Ventas</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold font-mono">{fmt(preview.totalSalesAmount)}</div>
                        <div className="text-[10px] text-gray-600">{preview.totalSalesCount} ventas</div>
                      </div>
                    </div>
                    <Row label="💵 Efectivo" value={fmt(preview.cashSales)} color="text-green-700" />
                    <Row label="💳 Tarjeta" value={fmt(preview.cardSales)} color="text-blue-700" />
                    <Row label="📱 Transferencia" value={fmt(preview.transferSales)} color="text-purple-700" />
                    {preview.otherSales > 0 && <Row label="Otros" value={fmt(preview.otherSales)} />}
                  </>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-4">Seleccioná una fecha para ver el resumen</div>
                )}
              </Section>

              {/* Pagos proveedores */}
              <Section title="🏭 Pagos a Proveedores">
                {calculating ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Calculando...
                  </div>
                ) : preview ? (
                  <>
                    <div className="border-2 border-red-400 bg-red-50 px-3 py-2 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <span className="text-xs font-bold">Total Pagos</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold font-mono text-red-700">{fmt(preview.supplierPaymentsTotal)}</div>
                        <div className="text-[10px] text-gray-600">{preview.supplierPaymentsCount} pagos</div>
                      </div>
                    </div>
                    <Row label="💵 Efectivo" value={fmt(preview.supplierPaymentsCash)} color="text-red-700" />
                    <Row label="💳 Tarjeta" value={fmt(preview.supplierPaymentsCard)} color="text-red-700" />
                    <Row label="📱 Transferencia" value={fmt(preview.supplierPaymentsTransfer)} color="text-red-700" />
                  </>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-4">Seleccioná una fecha para ver el resumen</div>
                )}
              </Section>

              {/* Reconciliación */}
              {preview && cashCounted && cashDifference !== null && (
                <Section title="⚖ Reconciliación de Efectivo">
                  <Row label="Ventas en Efectivo" value={fmt(preview.cashSales)} />
                  {preview.opening && <Row label="+ Monto Inicial" value={fmt(preview.opening.initial_cash_amount)} />}
                  {preview.supplierPaymentsCash > 0 && <Row label="- Pagos Proveedores" value={fmt(preview.supplierPaymentsCash)} color="text-red-600" />}
                  <div className="border-t-2 border-[#808080] pt-2 mt-1">
                    <Row label="Efectivo Esperado" value={fmt(preview.cashSales + (preview.opening?.initial_cash_amount || 0) - preview.supplierPaymentsCash)} />
                    <Row label="Efectivo Contado" value={fmt(Number(cashCounted))} />
                    <div className="flex items-center justify-between pt-2 border-t border-[#808080]">
                      <span className="text-sm font-bold">Diferencia</span>
                      <span className={`text-xl font-bold font-mono ${cashDifference < 0 ? "text-red-600" : cashDifference > 0 ? "text-green-700" : "text-gray-600"}`}>
                        {cashDifference > 0 ? "+" : ""}{fmt(cashDifference)}
                      </span>
                    </div>
                  </div>
                </Section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
