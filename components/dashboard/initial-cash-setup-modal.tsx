"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { setInitialCashAmount } from "@/lib/actions/company-settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InitialCashSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  amount: number;
}

export function InitialCashSetupModal({ isOpen, onClose, onSave }: InitialCashSetupModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const result = await setInitialCashAmount(data.amount);
      
      if (result.success) {
        toast({
          title: "Importe inicial configurado",
          description: "El importe inicial de caja ha sido guardado exitosamente.",
        });
        reset();
        onSave();
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo configurar el importe inicial",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el importe inicial",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Configurar Caja Inicial</DialogTitle>
          </div>
          <DialogDescription>
            Ingresa el importe con el que comenzarás a operar tu caja. Este valor se utilizará como sugerencia en tu primera apertura de caja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Importe Inicial *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register("amount", {
                required: "El importe es requerido",
                min: {
                  value: 0.01,
                  message: "El importe debe ser mayor a cero",
                },
                valueAsNumber: true,
              })}
              disabled={isLoading}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
