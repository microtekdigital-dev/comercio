# Implementation Plan: Sistema de Punto de Venta (POS)

## Overview

Este plan de implementación desglosa el sistema POS en tareas incrementales y manejables. Cada tarea construye sobre las anteriores, validando funcionalidad core tempranamente a través de código. El plan prioriza la funcionalidad básica del POS primero, luego agrega características avanzadas como modo offline y reportes.

## Tasks

- [x] 1. Configurar estructura base del POS y tipos
  - Crear tipos TypeScript para POSCart, POSCartItem, POSPayment, POSSaleRequest
  - Crear tipos para OfflineQueueItem (modo offline)
  - Definir interfaces de componentes principales
  - _Requirements: 1.1-1.8, 2.1-2.5_

- [x] 2. Implementar lógica de carrito de compras
  - [x] 2.1 Crear hook usePOSCart con estado y funciones básicas
    - Implementar addItem, updateQuantity, removeItem, clearCart
    - Implementar cálculo automático de totales (subtotal, tax, total)
    - _Requirements: 1.2, 1.4_
  
  - [ ]* 2.2 Escribir property test para invariantes del carrito
    - **Property 1: Cart Invariants**
    - **Validates: Requirements 1.2, 1.4**
  
  - [x] 2.3 Implementar aplicación de descuentos (porcentaje y monto fijo)
    - Agregar applyDiscount al hook usePOSCart
    - Validar que descuento no exceda subtotal
    - _Requirements: 1.5, 12.3_
  
  - [ ]* 2.4 Escribir property test para aplicación de descuentos
    - **Property 2: Discount Application**
    - **Validates: Requirements 1.5**
  
  - [ ]* 2.5 Escribir property test para validación de cantidades
    - **Property 26: Quantity Validation**
    - **Validates: Requirements 12.4**

- [x] 3. Implementar validaciones de stock
  - [x] 3.1 Crear función validateStockAvailability
    - Validar stock para productos sin variantes
    - Validar stock para productos con variantes
    - Retornar errores descriptivos
    - _Requirements: 1.8, 11.3_
  
  - [ ]* 3.2 Escribir property test para validación de stock
    - **Property 5: Stock Validation**
    - **Validates: Requirements 1.8, 11.3**
  
  - [ ]* 3.3 Escribir unit tests para casos edge de stock
    - Test: producto sin stock
    - Test: variante sin stock
    - Test: stock insuficiente para cantidad solicitada
    - _Requirements: 1.8, 11.3_


- [x] 4. Implementar server actions para POS
  - [x] 4.1 Crear searchPOSProducts con query optimizada
    - Incluir productos con variantes, stock e imágenes
    - Aplicar filtros de búsqueda (código, nombre, escaneo)
    - Limitar resultados para rendimiento
    - _Requirements: 1.1_
  
  - [x] 4.2 Crear getPOSProductsByCategory
    - Obtener productos por categoría para grid
    - Incluir información de variantes y stock
    - _Requirements: 1.1_
  
  - [x] 4.3 Crear validatePOSCart
    - Validar disponibilidad de stock
    - Validar precios actuales
    - Validar reglas de negocio (total > 0, descuento válido)
    - _Requirements: 1.8, 12.1, 12.3, 12.4_
  
  - [ ]* 4.4 Escribir unit tests para validatePOSCart
    - Test: carrito válido
    - Test: stock insuficiente
    - Test: total cero
    - Test: descuento excede subtotal
    - _Requirements: 12.1, 12.3_

- [x] 5. Implementar integración con caja registradora
  - [x] 5.1 Crear getActiveCashRegisterOpening
    - Obtener apertura activa del usuario actual
    - Validar que existe apertura antes de permitir ventas
    - _Requirements: 3.1, 3.5_
  
  - [ ]* 5.2 Escribir property test para validación de apertura
    - **Property 8: Cash Register Opening Validation**
    - **Validates: Requirements 3.1, 3.5**
  
  - [x] 5.3 Implementar registro de movimientos de caja
    - Registrar movimientos automáticamente al completar venta
    - Actualizar saldo de efectivo para pagos en efectivo
    - _Requirements: 3.3, 3.4_
  
  - [ ]* 5.4 Escribir property test para integridad de movimientos
    - **Property 9: Cash Register Movement Integrity**
    - **Validates: Requirements 3.3, 3.4**

