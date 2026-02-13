# Plan de Implementación: Fix Variant Price History on Edit

## Resumen

Este plan implementa el fix para el bug donde los cambios de precio en variantes no se registran en el historial cuando se editan desde la página de edición de productos. La solución refactoriza `updateProduct` para usar `updateProductVariant`, que registrará correctamente los cambios de precio.

## Tareas

- [x] 1. Verificar y actualizar schema de price_changes
  - Verificar si la tabla `price_changes` tiene el campo `variant_id`
  - Si no existe, crear migración SQL para agregarlo
  - Agregar índice en `variant_id` para performance
  - Actualizar constraint para permitir registros con variant_id
  - _Requisitos: 1.2, 4.1_

- [x] 2. Actualizar interfaces TypeScript
  - [x] 2.1 Agregar campo `price` a ProductVariantFormData
    - Agregar `price?: number` a la interfaz
    - _Requisitos: 1.2_
  
  - [x] 2.2 Agregar campo `price` a ProductVariant
    - Agregar `price: number | null` a la interfaz
    - _Requisitos: 1.2_
  
  - [x] 2.3 Agregar campo `variant_id` a PriceChange
    - Agregar `variant_id: string | null` a la interfaz
    - Agregar `variant?: ProductVariant` para joins
    - _Requisitos: 1.2, 4.1_

- [x] 3. Modificar updateProductVariant para registrar cambios de precio
  - [x] 3.1 Agregar lógica de detección de cambio de precio
    - Comparar `data.price` con `existingVariant.price`
    - Solo proceder si el precio cambió
    - _Requisitos: 1.2, 4.3_
  
  - [ ]* 3.2 Escribir test de propiedad para registro de cambio de precio
    - **Propiedad 2: Registro de cambios de precio en variantes**
    - **Valida: Requisitos 1.2, 4.1**
  
  - [x] 3.3 Implementar INSERT a price_changes
    - Obtener información del usuario (nombre, rol)
    - Crear registro con variant_id, old_value, new_value
    - Manejar caso donde precio anterior es NULL (usar 0)
    - _Requisitos: 1.2, 4.1, 4.3_
  
  - [ ]* 3.4 Escribir test unitario para cambio de precio
    - Test: actualizar precio de variante crea registro
    - Test: actualizar sin cambio de precio no crea registro
    - Test: precio NULL a valor crea registro con old_value=0
    - _Requisitos: 1.2, 4.3_

- [x] 4. Checkpoint - Verificar que updateProductVariant registra precios
  - Ejecutar tests de la tarea 3
  - Verificar manualmente que los cambios de precio se registran
  - Preguntar al usuario si hay dudas

- [x] 5. Refactorizar updateProduct para usar updateProductVariant
  - [x] 5.1 Modificar loop de variantes existentes
    - Reemplazar UPDATE directo con llamada a updateProductVariant
    - Construir objeto variantUpdateData con todos los campos
    - Incluir campo `price` en variantUpdateData
    - _Requisitos: 1.1, 1.3_
  
  - [ ]* 5.2 Escribir test de propiedad para uso de updateProductVariant
    - **Propiedad 1: Uso de updateProductVariant para variantes existentes**
    - **Valida: Requisitos 1.1**
  
  - [x] 5.3 Implementar manejo de errores
    - Capturar error de updateProductVariant
    - Retornar error descriptivo con nombre de variante
    - Usar estrategia fail-fast
    - _Requisitos: 1.4_
  
  - [ ]* 5.4 Escribir test de propiedad para múltiples variantes
    - **Propiedad 3: Procesamiento de múltiples variantes**
    - **Valida: Requisitos 1.3, 4.4**
  
  - [ ]* 5.5 Escribir test unitario para manejo de errores
    - Test: error en una variante detiene el proceso
    - Test: mensaje de error incluye nombre de variante
    - _Requisitos: 1.4_

- [x] 6. Agregar registro de precio inicial para variantes nuevas
  - [x] 6.1 Modificar INSERT de variantes nuevas
    - Agregar campo `price` al INSERT
    - Capturar el ID de la variante recién creada
    - _Requisitos: 2.1, 2.3_
  
  - [x] 6.2 Implementar registro de precio inicial
    - Verificar que precio > 0
    - Crear registro en price_changes con old_value=0
    - Incluir reason: "Precio inicial de variante"
    - _Requisitos: 2.3_
  
  - [ ]* 6.3 Escribir test de propiedad para variantes nuevas
    - **Propiedad 5: Creación de variantes nuevas**
    - **Valida: Requisitos 2.1, 2.2**
  
  - [ ]* 6.4 Escribir test de propiedad para precio inicial
    - **Propiedad 6: Registro de precios iniciales**
    - **Valida: Requisitos 2.3**
  
  - [ ]* 6.5 Escribir test unitario para precio inicial
    - Test: variante nueva con precio crea registro inicial
    - Test: variante nueva sin precio no crea registro
    - _Requisitos: 2.3_

- [x] 7. Checkpoint - Verificar integración completa
  - Ejecutar todos los tests
  - Verificar que no hay regresiones
  - Preguntar al usuario si hay dudas

- [x] 8. Implementar tests de integración
  - [ ]* 8.1 Escribir test de propiedad para manejo mixto
    - **Propiedad 7: Manejo mixto de variantes**
    - **Valida: Requisitos 2.4**
  
  - [ ]* 8.2 Escribir test de propiedad para precisión de valores
    - **Propiedad 8: Precisión de valores registrados**
    - **Valida: Requisitos 4.3**
  
  - [ ]* 8.3 Escribir test de integración end-to-end
    - Test: crear producto → editar variante → verificar historial
    - Test: múltiples variantes con diferentes cambios
    - Test: mezcla de variantes nuevas y existentes
    - _Requisitos: 4.2_
  
  - [ ]* 8.4 Escribir test de propiedad para integración con historial
    - **Propiedad 9: Integración con historial de precios**
    - **Valida: Requisitos 4.2**

- [x] 9. Actualizar componentes UI si es necesario
  - Verificar que el formulario de edición incluye campo `price` para variantes
  - Actualizar si es necesario para capturar precio de variantes
  - Verificar que el historial de precios muestra cambios de variantes
  - _Requisitos: 4.2_

- [x] 10. Testing manual y validación
  - Probar edición de producto con variantes en UI
  - Verificar que los cambios de precio se registran
  - Verificar que el historial muestra los cambios correctamente
  - Probar casos edge: precio NULL, precio 0, múltiples variantes
  - _Requisitos: 4.1, 4.2_

- [x] 11. Checkpoint final - Verificar que el bug está resuelto
  - Confirmar que editar precio de variante crea registro en price_changes
  - Confirmar que el historial muestra todos los cambios
  - Confirmar que no hay regresiones en funcionalidad existente
  - Preguntar al usuario si todo está correcto

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que implementa
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan corrección universal
- Los tests unitarios validan ejemplos específicos y casos edge
- La estrategia es fail-fast para mantener consistencia
