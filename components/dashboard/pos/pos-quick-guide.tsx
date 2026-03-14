'use client';

import { HelpCircle, ShoppingCart, Layers, Tag, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const MAIN_STEPS = [
  'Seleccionar productos del catálogo o buscar por nombre / código.',
  'Si el producto tiene variantes (talla, color, etc.), elegir la variante deseada.',
  'Ajustar cantidades directamente en el carrito.',
  'Opcionalmente, aplicar un descuento (porcentaje o monto fijo) con F3.',
  'Seleccionar cliente o continuar con cliente genérico (F2 para buscar).',
  'Presionar "Finalizar venta" o F12 para ir al cobro.',
  'Elegir el/los método(s) de pago, ingresar montos y confirmar.',
];

const SECTIONS = [
  {
    icon: Layers,
    title: 'Variantes de productos',
    content:
      'Cuando un producto tiene variantes (ej. remera talle M, color rojo), el sistema muestra un selector automáticamente. Las variantes sin stock aparecen deshabilitadas.',
  },
  {
    icon: Tag,
    title: 'Descuentos',
    content:
      'Podés aplicar un descuento global a toda la venta. Elegí entre porcentaje (%) o monto fijo ($). El descuento no puede superar el subtotal de la venta.',
  },
  {
    icon: CreditCard,
    title: 'Múltiples métodos de pago',
    content:
      'Podés dividir el cobro entre varios métodos (ej. parte en efectivo, parte con tarjeta). El sistema valida que la suma de los pagos sea igual al total de la venta y calcula el vuelto automáticamente.',
  },
];

// =====================================================
// Component
// =====================================================

/**
 * Botón con modal que muestra una guía rápida del flujo de venta en el POS.
 *
 * Requirements: 1.1-1.8
 */
export function POSQuickGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px] gap-2"
          aria-label="Ver guía rápida del POS"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Ayuda</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Guía rápida del POS
          </DialogTitle>
        </DialogHeader>

        {/* Flujo principal */}
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Flujo básico de venta</h3>
          </div>

          <ol className="space-y-2">
            {MAIN_STEPS.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-muted-foreground leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Secciones adicionales */}
        <div className="mt-5 space-y-4 border-t pt-4">
          {SECTIONS.map(({ icon: Icon, title, content }) => (
            <div key={title} className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">{title}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">{content}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center border-t pt-3">
          Usá F1 para buscar productos y F2 para buscar clientes en cualquier momento.
        </p>
      </DialogContent>
    </Dialog>
  );
}
