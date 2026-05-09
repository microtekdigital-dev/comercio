"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { getSupplier, updateSupplier, deleteSupplier, getSupplierStats } from "@/lib/actions/suppliers";
import { getUserPermissions } from "@/lib/utils/permissions";
import type { Supplier, SupplierFormData } from "@/lib/types/erp";
import { Save, Trash2, Loader2, ShoppingCart, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full disabled:bg-[#e0e0e0] disabled:text-gray-500";
const l = "text-xs font-bold text-black block mb-0.5";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "", contact_name: "", email: "", phone: "", address: "", city: "",
    state: "", country: "Argentina", postal_code: "", tax_id: "", website: "",
    notes: "", status: "active", payment_terms: "",
  });

  useEffect(() => {
    loadSupplier();
    loadStats();
    checkPermissions();
  }, [id]);

  const checkPermissions = async () => {
    const permissions = await getUserPermissions();
    setCanEdit(permissions.canEditSuppliers);
    setCanDelete(permissions.canDeleteSuppliers);
  };

  const loadSupplier = async () => {
    const data = await getSupplier(id);
    if (data) {
      setSupplier(data);
      setFormData({
        name: data.name, contact_name: data.contact_name || "",
        email: data.email || "", phone: data.phone || "",
        address: data.address || "", city: data.city || "",
        state: data.state || "", country: data.country,
        postal_code: data.postal_code || "", tax_id: data.tax_id || "",
        website: data.website || "", notes: data.notes || "",
        status: data.status, payment_terms: data.payment_terms || "",
      });
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const data = await getSupplierStats(id);
    setStats(data);
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateSupplier(id, formData);
    if (result.error) { toast.error(result.error); }
    else { toast.success("Proveedor actualizado"); loadSupplier(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteSupplier(id);
    if (result.error) { toast.error(result.error); setDeleting(false); setConfirmDelete(false); }
    else { toast.success("Proveedor eliminado"); router.push("/dashboard/suppliers"); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-black">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando proveedor...
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-16 text-black">
        <p className="font-bold">Proveedor no encontrado</p>
        <Link href="/dashboard/suppliers" className="text-blue-700 underline text-xs">← Volver</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-black select-none">
      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-80">
            <div className="bg-[#000080] px-3 py-1">
              <span className="text-white text-sm font-bold">⚠ Confirmar eliminación</span>
            </div>
            <div className="bg-[#d4d0c8] p-4 space-y-3">
              <p className="text-xs">¿Estás seguro que querés eliminar <strong>{supplier.name}</strong>? Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDelete(false)} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deleting} className="border border-[#808080] bg-[#ffcccc] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#ffaaaa] disabled:opacity-50 flex items-center gap-1">
                  {deleting ? <><Loader2 className="h-3 w-3 animate-spin" /> Eliminando...</> : "🗑 Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        {/* Title bar */}
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🏭 {supplier.name}</span>
          <Link href="/dashboard/suppliers" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <div className="bg-[#d4d0c8] p-4 space-y-3">

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: <ShoppingCart className="h-4 w-4" />, label: "Total Órdenes", value: stats.totalOrders, sub: `${stats.pendingOrders} pendientes` },
                { icon: <TrendingUp className="h-4 w-4" />, label: "Total Comprado", value: fmt(stats.totalPurchased) },
                { icon: <DollarSign className="h-4 w-4" />, label: "Total Pagado", value: fmt(stats.totalPaid) },
                { icon: <AlertCircle className="h-4 w-4" />, label: "Saldo Pendiente", value: fmt(stats.balance), color: stats.balance > 0 ? "text-orange-700" : "text-green-700" },
              ].map((s, i) => (
                <div key={i} className="border-2 border-[#808080] bg-white p-2 shadow-[inset_1px_1px_2px_#808080]">
                  <div className="flex items-center gap-1 text-gray-500 mb-1">{s.icon}<span className="text-[10px]">{s.label}</span></div>
                  <div className={`text-base font-bold font-mono ${s.color || ""}`}>{s.value}</div>
                  {s.sub && <div className="text-[10px] text-gray-500">{s.sub}</div>}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <Section title="Información General">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className={l}>Nombre de la Empresa *</label>
                  <input required name="name" disabled={!canEdit} value={formData.name} onChange={handleChange} className={f} />
                </div>
                <div>
                  <label className={l}>Contacto</label>
                  <input name="contact_name" disabled={!canEdit} value={formData.contact_name} onChange={handleChange} className={f} />
                </div>
                <div>
                  <label className={l}>Email</label>
                  <input type="email" name="email" disabled={!canEdit} value={formData.email} onChange={handleChange} className={f} />
                </div>
                <div>
                  <label className={l}>Teléfono</label>
                  <input name="phone" disabled={!canEdit} value={formData.phone} onChange={handleChange} className={f} />
                </div>
                <div>
                  <label className={l}>CUIT/RUT</label>
                  <input name="tax_id" disabled={!canEdit} value={formData.tax_id} onChange={handleChange} className={f} />
                </div>
                <div>
                  <label className={l}>Sitio Web</label>
                  <input type="url" name="website" disabled={!canEdit} value={formData.website} onChange={handleChange} placeholder="https://" className={f} />
                </div>
                <div>
                  <label className={l}>Términos de Pago</label>
                  <input name="payment_terms" disabled={!canEdit} value={formData.payment_terms} onChange={handleChange} placeholder="30 días, Contado..." className={f} />
                </div>
                <div>
                  <label className={l}>Estado</label>
                  <select name="status" disabled={!canEdit} value={formData.status} onChange={handleChange} className={f}>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
            </Section>

            <Section title="Dirección">
              <div>
                <label className={l}>Dirección</label>
                <input name="address" disabled={!canEdit} value={formData.address} onChange={handleChange} className={f} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={l}>Ciudad</label>
                  <input name="city" disabled={!canEdit} value={formData.city} onChange={handleChange} className={f} />
                </div>
                <div>
                  <label className={l}>Provincia</label>
                  <input name="state" disabled={!canEdit} value={formData.state} onChange={handleChange} className={f} />
                </div>
                <div>
                  <label className={l}>País</label>
                  <input name="country" disabled={!canEdit} value={formData.country} onChange={handleChange} className={f} />
                </div>
                <div>
                  <label className={l}>Código Postal</label>
                  <input name="postal_code" disabled={!canEdit} value={formData.postal_code} onChange={handleChange} className={f} />
                </div>
              </div>
            </Section>

            <Section title="Notas">
              <textarea name="notes" disabled={!canEdit} value={formData.notes} onChange={handleChange} rows={3} placeholder="Notas adicionales..." className={f + " resize-none"} />
            </Section>

            <div className="flex justify-between items-center pt-1">
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="border border-[#808080] bg-[#ffcccc] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#ffaaaa] flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Eliminar
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <Link href="/dashboard/suppliers" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">
                  {canEdit ? "Cancelar" : "Volver"}
                </Link>
                {canEdit && (
                  <button type="submit" disabled={saving} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
                    {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : <><Save className="h-3 w-3" /> Guardar Cambios</>}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
