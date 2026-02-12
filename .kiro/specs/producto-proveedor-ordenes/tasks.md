# Implementation Plan: Relación Producto-Proveedor en Órdenes de Compra

## Overview

Este plan implementa la funcionalidad de relación producto-proveedor en el sistema ERP, permitiendo asociar productos con proveedores y filtrar productos automáticamente al crear órdenes de compra según el proveedor seleccionado.

La implementación se divide en 4 áreas principales:
1. Actualización de tipos TypeScript
2. Modificación del formulario de productos
3. Actualización del listado de productos
4. Implementación de filtrado en órdenes de compra

## Tasks

- [x] 1. Actualizar tipos TypeScript y acciones de productos
  - [x] 1.1 Actualizar interfaces en `lib/types/erp.ts`
    - Agregar campo `supplier_id` a `ProductFormData`
    - Agregar relación `supplier?: Supplier` a `Product` (ya existe pero documentar su uso)
    - _Requirements: 1.2, 1.3_
  
  - [x] 1.2 Actualizar acciones en `lib/actions/products.ts`
    - Modificar `createProduct` para incluir `supplier_id` en el INSERT
    - Modificar `updateProduct` para permitir actualizar `supplier_id`
    - Modificar `getProducts` para incluir JOIN con tabla `suppliers`
    - Modificar `getProductById` para incluir información del proveedor
    - _Requirements: 1.2, 1.4, 2.1, 6.2_

- [x] 2. Implementar selector de proveedor en formulario de productos
  - [x] 2.1 Modificar formulario de nuevo producto (`app/dashboard/products/new/page.tsx`)
    - Agregar estado para lista de proveedores
    - Agregar función `loadSuppliers` para cargar proveedores activos
    - Agregar campo `supplier_id` al estado `formData`
    - Agregar componente `Select` para seleccionar proveedor con opción "Sin proveedor"
    - Colocar selector en la sección "Información Básica" después del campo de categoría
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 2.2 Write unit test for supplier selector visibility
    - Test que verifica que el selector de proveedor está presente en el formulario
    - _Requirements: 1.1_
  
  - [ ]* 2.3 Write property test for product-supplier persistence
    - **Property 1: Persistencia de relación producto-proveedor**
    - **Validates: Requirements 1.2, 1.4**
    - Generar productos aleatorios con proveedores
    - Guardar y recuperar, verificar que supplier_id se mantiene
  
  - [x] 2.4 Modificar formulario de edición de producto (`app/dashboard/products/[id]/page.tsx`)
    - Aplicar los mismos cambios que en el formulario de nuevo producto
    - Cargar el proveedor actual del producto en el estado inicial
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 2.5 Write unit tests for product without supplier
    - Test que verifica que se puede crear producto con supplier_id = null
    - Test que verifica que se puede cambiar proveedor a "Sin proveedor"
    - _Requirements: 1.3, 6.3_

- [x] 3. Actualizar listado de productos para mostrar proveedor
  - [x] 3.1 Modificar página de listado (`app/dashboard/products/page.tsx`)
    - Agregar columna "Proveedor" en la tabla después de la columna "Categoría"
    - Renderizar nombre del proveedor o "Sin proveedor" en cursiva y color muted
    - Asegurar que la consulta incluye la información del proveedor (ya se hace en getProducts)
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 3.2 Write property test for supplier display in listing
    - **Property 2: Visualización de proveedor en listado**
    - **Validates: Requirements 2.1**
    - Generar productos con proveedores, renderizar listado
    - Verificar que nombres de proveedores aparecen correctamente
  
  - [ ]* 3.3 Write unit test for "Sin proveedor" indicator
    - Test que verifica que productos sin proveedor muestran "Sin proveedor"
    - _Requirements: 2.2_

