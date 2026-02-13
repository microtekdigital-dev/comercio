# Implementation Plan: Variantes de Productos para Ropa

## Overview

Este plan implementa el sistema de variantes de productos para tiendas de ropa, manteniendo retrocompatibilidad completa con productos simples existentes. La implementación se realiza en fases incrementales, validando funcionalidad core tempranamente.

## Tasks

- [x] 1. Crear schema de base de datos para variantes
  - Crear tabla `product_variants` con constraints y índices
  - Crear tabla `variant_templates` para plantillas guardadas
  - Agregar columnas `has_variants`, `variant_type` y `variant_template_id` a tabla `products`
  - Agregar columna `variant_id` a tablas `stock_movements`, `sale_items`, `purchase_order_items`, `quote_items`
  - Configurar Row Level Security (RLS) para `product_variants` y `variant_templates`
  - Crear script de migración en `scripts/200_create_product_variants.sql`
  - _Requirements: 7.1, 7.2, 2.1.3_

- [ ] 2. Actualizar tipos TypeScript
  - [x] 2.1 Agregar tipos de variantes en `lib/types/erp.ts`
    - Agregar type `VariantType = 'none' | 'shirts' | 'pants' | 'custom'`
    - Agregar interface `VariantTemplate`
    - Agregar interface `ProductVariant`
    - Extender interface `Product` con campos `has_variants`, `variant_type`, `variant_template_id`, `variants`
    - Extender `ProductFormData` con campos de variantes y `variant_template_id`
    - Agregar interface `ProductVariantFormData`
    - Extender `SaleItem`, `StockMovement` con campos `variant_id`, `variant_name`
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1, 2.1.1_

  - [x] 2.2 Crear constantes de tipos predefinidos
    - Crear objeto `VARIANT_TYPES` con configuración de shirts, pants, custom
    - Crear objeto `VARIANT_ERRORS` con mensajes de error (incluir errores de plantillas)
    - Exportar desde `lib/types/erp.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.1.4_

- [ ] 3. Implementar server actions para variantes
  - [x] 3.1 Crear `lib/actions/product-variants.ts`
    - Implementar `getProductVariants(productId)` para obtener variantes de un producto
    - Implementar `createVariantsForProduct()` para crear variantes según tipo
    - Implementar `updateProductVariant()` para actualizar variante individual
    - Implementar `deleteProductVariant()` con validación de stock > 0
    - Implementar `getProductTotalStock()` para calcular suma de variantes
    - Implementar `validateVariantStock()` para validar disponibilidad
    - _Requirements: 2.4, 3.1, 3.2, 9.2_

  - [x]* 3.2 Write property test for variant creation
    - **Property 4: Tipos predefinidos crean todas las variantes**
    - **Validates: Requirements 2.4**
    - Generar productos con variant_type 'shirts' y 'pants'
    - Verificar que se crean exactamente las variantes esperadas según VARIANT_TYPES
    - Tag: `Feature: variantes-productos-ropa, Property 4`

  - [x]* 3.3 Write property test for stock calculation
    - **Property 1: Stock total es suma de variantes**
    - **Validates: Requirements 3.2, 6.2, 7.6**
    - Generar productos con variantes aleatorias y stocks aleatorios
    - Verificar que getProductTotalStock() retorna la suma correcta
    - Tag: `Feature: variantes-productos-ropa, Property 1`

  - [x]* 3.4 Write unit tests for variant CRUD operations
    - Test crear variantes tipo shirts (7 variantes)
    - Test crear variantes tipo pants (10 variantes)
    - Test crear variantes custom
    - Test actualizar stock de variante
    - Test eliminar variante con stock = 0 (éxito)
    - Test eliminar variante con stock > 0 (error)
    - _Requirements: 2.1, 2.2, 2.3, 9.2_

- [ ] 4. Implementar conversión y desactivación de variantes
  - [x] 4.1 Agregar funciones de conversión en `lib/actions/product-variants.ts`
    - Implementar `convertToVariantProduct()` para convertir producto simple a variantes
    - Implementar `disableProductVariants()` con validación de stock cero
    - Manejar distribución de stock en conversión (default o distribute)
    - _Requirements: 4.5, 4.6, 9.3_

  - [ ]* 4.2 Write property test for conversion preserves stock
    - **Property 11: Conversión preserva stock total**
    - **Validates: Requirements 4.6**
    - Generar productos simples con stock aleatorio
    - Convertir a producto con variantes
    - Verificar que suma de stock de variantes = stock original
    - Tag: `Feature: variantes-productos-ropa, Property 11`

  - [ ]* 4.3 Write property test for disable requires zero stock
    - **Property 16: Desactivar variantes requiere stock cero**
    - **Validates: Requirements 9.3**
    - Generar productos con variantes con stock > 0
    - Intentar desactivar variantes
    - Verificar que se rechaza la operación
    - Tag: `Feature: variantes-productos-ropa, Property 16`

  - [ ]* 4.4 Write unit tests for conversion scenarios
    - Test conversión con distribución "default" (todo a primera variante)
    - Test conversión con distribución "distribute" (dividir equitativamente)
    - Test desactivar variantes con stock = 0 (éxito)
    - Test desactivar variantes con stock > 0 (error)
    - _Requirements: 4.6, 9.3_

- [ ] 5. Checkpoint - Validar funcionalidad core de variantes
  - Ejecutar tests de variantes
  - Verificar que se pueden crear, actualizar y eliminar variantes
  - Verificar cálculo de stock total
  - Asegurar que todas las validaciones funcionan correctamente
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [ ] 6. Actualizar server actions de productos
  - [x] 6.1 Modificar `lib/actions/products.ts`
    - Actualizar `createProduct()` para soportar creación con variantes
    - Actualizar `updateProduct()` para manejar productos con variantes
    - Modificar `deleteProduct()` para validar stock en variantes
    - Actualizar `getProduct()` para incluir variantes en la consulta
    - Actualizar `getProducts()` para calcular stock total cuando has_variants = true
    - _Requirements: 1.5, 4.1, 7.6, 9.1_

  - [ ]* 6.2 Write property test for product with variants requires variants
    - **Property 3: Producto con variantes requiere al menos una variante**
    - **Validates: Requirements 1.5**
    - Generar productos con has_variants = true pero sin variantes
    - Intentar guardar
    - Verificar que se rechaza la operación
    - Tag: `Feature: variantes-productos-ropa, Property 3`

  - [ ]* 6.3 Write property test for delete validation
    - **Property 14: Prevenir eliminar producto con stock en variantes**
    - **Validates: Requirements 9.1**
    - Generar productos con variantes con stock > 0
    - Intentar eliminar producto
    - Verificar que se rechaza la operación
    - Tag: `Feature: variantes-productos-ropa, Property 14`

  - [ ]* 6.4 Write property test for backward compatibility
    - **Property 2: Retrocompatibilidad de productos simples**
    - **Validates: Requirements 1.4, 7.3, 7.5, 8.4**
    - Generar productos con has_variants = false
    - Ejecutar operaciones CRUD, consultas de stock, movimientos
    - Verificar que funcionan exactamente igual que antes
    - Tag: `Feature: variantes-productos-ropa, Property 2`

  - [ ]* 6.5 Write unit tests for product operations with variants
    - Test crear producto con variantes tipo shirts
    - Test actualizar producto agregando variantes
    - Test eliminar producto sin variantes (éxito)
    - Test eliminar producto con variantes con stock (error)
    - Test consultar producto incluye array de variantes
    - _Requirements: 1.5, 4.1, 9.1_

- [ ] 7. Actualizar movimientos de stock para variantes
  - [x] 7.1 Modificar `lib/actions/stock-movements.ts`
    - Actualizar funciones para requerir `variant_id` cuando producto tiene variantes
    - Modificar consultas para incluir información de variante
    - Agregar función para filtrar historial por `variant_id`
    - Actualizar cálculo de stock_before y stock_after para variantes
    - _Requirements: 3.3, 3.4, 8.1, 8.2, 8.3_

  - [ ]* 7.2 Write property test for movements require variant_id
    - **Property 6: Movimientos de stock con variantes requieren variant_id**
    - **Validates: Requirements 3.3, 8.1**
    - Generar movimientos para productos con variantes sin variant_id
    - Verificar que se rechaza la operación
    - Tag: `Feature: variantes-productos-ropa, Property 6`

  - [ ]* 7.3 Write property test for variant history filtering
    - **Property 12: Filtrado de historial por variante**
    - **Validates: Requirements 8.2**
    - Generar movimientos para múltiples variantes
    - Filtrar por variant_id específico
    - Verificar que todos los resultados tienen ese variant_id
    - Tag: `Feature: variantes-productos-ropa, Property 12`

  - [ ]* 7.4 Write property test for history includes variant info
    - **Property 13: Historial incluye información de variante**
    - **Validates: Requirements 8.3**
    - Generar movimientos para productos con variantes
    - Consultar historial
    - Verificar que cada registro incluye product_id, variant_id y datos de variante
    - Tag: `Feature: variantes-productos-ropa, Property 13`

  - [ ]* 7.5 Write unit tests for stock movements with variants
    - Test registrar movimiento con variant_id
    - Test consultar historial filtrado por variante
    - Test movimiento sin variant_id para producto simple (éxito)
    - Test movimiento sin variant_id para producto con variantes (error)
    - _Requirements: 3.3, 8.1, 8.2, 8.3_

- [x] 8. Crear componentes UI para gestión de variantes
  - [x] 8.1 Crear `components/dashboard/product-variant-selector.tsx`
    - Selector con opciones: Sin variantes, Camisas/Remeras, Pantalones, Personalizado
    - Mostrar descripción de cada tipo
    - Emitir evento onChange con tipo seleccionado
    - _Requirements: 1.1, 4.1_

  - [x] 8.2 Crear `components/dashboard/variant-stock-table.tsx`
    - Tabla editable para gestionar stock de variantes
    - Columnas: Talla, SKU (opcional), Stock, Stock Mínimo
    - Para tipo custom: permitir agregar/eliminar filas
    - Para tipos predefinidos: mostrar tallas fijas
    - Validar stock no negativo
    - Validar nombres únicos
    - _Requirements: 3.6, 4.3, 4.4, 9.4_

  - [x] 8.3 Crear `components/dashboard/product-variant-badge.tsx`
    - Badge visual para lista de productos
    - Mostrar ícono o texto "Variantes" si has_variants = true
    - Mostrar cantidad de variantes si está disponible
    - _Requirements: 6.1_

  - [x]* 8.4 Write unit tests for UI components
    - Test ProductVariantSelector muestra 4 opciones
    - Test VariantStockTable valida stock no negativo
    - Test VariantStockTable valida nombres únicos
    - Test ProductVariantBadge se muestra solo si has_variants = true
    - _Requirements: 1.1, 4.1, 6.1, 9.4_

- [ ] 8.5. Implementar gestión de plantillas de variantes
  - [ ] 8.5.1 Crear `lib/actions/variant-templates.ts`
    - Implementar `getVariantTemplates()` para obtener plantillas de la compañía
    - Implementar `createVariantTemplate()` para crear nueva plantilla
    - Implementar `updateVariantTemplate()` para actualizar plantilla existente
    - Implementar `deleteVariantTemplate()` con validación de uso
    - Implementar `isTemplateInUse()` para verificar si está siendo usada
    - _Requirements: 2.1.3, 2.1.8, 2.1.9_

  - [ ] 8.5.2 Crear `components/dashboard/save-variant-template-dialog.tsx`
    - Diálogo modal para guardar plantilla
    - Input para nombre de plantilla
    - Validar nombre único
    - Mostrar lista de tallas que se guardarán
    - Botones Cancelar y Guardar
    - _Requirements: 2.1.1, 2.1.2, 2.1.4_

  - [ ] 8.5.3 Actualizar `components/dashboard/variant-stock-table.tsx` para plantillas
    - Agregar botón "Guardar como Plantilla" cuando variant_type = 'custom'
    - Agregar selector de plantillas guardadas al inicio de la tabla
    - Implementar carga de tallas desde plantilla seleccionada
    - Permitir editar tallas cargadas sin modificar plantilla original
    - _Requirements: 2.1.1, 2.1.5, 2.1.6, 2.1.7_

  - [ ] 8.5.4 Crear `components/dashboard/variant-template-manager.tsx`
    - Componente para gestionar plantillas guardadas
    - Listar todas las plantillas con sus tallas
    - Botones para editar y eliminar cada plantilla
    - Mostrar advertencia si plantilla está en uso al intentar eliminar
    - Accesible desde configuración de productos o ajustes
    - _Requirements: 2.1.8, 2.1.9, 2.1.10_

  - [ ]* 8.5.5 Write unit tests for template management
    - Test crear plantilla con nombre único
    - Test crear plantilla con nombre duplicado (error)
    - Test eliminar plantilla sin uso (éxito)
    - Test eliminar plantilla en uso (error)
    - Test cargar plantilla en formulario de producto
    - Test guardar plantilla desde variantes personalizadas
    - _Requirements: 2.1.1, 2.1.4, 2.1.5, 2.1.9_

- [x] 9. Integrar variantes en formulario de productos
  - [x] 9.1 Actualizar `app/dashboard/products/new/page.tsx` y `app/dashboard/products/[id]/page.tsx`
    - Agregar ProductVariantSelector al formulario
    - Mostrar/ocultar campos según has_variants
    - Mostrar campo stock tradicional si has_variants = false
    - Mostrar VariantStockTable si has_variants = true
    - Manejar creación de variantes al guardar producto
    - Manejar conversión de producto simple a variantes
    - Mostrar confirmación al convertir
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.5_

  - [ ]* 9.2 Write property test for unique variant names
    - **Property 5: Unicidad de nombres de variantes por producto**
    - **Validates: Requirements 2.6, 9.5**
    - Generar productos con variantes con nombres duplicados
    - Intentar guardar
    - Verificar que se rechaza la operación
    - Tag: `Feature: variantes-productos-ropa, Property 5`

  - [ ]* 9.3 Write property test for non-negative stock
    - **Property 17: Stock de variantes no negativo**
    - **Validates: Requirements 9.4**
    - Generar operaciones que intenten establecer stock negativo
    - Verificar que se rechaza la operación
    - Tag: `Feature: variantes-productos-ropa, Property 17`

  - [ ]* 9.4 Write unit tests for product form with variants
    - Test formulario muestra selector de variantes
    - Test cambiar de "Sin variantes" a "Camisas" muestra tabla
    - Test cambiar de "Camisas" a "Sin variantes" oculta tabla
    - Test guardar producto con variantes crea variantes en BD
    - Test convertir producto simple a variantes muestra confirmación
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.5_

- [x] 10. Checkpoint - Validar UI de gestión de variantes
  - Ejecutar tests de componentes UI
  - Verificar que formulario de productos funciona con variantes
  - Probar crear producto con cada tipo de variante
  - Probar convertir producto simple a variantes
  - Asegurar que validaciones de UI funcionan
  - Preguntar al usuario si hay ajustes necesarios

- [x] 11. Integrar variantes en flujo de ventas
  - [x] 11.1 Crear `components/dashboard/variant-selector-in-sale.tsx`
    - Selector de variantes para agregar a venta
    - Mostrar solo variantes con stock > 0
    - Mostrar stock disponible de cada variante
    - Deshabilitar variantes sin stock
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 11.2 Actualizar `app/dashboard/sales/new/page.tsx`
    - Detectar si producto tiene variantes al agregarlo
    - Mostrar VariantSelectorInSale si has_variants = true
    - Requerir selección de variante antes de agregar
    - Validar stock disponible de variante seleccionada
    - Almacenar variant_id y variant_name en sale_item
    - _Requirements: 5.1, 5.4_

  - [x] 11.3 Modificar `lib/actions/sales.ts`
    - Actualizar `createSale()` para manejar variant_id en items
    - Descontar stock de variante específica al completar venta
    - Registrar movimiento de stock con variant_id
    - Validar stock suficiente por variante
    - _Requirements: 5.4, 5.5_

  - [ ]* 11.4 Write property test for variant selector shows only with stock
    - **Property 8: Selector muestra solo variantes con stock**
    - **Validates: Requirements 5.2**
    - Generar productos con variantes con stock aleatorio (algunos en 0)
    - Obtener lista de variantes disponibles
    - Verificar que solo incluye variantes con stock > 0
    - Tag: `Feature: variantes-productos-ropa, Property 8`

  - [ ]* 11.5 Write property test for stock validation in sales
    - **Property 9: Validación de stock suficiente en ventas**
    - **Validates: Requirements 5.4**
    - Generar intentos de venta con cantidad > stock disponible
    - Verificar que se rechaza la operación
    - Tag: `Feature: variantes-productos-ropa, Property 9`

  - [ ]* 11.6 Write property test for stock deduction
    - **Property 10: Descuento de stock por variante en ventas**
    - **Validates: Requirements 5.5**
    - Generar ventas con variantes aleatorias
    - Completar venta
    - Verificar que stock_after = stock_before - cantidad_vendida para cada variante
    - Tag: `Feature: variantes-productos-ropa, Property 10`

  - [ ]* 11.7 Write unit tests for sales with variants
    - Test agregar producto con variantes muestra selector
    - Test agregar producto sin variantes no muestra selector
    - Test selector muestra solo variantes con stock
    - Test venta descuenta stock de variante correcta
    - Test venta con stock insuficiente retorna error
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 12. Actualizar lista de productos para mostrar variantes
  - [x] 12.1 Modificar `app/dashboard/products/page.tsx`
    - Agregar ProductVariantBadge a cada producto con variantes
    - Mostrar stock total calculado para productos con variantes
    - Mostrar stock simple para productos sin variantes
    - Agregar columna o indicador visual de variantes
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 12.2 Actualizar página de detalle de producto
    - Mostrar tabla de variantes con stock de cada una
    - Mostrar stock total calculado
    - Permitir editar stock de variantes individuales
    - _Requirements: 6.4_

  - [ ]* 12.3 Write unit tests for product list with variants
    - Test lista muestra badge para productos con variantes
    - Test lista muestra stock total para productos con variantes
    - Test lista muestra stock simple para productos sin variantes
    - Test detalle muestra tabla de variantes
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 13. Implementar alertas de stock bajo por variante
  - [x] 13.1 Actualizar `lib/actions/products.ts`
    - Modificar `getLowStockProducts()` para incluir variantes
    - Retornar lista de variantes con stock <= min_stock_level
    - Incluir información del producto padre
    - _Requirements: 3.5_

  - [x] 13.2 Actualizar componente de notificaciones
    - Mostrar alertas específicas por variante
    - Formato: "Producto X - Talla Y: Stock bajo"
    - Enlazar a página de edición del producto
    - _Requirements: 3.5_

  - [ ]* 13.3 Write property test for low stock alerts
    - **Property 7: Alertas de stock bajo por variante**
    - **Validates: Requirements 3.5**
    - Generar variantes con stock <= min_stock_level
    - Obtener alertas
    - Verificar que cada variante con stock bajo genera alerta específica
    - Tag: `Feature: variantes-productos-ropa, Property 7`

  - [ ]* 13.4 Write unit tests for low stock alerts
    - Test alerta se genera cuando stock <= min_stock_level
    - Test alerta no se genera cuando stock > min_stock_level
    - Test alerta incluye nombre de producto y variante
    - _Requirements: 3.5_

- [ ] 14. Integrar variantes en órdenes de compra
  - [ ] 14.1 Actualizar `app/dashboard/purchase-orders/new/page.tsx`
    - Agregar selector de variantes al agregar producto con variantes
    - Almacenar variant_id en purchase_order_item
    - _Requirements: 3.3_

  - [ ] 14.2 Modificar `lib/actions/purchase-orders.ts`
    - Actualizar stock de variante específica al recibir orden
    - Registrar movimiento de stock con variant_id
    - _Requirements: 3.4_

  - [ ]* 14.3 Write unit tests for purchase orders with variants
    - Test agregar producto con variantes a orden requiere variante
    - Test recibir orden incrementa stock de variante correcta
    - Test movimiento de stock incluye variant_id
    - _Requirements: 3.3, 3.4_

- [ ] 15. Integrar variantes en presupuestos (quotes)
  - [x] 15.1 Actualizar `app/dashboard/quotes/new/quote-form.tsx`
    - Agregar selector de variantes al agregar producto con variantes
    - Almacenar variant_id y variant_name en quote_item
    - Mostrar variante en vista de presupuesto
    - _Requirements: 5.1_

  - [x] 15.2 Modificar `lib/actions/quotes.ts`
    - Actualizar `convertQuoteToSale()` para preservar variant_id
    - Validar stock de variante al convertir
    - _Requirements: 5.4_

  - [ ]* 15.3 Write unit tests for quotes with variants
    - Test agregar producto con variantes a presupuesto
    - Test convertir presupuesto a venta preserva variante
    - Test conversión valida stock de variante
    - _Requirements: 5.1, 5.4_

- [ ] 16. Actualizar componente de historial de stock
  - [ ] 16.1 Modificar `components/dashboard/stock-history-table.tsx`
    - Agregar columna "Variante" en tabla de historial
    - Mostrar nombre de variante si existe
    - Agregar filtro por variante
    - _Requirements: 8.3_

  - [ ]* 16.2 Write unit tests for stock history with variants
    - Test historial muestra columna de variante
    - Test filtro por variante funciona correctamente
    - Test movimientos sin variante muestran "-" en columna
    - _Requirements: 8.3_

- [ ] 17. Checkpoint final - Validar integración completa
  - Ejecutar todos los tests (unit y property)
  - Verificar flujo completo: crear producto con variantes → vender → ver historial
  - Probar conversión de producto simple a variantes
  - Verificar alertas de stock bajo por variante
  - Probar órdenes de compra con variantes
  - Probar presupuestos con variantes
  - Validar retrocompatibilidad con productos existentes
  - Asegurar que todas las propiedades se cumplen
  - Preguntar al usuario si hay ajustes finales necesarios

## Notes

- Tasks marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Property tests validan propiedades universales de corrección
- Unit tests validan ejemplos específicos y casos edge
- La implementación mantiene retrocompatibilidad en cada paso
