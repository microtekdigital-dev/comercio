# Implementation Plan: Acceso a Funcionalidades por Planes

## Overview

Este plan implementa los cambios en el sistema de restricciones de planes para habilitar Proveedores y Órdenes de Compra en Trial, y mostrar funcionalidades bloqueadas con indicadores visuales. La implementación se enfoca en modificar las funciones de permisos, actualizar los componentes del sidebar, y agregar route guards donde sea necesario.

## Tasks

- [x] 1. Actualizar funciones de permisos en plan-limits.ts
  - [x] 1.1 Modificar canAccessSuppliers para incluir Trial
    - Actualizar la lógica para permitir acceso a Trial, Básico, Profesional y Empresarial
    - Agregar campo requiredPlan al objeto de retorno
    - Actualizar mensaje de error para indicar "Básico" como plan requerido
    - _Requirements: 1.1, 1.3_
  
  - [x] 1.2 Modificar canAccessPurchaseOrders para incluir Trial
    - Actualizar la lógica para permitir acceso a Trial, Básico, Profesional y Empresarial
    - Agregar campo requiredPlan al objeto de retorno
    - Actualizar mensaje de error para indicar "Básico" como plan requerido
    - _Requirements: 2.1, 2.3_
  
  - [x] 1.3 Actualizar todas las funciones de permisos existentes para incluir requiredPlan
    - Modificar canAccessStockHistory, canAccessPriceHistory, canAccessCashRegister
    - Modificar canAccessInventoryLiquidation, canAccessAccountsSettlement
    - Modificar canAccessAdvancedReports y otras funciones relacionadas
    - Agregar campo requiredPlan con el nombre del plan requerido ("Básico", "Profesional", "Empresarial")
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.3, 7.3_

- [x] 2. Crear interfaz de tipos para permisos de funcionalidades
  - [x] 2.1 Crear o actualizar lib/types/plans.ts
    - Definir interfaz FeaturePermission con campos allowed, requiredPlan, message
    - Definir interfaz NavigationFeature con href, label, icon, permission
    - Exportar interfaces para uso en componentes
    - _Requirements: 5.3_

- [x] 3. Actualizar sidebar-server.tsx para evaluar todos los permisos
  - [x] 3.1 Modificar DashboardSidebarServer para obtener permisos completos
    - Llamar a todas las funciones de permisos (no solo las que el usuario puede ver)
    - Crear objeto permissions con todos los resultados de FeaturePermission
    - Pasar objeto permissions completo al componente cliente
    - _Requirements: 3.1, 6.1_

- [x] 4. Actualizar sidebar.tsx para mostrar funcionalidades bloqueadas
  - [x] 4.1 Modificar interfaz SidebarProps
    - Cambiar de props booleanos individuales a objeto permissions
    - Actualizar tipo de permissions para usar FeaturePermission
    - _Requirements: 3.1_
  
  - [x] 4.2 Crear función renderNavItem para manejar items bloqueados y accesibles
    - Verificar si feature está bloqueada usando permission.allowed
    - Para items bloqueados: renderizar como button con lock icon y requiredPlan
    - Para items accesibles: renderizar como Link normal
    - Aplicar estilos consistentes para items bloqueados (opacity, cursor-not-allowed)
    - _Requirements: 3.2, 3.3, 3.5, 6.5_
  
  - [x] 4.3 Implementar handleLockedFeatureClick
    - Mostrar toast con permission.message
    - Incluir botón "Ver Planes" que navega a /dashboard/billing
    - Prevenir navegación (no cambiar URL)
    - _Requirements: 3.4, 7.1, 7.2, 7.4_
  
  - [x] 4.4 Actualizar navSections para usar renderNavItem
    - Modificar construcción de navSections para incluir todos los items
    - Pasar permission correspondiente a cada item
    - Mantener estructura de secciones (VENTAS, COMPRAS, INVENTARIO, etc.)
    - _Requirements: 3.1, 6.2, 6.3_

- [ ] 5. Checkpoint - Verificar cambios en UI
  - Verificar que el menú muestra todas las funcionalidades
  - Verificar que items bloqueados muestran candado y nombre de plan
  - Verificar que items accesibles no muestran candado
  - Verificar que click en item bloqueado muestra mensaje y no navega
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas

- [-] 6. Agregar route guards a páginas de funcionalidades bloqueadas
  - [x] 6.1 Agregar guard a app/dashboard/stock-history/page.tsx
    - Verificar permisos con canAccessStockHistory
    - Redirigir a /dashboard?error=insufficient_permissions si no tiene acceso
    - _Requirements: 8.1_
  
  - [x] 6.2 Agregar guard a app/dashboard/price-history/page.tsx
    - Verificar permisos con canAccessPriceHistory
    - Redirigir a /dashboard?error=insufficient_permissions si no tiene acceso
    - _Requirements: 8.1_
  
  - [x] 6.3 Agregar guard a app/dashboard/cash-register/page.tsx
    - Verificar permisos con canAccessCashRegister
    - Redirigir a /dashboard?error=insufficient_permissions si no tiene acceso
    - _Requirements: 8.1_
  
  - [x] 6.4 Agregar guard a app/dashboard/inventory-report/page.tsx
    - Verificar permisos con canAccessInventoryLiquidation
    - Redirigir a /dashboard?error=insufficient_permissions si no tiene acceso
    - _Requirements: 8.1_
  
  - [x] 6.5 Agregar guard a app/dashboard/accounts-settlement/page.tsx
    - Verificar permisos con canAccessAccountsSettlement
    - Redirigir a /dashboard?error=insufficient_permissions si no tiene acceso
    - _Requirements: 8.1_