- [x] 6. Implementar gestión de clientes en POS
  - [x] 6.1 Crear getGenericCustomer
    - Obtener o crear cliente genérico para ventas anónimas
    - Asegurar que existe un solo cliente genérico por empresa
    - _Requirements: 2.3_
  
  - [ ]* 6.2 Escribir property test para asignación de cliente genérico
    - **Property 6: Generic Customer Assignment**
    - **Validates: Requirements 2.3**
  
  - [x] 6.3 Implementar cambio de cliente en venta
    - Permitir cambiar cliente antes de finalizar venta
    - Validar que cliente pertenece a la empresa
    - _Requirements: 2.5_
  
  - [ ]* 6.4 Escribir property test para reasignación de cliente
    - **Property 7: Customer Reassignment**
    - **Validates: Requirements 2.5**

- [x] 7. Implementar creación de ventas desde POS
  - [x] 7.1 Crear createPOSSale con soporte para múltiples pagos
    - Validar que suma de pagos = total de venta
    - Crear venta con items y pagos
    - Actualizar stock de productos/variantes
    - Registrar movimientos en caja registradora
    - Asignar cliente genérico si no hay cliente seleccionado
    - _Requirements: 1.6, 2.3, 3.3, 3.4, 12.2_
  
  - [ ]* 7.2 Escribir property test para múltiples métodos de pago
    - **Property 3: Multiple Payment Methods**
    - **Validates: Requirements 1.6, 12.2**
  
  - [ ]* 7.3 Escribir property test para validación de total
    - **Property 24: Sale Total Validation**
    - **Validates: Requirements 12.1**
  
  - [ ]* 7.4 Escribir unit tests para createPOSSale
    - Test: venta exitosa con un pago
    - Test: venta exitosa con múltiples pagos
    - Test: error sin apertura de caja
    - Test: error con stock insuficiente
    - Test: error con suma de pagos incorrecta
    - _Requirements: 1.6, 3.1, 12.2_

- [x] 8. Checkpoint - Validar funcionalidad core del POS
  - Asegurar que todos los tests pasen
  - Verificar que se pueden crear ventas básicas
  - Preguntar al usuario si hay dudas


- [x] 9. Implementar cálculo de cambio y validación de pagos en efectivo
  - [x] 9.1 Crear función calculateChange
    - Calcular cambio = recibido - debido
    - Validar que recibido >= debido
    - _Requirements: 1.7, 12.6_
  
  - [ ]* 9.2 Escribir property test para cálculo de cambio
    - **Property 4: Change Calculation**
    - **Validates: Requirements 1.7**
  
  - [ ]* 9.3 Escribir property test para validación de pago en efectivo
    - **Property 28: Cash Payment Validation**
    - **Validates: Requirements 12.6**

- [x] 10. Implementar generación de tickets
  - [x] 10.1 Crear generatePOSTicket para formato térmico 80mm
    - Generar HTML con formato de ticket
    - Incluir todos los campos requeridos (número, fecha, productos, totales, pagos, cambio)
    - Aplicar estilos para impresora térmica
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 10.2 Escribir property test para completitud de ticket
    - **Property 10: Ticket Generation Completeness**
    - **Validates: Requirements 4.1, 4.2**
  
  - [x] 10.3 Crear sendPOSTicketEmail para envío por email
    - Generar PDF del ticket
    - Enviar email con PDF adjunto
    - _Requirements: 4.3_
  
  - [ ]* 10.4 Escribir property test para generación de PDF
    - **Property 11: Ticket PDF Generation**
    - **Validates: Requirements 4.3**
  
  - [ ]* 10.5 Escribir property test para regeneración de tickets
    - **Property 12: Ticket Regeneration**
    - **Validates: Requirements 4.4**

