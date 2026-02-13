"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseOrder } from "@/lib/actions/purchase-orders";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getProducts, getProductsBySupplier } from "@/lib/actions/products";
import { getProductVariants } from "@/lib/actions/product-variants";
import type { PurchaseOrderFormData, PurchaseOrderItemFormData, Supplier, Product, ProductVariant } from "@/lib/types/erp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<Record<string, ProductVariant[]>>({});
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_date: "",
    status: "pending",
    notes: "",
    items: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar productos cuando cambia el proveedor
  useEffect(() => {
    filterProductsBySupplier();
  }, [formData.supplier_id, products]);

  const loadData = async () => {
    const [suppliersData, productsData] = await Promise.all([
      getSuppliers({ status: "active" }),
      getProducts({ isActive: true }),
    ]);
    setSuppliers(suppliersData);
    setProducts(productsData);
  };

  const filterProductsBySupplier = async () => {
    if (formData.supplier_id) {
      // Filtrar productos del proveedor seleccionado
      const filtered = await getProductsBySupplier(formData.supplier_id);
      setAvailableProducts(filtered);
    } else {
      // Sin proveedor seleccionado, mostrar todos los productos
      setAvailableProducts(products);
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: "",
          product_name: "",
          product_sku: "",
          variant_id: "",
          variant_name: "",
          quantity: 1,
          unit_cost: 0,
          tax_rate: 21,
          discount_percent: 0,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItemFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          
          // If product selected, auto-fill data
          if (field === "product_id" && value) {
            const product = products.find((p) => p.id === value);
            if (product) {
              updated.product_name = product.name;
              updated.product_sku = product.sku || "";
              updated.unit_cost = product.cost;
              
              // Reset variant selection when product changes
              updated.variant_id = "";
              updated.variant_name = "";
            }
          }
          
          // If variant selected, update variant name
          if (field === "variant_id" && value) {
            const productId = item.product_id;
            if (productId && productVariants[productId]) {
              const variant = productVariants[productId].find((v) => v.id === value);
              if (variant) {
                updated.variant_name = variant.variant_name;
              }
            }
          }
          
          return updated;
        }
        return item;
      }),
    }));
  };

  // Load variants when items change
  useEffect(() => {
    const loadVariantsForItems = async () => {
      for (const item of formData.items) {
        if (item.product_id && !productVariants[item.product_id]) {
          const product = products.find((p) => p.id === item.product_id);
          if (product?.has_variants) {
            const variants = await getProductVariants(item.product_id);
            setProductVariants(prev => ({
              ...prev,
              [item.product_id!]: variants
            }));
          }
        }
      }
    };
    
    loadVariantsForItems();
  }, [formData.items, products, productVariants]);

  const calculateItemTotal = (item: PurchaseOrderItemFormData) => {
    const subtotal = item.quantity * item.unit_cost;
    const discount = subtotal * (item.discount_percent / 100);
    const subtotalAfterDiscount = subtotal - discount;
    const tax = subtotalAfterDiscount * (item.tax_rate / 100);
    return subtotalAfterDiscount + tax;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let tax = 0;

    formData.items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unit_cost;
      const discount = itemSubtotal * (item.discount_percent / 100);
      const subtotalAfterDiscount = itemSubtotal - discount;
      const itemTax = subtotalAfterDiscount * (item.tax_rate / 100);
      
      subtotal += subtotalAfterDiscount;
      tax += itemTax;
    });

    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast.error("Selecciona un proveedor");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    setLoading(true);

    const result = await createPurchaseOrder(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Orden de compra creada exitosamente");
      router.push("/dashboard/purchase-orders");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const totals = calculateTotals();

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchase-orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Orden de Compra</h2>
          <p className="text-muted-foreground">
            Crea una orden de compra a un proveedor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos de la orden de compra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">
                    Proveedor <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, supplier_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_date">
                    Fecha de Orden <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, order_date: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_date">Fecha Esperada</Label>
                  <Input
                    id="expected_date"
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, expected_date: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>

              {formData.supplier_id && availableProducts.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay productos asociados a este proveedor. Puedes agregar productos manualmente o asignar productos a este proveedor desde el catálogo.
                  </AlertDescription>
                </Alert>
              )}

              {formData.supplier_id && availableProducts.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Mostrando {availableProducts.length} producto(s) de este proveedor.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>Agrega los productos a comprar</CardDescription>
                </div>
                <Button type="button" onClick={addItem} size="sm" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Unit.</TableHead>
                      <TableHead>Desc. %</TableHead>
                      <TableHead>IVA %</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => {
                      const selectedProduct = products.find(p => p.id === item.product_id);
                      const hasVariants = selectedProduct?.has_variants;
                      const variants = item.product_id ? productVariants[item.product_id] || [] : [];
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.product_id || "none"}
                              onValueChange={(value) =>
                                updateItem(index, "product_id", value === "none" ? "" : value)
                              }
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Producto manual</SelectItem>
                                {availableProducts.length === 0 && formData.supplier_id ? (
                                  <SelectItem value="no-products" disabled>
                                    No hay productos de este proveedor
                                  </SelectItem>
                                ) : (
                                  availableProducts.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                      {product.has_variants && " (con variantes)"}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {!item.product_id && (
                              <Input
                                placeholder="Nombre del producto"
                                value={item.product_name}
                                onChange={(e) =>
                                  updateItem(index, "product_name", e.target.value)
                                }
                                className="mt-2"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {hasVariants && variants.length > 0 ? (
                              <Select
                                value={item.variant_id || ""}
                                onValueChange={(value) =>
                                  updateItem(index, "variant_id", value)
                                }
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue placeholder="Seleccionar talle" />
                                </SelectTrigger>
                                <SelectContent>
                                  {variants.map((variant) => (
                                    <SelectItem key={variant.id} value={variant.id}>
                                      {variant.variant_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : hasVariants && variants.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Cargando...</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_cost}
                              onChange={(e) =>
                                updateItem(index, "unit_cost", parseFloat(e.target.value) || 0)
                              }
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.discount_percent}
                              onChange={(e) =>
                                updateItem(index, "discount_percent", parseFloat(e.target.value) || 0)
                              }
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.tax_rate}
                              onChange={(e) =>
                                updateItem(index, "tax_rate", parseFloat(e.target.value) || 0)
                              }
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(calculateItemTotal(item))}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span className="font-medium">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/purchase-orders">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Orden de Compra"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
