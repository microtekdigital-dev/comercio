"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createCashRegisterOpening } from "@/lib/actions/cash-register"
import { getInitialCashAmount } from "@/lib/actions/company-settings"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewCashRegisterOpeningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingInitialAmount, setLoadingInitialAmount] = useState(true)
  const [suggestedAmount, setSuggestedAmount] = useState<number | null>(null)

  const [openingDate, setOpeningDate] = useState(new Date().toISOString().split("T")[0])
  const [shift, setShift] = useState("")
  const [initialCashAmount, setInitialCashAmount] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function loadInitialAmount() {
      try {
        const amount = await getInitialCashAmount()
        if (amount !== null) {
          setSuggestedAmount(amount)
          setInitialCashAmount(amount.toString())
        }
      } catch (error) {
        console.error("Error loading initial cash amount:", error)
      } finally {
        setLoadingInitialAmount(false)
      }
    }
    loadInitialAmount()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shift) {
      toast.error("Debe seleccionar un turno")
      return
    }

    const amount = Number(initialCashAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto inicial debe ser mayor a cero")
      return
    }

    setLoading(true)
    try {
      const result = await createCashRegisterOpening({
        opening_date: openingDate,
        shift,
        initial_cash_amount: amount,
        notes: notes || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Apertura de caja creada exitosamente")
        router.push("/pos")
      }
    } catch {
      toast.error("Error al crear la apertura de caja")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-4 font-sans text-black">
      <div className="w-full max-w-md">

        {/* Window */}
        <div className="border-2 border-[#808080] shadow-[4px_4px_0px_#000] bg-[#d4d0c8] text-black">

          {/* Title bar */}
          <div className="flex items-center justify-between bg-[#000080] px-2 py-1">
            <span className="text-white text-sm font-bold">🏦 Apertura de Caja</span>
            <Link
              href="/dashboard/cash-register"
              className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0] leading-none"
            >✕</Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3">

            {/* Fecha */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-black">Fecha de Apertura *</span>
              <input
                type="date"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                required
                className="border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
              />
            </div>

            {/* Turno */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-black">Turno *</span>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                required
                className="border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
              >
                <option value="">— Seleccionar turno —</option>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </select>
            </div>

            {/* Monto inicial */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-black">Monto Inicial en Efectivo *</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={initialCashAmount}
                onChange={(e) => setInitialCashAmount(e.target.value)}
                disabled={loadingInitialAmount}
                required
                className="border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full text-right font-mono"
              />
              <span className="text-[10px] text-gray-600">
                {loadingInitialAmount
                  ? "Cargando importe sugerido..."
                  : suggestedAmount !== null
                  ? `Valor sugerido: $${suggestedAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })} (podés modificarlo)`
                  : "Ingresá el monto inicial de efectivo en caja"}
              </span>
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-black">Notas (opcional)</span>
              <textarea
                placeholder="Observaciones de la apertura..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full resize-none"
              />
            </div>

            {/* Separator */}
            <div className="border-t border-[#808080] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px hover:bg-[#c0c0c0] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || loadingInitialAmount}
                className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1"
              >
                {loading
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>
                  : "✔ Abrir Caja"}
              </button>
            </div>
          </form>
        </div>

        {/* Back link */}
        <div className="mt-3 text-center">
          <Link
            href="/dashboard/cash-register"
            className="text-xs text-black underline hover:text-[#0000cc]"
          >
            ← Volver a Caja Registradora
          </Link>
        </div>
      </div>
    </div>
  )
}
