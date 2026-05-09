'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product, ProductVariant } from '@/lib/types/erp';
import { type POSCart, type POSCartItem, INITIAL_POS_CART } from '@/lib/types/pos';

const CART_STORAGE_KEY = 'pos-cart';

function getCartStorageKey(userId: string | null): string {
  return userId ? `pos-cart-${userId}` : CART_STORAGE_KEY;
}

// =====================================================
// Helper: Calculate item-level totals
// =====================================================

function calculateItemTotals(
  quantity: number,
  unitPrice: number,
  taxRate: number,
  discountPercent: number
): Pick<POSCartItem, 'subtotal' | 'tax_amount' | 'total'> {
  const grossSubtotal = quantity * unitPrice;
  const itemDiscount = grossSubtotal * (discountPercent / 100);
  const subtotal = grossSubtotal - itemDiscount;
  // taxRate is stored as a percentage (e.g. 21 = 21%), divide by 100
  const tax_amount = subtotal * (taxRate / 100);
  const total = subtotal + tax_amount;
  return { subtotal, tax_amount, total };
}

// =====================================================
// Exported helper: Calculate cart-level totals
// =====================================================

export function calculateCartTotals(
  items: POSCartItem[],
  discountType: 'percentage' | 'fixed',
  discountValue: number
): Partial<POSCart> {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = items.reduce((sum, item) => sum + item.tax_amount, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * (discountValue / 100);
  } else {
    discountAmount = Math.min(discountValue, subtotal);
  }

  const total = subtotal - discountAmount + taxAmount;

  return {
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total,
  };
}

// =====================================================
// localStorage helpers (SSR-safe)
// =====================================================

function loadCartFromStorage(key: string): POSCart {
  try {
    if (typeof window === 'undefined') return INITIAL_POS_CART;
    const raw = localStorage.getItem(key);
    if (!raw) return INITIAL_POS_CART;
    return JSON.parse(raw) as POSCart;
  } catch {
    return INITIAL_POS_CART;
  }
}

function saveCartToStorage(key: string, cart: POSCart): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(cart));
  } catch {
    // Ignore storage errors (e.g. private browsing quota)
  }
}

