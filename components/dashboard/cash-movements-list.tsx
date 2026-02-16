"use client"

import { useState } from "react"
import { deleteCashMovement } from "@/lib/actions/cash-movements"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { TrendingUp, TrendingDown, Trash2, User, Calendar } from "lucide-react"
import type { CashMovement } from "@/lib/types/erp"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CashMovementsListProps {
  movements: CashMovement[]
  onDelete?: () => void
}

export function CashMovementsList({ movements, onDelete }: CashMovementsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setLoading(true)
    try {
      const result = await deleteCashMovement(deleteId)

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
        description: "Movimiento eliminado correctamente",
      })

      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el movimiento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setDeleteId(null)
    }
  }

  // Calculate totals
  const totalIncome = movements
    .filter((m) => m.movement_type === "income")
    .reduce((sum, m) => sum + m.amount, 0)

  const totalWithdrawals = movements
    .filter((m) => m.movement_type === "withdrawal")
    .reduce((sum, m) => sum + m.amount, 0)

  const netMovement = totalIncome - totalWithdrawals

  if (movements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay movimientos</h3>
          <p className="text-muted-foreground text-center">
            Los ingresos y retiros de caja aparecerán aquí
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Totals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Total Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Total Retiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalWithdrawals)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Movimiento Neto</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  netMovement > 0
                    ? "text-green-600"
                    : netMovement < 0
                    ? "text-red-600"
                    : ""
                }`}
              >
                {formatCurrency(netMovement)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <Badge
                        variant={movement.movement_type === "income" ? "default" : "destructive"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {movement.movement_type === "income" ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            Ingreso
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            Retiro
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold ${
                          movement.movement_type === "income" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(movement.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {movement.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {movement.created_by_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(movement.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(movement.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El movimiento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
