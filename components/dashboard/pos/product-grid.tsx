'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, ScanBarcode } from 'lucide-react';
import { searchPOSProducts, getPOSProductsByCategory } from '@/lib/actions/pos';
import type { POSProductSearchResult } from '@/lib/types/pos';
import type { ProductVariant, Category } from '@/lib/types/erp';
import { VariantSelectorModal } from './variant-selector-modal';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { toast } from 'sonner';

interface ProductGridProps {
  onProductSelect: (product: POSProductSearchResult, variant?: ProductVariant) => void;
  categories?: Category[];
}

export function ProductGrid({ onProductSelect, categories = [] }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<POSProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [variantProduct, setVariantProduct] = useState<POSProductSearchResult | null>(null);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load products by category
  const loadByCategory = useCallback(async (categoryId: string | null) => {
    setLoading(true);
    try {
      const results = await getPOSProductsByCategory(categoryId);
      setProducts(results);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadByCategory(null);
  }, [loadByCategory]);

  // Debounced search (for manual typing)
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadByCategory(selectedCategoryId);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPOSProducts(searchQuery);
        setProducts(results);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategoryId, loadByCategory]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery('');
    loadByCategory(categoryId);
  };

  const handleProductClick = (product: POSProductSearchResult) => {
    const activeVariants = product.variants?.filter((v) => v.is_active) ?? [];
    if (product.has_variants && activeVariants.length > 0) {
      setVariantProduct(product);
    } else {
      onProductSelect(product);
    }
  };

  // Immediately search and add product by barcode/query
  const handleImmediateSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    try {
      const results = await searchPOSProducts(trimmed);
      if (results.length === 0) {
        toast.error(`No se encontró producto: "${trimmed}"`);
        setScanFeedback(null);
        return;
      }
      const product = results[0];
      const activeVariants = product.variants?.filter((v) => v.is_active) ?? [];
      if (product.has_variants && activeVariants.length > 0) {
        // Show variant selector
        setVariantProduct(product);
        setProducts(results);
      } else {
        onProductSelect(product);
        setScanFeedback(product.name);
        setTimeout(() => setScanFeedback(null), 1500);
      }
      setSearchQuery('');
    } catch {
      toast.error('Error al buscar producto');
    }
  }, [onProductSelect]);

  // Handle Enter key in the search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleImmediateSearch(searchQuery);
    }
  };

  // Global barcode scanner hook — fires when input is NOT focused
  useBarcodeScanner({
    onScan: (barcode) => {
      // If search input is focused, let the input handle it via keydown
      if (document.activeElement === searchInputRef.current) return;
      // Otherwise handle globally (scanner fired while focus was elsewhere)
      setScanFeedback(`Escaneando: ${barcode}`);
      handleImmediateSearch(barcode);
    },
    enabled: true,
  });

  const getStockBadge = (product: POSProductSearchResult) => {
    if (!product.track_inventory) return null;
    const stock = product.stock_quantity;
    if (stock <= 0) {
      return <Badge variant="destructive" className="text-xs">Sin stock</Badge>;
    }
    if (stock <= product.min_stock_level) {
      return <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">Stock bajo: {stock}</Badge>;
    }
    return <Badge variant="outline" className="text-xs border-green-500 text-green-600">Stock: {stock}</Badge>;
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Buscar por nombre, código... (Enter para agregar)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="pl-9 pr-9 min-h-[44px]"
        />
        <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Scan feedback */}
      {scanFeedback && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm">
          <ScanBarcode className="h-4 w-4 shrink-0" />
          <span className="truncate">{scanFeedback}</span>
        </div>
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="overflow-x-auto w-full">
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                selectedCategoryId === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                  selectedCategoryId === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product grid */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Package className="h-10 w-10 opacity-40" />
            <p className="text-sm">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="flex flex-col rounded-lg border bg-card hover:bg-accent hover:border-primary transition-colors text-left overflow-hidden min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Product image */}
                <div className="w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>

                {/* Product info */}
                <div className="p-2 flex flex-col gap-1 flex-1">
                  <p className="text-xs font-medium leading-tight line-clamp-2">{product.name}</p>
                  <p className="text-sm font-bold">${product.price.toFixed(2)}</p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {getStockBadge(product)}
                    {product.has_variants && (
                      <Badge variant="secondary" className="text-xs">Variantes</Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Variant selector modal */}
      <VariantSelectorModal
        product={variantProduct}
        onSelect={handleVariantSelect}
        onClose={() => setVariantProduct(null)}
      />
    </div>
  );

  function handleVariantSelect(product: POSProductSearchResult, variant: ProductVariant) {
    onProductSelect(product, variant);
    setVariantProduct(null);
  }
}
