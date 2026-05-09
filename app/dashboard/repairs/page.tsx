"use client";

import { useState, useEffect } from "react";
import { getRepairOrders } from "@/lib/actions/repair-orders";
import { getTechnicians } from "@/lib/actions/technicians";
import { createClient } from "@/lib/supabase/client";
import { Plus, Wrench, Filter, X, Loader2, AlertCircle, BarChart3 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { RepairOrder, Technician, RepairStatus } from "@/lib/types/erp";

type RepairOrderWithPayment = RepairOrder & { total_cost: number; total_paid: number };

const STATUS_LABELS: Record<string, string> = { received: "Recibido", diagnosing: "Diagnosticando", waiting_parts: "Esp. Repuestos", repairing: "Reparando", repaired: "Reparado", delivered: "Entregado", cancelled: "Cancelado" };
const STATUS_COLORS: Record<string, string> = { received: "text-blue-700", diagnosing: "text-purple-700", waiting_parts: "text-amber-700", repairing: "text-indigo-700", repaired: "text-green-700", delivered: "text-emerald-700", cancelled: "text-red-600" };

export default function RepairsPage() {
  const [repairs, setRepairs] = useState<RepairOrderWithPayment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("company_id").eq("id", user.id).single().then(({ data }) => {
        if (data?.company_id) setCompanyId(data.company_id);
      });
    });
  }, []);

  useEffect(() => {
    if (!companyId) return;
    getTechnicians(companyId, false).then(setTechnicians).catch(console.error);
    loadRepairs();
  }, [companyId, search, statusFilter, technicianFilter, dateFrom, dateTo]);

  const loadRepairs = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await getRepairOrders({ companyId, status: (statusFilter && statusFilter !== "none" ? statusFilter : undefined) as RepairStatus | undefined, technicianId: technicianFilter && technicianFilter !== "none" ? technicianFilter : undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: search || undefined });
      setRepairs(data.orders || []);
    } finally { setLoading(false); }
  };

  const clearFilters = () => { setSearch(""); setStatusFilter(""); setTechnicianFilter(""); setDateFrom(""); setDateTo(""); };
  const hasActiveFilters = search || statusFilter || technicianFilter || dateFrom || dateTo;

  const isOverdue = (r: RepairOrderWithPayment) => {
    if (!r.estimated_delivery_date || r.status === "delivered" || r.status === "cancelled") return false;
    return new Date(r.estimated_delivery_date) < new Date();
  };

  const payLabel = (r: RepairOrderWithPayment) => {
    if (r.status === "cancelled" || r.status === "received" || r.total_cost === 0) return null;
    if (r.total_paid >= r.total_cost) return { text: "Cobrado", color: "text-green-700" };
    if (r.total_paid > 0) return { text: "Parcial", color: "text-amber-700" };
    return { text: "No cobrado", color: "text-red-600" };
  };

  const overdueCount = repairs.filter(isOverdue).length;

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">
            🔧 Reparaciones ({repairs.length})
            {overdueCount > 0 && <span className="ml-2 text-red-300 text-xs">⚠ {overdueCount} vencidas</span>}
          </span>
          <div className="flex gap-1">
            <Link href="/dashboard/repairs/reports" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
              <BarChart3 className="h-3 w-3" /> Historial
            </Link>
            <Link href="/dashboard/repairs/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
              <Plus className="h-3 w-3" /> Nueva
            </Link>
          </div>
        </div>

        <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <span className="text-xs font-bold">Buscar:</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Número, cliente, dispositivo..." className="flex-1 border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]" />
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
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-black">Técnico</span>
              <select value={technicianFilter} onChange={e => setTechnicianFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="">Todos</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
          <div className="grid grid-cols-[100px_1fr_1fr_100px_100px_80px_60px] border-b-2 border-[#808080] bg-[#d4d0c8]">
            {["N° Orden", "Cliente", "Dispositivo", "Ingreso", "Estado", "Pago", ""].map((h, i) => (
              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
            ))}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</div>
          ) : repairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <Wrench className="h-10 w-10 opacity-30" />
              <p className="text-sm">{hasActiveFilters ? "Sin resultados" : "No hay reparaciones"}</p>
            </div>
          ) : repairs.map((r, idx) => {
            const pay = payLabel(r);
            return (
              <Link key={r.id} href={`/dashboard/repairs/${r.id}`} className="contents">
                <div className={`grid grid-cols-[100px_1fr_1fr_100px_100px_80px_60px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                  <div className="px-2 py-1.5 text-xs font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] flex items-center gap-1">
                    {isOverdue(r) && <AlertCircle className="h-3 w-3 text-red-500 group-hover:text-red-300 shrink-0" />}
                    #{r.order_number}
                  </div>
                  <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{(r as any).customer?.name ?? "—"}</div>
                  <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{r.device_type} {r.brand} {r.model}</div>
                  <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{formatDate(r.received_date)}</div>
                  <div className={`px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] group-hover:text-white ${STATUS_COLORS[r.status] ?? ""}`}>{STATUS_LABELS[r.status] ?? r.status}</div>
                  <div className={`px-2 py-1.5 text-xs font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] group-hover:text-white ${pay?.color ?? "text-gray-400"}`}>{pay?.text ?? "—"}</div>
                  <div className="px-2 py-1.5 text-xs text-center"><span className="text-[#000080] group-hover:text-white underline">Ver</span></div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1">
          <span className="text-xs text-gray-600">{repairs.length} reparación(es)</span>
        </div>
      </div>
    </div>
  );
}