- [ ] 7. Verificar guards existentes en suppliers y purchase-orders
  - [x] 7.1 Revisar app/dashboard/suppliers/page.tsx
    - Verificar que NO tiene guard que bloquee Trial (debe permitir acceso)
    - Si existe guard restrictivo, removerlo o actualizarlo
    - _Requirements: 1.1, 8.2_
  
  - [x] 7.2 Revisar app/dashboard/purchase-orders/page.tsx
    - Verificar que NO tiene guard que bloquee Trial (debe permitir acceso)
    - Si existe guard restrictivo, removerlo o actualizarlo
    - _Requirements: 2.1, 8.2_

- [ ] 8. Agregar verificación de permisos en API endpoints
  - [ ] 8.1 Identificar API routes que requieren permisos especiales
    - Revisar app/api o lib/actions para endpoints de funcionalidades restringidas
    - Listar endpoints que necesitan verificación de permisos
    - _Requirements: 8.3_
  
  - [ ] 8.2 Agregar verificación de permisos en endpoints identificados
    - Llamar a función de permisos correspondiente al inicio del endpoint
    - Retornar error 403 con mensaje apropiado si no tiene permisos
    - Mantener lógica existente si tiene permisos
    - _Requirements: 8.3_

- [ ] 9. Checkpoint - Verificar seguridad y acceso
  - Verificar que usuarios Trial pueden acceder a suppliers y purchase orders
  - Verificar que usuarios Trial NO pueden acceder a stock history, price history, cash register
  - Verificar que acceso directo por URL a funcionalidades bloqueadas redirige
  - Verificar que API endpoints retornan 403 para usuarios sin permisos
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas

- [ ] 10. Agregar manejo de error en dashboard layout
  - [ ] 10.1 Actualizar app/dashboard/layout.tsx o página principal
    - Detectar parámetro ?error=insufficient_permissions en URL
    - Mostrar toast con mensaje de permisos insuficientes
    - Incluir botón para ver planes
    - _Requirements: 8.1_

- [ ] 11. Actualizar estilos para indicadores de funcionalidades bloqueadas
  - [ ] 11.1 Verificar consistencia visual de items bloqueados
    - Asegurar que todos los items bloqueados usan las mismas clases CSS
    - Verificar que lock icon y plan name tienen el mismo formato
    - Ajustar opacity, cursor, y hover states para items bloqueados
    - _Requirements: 6.5_

- [ ]* 12. Escribir tests unitarios para funciones de permisos
  - [ ]* 12.1 Test canAccessSuppliers con Trial retorna allowed: true
    - _Requirements: 1.3_
  
  - [ ]* 12.2 Test canAccessPurchaseOrders con Trial retorna allowed: true
    - _Requirements: 2.3_
  
  - [ ]* 12.3 Test canAccessStockHistory con Trial retorna allowed: false
    - _Requirements: 4.1_
  
  - [ ]* 12.4 Test todas las funciones de permisos retornan estructura completa
    - _Requirements: 5.3_
  
  - [ ]* 12.5 Test funciones de permisos usan nombres de planes consistentes
    - _Requirements: 7.3_

- [ ]* 13. Escribir tests de componentes para sidebar
  - [ ]* 13.1 Test sidebar muestra todas las funcionalidades
    - _Requirements: 3.1_
  
  - [ ]* 13.2 Test items bloqueados muestran lock icon y plan name
    - _Requirements: 3.2, 3.3_
  
  - [ ]* 13.3 Test items accesibles no muestran lock icon
    - _Requirements: 3.5_
  
  - [ ]* 13.4 Test click en item bloqueado previene navegación y muestra mensaje
    - _Requirements: 3.4_
  
  - [ ]* 13.5 Test items bloqueados usan estilos consistentes
    - _Requirements: 6.5_

- [ ]* 14. Escribir property-based tests
  - [ ]* 14.1 Property test: Trial access to suppliers and purchase orders
    - **Property 1-3: Trial plan access**
    - **Validates: Requirements 1.1, 1.3, 2.1, 2.3**
  
  - [ ]* 14.2 Property test: Menu rendering with correct indicators
    - **Property 4-7: Menu rendering**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  
  - [ ]* 14.3 Property test: Permission values unchanged by UI operations
    - **Property 8: Permission immutability**
    - **Validates: Requirements 3.6**
  
  - [ ]* 14.4 Property test: Existing restrictions maintained
    - **Property 9-10: Restriction maintenance**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
  
  - [ ]* 14.5 Property test: Permission functions return complete structure
    - **Property 11: Permission structure**
    - **Validates: Requirements 5.3**
  
  - [ ]* 14.6 Property test: UI consistency and updates
    - **Property 12-13: UI consistency**
    - **Validates: Requirements 6.4, 6.5**
  
  - [ ]* 14.7 Property test: Upgrade messages include CTA and consistent naming
    - **Property 14-15: Upgrade messages**
    - **Validates: Requirements 7.2, 7.3**
  
  - [ ]* 14.8 Property test: Access control via URL and API
    - **Property 16-17: Access control**
    - **Validates: Requirements 8.1, 8.3**

- [ ] 15. Final checkpoint - Pruebas de integración completas
  - Crear usuario de prueba con plan Trial
  - Verificar acceso completo a suppliers y purchase orders
  - Verificar que menú muestra todas las funcionalidades con indicadores correctos
  - Intentar acceso directo por URL a funcionalidades bloqueadas
  - Verificar que cambio de plan actualiza permisos inmediatamente
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas

## Notes

- Tasks marcados con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada task referencia requirements específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Property tests validan propiedades de correctitud universales
- Unit tests validan ejemplos específicos y casos edge
- La implementación mantiene la seguridad existente mientras mejora la UX

