"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Building2, FileText, Settings, Save } from "lucide-react";
import { toast } from "sonner";

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  logo_url?: string;
  default_tax_rate?: number;
  invoice_prefix?: string;
  invoice_next_number?: number;
  terms_and_conditions?: string;
}

interface CompanySettingsAdvancedProps {
  company: CompanyData;
  onUpdate: (data: Partial<CompanyData>) => Promise<{ success: boolean; error?: string }>;
}

export function CompanySettingsAdvanced({ company, onUpdate }: CompanySettingsAdvancedProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company.name || "",
    address: company.address || "",
    city: company.city || "",
    state: company.state || "",
    country: company.country || "Argentina",
    postal_code: company.postal_code || "",
    phone: company.phone || "",
    email: company.email || "",
    tax_id: company.tax_id || "",
    logo_url: company.logo_url || "",
    default_tax_rate: company.default_tax_rate || 21,
    invoice_prefix: company.invoice_prefix || "FAC",
    invoice_next_number: company.invoice_next_number || 1,
    terms_and_conditions: company.terms_and_conditions || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onUpdate(formData);

      if (result.success) {
        toast.success("Configuración actualizada exitosamente");
        router.refresh();
      } else {
        toast.error(result.error || "Error al actualizar la configuración");
      }
    } catch (error) {
      toast.error("Error al actualizar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">
            <Building2 className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="invoicing">
            <FileText className="mr-2 h-4 w-4" />
            Facturación
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Settings className="mr-2 h-4 w-4" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>
                Datos básicos de tu empresa que aparecerán en las facturas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre de la Empresa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_id">CUIT / RUT</Label>
                  <Input
                    id="tax_id"
                    placeholder="20-12345678-9"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+54 11 1234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Dirección</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Calle y Número</Label>
                  <Input
                    id="address"
                    placeholder="Av. Corrientes 1234"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Buenos Aires"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Provincia</Label>
                    <Input
                      id="state"
                      placeholder="CABA"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Código Postal</Label>
                    <Input
                      id="postal_code"
                      placeholder="C1043"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL del Logo</Label>
                <Input
                  id="logo_url"
                  type="url"
                  placeholder="https://ejemplo.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  URL de la imagen del logo de tu empresa (aparecerá en las facturas)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Facturación</CardTitle>
              <CardDescription>
                Personaliza cómo se generan y numeran tus facturas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice_prefix">Prefijo de Factura</Label>
                  <Input
                    id="invoice_prefix"
                    placeholder="FAC"
                    value={formData.invoice_prefix}
                    onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ejemplo: FAC-0001, INV-0001
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_next_number">Próximo Número</Label>
                  <Input
                    id="invoice_next_number"
                    type="number"
                    min="1"
                    value={formData.invoice_next_number}
                    onChange={(e) => setFormData({ ...formData, invoice_next_number: parseInt(e.target.value) || 1 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Próxima factura: {formData.invoice_prefix}-{String(formData.invoice_next_number).padStart(4, '0')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_tax_rate">Tasa de Impuesto por Defecto (%)</Label>
                  <Input
                    id="default_tax_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.default_tax_rate}
                    onChange={(e) => setFormData({ ...formData, default_tax_rate: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    IVA estándar en Argentina: 21%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Términos y Condiciones</CardTitle>
              <CardDescription>
                Texto que aparecerá al pie de tus facturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="terms_and_conditions"
                rows={8}
                placeholder="Ingresa los términos y condiciones que aparecerán en tus facturas..."
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Ejemplo: "Pago dentro de 30 días. Intereses por mora del 2% mensual."
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>
                Datos de identificación de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ID de Empresa:</span>
                <span className="font-mono">{company.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Slug:</span>
                <span className="font-mono">{company.slug}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