- [x] 11. Implementar componente ProductGrid
  - [x] 11.1 Crear componente ProductGrid con búsqueda
    - Grid responsive de productos con imágenes
    - Campo de búsqueda con debounce
    - Filtro por categoría
    - Mostrar stock disponible
    - _Requirements: 1.1, 1.2_
  
  - [x] 11.2 Implementar selector de variantes
    - Modal/dropdown para seleccionar variante
    - Mostrar stock por variante
    - Deshabilitar variantes sin stock
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ]* 11.3 Escribir property test para requerimiento de variante
    - **Property 21: Variant Selection Requirement**
    - **Validates: Requirements 11.1, 11.2**
  
  - [ ]* 11.4 Escribir property test para display de stock de variantes
    - **Property 22: Variant Stock Display**
    - **Validates: Requirements 11.3, 11.4**
  
  - [ ]* 11.5 Escribir unit tests para ProductGrid
    - Test: búsqueda de productos
    - Test: selección de producto sin variantes
    - Test: selección de producto con variantes
    - Test: variantes sin stock deshabilitadas
    - _Requirements: 1.1, 11.1, 11.2, 11.3_

- [x] 12. Implementar componente ShoppingCart
  - [x] 12.1 Crear componente ShoppingCart con edición
    - Lista de items con cantidades editables
    - Botón para eliminar items
    - Resumen de totales (subtotal, descuento, impuestos, total)
    - Botón para aplicar descuento
    - Botón para finalizar venta
    - Botón para limpiar carrito
    - _Requirements: 1.4, 1.5_
  
  - [x] 12.2 Implementar gestos táctiles
    - Swipe para eliminar items
    - Botones táctiles de 44x44px mínimo
    - _Requirements: 9.1, 9.3_
  
  - [ ]* 12.3 Escribir property test para múltiples variantes en carrito
    - **Property 23: Multiple Variants in Cart**
    - **Validates: Requirements 11.5**
  
  - [ ]* 12.4 Escribir unit tests para ShoppingCart
    - Test: agregar item
    - Test: actualizar cantidad
    - Test: eliminar item
    - Test: aplicar descuento
    - Test: limpiar carrito
    - _Requirements: 1.4, 1.5_

- [x] 13. Implementar componente PaymentModal
  - [x] 13.1 Crear modal de pago con múltiples métodos
    - Selector de método de pago
    - Input para monto de cada método
    - Cálculo automático de cambio para efectivo
    - Validación de suma de pagos
    - Teclado numérico virtual para tablets/móviles
    - _Requirements: 1.6, 1.7, 9.2_
  
  - [ ]* 13.2 Escribir unit tests para PaymentModal
    - Test: pago único
    - Test: múltiples pagos
    - Test: cálculo de cambio
    - Test: validación de suma incorrecta
    - _Requirements: 1.6, 1.7, 12.2_


- [x] 14. Implementar componente CustomerSelector
  - [x] 14.1 Crear selector de clientes con búsqueda
    - Búsqueda incremental de clientes
    - Mostrar cliente seleccionado
    - Botón para crear cliente rápido
    - Opción para venta sin cliente (genérico)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 14.2 Escribir unit tests para CustomerSelector
    - Test: búsqueda de clientes
    - Test: selección de cliente
    - Test: venta sin cliente
    - _Requirements: 2.1, 2.3_

- [x] 15. Implementar layout responsive del POS
  - [x] 15.1 Crear POSLayout con adaptación de pantalla
    - Layout de 2 columnas para desktop/tablet landscape
    - Layout de 1 columna para móvil/tablet portrait
    - Grid de productos colapsable en móvil
    - Carrito siempre visible
    - _Requirements: 9.4, 9.6, 9.7_
  
  - [x] 15.2 Optimizar para pantallas táctiles
    - Botones de 44x44px mínimo
    - Espaciado adecuado entre elementos
    - Gestos táctiles (swipe, tap)
    - _Requirements: 9.1, 9.3_
  
  - [x] 15.3 Asegurar funcionalidad desde 320px de ancho
    - Probar en diferentes tamaños de pantalla
    - Ajustar breakpoints responsive
    - _Requirements: 9.8_

