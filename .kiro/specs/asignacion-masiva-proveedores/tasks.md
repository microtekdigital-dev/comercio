# Tasks - Asignación Masiva de Proveedores

## 1. Server Actions y Lógica de Backend

### 1.1 Crear función de asignación masiva de proveedores
- [x] 1.1.1 Implementar `assignSuppliersToProducts` en `lib/actions/products.ts`
  - Recibir array de product IDs y supplier ID
  - Validar que todos los productos existen y pertenecen a la compañía
  - Validar que el proveedor existe y pertenece a la compañía
  - Usar transacción para asignar proveedor a todos los productos
  - Retornar resultado con conteo de éxitos y errores

### 1.2 Crear función de obtención de proveedores
- [x] 1.2.1 Implementar `getSuppliersList` en `lib/actions/suppliers.ts`
  - Obtener lista de proveedores activos de la compañía
  - Ordenar alfabéticamente por nombre
  - Retornar formato optimizado para selector

## 2. Componente de Diálogo de Asignación Masiva

### 2.1 Crear componente BulkAssignSuppliersDialog
- [x] 2.1.1 Crear archivo `components/dashboard/bulk-assign-suppliers-dialog.tsx`
  - Usar Dialog de shadcn/ui
  - Recibir props: open, onOpenChange, selectedProductIds, onSuccess
  - Mostrar contador de productos seleccionados
  - Incluir selector de proveedor con búsqueda
  - Botones de cancelar y asignar

### 2.2 Implementar lógica del diálogo
- [x] 2.2.1 Agregar estado para proveedor seleccionado
- [x] 2.2.2 Implementar carga de lista de proveedores
- [x] 2.2.3 Implementar función de asignación
  - Llamar a server action
  - Mostrar loading state
  - Manejar errores
  - Mostrar toast de éxito/error
  - Cerrar diálogo y limpiar estado

## 3. Integración en Página de Productos

### 3.1 Agregar selección múltiple a la tabla
- [x] 3.1.1 Modificar `app/dashboard/products/page.tsx`
  - Agregar estado para productos seleccionados
  - Agregar checkbox en header de tabla
  - Agregar checkbox en cada fila
  - Implementar lógica de seleccionar todos/ninguno

### 3.2 Agregar barra de acciones masivas
- [x] 3.2.1 Crear componente de barra flotante
  - Mostrar solo cuando hay productos seleccionados
  - Mostrar contador de seleccionados
  - Botón "Asignar Proveedor"
  - Botón "Cancelar selección"
  - Posicionar fixed en bottom de la pantalla

### 3.3 Integrar diálogo de asignación
- [x] 3.3.1 Importar y usar BulkAssignSuppliersDialog
- [x] 3.3.2 Conectar con estado de selección
- [x] 3.3.3 Implementar callback onSuccess
  - Recargar lista de productos
  - Limpiar selección
  - Mostrar mensaje de éxito

## 4. Validaciones y Manejo de Errores

### 4.1 Validaciones del lado del servidor
- [x] 4.1.1 Validar que productIds no esté vacío
- [x] 4.1.2 Validar que supplierId sea válido
- [x] 4.1.3 Validar permisos del usuario
- [x] 4.1.4 Validar que productos pertenezcan a la compañía
- [x] 4.1.5 Validar que proveedor pertenezca a la compañía

### 4.2 Manejo de errores
- [x] 4.2.1 Capturar errores de base de datos
- [x] 4.2.2 Retornar mensajes de error descriptivos
- [ ] 4.2.3 Implementar rollback en caso de error parcial

## 5. UI/UX y Feedback

### 5.1 Estados de carga
- [x] 5.1.1 Agregar spinner en botón de asignación
- [x] 5.1.2 Deshabilitar botones durante operación
- [x] 5.1.3 Mostrar skeleton en selector de proveedores

### 5.2 Mensajes de feedback
- [x] 5.2.1 Toast de éxito con contador de productos actualizados
- [x] 5.2.2 Toast de error con mensaje descriptivo
- [x] 5.2.3 Confirmación visual en tabla después de asignación

## 6. Testing y Validación

### 6.1 Pruebas funcionales
- [ ] 6.1.1 Probar selección de múltiples productos
- [ ] 6.1.2 Probar asignación exitosa
- [ ] 6.1.3 Probar con lista vacía de proveedores
- [ ] 6.1.4 Probar cancelación de operación
- [ ] 6.1.5 Probar con productos ya asignados

### 6.2 Pruebas de edge cases
- [ ] 6.2.1 Probar con 1 producto seleccionado
- [ ] 6.2.2 Probar con muchos productos (50+)
- [ ] 6.2.3 Probar sin productos seleccionados
- [ ] 6.2.4 Probar con proveedor inválido

## 7. Optimizaciones

### 7.1 Performance
- [ ] 7.1.1 Implementar debounce en búsqueda de proveedores
- [ ] 7.1.2 Optimizar query de asignación masiva
- [ ] 7.1.3 Agregar índices si es necesario

### 7.2 UX
- [ ] 7.2.1 Agregar animaciones suaves
- [ ] 7.2.2 Mejorar responsive design
- [ ] 7.2.3 Agregar keyboard shortcuts (Esc para cerrar)

## Notas de Implementación

- Usar transacciones de Supabase para garantizar atomicidad
- Mantener consistencia con el diseño existente de la aplicación
- Reutilizar componentes UI existentes (Dialog, Button, Select, etc.)
- Seguir patrones de manejo de errores establecidos
- Asegurar que la funcionalidad sea accesible (ARIA labels, keyboard navigation)
