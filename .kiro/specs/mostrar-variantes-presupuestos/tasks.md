# Tasks: Mostrar Variantes en Vista de Presupuestos

## 1. Actualizar Tipos de TypeScript
- [x] 1.1 Verificar que `QuoteItemFormData` incluya `variant_id` y `variant_name` en `lib/types/erp.ts`
- [x] 1.2 Agregar campos si no existen

## 2. Actualizar Acciones de Presupuestos
- [x] 2.1 Modificar `createQuote` en `lib/actions/quotes.ts` para incluir `variant_id` y `variant_name` al crear items
- [x] 2.2 Modificar `updateQuote` en `lib/actions/quotes.ts` para incluir `variant_id` y `variant_name` al actualizar items
- [x] 2.3 Verificar que `getQuote` ya cargue correctamente los campos de variante

## 3. Actualizar Vista de Presupuesto - Modo Visualización
- [x] 3.1 Importar `ProductVariantBadge` en `app/dashboard/quotes/[id]/page.tsx`
- [x] 3.2 Agregar visualización de variante en la sección de items (modo lectura)
- [x] 3.3 Mostrar badge solo cuando `item.variant_name` existe
- [x] 3.4 Verificar que funcione en responsive (mobile y desktop)

## 4. Actualizar Vista de Presupuesto - Modo Edición
- [x] 4.1 Importar `VariantSelectorInSale` y `getProductVariants` en `app/dashboard/quotes/[id]/page.tsx`
- [x] 4.2 Agregar estado `productVariants` para cachear variantes cargadas
- [x] 4.3 Crear función `loadProductVariants` para cargar variantes de un producto
- [x] 4.4 Crear función `updateItemVariant` para actualizar variante de un item
- [x] 4.5 Crear función auxiliar `productHasVariants` para verificar si producto tiene variantes
- [x] 4.6 Modificar función `selectProduct` para cargar variantes cuando se selecciona un producto
- [x] 4.7 Agregar selector de variantes en el formulario de edición de items
- [x] 4.8 Asegurar que el selector solo aparezca para productos con variantes

## 5. Actualizar Vista de Creación de Presupuesto
- [x] 5.1 Revisar `app/dashboard/quotes/new/quote-form.tsx` para verificar si necesita los mismos cambios
- [x] 5.2 Implementar selección de variantes en el formulario de creación si no existe
- [x] 5.3 Asegurar consistencia entre creación y edición

## 6. Validaciones
- [x] 6.1 Agregar validación para requerir variante si el producto tiene variantes
- [x] 6.2 Mostrar mensaje de error apropiado si falta seleccionar variante
- [x] 6.3 Validar que los datos se guarden correctamente antes de enviar

## 7. Testing Manual
- [ ] 7.1 Crear un presupuesto nuevo con productos que tienen variantes
- [ ] 7.2 Verificar que las variantes se guarden correctamente
- [ ] 7.3 Visualizar el presupuesto y verificar que las variantes se muestren
- [ ] 7.4 Editar el presupuesto y cambiar una variante
- [ ] 7.5 Verificar que el cambio se persista correctamente
- [ ] 7.6 Probar con productos sin variantes (debe funcionar como antes)
- [ ] 7.7 Probar con presupuestos antiguos sin variantes (compatibilidad)
- [ ] 7.8 Convertir presupuesto con variantes a venta y verificar que funcione

## 8. Documentación
- [ ] 8.1 Actualizar `PRESUPUESTOS_SETUP.md` con información sobre variantes
- [ ] 8.2 Agregar ejemplos de uso con variantes
- [ ] 8.3 Documentar comportamiento al convertir a venta

## 9. Tests Automatizados (Opcional)
- [ ]* 9.1 Escribir test unitario para `updateItemVariant`
- [ ]* 9.2 Escribir test unitario para `productHasVariants`
- [ ]* 9.3 Escribir test de integración para crear presupuesto con variantes
- [ ]* 9.4 Escribir test de integración para editar presupuesto con variantes

## Notas de Implementación

### Orden Recomendado
1. Empezar con tipos y acciones (tareas 1-2)
2. Implementar visualización en modo lectura (tarea 3)
3. Implementar edición (tarea 4)
4. Verificar formulario de creación (tarea 5)
5. Agregar validaciones (tarea 6)
6. Testing manual exhaustivo (tarea 7)
7. Documentación (tarea 8)

### Componentes Reutilizables
- `ProductVariantBadge`: Ya existe, solo importar
- `VariantSelectorInSale`: Ya existe, reutilizar la misma lógica

### Consideraciones
- Mantener compatibilidad con presupuestos existentes
- No romper funcionalidad de productos sin variantes
- Asegurar que el flujo de conversión a venta funcione correctamente
