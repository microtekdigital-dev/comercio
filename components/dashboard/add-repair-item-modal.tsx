'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getProducts } from '@/lib/actions/products'
import { addRepairItem } from '@/lib/actions/repair-items'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/lib/types/erp'

interface AddRepairItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repairOrderId: string
  onSuccess: () => void
}

export function AddRepairItemModal({
  open,
  onOpenChange,
  repairOrderId,
  onSuccess
}: AddRepairItemModalProps) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open])

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  async function loadProducts() {
    setLoadingProducts(true)
    try {
      const data = await getProducts()
      // Only show products with stock
      const productsWithStock = data.filter(p => p.stock_quantity > 0)
      setProducts(productsWithStock)
      setFilteredProducts(productsWithStock)
    } catch (error) {
      console.error('Error loading products:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar productos',
        variant: 'destructive'
      })
    } finally {
      setLoadingProducts(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedProductId) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar un producto',
        variant: 'destructive'
      })
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: 'Error',
        description: 'La cantidad debe ser mayor a 0',
        variant: 'destructive'
      })
      return
    }

    const selectedProduct = products.find(p => p.id === selectedProductId)
    if (!selectedProduct) return

    if (qty > selectedProduct.stock_quantity) {
      toast({
        title: 'Stock insuficiente',
        description: `Solo hay ${selectedProduct.stock_quantity} unidades disponibles`,
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      await addRepairItem({
        repair_order_id: repairOrderId,
        product_id: selectedProductId,
        quantity: qty,
        unit_price: selectedProduct.price
      })

      toast({
        title: 'Repuesto agregado',
        description: 'El repuesto ha sido agregado correctamente'
      })

      onSuccess()
      handleClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al agregar repuesto',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setSelectedProductId('')
    setQuantity('1')
    setSearchTerm('')
    onOpenChange(false)
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Repuesto</DialogTitle>
            <DialogDescription>
              Seleccione un producto del inventario para agregar a la reparación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Producto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Product Select */}
            <div className="space-y-2">
              <Label htmlFor="product">Producto *</Label>
              {loadingProducts ? (
                <div className="text-sm text-muted-foreground">Cargando productos...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? 'No se encontraron productos' : 'No hay productos con stock disponible'}
                </div>
              ) : (
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{product.name}</span>
                          <div className="flex items-center gap-2">
                            {product.sku && (
                              <span className="text-xs text-muted-foreground">
                                {product.sku}
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Stock: {product.stock_quantity}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio:</span>
                  <span className="font-medium">{formatCurrency(selectedProduct.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stock disponible:</span>
                  <span className="font-medium">{selectedProduct.stock_quantity} unidades</span>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.stock_quantity || 999}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* Subtotal */}
            {selectedProduct && quantity && parseInt(quantity) > 0 && (
              <div className="rounded-lg border p-3 bg-primary/5">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Subtotal:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(selectedProduct.price * parseInt(quantity))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedProductId}>
              {loading ? 'Agregando...' : 'Agregar Repuesto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
