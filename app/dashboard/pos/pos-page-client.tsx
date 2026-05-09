"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchPOSProducts } from "@/lib/actions/pos";
import { getCustomers } from "@/lib/actions/customers";
import { createPOSSale, generatePOSTicket } from "@/lib/actions/pos";
import { usePOSCart } from "@/hooks/use-pos-cart";
import type { Customer } from "@/lib/types/erp";
import type { POSProductSearchResult } from "@/lib/types/pos";
import type { POSPayment } from "@/lib/types/pos";
import { PaymentModal } from "@/components/dashboard/pos/payment-modal";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceType = "consumidor_final" | "factura_a" | "factura_b";

const INVOICE_LABELS: Record<InvoiceType, string> = {
  consumidor_final: "Consumidor Final",
  factura_a: "Factura A",
  factura_b: "Factura B",
};

const IVA_LABELS: Record<InvoiceType, string> = {
  consumidor_final: "Consumidor Final",
  factura_a: "Resp. Inscripto",
  factura_b: "Monotributista",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface POSPageClientProps {
  currencySymbol: string;
  openingId: string;
  sellerName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, sym = "$") {
  return `${sym}${Number(n).toFixed(2)}`;
}

function todayStr() {
  return new Date().toLocaleDateString("es-AR");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function POSPageClient({ currencySymbol, openingId, sellerName }: POSPageClientProps) {
  const { cart, addItem, updateQuantity, removeItem, applyDiscount, clearCart } = usePOSCart();

  // Invoice header state
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("consumidor_final");
  const [invoiceNumber] = useState("0001");

  // Customer state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerDropOpen, setCustomerDropOpen] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  // Product search state
  const [codeInput, setCodeInput] = useState("");
  const [stockAlert, setStockAlert] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Payment / sale state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; number: string } | null>(null);
  const [printingTicket, setPrintingTicket] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);

  // Focus code input on mount
  useEffect(() => {
    codeRef.current?.focus();
  }, []);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setCustomerDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Customer search ──────────────────────────────────────────────────────────

  const searchCustomers = useCallback(async (q: string) => {
    setLoadingCustomer(true);
    try {
      const results = await getCustomers({ search: q || undefined, status: "active" });
      setCustomerResults(results);
    } finally {
      setLoadingCustomer(false);
    }
  }, []);

  useEffect(() => {
    if (!customerDropOpen) return;
    const t = setTimeout(() => searchCustomers(customerSearch), 300);
    return () => clearTimeout(t);
  }, [customerSearch, customerDropOpen, searchCustomers]);

  // ── Product search by code ───────────────────────────────────────────────────

  const handleCodeEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = codeInput.trim();
    if (!code) return;

    setSearching(true);
    setStockAlert(null);
    try {
      const results = await searchPOSProducts(code);
      if (results.length === 0) {
        toast.error(`No se encontró producto: "${code}"`);
        setCodeInput("");
        return;
      }
      const product = results[0];

      // Stock alert
      if (product.track_inventory) {
        if (product.stock_quantity <= 0) {
          setStockAlert(`${product.name.toUpperCase()} — Sin stock`);
        } else if (product.stock_quantity <= product.min_stock_level) {
          setStockAlert(
            `${product.name.toUpperCase()} Por debajo del Stock Mínimo - Actualmente hay ${product.stock_quantity}`
          );
        } else {
          setStockAlert(null);
        }
      }

      addItem(product);
      setCodeInput("");
    } finally {
      setSearching(false);
      codeRef.current?.focus();
    }
  };

  // ── Payment ──────────────────────────────────────────────────────────────────

  const handleConfirmPayment = async (payments: POSPayment[]) => {
    setProcessing(true);
    try {
      const result = await createPOSSale({
        customer_id: customer?.id ?? null,
        items: cart.items,
        payments,
        discount_type: cart.discount_type,
        discount_value: cart.discount_value,
        notes: null,
        opening_id: openingId,
        invoice_type: invoiceType,
      });

      if (!result.success) {
        toast.error(result.error ?? "Error al procesar la venta");
        return;
      }

      setPaymentOpen(false);
      clearCart();
      setCustomer(null);
      setStockAlert(null);
      setLastSale({ id: result.sale_id ?? "", number: result.sale_number ?? "" });
      toast.success(`Venta #${result.sale_number} completada`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintTicket = async () => {
    if (!lastSale?.id) return;
    setPrintingTicket(true);
    try {
      const result = await generatePOSTicket(lastSale.id);
      if (!result.success || !result.ticket_html) {
        toast.error(result.error ?? "Error al generar el ticket");
        return;
      }
      const win = window.open("", "_blank", "width=400,height=600");
      if (!win) { toast.error("Permitir ventanas emergentes"); return; }
      win.document.write(`<!DOCTYPE html><html><head><title>Ticket</title><style>body{margin:0;padding:0;}</style></head><body>${result.ticket_html}</body></html>`);
      win.document.close();
      win.focus();
      win.print();
    } finally {
      setPrintingTicket(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const isEmpty = cart.items.length === 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#d4d0c8] font-sans select-none overflow-hidden">

      {/* ══ Title bar ══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between bg-[#000080] px-2 py-1 shrink-0">
        <span className="text-white text-sm font-bold tracking-wide">🧾 Venta de Mercadería</span>
        <div className="flex gap-1">
          <Link
            href="/dashboard"
            className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0] leading-none"
            title="Volver al dashboard"
          >
            ✕
          </Link>
        </div>
      </div>

      {/* ══ Main window ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden border-2 border-[#808080] bg-[#d4d0c8]">

        {/* ── Row 1: Tipo factura / Número / Vendedor / Fecha ── */}
        <div className="flex items-center gap-4 px-3 py-2 border-b border-[#808080] bg-[#d4d0c8] shrink-0">
          {/* Tipo de comprobante */}
          <div className="flex items-center gap-1">
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
              className="border border-[#808080] bg-white text-sm px-1 py-0.5 font-bold shadow-[inset_1px_1px_2px_#808080] focus:outline-none"
            >
              <option value="consumidor_final">Consumidor Final</option>
              <option value="factura_a">Factura A</option>
              <option value="factura_b">Factura B</option>
            </select>
          </div>

          {/* Número */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">N°</span>
            <input
              readOnly
              value={invoiceNumber}
              className="w-20 border border-[#808080] bg-[#f0f0f0] text-sm px-1 py-0.5 text-center shadow-[inset_1px_1px_2px_#808080]"
            />
          </div>

          {/* Vendedor */}
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm font-bold">Vendedor</span>
            <input
              readOnly
              value={sellerName}
              className="flex-1 border border-[#808080] bg-[#f0f0f0] text-sm px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]"
            />
          </div>

          {/* Fecha */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">Fecha</span>
            <input
              readOnly
              value={todayStr()}
              className="w-28 border border-[#808080] bg-[#f0f0f0] text-sm px-1 py-0.5 text-center shadow-[inset_1px_1px_2px_#808080]"
            />
          </div>
        </div>

        {/* ── Row 2: Datos del cliente ── */}
        <div className="grid grid-cols-[80px_1fr_1fr_140px_160px] gap-x-2 px-3 py-1.5 border-b border-[#808080] bg-[#d4d0c8] shrink-0 items-end">
          {/* Cód Cliente */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#000080]">Cód Cliente</span>
            <input
              readOnly
              value={customer?.id?.slice(0, 6) ?? ""}
              className="w-full border border-[#808080] bg-[#f0f0f0] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]"
            />
          </div>

          {/* Nombre */}
          <div className="flex flex-col gap-0.5 relative" ref={customerRef}>
            <span className="text-xs font-bold text-[#000080]">Nombre</span>
            <input
              value={customer ? customer.name : customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setCustomer(null);
                setCustomerDropOpen(true);
              }}
              onFocus={() => setCustomerDropOpen(true)}
              placeholder="Consumidor Final"
              className="w-full border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
            />
            {/* Dropdown */}
            {customerDropOpen && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#808080] shadow-md max-h-40 overflow-y-auto">
                <div
                  className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer border-b border-[#d4d0c8]"
                  onClick={() => { setCustomer(null); setCustomerSearch(""); setCustomerDropOpen(false); }}
                >
                  — Consumidor Final —
                </div>
                {loadingCustomer ? (
                  <div className="px-2 py-1 text-xs text-gray-500">Buscando...</div>
                ) : customerResults.map((c) => (
                  <div
                    key={c.id}
                    className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer"
                    onClick={() => { setCustomer(c); setCustomerSearch(""); setCustomerDropOpen(false); }}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dirección */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#000080]">Dirección</span>
            <input
              readOnly
              value={customer?.address ?? ""}
              className="w-full border border-[#808080] bg-[#f0f0f0] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]"
            />
          </div>

          {/* CUIT/DNI */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#000080]">Cuit/DNI</span>
            <input
              readOnly
              value={customer?.document_number ?? ""}
              className="w-full border border-[#808080] bg-[#f0f0f0] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]"
            />
          </div>

          {/* Condición IVA */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#000080]">Condición IVA</span>
            <input
              readOnly
              value={IVA_LABELS[invoiceType]}
              className="w-full border border-[#808080] bg-[#f0f0f0] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]"
            />
          </div>
        </div>

        {/* ── Row 3: Búsqueda por código ── */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#808080] bg-[#d4d0c8] shrink-0">
          <span className="text-sm font-bold">Código:</span>
          <input
            ref={codeRef}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={handleCodeEnter}
            placeholder="Escanear o escribir código → Enter"
            className="w-56 border border-[#808080] bg-white text-sm px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
            disabled={searching}
          />
          {searching && <Loader2 className="h-4 w-4 animate-spin text-[#000080]" />}
          {stockAlert && (
            <span className="text-sm text-red-600 font-semibold">{stockAlert}</span>
          )}
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-hidden flex flex-col mx-3 my-2 border border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080]">
          {/* Table header */}
          <div className="grid grid-cols-[50px_80px_1fr_120px_100px_70px_100px_40px] border-b-2 border-[#808080] bg-[#d4d0c8] shrink-0">
            {["Cant", "Cód.", "Descripción", "Marca", "Precio", "Desc.", "Total", ""].map((h, i) => (
              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">
                {h}
              </div>
            ))}
          </div>

          {/* Table body */}
          <div className="flex-1 overflow-y-auto">
            {isEmpty ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Sin artículos — escaneá un código para comenzar
              </div>
            ) : (
              cart.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-[50px_80px_1fr_120px_100px_70px_100px_40px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}
                >
                  {/* Cant */}
                  <div className="px-1 py-1 border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v > 0) updateQuantity(item.id, v);
                      }}
                      className="w-full text-center text-xs bg-transparent focus:outline-none focus:bg-white focus:text-black"
                    />
                  </div>
                  {/* Cód */}
                  <div className="px-2 py-1 text-xs font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                    {item.product_sku ?? "—"}
                  </div>
                  {/* Descripción */}
                  <div className="px-2 py-1 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                    {item.product_name}
                    {item.variant_name && <span className="ml-1 opacity-70">({item.variant_name})</span>}
                  </div>
                  {/* Marca — vacío por ahora */}
                  <div className="px-2 py-1 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]" />
                  {/* Precio */}
                  <div className="px-2 py-1 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    {fmt(item.unit_price, currencySymbol)}
                  </div>
                  {/* Desc */}
                  <div className="px-2 py-1 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    {item.discount_percent > 0 ? `${item.discount_percent}%` : "0"}
                  </div>
                  {/* Total */}
                  <div className="px-2 py-1 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    {fmt(item.subtotal, currencySymbol)}
                  </div>
                  {/* Eliminar */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 group-hover:text-red-300 text-xs px-1 hover:font-bold"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-3 py-2 border-t-2 border-[#808080] bg-[#d4d0c8] shrink-0">
          {/* Atajos */}
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>Enter — Agregar producto por código</div>
            <div>F2 — Buscar cliente</div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {lastSale && (
              <button
                onClick={handlePrintTicket}
                disabled={printingTicket}
                className="flex items-center gap-1 border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px hover:bg-[#c0c0c0] disabled:opacity-50"
              >
                {printingTicket ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                Imprimir
              </button>
            )}

            <button
              onClick={() => { clearCart(); setCustomer(null); setStockAlert(null); setLastSale(null); }}
              disabled={isEmpty}
              className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px hover:bg-[#c0c0c0] disabled:opacity-40"
            >
              Limpiar
            </button>

            <Link
              href="/dashboard"
              className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0]"
            >
              Salir
            </Link>

            <button
              onClick={() => setPaymentOpen(true)}
              disabled={isEmpty || processing}
              className="border border-[#808080] bg-[#d4d0c8] px-4 py-1 text-sm font-bold shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px hover:bg-[#c0c0c0] disabled:opacity-40 min-w-[100px] text-right"
            >
              {processing ? (
                <span className="flex items-center gap-1 justify-end">
                  <Loader2 className="h-3 w-3 animate-spin" /> Procesando...
                </span>
              ) : (
                `${currencySymbol} ${cart.total.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={cart.total}
        onConfirm={handleConfirmPayment}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