- [x] 16. Implementar atajos de teclado
  - [x] 16.1 Crear hook useKeyboardShortcuts
    - F1: Enfocar búsqueda de productos
    - F2: Enfocar búsqueda de clientes
    - F3: Abrir modal de descuento
    - F4: Abrir selector de método de pago
    - F9: Cancelar venta (con confirmación)
    - F12: Finalizar venta
    - Enter: Confirmar acción
    - Esc: Cancelar/cerrar modal
    - _Requirements: 5.1-5.8_
  
  - [x] 16.2 Agregar botones en pantalla para atajos en móvil
    - Toolbar con botones para acciones principales
    - Accesible en dispositivos sin teclado físico
    - _Requirements: 9.10_
  
  - [ ]* 16.3 Escribir unit tests para useKeyboardShortcuts
    - Test: cada atajo de teclado
    - Test: prevención de comportamiento por defecto
    - _Requirements: 5.1-5.8_

- [x] 17. Implementar soporte multimoneda
  - [x] 17.1 Integrar con company_settings para moneda
    - Obtener currency_code, currency_symbol, currency_position
    - Aplicar formato correcto en todos los displays
    - _Requirements: 13.1, 13.2_
  
  - [x] 17.2 Crear función formatCurrency
    - Formatear montos con símbolo correcto
    - Posición del símbolo (before/after)
    - Separadores de miles y decimales
    - _Requirements: 13.2_
  
  - [ ]* 17.3 Escribir property test para consistencia de moneda
    - **Property 29: Currency Consistency**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

- [x] 18. Checkpoint - Validar interfaz completa del POS
  - Asegurar que todos los tests pasen
  - Verificar flujo completo de venta en diferentes dispositivos
  - Preguntar al usuario si hay dudas


- [x] 19. Implementar seguridad multi-tenant
  - [x] 19.1 Crear RLS policies para offline_sales_queue
    - Policy para SELECT (ver cola de su empresa)
    - Policy para INSERT (insertar en cola de su empresa)
    - Policy para UPDATE (actualizar cola de su empresa)
    - _Requirements: 10.1-10.5_
  
  - [x] 19.2 Validar aislamiento de datos en acciones POS
    - Validar company_id en todas las queries
    - Validar que productos pertenecen a la empresa
    - Validar que clientes pertenecen a la empresa
    - Validar que caja registradora pertenece a la empresa
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 19.3 Escribir property test para aislamiento multi-tenant
    - **Property 20: Multi-Tenant Data Isolation**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 20. Implementar restricciones por plan
  - [x] 20.1 Crear función checkPlanRestrictions
    - Validar límite de cajas registradoras activas por plan
    - Validar acceso a reportes avanzados por plan
    - Validar acceso a modo offline por plan
    - _Requirements: 8.1-8.7_
  
  - [x] 20.2 Aplicar restricciones en UI
    - Deshabilitar funcionalidades no disponibles
    - Mostrar mensajes claros sobre restricciones
    - Sugerir upgrade de plan cuando corresponda
    - _Requirements: 8.7_
  
  - [ ]* 20.3 Escribir property test para aplicación de restricciones
    - **Property 19: Plan Restriction Enforcement**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

