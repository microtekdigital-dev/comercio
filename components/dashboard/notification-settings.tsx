"use client";

import { useState, useEffect } from "react";
import { getNotificationPreferences, updateNotificationPreferences, runNotificationChecks, type NotificationPreferences } from "@/lib/actions/notifications";
import { toast } from "sonner";
import { Bell, Mail, Package, DollarSign, ShoppingCart, CheckCircle, Settings as SettingsIcon, RefreshCw, RotateCcw, Wrench, Loader2 } from "lucide-react";

const NOTIF_ITEMS = [
  { key: "low_stock_enabled", icon: Package, label: "Stock Bajo", desc: "Cuando un producto alcanza el stock mínimo" },
  { key: "pending_payment_enabled", icon: DollarSign, label: "Pagos Pendientes", desc: "Recordatorios de ventas con pagos pendientes" },
  { key: "new_sale_enabled", icon: ShoppingCart, label: "Nuevas Ventas", desc: "Cuando se registra una nueva venta" },
  { key: "payment_received_enabled", icon: CheckCircle, label: "Pagos Recibidos", desc: "Cuando se registra un pago" },
  { key: "system_enabled", icon: SettingsIcon, label: "Sistema", desc: "Actualizaciones y mensajes importantes" },
  { key: "sale_return_enabled", icon: RotateCcw, label: "Devoluciones", desc: "Cuando se registra una devolución" },
  { key: "repair_status_change_enabled", icon: Wrench, label: "Cambios en Reparaciones", desc: "Cuando cambia el estado de una reparación" },
  { key: "email_notifications", icon: Mail, label: "Notificaciones por Email", desc: "Enviar resumen diario de notificaciones" },
] as const;

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<Partial<NotificationPreferences>>({
    low_stock_enabled: true, pending_payment_enabled: true, new_sale_enabled: true,
    payment_received_enabled: true, system_enabled: true, sale_return_enabled: true,
    repair_status_change_enabled: true, email_notifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getNotificationPreferences().then(p => { if (p) setPrefs(p); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateNotificationPreferences(prefs);
    if (result.success) toast.success("Preferencias guardadas"); else toast.error("Error al guardar");
    setSaving(false);
  };

  const handleCheck = async () => {
    setChecking(true);
    const result = await runNotificationChecks();
    if (result.success) toast.success("Verificación completada"); else toast.error("Error al verificar");
    setChecking(false);
  };

  if (loading) return (
    <div className="border-2 border-[#808080] bg-white p-4 flex items-center gap-2 text-xs text-gray-500">
      <Loader2 className="h-3 w-3 animate-spin" /> Cargando preferencias...
    </div>
  );

  return (
    <div className="border-2 border-[#808080] bg-white shadow-[inset_1px_1px_2px_#808080] p-3 space-y-3">
      <div className="bg-[#c0c0c0] border-b border-[#808080] -mx-3 -mt-3 px-3 py-1 mb-3 flex items-center justify-between">
        <span className="text-xs font-bold">🔔 Notificaciones</span>
        <button onClick={handleCheck} disabled={checking} className="border border-[#808080] bg-[#d4d0c8] px-2 py-0.5 text-[10px] font-bold shadow-[1px_1px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
          <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Verificando..." : "Verificar ahora"}
        </button>
      </div>

      <div className="space-y-1">
        {NOTIF_ITEMS.map(({ key, icon: Icon, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-1.5 border-b border-[#e0e0e0] last:border-b-0">
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <div>
                <div className="text-xs font-bold">{label}</div>
                <div className="text-[10px] text-gray-500">{desc}</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!prefs[key as keyof NotificationPreferences]}
              onChange={() => setPrefs(p => ({ ...p, [key]: !p[key as keyof NotificationPreferences] }))}
              className="border border-[#808080] w-4 h-4 cursor-pointer"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1 border-t border-[#808080]">
        <button onClick={handleSave} disabled={saving} className="border border-[#808080] bg-[#d4d0c8] px-6 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#808080] hover:bg-[#c0c0c0] disabled:opacity-50 flex items-center gap-1">
          {saving ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</> : "✔ Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
