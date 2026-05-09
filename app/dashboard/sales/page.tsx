"use client";

import { useState, useEffect } from "react";
import { getSales } from "@/lib/actions/sales";
import { getCustomers } from "@/lib/actions/customers";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { canExportToExcel } from "@/lib/utils/plan-limits";
import { createClient } from "@/lib/supabase/client";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import { Plus, ShoppingCart, Search, Filter, X, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { exportSalesToExcel, exportSalesToCSV, exportSalesReportToPDF } from "@/lib/utils/export";
import { toast } from "sonner";
import type { Sale, Customer } from "@/lib/types/erp";

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", completed: "Completada", cancelled: "Cancelada" };
const STATUS_COLORS: Record<string, string> = { draft: "text-gray-600", completed: "text-green-700", cancelled: "text-red-600" };
const PAY_LABELS: Record<string, string> = { pending: "Pendiente", partial: "Parcial", paid: "Pagado", refunded: "Reembolsado" };
const PAY_COLORS: Record<string, string> = { pending: "text-amber-700", partial: "text-blue-700", paid: "text-green-700", refunded: "text-red-600" };

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [canExport, setCanExport] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [currencyPosition, setCurrencyPosition] = useState<"before" | "after">("before");

  useEffect(() => { loadCustomers(); loadSales(); checkExportPermissions(); loadCurrencySettings(); }, []);
  useEffect(() => { loadSales(); }, [search, statusFilter, paymentStatusFilter, customerFilter, dateFrom, dateTo]);

  const loadCurrencySettings = async () => { const s = await getCompanySettings(); if (s) { setCurrencySymbol(s.currency_symbol); setCurrencyPosition(s.currency_position); } };
  const checkExportPermissions = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (profile?.company_id) { const ep = await canExportToExcel(profile.company_id); setCanExport(ep.allowed); }
  };
  const loadSales = async () => {
    setLoading(true);
    const data = await getSales({ search: search || undefined, status: statusFilter || undefined, paymentStatus: paymentStatusFilter || undefined, customerId: customerFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
    setSales(data); setLoading(false);
  };
  const loadCustomers = async () => { const data = await getCustomers(); setCustomers(data); };
  const clearFilters = () => { setSearch(""); setStatusFilter(""); setPaymentStatusFilter(""); setCustomerFilter(""); setDateFrom(""); setDateTo(""); };
  const hasActiveFilters = search || statusFilter || paymentStatusFilter || customerFilter || dateFrom || dateTo;
  const fmt = (n: number) => formatCompanyCurrency(n, { currency_symbol: currencySymbol, currency_position: currencyPosition });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-AR");

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🛒 Ventas ({sales.length})</span>
          <div className="flex gap-1">
            {canExport && (
              <div className="relative group">
                <button className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
                  <Download className="h-3 w-3" /> Exportar ▾
                </button>
                <div className="absolute right-0 top-full z-50 hidden group-hover:block bg-[#d4d0c8] border-2 border-[#808080] shadow-[2px_2px_0px_#000] min-w-[140px]">
                  <button onClick={() => { try { exportSalesToExcel(sales); toast.success("Exportado"); } catch { toast.error("Error"); } }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[#000080] hover:text-white text-left text-black"><FileSpreadsheet className="h-3 w-3" /> Excel</button>
                  <button onClick={() => { try { exportSalesToCSV(sales); toast.success("Exportado"); } catch { toast.error("Error"); } }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[#000080] hover:text-white text-left text-black"><FileSpreadsheet className="h-3 w-3" /> CSV</button>
                  <button onClick={() => { try { exportSalesReportToPDF(sales, { totalRevenue: sales.reduce((s, v) => s + v.total, 0), totalSales: sales.length, averageTicket: sales.length ? sales.reduce((s, v) => s + v.total, 0) / sales.length : 0 }, "Mi Empresa"); toast.success("PDF generado"); } catch { toast.error("Error"); } }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[#000080] hover:text-white text-left text-black"><FileText className="h-3 w-3" /> PDF</button>
                </div>
              </div>
            )}
            <Link href="/dashboard/sales/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
              <Plus className="h-3 w-3" /> Nueva
            </Link>
          </div>
        </div>

        {/* Search + filters */}
        <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <span className="text-xs font-bold">Buscar:</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Número, notas..." className="flex-1 border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1"><Filter className="h-3 w-3" /> Filtros</button>
          {hasActiveFilters && <button onClick={clearFilters} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-red-700"><X className="h-3 w-3" /> Limpiar</button>}
        </div>

        {showFilters && (
          <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap gap-3 items-end">
            {[
              { label: "Estado", value: statusFilter, set: setStatusFilter, opts: [["", "Todos"], ["completed", "Completada"], ["draft", "Borrador"], ["cancelled", "Cancelada"]] },
              { label: "Pago", value: paymentStatusFilter, set: setPaymentStatusFilter, opts: [["", "Todos"], ["paid", "Pagado"], ["pending", "Pendiente"], ["partial", "Parcial"]] },
            ].map(f => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-black">{f.label}</span>
                <select value={f.value} onChange={e => f.set(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                  {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-black">Cliente</span>
              <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="">Todos</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-black">Desde</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-black">Hasta</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none" />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white overflow-x-auto">
          <div className="grid grid-cols-[100px_1fr_120px_100px_100px_80px_60px] border-b-2 border-[#808080] bg-[#d4d0c8]">
            {["N° Venta", "Cliente", "Fecha", "Total", "Estado", "Pago", ""].map((h, i) => (
              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <ShoppingCart className="h-10 w-10 opacity-30" />
              <p className="text-sm">{hasActiveFilters ? "Sin resultados" : "No hay ventas"}</p>
            </div>
          ) : sales.map((sale, idx) => (
            <Link key={sale.id} href={`/dashboard/sales/${sale.id}`} className="contents">
              <div className={`grid grid-cols-[100px_1fr_120px_100px_100px_80px_60px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="px-2 py-1.5 text-xs font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{sale.sale_number}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{(sale as any).customer?.name ?? "Consumidor Final"}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmtDate(sale.sale_date)}</div>
                <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(sale.total)}</div>
                <div className={`px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] group-hover:text-white ${STATUS_COLORS[sale.status] ?? ""}`}>{STATUS_LABELS[sale.status] ?? sale.status}</div>
                <div className={`px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] group-hover:text-white ${PAY_COLORS[sale.payment_status] ?? ""}`}>{PAY_LABELS[sale.payment_status] ?? sale.payment_status}</div>
                <div className="px-2 py-1.5 text-xs text-center"><span className="text-[#000080] group-hover:text-white underline">Ver</span></div>
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1">
          <span className="text-xs text-gray-600">Total: {fmt(sales.reduce((s, v) => s + v.total, 0))} en {sales.length} ventas</span>
        </div>
      </div>
    </div>
  );
}
