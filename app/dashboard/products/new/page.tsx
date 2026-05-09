"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Category, Supplier, VariantType, ProductVariantFormData } from "@/lib/types/erp";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { ProductVariantSelector } from "@/components/dashboard/product-variant-selector";
import { VariantStockTable } from "@/components/dashboard/variant-stock-table";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [variantType, setVariantType] = useState<VariantType>("none");
  const [variants, setVariants] = useState<ProductVariantFormData[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
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

  useEffect(() => {
    getCategories().then(setCategories);
    getSuppliers().then(d => setSuppliers(d.filter(s => s.status === "active")));
    getCompanySettings().then(s => { if (s) setCurrencySymbol(s.currency_symbol); });
  }, []);

  const handleVariantTypeChange = useCallback((type: VariantType) => {
    setVariantType(type);
    setFormData(p => ({ ...p, has_variants: type !== "none", variant_type: type !== "none" ? type : undefined }));
  }, []);

  const handleVariantsChange = useCallback((v: ProductVariantFormData[]) => {
    setVariants(v);
    setFormData(p => ({ ...p, variants: v }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("El nombre es requerido"); return; }
    if (formData.price <= 0) { toast.error("El precio debe ser mayor a 0"); return; }
    if (formData.has_variants && formData.variants.length === 0) { toast.error("Agregá al menos una variante"); return; }
    setLoading(true);
    try {
      const result = await createProduct(formData);
      if (result.error) { toast.error(result.error); }
      else { toast.success("Producto creado"); router.push("/dashboard/products"); router.refresh(); }
    } catch { toast.error("Error al crear el producto"); }
    finally { setLoading(false); }
  };

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-xs font-bold text-black block mb-0.5";
  const set = (k: string, v: any) => setFormData(p => ({ ...p, [k]: v }));

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-3">
      <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
        <span className="text-xs font-bold">{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">📦 Nuevo Producto</span>
          <Link href="/dashboard/products" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#d4d0c8] p-4 space-y-3">
          <Section title="Información Básica">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={l}>Nombre * <span className="font-normal text-gray-500">({formData.name.length}/35)</span></label>
                <input required maxLength={35} value={formData.name} onChange={e => set("name", e.target.value)} placeholder="Nombre del producto" className={f} />
              </div>
              <div>
                <label className={l}>SKU / Código</label>
                <input value={formData.sku} onChange={e => set("sku", e.target.value)} placeholder="PROD-001" className={f} />
              </div>
              <div>
                <label className={l}>Código de Barras</label>
                <input value={formData.barcode} onChange={e => set("barcode", e.target.value)} placeholder="7790001234567" className={f} />
              </div>
              <div>
                <label className={l}>Tipo</label>
                <select value={formData.type} onChange={e => set("type", e.target.value)} className={f}>
                  <option value="product">Producto</option>
                  <option value="service">Servicio</option>
                </select>
              </div>
              <div>
                <label className={l}>Categoría</label>
                <select value={formData.category_id} onChange={e => set("category_id", e.target.value)} className={f}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={l}>Proveedor</label>
                <select value={formData.supplier_id} onChange={e => set("supplier_id", e.target.value)} className={f}>
                  <option value="">Sin proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={l}>Descripción</label>
                <textarea value={formData.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Descripción del producto..." className={f + " resize-none"} />
              </div>
            </div>
          </Section>

          <Section title="Precios">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Precio de Venta * ({currencySymbol})</label>
                <input type="number" step="0.01" min="0" required value={formData.price} onChange={e => set("price", parseFloat(e.target.value) || 0)} className={f} />
              </div>
              <div>
                <label className={l}>Costo ({currencySymbol})</label>
                <input type="number" step="0.01" min="0" value={formData.cost} onChange={e => set("cost", parseFloat(e.target.value) || 0)} className={f} />
              </div>
              <div>
                <label className={l}>Moneda</label>
                <select value={formData.currency} onChange={e => set("currency", e.target.value)} className={f}>
                  <option value="ARS">ARS - Peso Argentino</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className={l}>IVA (%)</label>
                <input type="number" step="0.01" min="0" max="100" value={formData.tax_rate} onChange={e => set("tax_rate", parseFloat(e.target.value) || 0)} className={f} />
              </div>
            </div>
          </Section>

          <Section title="Inventario">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="track_inventory" checked={formData.track_inventory} onChange={e => set("track_inventory", e.target.checked)} className="border border-[#808080]" />
              <label htmlFor="track_inventory" className="text-xs font-bold cursor-pointer">Controlar Stock</label>
            </div>
            {formData.track_inventory && !formData.has_variants && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={l}>Cantidad en Stock</label>
                  <input type="number" min="0" value={formData.stock_quantity} onChange={e => set("stock_quantity", parseInt(e.target.value) || 0)} className={f} />
                </div>
                <div>
                  <label className={l}>Stock Mínimo</label>
                  <input type="number" min="0" value={formData.min_stock_level} onChange={e => set("min_stock_level", parseInt(e.target.value) || 0)} className={f} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-[#808080]">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => set("is_active", e.target.checked)} className="border border-[#808080]" />
              <label htmlFor="is_active" className="text-xs font-bold cursor-pointer">Producto Activo</label>
            </div>
          </Section>

          {formData.track_inventory && (
            <Section title="Variantes">
              <ProductVariantSelector value={variantType} onChange={handleVariantTypeChange} />
            </Section>
          )}

          {formData.track_inventory && formData.has_variants && (
            <Section title="Stock por Variante">
              <VariantStockTable variants={variants} onChange={handleVariantsChange} variantType={variantType} />
            </Section>
          )}

          <Section title="Imagen">
            <ImageUpload currentImageUrl={formData.image_url} onImageUrlChange={url => set("image_url", url || "")} />
          </Section>

          <div className="flex justify-end gap-2 pt-1">
            <Link href="/dashboard/products" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</Link>
            <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
