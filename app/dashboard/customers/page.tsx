"use client";

import { useState, useEffect } from "react";
import { getCustomers, getCustomerBalance } from "@/lib/actions/customers";
import { canExportToExcel } from "@/lib/utils/plan-limits";
import { createClient } from "@/lib/supabase/client";
import { Plus, Users, Search, Filter, X, Mail, Phone, Download, FileSpreadsheet, FileText, CreditCard, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";
import { exportCustomersToExcel, exportCustomersToCSV } from "@/lib/utils/export";
import { toast } from "sonner";
import type { Customer } from "@/lib/types/erp";
import { CustomerAccountModal } from "@/components/dashboard/customer-account-modal";
import { QuickPaymentModal } from "@/components/dashboard/quick-payment-modal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [canExport, setCanExport] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [customerBalances, setCustomerBalances] = useState<Record<string, number>>({});
  const [selectedCustomerForAccount, setSelectedCustomerForAccount] = useState<Customer | null>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => { loadCustomers(); checkExportPermissions(); }, []);
  useEffect(() => { loadCustomers(); }, [search, statusFilter]);
  useEffect(() => { if (customers.length > 0) loadCustomerBalances(); }, [customers]);

  const checkExportPermissions = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (profile?.company_id) { const ep = await canExportToExcel(profile.company_id); setCanExport(ep.allowed); }
  };

  const loadCustomerBalances = async () => {
    const balances: Record<string, number> = {};
    await Promise.all(customers.map(async c => { balances[c.id] = await getCustomerBalance(c.id); }));
    setCustomerBalances(balances);
  };

  const loadCustomers = async () => {
    setLoading(true);
    const data = await getCustomers({ search: search || undefined, status: statusFilter || undefined });
    setCustomers(data);
    setLoading(false);
  };

  const clearFilters = () => { setSearch(""); setStatusFilter(""); };
  const hasActiveFilters = search || statusFilter;

  const handleOpenAccountModal = (customer: Customer, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedCustomerForAccount(customer); setAccountModalOpen(true);
  };

  const handleOpenPaymentModal = (customer: Customer, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedCustomerForPayment(customer); setPaymentModalOpen(true);
  };

  const STATUS_LABELS: Record<string, string> = { active: "Activo", inactive: "Inactivo", blocked: "Bloqueado" };
  const STATUS_COLORS: Record<string, string> = { active: "text-green-700", inactive: "text-gray-500", blocked: "text-red-600" };

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">

        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">👥 Clientes ({customers.length})</span>
          <div className="flex gap-1">
            {canExport && (
              <div className="relative group">
                <button className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
                  <Download className="h-3 w-3" /> Exportar ▾
                </button>
                <div className="absolute right-0 top-full z-50 hidden group-hover:block bg-[#d4d0c8] border-2 border-[#808080] shadow-[2px_2px_0px_#000] min-w-[140px]">
                  <button onClick={() => { try { exportCustomersToExcel(customers); toast.success("Exportado a Excel"); } catch { toast.error("Error"); } }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[#000080] hover:text-white text-left text-black"><FileSpreadsheet className="h-3 w-3" /> Excel</button>
                  <button onClick={() => { try { exportCustomersToCSV(customers); toast.success("Exportado a CSV"); } catch { toast.error("Error"); } }} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[#000080] hover:text-white text-left text-black"><FileSpreadsheet className="h-3 w-3" /> CSV</button>
                </div>
              </div>
            )}
            <Link href="/dashboard/customers/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
              <Plus className="h-3 w-3" /> Nuevo
            </Link>
          </div>
        </div>

        {/* Search + filters bar */}
        <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <span className="text-xs font-bold">Buscar:</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nombre, email, teléfono, documento..."
              className="flex-1 border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1"
          >
            <Filter className="h-3 w-3" /> Filtros
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-red-700">
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-black">Estado</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
                <option value="">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="blocked">Bloqueados</option>
              </select>
            </div>
          </div>
        )}

        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_110px_100px_80px_80px_90px] border-b-2 border-[#808080] bg-[#d4d0c8]">
          {["Cliente", "Email", "Teléfono", "Documento", "Ciudad", "Saldo", "Estado"].map((h, i) => (
            <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
          ))}
        </div>

        {/* Table body */}
        <div className="bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">{hasActiveFilters ? "Sin resultados con los filtros aplicados" : "No hay clientes"}</p>
              {!hasActiveFilters && (
                <Link href="/dashboard/customers/new" className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 mt-2 text-black">
                  <Plus className="h-3 w-3" /> Nuevo Cliente
                </Link>
              )}
            </div>
          ) : (
            customers.map((customer, idx) => (
              <div key={customer.id} className={`grid grid-cols-[1fr_140px_110px_100px_80px_80px_90px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                {/* Nombre */}
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                  <Link href={`/dashboard/customers/${customer.id}`} className="font-semibold truncate block hover:underline">
                    {customer.name}
                  </Link>
                </div>
                {/* Email */}
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                  {customer.email ? <span className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" />{customer.email}</span> : "—"}
                </div>
                {/* Teléfono */}
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                  {customer.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{customer.phone}</span> : "—"}
                </div>
                {/* Documento */}
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                  {customer.document_number ? `${customer.document_type}: ${customer.document_number}` : "—"}
                </div>
                {/* Ciudad */}
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                  {customer.city ?? "—"}
                </div>
                {/* Saldo */}
                <div className={`px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] ${(customerBalances[customer.id] ?? 0) > 0 ? "text-green-700 group-hover:text-green-300" : ""}`}>
                  ${(customerBalances[customer.id] ?? 0).toFixed(2)}
                </div>
                {/* Estado + acciones */}
                <div className="px-2 py-1.5 text-xs flex items-center justify-between gap-1">
                  <span className={`${STATUS_COLORS[customer.status] ?? ""} group-hover:text-white font-bold`}>
                    {STATUS_LABELS[customer.status] ?? customer.status}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleOpenAccountModal(customer, e)}
                      title="Cuenta corriente"
                      className="text-[#000080] group-hover:text-white hover:opacity-70"
                    >
                      <FileText className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleOpenPaymentModal(customer, e)}
                      title="Registrar pago"
                      className="text-[#000080] group-hover:text-white hover:opacity-70"
                    >
                      <CreditCard className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1">
          <span className="text-xs text-gray-600">Mostrando {customers.length} cliente(s)</span>
        </div>
      </div>

      {selectedCustomerForAccount && (
        <CustomerAccountModal
          customerId={selectedCustomerForAccount.id}
          customerName={selectedCustomerForAccount.name}
          open={accountModalOpen}
          onOpenChange={setAccountModalOpen}
        />
      )}

      {selectedCustomerForPayment && (
        <QuickPaymentModal
          entityId={selectedCustomerForPayment.id}
          entityName={selectedCustomerForPayment.name}
          entityType="customer"
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          onSuccess={() => { setPaymentModalOpen(false); loadCustomers(); loadCustomerBalances(); }}
        />
      )}
    </div>
  );
}
