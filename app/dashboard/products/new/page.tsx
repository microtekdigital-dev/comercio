"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getSuppliers } from "@/lib/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Category, Supplier } from "@/lib/types/erp";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { ProductVariantSelector } from "@/components/dashboard/product-variant-selector";
import { VariantStockTable } from "@/components/dashboard/variant-stock-table";
import type { VariantType, ProductVariantFormData } from "@/lib/types/erp";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [variantType, setVariantType] = useState<VariantType>('none');
  const [variants, setVariants] = useState<ProductVariantFormData[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    type: "product" as "product" | "service",
    category_id: "",
    supplier_id: "",
    price: 0,
    cost: 0,
    currency: "ARS",
    tax_rate: 21,
    stock_quantity: 0,
    min_stock_level: 0,
    track_inventory: true,
    is_active: true,
    image_url: "",
    has_variants: false,
    variant_type: undefined as VariantType | undefined,
    variants: [] as ProductVariantFormData[],
  });

  useEffect(() => {
    loadCategories();
    loadSuppliers();
  }, []);

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const loadSuppliers = async () => {
    const data = await getSuppliers();
    // Filtrar solo proveedores activos
    setSuppliers(data.filter(s => s.status === 'active'));
  };

  const handleVariantTypeChange = useCallback((type: VariantType) => {
    setVariantType(type);
    setFormData(prev => ({
      ...prev,
      has_variants: type !== 'none',
      variant_type: type !== 'none' ? type : undefined,
    }));
  }, []);

  const handleVariantsChange = useCallback((newVariants: ProductVariantFormData[]) => {
    setVariants(newVariants);
    setFormData(prev => ({
      ...prev,
      variants: newVariants,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de campos requeridos
    const missingFields: string[] = [];
    
    if (!formData.name.trim()) {
      missingFields.push("Nombre del producto");
    }
    
    if (formData.price <= 0) {
      missingFields.push("Precio de venta (debe ser mayor a 0)");
    }

    // Validar variantes si has_variants es true
    if (formData.has_variants) {
      if (!formData.variants || formData.variants.length === 0) {
        missingFields.push("Al menos una variante (cuando se activan variantes)");
      }
    }
    
    // Si hay campos faltantes, mostrar mensaje específico
    if (missingFields.length > 0) {
      const fieldsList = missingFields.join(", ");
      toast.error(`Faltan completar los siguientes campos: ${fieldsList}`);
      return;
    }
    
    setLoading(true);

    try {
      const result = await createProduct(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Producto creado exitosamente");
        router.push("/dashboard/products");
        router.refresh();
      }
    } catch (error) {
      toast.error("Error al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Producto</h2>
          <p className="text-muted-foreground">
            Completa los datos del producto o servicio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    maxLength={35}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nombre del producto"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.name.length}/35 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Código</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="PROD-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "product" | "service") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Producto</SelectItem>
                      <SelectItem value="service">Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Categoría</Label>
                  <Select
                    value={formData.category_id || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Proveedor</Label>
                  <Select
                    value={formData.supplier_id || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, supplier_id: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proveedor</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descripción del producto..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Imagen</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                currentImageUrl={formData.image_url}
                onImageUrlChange={(url) =>
                  setFormData({ ...formData, image_url: url || "" })
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio de Venta <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tasa de Impuesto (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="track_inventory">Controlar Stock</Label>
                <Switch
                  id="track_inventory"
                  checked={formData.track_inventory}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, track_inventory: checked })
                  }
                />
              </div>

              {formData.track_inventory && !formData.has_variants && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Cantidad en Stock</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock_quantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_stock_level">Stock Mínimo</Label>
                    <Input
                      id="min_stock_level"
                      type="number"
                      min="0"
                      value={formData.min_stock_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_stock_level: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <Label htmlFor="is_active">Producto Activo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {formData.track_inventory && (
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <ProductVariantSelector
                  value={variantType}
                  onChange={handleVariantTypeChange}
                />
              </CardContent>
            </Card>
          )}

          {formData.track_inventory && formData.has_variants && (
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <VariantStockTable
                  variants={variants}
                  onChange={handleVariantsChange}
                  variantType={variantType}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/dashboard/products">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Guardando..." : "Guardar Producto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
