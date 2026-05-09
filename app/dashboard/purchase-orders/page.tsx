"use client";

import { useState, useEffect } from "react";
import { getPurchaseOrders } from "@/lib/actions/purchase-orders";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getCompanySettings } from "@/lib/actions/company-settings";
import { formatCompanyCurrency } from "@/lib/utils/currency";
import type { PurchaseOrder, Supplier, CompanySettings } from "@/lib/types/erp";
import { Plus, ShoppingCart, Filter, X, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = { pending: "Pendiente", confirmed: "Confirmada", received: "Recibida", cancelled: "Cancelada" };
const STATUS_COLORS: Record<string, string> = { pending: "text-amber-700", confirmed: "text-blue-700", received: "text-green-700", cancelled: "text-red-600" };
const PAY_LABELS: Record<string, string> = { pending: "Pendiente", partial: "Parcial", paid: "Pagado" };
const PAY_COLORS: Record<string, string> = { pending: "text-amber-700", partial: "text-blue-700", paid: "text-green-700" };

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { loadSettings(); loadSuppliers(); loadOrders(); }, []);
  useEffect(() => { loadOrders(); }, [search, statusFilter, paymentStatusFilter, supplierFilter, dateFrom, dateTo]);

  const loadSettings = async () => { const d = await getCompanySettings(); setSettings(d); };
  const loadSuppliers = async () => { const d = await getSuppliers(); setSuppliers(d); };
  const loadOrders = async () => {
    setLoading(true);
    const data = await getPurchaseOrders({ search: search || undefined, status: statusFilter || undefined, paymentStatus: paymentStatusFilter || undefined, supplierId: supplierFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
    setOrders(data); setLoading(false);
  };
  const clearFilters = () => { setSearch(""); setStatusFilter(""); setPaymentStatusFilter(""); setSupplierFilter(""); setDateFrom(""); setDateTo(""); };
  const hasActiveFilters = search || statusFilter || paymentStatusFilter || supplierFilter || dateFrom || dateTo;
  const fmt = (n: number) => settings ? formatCompanyCurrency(n, settings) : `$${n.toFixed(2)}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-AR");

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">📋 Órdenes de Compra ({orders.length})</span>
          <Link href="/dashboard/purchase-orders/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
            <Plus className="h-3 w-3" /> Nueva
          </Link>
        </div>

        <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <span className="text-xs font-bold">Buscar:</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Número, proveedor..." className="flex-1 border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1"><Filter className="h-3 w-3" /> Filtros</button>
          {hasActiveFilters && <button onClick={clearFilters} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-red-700"><X className="h-3 w-3" /> Limpiar</button>}
        </div>

        {showFilters && (
          <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-black">Estado</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="received">Recibida</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-black">Pago</span>
              <select value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pagado</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-black">Proveedor</span>
              <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="">Todos</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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

        <div className="bg-white overflow-x-auto">
          <div className="grid grid-cols-[120px_1fr_100px_120px_100px_80px_60px] border-b-2 border-[#808080] bg-[#d4d0c8]">
            {["N° Orden", "Proveedor", "Fecha", "Total", "Estado", "Pago", ""].map((h, i) => (
              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <ShoppingCart className="h-10 w-10 opacity-30" />
              <p className="text-sm">{hasActiveFilters ? "Sin resultados" : "No hay órdenes de compra"}</p>
            </div>
          ) : orders.map((order, idx) => (
            <Link key={order.id} href={`/dashboard/purchase-orders/${order.id}`} className="contents">
              <div className={`grid grid-cols-[120px_1fr_100px_120px_100px_80px_60px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="px-2 py-1.5 text-xs font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{order.order_number}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{order.supplier?.name ?? "—"}</div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmtDate(order.order_date)}</div>
                <div className="px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{fmt(order.total)}</div>
                <div className={`px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] group-hover:text-white ${STATUS_COLORS[order.status] ?? ""}`}>{STATUS_LABELS[order.status] ?? order.status}</div>
                <div className={`px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] group-hover:text-white ${PAY_COLORS[order.payment_status] ?? ""}`}>{PAY_LABELS[order.payment_status] ?? order.payment_status}</div>
                <div className="px-2 py-1.5 text-xs text-center"><span className="text-[#000080] group-hover:text-white underline">Ver</span></div>
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1">
          <span className="text-xs text-gray-600">{orders.length} orden(es)</span>
        </div>
      </div>
    </div>
  );
}
