'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { RepairItemWithProduct, Product } from '@/lib/types/erp'
import { formatCurrency } from '@/lib/utils'
import { deleteRepairItem, markItemAsUsed } from '@/lib/actions/repair-items'
import { toast } from '@/hooks/use-toast'

interface RepairItemsTableProps {
  items: RepairItemWithProduct[]
  laborCost: number
  onAddItem: () => void
  onItemsChange: () => void
  readOnly?: boolean
}

export function RepairItemsTable({
  items,
  laborCost,
  onAddItem,
  onItemsChange,
  readOnly = false
}: RepairItemsTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const partsTotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const total = partsTotal + laborCost

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Está seguro de eliminar este repuesto?')) {
      return
    }

    setLoading(itemId)
    try {
      await deleteRepairItem(itemId)
      toast({
        title: 'Repuesto eliminado',
        description: 'El repuesto ha sido eliminado correctamente'
      })
      onItemsChange()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar repuesto',
        variant: 'destructive'
      })
    } finally {
      setLoading(null)
    }
  }

  const handleMarkAsUsed = async (itemId: string) => {
    if (!confirm('¿Marcar este repuesto como utilizado? Se descontará del inventario.')) {
      return
    }

    setLoading(itemId)
    try {
      await markItemAsUsed(itemId)
      toast({
        title: 'Repuesto utilizado',
        description: 'El repuesto ha sido marcado como utilizado y descontado del inventario'
      })
      onItemsChange()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al marcar repuesto como utilizado',
        variant: 'destructive'
      })
    } finally {
      setLoading(null)
    }
  }

  const getStockWarning = (item: RepairItemWithProduct) => {
    if (item.is_used) return null
    if (item.product.stock_quantity < item.quantity) {
      return {
        type: 'warning' as const,
        message: `Stock insuficiente. Disponible: ${item.product.stock_quantity}`
      }
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Repuestos</h3>
        {!readOnly && (
          <Button onClick={onAddItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Repuesto
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay repuestos agregados
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                {!readOnly && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const warning = getStockWarning(item)
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        {warning && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            {warning.message}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.product.sku || '-'}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.is_used ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Utilizado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!item.is_used && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsUsed(item.id)}
                                disabled={loading === item.id}
                              >
                                Usar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={loading === item.id}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Totals */}
      <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal Repuestos:</span>
          <span className="font-medium">{formatCurrency(partsTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Mano de Obra:</span>
          <span className="font-medium">{formatCurrency(laborCost)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Stock warnings summary */}
      {items.some(item => getStockWarning(item)) && (
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Algunos repuestos tienen stock insuficiente. Puede continuar con la operación,
            pero considere reabastecer el inventario.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
