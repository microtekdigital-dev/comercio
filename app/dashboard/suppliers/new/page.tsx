"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupplier } from "@/lib/actions/suppliers";
import type { SupplierFormData } from "@/lib/types/erp";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "", contact_name: "", email: "", phone: "", address: "", city: "",
    state: "", country: "Argentina", postal_code: "", tax_id: "", website: "",
    notes: "", status: "active", payment_terms: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createSupplier(formData);
    if (result.error) { toast.error(result.error); setLoading(false); }
    else { toast.success("Proveedor creado"); router.push("/dashboard/suppliers"); }
  };

  const set = (k: keyof SupplierFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(p => ({ ...p, [k]: e.target.value }));

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-xs font-bold text-black block mb-0.5";

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-3">
      <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
        <span className="text-xs font-bold">{title}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🏭 Nuevo Proveedor</span>
          <Link href="/dashboard/suppliers" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#d4d0c8] p-4 space-y-3">
          <Section title="Información General">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className={l}>Nombre de la Empresa *</label>
                <input required value={formData.name} onChange={set("name")} className={f} />
              </div>
              <div>
                <label className={l}>Contacto</label>
                <input value={formData.contact_name} onChange={set("contact_name")} className={f} />
              </div>
              <div>
                <label className={l}>Email</label>
                <input type="email" value={formData.email} onChange={set("email")} className={f} />
              </div>
              <div>
                <label className={l}>Teléfono</label>
                <input value={formData.phone} onChange={set("phone")} className={f} />
              </div>
              <div>
                <label className={l}>CUIT/RUT</label>
                <input value={formData.tax_id} onChange={set("tax_id")} className={f} />
              </div>
              <div>
                <label className={l}>Sitio Web</label>
                <input type="url" value={formData.website} onChange={set("website")} placeholder="https://" className={f} />
              </div>
              <div>
                <label className={l}>Términos de Pago</label>
                <input value={formData.payment_terms} onChange={set("payment_terms")} placeholder="30 días, Contado..." className={f} />
              </div>
              <div>
                <label className={l}>Estado</label>
                <select value={formData.status} onChange={set("status")} className={f}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Dirección">
            <div>
              <label className={l}>Dirección</label>
              <input value={formData.address} onChange={set("address")} className={f} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Ciudad</label>
                <input value={formData.city} onChange={set("city")} className={f} />
              </div>
              <div>
                <label className={l}>Provincia</label>
                <input value={formData.state} onChange={set("state")} className={f} />
              </div>
              <div>
                <label className={l}>País</label>
                <input value={formData.country} onChange={set("country")} className={f} />
              </div>
              <div>
                <label className={l}>Código Postal</label>
                <input value={formData.postal_code} onChange={set("postal_code")} className={f} />
              </div>
            </div>
          </Section>

          <Section title="Notas">
            <textarea value={formData.notes} onChange={set("notes")} rows={3} placeholder="Notas adicionales..." className={f + " resize-none"} />
          </Section>

          <div className="flex justify-end gap-2 pt-1">
            <Link href="/dashboard/suppliers" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</Link>
            <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Crear Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
