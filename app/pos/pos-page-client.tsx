"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchPOSProducts, getPOSProductsByCategory } from "@/lib/actions/pos";
import { getCustomers, createCustomer } from "@/lib/actions/customers";
import { createPOSSale, generatePOSTicket } from "@/lib/actions/pos";
import { getSales } from "@/lib/actions/sales";
import { usePOSCart } from "@/hooks/use-pos-cart";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/types/erp";
import type { POSPayment, POSProductSearchResult } from "@/lib/types/pos";
import type { FinancialStats } from "@/lib/actions/financial-stats";
import { PaymentModalRetro } from "@/components/dashboard/pos/payment-modal-retro";
import { Loader2, Printer, Search, Plus, Users, Package, BarChart2, X, UserPlus } from "lucide-react";
import { ProductSearchModal } from "@/components/dashboard/pos/product-search-modal";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { SupportChatWidget } from "@/components/dashboard/support-chat-widget";
import { toast } from "sonner";
import Link from "next/link";

type InvoiceType = "consumidor_final" | "factura_a" | "factura_b";

const IVA_LABELS: Record<InvoiceType, string> = {
  consumidor_final: "Consumidor Final",
  factura_a: "Resp. Inscripto",
  factura_b: "Monotributista",
};

interface POSPageClientProps {
  currencySymbol: string;
  openingId: string;
  sellerName: string;
  financial: FinancialStats | null;
  isAdmin?: boolean;
  companyName?: string;
  planName?: string;
  daysLeft?: number | null;
}

function fmt(n: number, sym = "$") {
  return `${sym}${Number(n).toFixed(2)}`;
}

function todayStr() {
  return new Date().toLocaleDateString("es-AR");
}

