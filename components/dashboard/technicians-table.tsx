"use client";

import { useEffect, useState } from "react";
import { Pencil, UserCheck, UserX, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getTechnicians, updateTechnician } from "@/lib/actions/technicians";
import type { Technician } from "@/lib/types/erp";

export function TechniciansTable({ companyId }: { companyId: string }) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [technicianToToggle, setTechnicianToToggle] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);
  const [technicianToDelete, setTechnicianToDelete] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTechnicians();
  }, [showInactive, companyId]);

  async function loadTechnicians() {
    if (!companyId) return;
    setLoading(true);
    const data = await getTechnicians(companyId, !showInactive);
    setTechnicians(data);
    setLoading(false);
  }

  function confirmToggleActive(id: string, name: string, currentStatus: boolean) {
    setTechnicianToToggle({ id, name, currentStatus });
  }

  function confirmDelete(id: string, name: string) {
    setTechnicianToDelete({ id, name });
  }

  async function handleDelete() {
    if (!technicianToDelete) return;

    try {
      const { id } = technicianToDelete;
      
      // Eliminar permanentemente de la base de datos
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Técnico eliminado",
        description: "El técnico ha sido eliminado permanentemente.",
      });
      
      loadTechnicians();
    } catch (error) {
      console.error('Error deleting technician:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el técnico. Puede tener reparaciones asignadas.",
        variant: "destructive",
      });
    } finally {
      setTechnicianToDelete(null);
    }
  }

  async function handleToggleActive() {
    if (!technicianToToggle) return;

    try {
      const { id, currentStatus } = technicianToToggle;
      await updateTechnician(id, { is_active: !currentStatus });
      
      // If deactivating, automatically show inactive technicians
      if (currentStatus) {
        setShowInactive(true);
        toast({
          title: "Técnico desactivado",
          description: "El técnico ha sido desactivado. Ahora puedes ver técnicos inactivos.",
        });
      } else {
        toast({
          title: "Técnico activado",
          description: "El técnico ha sido activado correctamente.",
        });
      }
      
      loadTechnicians();
    } catch (error) {
      console.error('Error toggling technician status:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del técnico",
        variant: "destructive",
      });
    } finally {
      setTechnicianToToggle(null);
    }
  }

  if (loading) {
    return <div>Cargando técnicos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="show-inactive"
          checked={showInactive}
          onCheckedChange={setShowInactive}
        />
        <Label htmlFor="show-inactive">Mostrar técnicos inactivos</Label>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Reparaciones Activas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay técnicos registrados
                </TableCell>
              </TableRow>
            ) : (
              technicians.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">{tech.name}</TableCell>
                  <TableCell>{tech.specialty || "-"}</TableCell>
                  <TableCell>
                    {tech.is_active ? (
                      <Badge variant="default" className="bg-green-600">
                        <UserCheck className="mr-1 h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <UserX className="mr-1 h-3 w-3" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tech.active_repairs_count || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/technicians/${tech.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmToggleActive(tech.id, tech.name, tech.is_active)}
                        title={tech.is_active ? "Desactivar técnico" : "Activar técnico"}
                      >
                        {tech.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      {!tech.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(tech.id, tech.name)}
                          title="Eliminar técnico permanentemente"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!technicianToToggle} onOpenChange={() => setTechnicianToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {technicianToToggle?.currentStatus ? "¿Desactivar técnico?" : "¿Activar técnico?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {technicianToToggle?.currentStatus ? (
                <>
                  ¿Estás seguro de que deseas desactivar a <strong>{technicianToToggle?.name}</strong>?
                  El técnico no aparecerá en la lista de técnicos activos, pero podrás reactivarlo más tarde.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas activar a <strong>{technicianToToggle?.name}</strong>?
                  El técnico volverá a estar disponible para asignar reparaciones.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive}>
              {technicianToToggle?.currentStatus ? "Desactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!technicianToDelete} onOpenChange={() => setTechnicianToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar técnico permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente a <strong>{technicianToDelete?.name}</strong>?
              Esta acción no se puede deshacer. Si el técnico tiene reparaciones asignadas, no podrá ser eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
