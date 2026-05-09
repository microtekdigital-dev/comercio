"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/lib/actions/customers";
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

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", document_type: "DNI", document_number: "",
    address: "", city: "", state: "", country: "Argentina", postal_code: "", notes: "",
    status: "active" as "active" | "inactive" | "blocked",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createCustomer(formData);
      if (result.error) { toast.error(result.error); }
      else { toast.success("Cliente creado"); router.push("/dashboard/customers"); router.refresh(); }
    } catch { toast.error("Error al crear el cliente"); }
    finally { setLoading(false); }
  };

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-xs font-bold text-black block mb-0.5";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFormData(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">👥 Nuevo Cliente</span>
          <Link href="/dashboard/customers" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#d4d0c8] p-4 space-y-3">
          <Section title="Información Básica">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className={l}>Nombre Completo *</label>
                <input required value={formData.name} onChange={set("name")} placeholder="Juan Pérez" className={f} />
              </div>
              <div>
                <label className={l}>Estado</label>
                <select value={formData.status} onChange={set("status")} className={f}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
              <div>
                <label className={l}>Email</label>
                <input type="email" value={formData.email} onChange={set("email")} placeholder="juan@ejemplo.com" className={f} />
              </div>
              <div>
                <label className={l}>Teléfono</label>
                <input value={formData.phone} onChange={set("phone")} placeholder="+54 11 1234-5678" className={f} />
              </div>
              <div>
                <label className={l}>Tipo Documento</label>
                <select value={formData.document_type} onChange={set("document_type")} className={f}>
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                  <option value="CUIL">CUIL</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div>
                <label className={l}>Número Documento</label>
                <input value={formData.document_number} onChange={set("document_number")} placeholder="12345678" className={f} />
              </div>
            </div>
          </Section>

          <Section title="Dirección">
            <div>
              <label className={l}>Dirección</label>
              <input value={formData.address} onChange={set("address")} placeholder="Av. Corrientes 1234" className={f} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={l}>Ciudad</label>
                <input value={formData.city} onChange={set("city")} placeholder="Buenos Aires" className={f} />
              </div>
              <div>
                <label className={l}>Provincia</label>
                <input value={formData.state} onChange={set("state")} placeholder="CABA" className={f} />
              </div>
              <div>
                <label className={l}>Código Postal</label>
                <input value={formData.postal_code} onChange={set("postal_code")} placeholder="C1043" className={f} />
              </div>
            </div>
            <div>
              <label className={l}>País</label>
              <input value={formData.country} onChange={set("country")} placeholder="Argentina" className={f} />
            </div>
          </Section>

          <Section title="Notas">
            <textarea value={formData.notes} onChange={set("notes")} rows={3} placeholder="Información adicional..." className={f + " resize-none"} />
          </Section>

          <div className="flex justify-end gap-2 pt-1">
            <Link href="/dashboard/customers" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</Link>
            <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
