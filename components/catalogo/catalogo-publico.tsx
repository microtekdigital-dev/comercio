"use client";

import { useState, useMemo } from "react";
import type { CatalogoPublicoData, CartItem, CatalogoProduct, CatalogoVariant } from "@/lib/types/catalogo";
import { ProductoCard } from "./producto-card";
import { CarritoDrawer } from "./carrito-drawer";
import { ShoppingCart, Search, Package } from "lucide-react";

interface Props {
  data: CatalogoPublicoData;
}

export function CatalogoPublico({ data }: Props) {
  const { company, settings, products, plan_tier, orders_this_month } = data;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [carritoOpen, setCarritoOpen] = useState(false);

  const primaryColor = plan_tier === "empresarial" ? settings.primary_color : "#3B82F6";
  const logoUrl = plan_tier === "empresarial" ? (settings.logo_url ?? company.logo_url) : company.logo_url;
  const pedidosHabilitados = plan_tier !== "basico";
  const limiteAlcanzado = plan_tier === "profesional" && orders_this_month >= 50;
  const [search, setSearch] = useState("");

  function addToCart(product: CatalogoProduct, variant: CatalogoVariant | null = null, quantity: number = 1) {
    const variantId = variant?.id ?? null;
    const variantName = variant?.variant_name ?? null;
    const unitPrice = variant?.price ?? product.price;
    const maxStock = variant ? variant.stock_quantity : product.stock_quantity;

    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product_id === product.id && i.variant_id === variantId
      );
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id && i.variant_id === variantId
            ? { ...i, quantity: Math.min(i.quantity + quantity, maxStock) }
            : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          product_image: product.image_url,
          variant_id: variantId,
          variant_name: variantName,
          unit_price: unitPrice,
          quantity: Math.min(quantity, maxStock),
          max_stock: maxStock,
        },
      ];
    });
  }

  function updateCartItem(productId: string, variantId: string | null, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) =>
        prev.filter((i) => !(i.product_id === productId && i.variant_id === variantId))
      );
    } else {
      setCart((prev) =>
        prev.map((i) =>
          i.product_id === productId && i.variant_id === variantId
            ? { ...i, quantity: Math.min(quantity, i.max_stock) }
            : i
        )
      );
    }
  }

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero / Header */}
      <header
        className="relative text-white pb-10 pt-8 px-4 shadow-md overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: "white" }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10"
          style={{ backgroundColor: "white" }}
        />

        <div className="max-w-5xl mx-auto relative">
          {/* Top bar: logo + cart */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={company.name}
                  className="h-12 w-12 rounded-full object-cover bg-white shadow-md ring-2 ring-white/30"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shadow-md ring-2 ring-white/30">
                  <Package className="h-6 w-6 text-white/80" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold leading-tight">{company.name}</h1>
                <p className="text-white/70 text-xs">
                  {products.length} {products.length === 1 ? "producto" : "productos"} disponibles
                </p>
              </div>
            </div>

            {pedidosHabilitados && !limiteAlcanzado && (
              <button
                onClick={() => setCarritoOpen(true)}
                className="relative flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
                aria-label="Ver carrito"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:inline">Carrito</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-white/20 placeholder-white/60 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 border border-white/20"
            />
          </div>
        </div>
      </header>

      {/* Aviso plan básico */}
      {!pedidosHabilitados && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-center text-sm text-yellow-800 dark:text-yellow-300">
          Este catálogo es solo de visualización. Los pedidos no están disponibles.
        </div>
      )}

      {/* Aviso límite Pro */}
      {limiteAlcanzado && (
        <div className="bg-orange-50 dark:bg-orange-950 border-b border-orange-200 dark:border-orange-800 px-4 py-2 text-center text-sm text-orange-800 dark:text-orange-300">
          Los pedidos online están temporalmente deshabilitados este mes.
        </div>
      )}

      {/* Productos */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg">
              {search.trim()
                ? `No se encontraron productos para "${search}"`
                : "No hay productos disponibles en este momento."}
            </p>
            {search.trim() && (
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-sm text-blue-500 hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductoCard
                key={product.id}
                product={product}
                canAddToCart={pedidosHabilitados && !limiteAlcanzado}
                onAddToCart={(variant: CatalogoVariant | null) => addToCart(product, variant)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Carrito drawer */}
      {pedidosHabilitados && !limiteAlcanzado && (
        <CarritoDrawer
          open={carritoOpen}
          onClose={() => setCarritoOpen(false)}
          cart={cart}
          onUpdateItem={updateCartItem}
          onOrderSuccess={() => setCart([])}
          slug={company.slug}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}
