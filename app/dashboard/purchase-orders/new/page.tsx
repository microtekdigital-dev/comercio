"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseOrder } from "@/lib/actions/purchase-orders";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getProducts, getProductsBySupplier } from "@/lib/actions/products";
import { getProductVariants } from "@/lib/actions/product-variants";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import type { PurchaseOrderFormData, PurchaseOrderItemFormData, Supplier, Product, ProductVariant, CompanySettings } from "@/lib/types/erp";
import { Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<Record<string, ProductVariant[]>>({});
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: "", order_date: new Date().toISOString().split("T")[0],
    expected_date: "", status: "pending", notes: "", items: [],
  });

  useEffect(() => {
    Promise.all([getSuppliers({ status: "active" }), getProducts({ isActive: true }), getCompanySettings()])
      .then(([s, p, cfg]) => { setSuppliers(s); setProducts(p); setSettings(cfg); });
  }, []);

  useEffect(() => {
    if (formData.supplier_id) {
      getProductsBySupplier(formData.supplier_id).then(setAvailableProducts);
    } else {
      setAvailableProducts(products);
    }
  }, [formData.supplier_id, products]);

  useEffect(() => {
    formData.items.forEach(async item => {
      if (item.product_id && !productVariants[item.product_id]) {
        const product = products.find(p => p.id === item.product_id);
        if (product?.has_variants) {
          const v = await getProductVariants(item.product_id);
          setProductVariants(prev => ({ ...prev, [item.product_id!]: v }));
        }
      }
    });
  }, [formData.items, products]);

  const addItem = useCallback(() => setFormData(p => ({ ...p, items: [...p.items, { product_id: "", product_name: "", product_sku: "", variant_id: "", variant_name: "", quantity: 1, unit_cost: 0, tax_rate: 21, discount_percent: 0 }] })), []);
  const removeItem = useCallback((i: number) => setFormData(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) })), []);

  const updateItem = useCallback((index: number, field: keyof PurchaseOrderItemFormData, value: any) => {
    setFormData(p => ({
      ...p,
      items: p.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "product_id" && value) {
          const prod = p.items[i].product_id !== value ? undefined : item;
          const foundProd = products.find(pr => pr.id === value);
          if (foundProd) { updated.product_name = foundProd.name; updated.product_sku = foundProd.sku || ""; updated.unit_cost = foundProd.cost; updated.variant_id = ""; updated.variant_name = ""; }
        }
        if (field === "variant_id" && value && item.product_id && productVariants[item.product_id]) {
          const v = productVariants[item.product_id].find(v => v.id === value);
          if (v) updated.variant_name = v.variant_name;
        }
        return updated;
      }),
    }));
  }, [products, productVariants]);

  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  }, []);

  const calcItem = (item: PurchaseOrderItemFormData) => {
    const sub = item.quantity * item.unit_cost;
    const disc = sub * (item.discount_percent / 100);
    const net = sub - disc;
    return net + net * (item.tax_rate / 100);
  };

  const totals = formData.items.reduce((acc, item) => {
    const sub = item.quantity * item.unit_cost * (1 - item.discount_percent / 100);
    const tax = sub * (item.tax_rate / 100);
    return { subtotal: acc.subtotal + sub, tax: acc.tax + tax, total: acc.total + sub + tax };
  }, { subtotal: 0, tax: 0, total: 0 });

  const fmt = (n: number) => settings ? formatCompanyCurrency(n, settings) : `$${n.toFixed(2)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id) { toast.error("Seleccioná un proveedor"); return; }
    if (formData.items.length === 0) { toast.error("Agregá al menos un producto"); return; }
    setLoading(true);
    for (let retries = 0; retries < 3; retries++) {
      try {
        const result = await createPurchaseOrder(formData);
        if (result.error) {
          if (result.error.includes("número de orden") && retries < 2) { await new Promise(r => setTimeout(r, 500 * Math.pow(2, retries))); continue; }
          toast.error(result.error); setLoading(false); return;
        }
        toast.success("Orden creada"); router.push("/dashboard/purchase-orders"); return;
      } catch { if (retries < 2) { await new Promise(r => setTimeout(r, 500 * Math.pow(2, retries))); continue; } toast.error("Error inesperado"); setLoading(false); return; }
    }
  };

  const f = "border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]";
  const fFull = f + " w-full";
  const l = "text-xs font-bold text-black block mb-0.5";

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">📋 Nueva Orden de Compra</span>
          <Link href="/dashboard/purchase-orders" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#d4d0c8] p-4 space-y-3">
          <Section title="Información General">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Proveedor *</label>
                <select required name="supplier_id" value={formData.supplier_id} onChange={handleFormChange} className={fFull}>
                  <option value="">Seleccionar...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={l}>Estado</label>
                <select name="status" value={formData.status} onChange={handleFormChange} className={fFull}>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                </select>
              </div>
              <div>
                <label className={l}>Fecha de Orden *</label>
                <input type="date" required name="order_date" value={formData.order_date} onChange={handleFormChange} className={fFull} />
              </div>
              <div>
                <label className={l}>Fecha Esperada</label>
                <input type="date" name="expected_date" value={formData.expected_date} onChange={handleFormChange} className={fFull} />
              </div>
              <div className="col-span-2">
                <label className={l}>Notas</label>
                <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={2} className={fFull + " resize-none"} />
              </div>
            </div>
          </Section>

          <Section title="Productos">
            <div className="flex justify-end mb-2">
              <button type="button" onClick={addItem} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
                <Plus className="h-3 w-3" /> Agregar Producto
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">Sin productos — hacé click en "Agregar Producto"</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#808080] bg-[#d4d0c8]">
                      {["Producto", "Variante", "Cant.", "Costo", "Desc.%", "IVA%", "Total", ""].map((h, i) => (
                        <th key={i} className="px-2 py-1 text-left font-bold border-r border-[#808080] last:border-r-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => {
                      const prod = products.find(p => p.id === item.product_id);
                      const vars = item.product_id ? productVariants[item.product_id] || [] : [];
                      return (
                        <tr key={idx} className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                          <td className="px-1 py-1 border-r border-[#e0e0e0]">
                            <select value={item.product_id || ""} onChange={e => updateItem(idx, "product_id", e.target.value)} className={f + " w-40"}>
                              <option value="">Manual</option>
                              {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {!item.product_id && <input placeholder="Nombre" value={item.product_name} onChange={e => updateItem(idx, "product_name", e.target.value)} className={f + " w-40 mt-1"} />}
                          </td>
                          <td className="px-1 py-1 border-r border-[#e0e0e0]">
                            {prod?.has_variants && vars.length > 0 ? (
                              <select value={item.variant_id || ""} onChange={e => updateItem(idx, "variant_id", e.target.value)} className={f + " w-28"}>
                                <option value="">Seleccionar</option>
                                {vars.map(v => <option key={v.id} value={v.id}>{v.variant_name}</option>)}
                              </select>
                            ) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-1 py-1 border-r border-[#e0e0e0]"><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} className={f + " w-16"} /></td>
                          <td className="px-1 py-1 border-r border-[#e0e0e0]"><input type="number" min="0" step="0.01" value={item.unit_cost} onChange={e => updateItem(idx, "unit_cost", parseFloat(e.target.value) || 0)} className={f + " w-24"} /></td>
                          <td className="px-1 py-1 border-r border-[#e0e0e0]"><input type="number" min="0" max="100" step="0.01" value={item.discount_percent} onChange={e => updateItem(idx, "discount_percent", parseFloat(e.target.value) || 0)} className={f + " w-16"} /></td>
                          <td className="px-1 py-1 border-r border-[#e0e0e0]"><input type="number" min="0" max="100" step="0.01" value={item.tax_rate} onChange={e => updateItem(idx, "tax_rate", parseFloat(e.target.value) || 0)} className={f + " w-16"} /></td>
                          <td className="px-2 py-1 text-right font-mono font-bold border-r border-[#e0e0e0]">{fmt(calcItem(item))}</td>
                          <td className="px-1 py-1 text-center">
                            <button type="button" onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800"><Trash2 className="h-3 w-3" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Totales">
            <div className="space-y-1 text-sm max-w-xs ml-auto">
              <div className="flex justify-between"><span>Subtotal:</span><span className="font-mono">{fmt(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span>IVA:</span><span className="font-mono">{fmt(totals.tax)}</span></div>
              <div className="flex justify-between font-bold text-base border-t border-[#808080] pt-1"><span>Total:</span><span className="font-mono">{fmt(totals.total)}</span></div>
            </div>
          </Section>

          <div className="flex justify-end gap-2 pt-1">
            <Link href="/dashboard/purchase-orders" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</Link>
            <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Creando...</> : "✔ Crear Orden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
