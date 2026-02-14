"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createCashRegisterClosure } from "@/lib/actions/cash-register"
import { getSales } from "@/lib/actions/sales"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, DollarSign, TrendingUp, CreditCard, Smartphone, Wallet, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewCashRegisterClosurePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  
  // Form state
  const [closureDate, setClosureDate] = useState(new Date().toISOString().split("T")[0])
  const [shift, setShift] = useState("")
  const [cashCounted, setCashCounted] = useState("")
  const [notes, setNotes] = useState("")
  
  // Preview data
  const [preview, setPreview] = useState<{
    totalSalesCount: number
    totalSalesAmount: number
    cashSales: number
    cardSales: number
    transferSales: number
    otherSales: number
    opening?: {
      id: string
      initial_cash_amount: number
      opened_by_name: string
      shift: string
    } | null
    hasOpening: boolean
  } | null>(null)

  // Calculate preview when date or shift changes
  useEffect(() => {
    if (closureDate) {
      calculatePreview()
    }
  }, [closureDate, shift])

  const calculatePreview = async () => {
    setCalculating(true)
    try {
      const startOfDay = new Date(closureDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(closureDate)
      endOfDay.setHours(23, 59, 59, 999)

      const sales = await getSales({
        status: "completed",
        dateFrom: startOfDay.toISOString(),
        dateTo: endOfDay.toISOString(),
      })

      let totalSalesCount = 0
      let totalSalesAmount = 0
      let cashSales = 0
      let cardSales = 0
      let transferSales = 0
      let otherSales = 0

      if (sales) {
        totalSalesCount = sales.length
        
        for (const sale of sales) {
          totalSalesAmount += Number(sale.total)
          
          // Si la venta tiene pagos registrados, usar esos
          if (sale.payments && sale.payments.length > 0) {
            for (const payment of sale.payments) {
              const amount = Number(payment.amount)
              const method = payment.payment_method?.toLowerCase() || ""
              
              if (method.includes("efectivo") || method.includes("cash")) {
                cashSales += amount
              } else if (method.includes("tarjeta") || method.includes("card") || method.includes("débito") || method.includes("crédito")) {
                cardSales += amount
              } else if (method.includes("transferencia") || method.includes("transfer")) {
                transferSales += amount
              } else {
                otherSales += amount
              }
            }
          } else {
            // Si no hay pagos registrados, usar el payment_method de la venta
            const amount = Number(sale.total)
            const method = sale.payment_method?.toLowerCase() || ""
            
            if (method.includes("efectivo") || method.includes("cash")) {
              cashSales += amount
            } else if (method.includes("tarjeta") || method.includes("card") || method.includes("débito") || method.includes("crédito")) {
              cardSales += amount
            } else if (method.includes("transferencia") || method.includes("transfer")) {
              transferSales += amount
            } else {
              otherSales += amount
            }
          }
        }
      }

      // Check for opening (simulated - in real app would call findOpeningForClosure)
      // For now, we'll set hasOpening to false and let the backend handle it
      setPreview({
        totalSalesCount,
        totalSalesAmount,
        cashSales,
        cardSales,
        transferSales,
        otherSales,
        hasOpening: false, // Will be determined by backend
      })
    } catch (error) {
      console.error("Error calculating preview:", error)
      toast.error("Error al calcular el resumen")
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createCashRegisterClosure({
        closure_date: closureDate,
        shift: shift && shift !== "sin-turno" ? shift : undefined,
        cash_counted: cashCounted ? Number(cashCounted) : undefined,
        notes: notes || undefined,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        if (result.warning) {
          toast.warning(result.warning)
        }
        toast.success("Cierre de caja creado exitosamente")
        router.push("/dashboard/cash-register")
      }
    } catch (error) {
      toast.error("Error al crear el cierre de caja")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const cashDifference = cashCounted && preview 
    ? Number(cashCounted) - preview.cashSales - (preview.opening?.initial_cash_amount || 0)
    : null

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cash-register">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Cierre de Caja</h2>
          <p className="text-muted-foreground">
            Registra el cierre de caja del turno o día
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Cierre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="closureDate">Fecha *</Label>
                <Input
                  id="closureDate"
                  type="date"
                  value={closureDate}
                  onChange={(e) => setClosureDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="shift">Turno (opcional)</Label>
                <Select value={shift} onValueChange={setShift}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-turno">Sin turno</SelectItem>
                    <SelectItem value="Mañana">Mañana</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noche">Noche</SelectItem>
                    <SelectItem value="Completo">Día Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cashCounted">Efectivo Contado (opcional)</Label>
                <Input
                  id="cashCounted"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashCounted}
                  onChange={(e) => setCashCounted(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ingresa el monto físico contado en efectivo
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones del cierre..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || calculating}>
              {loading ? "Guardando..." : "Cerrar Caja"}
            </Button>
          </div>
        </form>

        {/* Preview */}
        <div className="space-y-6">
          {/* Warning if no opening found */}
          {preview && !preview.hasOpening && shift && shift !== "sin-turno" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No se encontró apertura para esta fecha y turno. El cálculo de diferencia no incluirá el monto inicial de apertura.
              </AlertDescription>
            </Alert>
          )}

          {/* Opening info if found */}
          {preview?.opening && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Apertura encontrada</p>
                  <p className="text-sm">Turno: {preview.opening.shift}</p>
                  <p className="text-sm">Abierto por: {preview.opening.opened_by_name}</p>
                  <p className="text-sm">Monto inicial: {formatCurrency(preview.opening.initial_cash_amount)}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              {calculating ? (
                <div className="text-center py-8 text-muted-foreground">
                  Calculando...
                </div>
              ) : preview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Ventas</p>
                        <p className="text-2xl font-bold">{formatCurrency(preview.totalSalesAmount)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Cantidad</p>
                      <p className="text-xl font-semibold">{preview.totalSalesCount}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Efectivo</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(preview.cashSales)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Tarjeta</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(preview.cardSales)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Transferencia</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(preview.transferSales)}</span>
                    </div>

                    {preview.otherSales > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-orange-500" />
                          <span className="font-medium">Otros</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(preview.otherSales)}</span>
                      </div>
                    )}
                  </div>

                  {cashCounted && cashDifference !== null && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Efectivo Esperado:</span>
                          <span className="font-medium">{formatCurrency(preview.cashSales)}</span>
                        </div>
                        {preview.opening && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Monto Inicial Apertura:</span>
                            <span className="font-medium">{formatCurrency(preview.opening.initial_cash_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Efectivo Contado:</span>
                          <span className="font-medium">{formatCurrency(Number(cashCounted))}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Diferencia:</span>
                          <span className={
                            cashDifference < 0 
                              ? "text-red-500" 
                              : cashDifference > 0 
                              ? "text-green-500" 
                              : ""
                          }>
                            {formatCurrency(cashDifference)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Selecciona una fecha para ver el resumen
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
