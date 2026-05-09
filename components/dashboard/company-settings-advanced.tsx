"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CurrencySelector } from "@/components/dashboard/currency-selector";
import { formatCurrency } from "@/lib/utils/currency";

interface CompanyData {
  id: string; name: string; slug: string;
  address?: string; city?: string; state?: string; country?: string; postal_code?: string;
  phone?: string; email?: string; tax_id?: string; logo_url?: string;
  default_tax_rate?: number; invoice_prefix?: string; invoice_next_number?: number;
  terms_and_conditions?: string; currency_code?: string; currency_symbol?: string;
  currency_position?: 'before' | 'after';
}

interface CompanySettingsAdvancedProps {
  company: CompanyData;
  onUpdate: (data: Partial<CompanyData>) => Promise<{ success: boolean; error?: string }>;
}

export function CompanySettingsAdvanced({ company, onUpdate }: CompanySettingsAdvancedProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"general" | "invoicing" | "advanced">("general");
  const [formData, setFormData] = useState({
    name: company.name || "", address: company.address || "", city: company.city || "",
    state: company.state || "", country: company.country || "Argentina",
    postal_code: company.postal_code || "", phone: company.phone || "",
    email: company.email || "", tax_id: company.tax_id || "", logo_url: company.logo_url || "",
    default_tax_rate: company.default_tax_rate || 21,
    invoice_prefix: company.invoice_prefix || "FAC",
    invoice_next_number: company.invoice_next_number || 1,
    terms_and_conditions: company.terms_and_conditions || "",
    currency_code: company.currency_code || "USD",
    currency_symbol: company.currency_symbol || "$",
    currency_position: (company.currency_position || "before") as 'before' | 'after',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onUpdate(formData);
      if (result.success) { toast.success("Configuración actualizada"); router.refresh(); }
      else toast.error(result.error || "Error al actualizar");
    } catch { toast.error("Error al actualizar"); }
    finally { setLoading(false); }
  };

  const f = "border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080] w-full";
  const l = "text-xs font-bold text-black block mb-0.5";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(p => ({ ...p, [k]: e.target.value }));

  const TABS = [
    { id: "general" as const, icon: "🏢", label: "General" },
    { id: "invoicing" as const, icon: "📄", label: "Facturación" },
    { id: "advanced" as const, icon: "⚙", label: "Avanzado" },
  ];

  return (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080]">
      <div className="bg-[#c0c0c0] border-b border-[#808080] px-3 py-1">
        <span className="text-xs font-bold">🏢 Configuración de la Empresa</span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[#808080] bg-[#d4d0c8]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-xs font-bold border-r border-[#808080] last:border-r-0 flex items-center gap-1 ${tab === t.id ? "bg-white border-b-2 border-b-white -mb-px" : "hover:bg-[#c0c0c0]"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-3 space-y-3">
        {/* General */}
        {tab === "general" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Nombre de la Empresa *</label>
                <input required value={formData.name} onChange={set("name")} className={f} />
              </div>
              <div>
                <label className={l}>CUIT / RUT</label>
                <input value={formData.tax_id} onChange={set("tax_id")} placeholder="20-12345678-9" className={f} />
              </div>
              <div>
                <label className={l}>Email</label>
                <input type="email" value={formData.email} onChange={set("email")} placeholder="contacto@empresa.com" className={f} />
              </div>
              <div>
                <label className={l}>Teléfono</label>
                <input value={formData.phone} onChange={set("phone")} placeholder="+54 11 1234-5678" className={f} />
              </div>
            </div>
            <div className="border-t border-[#808080] pt-3">
              <div className="text-xs font-bold mb-2">Dirección</div>
              <div className="space-y-2">
                <div>
                  <label className={l}>Calle y Número</label>
                  <input value={formData.address} onChange={set("address")} placeholder="Av. Corrientes 1234" className={f} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className={l}>Ciudad</label><input value={formData.city} onChange={set("city")} placeholder="Buenos Aires" className={f} /></div>
                  <div><label className={l}>Provincia</label><input value={formData.state} onChange={set("state")} placeholder="CABA" className={f} /></div>
                  <div><label className={l}>Código Postal</label><input value={formData.postal_code} onChange={set("postal_code")} placeholder="C1043" className={f} /></div>
                </div>
                <div><label className={l}>País</label><input value={formData.country} onChange={set("country")} className={f} /></div>
              </div>
            </div>
            <div>
              <label className={l}>URL del Logo</label>
              <input type="url" value={formData.logo_url} onChange={set("logo_url")} placeholder="https://ejemplo.com/logo.png" className={f} />
              <span className="text-[10px] text-gray-500">Aparecerá en las facturas</span>
            </div>
          </div>
        )}

        {/* Invoicing */}
        {tab === "invoicing" && (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold mb-2">Moneda</div>
              <CurrencySelector
                value={formData.currency_code}
                onChange={(code, symbol, position) => setFormData(p => ({ ...p, currency_code: code, currency_symbol: symbol, currency_position: position }))}
              />
              <span className="text-[10px] text-gray-500">Vista previa: {formatCurrency(1234.56, { currencySymbol: formData.currency_symbol, currencyPosition: formData.currency_position })}</span>
            </div>
            <div className="border-t border-[#808080] pt-3 grid grid-cols-2 gap-3">
              <div>
                <label className={l}>Prefijo de Factura</label>
                <input value={formData.invoice_prefix} onChange={set("invoice_prefix")} placeholder="FAC" className={f} />
                <span className="text-[10px] text-gray-500">Ej: FAC-0001</span>
              </div>
              <div>
                <label className={l}>Próximo Número</label>
                <input type="number" min="1" value={formData.invoice_next_number} onChange={e => setFormData(p => ({ ...p, invoice_next_number: parseInt(e.target.value) || 1 }))} className={f} />
                <span className="text-[10px] text-gray-500">Próxima: {formData.invoice_prefix}-{String(formData.invoice_next_number).padStart(4, "0")}</span>
              </div>
              <div>
                <label className={l}>IVA por Defecto (%)</label>
                <input type="number" step="0.01" min="0" max="100" value={formData.default_tax_rate} onChange={e => setFormData(p => ({ ...p, default_tax_rate: parseFloat(e.target.value) || 0 }))} className={f} />
                <span className="text-[10px] text-gray-500">IVA estándar Argentina: 21%</span>
              </div>
            </div>
          </div>
        )}

        {/* Advanced */}
        {tab === "advanced" && (
          <div className="space-y-3">
            <div>
              <label className={l}>Términos y Condiciones</label>
              <textarea rows={6} value={formData.terms_and_conditions} onChange={set("terms_and_conditions")} placeholder="Texto que aparecerá al pie de tus facturas..." className={f + " resize-none"} />
            </div>
            <div className="border-t border-[#808080] pt-3 space-y-1">
              <div className="text-xs font-bold mb-1">Información del Sistema</div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">ID Empresa:</span><span className="font-mono">{company.id}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Slug:</span><span className="font-mono">{company.slug}</span></div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[#808080]">
          <button type="submit" disabled={loading} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
            {loading ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