- [x] 21. Implementar modo offline (Plan Empresarial)
  - [x] 21.1 Crear tabla offline_sales_queue en base de datos
    - Ejecutar script SQL para crear tabla
    - Crear índices para rendimiento
    - Aplicar RLS policies
    - _Requirements: 6.1-6.6_
  
  - [x] 21.2 Crear hook useOfflineSync
    - Detectar estado online/offline
    - Mantener cola de ventas pendientes
    - Sincronizar automáticamente al recuperar conexión
    - _Requirements: 6.3, 6.4_
  
  - [x] 21.3 Implementar caché de productos frecuentes
    - Crear getFrequentProducts (top 100 productos más vendidos)
    - Almacenar en localStorage/IndexedDB
    - Refrescar caché periódicamente
    - _Requirements: 6.1_
  
  - [ ]* 21.4 Escribir property test para caché de productos
    - **Property 13: Offline Product Cache (Empresarial Plan)**
    - **Validates: Requirements 6.1**
  
  - [x] 21.5 Implementar creación de ventas offline
    - Permitir crear ventas con productos en caché
    - Agregar ventas a cola de sincronización
    - Mostrar indicador de estado offline
    - _Requirements: 6.2, 6.3, 6.5_
  
  - [ ]* 21.6 Escribir property test para creación de ventas offline
    - **Property 14: Offline Sale Creation (Empresarial Plan)**
    - **Validates: Requirements 6.2**
  
  - [ ]* 21.7 Escribir property test para gestión de cola offline
    - **Property 15: Offline Queue Management (Empresarial Plan)**
    - **Validates: Requirements 6.3**
  
  - [x] 21.8 Implementar sincronización de ventas offline
    - Crear syncOfflineSales para procesar cola
    - Manejar errores de sincronización
    - Resolver conflictos de stock
    - _Requirements: 6.4, 6.6_
  
  - [ ]* 21.9 Escribir property test para sincronización correcta
    - **Property 16: Offline Sync Correctness (Empresarial Plan)**
    - **Validates: Requirements 6.4**
  
  - [ ]* 21.10 Escribir property test para resolución de conflictos
    - **Property 17: Stock Conflict Resolution (Empresarial Plan)**
    - **Validates: Requirements 6.6**
  
  - [ ]* 21.11 Escribir unit tests para modo offline
    - Test: detección de estado offline
    - Test: agregar venta a cola
    - Test: sincronización exitosa
    - Test: sincronización con error
    - Test: conflicto de stock
    - _Requirements: 6.1-6.6_


- [x] 22. Implementar reportes POS (Planes Profesional y Empresarial)
  - [x] 22.1 Crear getPOSReportSalesByCashier
    - Agrupar ventas por cajero para fecha/rango
    - Calcular totales por cajero
    - _Requirements: 7.1_
  
  - [x] 22.2 Crear getPOSReportTopProducts
    - Obtener productos más vendidos en POS
    - Ordenar por cantidad vendida
    - _Requirements: 7.2_
  
  - [x] 22.3 Crear getPOSReportPaymentMethods
    - Agrupar ventas por método de pago
    - Calcular totales por método
    - _Requirements: 7.3_
  
  - [x] 22.4 Crear getPOSReportSalesByHour
    - Agrupar ventas por hora del día
    - Calcular totales por hora
    - _Requirements: 7.4_
  
  - [ ]* 22.5 Escribir property test para precisión de reportes
    - **Property 18: Report Calculation Accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  
  - [x] 22.6 Crear componente POSReports
    - Filtros de fecha
    - Visualización de reportes
    - Exportación a PDF/Excel
    - Restricción por plan
    - _Requirements: 7.1-7.6_
  
  - [ ]* 22.7 Escribir unit tests para reportes POS
    - Test: reporte de ventas por cajero
    - Test: reporte de productos más vendidos
    - Test: reporte de métodos de pago
    - Test: reporte de ventas por hora
    - Test: restricción por plan
    - _Requirements: 7.1-7.6, 8.3, 8.4_

- [x] 23. Implementar manejo de errores
  - [x] 23.1 Crear clase POSError y códigos de error
    - Definir categorías de error (validation, business, network, system)
    - Definir códigos de error específicos
    - _Requirements: 14.5_
  
  - [x] 23.2 Crear función handlePOSError
    - Convertir errores conocidos a POSError
    - Proporcionar mensajes amigables
    - Determinar si error es recuperable
    - _Requirements: 14.5_
  
  - [x] 23.3 Implementar estrategias de recuperación
    - Validation errors: mantener estado, permitir corrección
    - Stock insuficiente: actualizar carrito, notificar
    - Sin apertura: redirigir, preservar carrito
    - Error de conexión: modo offline (Empresarial) o reintentar
    - _Requirements: 14.5_
  
  - [ ]* 23.4 Escribir unit tests para manejo de errores
    - Test: cada tipo de error
    - Test: mensajes de error amigables
    - Test: estrategias de recuperación
    - _Requirements: 14.5_

- [x] 24. Implementar validación de disponibilidad de stock durante venta
  - [x] 24.1 Crear función checkStockAvailabilityDuringSale
    - Verificar stock antes de finalizar venta
    - Detectar cambios de stock por ventas concurrentes
    - Notificar al usuario y actualizar carrito
    - _Requirements: 12.5_
  
  - [ ]* 24.2 Escribir property test para disponibilidad de stock
    - **Property 27: Stock Availability During Sale**
    - **Validates: Requirements 12.5**

