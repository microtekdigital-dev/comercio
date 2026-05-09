"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getUserPermissions } from "@/lib/utils/permissions";
import { canExportToExcel } from "@/lib/utils/plan-limits";
import { createClient } from "@/lib/supabase/client";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import { Plus, Package, Search, Filter, X, AlertTriangle, Download, FileSpreadsheet, FileText, Users, Upload, Loader2 } from "lucide-react";
import { CsvImportModal } from "@/components/dashboard/csv-import-modal";
import Link from "next/link";
import { exportProductsToExcel, exportProductsToCSV, exportProductsReportToPDF } from "@/lib/utils/export";
import { toast } from "sonner";
import { BulkAssignSuppliersDialog } from "@/components/dashboard/bulk-assign-suppliers-dialog";
import { ProductVariantBadge } from "@/components/dashboard/product-variant-badge";
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
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyPosition, setCurrencyPosition] = useState<"before" | "after">("before");

  useEffect(() => {
    loadCategories();
    loadProducts();
    checkPermissions();
    checkExportPermissions();
    loadCurrencySettings();
  }, []);

  useEffect(() => { loadProducts(); }, [search, categoryFilter, typeFilter, lowStockFilter, activeFilter]);

  const loadCurrencySettings = async () => {
    const settings = await getCompanySettings();
    if (settings) { setCurrencySymbol(settings.currency_symbol); setCurrencyPosition(settings.currency_position); }
  };
  const checkPermissions = async () => { const p = await getUserPermissions(); setCanCreate(p.canCreateProducts); };
  const checkExportPermissions = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (profile?.company_id) { const ep = await canExportToExcel(profile.company_id); setCanExport(ep.allowed); }
  };
  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts({ search: search || undefined, categoryId: categoryFilter || undefined, type: typeFilter as any || undefined, lowStock: lowStockFilter || undefined, isActive: activeFilter });
    setProducts(data); setLoading(false);
  };
  const loadCategories = async () => { const data = await getCategories(); setCategories(data); };
  const clearFilters = () => { setSearch(""); setCategoryFilter(""); setTypeFilter(""); setLowStockFilter(false); setActiveFilter(undefined); };
  const hasActiveFilters = search || categoryFilter || typeFilter || lowStockFilter || activeFilter !== undefined;
  const formatPrice = (amount: number) => formatCompanyCurrency(amount, { currency_symbol: currencySymbol, currency_position: currencyPosition });
  const isLowStock = (product: Product) => {
    if (!product.track_inventory) return false;
    if (product.has_variants && product.variants) return product.variants.some(v => v.is_active && v.stock_quantity <= v.min_stock_level);
    return product.stock_quantity <= product.min_stock_level;
  };
  const getTotalStock = (product: Product) => {
    if (product.has_variants && product.variants) return product.variants.filter(v => v.is_active).reduce((s, v) => s + v.stock_quantity, 0);
    return product.stock_quantity;
  };
  const handleSelectProduct = (id: string) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = () => setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.id));

  return (
    <div className="space-y-3 text-black select-none">

      {/* Window: header */}
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">📦 Productos ({products.length})</span>
          <div className="flex gap-1">
            {canExport && (
              <div className="relative group">
                <button className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
                  <Download className="h-3 w-3" /> Exportar ▾
                </button>
                <div className="absolute right-0 top-full z-50 hidden group-hover:block bg-[#d4d0c8] border-2 border-[#808080] shadow-[2px_2px_0px_#000] min-w-[160px]">
                  <button onClick={() => { try { exportProductsToExcel(products); toast.success("Exportado a Excel"); } catch { toast.error("Error"); } }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[#000080] hover:text-white text-left"><FileSpreadsheet className="h-3 w-3" /> Excel</button>
                  <button onClick={() => { try { exportProductsToCSV(products); toast.success("Exportado a CSV"); } catch { toast.error("Error"); } }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[#000080] hover:text-white text-left"><FileSpreadsheet className="h-3 w-3" /> CSV</button>
                  <button onClick={() => { try { exportProductsReportToPDF(products, { totalProducts: products.length, lowStockProducts: products.filter(isLowStock).length, totalValue: products.reduce((s, p) => s + p.price * p.stock_quantity, 0) }, "Mi Empresa"); toast.success("PDF generado"); } catch { toast.error("Error"); } }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[#000080] hover:text-white text-left"><FileText className="h-3 w-3" /> PDF</button>
                </div>
              </div>
            )}
            {canCreate && (
              <>
                <button onClick={() => setShowCsvImportModal(true)} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
                  <Upload className="h-3 w-3" /> CSV
                </button>
                <Link href="/dashboard/products/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Nuevo
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Search + filters bar */}
        <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <span className="text-xs font-bold">Buscar:</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nombre, SKU..."
              className="flex-1 border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1"
          >
            <Filter className="h-3 w-3" /> Filtros
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-red-700">
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-[#000080]">Categoría</span>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="">Todas</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-[#000080]">Tipo</span>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="">Todos</option>
                <option value="product">Producto</option>
                <option value="service">Servicio</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-[#000080]">Estado</span>
              <select value={activeFilter === undefined ? "all" : activeFilter ? "active" : "inactive"} onChange={e => { if (e.target.value === "all") setActiveFilter(undefined); else setActiveFilter(e.target.value === "active"); }} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
              <input type="checkbox" checked={lowStockFilter} onChange={e => setLowStockFilter(e.target.checked)} className="border border-[#808080]" />
              Stock bajo
            </label>
          </div>
        )}

        {/* Table */}
        <div className="bg-white overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[30px_1fr_100px_80px_80px_70px_80px_60px] border-b-2 border-[#808080] bg-[#d4d0c8]">
            <div className="px-2 py-1 border-r border-[#808080]">
              <input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0} onChange={handleSelectAll} className="border border-[#808080]" />
            </div>
            {["Producto", "Categoría", "SKU", "Precio", "Stock", "Tipo", ""].map((h, i) => (
              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <Package className="h-10 w-10 opacity-30" />
              <p className="text-sm">{hasActiveFilters ? "Sin resultados con los filtros aplicados" : "No hay productos"}</p>
              {!hasActiveFilters && canCreate && (
                <Link href="/dashboard/products/new" className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 mt-2">
                  <Plus className="h-3 w-3" /> Nuevo Producto
                </Link>
              )}
            </div>
          ) : (
            products.map((product, idx) => (
              <div key={product.id} className={`grid grid-cols-[30px_1fr_100px_80px_80px_70px_80px_60px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="px-2 py-1.5 border-r border-[#e0e0e0] group-hover:border-[#3333aa] flex items-center" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleSelectProduct(product.id)} className="border border-[#808080]" />
                </div>
                <Link href={`/dashboard/products/${product.id}`} className="contents">
                  <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    <div className="font-semibold truncate">{product.name}</div>
                    {!product.is_active && <span className="text-[10px] text-red-500 group-hover:text-red-300">Inactivo</span>}
                  </div>
                  <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                    {product.category?.name ?? "—"}
                  </div>
                  <div className="px-2 py-1.5 text-xs font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                    {product.sku ?? "—"}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    {formatPrice(product.price)}
                  </div>
                  <div className={`px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa] ${isLowStock(product) ? "text-red-600 group-hover:text-red-300 font-bold" : ""}`}>
                    {product.track_inventory ? (
                      <span className="flex items-center justify-center gap-1">
                        {isLowStock(product) && <AlertTriangle className="h-3 w-3" />}
                        {getTotalStock(product)}
                      </span>
                    ) : "∞"}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    {product.type === "product" ? "Prod." : "Serv."}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-center">
                    <span className="text-[#000080] group-hover:text-white underline">Editar</span>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] px-4 py-2 flex items-center gap-3">
            <span className="text-xs font-bold">{selectedProducts.length} seleccionado(s)</span>
            <button onClick={() => setShowBulkAssignDialog(true)} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
              <Users className="h-3 w-3" /> Asignar Proveedor
            </button>
            <button onClick={() => setSelectedProducts([])} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
              <X className="h-3 w-3" /> Cancelar
            </button>
          </div>
        </div>
      )}

      <BulkAssignSuppliersDialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog} selectedProductIds={selectedProducts} onSuccess={() => { setSelectedProducts([]); loadProducts(); }} />
      <CsvImportModal open={showCsvImportModal} onOpenChange={setShowCsvImportModal} onImportComplete={loadProducts} />
    </div>
  );
}
