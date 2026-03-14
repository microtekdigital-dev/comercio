"use client";

/**
 * OfflineStatusIndicator
 *
 * Muestra el estado de conexión y la cantidad de ventas pendientes de
 * sincronizar. Se usa en el layout del POS para cumplir Requirement 6.5.
 *
 * Requirements: 6.5
 */

import { WifiOff, Wifi, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OfflineStatusIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSyncClick?: () => void;
  className?: string;
}

export function OfflineStatusIndicator({
  isOnline,
  pendingCount,
  isSyncing,
  onSyncClick,
  className,
}: OfflineStatusIndicatorProps) {
  if (isOnline && pendingCount === 0) {
    // Online y sin pendientes — mostrar solo ícono verde discreto
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs text-green-600",
                className
              )}
            >
              <Wifi className="h-4 w-4" />
              <span className="hidden sm:inline">En línea</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>Conectado al servidor</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800",
                className
              )}
            >
              <WifiOff className="h-4 w-4" />
              <span>Sin conexión</span>
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-amber-200 text-amber-900"
                >
                  {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {pendingCount > 0
              ? `Modo offline activo. ${pendingCount} venta${pendingCount !== 1 ? "s" : ""} se sincronizará${pendingCount !== 1 ? "n" : ""} al recuperar la conexión.`
              : "Modo offline activo. Las ventas se guardarán localmente."}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Online pero con pendientes — mostrar botón de sincronización
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncClick}
            disabled={isSyncing}
            className={cn(
              "inline-flex items-center gap-1.5 border-blue-300 bg-blue-50 text-xs text-blue-700 hover:bg-blue-100",
              className
            )}
          >
            {isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            <span>
              {isSyncing
                ? "Sincronizando..."
                : `${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isSyncing
            ? "Sincronizando ventas offline..."
            : `Hay ${pendingCount} venta${pendingCount !== 1 ? "s" : ""} pendiente${pendingCount !== 1 ? "s" : ""} de sincronizar. Haz clic para sincronizar ahora.`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
