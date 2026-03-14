'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCompanySettings } from '@/lib/actions/company-settings';
import {
  formatCurrency,
  toCurrencySettings,
  type CurrencySettings,
} from '@/lib/utils/currency';

interface UseCurrencyReturn {
  /** Formatea un monto con la moneda configurada de la empresa */
  formatCurrency: (amount: number | null | undefined) => string;
  /** Símbolo de moneda configurado (ej: '$', '€') */
  currencySymbol: string;
  /** Posición del símbolo ('before' | 'after') */
  currencyPosition: 'before' | 'after';
  /** Código ISO de la moneda (ej: 'ARS', 'USD') */
  currencyCode: string;
  /** true mientras se carga la configuración */
  loading: boolean;
}

const DEFAULT_SETTINGS: CurrencySettings = {
  currency_symbol: '$',
  currency_position: 'before',
  currency_code: 'ARS',
};

/**
 * Hook para obtener la configuración de moneda de la empresa y formatear montos.
 *
 * @example
 * const { formatCurrency, currencySymbol, loading } = useCurrency();
 * // formatCurrency(1234.5) → "$1.234,50"
 */
export function useCurrency(): UseCurrencyReturn {
  const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const companySettings = await getCompanySettings();
        if (!cancelled && companySettings) {
          setSettings(toCurrencySettings(companySettings));
        }
      } catch (error) {
        console.error('Error loading currency settings:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => { cancelled = true; };
  }, []);

  const format = useCallback(
    (amount: number | null | undefined) => formatCurrency(amount, settings),
    [settings]
  );

  return {
    formatCurrency: format,
    currencySymbol: settings.currency_symbol,
    currencyPosition: settings.currency_position,
    currencyCode: settings.currency_code ?? 'ARS',
    loading,
  };
}
