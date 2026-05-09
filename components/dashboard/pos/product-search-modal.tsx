"use client";

import { useState, useEffect, useRef, memo } from "react";
import { searchPOSProducts, getPOSProductsByCategory } from "@/lib/actions/pos";
import type { POSProductSearchResult } from "@/lib/types/pos";
import { Search, Plus, Loader2 } from "lucide-react";

interface ProductSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: POSProductSearchResult) => void;
  currencySymbol: string;
}

export const ProductSearchModal = memo(function ProductSearchModal({ open, onClose, onSelect, currencySymbol }: ProductSearchModalProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<POSProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all products on open
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setLoading(true);
    getPOSProductsByCategory(null)
      .then(setResults)
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      });
  }, [open]);

  // Search on type
  useEffect(() => {
    if (!open || !search.trim()) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchPOSProducts(search);
        setResults(r);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-[4px_4px_0px_#000] w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Title bar */}
        <div className="flex items-center justify-between bg-[#000080] px-2 py-1 shrink-0">
          <span className="text-white text-sm font-bold">Buscar Artículo</span>
          <button onClick={onClose} className="w-5 h-5 bg-[#d4d0c8] border border-[#808080] text-black text-xs flex items-center justify-center font-bold hover:bg-[#c0c0c0]">✕</button>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#808080] shrink-0">
          <Search className="h-4 w-4 text-[#000080] shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código, SKU..."
            className="flex-1 border border-[#808080] bg-white text-sm px-2 py-1 shadow-[inset_1px_1px_2px_#808080] focus:outline-none focus:border-[#000080]"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[#000080] shrink-0" />}
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[80px_1fr_100px_80px_60px] border-b-2 border-[#808080] bg-[#d4d0c8] sticky top-0">
            {["Código", "Descripción", "Precio", "Stock", ""].map((h, i) => (
              <div key={i} className="text-xs font-bold px-2 py-1 border-r border-[#808080] last:border-r-0">{h}</div>
            ))}
          </div>

          {results.length === 0 && !loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">No se encontraron productos</div>
          ) : results.map((product, idx) => (
            <div
              key={product.id}
              onClick={() => { onSelect(product); onClose(); }}
              className={`grid grid-cols-[80px_1fr_100px_80px_60px] border-b border-[#e0e0e0] cursor-pointer hover:bg-[#000080] hover:text-white group text-black ${idx % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}`}
            >
              <div className="px-2 py-1.5 text-xs font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate">{product.sku ?? "—"}</div>
              <div className="px-2 py-1.5 text-xs border-r border-[#e0e0e0] group-hover:border-[#3333aa] truncate font-medium">{product.name}</div>
              <div className="px-2 py-1.5 text-xs text-right font-mono border-r border-[#e0e0e0] group-hover:border-[#3333aa]">{currencySymbol}{product.price.toFixed(2)}</div>
              <div className={`px-2 py-1.5 text-xs text-center border-r border-[#e0e0e0] group-hover:border-[#3333aa] ${product.track_inventory && product.stock_quantity <= 0 ? "text-red-600 group-hover:text-red-300" : ""}`}>
                {product.track_inventory ? product.stock_quantity : "∞"}
              </div>
              <div className="flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 text-[#000080] group-hover:text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-3 py-2 border-t border-[#808080] shrink-0">
          <button onClick={onClose} className="border border-[#808080] bg-[#d4d0c8] px-4 py-1 text-xs font-bold shadow-[2px_2px_0px_#808080] active:shadow-none hover:bg-[#c0c0c0]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});
