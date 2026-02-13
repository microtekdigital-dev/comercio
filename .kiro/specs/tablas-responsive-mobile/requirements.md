# Requisitos: Tablas Responsive con Tarjetas en Móvil

## Descripción General
Convertir las tablas de listado en las páginas de órdenes de compra, productos y ventas a un formato de tarjetas (cards) en dispositivos móviles para mejorar la legibilidad cuando hay nombres largos de productos (hasta 35 caracteres).

## Problema Actual
Las tablas con nombres largos de productos causan desbordamiento horizontal en dispositivos móviles, haciendo difícil la navegación y lectura del contenido.

## Historias de Usuario

### 1. Como usuario móvil, quiero ver las órdenes de compra en formato de tarjetas
**Criterios de Aceptación:**
- 1.1 En pantallas menores a 768px, la tabla se reemplaza por tarjetas
- 1.2 Cada tarjeta muestra toda la información de la orden de forma vertical
- 1.3 Los badges de estado y pago son visibles en las tarjetas
- 1.4 El botón "Ver detalles" está accesible en cada tarjeta
- 1.5 Las tarjetas mantienen el mismo orden que la tabla
- 1.6 Los filtros funcionan correctamente con el formato de tarjetas

### 2. Como usuario móvil, quiero ver los productos en formato de tarjetas
**Criterios de Aceptación:**
- 2.1 En pantallas menores a 768px, la tabla se reemplaza por tarjetas
- 2.2 Cada tarjeta muestra el nombre completo del producto sin truncar
- 2.3 La información de stock, precio y categoría es visible
- 2.4 Los badges de stock bajo son visibles en las tarjetas
- 2.5 Las acciones (editar, eliminar) están accesibles en cada tarjeta
- 2.6 Las tarjetas se adaptan a nombres de hasta 35 caracteres

### 3. Como usuario móvil, quiero ver las ventas en formato de tarjetas
**Criterios de Aceptación:**
- 3.1 En pantallas menores a 768px, la tabla se reemplaza por tarjetas
- 3.2 Cada tarjeta muestra la información de la venta de forma clara
- 3.3 El número de venta, cliente, fecha y total son visibles
- 3.4 Los badges de estado de pago son visibles en las tarjetas
- 3.5 El botón "Ver detalles" está accesible en cada tarjeta
- 3.6 Las tarjetas mantienen la consistencia visual con las otras páginas

### 4. Como usuario de escritorio, quiero seguir viendo las tablas tradicionales
**Criterios de Aceptación:**
- 4.1 En pantallas de 768px o más, se muestra la tabla tradicional
- 4.2 No hay cambios visuales en la versión de escritorio
- 4.3 La transición entre formatos es fluida al cambiar el tamaño de pantalla
- 4.4 El rendimiento no se ve afectado

## Páginas Afectadas
1. `/app/dashboard/purchase-orders/page.tsx` - Órdenes de Compra
2. `/app/dashboard/products/page.tsx` - Productos
3. `/app/dashboard/sales/page.tsx` - Ventas

## Restricciones Técnicas
- Usar Tailwind CSS para el responsive design (breakpoint `md:`)
- Mantener los componentes UI existentes (Card, Badge, Button)
- No modificar la lógica de negocio ni las funciones de filtrado
- Mantener la accesibilidad en ambos formatos

## Consideraciones de Diseño
- Las tarjetas deben tener padding y spacing consistente
- Usar la misma paleta de colores y badges existentes
- Mantener la jerarquía visual de la información
- Asegurar que los botones de acción sean fáciles de tocar (min 44px)

## Fuera de Alcance
- Otras páginas con tablas no mencionadas
- Cambios en el diseño de escritorio
- Modificaciones a los componentes UI base
- Optimizaciones de rendimiento más allá del responsive design
