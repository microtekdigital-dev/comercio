"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getProduct, updateProduct, deleteProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getProductStockHistory } from "@/lib/actions/stock-movements";
import { getProductPriceHistory } from "@/lib/actions/price-changes";
import { getUserPermissions } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, History, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Product, Category, StockMovement, PriceChange } from "@/lib/types/erp";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { StockHistoryTable } from "@/components/dashboard/stock-history-table";
import { ProductPriceHistory } from "@/components/dashboard/product-price-history";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceChange[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    type: "product" as "product" | "service",
    category_id: "",
    price: 0,
    cost: 0,
    currency: "ARS",
    tax_rate: 21,
    stock_quantity: 0,
    min_stock_level: 0,
    track_inventory: true,
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    loadData();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanEdit(permissions.canEditProducts);
    setCanDelete(permissions.canDeleteProducts);
  };

  const loadData = async () => {
    const [productData, categoriesData, historyData, priceHistoryData] = await Promise.all([
      getProduct(params.id as string),
      getCategories(),
      getProductStockHistory(params.id as string),
      getProductPriceHistory(params.id as string),
    ]);

    if (productData) {
      setProduct(productData);
      setCategories(categoriesData);
      setStockHistory(historyData);
      setPriceHistory(priceHistoryData);
      setFormData({
        name: productData.name,
        sku: productData.sku || "",
        description: productData.description || "",
        type: productData.type,
        category_id: productData.category_id || "",
        price: productData.price,
        cost: productData.cost,
        currency: productData.currency,
        tax_rate: productData.tax_rate,
        stock_quantity: productData.stock_quantity,
        min_stock_level: productData.min_stock_level,
        track_inventory: productData.track_inventory,
        is_active: productData.is_active,
        image_url: productData.image_url || "",
      });
    } else {
      toast.error("Producto no encontrado");
      router.push("/dashboard/products");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProduct(params.id as string, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Producto actualizado exitosamente");
        router.push("/dashboard/products");
        router.refresh();
      }
    } catch (error) {
      toast.error("Error al actualizar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteProduct(params.id as string);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Producto eliminado exitosamente");
        router.push("/dashboard/products");
        router.refresh();
      }
    } catch (error) {
      toast.error("Error al eliminar el producto");
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="flex-1 p-8">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {canEdit ? "Editar Producto" : "Ver Producto"}
            </h2>
            <p className="text-muted-foreground">
              {canEdit ? "Actualiza los datos del producto" : "Detalles del producto"}
            </p>
          </div>
        </div>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el producto.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="price-history">
            <DollarSign className="mr-2 h-4 w-4" />
            Historial de Precios
          </TabsTrigger>
          {product.track_inventory && (
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Historial de Stock
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details">
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
                    disabled={!canEdit}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.name.length}/35 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Código</Label>
                  <Input
                    id="sku"
                    disabled={!canEdit}
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    disabled={!canEdit}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {canEdit && (
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
          )}

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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
                  checked={formData.track_inventory}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, track_inventory: checked })
                  }
                />
              </div>

              {formData.track_inventory && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Cantidad en Stock</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      disabled={!canEdit}
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
                      disabled={!canEdit}
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
                  disabled={!canEdit}
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Link href="/dashboard/products">
              <Button type="button" variant="outline">
                {canEdit ? "Cancelar" : "Volver"}
              </Button>
            </Link>
            {canEdit && (
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            )}
          </div>
        </form>
      </TabsContent>

      <TabsContent value="price-history">
        <ProductPriceHistory 
          changes={priceHistory}
          currencySymbol={product.currency === "USD" ? "$" : product.currency === "EUR" ? "€" : "$"}
        />
      </TabsContent>

      {product.track_inventory && (
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos de Stock</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registro completo de todos los movimientos de inventario para este producto
              </p>
            </CardHeader>
            <CardContent>
              <StockHistoryTable movements={stockHistory} />
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
    </div>
  );
}
