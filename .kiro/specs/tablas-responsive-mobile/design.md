# Diseño: Tablas Responsive con Tarjetas en Móvil

## Visión General
Implementar un sistema de visualización adaptativo que muestre tablas en escritorio y tarjetas en móvil para las páginas de órdenes de compra, productos y ventas. El diseño utilizará Tailwind CSS con el breakpoint `md:` (768px) como punto de transición.

## Arquitectura de Componentes

### Estrategia de Implementación
Cada página tendrá dos secciones de renderizado condicional:
1. Vista de tabla (oculta en móvil con `hidden md:block`)
2. Vista de tarjetas (visible en móvil con `block md:hidden`)

### Breakpoint Utilizado
- **Móvil**: < 768px (vista de tarjetas)
- **Escritorio**: ≥ 768px (vista de tabla)

## Diseño por Página

### 1. Órdenes de Compra (`purchase-orders/page.tsx`)

#### Vista de Tabla (Escritorio)
Mantener la tabla actual sin cambios:
```tsx
<Card className="hidden md:block">
  <Table>
    {/* Tabla existente */}
  </Table>
</Card>
```

#### Vista de Tarjetas (Móvil)
```tsx
<div className="block md:hidden space-y-3">
  {filteredOrders.map((order) => (
    <Card key={order.id} className="p-4">
      <div className="space-y-3">
        {/* Header con número y badges */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm">{order.order_number}</p>
            <p className="text-xs text-muted-foreground">{order.supplier?.name}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getStatusBadge(order.status)}
            {getPaymentStatusBadge(order.payment_status)}
          </div>
        </div>

        {/* Información principal */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Fecha</p>
            <p className="font-medium">{formatDate(order.order_date)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold">{formatCurrency(order.total)}</p>
          </div>
        </div>

        {/* Botón de acción */}
        <Link href={`/dashboard/purchase-orders/${order.id}`} className="block">
          <Button variant="outline" size="sm" className="w-full">
            Ver detalles
          </Button>
        </Link>
      </div>
    </Card>
  ))}
</div>
```

**Estructura de la Tarjeta:**
- Número de orden (destacado) + Proveedor
- Badges de estado y pago (alineados a la derecha)
- Grid 2 columnas: Fecha | Total
- Botón "Ver detalles" de ancho completo

---

### 2. Productos (`products/page.tsx`)

**Nota**: Esta página ya usa un grid de tarjetas. Solo necesita ajustes menores para mejorar la visualización en móvil.

#### Ajustes Necesarios
1. Mejorar el grid responsive:
```tsx
// Cambiar de:
grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5

// A:
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

2. Ajustar tamaños de texto en móvil:
```tsx
// Nombre del producto
<h3 className="font-semibold line-clamp-2 text-sm md:text-base">
  {product.name}
</h3>

// Precio
<p className="text-lg md:text-xl font-bold">
  {formatCurrency(product.price)}
</p>
```

3. Mejorar el manejo de nombres largos:
```tsx
// Usar line-clamp-2 en lugar de line-clamp-1 para nombres
<h3 className="font-semibold line-clamp-2 text-sm md:text-base break-words">
  {product.name}
