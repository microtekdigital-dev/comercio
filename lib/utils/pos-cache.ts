/**
 * pos-cache.ts
 *
 * Utilidades para manejo del caché de productos frecuentes del POS.
 * Usa localStorage para persistencia entre sesiones.
 *
 * Requirements: 6.1
 */

import type { POSProductSearchResult } from "@/lib/types/pos";

const CACHE_KEY = "pos_frequent_products";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

interface POSProductCache {
  products: POSProductSearchResult[];
  cachedAt: number;
}

// ─── Lectura ──────────────────────────────────────────────────────────────────

/**
 * Lee el caché de productos frecuentes desde localStorage.
 * Retorna null si no existe o si expiró.
 */
export function readProductCache(): POSProductSearchResult[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cache: POSProductCache = JSON.parse(raw);
    const age = Date.now() - cache.cachedAt;

    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return Array.isArray(cache.products) ? cache.products : null;
  } catch {
    return null;
  }
}

// ─── Escritura ────────────────────────────────────────────────────────────────

/**
 * Guarda productos en el caché de localStorage.
 */
export function writeProductCache(products: POSProductSearchResult[]): void {
  if (typeof window === "undefined") return;
  try {
    const cache: POSProductCache = {
      products,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    console.warn("[pos-cache] No se pudo guardar el caché de productos");
  }
}

// ─── Invalidación ─────────────────────────────────────────────────────────────

/**
 * Elimina el caché de productos frecuentes.
 */
export function clearProductCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignorar
  }
}

// ─── Verificación de frescura ─────────────────────────────────────────────────

/**
 * Retorna true si el caché existe y no ha expirado.
 */
export function isProductCacheFresh(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const cache: POSProductCache = JSON.parse(raw);
    return Date.now() - cache.cachedAt < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Retorna la fecha en que se guardó el caché, o null si no existe.
 */
export function getProductCacheAge(): Date | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: POSProductCache = JSON.parse(raw);
    return new Date(cache.cachedAt);
  } catch {
    return null;
  }
}

// ─── Caché de Categorías ──────────────────────────────────────────────────────

import type { Category } from "@/lib/types/erp";

const CATEGORIES_KEY = "pos_cache_categories";
const CATEGORIES_TTL_MS = 60 * 60 * 1000; // 1 hora

interface POSCategoriesCache {
  categories: Category[];
  cachedAt: number;
}

/**
 * Guarda categorías en localStorage con TTL de 1 hora.
 */
export function cachePOSCategories(categories: Category[]): void {
  if (typeof window === "undefined") return;
  try {
    const cache: POSCategoriesCache = { categories, cachedAt: Date.now() };
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cache));
  } catch {
    console.warn("[pos-cache] No se pudo guardar el caché de categorías");
  }
}

/**
 * Obtiene categorías del caché si no expiró. Retorna null si expiró o no existe.
 */
export function getCachedPOSCategories(): Category[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return null;
    const cache: POSCategoriesCache = JSON.parse(raw);
    if (Date.now() - cache.cachedAt > CATEGORIES_TTL_MS) {
      localStorage.removeItem(CATEGORIES_KEY);
      return null;
    }
    return Array.isArray(cache.categories) ? cache.categories : null;
  } catch {
    return null;
  }
}

// ─── Caché de Métodos de Pago ─────────────────────────────────────────────────

const PAYMENT_METHODS_KEY = "pos_cache_payment_methods";
const PAYMENT_METHODS_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface POSPaymentMethodsCache {
  methods: string[];
  cachedAt: number;
}

/**
 * Guarda métodos de pago en localStorage con TTL de 24 horas.
 */
export function cachePOSPaymentMethods(methods: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const cache: POSPaymentMethodsCache = { methods, cachedAt: Date.now() };
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(cache));
  } catch {
    console.warn("[pos-cache] No se pudo guardar el caché de métodos de pago");
  }
}

/**
 * Obtiene métodos de pago del caché si no expiró. Retorna null si expiró o no existe.
 */
export function getCachedPOSPaymentMethods(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PAYMENT_METHODS_KEY);
    if (!raw) return null;
    const cache: POSPaymentMethodsCache = JSON.parse(raw);
    if (Date.now() - cache.cachedAt > PAYMENT_METHODS_TTL_MS) {
      localStorage.removeItem(PAYMENT_METHODS_KEY);
      return null;
    }
    return Array.isArray(cache.methods) ? cache.methods : null;
  } catch {
    return null;
  }
}

// ─── Caché de Configuración de Empresa ───────────────────────────────────────

const COMPANY_SETTINGS_KEY = "pos_cache_company_settings";
const COMPANY_SETTINGS_TTL_MS = 60 * 60 * 1000; // 1 hora

interface POSCompanySettings {
  currency_symbol: string;
  currency_code: string;
  currency_position: string;
}

interface POSCompanySettingsCache {
  settings: POSCompanySettings;
  cachedAt: number;
}

/**
 * Guarda configuración de empresa en localStorage con TTL de 1 hora.
 */
export function cachePOSCompanySettings(settings: POSCompanySettings): void {
  if (typeof window === "undefined") return;
  try {
    const cache: POSCompanySettingsCache = { settings, cachedAt: Date.now() };
    localStorage.setItem(COMPANY_SETTINGS_KEY, JSON.stringify(cache));
  } catch {
    console.warn("[pos-cache] No se pudo guardar el caché de configuración de empresa");
  }
}

/**
 * Obtiene configuración de empresa del caché si no expiró. Retorna null si expiró o no existe.
 */
export function getCachedPOSCompanySettings(): POSCompanySettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COMPANY_SETTINGS_KEY);
    if (!raw) return null;
    const cache: POSCompanySettingsCache = JSON.parse(raw);
    if (Date.now() - cache.cachedAt > COMPANY_SETTINGS_TTL_MS) {
      localStorage.removeItem(COMPANY_SETTINGS_KEY);
      return null;
    }
    return cache.settings ?? null;
  } catch {
    return null;
  }
}

// ─── Limpieza global del caché POS ────────────────────────────────────────────

/**
 * Limpia todo el caché del POS (todas las claves que empiecen con 'pos_cache_').
 */
export function clearPOSCache(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("pos_cache_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignorar
  }
}
