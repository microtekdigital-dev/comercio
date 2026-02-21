"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTechnician, updateTechnician } from "@/lib/actions/technicians";
import type { Technician } from "@/lib/types/erp";

interface TechnicianFormProps {
  technician?: Technician;
  companyId: string;
}

export function TechnicianForm({ technician, companyId }: TechnicianFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      specialty: formData.get("specialty") as string || null,
      phone: formData.get("phone") as string || null,
      email: formData.get("email") as string || null,
      notes: formData.get("notes") as string || null,
    };

    try {
      const result = technician
        ? await updateTechnician(technician.id, data)
        : await createTechnician(companyId, data);

      router.push("/dashboard/technicians");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el técnico");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información del Técnico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={technician?.name}
              required
              placeholder="Nombre completo del técnico"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidad</Label>
            <Input
              id="specialty"
              name="specialty"
              defaultValue={technician?.specialty || ""}
              placeholder="Ej: Celulares, Computadoras, Tablets"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={technician?.phone || ""}
                placeholder="Número de contacto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={technician?.email || ""}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={technician?.notes || ""}
              placeholder="Información adicional sobre el técnico"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : technician ? "Actualizar" : "Crear Técnico"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
