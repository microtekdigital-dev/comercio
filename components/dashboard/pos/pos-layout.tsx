'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, LayoutGrid } from 'lucide-react';

// =====================================================
// Types
// =====================================================

interface POSLayoutProps {
  productGrid: React.ReactNode;
  cart: React.ReactNode;
  /** Cantidad de items en el carrito, para el badge en móvil */
  cartItemCount?: number;
}

// =====================================================
// Mobile tab bar
// =====================================================

type MobileTab = 'products' | 'cart';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  cartItemCount: number;
}

function MobileTabBar({ activeTab, onTabChange, cartItemCount }: MobileTabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background lg:hidden">
      <button
        onClick={() => onTabChange('products')}
        className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors ${
          activeTab === 'products'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Ver productos"
        aria-pressed={activeTab === 'products'}
      >
        <LayoutGrid className="h-5 w-5" />
        <span className="text-xs font-medium">Productos</span>
      </button>

      <button
        onClick={() => onTabChange('cart')}
        className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors ${
          activeTab === 'cart'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label={`Ver carrito${cartItemCount > 0 ? `, ${cartItemCount} items` : ''}`}
        aria-pressed={activeTab === 'cart'}
      >
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartItemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 text-[10px] leading-none flex items-center justify-center"
            >
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </Badge>
          )}
        </div>
        <span className="text-xs font-medium">Carrito</span>
      </button>
    </div>
  );
}

// =====================================================
// POSLayout
// =====================================================

/**
 * Layout principal del POS con adaptación responsive.
 *
 * - Desktop/tablet landscape (lg+): 2 columnas — productos a la izquierda (flex-1),
 *   carrito fijo a la derecha (w-80 / w-96).
 * - Móvil/tablet portrait (<lg): 1 columna con tab bar inferior para alternar
 *   entre la grilla de productos y el carrito.
 *
 * Todos los elementos interactivos tienen min-h-[44px] para facilitar el toque.
 * El layout es completamente funcional desde 320px de ancho (Requirements 9.8).
 *
 * Requirements: 9.1, 9.3, 9.4, 9.6, 9.7, 9.8
 */
export function POSLayout({ productGrid, cart, cartItemCount = 0 }: POSLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('products');

  return (
    <>
      {/* ── Desktop / tablet landscape: 2-column layout ── */}
      <div className="hidden lg:flex h-full w-full min-w-0 gap-0 overflow-hidden">
        {/* Left: product grid — takes remaining space */}
        <div className="flex-1 min-w-0 overflow-hidden p-4">
          {productGrid}
        </div>

        {/* Right: cart — fixed width, always visible */}
        <div className="w-80 xl:w-96 shrink-0 border-l flex flex-col overflow-hidden">
          {cart}
        </div>
      </div>

      {/* ── Mobile / tablet portrait: single-column with tab bar ── */}
      <div className="flex lg:hidden flex-col h-full w-full min-w-0 overflow-hidden">
        {/* Active panel — fills available height above the tab bar */}
        <div className="flex-1 min-h-0 overflow-hidden pb-[56px]">
          {mobileTab === 'products' ? (
            <div className="h-full p-3 overflow-hidden">
              {productGrid}
            </div>
          ) : (
            <div className="h-full overflow-hidden">
              {cart}
            </div>
          )}
        </div>

        {/* Fixed bottom tab bar */}
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          cartItemCount={cartItemCount}
        />
      </div>
    </>
  );
}