</h3>
```

**No requiere vista de tabla adicional** - el diseño de tarjetas funciona bien en todas las resoluciones.

---

### 3. Ventas (`sales/page.tsx`)

**Nota**: Esta página ya usa tarjetas horizontales. Necesita optimización para móvil.

#### Vista Actual (Optimizar)
La página ya tiene un diseño de tarjetas, pero necesita mejoras para móvil:

```tsx
<div className="space-y-3">
  {sales.map((sale) => (
    <Link key={sale.id} href={`/dashboard/sales/${sale.id}`}>
      <Card className="p-4 hover:bg-muted/50 transition-colors">
        <div className="space-y-3">
          {/* Header con número y badges */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm md:text-base truncate">
                {sale.sale_number}
              </p>
              {sale.customer && (
                <p className="text-xs text-muted-foreground truncate">
                  {sale.customer.name}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1 justify-end">
              {getStatusBadge(sale.status)}
              {getPaymentStatusBadge(sale.payment_status)}
            </div>
          </div>

          {/* Información secundaria */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <span>{formatDate(sale.sale_date)}</span>
              <span>•</span>
              <span>{sale.items?.length || 0} items</span>
            </div>
            <p className="text-base md:text-lg font-bold text-foreground">
              {formatCurrency(sale.total)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  ))}
</div>
```

**Mejoras Aplicadas:**
- Mejor manejo de wrap en badges
- Truncate en textos largos
- Separación visual más clara entre secciones
- Total más prominente

---

## Componentes Reutilizables

### MobileCard Component (Opcional)
Si se detecta mucha repetición, crear un componente genérico:

```tsx
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <Card className={cn("p-4 space-y-3", className)}>
      {children}
    </Card>
  );
}
```

## Estilos y Clases Tailwind

### Clases Comunes
```css
/* Ocultar en móvil, mostrar en escritorio */
.hidden md:block

/* Mostrar en móvil, ocultar en escritorio */
.block md:hidden

/* Espaciado responsive */
.space-y-3 md:space-y-4
.p-4 md:p-6

/* Texto responsive */
.text-sm md:text-base
.text-base md:text-lg

/* Grid responsive */
.grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

### Manejo de Texto Largo
```css
/* Truncar en una línea */
.truncate

/* Limitar a 2 líneas */
.line-clamp-2

/* Permitir saltos de palabra */
.break-words

/* Prevenir desbordamiento */
.overflow-hidden
```

## Consideraciones de Accesibilidad

### Touch Targets
- Botones mínimo 44px de altura en móvil
- Espaciado adecuado entre elementos interactivos (min 8px)

### Contraste
- Mantener los mismos colores y badges existentes
- Asegurar contraste mínimo 4.5:1 para texto

### Navegación
- Mantener la misma estructura de enlaces
- Asegurar que las tarjetas sean completamente clickeables

## Manejo de Estados

### Loading State
```tsx
{loading && (
  <div className="text-center py-8 text-muted-foreground">
    Cargando...
  </div>
)}
```

### Empty State
Mantener los estados vacíos existentes, asegurando que sean responsive:
```tsx
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
  <h3 className="mt-4 text-base md:text-lg font-semibold">
    No hay {entity}
  </h3>
  <p className="text-muted-foreground mt-2 text-sm md:text-base">
    {message}
  </p>
</div>
```

## Transiciones y Animaciones

### Hover States
```tsx
// Solo aplicar hover en dispositivos que lo soporten
className="hover:bg-muted/50 transition-colors"
```

### Smooth Transitions
```tsx
// Transiciones suaves al cambiar de tamaño
className="transition-all duration-200"
```

## Testing Responsive

### Breakpoints a Probar
1. **320px** - iPhone SE (móvil pequeño)
2. **375px** - iPhone estándar
3. **768px** - Tablet (punto de transición)
4. **1024px** - Desktop pequeño
5. **1440px** - Desktop estándar

### Escenarios de Prueba
1. Nombres de productos de 35 caracteres
2. Múltiples badges simultáneos
3. Listas con 1, 5, 10, 50+ items
4. Filtros activos
5. Estados vacíos

## Propiedades de Correctness

### Propiedad 1: Visibilidad Exclusiva
**Validación: Requirements 1.1, 2.1, 3.1**

Para cualquier breakpoint dado, solo una vista (tabla o tarjetas) debe ser visible:
- Si width < 768px → solo tarjetas visibles
- Si width ≥ 768px → solo tabla visible
- Nunca ambas vistas visibles simultáneamente

### Propiedad 2: Paridad de Datos
**Validación: Requirements 1.5, 2.6, 3.6**

La vista de tarjetas debe mostrar la misma información que la tabla:
- Mismo número de items
- Mismos datos por item
- Mismo orden de items
- Mismos filtros aplicados

### Propiedad 3: Accesibilidad de Acciones
**Validación: Requirements 1.4, 2.5, 3.5**

Todas las acciones disponibles en tabla deben estar en tarjetas:
- Botones de acción presentes
- Links funcionando correctamente
- Touch targets ≥ 44px

### Propiedad 4: Manejo de Overflow
**Validación: Requirements 2.2, 2.6**

Ningún texto debe causar scroll horizontal:
- Nombres largos (35 chars) contenidos
- Uso de truncate o line-clamp
- break-words aplicado donde necesario

### Propiedad 5: Transición Fluida
**Validación: Requirements 4.3**

Al cambiar el tamaño de ventana:
- No hay flash de contenido
- Transición suave entre vistas
- No hay pérdida de estado (filtros, scroll)

## Implementación por Fases

### Fase 1: Órdenes de Compra
1. Agregar vista de tarjetas móvil
2. Aplicar clases de visibilidad condicional
3. Probar con datos reales

### Fase 2: Productos
1. Ajustar grid responsive
2. Mejorar manejo de texto largo
3. Optimizar tamaños de fuente

### Fase 3: Ventas
1. Optimizar tarjetas existentes
2. Mejorar layout en móvil
3. Ajustar espaciado y wrapping

### Fase 4: Testing y Refinamiento
1. Probar en dispositivos reales
2. Ajustar según feedback
3. Validar propiedades de correctness

## Notas de Implementación

### No Modificar
- Lógica de negocio existente
- Funciones de filtrado
- Acciones del servidor
- Componentes UI base

### Modificar Mínimamente
- Estructura JSX (agregar vistas condicionales)
- Clases CSS (agregar responsive)
- Imports (solo si se crean componentes nuevos)

### Crear Nuevo
- Vistas de tarjetas para móvil
- Clases responsive adicionales
- (Opcional) Componente MobileCard reutilizable
