"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "@/lib/actions/categories";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", color: "#3b82f6", sort_order: 0, is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createCategory(formData);
      if (result.error) { toast.error(result.error); }
      else { toast.success("Categoría creada"); router.push("/dashboard/categories"); router.refresh(); }
    } catch { toast.error("Error al crear la categoría"); }
    finally { setLoading(false); }
  };

  const field = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const label = "text-xs font-bold text-black block mb-0.5";

  return (
    <div className="space-y-3 text-black select-none">
      <div className="border-2 border-[#808080] shadow-[2px_2px_0px_#000]">
        <div className="bg-[#000080] px-3 py-1 flex items-center justify-between">
          <span className="text-white text-sm font-bold">🗂 Nueva Categoría</span>
          <Link href="/dashboard/categories" className="text-blue-200 text-xs hover:text-white">← Volver</Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#d4d0c8] p-4 space-y-3">
          <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-3">
            <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3">
              <span className="text-xs font-bold">Información de la Categoría</span>
            </div>

            <div>
              <label className={label}>Nombre *</label>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Electrónica, Ropa..." className={field} />
            </div>

            <div>
              <label className={label}>Descripción</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Descripción de la categoría..." className={field + " resize-none"} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Color</label>
                <div className="flex gap-2">
                  <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-10 h-8 border border-[#808080] cursor-pointer" />
                  <input type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className={field} />
                </div>
              </div>
              <div>
                <label className={label}>Orden</label>
                <input type="number" min="0" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} className={field} />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#808080]">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="border border-[#808080]" />
              <label htmlFor="is_active" className="text-xs font-bold cursor-pointer">Categoría Activa</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Link href="/dashboard/categories" className="border border-[#808080] bg-[#d4d0c8] px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0]">Cancelar</Link>
            <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
              {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar Categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
