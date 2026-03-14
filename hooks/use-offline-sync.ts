"use client";

/**
 * useOfflineSync - Hook para modo offline del POS (Plan Empresarial)
 *
 * Detecta estado online/offline, mantiene cola de ventas pendientes en
 * localStorage y sincroniza automáticamente al recuperar la conexión.
 *
 * Requirements: 6.3, 6.4, 6.5
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { OfflineQueueItem, POSSaleRequest } from "@/lib/types/pos";

const OFFLINE_QUEUE_KEY = "pos_offline_queue";

// ─── Helpers de localStorage ──────────────────────────────────────────────────

function loadQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: OfflineQueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage puede estar lleno o deshabilitado
    console.warn("[useOfflineSync] No se pudo guardar la cola en localStorage");
  }
}

function generateId(): string {
  
  return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseOfflineSyncReturn {
  /** true si hay conexión a internet */
  isOnline: boolean;
  /** Cantidad de ventas pendientes de sincronizar */
  pendingCount: number;
  /** true mientras se está sincronizando */
  isSyncing: boolean;
  /** Agrega una venta a la cola offline */
  addToQueue: (saleData: POSSaleRequest) => OfflineQueueItem;
  /** Sincroniza todas las ventas pendientes con el servidor */
  syncQueue: () => Promise<{ synced: number; failed: number; errors: string[] }>;
  /** Crea una venta offline y la agrega a la cola */
  createOfflineSale: (saleData: POSSaleRequest) => OfflineQueueItem;
  /** Cola completa (para debugging / UI avanzada) */
  queue: OfflineQueueItem[];
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => loadQueue());
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref para evitar sincronizaciones concurrentes
  const syncingRef = useRef(false);

  // ── Detectar cambios de conectividad ────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Persistir cola en localStorage cuando cambia ─────────────────────────────
  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  // ── Sincronización automática al recuperar conexión ──────────────────────────
  const syncQueue = useCallback(async (): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> => {
    if (syncingRef.current) {
      return { synced: 0, failed: 0, errors: ["Sincronización ya en curso"] };
    }

    const pending = queue.filter((item) => item.status === "pending");
    if (pending.length === 0) {
      return { synced: 0, failed: 0, errors: [] };
    }

    syncingRef.current = true;
    setIsSyncing(true);

    // Marcar todos los pendientes como "syncing"
    setQueue((prev) =>
      prev.map((item) =>
        item.status === "pending" ? { ...item, status: "syncing" as const } : item
      )
    );

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Import dinámico para evitar problemas de SSR
      const { syncOfflineSales } = await import("@/lib/actions/pos");
      const result = await syncOfflineSales(pending);

      synced = result.synced;
      failed = result.failed;
      errors.push(...result.errors);

      // Actualizar estado de cada item según resultado
      setQueue((prev) => {
        const updated = prev.map((item) => {
          if (item.status !== "syncing") return item;

          // Buscar si este item tuvo error
          const itemError = result.itemErrors?.find((e) => e.id === item.id);
          if (itemError) {
            return {
              ...item,
              status: "failed" as const,
              retry_count: item.retry_count + 1,
            };
          }

          // Si no hay error, se sincronizó correctamente — remover de la cola
          return null;
        });

        // Filtrar los null (sincronizados exitosamente)
        return updated.filter(Boolean) as OfflineQueueItem[];
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error de sincronización";
      errors.push(message);
      failed = pending.length;

      // Revertir estado de syncing a failed
      setQueue((prev) =>
        prev.map((item) =>
          item.status === "syncing"
            ? { ...item, status: "failed" as const, retry_count: item.retry_count + 1 }
            : item
        )
      );
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }

    return { synced, failed, errors };
  }, [queue]);

  // Auto-sync al recuperar conexión
  useEffect(() => {
    if (isOnline && queue.some((item) => item.status === "pending")) {
      syncQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // ── addToQueue ───────────────────────────────────────────────────────────────
  const addToQueue = useCallback((saleData: POSSaleRequest): OfflineQueueItem => {
    const newItem: OfflineQueueItem = {
      id: generateId(),
      sale_data: saleData,
      timestamp: Date.now(),
      retry_count: 0,
      status: "pending",
    };

    setQueue((prev) => {
      const updated = [...prev, newItem];
      saveQueue(updated);
      return updated;
    });

    return newItem;
  }, []);

  // ── createOfflineSale ────────────────────────────────────────────────────────
  /**
   * Crea una venta offline usando productos del caché y la agrega a la cola.
   * Muestra indicador de estado offline (Requirement 6.5).
   * Requirements: 6.2, 6.3
   */
  const createOfflineSale = useCallback(
    (saleData: POSSaleRequest): OfflineQueueItem => {
      return addToQueue(saleData);
    },
    [addToQueue]
  );

  const pendingCount = queue.filter(
    (item) => item.status === "pending" || item.status === "syncing"
  ).length;

  return {
    isOnline,
    pendingCount,
    isSyncing,
    addToQueue,
    syncQueue,
    createOfflineSale,
    queue,
  };
}
