"use client";

// Página de nueva venta con imagen de fondo en estado vacío - v2
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSale } from "@/lib/actions/sales";
import { getCustomers, searchCustomers } from "@/lib/actions/customers";
import { getProducts, searchProducts } from "@/lib/actions/products";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Customer, Product, SaleItemFormData, Sale } from "@/lib/types/erp";
import { QuickPaymentModal } from "@/components/dashboard/quick-payment-modal";
import { VariantSelectorInSale } from "@/components/dashboard/variant-selector-in-sale";
import { getProductVariants } from "@/lib/actions/product-variants";

export default function NewSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    status: "completed" as "draft" | "completed" | "cancelled",
    sale_date: new Date().toISOString().split("T")[0],
    due_date: "",
    payment_method: "",
    notes: "",
    items: [] as SaleItemFormData[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [customersData, productsData] = await Promise.all([
      getCustomers(),
      getProducts(),
    ]);
    setCustomers(customersData);
    setProducts(productsData.filter((p) => p.is_active));
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_id: "",
          product_name: "",
          product_sku: "",
          quantity: 1,
          unit_price: 0,
          tax_rate: 21,
          discount_percent: 0,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = async (index: number, field: keyof SaleItemFormData, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product is selected, auto-fill data and load variants if needed
    if (field === "product_id" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].product_sku = product.sku || "";
        newItems[index].unit_price = product.price;
        newItems[index].tax_rate = product.tax_rate;
        
        // Reset variant selection when changing product
        newItems[index].variant_id = undefined;
        newItems[index].variant_name = undefined;
        
        // Load variants if product has them
        if (product.has_variants) {
          const variants = await getProductVariants(product.id);
          // Store variants in the product object for the selector
          const productIndex = products.findIndex((p) => p.id === value);
          if (productIndex !== -1) {
            const updatedProducts = [...products];
            updatedProducts[productIndex] = { ...product, variants };
            setProducts(updatedProducts);
          }
        }
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleVariantSelect = (index: number, variant: any) => {
    const newItems = [...formData.items];
    newItems[index].variant_id = variant.id;
    newItems[index].variant_name = variant.variant_name;
    setFormData({ ...formData, items: newItems });
  };

  const calculateItemTotal = (item: SaleItemFormData) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percent / 100);
    const subtotalAfterDiscount = subtotal - discount;
    const tax = subtotalAfterDiscount * (item.tax_rate / 100);
    return subtotalAfterDiscount + tax;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    formData.items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const discount = itemSubtotal * (item.discount_percent / 100);
      const subtotalAfterDiscount = itemSubtotal - discount;
      const itemTax = subtotalAfterDiscount * (item.tax_rate / 100);

      subtotal += subtotalAfterDiscount;
      taxAmount += itemTax;
    });

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      toast.error("Debes agregar al menos un item");
      return;
    }

    // Validar que productos con variantes tengan variante seleccionada
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      const product = products.find((p) => p.id === item.product_id);
      
      if (product?.has_variants && !item.variant_id) {
        toast.error(`Debes seleccionar una variante para ${product.name}`);
        return;
      }

      // Validar stock disponible de variante
      if (product?.has_variants && item.variant_id && product.variants) {
        const variant = product.variants.find((v) => v.id === item.variant_id);
        if (variant && item.quantity > variant.stock_quantity) {
          toast.error(
            `Stock insuficiente para ${product.name} - ${variant.variant_name}. Disponible: ${variant.stock_quantity}`
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      const result = await createSale(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success("Venta creada exitosamente");
        
        // Mostrar modal de pago solo si la venta está completada
        if (result.data.status === 'completed') {
          setCreatedSale(result.data);
          setShowPaymentModal(true);
        } else {
          // Si es borrador, redirigir directamente
          router.push("/dashboard/sales");
          router.refresh();
        }
      }
    } catch (error) {
      toast.error("Error al crear la venta");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    router.push("/dashboard/sales");
    router.refresh();
  };

  const handleModalClose = (open: boolean) => {
    setShowPaymentModal(open);
    if (!open && createdSale) {
      // Usuario cerró sin pagar, redirigir a lista
      router.push("/dashboard/sales");
      router.refresh();
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Venta</h2>
          <p className="text-muted-foreground">Registra una nueva venta</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Cliente</Label>
                  <Select
                    value={formData.customer_id || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customer_id: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
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
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sale_date">
                    Fecha de Venta <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sale_date"
                    type="date"
                    required
                    value={formData.sale_date}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
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
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Items de Venta
              </CardTitle>
              <Button type="button" onClick={addItem} size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Item
              </Button>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="relative text-center py-16 text-muted-foreground">
                  <div className="absolute inset-0 flex items-center justify-center opacity-5">
                    <ShoppingCart className="h-32 w-32" />
                  </div>
                  <p className="relative z-10">
                    No hay items. Haz clic en "Agregar Item" para comenzar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-4 relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>

                      <div className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-2 space-y-2">
                          <Label>Producto</Label>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) =>
                              updateItem(index, "product_id", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - $
                                  {product.price.toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Mostrar selector de variantes si el producto tiene variantes */}
                        {item.product_id && (() => {
                          const product = products.find((p) => p.id === item.product_id);
                          return product?.has_variants && product.variants ? (
                            <div className="md:col-span-2 space-y-2">
                              <VariantSelectorInSale
                                productId={product.id}
                                variants={product.variants}
                                onSelect={(variant) => handleVariantSelect(index, variant)}
                                selectedVariantId={item.variant_id}
                              />
                            </div>
                          ) : null;
                        })()}

                        <div className="space-y-2">
                          <Label>Cantidad</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Precio Unit.</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Desc. %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.discount_percent}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "discount_percent",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Total</Label>
                          <Input
                            value={calculateItemTotal(item).toFixed(2)}
                            disabled
                            className="font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.items.length > 0 && (
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">
                      ${totals.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuestos:</span>
                    <span className="font-semibold">
                      ${totals.taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/dashboard/sales">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading || formData.items.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Procesando..." : formData.status === "completed" ? "Crear y Pagar" : "Guardar Borrador"}
          </Button>
        </div>
      </form>

      {createdSale && (
        <QuickPaymentModal
          sale={createdSale}
          open={showPaymentModal}
          onOpenChange={handleModalClose}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
