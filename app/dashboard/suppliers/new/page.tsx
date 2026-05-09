"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupplier } from "@/lib/actions/suppliers";
import type { SupplierFormData } from "@/lib/types/erp";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  }, []);

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-xs font-bold text-black block mb-0.5";

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
                <input required name="name" value={formData.name} onChange={handleChange} className={f} />
              </div>
              <div>
                <label className={l}>Contacto</label>
                <input name="contact_name" value={formData.contact_name} onChange={handleChange} className={f} />
              </div>
              <div>
                <label className={l}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={f} />
              </div>
              <div>
                <label className={l}>Teléfono</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className={f} />
              </div>
              <div>
                <label className={l}>CUIT/RUT</label>
                <input name="tax_id" value={formData.tax_id} onChange={handleChange} className={f} />
              </div>
              <div>
                <label className={l}>Sitio Web</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://" className={f} />
              </div>
              <div>
                <label className={l}>Términos de Pago</label>
                <input name="payment_terms" value={formData.payment_terms} onChange={handleChange} placeholder="30 días, Contado..." className={f} />
              </div>
              <div>
                <label className={l}>Estado</label>
                <select name="status" value={formData.status} onChange={handleChange} className={f}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Dirección">
            <div>
              <label className={l}>Dirección</label>
              <input name="address" value={formData.address} onChange={handleChange} className={f} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Ciudad</label>
                <input name="city" value={formData.city} onChange={handleChange} className={f} />
              </div>
              <div>
                <label className={l}>Provincia</label>
                <input name="state" value={formData.state} onChange={handleChange} className={f} />
              </div>
              <div>
                <label className={l}>País</label>
                <input name="country" value={formData.country} onChange={handleChange} className={f} />
              </div>
              <div>
                <label className={l}>Código Postal</label>
                <input name="postal_code" value={formData.postal_code} onChange={handleChange} className={f} />
              </div>
            </div>
          </Section>

          <Section title="Notas">
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Notas adicionales..." className={f + " resize-none"} />
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