- [ ] 4. Checkpoint - Verificar funcionalidad básica de productos
  - Asegurar que se pueden crear y editar productos con y sin proveedor
  - Verificar que el listado muestra correctamente la información del proveedor
  - Ejecutar tests y corregir cualquier error
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [x] 5. Implementar filtrado de productos en órdenes de compra
  - [x] 5.1 Agregar función de filtrado en `lib/actions/products.ts`
    - Crear función `getProductsBySupplier(supplierId: string | null)` que retorna productos filtrados
    - Si supplierId es null, retornar todos los productos
    - Si supplierId tiene valor, retornar solo productos con ese supplier_id
    - _Requirements: 3.1, 3.3, 5.4_
  
  - [x] 5.2 Modificar formulario de nueva orden de compra (`app/dashboard/purchase-orders/new/page.tsx`)
    - Agregar estado `availableProducts` para productos filtrados
    - Agregar efecto que filtra productos cuando cambia `supplier_id`
    - Actualizar selector de productos para usar `availableProducts`
    - Mostrar mensaje cuando no hay productos disponibles para el proveedor
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ]* 5.3 Write property test for product filtering by supplier
    - **Property 3: Filtrado de productos por proveedor**
    - **Validates: Requirements 3.1, 5.4**
    - Generar lista de productos con diferentes proveedores
    - Filtrar por proveedor específico
    - Verificar que todos los resultados tienen el supplier_id correcto
  
  - [ ]* 5.4 Write property test for dynamic filter update
    - **Property 4: Actualización dinámica del filtro**
    - **Validates: Requirements 3.2**
    - Simular cambio de proveedor en orden de compra
    - Verificar que lista de productos se actualiza correctamente
  
  - [ ]* 5.5 Write unit tests for edge cases
    - Test: sin proveedor seleccionado muestra todos los productos
    - Test: proveedor sin productos muestra mensaje apropiado
    - Test: productos sin proveedor incluidos cuando no hay filtro
    - _Requirements: 3.3, 3.4, 5.2, 5.3_

- [ ] 6. Implementar validación de consistencia producto-proveedor
  - [ ] 6.1 Agregar función de validación en `lib/actions/purchase-orders.ts`
    - Crear función `validateProductSupplierConsistency` que verifica que producto pertenece al proveedor
    - Retornar objeto con `{ valid: boolean, error?: string }`
    - _Requirements: 4.1, 4.2_
  
  - [ ] 6.2 Integrar validación en formulario de orden de compra
    - Llamar validación antes de agregar producto a la orden
    - Mostrar toast de error si validación falla
    - Prevenir adición de productos incompatibles
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 6.3 Write property test for consistency validation
    - **Property 5: Validación de consistencia al agregar productos**
    - **Validates: Requirements 4.1**
    - Generar orden con proveedor A, producto con proveedor B
    - Intentar agregar producto
    - Verificar que operación es rechazada
  
  - [ ]* 6.4 Write unit test for validation error message
    - Test que verifica que se muestra mensaje de error descriptivo
    - _Requirements: 4.2_

- [ ] 7. Implementar validación al cambiar proveedor de orden existente
  - [ ] 7.1 Agregar lógica de validación al cambiar proveedor
    - En formulario de edición de orden, validar productos al cambiar proveedor
    - Mostrar dialog de confirmación si hay productos incompatibles
    - Listar productos que serían afectados
    - _Requirements: 4.3, 4.4_
  
  - [ ]* 7.2 Write property test for supplier change validation
    - **Property 6: Validación al cambiar proveedor de orden**
    - **Validates: Requirements 4.3**
    - Generar orden con productos, cambiar proveedor
    - Verificar que todos los productos son validados
  
  - [ ]* 7.3 Write unit test for confirmation dialog
    - Test que verifica que se muestra dialog cuando hay productos incompatibles
    - _Requirements: 4.4_

- [ ] 8. Verificar integridad de datos históricos
  - [ ] 8.1 Confirmar que cambios de proveedor no afectan órdenes existentes
    - Revisar que las órdenes de compra almacenan `product_id` pero no `supplier_id`
    - Verificar que cambiar proveedor de un producto no modifica órdenes históricas
    - _Requirements: 6.4_
  
  - [ ]* 8.2 Write property test for historical data integrity
    - **Property 8: Integridad de datos históricos**
    - **Validates: Requirements 6.4**
    - Crear orden con producto, cambiar proveedor del producto
    - Recuperar orden original
    - Verificar que orden no fue modificada

- [ ] 9. Checkpoint final - Testing completo y refinamiento
  - Ejecutar todos los tests (unit y property tests)
  - Verificar flujos completos end-to-end manualmente
  - Revisar mensajes de error y UX
  - Verificar performance del filtrado
  - Preguntar al usuario si hay ajustes finales necesarios

- [ ] 10. Documentación y limpieza
  - [ ] 10.1 Agregar comentarios en código complejo
    - Documentar función de filtrado
    - Documentar función de validación
    - Agregar JSDoc a funciones públicas
  
  - [ ] 10.2 Verificar consistencia de estilos
    - Asegurar que componentes nuevos siguen el estilo existente
    - Verificar que mensajes están en español
    - Confirmar que colores y espaciado son consistentes

## Notes

- Tasks marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada task referencia los requirements específicos que implementa
- Los checkpoints permiten validación incremental con el usuario
- Property tests validan corrección universal con mínimo 100 iteraciones
- Unit tests validan casos específicos y edge cases
- La implementación mantiene compatibilidad con productos existentes sin proveedor
