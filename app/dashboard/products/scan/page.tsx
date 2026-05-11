"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { searchPOSProducts } from "@/lib/actions/pos";
import { createProduct } from "@/lib/actions/products";
import { createStockAdjustment } from "@/lib/actions/stock-movements";
import { getCategories } from "@/lib/actions/categories";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { Loader2, Barcode, CheckCircle2, AlertTriangle, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Category, Supplier } from "@/lib/types/erp";

// ── Section fuera del componente ──────────────────────────────────────────────
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

const f = "border border-[#808080] bg-white text-black text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
const l = "text-xs font-bold text-black block mb-0.5";

type Mode = "scan" | "found" | "new";

export default function ScanProductPage() {
  const scanRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("scan");
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjusting, setAdjusting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", sku: "", barcode: "",
    price: 0, cost: 0, tax_rate: 21,
    category_id: "", supplier_id: "",
    stock_quantity: 0, min_stock_level: 0,
    track_inventory: true, is_active: true,
  });

  useEffect(() => {
    getCategories().then(setCategories);
    getSuppliers().then(d => setSuppliers(d.filter(s => s.status === "active")));
    getCompanySettings().then(s => { if (s) setCurrencySymbol(s.currency_symbol); });
  }, []);

  useEffect(() => {
    if (mode === "scan") setTimeout(() => scanRef.current?.focus(), 100);
    else if (mode === "new") setTimeout(() => nameRef.current?.focus(), 100);
    else if (mode === "found") setTimeout(() => qtyRef.current?.focus(), 100);
  }, [mode]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setForm(prev => ({
        ...prev,
        [name]: type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number" ? parseFloat(value) || 0 : value,
      }));
    },
    []
  );

  const resetToScan = useCallback(() => {
    setMode("scan");
    setScanInput("");
    setFoundProduct(null);
    setAdjustQty(1);
    setForm({
      name: "", sku: "", barcode: "",
      price: 0, cost: 0, tax_rate: 21,
      category_id: "", supplier_id: "",
      stock_quantity: 0, min_stock_level: 0,
      track_inventory: true, is_active: true,
    });
  }, []);

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    setLastScanned(code.trim());
    try {
      const results = await searchPOSProducts(code.trim());
      if (results.length > 0) {
        setFoundProduct(results[0]);
        setAdjustQty(1);
        setMode("found");
      } else {
        setForm(prev => ({ ...prev, barcode: code.trim() }));
        setMode("new");
      }
    } catch {
      toast.error("Error al buscar el producto");
    } finally {
      setScanning(false);
    }
  }, []);

  const handleScanKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleScan(scanInput);
        setScanInput("");
      }
    },
    [scanInput, handleScan]
  );

  // Ajustar stock del producto encontrado
  const handleAdjustStock = async (delta: number) => {
    if (!foundProduct) return;
    setAdjusting(true);
    try {
      const result = await createStockAdjustment({
        product_id: foundProduct.id,
        variant_id: undefined,
        movement_type: delta > 0 ? "adjustment_in" : "adjustment_out",
        quantity: Math.abs(delta),
        notes: `Ajuste por escáner`,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        const newStock = (foundProduct.stock_quantity ?? 0) + delta;
        setFoundProduct((prev: any) => ({ ...prev, stock_quantity: newStock }));
        setSavedCount(c => c + 1);
        toast.success(`Stock actualizado: ${newStock} unidades`);
        // Volver a escanear automáticamente
        resetToScan();
      }
    } catch {
      toast.error("Error al ajustar el stock");
    } finally {
      setAdjusting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es requerido"); return; }
    if (form.price <= 0) { toast.error("El precio debe ser mayor a 0"); return; }
    setSaving(true);
    try {
      const result = await createProduct({
        ...form,
        description: "",
        type: "product",
        currency: "ARS",
        image_url: "",
        has_variants: false,
        variant_type: undefined,
        variants: [],
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setSavedCount(c => c + 1);
        toast.success(`✔ "${form.name}" guardado`);
        resetToScan();
      }
    } catch {
      toast.error("Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 text-black select-none max-w-2xl mx-auto">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">
            🔍 Alta Rápida por Escáner
            {savedCount > 0 && (
              <span className="ml-2 bg-green-600 text-white text-[10px] px-1.5 py-0.5 font-bold">
                {savedCount} operación{savedCount !== 1 ? "es" : ""}
              </span>
            )}
          </span>
          <Link href="/dashboard/products" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <div className="bg-[#d4d0c8] p-4 space-y-3">

          {/* ── MODO ESCANEO ── */}
          {mode === "scan" && (
            <Section title="Esperando escaneo...">
              <div className="flex flex-col items-center gap-4 py-4">
                <Barcode className="h-16 w-16 text-gray-400" />
                <p className="text-xs text-gray-600 text-center">
                  Apuntá el escáner al código de barras del producto.<br />
                  Si el producto existe → podés ajustar el stock.<br />
                  Si no existe → se abre el formulario de alta.
                </p>
                <div className="w-full max-w-xs relative">
                  <input
                    ref={scanRef}
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    onKeyDown={handleScanKeyDown}
                    placeholder="Escanear o escribir código..."
                    className={f + " text-center text-lg font-mono tracking-widest pr-8"}
                    autoFocus
                    autoComplete="off"
                  />
                  {scanning && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
                  )}
                </div>
                {lastScanned && (
                  <p className="text-[10px] text-gray-500">Último: <span className="font-mono">{lastScanned}</span></p>
                )}
              </div>
            </Section>
          )}

          {/* ── PRODUCTO ENCONTRADO ── */}
          {mode === "found" && foundProduct && (
            <Section title="✔ Producto encontrado">
              {/* Info del producto */}
              <div className="flex items-start gap-3 p-2 bg-[#d4edda] border border-[#28a745]">
                <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{foundProduct.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-3">
                    {foundProduct.sku && <span>SKU: <span className="font-mono">{foundProduct.sku}</span></span>}
                    <span>Precio: <span className="font-mono font-bold">{currencySymbol}{Number(foundProduct.price).toFixed(2)}</span></span>
                    {foundProduct.track_inventory && (
                      <span>Stock actual: <span className={`font-mono font-bold ${foundProduct.stock_quantity <= 0 ? "text-red-700" : "text-green-700"}`}>
                        {foundProduct.stock_quantity}
                      </span></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ajuste de stock */}
              {foundProduct.track_inventory && (
                <div className="border-2 border-[#808080] bg-[#f5f5f5] p-3">
                  <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
                    <span className="text-xs font-bold">Ajustar Stock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={l + " shrink-0"}>Cantidad:</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAdjustQty(q => Math.max(1, q - 1))}
                        className="border border-[#808080] bg-[#d4d0c8] w-7 h-7 flex items-center justify-center font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        ref={qtyRef}
                        type="number"
                        min="1"
                        value={adjustQty}
                        onChange={e => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="border border-[#808080] bg-white text-black text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-20 text-center font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setAdjustQty(q => q + 1)}
                        className="border border-[#808080] bg-[#d4d0c8] w-7 h-7 flex items-center justify-center font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => handleAdjustStock(adjustQty)}
                        disabled={adjusting}
                        className="border border-[#808080] bg-[#d4edda] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#b8ddb8] disabled:opacity-50 flex items-center gap-1"
                      >
                        {adjusting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Sumar {adjustQty}
                      </button>
                      <button
                        onClick={() => handleAdjustStock(-adjustQty)}
                        disabled={adjusting}
                        className="border border-[#808080] bg-[#f8d7da] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#f1b0b7] disabled:opacity-50 flex items-center gap-1"
                      >
                        {adjusting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                        Restar {adjustQty}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Nuevo stock estimado: <span className="font-mono font-bold">{(foundProduct.stock_quantity ?? 0) + adjustQty}</span> (al sumar)
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-between pt-1">
                <Link
                  href={`/dashboard/products/${foundProduct.id}`}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]"
                >
                  ✏ Editar producto
                </Link>
                <button
                  onClick={resetToScan}
                  className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]"
                >
                  🔍 Escanear otro
                </button>
              </div>
            </Section>
          )}

          {/* ── NUEVO PRODUCTO ── */}
          {mode === "new" && (
            <>
              <div className="border-2 border-[#ffc107] bg-[#fff3cd] p-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-700 flex-shrink-0" />
                <span className="text-xs font-bold text-yellow-800">
                  Código <span className="font-mono">{form.barcode}</span> no encontrado — completá los datos para crear el producto
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <Section title="Datos del Producto">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={l}>Nombre *</label>
                      <input
                        ref={nameRef}
                        required
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Nombre del producto"
                        className={f}
                      />
                    </div>
                    <div>
                      <label className={l}>Código de Barras</label>
                      <input name="barcode" value={form.barcode} className={f + " font-mono bg-[#f0f0f0]"} readOnly />
                    </div>
                    <div>
                      <label className={l}>SKU / Código interno</label>
                      <input name="sku" value={form.sku} onChange={handleChange} placeholder="Opcional" className={f} />
                    </div>
                    <div>
                      <label className={l}>Precio de Venta * ({currencySymbol})</label>
                      <input type="number" name="price" step="0.01" min="0" required value={form.price || ""} onChange={handleChange} className={f} />
                    </div>
                    <div>
                      <label className={l}>Costo ({currencySymbol})</label>
                      <input type="number" name="cost" step="0.01" min="0" value={form.cost || ""} onChange={handleChange} className={f} />
                    </div>
                    <div>
                      <label className={l}>IVA (%)</label>
                      <input type="number" name="tax_rate" step="0.01" min="0" max="100" value={form.tax_rate} onChange={handleChange} className={f} />
                    </div>
                    <div>
                      <label className={l}>Categoría</label>
                      <select name="category_id" value={form.category_id} onChange={handleChange} className={f}>
                        <option value="">Sin categoría</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={l}>Proveedor</label>
                      <select name="supplier_id" value={form.supplier_id} onChange={handleChange} className={f}>
                        <option value="">Sin proveedor</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={l}>Stock inicial</label>
                      <input type="number" name="stock_quantity" min="0" value={form.stock_quantity} onChange={handleChange} className={f} />
                    </div>
                    <div>
                      <label className={l}>Stock mínimo</label>
                      <input type="number" name="min_stock_level" min="0" value={form.min_stock_level} onChange={handleChange} className={f} />
                    </div>
                  </div>
                </Section>

                <div className="flex justify-between gap-2">
                  <button type="button" onClick={resetToScan}
                    className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
                    ✕ Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                    {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar y escanear siguiente"}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