function clearCartFromStorage(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// =====================================================
// Hook
// =====================================================

export function usePOSCart() {
  const [cart, setCart] = useState<POSCart>(INITIAL_POS_CART);
  // undefined = not yet resolved, null = resolved but no user, string = user id
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  // Resolve userId from Supabase session (client-only)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Hydrate from localStorage once userId is resolved (wait for auth, not before)
  useEffect(() => {
    if (hydrated || userId === undefined) return;
    const key = getCartStorageKey(userId);
    setCart(loadCartFromStorage(key));
    setHydrated(true);
  }, [userId, hydrated]);

  // Persist to localStorage on every cart change (after hydration)
  useEffect(() => {
    if (!hydrated || userId === undefined) return;
    const key = getCartStorageKey(userId);
    saveCartToStorage(key, cart);
  }, [cart, userId, hydrated]);

  // --------------------------------------------------
  // addItem
  // --------------------------------------------------
  function addItem(
    product: Product,
    variant?: ProductVariant,
    quantity: number = 1
  ): void {
    setCart((prev) => {
      const unitPrice = variant?.price ?? product.price;
      const taxRate = product.tax_rate ?? 0;

      // Check if the same product+variant already exists in the cart
      const existingIndex = prev.items.findIndex(
        (item) =>
          item.product_id === product.id &&
          item.variant_id === (variant?.id ?? null)
      );

      let updatedItems: POSCartItem[];

      if (existingIndex >= 0) {
        // Increment quantity of existing item
        updatedItems = prev.items.map((item, idx) => {
          if (idx !== existingIndex) return item;
          const newQty = item.quantity + quantity;
          const totals = calculateItemTotals(
            newQty,
            item.unit_price,
            item.tax_rate,
            item.discount_percent
          );
          return { ...item, quantity: newQty, ...totals };
        });
      } else {
        // Add as new item
        const totals = calculateItemTotals(quantity, unitPrice, taxRate, 0);
        const newItem: POSCartItem = {
          id: typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(),
          product_id: product.id,
          product_name: product.name,
          product_sku: variant?.sku ?? product.sku,
          variant_id: variant?.id ?? null,
          variant_name: variant?.variant_name ?? null,
          quantity,
          unit_price: unitPrice,
          tax_rate: taxRate,
          discount_percent: 0,
          image_url: product.image_url,
          ...totals,
        };
        updatedItems = [...prev.items, newItem];
      }

      const cartTotals = calculateCartTotals(
        updatedItems,
        prev.discount_type,
        prev.discount_value
      );

      return { ...prev, items: updatedItems, ...cartTotals };
    });
  }

  // --------------------------------------------------
  // updateQuantity
  // --------------------------------------------------
  function updateQuantity(itemId: string, quantity: number): void {
    setCart((prev) => {
      let updatedItems: POSCartItem[];

      if (quantity <= 0) {
        updatedItems = prev.items.filter((item) => item.id !== itemId);
      } else {
        updatedItems = prev.items.map((item) => {
          if (item.id !== itemId) return item;
          const totals = calculateItemTotals(
            quantity,
            item.unit_price,
            item.tax_rate,
            item.discount_percent
          );
          return { ...item, quantity, ...totals };
        });
      }

      const cartTotals = calculateCartTotals(
        updatedItems,
        prev.discount_type,
        prev.discount_value
      );

      return { ...prev, items: updatedItems, ...cartTotals };
    });
  }

  // --------------------------------------------------
  // removeItem
  // --------------------------------------------------
  function removeItem(itemId: string): void {
    setCart((prev) => {
      const updatedItems = prev.items.filter((item) => item.id !== itemId);
      const cartTotals = calculateCartTotals(
        updatedItems,
        prev.discount_type,
        prev.discount_value
      );
      return { ...prev, items: updatedItems, ...cartTotals };
    });
  }

  // --------------------------------------------------
  // recalculateTaxes — apply or remove tax based on invoice type
  // --------------------------------------------------
  function recalculateTaxes(applyTax: boolean): void {
    setCart((prev) => {
      const updatedItems = prev.items.map((item) => {
        const effectiveTaxRate = applyTax ? item.tax_rate : 0;
        const totals = calculateItemTotals(
          item.quantity,
          item.unit_price,
          effectiveTaxRate,
          item.discount_percent
        );
        return { ...item, ...totals };
      });
      const cartTotals = calculateCartTotals(updatedItems, prev.discount_type, prev.discount_value);
      return { ...prev, items: updatedItems, ...cartTotals };
    });
  }

  // --------------------------------------------------
  // updateItemDiscount
  // --------------------------------------------------
  function updateItemDiscount(itemId: string, discountPercent: number): void {
    setCart((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const pct = Math.max(0, Math.min(100, discountPercent));
        const totals = calculateItemTotals(item.quantity, item.unit_price, item.tax_rate, pct);
        return { ...item, discount_percent: pct, ...totals };
      });
      const cartTotals = calculateCartTotals(updatedItems, prev.discount_type, prev.discount_value);
      return { ...prev, items: updatedItems, ...cartTotals };
    });
  }

  // --------------------------------------------------
  // applyDiscount
  // --------------------------------------------------
  function applyDiscount(
    type: 'percentage' | 'fixed',
    value: number
  ): void {
    setCart((prev) => {
      const cartTotals = calculateCartTotals(prev.items, type, value);
      return {
        ...prev,
        discount_type: type,
        discount_value: value,
        ...cartTotals,
      };
    });
  }

  // --------------------------------------------------
  // setCustomer
  // --------------------------------------------------
  function setCustomer(
    customerId: string | null,
    customerName: string | null
  ): void {
    setCart((prev) => ({
      ...prev,
      customer_id: customerId,
      customer_name: customerName,
    }));
  }

  // --------------------------------------------------
  // clearCart
  // --------------------------------------------------
  function clearCart(): void {
    clearCartFromStorage(getCartStorageKey(userId ?? null));
    setCart(INITIAL_POS_CART);
  }

  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    updateItemDiscount,
    recalculateTaxes,
    applyDiscount,
    setCustomer,
    clearCart,
  };
}
