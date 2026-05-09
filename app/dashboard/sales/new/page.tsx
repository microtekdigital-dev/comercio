"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSale } from "@/lib/actions/sales";
import { getCustomers } from "@/lib/actions/customers";
import { getProducts } from "@/lib/actions/products";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import { Plus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Customer, Product, SaleItemFormData, Sale, DiscountType } from "@/lib/types/erp";
import { calculateItemTotals, calculateSaleTotals, validateGlobalDiscount } from "@/lib/utils/discount-calculator";
import { QuickPaymentModal } from "@/components/dashboard/quick-payment-modal";
import { VariantSelectorInSale } from "@/components/dashboard/variant-selector-in-sale";
import { getProductVariants } from "@/lib/actions/product-variants";

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

export default function NewSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyPosition, setCurrencyPosition] = useState<"before" | "after">("before");
  const [formData, setFormData] = useState({
    customer_id: "",
    status: "completed" as "draft" | "completed" | "cancelled",
    sale_date: new Date().toISOString().split("T")[0],
    due_date: "",
    payment_method: "",
    notes: "",
    items: [] as SaleItemFormData[],
    global_discount_type: "percentage" as DiscountType,
    global_discount_value: 0,
  });

  useEffect(() => {
    Promise.all([getCustomers(), getProducts(), getCompanySettings()]).then(([c, p, s]) => {
      setCustomers(c);
      setProducts(p.filter(x => x.is_active));
      if (s) { setCurrencySymbol(s.currency_symbol); setCurrencyPosition(s.currency_position); }
    });
  }, []);

  const addItem = () => setFormData(prev => ({
    ...prev,
    items: [...prev.items, { product_id: "", product_name: "", product_sku: "", quantity: 1, unit_price: 0, tax_rate: 21, discount_percent: 0, discount_type: "percentage" as DiscountType, discount_fixed: 0 }],
  }));

  const removeItem = (index: number) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const updateItem = async (index: number, field: keyof SaleItemFormData, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "product_id" && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].product_sku = product.sku || "";
        newItems[index].unit_price = product.price;
        newItems[index].tax_rate = product.tax_rate;
        newItems[index].variant_id = undefined;
        newItems[index].variant_name = undefined;
        if (product.has_variants) {
          const variants = await getProductVariants(product.id);
          setProducts(prev => prev.map(p => p.id === value ? { ...p, variants } : p));
        }
      }
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleVariantSelect = (index: number, variant: any) => {
    const newItems = [...formData.items];
    newItems[index].variant_id = variant.id;
    newItems[index].variant_name = variant.variant_name;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calcItemTotal = (item: SaleItemFormData) => calculateItemTotals(item).total;

  const totals = (() => {
    if (formData.items.length === 0) return { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 };
    try {
      const t = calculateSaleTotals(formData.items, formData.global_discount_type, formData.global_discount_value);
      return { subtotal: t.subtotal, taxAmount: t.tax_amount, discountAmount: t.discount_amount, total: t.total };
    } catch {
      const subtotal = formData.items.reduce((s, i) => s + calculateItemTotals(i).subtotal_net, 0);
      const taxAmount = formData.items.reduce((s, i) => s + calculateItemTotals(i).tax_amount, 0);
      return { subtotal, taxAmount, discountAmount: 0, total: subtotal + taxAmount };
    }
  })();

  const fmt = (n: number) => formatCompanyCurrency(n, { currency_symbol: currencySymbol, currency_position: currencyPosition });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) { toast.error("Agregá al menos un item"); return; }
    for (const item of formData.items) {
      const product = products.find(p => p.id === item.product_id);
      if (product?.has_variants && !item.variant_id) { toast.error(`Seleccioná una variante para ${product.name}`); return; }
      if (product?.has_variants && item.variant_id && product.variants) {
        const variant = product.variants.find(v => v.id === item.variant_id);
        if (variant && item.quantity > variant.stock_quantity) { toast.error(`Stock insuficiente para ${product.name} - ${variant.variant_name}. Disponible: ${variant.stock_quantity}`); return; }
      }
    }
    setLoading(true);
    try {
      const result = await createSale({ ...formData });
      if (result.error) { toast.error(result.error); }
      else if (result.data) {
        toast.success("Venta creada");
        if (result.data.status === "completed") { setCreatedSale(result.data); setShowPaymentModal(true); }
        else { router.push("/dashboard/sales"); router.refresh(); }
      }
    } catch { toast.error("Error al crear la venta"); }
    finally { setLoading(false); }
  };

  const f = "border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-[10px] font-bold text-black block mb-0.5";

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🛒 Nueva Venta</span>
          <Link href="/dashboard/sales" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#d4d0c8] p-4 space-y-3">

          {/* Info general */}
          <Section title="Información General">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Cliente</label>
                <select value={formData.customer_id} onChange={e => setFormData(p => ({ ...p, customer_id: e.target.value }))} className={f}>
                  <option value="">Sin cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={l}>Estado</label>
                <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))} className={f}>
                  <option value="draft">Borrador</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className={l}>Fecha de Venta *</label>
                <input type="date" required value={formData.sale_date} onChange={e => setFormData(p => ({ ...p, sale_date: e.target.value }))} className={f} />
              </div>
              <div>
                <label className={l}>Fecha de Vencimiento</label>
                <input type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} className={f} />
              </div>
              <div className="col-span-2">
                <label className={l}>Notas</label>
                <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Notas adicionales..." className={f + " resize-none"} />
              </div>
            </div>
          </Section>

          {/* Items */}
          <Section title="Items de Venta">
            <div className="flex justify-end mb-2">
              <button type="button" onClick={addItem} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1">
                <Plus className="h-3 w-3" /> Agregar Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-500">
                <ShoppingCart className="h-8 w-8 opacity-30" />
                <p className="text-xs">Sin items — hacé click en "Agregar Item"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.items.map((item, index) => {
                  const product = products.find(p => p.id === item.product_id);
                  return (
                    <div key={index} className="border-2 border-[#808080] bg-[#f0f0f0] p-3 space-y-2 relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-[#000080]">Item {index + 1}</span>
                        <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800 text-xs font-bold">✕</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className={l}>Producto</label>
                          <select value={item.product_id} onChange={e => updateItem(index, "product_id", e.target.value)} className={f}>
                            <option value="">Seleccionar...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
                          </select>
                        </div>
                        {product?.has_variants && product.variants && (
                          <div className="col-span-2">
                            <VariantSelectorInSale
                              productId={product.id}
                              variants={product.variants}
                              onSelect={v => handleVariantSelect(index, v)}
                              selectedVariantId={item.variant_id}
                              productPrice={item.unit_price}
                              currencySymbol={currencySymbol}
                              currencyPosition={currencyPosition}
                            />
                          </div>
                        )}
                        <div>
                          <label className={l}>Cantidad</label>
                          <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(index, "quantity", parseFloat(e.target.value) || 0)} className={f} />
                        </div>
                        <div>
                          <label className={l}>Precio Unit.</label>
                          <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)} className={f} />
                        </div>
                        <div>
                          <label className={l}>Descuento</label>
                          <div className="flex gap-1">
                            <select value={item.discount_type ?? "percentage"} onChange={e => updateItem(index, "discount_type", e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none w-12">
                              <option value="percentage">%</option>
                              <option value="fixed">{currencySymbol}</option>
                            </select>
                            <input type="number" min="0" step="0.01"
                              value={item.discount_type === "fixed" ? (item.discount_fixed ?? 0) : (item.discount_percent ?? 0)}
                              onChange={e => { const v = parseFloat(e.target.value) || 0; updateItem(index, item.discount_type === "fixed" ? "discount_fixed" : "discount_percent", v); }}
                              className={f} />
                          </div>
                        </div>
                        <div>
                          <label className={l}>Total</label>
                          <input readOnly value={fmt(calcItemTotal(item))} className={f + " bg-[#f0f0f0] font-bold"} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totals */}
            {formData.items.length > 0 && (
              <div className="border-t-2 border-[#808080] pt-3 mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold shrink-0">Desc. global:</label>
                  <select value={formData.global_discount_type} onChange={e => setFormData(p => ({ ...p, global_discount_type: e.target.value as DiscountType }))} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none w-12">
                    <option value="percentage">%</option>
                    <option value="fixed">{currencySymbol}</option>
                  </select>
                  <input type="number" min="0" step="0.01" value={formData.global_discount_value} onChange={e => setFormData(p => ({ ...p, global_discount_value: parseFloat(e.target.value) || 0 }))} className="border border-[#808080] bg-white text-xs px-2 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none w-24 text-right font-mono" />
                </div>
                <div className="space-y-1 text-xs max-w-xs ml-auto">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-mono">{fmt(totals.subtotal)}</span></div>
                  {totals.discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Descuento:</span><span className="font-mono">-{fmt(totals.discountAmount)}</span></div>}
                  <div className="flex justify-between"><span className="text-gray-600">Impuestos:</span><span className="font-mono">{fmt(totals.taxAmount)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t-2 border-[#808080] pt-1"><span>Total:</span><span className="font-mono">{fmt(totals.total)}</span></div>
                </div>
              </div>
            )}
          </Section>

          <div className="flex justify-end gap-2 pt-1">
            <Link href="/dashboard/sales" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</Link>
            <button type="submit" disabled={loading || formData.items.length === 0}
              className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Procesando...</> : formData.status === "completed" ? "✔ Crear y Pagar" : "✔ Guardar Borrador"}
            </button>
          </div>
        </form>
      </div>

      {createdSale && (
        <QuickPaymentModal
          sale={createdSale}
          open={showPaymentModal}
          onOpenChange={(open) => { setShowPaymentModal(open); if (!open && createdSale) { router.push("/dashboard/sales"); router.refresh(); } }}
          onPaymentSuccess={() => { setShowPaymentModal(false); router.push("/dashboard/sales"); router.refresh(); }}
        />
      )}
    </div>
  );
}
