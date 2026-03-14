'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, UserPlus, X, ChevronDown } from 'lucide-react';
import { getCustomers } from '@/lib/actions/customers';
import type { Customer } from '@/lib/types/erp';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onCreateNew: () => void;
}

export function CustomerSelector({
  selectedCustomer,
  onSelect,
  onCreateNew,
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search — 300ms
  const search = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const data = await getCustomers({ search: query || undefined, status: 'active' });
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      search(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDropdown = () => {
    setIsOpen(true);
    setSearchQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (customer: Customer | null) => {
    onSelect(customer);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew();
  };

  // ── Selected state ──────────────────────────────────────────────────────────
  if (selectedCustomer) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 min-h-[44px]">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedCustomer.name}</p>
          {selectedCustomer.email && (
            <p className="text-xs text-muted-foreground truncate">{selectedCustomer.email}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => handleSelect(null)}
          title="Cambiar cliente"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // ── Dropdown state ──────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={openDropdown}
        className="flex items-center gap-2 w-full rounded-lg border bg-card px-3 py-2 min-h-[44px] text-left hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm text-muted-foreground">Venta sin cliente (genérico)</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="relative p-2 border-b">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 min-h-[40px]"
            />
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto">
            {/* Venta sin cliente */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors min-h-[44px]"
            >
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Venta sin cliente</p>
                <p className="text-xs text-muted-foreground">Se asignará al cliente genérico</p>
              </div>
              <Badge variant="secondary" className="ml-auto text-xs">Genérico</Badge>
            </button>

            {/* Search results */}
            {loading ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            ) : results.length === 0 && searchQuery ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No se encontraron clientes
              </div>
            ) : (
              results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-accent transition-colors min-h-[44px]"
                >
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{customer.name}</p>
                    {(customer.email || customer.phone) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {customer.email ?? customer.phone}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer: Nuevo cliente */}
          <div className="border-t p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full min-h-[40px] gap-2"
              onClick={handleCreateNew}
            >
              <UserPlus className="h-4 w-4" />
              Nuevo cliente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
