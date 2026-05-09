"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getProduct, updateProduct, deleteProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getProductStockHistory } from "@/lib/actions/stock-movements";
import { getProductPriceHistory } from "@/lib/actions/price-changes";
import { getUserPermissions } from "@/lib/utils/permissions";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Product, Category, Supplier, StockMovement, PriceChange, VariantType, ProductVariantFormData } from "@/lib/types/erp";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { StockHistoryTable } from "@/components/dashboard/stock-history-table";
import { ProductPriceHistory } from "@/components/dashboard/product-price-history";
import { ProductVariantSelector } from "@/components/dashboard/product-variant-selector";
import { VariantStockTable } from "@/components/dashboard/variant-stock-table";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-3">
      <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
        <span className="text-xs font-bold">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceChange[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [variantType, setVariantType] = useState<VariantType>("none");
  const [variants, setVariants] = useState<ProductVariantFormData[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [tab, setTab] = useState<"details" | "prices" | "stock">("details");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formData, setFormData] = useState({
    name: "", sku: "", barcode: "", description: "",
    type: "product" as "product" | "service",
    category_id: "", supplier_id: "",
    price: 0, cost: 0, currency: "ARS", tax_rate: 21,
    stock_quantity: 0, min_stock_level: 0,
    track_inventory: true, is_active: true, image_url: "",
    has_variants: false, variant_type: undefined as VariantType | undefined,
    variants: [] as ProductVariantFormData[],
  });

  useEffect(() => { loadData(); checkPermissions(); getCompanySettings().then(s => { if (s) setCurrencySymbol(s.currency_symbol); }); }, []);

  const checkPermissions = async () => { const p = await getUserPermissions(); setCanEdit(p.canEditProducts); setCanDelete(p.canDeleteProducts); };

  const loadData = async () => {
    const [productData, cats, sups, hist, priceHist] = await Promise.all([
      getProduct(params.id as string), getCategories(), getSuppliers(),
      getProductStockHistory(params.id as string), getProductPriceHistory(params.id as string),
    ]);
    if (!productData) { toast.error("Producto no encontrado"); router.push("/dashboard/products"); return; }
    setProduct(productData); setCategories(cats); setSuppliers(sups.filter(s => s.status === "active"));
    setStockHistory(hist); setPriceHistory(priceHist);
    const hasVariants = productData.has_variants || false;
    const pvt = productData.variant_type || "none";
    setVariantType(pvt);
    if (hasVariants && productData.variants) {
      setVariants(productData.variants.map(v => ({ id: v.id, variant_name: v.variant_name, sku: v.sku || "", stock_quantity: v.stock_quantity, min_stock_level: v.min_stock_level, sort_order: v.sort_order })));
    }
    setFormData({
      name: productData.name, sku: productData.sku || "", barcode: productData.barcode || "",
      description: productData.description || "", type: productData.type,
      category_id: productData.category_id || "", supplier_id: productData.supplier_id || "",
      price: productData.price, cost: productData.cost, currency: productData.currency,
      tax_rate: productData.tax_rate, stock_quantity: productData.stock_quantity,
      min_stock_level: productData.min_stock_level, track_inventory: productData.track_inventory,
      is_active: productData.is_active, image_url: productData.image_url || "",
      has_variants: hasVariants, variant_type: hasVariants ? pvt : undefined,
      variants: hasVariants && productData.variants ? productData.variants.map(v => ({ id: v.id, variant_name: v.variant_name, sku: v.sku || "", stock_quantity: v.stock_quantity, min_stock_level: v.min_stock_level, sort_order: v.sort_order })) : [],
    });
  };

  const set = useCallback((k: string, v: any) => setFormData(p => ({ ...p, [k]: v })), []);

  const handleVariantTypeChange = useCallback((type: VariantType) => {
    if (product?.has_variants && type === "none" && product.variants?.some(v => v.stock_quantity > 0)) {
      toast.error("No se pueden desactivar las variantes mientras haya stock."); return;
    }
    setVariantType(type);
    setFormData(p => ({ ...p, has_variants: type !== "none", variant_type: type !== "none" ? type : undefined }));
  }, [product]);

  const handleVariantsChange = useCallback((v: ProductVariantFormData[]) => {
    setVariants(v); setFormData(p => ({ ...p, variants: v }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await updateProduct(params.id as string, formData);
      if (r.error) { toast.error(r.error); } else { toast.success("Producto actualizado"); router.push("/dashboard/products"); }
    } catch { toast.error("Error al actualizar"); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const r = await deleteProduct(params.id as string);
      if (r.error) { toast.error(r.error); } else { toast.success("Producto eliminado"); router.push("/dashboard/products"); }
    } catch { toast.error("Error al eliminar"); } finally { setLoading(false); setConfirmDelete(false); }
  };

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full disabled:bg-[#f0f0f0] disabled:text-gray-500";
  const l = "text-xs font-bold text-black block mb-0.5";

  if (!product) return (
    <div className="flex items-center justify-center py-16 gap-2 text-xs text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
    </div>
  );

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/products" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
            <span className="text-white text-sm font-bold">📦 {canEdit ? "Editar" : "Ver"} Producto — {product.name}</span>
          </div>
          {canDelete && (
            <button onClick={() => setConfirmDelete(true)} disabled={loading}
              className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] text-red-700 flex items-center gap-1 disabled:opacity-50">
              <Trash2 className="h-3 w-3" /> Eliminar
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#808080] bg-[#d4d0c8]">
          {[
            { id: "details" as const, label: "Detalles" },
            { id: "prices" as const, label: "💲 Historial Precios" },
            ...(product.track_inventory ? [{ id: "stock" as const, label: "📈 Historial Stock" }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 text-xs font-bold border-r border-[#808080] last:border-r-0 transition-none ${tab === t.id ? "bg-white border-b-2 border-b-white -mb-px" : "hover:bg-[#c0c0c0]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-[#d4d0c8] p-4">
          {/* Details tab */}
          {tab === "details" && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Section title="Información Básica">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className={l}>Nombre * <span className="font-normal text-gray-500">({formData.name.length}/35)</span></label>
                        <input required maxLength={35} disabled={!canEdit} value={formData.name} onChange={e => set("name", e.target.value)} className={f} />
                      </div>
                      <div><label className={l}>SKU / Código</label><input disabled={!canEdit} value={formData.sku} onChange={e => set("sku", e.target.value)} placeholder="PROD-001" className={f} /></div>
                      <div><label className={l}>Código de Barras</label><input disabled={!canEdit} value={formData.barcode} onChange={e => set("barcode", e.target.value)} placeholder="7790001234567" className={f} /></div>
                      <div>
                        <label className={l}>Tipo</label>
                        <select disabled={!canEdit} value={formData.type} onChange={e => set("type", e.target.value)} className={f}>
                          <option value="product">Producto</option>
                          <option value="service">Servicio</option>
                        </select>
                      </div>
                      <div>
                        <label className={l}>Categoría</label>
                        <select disabled={!canEdit} value={formData.category_id} onChange={e => set("category_id", e.target.value)} className={f}>
                          <option value="">Sin categoría</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={l}>Proveedor</label>
                        <select disabled={!canEdit} value={formData.supplier_id} onChange={e => set("supplier_id", e.target.value)} className={f}>
                          <option value="">Sin proveedor</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className={l}>Descripción</label>
                        <textarea disabled={!canEdit} value={formData.description} onChange={e => set("description", e.target.value)} rows={2} className={f + " resize-none"} />
                      </div>
                    </div>
                  </Section>
                </div>

                <Section title="Precios">
                  <div className="space-y-2">
                    <div><label className={l}>Precio de Venta * ({currencySymbol})</label><input type="number" step="0.01" min="0" required disabled={!canEdit} value={formData.price} onChange={e => set("price", parseFloat(e.target.value) || 0)} className={f} /></div>
                    <div><label className={l}>Costo ({currencySymbol})</label><input type="number" step="0.01" min="0" disabled={!canEdit} value={formData.cost} onChange={e => set("cost", parseFloat(e.target.value) || 0)} className={f} /></div>
                    <div>
                      <label className={l}>Moneda</label>
                      <select disabled={!canEdit} value={formData.currency} onChange={e => set("currency", e.target.value)} className={f}>
                        <option value="ARS">ARS - Peso Argentino</option>
                        <option value="USD">USD - Dólar</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>
                    <div><label className={l}>IVA (%)</label><input type="number" step="0.01" min="0" max="100" disabled={!canEdit} value={formData.tax_rate} onChange={e => set("tax_rate", parseFloat(e.target.value) || 0)} className={f} /></div>
                  </div>
                </Section>

                <Section title="Inventario">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="track_inventory" disabled={!canEdit} checked={formData.track_inventory} onChange={e => set("track_inventory", e.target.checked)} className="border border-[#808080]" />
                    <label htmlFor="track_inventory" className="text-xs font-bold cursor-pointer">Controlar Stock</label>
                  </div>
                  {formData.track_inventory && !formData.has_variants && (
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={l}>Cantidad en Stock</label><input type="number" min="0" disabled={!canEdit} value={formData.stock_quantity} onChange={e => set("stock_quantity", parseInt(e.target.value) || 0)} className={f} /></div>
                      <div><label className={l}>Stock Mínimo</label><input type="number" min="0" disabled={!canEdit} value={formData.min_stock_level} onChange={e => set("min_stock_level", parseInt(e.target.value) || 0)} className={f} /></div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#808080]">
                    <input type="checkbox" id="is_active" disabled={!canEdit} checked={formData.is_active} onChange={e => set("is_active", e.target.checked)} className="border border-[#808080]" />
                    <label htmlFor="is_active" className="text-xs font-bold cursor-pointer">Producto Activo</label>
                  </div>
                </Section>

                {canEdit && (
                  <div className="md:col-span-2">
                    <Section title="Imagen">
                      <ImageUpload currentImageUrl={formData.image_url} onImageUrlChange={url => set("image_url", url || "")} />
                    </Section>
                  </div>
                )}

                {formData.track_inventory && canEdit && (
                  <div className="md:col-span-2">
                    <Section title="Variantes">
                      <ProductVariantSelector value={variantType} onChange={handleVariantTypeChange} disabled={!canEdit} />
                    </Section>
                  </div>
                )}

                {formData.track_inventory && formData.has_variants && (
                  <div className="md:col-span-2">
                    <Section title="Stock por Variante">
                      {canEdit ? (
                        <VariantStockTable variants={variants} onChange={handleVariantsChange} variantType={variantType} readOnly={false} />
                      ) : (
                        <div className="overflow-x-auto">
                          <div className="grid grid-cols-[1fr_100px_80px_80px_100px] border-b-2 border-[#808080] bg-[#d4d0c8]">
                            {["Variante", "SKU", "Stock", "Mínimo", "Estado"].map((h, i) => (
                              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
                            ))}
                          </div>
                          {variants.map((v, idx) => (
                            <div key={v.id || idx} className={`grid grid-cols-[1fr_100px_80px_80px_100px] border-b border-[#e0e0e0] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                              <div className="px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0]">{v.variant_name}</div>
                              <div className="px-2 py-1.5 text-xs font-mono border-r border-[#e0e0e0]">{v.sku || "—"}</div>
                              <div className={`px-2 py-1.5 text-xs text-center font-bold border-r border-[#e0e0e0] ${v.stock_quantity <= v.min_stock_level ? "text-red-600" : "text-green-700"}`}>{v.stock_quantity}</div>
                              <div className="px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0] text-gray-500">{v.min_stock_level}</div>
                              <div className="px-2 py-1.5 text-xs text-center">
                                <span className={`font-bold ${v.stock_quantity === 0 ? "text-red-600" : v.stock_quantity <= v.min_stock_level ? "text-amber-700" : "text-green-700"}`}>
                                  {v.stock_quantity === 0 ? "Sin stock" : v.stock_quantity <= v.min_stock_level ? "Stock bajo" : "Disponible"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Link href="/dashboard/products" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
                  {canEdit ? "Cancelar" : "Volver"}
                </Link>
                {canEdit && (
                  <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                    {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar Cambios"}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Price history tab */}
          {tab === "prices" && (
            <ProductPriceHistory
              changes={priceHistory}
              currencySymbol={product.currency === "USD" ? "$" : product.currency === "EUR" ? "€" : "$"}
            />
          )}

          {/* Stock history tab */}
          {tab === "stock" && product.track_inventory && (
            <StockHistoryTable movements={stockHistory} />
          )}
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-sm">
            <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
              <span className="text-white text-sm font-bold">⚠ Eliminar Producto</span>
              <button onClick={() => setConfirmDelete(false)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm font-bold">¿Eliminar este producto?</p>
              <p className="text-xs text-gray-600">Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-2 pt-1 border-t border-[#808080]">
                <button onClick={() => setConfirmDelete(false)} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</button>
                <button onClick={handleDelete} disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] text-red-700 disabled:opacity-50 flex items-center gap-1">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "✕"} Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
