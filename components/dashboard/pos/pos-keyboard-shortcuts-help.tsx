'use client';

import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// =====================================================
// Data
// =====================================================

const SHORTCUTS = [
  {
    key: 'F1',
    description: 'Enfocar búsqueda de productos',
    category: 'Navegación',
  },
  {
    key: 'F2',
    description: 'Enfocar búsqueda de clientes',
    category: 'Navegación',
  },
  {
    key: 'F3',
    description: 'Abrir modal de descuento',
    category: 'Acciones',
  },
  {
    key: 'F4',
    description: 'Abrir selector de método de pago',
    category: 'Acciones',
  },
  {
    key: 'F9',
    description: 'Cancelar venta (solicita confirmación)',
    category: 'Venta',
  },
  {
    key: 'F12',
    description: 'Finalizar venta',
    category: 'Venta',
  },
  {
    key: 'Enter',
    description: 'Confirmar acción en modal activo',
    category: 'General',
  },
  {
    key: 'Esc',
    description: 'Cerrar modal o cancelar acción',
    category: 'General',
  },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Navegación: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Acciones: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Venta: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  General: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

// =====================================================
// Component
// =====================================================

/**
 * Botón con modal que muestra todos los atajos de teclado disponibles en el POS.
 *
 * Requirements: 5.1-5.8
 */
export function POSKeyboardShortcutsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px] gap-2"
          aria-label="Ver atajos de teclado"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Atajos</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atajos de teclado
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-1">
          {SHORTCUTS.map(({ key, description, category }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-2 py-1 text-xs font-mono font-semibold min-w-[40px] shrink-0">
                  {key}
                </kbd>
                <span className="text-sm text-foreground truncate">{description}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_COLORS[category]}`}
              >
                {category}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground text-center">
          Los atajos están disponibles en todo momento mientras el POS está activo.
        </p>
      </DialogContent>
    </Dialog>
  );
}
