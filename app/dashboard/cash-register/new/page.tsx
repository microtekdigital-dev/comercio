"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createCashRegisterClosure, getCashRegisterOpenings, getCashRegisterClosures, getSupplierPayments } from "@/lib/actions/cash-register"
import { getSales } from "@/lib/actions/sales"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, DollarSign, TrendingUp, CreditCard, Smartphone, Wallet, AlertTriangle, CheckCircle, Clock, Info, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"
import type { CashRegisterOpening } from "@/lib/types/erp"

export default function NewCashRegisterClosurePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [activeOpenings, setActiveOpenings] = useState<CashRegisterOpening[]>([])
  
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
    supplierPaymentsTotal: number
    supplierPaymentsCash: number
    supplierPaymentsCard: number
    supplierPaymentsTransfer: number
    supplierPaymentsOther: number
    supplierPaymentsCount: number
    opening?: {
      id: string
      initial_cash_amount: number
      opened_by_name: string
      shift: string
    } | null
    hasOpening: boolean
  } | null>(null)

  // Calculate preview when date, shift, or activeOpenings changes
  useEffect(() => {
    if (closureDate) {
      calculatePreview()
    }
  }, [closureDate, shift, activeOpenings])

  // Load active openings on mount
  useEffect(() => {
    loadActiveOpenings()
  }, [])

  const loadActiveOpenings = async () => {
    try {
      const [openings, closures] = await Promise.all([
        getCashRegisterOpenings(),
        getCashRegisterClosures()
      ])
      
      // Filter openings that don't have a corresponding closure
      const active = openings.filter(opening => {
        const hasMatchingClosure = closures.some(closure => 
          closure.opening_id === opening.id
        )
        return !hasMatchingClosure
      })
      
      setActiveOpenings(active)
      
      // If there's only one active opening, pre-select its shift
      if (active.length === 1) {
        setShift(active[0].shift)
      }
    } catch (error) {
      console.error("Error loading active openings:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const calculatePreview = async () => {
    setCalculating(true)
    try {
      const startOfDay = new Date(closureDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(closureDate)
      endOfDay.setHours(23, 59, 59, 999)

      const dateStr = closureDate // Already in YYYY-MM-DD format

      // Get existing closures for this date to find the last closure timestamp
      const allClosures = await getCashRegisterClosures({
        dateFrom: startOfDay.toISOString(),
        dateTo: endOfDay.toISOString(),
      })

      // Sort by created_at to get the most recent closure
      const sortedClosures = allClosures.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const lastClosure = sortedClosures.length > 0 ? sortedClosures[0] : null

      const [allSales, allSupplierPayments] = await Promise.all([
        getSales({
          status: "completed",
          dateFrom: startOfDay.toISOString(),
          dateTo: endOfDay.toISOString(),
        }),
        getSupplierPayments(dateStr, dateStr)
      ])

      // Filter sales and payments to only include those created after the last closure
      const sales = lastClosure 
        ? allSales.filter(sale => new Date(sale.created_at) > new Date(lastClosure.created_at))
        : allSales

      const supplierPayments = lastClosure
        ? allSupplierPayments.filter(payment => new Date(payment.created_at) > new Date(lastClosure.created_at))
        : allSupplierPayments

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

      // Calculate supplier payments by method from filtered payments
      let supplierPaymentsTotal = 0
      let supplierPaymentsCash = 0
      let supplierPaymentsCard = 0
      let supplierPaymentsTransfer = 0
      let supplierPaymentsOther = 0
      let supplierPaymentsCount = 0
      
      if (supplierPayments) {
        supplierPaymentsCount = supplierPayments.length
        
        for (const payment of supplierPayments) {
          const amount = Number(payment.amount)
          const method = payment.payment_method?.toLowerCase() || ""
          
          supplierPaymentsTotal += amount
          
          if (method.includes("efectivo") || method.includes("cash")) {
            supplierPaymentsCash += amount
          } else if (method.includes("tarjeta") || method.includes("card") || method.includes("débito") || method.includes("crédito")) {
            supplierPaymentsCard += amount
          } else if (method.includes("transferencia") || method.includes("transfer")) {
            supplierPaymentsTransfer += amount
          } else {
            supplierPaymentsOther += amount
          }
        }
      }

      // Find the corresponding opening from activeOpenings
      let matchingOpening = null
      let hasOpening = false
      
      if (shift && shift !== "sin-turno" && activeOpenings.length > 0) {
        // Look for an opening that matches the selected shift
        matchingOpening = activeOpenings.find(opening => opening.shift === shift)
        
        if (matchingOpening) {
          hasOpening = true
        }
      }

      setPreview({
        totalSalesCount,
        totalSalesAmount,
        cashSales,
        cardSales,
        transferSales,
        otherSales,
        supplierPaymentsTotal,
        supplierPaymentsCash,
        supplierPaymentsCard,
        supplierPaymentsTransfer,
        supplierPaymentsOther,
        supplierPaymentsCount,
        opening: matchingOpening ? {
          id: matchingOpening.id,
          initial_cash_amount: matchingOpening.initial_cash_amount,
          opened_by_name: matchingOpening.opened_by_name,
          shift: matchingOpening.shift,
        } : null,
        hasOpening,
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

  const cashDifference = cashCounted && preview 
    ? Number(cashCounted) - (preview.cashSales + (preview.opening?.initial_cash_amount || 0) - preview.supplierPaymentsCash)
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
          {/* Active Openings Alert */}
          {activeOpenings.length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900 font-semibold">
                Aperturas Activas ({activeOpenings.length})
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  {activeOpenings.map((opening) => (
                    <div key={opening.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{opening.shift}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(opening.opening_date)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Abierto por: {opening.opened_by_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(opening.initial_cash_amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">Monto inicial</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {activeOpenings.length === 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No hay aperturas activas</AlertTitle>
              <AlertDescription>
                No se encontraron aperturas de caja pendientes de cierre. Debes crear una apertura antes de hacer un cierre.
              </AlertDescription>
            </Alert>
          )}

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
            <Button 
              type="submit" 
              disabled={loading || calculating || activeOpenings.length === 0}
            >
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
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Selecciona una fecha para ver el resumen
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Payments Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Pagos a Proveedores</CardTitle>
            </CardHeader>
            <CardContent>
              {calculating ? (
                <div className="text-center py-8 text-muted-foreground">
                  Calculando...
                </div>
              ) : preview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Pagos</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(preview.supplierPaymentsTotal)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Cantidad</p>
                      <p className="text-xl font-semibold">{preview.supplierPaymentsCount}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Efectivo</span>
                      </div>
                      <span className="font-semibold text-red-600">{formatCurrency(preview.supplierPaymentsCash)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Tarjeta</span>
                      </div>
                      <span className="font-semibold text-red-600">{formatCurrency(preview.supplierPaymentsCard)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Transferencia</span>
                      </div>
                      <span className="font-semibold text-red-600">{formatCurrency(preview.supplierPaymentsTransfer)}</span>
                    </div>

                    {preview.supplierPaymentsOther > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-red-500" />
                          <span className="font-medium">Otros</span>
                        </div>
                        <span className="font-semibold text-red-600">{formatCurrency(preview.supplierPaymentsOther)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Selecciona una fecha para ver el resumen
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cash Reconciliation */}
          {preview && cashCounted && cashDifference !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Reconciliación de Efectivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventas en Efectivo:</span>
                    <span className="font-medium">{formatCurrency(preview.cashSales)}</span>
                  </div>
                  {preview.opening && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">+ Monto Inicial Apertura:</span>
                      <span className="font-medium">{formatCurrency(preview.opening.initial_cash_amount)}</span>
                    </div>
                  )}
                  {preview.supplierPaymentsCash > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">- Pagos a Proveedores:</span>
                      <span className="font-medium text-red-600">{formatCurrency(preview.supplierPaymentsCash)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                    <span className="text-muted-foreground">Efectivo Esperado:</span>
                    <span>{formatCurrency(preview.cashSales + (preview.opening?.initial_cash_amount || 0) - preview.supplierPaymentsCash)}</span>
                  </div>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
