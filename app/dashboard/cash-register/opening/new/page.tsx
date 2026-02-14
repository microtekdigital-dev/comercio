"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCashRegisterOpening } from "@/lib/actions/cash-register"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, DollarSign } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewCashRegisterOpeningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [openingDate, setOpeningDate] = useState(new Date().toISOString().split("T")[0])
  const [shift, setShift] = useState("")
  const [initialCashAmount, setInitialCashAmount] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
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
        shift: shift,
        initial_cash_amount: amount,
        notes: notes || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Apertura de caja creada exitosamente")
        router.push("/dashboard/cash-register")
      }
    } catch (error) {
      toast.error("Error al crear la apertura de caja")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cash-register">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Apertura de Caja</h2>
          <p className="text-muted-foreground">
            Registra la apertura de caja al inicio del turno
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Información de Apertura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openingDate">Fecha de Apertura *</Label>
                <Input
                  id="openingDate"
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="shift">Turno *</Label>
                <Select value={shift} onValueChange={setShift} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mañana">Mañana</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noche">Noche</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona el turno de trabajo
                </p>
              </div>

              <div>
                <Label htmlFor="initialCashAmount">Monto Inicial en Efectivo *</Label>
                <Input
                  id="initialCashAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={initialCashAmount}
                  onChange={(e) => setInitialCashAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ingresa el monto inicial de efectivo en la caja
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones de la apertura..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Apertura"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
