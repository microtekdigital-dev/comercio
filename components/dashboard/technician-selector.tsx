"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getTechnicians } from "@/lib/actions/technicians";
import type { Technician } from "@/lib/types/erp";

interface TechnicianSelectorProps {
  companyId: string;
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  required?: boolean;
  allowNone?: boolean;
}

export function TechnicianSelector({
  companyId,
  value,
  onValueChange,
  label = "Técnico",
  required = false,
  allowNone = true,
}: TechnicianSelectorProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechnicians();
  }, [companyId]);

  async function loadTechnicians() {
    if (!companyId) return;
    setLoading(true);
    const data = await getTechnicians(companyId, true); // Solo activos
    setTechnicians(data);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar técnico"} />
        </SelectTrigger>
        <SelectContent>
          {allowNone && (
            <SelectItem value="none">Sin asignar</SelectItem>
          )}
          {technicians.map((tech) => (
            <SelectItem key={tech.id} value={tech.id}>
              {tech.name}
              {tech.specialty && ` - ${tech.specialty}`}
            </SelectItem>
          ))}
          {technicians.length === 0 && !loading && (
            <SelectItem value="empty" disabled>
              No hay técnicos disponibles
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
