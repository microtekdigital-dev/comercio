'use client';

import { useState, useEffect } from 'react';
import { checkPOSPlanRestrictions, type POSPlanRestrictions } from '@/lib/actions/pos-plan-restrictions';

interface UsePOSPlanRestrictionsReturn {
  restrictions: POSPlanRestrictions | null;
  loading: boolean;
}

const DEFAULT_RESTRICTIONS: POSPlanRestrictions = {
  canUseOfflineMode: false,
  canAccessReports: false,
  maxCashRegisters: 1,
  currentPlan: '',
};

/**
 * Hook para obtener las restricciones del POS según el plan de suscripción.
 * Incluye mensajes de upgrade cuando la funcionalidad no está disponible.
 *
 * @example
 * const { restrictions, loading } = usePOSPlanRestrictions();
 * if (!restrictions?.canAccessReports) {
 *   // Mostrar mensaje de upgrade
 * }
 */
export function usePOSPlanRestrictions(): UsePOSPlanRestrictionsReturn {
  const [restrictions, setRestrictions] = useState<POSPlanRestrictions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRestrictions() {
      try {
        const result = await checkPOSPlanRestrictions();
        if (!cancelled) {
          setRestrictions(result);
        }
      } catch (error) {
        console.error('Error loading POS plan restrictions:', error);
        if (!cancelled) {
          // Fallback to most restrictive defaults on error
          setRestrictions(DEFAULT_RESTRICTIONS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRestrictions();
    return () => { cancelled = true; };
  }, []);

  return { restrictions, loading };
}
