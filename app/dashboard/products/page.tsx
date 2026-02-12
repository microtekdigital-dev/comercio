"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getUserPermissions } from "@/lib/utils/permissions";
import { canExportToExcel } from "@/lib/utils/plan-limits";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Plus, Package, Search, Filter, X, AlertTriangle, Download, FileSpreadsheet, FileText, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { exportProductsToExcel, exportProductsToCSV, exportProductsReportToPDF } from "@/lib/utils/export";
import { toast } from "sonner";
import { BulkAssignSuppliersDialog } from "@/components/dashboard/bulk-assign-suppliers-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Product, Category } from "@/lib/types/erp";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
    checkPermissions();
    checkExportPermissions();
  }, []);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanCreate(permissions.canCreateProducts);
  };

  const checkExportPermissions = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      const exportPermission = await canExportToExcel(profile.company_id);
      setCanExport(exportPermission.allowed);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter, typeFilter, lowStockFilter, activeFilter]);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts({
      search: search || undefined,
      categoryId: categoryFilter || undefined,
      type: typeFilter as any || undefined,
      lowStock: lowStockFilter || undefined,
      isActive: activeFilter,
    });
    setProducts(data);
    setLoading(false);
  };

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setTypeFilter("");
    setLowStockFilter(false);
    setActiveFilter(undefined);
  };

  const hasActiveFilters = search || categoryFilter || typeFilter || lowStockFilter || activeFilter !== undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const isLowStock = (product: Product) => {
    return product.track_inventory && product.stock_quantity <= product.min_stock_level;
  };

  const handleExportExcel = () => {
    try {
      exportProductsToExcel(products);
      toast.success("Productos exportados a Excel exitosamente");
    } catch (error) {
      toast.error("Error al exportar a Excel");
    }
  };

  const handleExportCSV = () => {
    try {
      exportProductsToCSV(products);
      toast.success("Productos exportados a CSV exitosamente");
    } catch (error) {
      toast.error("Error al exportar a CSV");
    }
  };

  const handleExportPDF = () => {
    try {
      const lowStockProducts = products.filter(isLowStock).length;
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
      
      exportProductsReportToPDF(
        products,
        {
          totalProducts: products.length,
          lowStockProducts,
          totalValue,
        },
        "Mi Empresa" // TODO: Get from company settings
      );
      toast.success("Reporte PDF generado exitosamente");
    } catch (error) {
      toast.error("Error al generar PDF");
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleBulkAssignSuccess = () => {
    setSelectedProducts([]);
    loadProducts();
  };

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Productos</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Gestiona tu catálogo de productos y servicios
          </p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          {canExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar a Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar a CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Reporte PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canCreate && (
            <Link href="/dashboard/products/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Package className="h-5 w-5" />
              Lista de Productos ({products.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, SKU o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos</SelectItem>
                    <SelectItem value="product">Producto</SelectItem>
                    <SelectItem value="service">Servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={activeFilter === undefined ? "all" : activeFilter ? "active" : "inactive"} 
                  onValueChange={(value) => {
                    if (value === "all") setActiveFilter(undefined);
                    else setActiveFilter(value === "active");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="low-stock"
                  checked={lowStockFilter}
                  onCheckedChange={setLowStockFilter}
                />
                <Label htmlFor="low-stock" className="cursor-pointer">
                  Solo stock bajo
                </Label>
              </div>

              <div className="flex items-end lg:col-span-2 sm:col-span-1">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-base md:text-lg font-semibold">No hay productos</h3>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                {hasActiveFilters
                  ? "No se encontraron productos con los filtros aplicados"
                  : "Comienza agregando tu primer producto"}
              </p>
              {!hasActiveFilters && (
                <Link href="/dashboard/products/new" className="inline-block w-full sm:w-auto">
                  <Button className="mt-4 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Producto
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <div key={product.id} className="relative">
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => handleSelectProduct(product.id)}
                      className="bg-background"
                    />
                  </div>
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="block"
                  >
                    <Card className="hover:bg-muted/50 transition-colors h-full">
                      <CardContent className="p-3 md:p-4">
                      {product.image_url && (
                        <div className="relative w-full aspect-video mb-2 md:mb-3 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold line-clamp-1 text-sm md:text-base">
                            {product.name}
                          </h3>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </p>
                          )}
                        </div>
                        {!product.is_active && (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </div>

                      {product.category && (
                        <Badge variant="outline" className="mb-2">
                          {product.category.name}
                        </Badge>
                      )}

                      {product.supplier && (
                        <Badge variant="outline" className="mb-2 ml-1">
                          {product.supplier.name}
                        </Badge>
                      )}
                      {!product.supplier && (
                        <span className="text-xs text-muted-foreground italic mb-2 block">
                          Sin proveedor
                        </span>
                      )}

                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2 md:mb-3">
                        {product.description || "Sin descripción"}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-base md:text-lg font-bold">
                            {formatCurrency(product.price)}
                          </p>
                          <Badge variant={product.type === "product" ? "default" : "secondary"}>
                            {product.type === "product" ? "Producto" : "Servicio"}
                          </Badge>
                        </div>

                        {product.track_inventory && (
                          <div className="text-right">
                            <p className="text-xs md:text-sm font-medium">
                              Stock: {product.stock_quantity}
                            </p>
                            {isLowStock(product) && (
                              <div className="flex items-center gap-1 text-xs text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="hidden sm:inline">Stock bajo</span>
                                <span className="sm:hidden">Bajo</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedProducts.length === products.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedProducts.length} seleccionado(s)
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowBulkAssignDialog(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Asignar Proveedor
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedProducts([])}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Assign Suppliers Dialog */}
      <BulkAssignSuppliersDialog
        open={showBulkAssignDialog}
        onOpenChange={setShowBulkAssignDialog}
        selectedProductIds={selectedProducts}
        onSuccess={handleBulkAssignSuccess}
      />
    </div>
  );
}