- [x] 25. Checkpoint - Validar funcionalidades avanzadas
  - Asegurar que todos los tests pasen
  - Verificar modo offline (plan Empresarial)
  - Verificar reportes (planes Profesional y Empresarial)
  - Verificar restricciones por plan
  - Preguntar al usuario si hay dudas


- [x] 26. Crear página principal del POS
  - [x] 26.1 Crear app/dashboard/pos/page.tsx
    - Integrar todos los componentes (ProductGrid, ShoppingCart, CustomerSelector)
    - Implementar flujo completo de venta
    - Validar apertura de caja antes de permitir acceso
    - _Requirements: 1.1-1.8, 2.1-2.5, 3.1_
  
  - [x] 26.2 Agregar navegación al POS en el dashboard
    - Agregar enlace en sidebar
    - Agregar ícono apropiado
    - _Requirements: 1.1_

- [x] 27. Implementar tests de integración
  - [ ]* 27.1 Escribir test de flujo completo de venta
    - Test: abrir caja → agregar productos → aplicar descuento → pagar → generar ticket
    - Verificar actualización de stock
    - Verificar movimientos de caja
    - Verificar generación de ticket
    - _Requirements: 1.1-1.8, 3.3, 3.4, 4.1, 4.2_
  
  - [ ]* 27.2 Escribir test de venta con variantes
    - Test: seleccionar producto con variantes → elegir variante → agregar al carrito → completar venta
    - Verificar actualización de stock de variante
    - _Requirements: 11.1-11.5_
  
  - [ ]* 27.3 Escribir test de venta con múltiples pagos
    - Test: crear venta → dividir pago entre efectivo y tarjeta → completar
    - Verificar suma de pagos
    - Verificar movimientos de caja por método
    - _Requirements: 1.6, 3.3, 3.4_
  
  - [ ]* 27.4 Escribir test de modo offline (Plan Empresarial)
    - Test: simular offline → crear venta → verificar cola → simular online → verificar sincronización
    - _Requirements: 6.1-6.6_

- [x] 28. Optimización de rendimiento
  - [x] 28.1 Optimizar búsqueda de productos
    - Implementar debounce en búsqueda
    - Limitar resultados
    - Indexar campos de búsqueda en base de datos
    - _Requirements: 1.1, 14.1_
  
  - [x] 28.2 Optimizar carga de imágenes de productos
    - Lazy loading de imágenes
    - Placeholders mientras cargan
    - Optimizar tamaño de imágenes
    - _Requirements: 14.1_
  
  - [x] 28.3 Implementar caché de datos frecuentes
    - Cachear categorías
    - Cachear métodos de pago
    - Cachear configuración de empresa
    - _Requirements: 14.1, 14.2_

- [x] 29. Documentación y guía de usuario
  - [x] 29.1 Crear documentación de atajos de teclado
    - Documento con todos los atajos
    - Tooltip en UI mostrando atajos disponibles
    - _Requirements: 5.1-5.8_
  
  - [x] 29.2 Crear guía rápida del POS
    - Flujo básico de venta
    - Manejo de variantes
    - Aplicación de descuentos
    - Múltiples métodos de pago
    - _Requirements: 1.1-1.8_

- [x] 30. Checkpoint final - Validar sistema completo
  - Ejecutar todos los tests (unit, property, integration)
  - Verificar cobertura de tests (mínimo 80%)
  - Probar en diferentes dispositivos (desktop, tablet, móvil)
  - Probar en diferentes navegadores
  - Verificar rendimiento (búsquedas < 500ms)
  - Verificar accesibilidad (botones 44x44px)
  - Preguntar al usuario si hay dudas o ajustes necesarios

## Notes

- Las tareas marcadas con `*` son opcionales (tests) y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Property tests validan propiedades universales de corrección
- Unit tests validan ejemplos específicos y casos edge
- Integration tests validan flujos completos end-to-end
- El plan prioriza funcionalidad core primero, luego características avanzadas