export function POSPageClient({ currencySymbol, openingId, sellerName, financial, isAdmin = false, companyName = "", planName = "", daysLeft = null }: POSPageClientProps) {
  const { cart, addItem, updateQuantity, removeItem, updateItemDiscount, applyDiscount, clearCart } = usePOSCart();

  const [invoiceType, setInvoiceType] = useState<InvoiceType>("consumidor_final");
  const [invoiceNumber, setInvoiceNumber] = useState("—");

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerDropOpen, setCustomerDropOpen] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  const [codeInput, setCodeInput] = useState("");
  const [stockAlert, setStockAlert] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; number: string } | null>(null);
  const [printingTicket, setPrintingTicket] = useState(false);

  // Manual product search modal
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Support chat (non-admin users)
  const [supportOpen, setSupportOpen] = useState(false);

  // Toolbar panels
  type Panel = "customers" | "products" | "sales" | "menu" | null;
  const [activePanel, setActivePanel] = useState<Panel>(null);

  // Customers panel
  const [panelCustomers, setPanelCustomers] = useState<Customer[]>([]);
  const [panelCustomerSearch, setPanelCustomerSearch] = useState("");
  const [loadingPanelCustomers, setLoadingPanelCustomers] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // Products panel
  const [panelProducts, setPanelProducts] = useState<POSProductSearchResult[]>([]);
  const [panelProductSearch, setPanelProductSearch] = useState("");
  const [loadingPanelProducts, setLoadingPanelProducts] = useState(false);

  // Sales panel
  const [todaySales, setTodaySales] = useState<any[]>([]);
  const [loadingTodaySales, setLoadingTodaySales] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { codeRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setCustomerDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  // ── Panel handlers ──────────────────────────────────────────────────────────

  const openPanel = useCallback(async (panel: "customers" | "products" | "sales") => {
    setActivePanel(prev => prev === panel ? null : panel);
    if (panel === "customers") {
      setLoadingPanelCustomers(true);
      setPanelCustomerSearch("");
      setShowNewCustomerForm(false);
      try {
        const results = await getCustomers({ status: "active" });
        setPanelCustomers(results);
      } finally { setLoadingPanelCustomers(false); }
    } else if (panel === "products") {
      setLoadingPanelProducts(true);
      setPanelProductSearch("");
      try {
        const results = await getPOSProductsByCategory(null);
        setPanelProducts(results);
      } finally { setLoadingPanelProducts(false); }
    } else if (panel === "sales") {
      setLoadingTodaySales(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const [y, m, d] = today.split("-").map(Number);
        const start = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0)).toISOString();
        const end = new Date(Date.UTC(y, m - 1, d + 1, 2, 59, 59, 999)).toISOString();
        const results = await getSales({ status: "completed", dateFrom: start, dateTo: end });
        setTodaySales(results);
      } finally { setLoadingTodaySales(false); }
    }
  }, []);

  useEffect(() => {
    if (activePanel !== "customers" || !panelCustomerSearch.trim()) return;
    const t = setTimeout(async () => {
      setLoadingPanelCustomers(true);
      try {
        const results = await getCustomers({ search: panelCustomerSearch, status: "active" });
        setPanelCustomers(results);
      } finally { setLoadingPanelCustomers(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [panelCustomerSearch, activePanel]);

  useEffect(() => {
    if (activePanel !== "products" || !panelProductSearch.trim()) return;
    const t = setTimeout(async () => {
      setLoadingPanelProducts(true);
      try {
        const results = await searchPOSProducts(panelProductSearch);
        setPanelProducts(results);
      } finally { setLoadingPanelProducts(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [panelProductSearch, activePanel]);

  const handleSaveNewCustomer = async () => {
    if (!newCustomerName.trim()) { toast.error("El nombre es requerido"); return; }
    setSavingCustomer(true);
    try {
      const result = await createCustomer({ name: newCustomerName.trim(), phone: newCustomerPhone.trim() || undefined, status: "active", country: "Argentina" });
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Cliente creado");
      setCustomer(result as Customer);
      setActivePanel(null);
      setNewCustomerName(""); setNewCustomerPhone("");
      setShowNewCustomerForm(false);
    } finally { setSavingCustomer(false); }
  };

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
        toast.error(`No se encontró: "${code}"`);
        setCodeInput("");
        return;
      }
      const product = results[0];
      if (product.track_inventory) {
        if (product.stock_quantity <= 0) {
          setStockAlert(`${product.name.toUpperCase()} — Sin stock`);
        } else if (product.stock_quantity <= product.min_stock_level) {
          setStockAlert(`${product.name.toUpperCase()} Por debajo del Stock Mínimo - Actualmente hay ${product.stock_quantity}`);
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
      const saleNum = result.sale_number ?? "";
      setLastSale({ id: result.sale_id ?? "", number: saleNum });
      setInvoiceNumber(saleNum);
      toast.success(`Venta #${saleNum} completada`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintTicket = async () => {
    if (!lastSale?.id) return;
    setPrintingTicket(true);
    try {
      const result = await generatePOSTicket(lastSale.id);
      if (!result.success || !result.ticket_html) { toast.error("Error al generar ticket"); return; }
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

  const isEmpty = cart.items.length === 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#d4d0c8] font-sans select-none overflow-hidden text-black relative">

      {/* Title bar */}
      <div className="flex items-center justify-between bg-[#000080] px-2 py-1 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white text-sm font-bold tracking-wide shrink-0">🧾</span>
          {companyName && (
            <span className="text-white text-sm font-bold truncate">{companyName}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {planName && (
            <div className="flex items-center gap-1.5">
              <span className="text-blue-200 text-[10px] font-bold border border-blue-400 px-1.5 py-0.5">{planName}</span>
              {daysLeft !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${daysLeft <= 5 ? "text-red-300 border-red-400" : daysLeft <= 15 ? "text-amber-300 border-amber-400" : "text-green-300 border-green-400"}`}>
                  {daysLeft}d
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0] leading-none"
            title="Cerrar sesión"
          >✕</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#d4d0c8] border-b-2 border-[#808080] shrink-0">
        {[
          { id: "customers" as const, icon: "👥", label: "Clientes" },
          { id: "products" as const, icon: "📦", label: "Productos" },
          { id: "sales" as const, icon: "📊", label: "Ventas del día" },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => openPanel(btn.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border border-[#808080] shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px transition-none
              ${activePanel === btn.id ? "bg-[#000080] text-white shadow-none translate-x-px translate-y-px" : "bg-[#d4d0c8] text-black hover:bg-[#c0c0c0]"}`}
          >
            <span className="text-base">{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        <Link href="/dashboard/cash-register/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold border border-[#808080] bg-[#d4d0c8] shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
          🏦 Cerrar Caja
        </Link>
        <button
          onClick={() => setActivePanel(prev => prev === "menu" ? null : "menu")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border border-[#808080] shadow-[2px_2px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px transition-none
            ${activePanel === "menu" ? "bg-[#000080] text-white shadow-none translate-x-px translate-y-px" : "bg-[#d4d0c8] text-black hover:bg-[#c0c0c0]"}`}
        >
          🖥 Menú ▾
        </button>
        {/* Notifications — right side */}
        <div className="border border-[#808080] bg-[#d4d0c8] shadow-[2px_2px_0px_#808080]">
          <NotificationsPopover />
        </div>
      </div>

      {/* Panel overlay */}
      {activePanel && (
        <div className="absolute top-[56px] left-0 right-0 z-40 bg-[#d4d0c8] border-b-2 border-[#808080] shadow-[0_4px_8px_rgba(0,0,0,0.3)] max-h-[50vh] flex flex-col">
          {/* Panel title */}
          <div className="flex items-center justify-between bg-[#000080] px-3 py-1 shrink-0">
            <span className="text-white text-sm font-bold">
              {activePanel === "customers" ? "👥 Clientes" : activePanel === "products" ? "📦 Productos" : activePanel === "sales" ? "📊 Ventas del día" : activePanel === "menu" ? "🖥 Menú" : ""}
            </span>
            <button onClick={() => setActivePanel(null)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
          </div>

          {/* Menu panel */}
          {activePanel === "menu" && (
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[
                { href: "/dashboard/sales", icon: "🛒", label: "Ventas" },
                { href: "/dashboard/customers", icon: "👥", label: "Clientes" },
                { href: "/dashboard/products", icon: "📦", label: "Productos" },
                { href: "/dashboard/categories", icon: "🗂", label: "Categorías" },
                { href: "/dashboard/suppliers", icon: "🏭", label: "Proveedores" },
                { href: "/dashboard/purchase-orders", icon: "📋", label: "Órdenes de Compra" },
                { href: "/dashboard/stock-history", icon: "📈", label: "Historial Stock" },
                { href: "/dashboard/price-history", icon: "💲", label: "Historial Precios" },
                { href: "/dashboard/cash-register", icon: "💰", label: "Caja Registradora" },
                { href: "/dashboard/analytics", icon: "📊", label: "Reportes" },
                { href: "/dashboard/quotes", icon: "📄", label: "Presupuestos" },
                { href: "/dashboard/team", icon: "👤", label: "Equipo" },
                { href: "/dashboard/settings", icon: "⚙", label: "Configuración" },
                { href: "/dashboard/billing", icon: "💳", label: "Planes" },
                ...(isAdmin ? [{ href: "/dashboard/admin/support", icon: "🎫", label: "Soporte Admin" }] : []),
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 border border-[#808080] bg-white hover:bg-[#000080] hover:text-white text-black text-xs font-bold shadow-[1px_1px_0px_#808080] active:shadow-none transition-none"
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              {/* Support button for non-admin users */}
              {!isAdmin && (
                <button
                  onClick={() => { setSupportOpen(true); setActivePanel(null); }}
                  className="flex items-center gap-2 px-3 py-2 border border-[#808080] bg-white hover:bg-[#000080] hover:text-white text-black text-xs font-bold shadow-[1px_1px_0px_#808080] active:shadow-none transition-none"
                >
                  <span className="text-base leading-none">🎫</span>
                  <span>Enviar Ticket Soporte</span>
                </button>
              )}
            </div>
          )}

          {/* Customers panel */}
          {activePanel === "customers" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#808080] shrink-0">
                <input
                  value={panelCustomerSearch}
                  onChange={e => setPanelCustomerSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  autoFocus
                  className="flex-1 border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
                />
                <button
                  onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                  className="flex items-center gap-1 border border-[#808080] bg-[#d4d0c8] px-2 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0]"
                >
                  <UserPlus className="h-3 w-3" /> Nuevo
                </button>
              </div>
              {showNewCustomerForm && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#808080] bg-[#f0f0f0] shrink-0">
                  <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Nombre *" className="flex-1 border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none" />
                  <input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} placeholder="Teléfono" className="w-32 border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none" />
                  <button onClick={handleSaveNewCustomer} disabled={savingCustomer} className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50">
                    {savingCustomer ? "..." : "✔ Guardar"}
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[1fr_120px_120px_80px] border-b-2 border-[#808080] bg-[#d4d0c8] sticky top-0">
                  {["Nombre", "Teléfono", "Email", ""].map((h, i) => <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>)}
                </div>
                {loadingPanelCustomers ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-500"><Loader2 className="h-3 w-3 animate-spin" /> Cargando...</div>
                ) : panelCustomers.map((c, idx) => (
                  <div key={c.id} className={`grid grid-cols-[1fr_120px_120px_80px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                    <div className="px-2 py-1.5 text-xs font-semibold border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{c.name}</div>
                    <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{c.phone ?? "—"}</div>
                    <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{c.email ?? "—"}</div>
                    <div className="px-2 py-1.5 text-xs text-center">
                      <button onClick={() => { setCustomer(c); setActivePanel(null); }} className="text-[#000080] group-hover:text-white underline text-xs">Seleccionar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products panel */}
          {activePanel === "products" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#808080] shrink-0">
                <input
                  value={panelProductSearch}
                  onChange={e => setPanelProductSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  autoFocus
                  className="flex-1 border border-[#808080] bg-white text-xs px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
                />
                {loadingPanelProducts && <Loader2 className="h-3 w-3 animate-spin text-[#000080]" />}
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[80px_1fr_100px_80px_60px] border-b-2 border-[#808080] bg-[#d4d0c8] sticky top-0">
                  {["Código", "Descripción", "Precio", "Stock", ""].map((h, i) => <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>)}
                </div>
                {panelProducts.map((p, idx) => (
                  <div key={p.id} onClick={() => { addItem(p); setActivePanel(null); codeRef.current?.focus(); }}
                    className={`grid grid-cols-[80px_1fr_100px_80px_60px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                    <div className="px-2 py-1.5 text-xs font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{p.sku ?? "—"}</div>
                    <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate font-medium">{p.name}</div>
                    <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{currencySymbol}{p.price.toFixed(2)}</div>
                    <div className={`px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa] ${p.track_inventory && p.stock_quantity <= 0 ? "text-red-600 group-hover:text-red-300" : ""}`}>
                      {p.track_inventory ? p.stock_quantity : "∞"}
                    </div>
                    <div className="flex items-center justify-center"><Plus className="h-3.5 w-3.5 text-[#000080] group-hover:text-white" /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales panel */}
          {activePanel === "sales" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[100px_1fr_120px_100px] border-b-2 border-[#808080] bg-[#d4d0c8] sticky top-0">
                  {["N° Venta", "Cliente", "Total", "Método"].map((h, i) => <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>)}
                </div>
                {loadingTodaySales ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-500"><Loader2 className="h-3 w-3 animate-spin" /> Cargando...</div>
                ) : todaySales.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-500">Sin ventas hoy</div>
                ) : (
                  <>
                    {todaySales.map((s, idx) => (
                      <div key={s.id} className={`grid grid-cols-[100px_1fr_120px_100px] border-b border-[#e0e0e0] text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                        <div className="px-2 py-1.5 text-xs font-mono border-r border-[#e0e0e0]">{s.sale_number}</div>
                        <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] truncate">{s.customer?.name ?? "Consumidor Final"}</div>
                        <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0]">{currencySymbol}{Number(s.total).toFixed(2)}</div>
                        <div className="px-2 py-1.5 text-xs truncate">{s.payment_method ?? "—"}</div>
                      </div>
                    ))}
                    <div className="grid grid-cols-[100px_1fr_120px_100px] border-t-2 border-[#808080] bg-[#d4d0c8]">
                      <div className="px-2 py-1.5 text-xs font-bold border-r border-[#808080] col-span-2">TOTAL ({todaySales.length} ventas)</div>
                      <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#808080]">
                        {currencySymbol}{todaySales.reduce((s, v) => s + Number(v.total), 0).toFixed(2)}
                      </div>
                      <div />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financial summary bar */}
      {financial && (
        <div className="flex items-center gap-0 border-b-2 border-[#808080] shrink-0 bg-[#c0c0c0] overflow-x-auto">
          {[
            { label: "Hoy", value: fmt(financial.dailySales, currencySymbol), color: "text-green-800" },
            { label: "Caja", value: fmt(financial.currentCashBalance, currencySymbol), color: "text-blue-800" },
            { label: "Cobrar", value: fmt(financial.accountsReceivable, currencySymbol), color: "text-orange-800" },
            { label: "Pagar", value: fmt(financial.accountsPayable, currencySymbol), color: "text-red-800" },
            { label: "Ganancia", value: fmt(financial.monthlyProfit, currencySymbol), color: "text-purple-800" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center px-5 py-2 border-r border-[#808080] last:border-r-0 shrink-0">
              <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wide">{item.label}</span>
              <span className={`text-base font-bold font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Window body */}
      <div className="flex-1 flex flex-col overflow-hidden border-2 border-[#808080] bg-[#d4d0c8]">

        {/* Row 1: Tipo / Número / Vendedor / Fecha */}
        <div className="flex items-center gap-4 px-3 py-2 border-b border-[#808080] shrink-0">
          <select
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
            className="border border-[#808080] bg-white text-sm px-1 py-0.5 font-bold shadow-[inset_1px_1px_2px_#808080] focus:outline-none"
          >
            <option value="consumidor_final">Consumidor Final</option>
            <option value="factura_a">Factura A</option>
            <option value="factura_b">Factura B</option>
          </select>

          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">N°</span>
            <input readOnly value={invoiceNumber}
              className="w-32 border border-[#808080] bg-[#f0f0f0] text-sm px-1 py-0.5 text-center shadow-[inset_1px_1px_2px_#808080]" />
          </div>

          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm font-bold">Vendedor</span>
            <input readOnly value={sellerName}
              className="flex-1 border border-[#808080] bg-[#f0f0f0] text-sm px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]" />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">Fecha</span>
            <input readOnly value={todayStr()}
              className="w-28 border border-[#808080] bg-[#f0f0f0] text-sm px-1 py-0.5 text-center shadow-[inset_1px_1px_2px_#808080]" />
          </div>
        </div>

        {/* Row 2: Datos del cliente */}
        <div className={`grid grid-cols-[80px_1fr_1fr_140px_160px] gap-x-2 px-3 py-1.5 border-b shrink-0 items-end ${
          (invoiceType === "factura_a" || invoiceType === "factura_b") && !customer
            ? "border-red-500 bg-red-50"
            : "border-[#808080]"
        }`}>
          {(invoiceType === "factura_a" || invoiceType === "factura_b") && !customer && (
            <div className="col-span-5 text-xs text-red-600 font-bold mb-1">
              ⚠ Factura {invoiceType === "factura_a" ? "A" : "B"} requiere seleccionar un cliente
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#000080]">Cód Cliente</span>
            <input readOnly value={customer?.id?.slice(0, 6) ?? ""}
              className="w-full border border-[#808080] bg-[#f0f0f0] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]" />
          </div>

          <div className="flex flex-col gap-0.5 relative" ref={customerRef}>
            <span className="text-xs font-bold text-[#000080]">Nombre</span>
            <input
              value={customer ? customer.name : customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setCustomer(null); setCustomerDropOpen(true); }}
              onFocus={() => setCustomerDropOpen(true)}
              placeholder="Consumidor Final"
              className="w-full border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
            />
            {customerDropOpen && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#808080] shadow-md max-h-40 overflow-y-auto">
                <div className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer border-b border-[#d4d0c8]"
                  onClick={() => { setCustomer(null); setCustomerSearch(""); setCustomerDropOpen(false); }}>
                  — Consumidor Final —
                </div>
                {loadingCustomer ? (
                  <div className="px-2 py-1 text-xs text-gray-500">Buscando...</div>
                ) : customerResults.map((c) => (
                  <div key={c.id} className="px-2 py-1 text-xs hover:bg-[#000080] hover:text-white cursor-pointer"
                    onClick={() => { setCustomer(c); setCustomerSearch(""); setCustomerDropOpen(false); }}>
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#000080]">Dirección</span>
            <input readOnly value={customer?.address ?? ""}
              className="w-full border border-[#808080] bg-[#f0f0f0] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]" />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#000080]">Cuit/DNI</span>
            <input readOnly value={customer?.document_number ?? ""}
              className="w-full border border-[#808080] bg-[#f0f0f0] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]" />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#000080]">Condición IVA</span>
            <input readOnly value={IVA_LABELS[invoiceType]}
              className="w-full border border-[#808080] bg-[#f0f0f0] text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080]" />
          </div>
        </div>

        {/* Row 3: Código */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#808080] shrink-0">
          <span className="text-sm font-bold">Código:</span>
          <input
            ref={codeRef}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={handleCodeEnter}
            placeholder="Escanear o escribir código → Enter"
            disabled={searching}
            className="w-56 border border-[#808080] bg-white text-sm px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
          />
          {searching && <Loader2 className="h-4 w-4 animate-spin text-[#000080]" />}
          {stockAlert && <span className="text-sm text-red-600 font-semibold">{stockAlert}</span>}
          <button
            onClick={() => setProductModalOpen(true)}
            className="ml-auto border border-[#808080] bg-[#d4d0c8] px-3 py-0.5 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Agregar artículo
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden flex flex-col mx-3 my-2 border border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080]">
          {/* Table header — extra IVA column for Factura A */}
          {invoiceType === "factura_a" ? (
            <div className="grid grid-cols-[50px_80px_1fr_100px_70px_80px_80px_100px_40px] border-b-2 border-[#808080] bg-[#d4d0c8] shrink-0">
              {["Cant", "Cód.", "Descripción", "Precio", "Desc.", "Neto", "IVA 21%", "Total", ""].map((h, i) => (
                <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[50px_80px_1fr_100px_70px_100px_40px] border-b-2 border-[#808080] bg-[#d4d0c8] shrink-0">
              {["Cant", "Cód.", "Descripción", "Precio", "Desc.", "Total", ""].map((h, i) => (
                <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {isEmpty ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Sin artículos — escaneá un código para comenzar
              </div>
            ) : cart.items.map((item, idx) => {
              const neto = item.subtotal / (1 + item.tax_rate / 100);
              const iva = item.subtotal - neto;
              return invoiceType === "factura_a" ? (
                <div key={item.id}
                  className={`grid grid-cols-[50px_80px_1fr_100px_70px_80px_80px_100px_40px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                  <div className="px-1 py-1 border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    <input type="number" min={1} value={item.quantity}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) updateQuantity(item.id, v); }}
                      className="w-full text-center text-xs text-black bg-transparent focus:outline-none focus:bg-white focus:text-black" />
                  </div>
                  <div className="px-2 py-1 text-xs font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{item.product_sku ?? "—"}</div>
                  <div className="px-2 py-1 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                    {item.product_name}{item.variant_name && <span className="ml-1 opacity-70">({item.variant_name})</span>}
                  </div>
                  <div className="px-2 py-1 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(item.unit_price, currencySymbol)}</div>
                  <div className="px-1 py-1 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    <input
                      type="number" min={0} max={100} step={1}
                      value={item.discount_percent ?? 0}
                      onChange={e => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                      className="w-full text-center text-xs text-black bg-transparent focus:outline-none focus:bg-white focus:text-black"
                    />
                  </div>
                  <div className="px-2 py-1 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(neto, currencySymbol)}</div>
                  <div className="px-2 py-1 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa] text-blue-700 group-hover:text-blue-200">{fmt(iva, currencySymbol)}</div>
                  <div className="px-2 py-1 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(item.subtotal, currencySymbol)}</div>
                  <div className="flex items-center justify-center">
                    <button onClick={() => removeItem(item.id)} className="text-red-500 group-hover:text-red-300 text-xs px-1 hover:font-bold" title="Eliminar">✕</button>
                  </div>
                </div>
              ) : (
                <div key={item.id}
                  className={`grid grid-cols-[50px_80px_1fr_100px_70px_100px_40px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                  <div className="px-1 py-1 border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    <input type="number" min={1} value={item.quantity}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v > 0) updateQuantity(item.id, v); }}
                      className="w-full text-center text-xs text-black bg-transparent focus:outline-none focus:bg-white focus:text-black" />
                  </div>
                  <div className="px-2 py-1 text-xs font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{item.product_sku ?? "—"}</div>
                  <div className="px-2 py-1 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                    {item.product_name}{item.variant_name && <span className="ml-1 opacity-70">({item.variant_name})</span>}
                  </div>
                  <div className="px-2 py-1 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(item.unit_price, currencySymbol)}</div>
                  <div className="px-1 py-1 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                    <input
                      type="number" min={0} max={100} step={1}
                      value={item.discount_percent ?? 0}
                      onChange={e => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                      className="w-full text-center text-xs text-black bg-transparent focus:outline-none focus:bg-white focus:text-black"
                    />
                  </div>
                  <div className="px-2 py-1 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(item.subtotal, currencySymbol)}</div>
                  <div className="flex items-center justify-center">
                    <button onClick={() => removeItem(item.id)} className="text-red-500 group-hover:text-red-300 text-xs px-1 hover:font-bold" title="Eliminar">✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* IVA summary row for Factura A */}
          {invoiceType === "factura_a" && !isEmpty && (
            <div className="border-t-2 border-[#808080] bg-[#d4d0c8] px-3 py-1.5 flex justify-end gap-6 shrink-0">
              <span className="text-xs text-gray-600">Neto: <strong className="font-mono">{fmt(cart.items.reduce((s, i) => s + i.subtotal / (1 + i.tax_rate / 100), 0), currencySymbol)}</strong></span>
              <span className="text-xs text-blue-700">IVA 21%: <strong className="font-mono">{fmt(cart.items.reduce((s, i) => s + (i.subtotal - i.subtotal / (1 + i.tax_rate / 100)), 0), currencySymbol)}</strong></span>
              <span className="text-xs font-bold">Total: <strong className="font-mono">{fmt(cart.total, currencySymbol)}</strong></span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t-2 border-[#808080] bg-[#d4d0c8] shrink-0">
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>Enter — Agregar producto por código</div>
            <div>F2 — Buscar cliente</div>
          </div>

          <div className="flex items-center gap-2">
            {lastSale && (
              <button onClick={handlePrintTicket} disabled={printingTicket}
                className="flex items-center gap-1 border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-50">
                {printingTicket ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                Imprimir
              </button>
            )}

            <button
              onClick={() => { clearCart(); setCustomer(null); setStockAlert(null); setLastSale(null); }}
              disabled={isEmpty}
              className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0] disabled:opacity-40">
              Limpiar
            </button>

            <button
              onClick={() => {
                if ((invoiceType === "factura_a" || invoiceType === "factura_b") && !customer) {
                  toast.error(`Factura ${invoiceType === "factura_a" ? "A" : "B"} requiere seleccionar un cliente`);
                  return;
                }
                setPaymentOpen(true);
              }}
              disabled={isEmpty || processing}
              className="border-2 border-[#808080] bg-[#d4d0c8] px-6 py-2 font-bold shadow-[3px_3px_0px_#808080] active:shadow-none active:translate-x-px active:translate-y-px hover:bg-[#c0c0c0] disabled:opacity-40 min-w-[160px] text-right">
              {processing
                ? <span className="flex items-center gap-2 justify-end text-sm"><Loader2 className="h-4 w-4 animate-spin" />Procesando...</span>
                : (
                  <span className="flex flex-col items-end leading-tight">
                    <span className="text-xs text-gray-600 font-normal">TOTAL</span>
                    <span className="text-2xl font-bold tracking-tight">{currencySymbol} {cart.total.toFixed(2)}</span>
                  </span>
                )}
            </button>
          </div>
        </div>
      </div>

      <PaymentModalRetro
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={cart.total}
        subtotal={cart.subtotal}
        discountAmount={cart.discount_amount}
        discountType={cart.discount_type}
        discountValue={cart.discount_value}
        onApplyDiscount={applyDiscount}
        onConfirm={handleConfirmPayment}
        currencySymbol={currencySymbol}
      />

      {/* Support chat widget for non-admin users */}
      {supportOpen && !isAdmin && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl overflow-hidden border-2 border-[#808080] shadow-[4px_4px_0px_#000]">
          <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
            <span className="text-white text-sm font-bold">🎫 Soporte</span>
            <button onClick={() => setSupportOpen(false)} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
          </div>
          <div className="h-[calc(100%-28px)]">
            <SupportChatWidget onClose={() => setSupportOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Manual product search modal ── */}
      <ProductSearchModal
        open={productModalOpen}
        onClose={() => { setProductModalOpen(false); codeRef.current?.focus(); }}
        onSelect={(product) => {
          addItem(product);
          if (product.track_inventory) {
            if (product.stock_quantity <= 0) setStockAlert(`${product.name.toUpperCase()} — Sin stock`);
            else if (product.stock_quantity <= product.min_stock_level) setStockAlert(`${product.name.toUpperCase()} Por debajo del Stock Mínimo - Actualmente hay ${product.stock_quantity}`);
          }
        }}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
