"use client"

import { useState, useCallback, useRef } from "react"
import { createCashMovement } from "@/lib/actions/cash-movements"
import { toast } from "sonner"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"

interface CashMovementModalProps {
  type: "income" | "withdrawal"
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const f = "border border-[#808080] bg-white text-black text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full"
const l = "text-xs font-bold text-black block mb-0.5"

export function CashMovementModal({ type, open, onOpenChange, onSuccess }: CashMovementModalProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const isIncome = type === "income"
  const title = isIncome ? "💵 Registrar Ingreso" : "💸 Registrar Retiro"

  const handleClose = useCallback(() => {
    if (loading) return
    setAmount("")
    setDescription("")
    onOpenChange(false)
  }, [loading, onOpenChange])

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) handleClose()
  }, [handleClose])

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value), [])
  const handleDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) { toast.error("El monto debe ser mayor a cero"); return }
    if (!description.trim()) { toast.error("La descripción es requerida"); return }

    setLoading(true)
    try {
      const result = await createCashMovement({
        movement_type: type,
        amount: amountNum,
        description: description.trim(),
      })
      if (result.error) { toast.error(result.error); return }
      toast.success(`${isIncome ? "Ingreso" : "Retiro"} registrado correctamente`)
      setAmount("")
      setDescription("")
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error("Error al registrar el movimiento")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div ref={overlayRef} onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm mx-4 border-2 border-[#808080] shadow-[4px_4px_0px_#000]">
        {/* Title bar */}
        <div className={`px-3 py-1 flex items-center justify-between ${isIncome ? "bg-[#006400]" : "bg-[#8b0000]"}`}>
          <div className="flex items-center gap-2 text-white text-sm font-bold">
            {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {title}
          </div>
          <button onClick={handleClose}
            className="text-white hover:bg-black/20 px-2 py-0.5 text-xs font-bold border border-white/30">
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="bg-[#d4d0c8] p-4 space-y-3">
          <div>
            <label className={l}>Monto *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              required
              disabled={loading}
              autoFocus
              className={f + " text-right font-mono"}
            />
          </div>

          <div>
            <label className={l}>Descripción *</label>
            <textarea
              placeholder={isIncome
                ? "Ej: Ingreso por venta de activo, préstamo..."
                : "Ej: Retiro para gastos, pago de servicios..."}
              value={description}
              onChange={handleDescChange}
              required
              disabled={loading}
              rows={3}
              className={f + " resize-none"}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-[#808080]">
            <button type="button" onClick={handleClose} disabled={loading}
              className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
