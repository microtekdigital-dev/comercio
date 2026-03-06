"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { CurrencySelector } from "./currency-selector";
import { formatCurrency } from "@/lib/utils/currency";
import { updateCurrencySettings } from "@/lib/actions/company-settings";

interface CurrencySettingsCardProps {
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
}

export function CurrencySettingsCard({ 
  currencyCode, 
  currencySymbol, 
  currencyPosition 
}: CurrencySettingsCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currency_code: currencyCode,
    currency_symbol: currencySymbol,
    currency_position: currencyPosition,
  });

  const handleCurrencyChange = (code: string, symbol: string, position: 'before' | 'after') => {
    setFormData({
      currency_code: code,
      currency_symbol: symbol,
      currency_position: position,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateCurrencySettings(formData);

      if (result.success) {
        toast.success("Configuración de moneda actualizada exitosamente");
        router.refresh();
      } else {
        toast.error(result.error || "Error al actualizar la configuración de moneda");
      }
    } catch (error) {
      toast.error("Error al actualizar la configuración de moneda");
    } finally {
      setLoading(false);
    }
  };

  // Preview del formato
  const previewAmount = 1234.56;
  const formattedPreview = formatCurrency(previewAmount, {
    currencySymbol: formData.currency_symbol,
    currencyPosition: formData.currency_position,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Moneda</CardTitle>
        <CardDescription>
          Selecciona la moneda en la que opera tu empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <CurrencySelector
              value={formData.currency_code}
              onChange={handleCurrencyChange}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Los precios se mostrarán como: <span className="font-semibold">{formattedPreview}</span>
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Guardando..." : "Guardar Moneda"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
