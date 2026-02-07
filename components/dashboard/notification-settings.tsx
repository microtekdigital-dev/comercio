"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  runNotificationChecks,
  type NotificationPreferences,
} from "@/lib/actions/notifications";
import { toast } from "sonner";
import { Bell, Mail, Package, DollarSign, ShoppingCart, CheckCircle, Settings as SettingsIcon, RefreshCw } from "lucide-react";

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
    low_stock_enabled: true,
    pending_payment_enabled: true,
    new_sale_enabled: true,
    payment_received_enabled: true,
    system_enabled: true,
    email_notifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    const prefs = await getNotificationPreferences();
    if (prefs) {
      setPreferences(prefs);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateNotificationPreferences(preferences);
    if (result.success) {
      toast.success("Preferencias guardadas exitosamente");
    } else {
      toast.error("Error al guardar preferencias");
    }
    setSaving(false);
  };

  const handleRunChecks = async () => {
    setChecking(true);
    const result = await runNotificationChecks();
    if (result.success) {
      toast.success("Verificación completada. Se crearon notificaciones si hay alertas.");
    } else {
      toast.error("Error al ejecutar verificación");
    }
    setChecking(false);
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Cargando preferencias...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones
        </CardTitle>
        <CardDescription>
          Configura qué notificaciones deseas recibir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Check Button */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium mb-1">Verificar Alertas Ahora</h3>
              <p className="text-xs text-muted-foreground">
                Ejecuta manualmente la verificación de stock bajo y pagos pendientes
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRunChecks}
              disabled={checking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? "Verificando..." : "Verificar"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* In-App Notifications */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Notificaciones en la aplicación</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="low_stock" className="cursor-pointer">
                      Stock Bajo
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cuando un producto alcanza el stock mínimo
                    </p>
                  </div>
                </div>
                <Switch
                  id="low_stock"
                  checked={preferences.low_stock_enabled}
                  onCheckedChange={() => handleToggle('low_stock_enabled')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="pending_payment" className="cursor-pointer">
                      Pagos Pendientes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Recordatorios de ventas con pagos pendientes
                    </p>
                  </div>
                </div>
                <Switch
                  id="pending_payment"
                  checked={preferences.pending_payment_enabled}
                  onCheckedChange={() => handleToggle('pending_payment_enabled')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="new_sale" className="cursor-pointer">
                      Nuevas Ventas
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cuando se registra una nueva venta
                    </p>
                  </div>
                </div>
                <Switch
                  id="new_sale"
                  checked={preferences.new_sale_enabled}
                  onCheckedChange={() => handleToggle('new_sale_enabled')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="payment_received" className="cursor-pointer">
                      Pagos Recibidos
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cuando se registra un pago
                    </p>
                  </div>
                </div>
                <Switch
                  id="payment_received"
                  checked={preferences.payment_received_enabled}
                  onCheckedChange={() => handleToggle('payment_received_enabled')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="system" className="cursor-pointer">
                      Notificaciones del Sistema
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Actualizaciones y mensajes importantes
                    </p>
                  </div>
                </div>
                <Switch
                  id="system"
                  checked={preferences.system_enabled}
                  onCheckedChange={() => handleToggle('system_enabled')}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Email Notifications */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Notificaciones por Email</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="email" className="cursor-pointer">
                    Recibir notificaciones por email
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar resumen diario de notificaciones
                  </p>
                </div>
              </div>
              <Switch
                id="email"
                checked={preferences.email_notifications}
                onCheckedChange={() => handleToggle('email_notifications')}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
