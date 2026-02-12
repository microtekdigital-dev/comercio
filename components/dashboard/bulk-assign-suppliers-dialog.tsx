"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Package, AlertCircle } from "lucide-react";
import { getSuppliers } from "@/lib/actions/suppliers";
import { bulkUpdateSupplier, getProductsByIds } from "@/lib/actions/products";
import type { Supplier } from "@/lib/types/erp";

interface BulkAssignSuppliersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds: string[];
  onSuccess: () => void;
}

export function BulkAssignSuppliersDialog({
  open,
  onOpenChange,
  selectedProductIds,
  onSuccess,
}: BulkAssignSuppliersDialogProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [productsWithSupplier, setProductsWithSupplier] = useState(0);

  useEffect(() => {
    if (open) {
      loadSuppliers();
      checkProductsWithSupplier();
    }
  }, [open]);

  const loadSuppliers = async () => {
    setIsLoadingSuppliers(true);
    try {
      const data = await getSuppliers({ status: "active" });
      setSuppliers(data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      toast.error("Error al cargar proveedores");
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const checkProductsWithSupplier = async () => {
    try {
      const products = await getProductsByIds(selectedProductIds);
      const count = products.filter((p) => p.supplier_id).length;
      setProductsWithSupplier(count);
    } catch (error) {
      console.error("Error checking products:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedSupplierId) {
      toast.error("Por favor selecciona un proveedor");
      return;
    }

    setIsLoading(true);
    try {
      const result = await bulkUpdateSupplier(
        selectedProductIds,
        selectedSupplierId
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Proveedor asignado correctamente");
        onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error("Error assigning supplier:", error);
      toast.error("Error al asignar proveedor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSupplierId("");
    setProductsWithSupplier(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Proveedor</DialogTitle>
          <DialogDescription>
            Asignar un proveedor a {selectedProductIds.length} producto(s) seleccionado(s)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{selectedProductIds.length} productos seleccionados</span>
          </div>

          {productsWithSupplier > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {productsWithSupplier} de {selectedProductIds.length} productos ya tienen proveedor asignado. Se sobrescribirán.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="supplier">Proveedor</Label>
            {isLoadingSuppliers ? (
              <div className="flex items-center justify-center h-10 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
                disabled={isLoading}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No hay proveedores disponibles
                    </div>
                  ) : (
                    suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={isLoading || !selectedSupplierId || isLoadingSuppliers}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
