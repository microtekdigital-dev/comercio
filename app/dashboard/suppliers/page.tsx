"use client";

import { useState, useEffect } from "react";
import { getSuppliers, getSupplierBalance } from "@/lib/actions/suppliers";
import { getUserPermissions } from "@/lib/utils/permissions";
import type { Supplier } from "@/lib/types/erp";
import { Plus, Search, Building2, Mail, Phone, MapPin, FileText, DollarSign, Loader2, X } from "lucide-react";
import Link from "next/link";
import { SupplierAccountModal } from "@/components/dashboard/supplier-account-modal";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierBalances, setSupplierBalances] = useState<Record<string, number>>({});
  const [selectedSupplierForAccount, setSelectedSupplierForAccount] = useState<Supplier | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  useEffect(() => { loadSuppliers(); checkPermissions(); }, []);
  useEffect(() => { filterSuppliers(); }, [suppliers, search, statusFilter]);
  useEffect(() => { if (suppliers.length > 0) loadSupplierBalances(); }, [suppliers]);

  const checkPermissions = async () => { const p = await getUserPermissions(); setCanCreate(p.canCreateSuppliers); };
  const loadSuppliers = async () => { setLoading(true); const data = await getSuppliers(); setSuppliers(data); setLoading(false); };
  const loadSupplierBalances = async () => {
    const balances: Record<string, number> = {};
    await Promise.all(suppliers.map(async s => { balances[s.id] = await getSupplierBalance(s.id); }));
    setSupplierBalances(balances);
  };
  const filterSuppliers = () => {
    let f = [...suppliers];
    if (search) f = f.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.contact_name?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") f = f.filter(s => s.status === statusFilter);
    setFilteredSuppliers(f);
  };

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">

        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🏭 Proveedores ({filteredSuppliers.length})</span>
          {canCreate && (
            <Link href="/dashboard/suppliers/new" className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-black">
              <Plus className="h-3 w-3" /> Nuevo
            </Link>
          )}
        </div>

        {/* Search bar */}
        <div className="bg-[#d4d0c8] px-3 py-2 border-b border-[#808080] flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 flex-1 min-w-[180px]">
            <span className="text-xs font-bold">Buscar:</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nombre, email, contacto..."
              className="flex-1 border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold">Estado:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-[#808080] bg-white text-xs px-1 py-0.5 shadow-[inset_1px_1px_2px_#808080] focus:outline-none">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          {(search || statusFilter !== "all") && (
            <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-xs font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 text-red-700">
              <X className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_140px_100px_100px_80px_80px] border-b-2 border-[#808080] bg-[#d4d0c8]">
          {["Proveedor", "Contacto", "Email", "Teléfono", "Ubicación", "Saldo", "Estado"].map((h, i) => (
            <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
          ))}
        </div>

        {/* Table body */}
        <div className="bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <Building2 className="h-10 w-10 opacity-30" />
              <p className="text-sm">{search || statusFilter !== "all" ? "Sin resultados" : "No hay proveedores"}</p>
              {!search && statusFilter === "all" && canCreate && (
                <Link href="/dashboard/suppliers/new" className="border border-[#808080] bg-[#d4d0c8] px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] flex items-center gap-1 mt-2 text-black">
                  <Plus className="h-3 w-3" /> Nuevo Proveedor
                </Link>
              )}
            </div>
          ) : (
            filteredSuppliers.map((supplier, idx) => (
              <div key={supplier.id} className={`grid grid-cols-[1fr_120px_140px_100px_100px_80px_80px] border-b border-[#e0e0e0] hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                  <Link href={`/dashboard/suppliers/${supplier.id}`} className="font-semibold truncate block hover:underline">
                    {supplier.name}
                  </Link>
                  {supplier.tax_id && <span className="text-[10px] text-gray-500 group-hover:text-gray-300">CUIT: {supplier.tax_id}</span>}
                </div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                  {supplier.contact_name ?? "—"}
                </div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                  {supplier.email ? <span className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" />{supplier.email}</span> : "—"}
                </div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa]">
                  {supplier.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{supplier.phone}</span> : "—"}
                </div>
                <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">
                  {supplier.city || supplier.state ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{[supplier.city, supplier.state].filter(Boolean).join(", ")}</span> : "—"}
                </div>
                <div className={`px-2 py-1.5 text-xs text-right font-mono font-bold border-r border-[#e0e0e0] group-hover:border-[#3333aa] ${(supplierBalances[supplier.id] ?? 0) > 0 ? "text-red-600 group-hover:text-red-300" : ""}`}>
                  ${(supplierBalances[supplier.id] ?? 0).toFixed(2)}
                </div>
                <div className="px-2 py-1.5 text-xs text-center flex items-center justify-between gap-1">
                  <span className={supplier.status === "active" ? "text-green-700 group-hover:text-green-300 font-bold" : "text-red-600 group-hover:text-red-300"}>
                    {supplier.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                  <button
                    onClick={() => { setSelectedSupplierForAccount(supplier); setAccountModalOpen(true); }}
                    title="Cuenta corriente"
                    className="text-[#000080] group-hover:text-white"
                  >
                    <FileText className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1">
          <span className="text-xs text-gray-600">Mostrando {filteredSuppliers.length} de {suppliers.length} proveedores</span>
        </div>
      </div>

      {selectedSupplierForAccount && (
        <SupplierAccountModal
          supplierId={selectedSupplierForAccount.id}
          supplierName={selectedSupplierForAccount.name}
          open={accountModalOpen}
          onOpenChange={setAccountModalOpen}
        />
      )}
    </div>
  );
}
