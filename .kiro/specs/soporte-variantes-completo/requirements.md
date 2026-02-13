# Soporte Completo de Variantes en Todas las Áreas

## 1. Descripción General

El sistema ya tiene implementado el soporte de variantes de productos en varias áreas (ventas, órdenes de compra, historial de stock y precios). Sin embargo, hay áreas críticas que aún no muestran correctamente la información de variantes o no las consideran en sus cálculos y exportaciones.

## 2. Problema Actual

### 2.1 Lista de Productos (page.tsx)
- ✅ Muestra badge de variantes
- ✅ Calcula stock total de variantes
- ✅ Detecta stock bajo en variantes
- ❌ **Problema**: El filtro de "stock bajo" no funciona correctamente con variantes en el backend

### 2.2 Dashboard/Estadísticas (erp-stats.tsx)
- ✅ Muestra productos con stock bajo incluyendo variantes
- ❌ **Problema**: Los "Productos Más Vendidos" no consideran variantes (solo muestra el producto padre)
- ❌ **Problema**: El conteo de productos con stock bajo puede no ser preciso

### 2.3 Exportaciones (export.ts)
- ❌ **Problema**: Las exportaciones de productos a Excel/CSV no incluyen información de variantes
- ❌ **Problema**: Los reportes PDF de inventario no muestran variantes
- ❌ **Problema**: Las exportaciones de ventas no muestran qué variante se vendió

### 2.4 Email de Presupuesto (quote-email.tsx)
- ❌ **Problema**: El email no muestra el nombre de la variante seleccionada
- ❌ **Problema**: Solo muestra "product_name" sin información de talle/color

## 3. Historias de Usuario

### 3.1 Como usuario, quiero ver las variantes en las exportaciones
**Criterios de Aceptación:**
- Las exportaciones de productos a Excel/CSV deben incluir una fila por cada variante activa
- Cada fila de variante debe mostrar: nombre del producto, nombre de variante, SKU de variante, precio, stock, stock mínimo
- Los productos sin variantes deben exportarse como antes
- Las exportaciones de ventas deben mostrar qué variante específica se vendió

### 3.2 Como usuario, quiero ver las variantes en los reportes PDF
**Criterios de Aceptación:**
- Los reportes PDF de inventario deben listar variantes como sub-items del producto
- Debe mostrarse el stock de cada variante
- El reporte debe indicar claramente qué variantes tienen stock bajo

### 3.3 Como usuario, quiero ver las variantes en los emails de presupuesto
**Criterios de Aceptación:**
- El email debe mostrar el nombre de la variante junto al nombre del producto
- Formato sugerido: "Remera Básica - Talle M / Color Rojo"
- Debe ser claro y legible para el cliente

### 3.4 Como usuario, quiero que las estadísticas consideren variantes
**Criterios de Aceptación:**
- Los "Productos Más Vendidos" deben mostrar variantes individuales si corresponde
- El conteo de productos con stock bajo debe ser preciso considerando variantes
- Las estadísticas deben reflejar la realidad del inventario con variantes

### 3.5 Como usuario, quiero que el filtro de stock bajo funcione con variantes
**Criterios de Aceptación:**
- Al activar el filtro "Solo stock bajo", deben aparecer productos que tengan al menos una variante con stock bajo
- El filtro debe funcionar correctamente en el backend (getProducts)
- Debe ser consistente con la lógica de detección de stock bajo en el frontend

## 4. Requisitos Técnicos

### 4.1 Backend
- Modificar `getProducts` en `lib/actions/products.ts` para que el filtro `lowStock` considere variantes
- Modificar `getTopProducts` en `lib/actions/analytics.ts` para considerar ventas por variante
- Asegurar que todas las queries incluyan información de variantes cuando sea necesario

### 4.2 Frontend
- Actualizar funciones de exportación en `lib/utils/export.ts`
- Actualizar template de email en `lib/email/templates/quote-email.tsx`
- Actualizar componente de estadísticas en `components/dashboard/erp-stats.tsx`

### 4.3 Datos
- Las variantes deben incluir: `variant_name`, `sku`, `price`, `stock_quantity`, `min_stock_level`
- Los items de venta/presupuesto deben incluir: `variant_id`, `variant_name`

## 5. Restricciones

- No modificar la estructura de la base de datos (ya está correcta)
- Mantener compatibilidad con productos sin variantes
- No romper funcionalidad existente
- Las exportaciones deben seguir siendo eficientes incluso con muchas variantes

## 6. Casos de Uso

### 6.1 Exportar Inventario con Variantes
1. Usuario va a Productos
2. Hace clic en "Exportar" → "Exportar a Excel"
3. El archivo Excel incluye:
   - Productos sin variantes: 1 fila por producto
   - Productos con variantes: 1 fila por cada variante activa
4. Cada fila de variante muestra toda la información relevante

### 6.2 Ver Productos Más Vendidos con Variantes
1. Usuario va al Dashboard
2. En la sección "Productos Más Vendidos"
3. Ve las variantes individuales más vendidas (ej: "Remera Básica - Talle M")
4. Puede identificar qué talles/colores son más populares

### 6.3 Recibir Presupuesto por Email
1. Cliente recibe email de presupuesto
2. En la tabla de items ve: "Remera Básica - Talle M / Color Rojo"
3. Puede identificar claramente qué variante se está cotizando
4. No hay confusión sobre el producto específico

## 7. Prioridad

**Alta** - Estas funcionalidades son críticas para la experiencia del usuario y la correcta gestión del inventario con variantes.

## 8. Dependencias

- Sistema de variantes ya implementado (✅ completado)
- Tablas de base de datos con soporte de variantes (✅ completado)
- Componentes de UI para variantes (✅ completado)
