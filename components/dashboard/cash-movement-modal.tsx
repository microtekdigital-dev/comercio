"use client"

import { useState } from "react"
import { createCashMovement } from "@/lib/actions/cash-movements"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { TrendingUp, TrendingDown } from "lucide-react"

interface CashMovementModalProps {
  type: "income" | "withdrawal"
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CashMovementModal({
  type,
  open,
  onOpenChange,
  onSuccess,
}: CashMovementModalProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isIncome = type === "income"
  const title = isIncome ? "Registrar Ingreso" : "Registrar Retiro"
  const Icon = isIncome ? TrendingUp : TrendingDown

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validations
    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a cero",
        variant: "destructive",
      })
      return
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "La descripción es requerida",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const result = await createCashMovement({
        movement_type: type,
        amount: amountNum,
        description: description.trim(),
      })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Éxito",
        description: `${isIncome ? "Ingreso" : "Retiro"} registrado correctamente`,
      })

      // Reset form
      setAmount("")
      setDescription("")
      onOpenChange(false)
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar el movimiento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${isIncome ? "text-green-600" : "text-red-600"}`} />
              {title}
            </DialogTitle>
            <DialogDescription>
              {isIncome
                ? "Registra un ingreso de dinero en efectivo a la caja"
                : "Registra un retiro de dinero en efectivo de la caja"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder={
                  isIncome
                    ? "Ej: Ingreso por venta de activo, préstamo, etc."
                    : "Ej: Retiro para gastos, pago de servicios, etc."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={loading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
