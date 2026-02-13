# Tasks: Soporte Completo de Variantes en Todas las Áreas

## 1. Backend - Filtro de Stock Bajo
- [x] 1.1 Crear función SQL `get_products_with_low_stock` en Supabase
- [x] 1.2 Actualizar `getProducts()` en `lib/actions/products.ts` para usar la función SQL
- [ ] 1.3 Probar filtro con productos simples con stock bajo
- [ ] 1.4 Probar filtro con productos con variantes (algunas con stock bajo)
- [ ] 1.5 Verificar que productos sin track_inventory no aparezcan

## 2. Backend - Productos Más Vendidos
- [x] 2.1 Actualizar `getTopProducts()` en `lib/actions/analytics.ts`
- [x] 2.2 Modificar agregación para considerar variant_id
- [x] 2.3 Implementar formato "Producto - Variante" para display
- [ ] 2.4 Probar con ventas de productos simples
- [ ] 2.5 Probar con ventas de variantes
- [ ] 2.6 Verificar que la agregación sea correcta

## 3. Exportaciones - Productos
- [x] 3.1 Crear función helper `expandProductsWithVariants()` en `lib/utils/export.ts`
- [x] 3.2 Actualizar `exportProductsToExcel()` para usar helper
- [x] 3.3 Actualizar `exportProductsToCSV()` para usar helper
- [ ] 3.4 Probar exportación con productos simples
- [ ] 3.5 Probar exportación con productos con variantes
- [ ] 3.6 Verificar que solo variantes activas se exporten
- [ ] 3.7 Verificar formato y columnas correctas

## 4. Exportaciones - Reporte PDF de Inventario
- [x] 4.1 Actualizar `exportProductsReportToPDF()` en `lib/utils/export.ts`
- [x] 4.2 Modificar generación de tabla para expandir variantes
- [x] 4.3 Ajustar estilos de tabla para variantes (indentación o formato)
- [ ] 4.4 Probar PDF con productos simples
- [ ] 4.5 Probar PDF con productos con variantes
- [ ] 4.6 Verificar que el PDF sea legible y profesional

## 5. Exportaciones - Ventas con Detalle de Items
- [x] 5.1 Actualizar `exportSalesToExcel()` en `lib/utils/export.ts`
- [x] 5.2 Modificar para incluir una fila por item de venta
- [x] 5.3 Incluir información de variante en cada fila
- [x] 5.4 Actualizar `exportSalesToCSV()` con misma lógica
- [ ] 5.5 Probar exportación con ventas de productos simples
- [ ] 5.6 Probar exportación con ventas de variantes
- [ ] 5.7 Verificar que el formato sea claro y útil

## 6. Email de Presupuesto
- [x] 6.1 Actualizar interface `QuoteEmailProps` en `lib/email/templates/quote-email.tsx`
- [x] 6.2 Modificar template para mostrar variant_name cuando exista
- [x] 6.3 Ajustar estilos para que variante sea legible
- [x] 6.4 Actualizar `sendQuoteByEmail()` en `lib/actions/quotes.ts`
- [x] 6.5 Incluir variant_name en el mapeo de items
- [ ] 6.6 Probar envío de email con items sin variantes
- [ ] 6.7 Probar envío de email con items con variantes
- [ ] 6.8 Verificar que el email se vea profesional en diferentes clientes

## 7. Tipos TypeScript
- [x] 7.1 Verificar que `ProductVariant` tenga todos los campos necesarios en `lib/types/erp.ts`
- [x] 7.2 Verificar que `Product` incluya `has_variants` y `variants?`
- [x] 7.3 Verificar que `SaleItem` incluya `variant_id` y `variant_name`
- [x] 7.4 Verificar que `QuoteItem` incluya `variant_id` y `variant_name`

## 8. Testing Manual
- [ ] 8.1 Probar flujo completo: crear producto con variantes
- [ ] 8.2 Crear venta con variante y verificar en "Productos Más Vendidos"
- [ ] 8.3 Activar filtro de stock bajo y verificar que funcione
- [ ] 8.4 Exportar productos a Excel y verificar variantes
- [ ] 8.5 Exportar productos a CSV y verificar variantes
- [ ] 8.6 Generar reporte PDF y verificar variantes
- [ ] 8.7 Exportar ventas y verificar que muestre variantes
- [ ] 8.8 Crear presupuesto con variante y enviar por email
- [ ] 8.9 Verificar email recibido muestra variante correctamente

## 9. Optimización y Limpieza
- [ ] 9.1 Verificar que no haya queries N+1
- [ ] 9.2 Agregar índices si es necesario
- [ ] 9.3 Agregar comentarios en código complejo
- [ ] 9.4 Limpiar código duplicado si existe
- [ ] 9.5 Verificar manejo de errores en todas las funciones

## 10. Documentación
- [ ] 10.1 Actualizar comentarios en funciones modificadas
- [ ] 10.2 Documentar formato estándar de variantes
- [ ] 10.3 Crear o actualizar README si es necesario
- [ ] 10.4 Documentar función SQL creada

## Notas de Implementación

### Orden Recomendado
1. Empezar con Backend (tareas 1 y 2) - son la base
2. Continuar con Exportaciones (tareas 3, 4, 5) - usan datos del backend
3. Finalizar con Email (tarea 6) - depende de datos correctos
4. Testing y optimización (tareas 8, 9, 10)

### Dependencias
- Tarea 3 depende de que los productos incluyan variantes en la query
- Tarea 6 depende de que los presupuestos incluyan variant_name en items
- Todas las tareas de testing (8.x) dependen de las implementaciones previas

### Consideraciones Especiales
- Al modificar exportaciones, considerar límites de filas (10,000 máximo)
- Al modificar PDFs, verificar que no se generen archivos muy grandes
- Al modificar emails, probar en diferentes clientes (Gmail, Outlook, etc.)
- Mantener compatibilidad con productos sin variantes en todo momento
