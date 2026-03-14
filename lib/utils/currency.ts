import { CompanySettings } from '@/lib/types/erp';

/**
 * Configuración de moneda para formateo
 */
export interface CurrencySettings {
  currency_symbol: string;
  currency_position: 'before' | 'after';
  currency_code?: string;
}

/** Configuración de moneda por defecto */
const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  currency_symbol: '$',
  currency_position: 'before',
  currency_code: 'ARS',
};

/**
 * Monedas soportadas por el sistema
 */
export const SUPPORTED_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar Estadounidense', position: 'before' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', position: 'after' },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino', position: 'before' },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso Chileno', position: 'before' },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mexicano', position: 'before' },
  COP: { code: 'COP', symbol: '$', name: 'Peso Colombiano', position: 'before' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', position: 'before' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', position: 'before' },
  UYU: { code: 'UYU', symbol: '$U', name: 'Peso Uruguayo', position: 'before' }
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after';
}

export interface FormatCurrencyOptions {
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimals?: number;
  locale?: string;
}

/**
 * Formatea un monto numérico con el símbolo de moneda configurado.
 * Acepta CurrencySettings (nueva API) o FormatCurrencyOptions (API legacy).
 *
 * @param amount - Monto a formatear
 * @param settings - Configuración de moneda (opcional, usa '$' antes por defecto)
 * @returns String formateado con símbolo de moneda
 *
 * @example
 * formatCurrency(1234.5)                                          // "$1.234,50"
 * formatCurrency(1234.5, { currency_symbol: '€', currency_position: 'after' }) // "1.234,50€"
 */
export function formatCurrency(
  amount: number | null | undefined,
  settings?: CurrencySettings | FormatCurrencyOptions
): string {
  const safeAmount = amount ?? 0;

  // Normalizar a FormatCurrencyOptions independientemente del tipo recibido
  let symbol: string;
  let position: 'before' | 'after';
  let decimals: number;
  let locale: string;

  if (!settings) {
    symbol = DEFAULT_CURRENCY_SETTINGS.currency_symbol;
    position = DEFAULT_CURRENCY_SETTINGS.currency_position;
    decimals = 2;
    locale = 'es-AR';
  } else if ('currency_symbol' in settings) {
    // CurrencySettings
    symbol = settings.currency_symbol;
    position = settings.currency_position;
    decimals = 2;
    locale = 'es-AR';
  } else {
    // FormatCurrencyOptions (legacy)
    symbol = settings.currencySymbol;
    position = settings.currencyPosition;
    decimals = settings.decimals ?? 2;
    locale = settings.locale ?? 'es-AR';
  }

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeAmount);

  return position === 'before'
    ? `${symbol}${formattedNumber}`
    : `${formattedNumber}${symbol}`;
}

/**
 * Convierte CompanySettings a CurrencySettings
 */
export function toCurrencySettings(
  settings: Pick<CompanySettings, 'currency_symbol' | 'currency_position' | 'currency_code'>
): CurrencySettings {
  return {
    currency_symbol: settings.currency_symbol,
    currency_position: settings.currency_position,
    currency_code: settings.currency_code,
  };
}

/**
 * Formatea un monto usando la configuración de la empresa
 */
export function formatCompanyCurrency(
  amount: number | null | undefined,
  settings: Pick<CompanySettings, 'currency_symbol' | 'currency_position'>
): string {
  return formatCurrency(amount, {
    currency_symbol: settings.currency_symbol,
    currency_position: settings.currency_position,
  });
}

/**
 * Obtiene la configuración de moneda desde los settings de la empresa
 */
export function getCurrencyConfig(
  settings: CompanySettings
): CurrencySettings {
  return {
    currency_symbol: settings.currency_symbol,
    currency_position: settings.currency_position,
    currency_code: settings.currency_code,
  };
}

/**
 * Obtiene los detalles de una moneda por su código
 * 
 * @param code - Código de moneda (USD, EUR, etc.)
 * @returns Configuración de la moneda o undefined si no existe
 */
export function getCurrencyDetails(code: string): CurrencyConfig | undefined {
  return SUPPORTED_CURRENCIES[code as CurrencyCode];
}

/**
 * Valida si un código de moneda es soportado
 * 
 * @param code - Código de moneda a validar
 * @returns Objeto con resultado de validación
 */
export function validateCurrencyCode(code: string): { valid: boolean; error?: string } {
  if (!code) {
    return { valid: false, error: 'Código de moneda requerido' };
  }
  
  if (!Object.keys(SUPPORTED_CURRENCIES).includes(code)) {
    return { valid: false, error: 'Código de moneda no soportado' };
  }
  
  return { valid: true };
}
