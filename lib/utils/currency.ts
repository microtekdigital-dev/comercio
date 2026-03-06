import { CompanySettings } from '@/lib/types/erp';

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
 * Formatea un monto numérico con el símbolo de moneda configurado
 * 
 * @param amount - Monto a formatear
 * @param options - Configuración de formato de moneda
 * @returns String formateado con símbolo de moneda
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: FormatCurrencyOptions
): string {
  // Manejar valores nulos o indefinidos
  const safeAmount = amount ?? 0;
  
  // Formatear número con separadores de miles y decimales
  const decimals = options.decimals ?? 2;
  const locale = options.locale ?? 'es-AR';
  
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeAmount);
  
  // Aplicar símbolo según posición configurada
  if (options.currencyPosition === 'before') {
    return `${options.currencySymbol}${formattedNumber}`;
  } else {
    return `${formattedNumber}${options.currencySymbol}`;
  }
}

/**
 * Formatea un monto usando la configuración de la empresa
 * 
 * @param amount - Monto a formatear
 * @param settings - Configuración de la empresa
 * @returns String formateado con símbolo de moneda
 */
export function formatCompanyCurrency(
  amount: number | null | undefined,
  settings: Pick<CompanySettings, 'currency_symbol' | 'currency_position'>
): string {
  return formatCurrency(amount, {
    currencySymbol: settings.currency_symbol,
    currencyPosition: settings.currency_position,
  });
}

/**
 * Obtiene la configuración de moneda desde los settings de la empresa
 * 
 * @param settings - Configuración completa de la empresa
 * @returns Objeto con configuración de moneda
 */
export function getCurrencyConfig(
  settings: CompanySettings
): FormatCurrencyOptions {
  return {
    currencySymbol: settings.currency_symbol,
    currencyPosition: settings.currency_position,
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
