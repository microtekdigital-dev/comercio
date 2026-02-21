# Implementation Plan: Gestión de Reparaciones de Dispositivos

## Overview

Este plan implementa el módulo completo de gestión de reparaciones de dispositivos electrónicos para el ERP SaaS. La implementación se divide en fases incrementales: primero la estructura de base de datos y modelos, luego las acciones del servidor, después los componentes UI, y finalmente las integraciones con módulos existentes. Cada fase incluye pruebas para validar la funcionalidad antes de continuar.

## Tasks

- [x] 1. Crear estructura de base de datos para reparaciones
  - Crear script SQL con tablas: technicians, repair_orders, repair_items, repair_payments, repair_notes
  - Definir tipo enum repair_status con todos los estados
  - Configurar índices para optimizar consultas frecuentes
  - Implementar función para generar números de orden secuenciales
  - Configurar políticas RLS para todas las tablas nuevas
  - _Requirements: 1.1, 1.5, 2.1, 4.1, 21.2_

- [x] 1.1 Escribir test de propiedad para números de orden secuenciales
  - **Property 2: Sequential Order Numbers**
  - **Validates: Requirements 1.5**

- [x] 1.2 Escribir test de propiedad para aislamiento RLS
  - **Property 49: Row Level Security Isolation**
  - **Validates: Requirements 21.2, 21.6**

- [-] 2. Implementar gestión de técnicos
  - [x] 2.1 Crear tipos TypeScript para Technician en lib/types/erp.ts
    - Definir interface Technician con todos los campos
    - Definir tipos para CreateTechnicianInput y UpdateTechnicianInput
    - _Requirements: 2.1_

  - [x] 2.2 Crear lib/actions/technicians.ts con funciones CRUD
    - Implementar getTechnicians con filtro de activos
    - Implementar getTechnicianById
    - Implementar createTechnician con validación de nombre
    - Implementar updateTechnician
    - Implementar deleteTechnician (soft delete marcando como inactivo)
    - Implementar getTechnicianStats para contar reparaciones asignadas
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [x] 2.3 Escribir tests de propiedad para gestión de técnicos
    - **Property 5: Technician Management**
    - **Property 6: Active Technician Filtering**
    - **Property 7: Technician Assignment Count**
    - **Property 9: Technician Name Validation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.7**

  - [x] 2.4 Crear página /dashboard/technicians
    - Crear app/dashboard/technicians/page.tsx con lista de técnicos
    - Implementar tabla con columnas: nombre, especialidad, estado, reparaciones activas
    - Agregar botones para crear, editar, activar/desactivar
    - Agregar filtro para mostrar solo activos o todos
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.5 Crear componente TechnicianSelector
    - Crear components/dashboard/technician-selector.tsx
    - Implementar selector dropdown que muestra solo técnicos activos
    - Permitir selección opcional (sin técnico asignado)
    - _Requirements: 2.4, 3.1, 3.5_

- [x] 3. Implementar modelo de órdenes de reparación
  - [x] 3.1 Crear tipos TypeScript para RepairOrder en lib/types/erp.ts
    - Definir type RepairStatus con todos los estados
    - Definir interface RepairOrder con todos los campos
    - Definir tipos para CreateRepairOrderInput, UpdateRepairOrderInput
    - Definir RepairOrderWithDetails con relaciones
    - _Requirements: 1.1, 4.1_

  - [x] 3.2 Crear lib/actions/repair-orders.ts con funciones principales
    - Implementar getRepairOrders con filtros (status, technician, dates, search)
    - Implementar getRepairOrderById con joins a customer, technician, items
    - Implementar createRepairOrder con generación de order_number
    - Implementar updateRepairOrder
    - Implementar updateRepairStatus con lógica de fechas automáticas
    - Implementar deleteRepairOrder
    - Implementar searchRepairOrders por número, cliente, dispositivo
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 3.3 Escribir tests de propiedad para creación de órdenes
    - **Property 1: Order Creation with Initial State**
    - **Property 3: Automatic Timestamps**
    - **Property 4: Optional Fields Storage**
    - **Property 10: Technician Assignment and Reassignment**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3, 3.5**

  - [x] 3.4 Escribir tests de propiedad para estados y búsqueda
    - **Property 11: Valid Status Transitions**
    - **Property 12: Closed Order Status**
    - **Property 27: Repair Order Search**
    - **Property 28: Repair Order Filtering**
    - **Validates: Requirements 4.1, 4.5, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8**

- [-] 4. Implementar gestión de repuestos y presupuesto
  - [x] 4.1 Crear tipos TypeScript para RepairItem en lib/types/erp.ts
    - Definir interface RepairItem
    - Definir RepairItemWithProduct
    - Definir tipos para AddRepairItemInput, UpdateRepairItemInput
    - _Requirements: 5.3_

  - [x] 4.2 Crear lib/actions/repair-items.ts
    - Implementar getRepairItems con join a products
    - Implementar addRepairItem con validación de producto existente
    - Implementar updateRepairItem
    - Implementar deleteRepairItem
    - Implementar markItemAsUsed que descuenta stock y crea stock_movement
    - Implementar calculateRepairTotal que suma items + labor_cost
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 7.2, 7.3, 13.5_

  - [x] 4.3 Escribir tests de propiedad para presupuesto
    - **Property 14: Budget Item Management**
    - **Property 15: Budget Total Calculation**
    - **Property 16: Product Selection and Stock Display**
    - **Property 19: Stock Deduction on Part Usage**
    - **Property 22: Product Validation**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.2, 7.3, 13.5**

  - [x] 4.4 Crear componente RepairItemsTable
    - Crear components/dashboard/repair-items-table.tsx
    - Mostrar tabla con columnas: producto, cantidad, precio unitario, subtotal, usado
    - Agregar botón para agregar repuestos desde inventario
    - Agregar botón para marcar como usado (con confirmación)
    - Mostrar advertencia si stock insuficiente
    - Mostrar total de repuestos y labor al final
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 7.2, 7.5_

- [ ] 5. Checkpoint - Verificar funcionalidad básica
  - Asegurar que todas las pruebas pasen
  - Verificar que se pueden crear técnicos y órdenes de reparación
  - Verificar que se pueden agregar repuestos y calcular totales
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [-] 6. Implementar diagnóstico y aprobación
  - [x] 6.1 Agregar funciones de diagnóstico a repair-orders.ts
    - Implementar updateDiagnosis que actualiza diagnosis y diagnosis_date
    - Implementar approveBudget que actualiza budget_approved y approval_date
    - Implementar rejectBudget que marca como rechazado y permite cancelar
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.2 Escribir tests de propiedad para diagnóstico y aprobación
    - **Property 13: Diagnosis Recording**
    - **Property 17: Budget Approval Recording**
    - **Property 18: Approval-Based State Transitions**
    - **Validates: Requirements 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5**

  - [x] 6.3 Crear componente de diagnóstico en detalle de orden
    - Agregar sección de diagnóstico con textarea y botón guardar
    - Mostrar fecha de diagnóstico cuando existe
    - Agregar sección de aprobación con botones aprobar/rechazar
    - Mostrar estado de aprobación y fecha
    - _Requirements: 5.1, 5.2, 6.1, 6.4_

- [-] 7. Implementar sistema de pagos
  - [x] 7.1 Crear tipos TypeScript para RepairPayment en lib/types/erp.ts
    - Definir interface RepairPayment
    - Definir tipos para CreateRepairPaymentInput
    - Definir PaymentBalance con total, paid, balance
    - _Requirements: 14.1_

  - [x] 7.2 Crear lib/actions/repair-payments.ts
    - Implementar getRepairPayments para una orden
    - Implementar createRepairPayment
    - Implementar getRepairPaymentBalance que calcula total - pagado
    - Implementar processRepairPayment que crea pago y lo vincula a caja o cuenta corriente
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 15.1, 15.2, 15.3, 15.4_

  - [x] 7.3 Escribir tests de propiedad para pagos
    - **Property 31: Payment Recording**
    - **Property 32: Payment Status Calculation**
    - **Property 33: Partial Payments and Balance**
    - **Property 34: Current Account Integration**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6**

  - [x] 7.4 Crear componente RepairPaymentModal
    - Crear components/dashboard/repair-payment-modal.tsx
    - Mostrar total de la reparación y saldo pendiente
    - Permitir ingresar monto y método de pago
    - Permitir pago en efectivo/tarjeta (va a caja) o a cuenta corriente
    - Validar que monto sea positivo
    - Mostrar historial de pagos previos
    - _Requirements: 14.1, 14.4, 14.5, 14.6, 15.1_

- [-] 8. Implementar notas internas
  - [x] 8.1 Crear tipos TypeScript para RepairNote en lib/types/erp.ts
    - Definir interface RepairNote
    - _Requirements: 17.1_

  - [x] 8.2 Crear lib/actions/repair-notes.ts
    - Implementar getRepairNotes ordenadas por fecha
    - Implementar createRepairNote con created_by automático
    - Implementar updateRepairNote con validación de permisos (solo creador)
    - Implementar deleteRepairNote con validación de permisos
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [x] 8.3 Escribir test de propiedad para notas internas
    - **Property 37: Internal Notes Management**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4**

  - [x] 8.4 Crear componente de notas internas
    - Crear components/dashboard/repair-notes-section.tsx
    - Mostrar lista de notas con fecha, usuario, contenido
    - Permitir agregar nueva nota
    - Permitir editar solo notas propias
    - Ordenar cronológicamente
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 9. Implementar páginas principales de UI
  - [x] 9.1 Crear página de lista de reparaciones
    - Crear app/dashboard/repairs/page.tsx
    - Mostrar tabla con: número, cliente, dispositivo, técnico, estado, fecha ingreso, fecha estimada
    - Implementar filtros: estado, técnico, rango de fechas
    - Implementar búsqueda por número, cliente, dispositivo
    - Agregar badge de color por estado
    - Agregar indicador de órdenes vencidas
    - Mostrar contador de resultados
    - Agregar botón "Nueva Reparación"
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8, 19.5, 19.6_

  - [x] 9.2 Crear página de nueva reparación
    - Crear app/dashboard/repairs/new/page.tsx
    - Formulario con secciones: Cliente, Dispositivo, Problema, Técnico, Fecha estimada
    - Selector de cliente existente o crear nuevo
    - Campos de dispositivo: tipo, marca, modelo, serie, accesorios
    - Campo de problema reportado (textarea)
    - Selector de técnico (opcional)
    - Selector de fecha estimada de entrega
    - Opción para subir fotos (opcional)
    - Validar campos requeridos
    - Al guardar, redirigir a detalle de la orden creada
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.8, 3.1, 3.5, 12.1, 12.2, 19.1, 20.1_

  - [x] 9.3 Crear página de detalle de reparación
    - Crear app/dashboard/repairs/[id]/page.tsx
    - Mostrar información completa de la orden en secciones
    - Sección de información del dispositivo (editable)
    - Sección de diagnóstico (editable por técnico)
    - Sección de presupuesto con RepairItemsTable
    - Sección de aprobación del cliente
    - Sección de pagos con RepairPaymentModal
    - Sección de notas internas
    - Timeline de cambios de estado
    - Botones para cambiar estado
    - Botón para imprimir orden
    - Botón para enviar notificación
    - _Requirements: 1.2, 3.2, 4.1, 5.1, 6.1, 7.4, 10.3, 14.4, 17.3, 19.3_

- [ ] 10. Checkpoint - Verificar flujo completo
  - Asegurar que todas las pruebas pasen
  - Verificar flujo completo: crear orden → diagnóstico → presupuesto → aprobar → usar repuestos → pagar → entregar
  - Verificar que filtros y búsqueda funcionan correctamente
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [ ] 11. Implementar documento imprimible
  - [x] 11.1 Crear componente RepairOrderPrint
    - Crear components/dashboard/repair-order-print.tsx
    - Diseño profesional con logo y datos de la empresa
    - Incluir todos los campos requeridos: número, fechas, cliente, dispositivo, problema, accesorios, técnico
    - Incluir presupuesto si existe
    - Incluir términos y condiciones
    - Estilo optimizado para impresión
    - _Requirements: 8.1, 8.2, 8.3, 19.4_

  - [x] 11.2 Crear página de impresión
    - Crear app/dashboard/repairs/[id]/print/page.tsx
    - Renderizar RepairOrderPrint
    - Agregar botón para generar PDF
    - Implementar función para descargar como PDF
    - _Requirements: 8.1, 8.4_

  - [ ] 11.3 Escribir test de propiedad para documento imprimible
    - **Property 23: Printable Document Generation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 19.4**

- [ ] 12. Implementar sistema de notificaciones
  - [x] 12.1 Crear lib/actions/repair-notifications.ts
    - Implementar sendRepairReadyNotification que envía email/SMS cuando estado = "repaired"
    - Usar servicio Resend existente para emails
    - Implementar plantilla de email con número de orden y mensaje
    - Registrar envío exitoso o error en logs
    - Implementar resendNotification para reintentos manuales
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ] 12.2 Escribir tests de propiedad para notificaciones
    - **Property 24: Repair Ready Notification**
    - **Property 25: Notification Error Handling**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

  - [x] 12.3 Integrar notificaciones en cambio de estado
    - Modificar updateRepairStatus para enviar notificación automática cuando status = "repaired"
    - Agregar botón manual "Reenviar Notificación" en detalle de orden
    - Mostrar estado de notificación (enviada, fallida, pendiente)
    - _Requirements: 9.1, 9.6_

- [ ] 13. Implementar historial de reparaciones por cliente
  - [x] 13.1 Agregar sección de reparaciones en detalle de cliente
    - Modificar app/dashboard/customers/[id]/page.tsx
    - Agregar tab "Reparaciones" junto a ventas y cuenta corriente
    - Mostrar tabla con historial ordenado por fecha descendente
    - Mostrar: número, fecha, dispositivo, estado, total
    - Mostrar estadísticas: total de reparaciones, monto total
    - Permitir click para ir al detalle de la reparación
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 12.3_

  - [ ] 13.2 Escribir tests de propiedad para historial de cliente
    - **Property 26: Customer Repair History**
    - **Property 29: Customer Integration**
    - **Property 30: Active Repairs Summary**
    - **Validates: Requirements 10.1, 10.2, 10.4, 10.5, 12.1, 12.2, 12.3, 12.5**

- [ ] 14. Implementar reportes de reparaciones
  - [x] 14.1 Crear lib/actions/repair-reports.ts
    - Implementar getPendingRepairs (no entregadas ni canceladas)
    - Implementar getRepairsByTechnician con agregación de conteos
    - Implementar getRepairsByStatus con distribución
    - Implementar getRepairProfitability calculando costos y márgenes
    - Implementar getAverageRepairTime calculando promedio de días
    - Implementar exportRepairsReport para generar Excel/PDF
    - Todas las funciones deben aceptar filtro de rango de fechas
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

  - [ ] 14.2 Escribir tests de propiedad para reportes
    - **Property 38: Pending Repairs Report**
    - **Property 39: Technician Performance Report**
    - **Property 40: Status Distribution Report**
    - **Property 41: Profitability Calculation**
    - **Property 42: Average Repair Time**
    - **Property 43: Report Filtering and Export**
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7**

  - [x] 14.3 Crear página de reportes
    - Crear app/dashboard/repairs/reports/page.tsx
    - Implementar selector de rango de fechas
    - Mostrar tarjetas con métricas principales: pendientes, promedio tiempo, rentabilidad
    - Mostrar gráfico de distribución por estado
    - Mostrar tabla de desempeño por técnico
    - Mostrar tabla de rentabilidad por reparación
    - Agregar botones para exportar a Excel y PDF
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

- [ ] 15. Implementar restricción por plan
  - [x] 15.1 Crear middleware de verificación de plan
    - Crear función checkRepairsPlanAccess en lib/utils/plan-guards.ts
    - Verificar que la empresa tiene Plan Pro Reparaciones activo
    - Retornar error 403 con mensaje de upgrade si no tiene el plan
    - _Requirements: 16.1, 16.2, 16.3, 16.6_

  - [x] 15.2 Aplicar middleware a todas las rutas de reparaciones
    - Agregar verificación en todas las páginas de /dashboard/repairs/*
    - Agregar verificación en todas las acciones de repair-orders, repair-items, repair-payments, etc.
    - Mostrar mensaje amigable en UI cuando no tiene acceso
    - _Requirements: 16.3, 16.6_

  - [x] 15.3 Condicionar visibilidad del menú
    - Modificar componente de navegación para mostrar "Reparaciones" solo si tiene Plan Pro Reparaciones
    - Ocultar completamente la opción si no tiene el plan
    - _Requirements: 16.1, 16.2_

  - [ ] 15.4 Escribir tests de propiedad para restricción por plan
    - **Property 35: Plan-Based Access Control**
    - **Property 36: Plan Change Data Persistence**
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6**

- [ ] 16. Implementar validaciones completas
  - [x] 16.1 Agregar validaciones de campos requeridos
    - Validar en createRepairOrder: customer_id, device_type, brand, model, reported_problem
    - Validar en createTechnician: name no vacío
    - Validar en addRepairItem: product_id existe, quantity > 0, unit_price >= 0
    - Validar en createRepairPayment: amount > 0, payment_method no vacío
    - Retornar errores 400 con mensajes específicos
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 16.2 Agregar validación de fechas
    - Validar que estimated_delivery_date >= received_date
    - Retornar error 400 si la fecha es inválida
    - _Requirements: 20.6_

  - [ ] 16.3 Escribir tests de propiedad para validaciones
    - **Property 45: Required Field Validation**
    - **Property 46: Budget Validation**
    - **Property 47: Payment Validation**
    - **Property 48: Date Validation**
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6**

- [x] 17. Implementar funcionalidades adicionales
  - [x] 17.1 Implementar reversión de stock en cancelación
    - Agregar función revertStockMovements en repair-items.ts
    - Al cancelar orden con repuestos usados, permitir revertir movimientos
    - Agregar botón "Revertir Stock" en órdenes canceladas
    - _Requirements: 13.3_

  - [x] 17.2 Escribir test de propiedad para reversión de stock
    - **Property 21: Stock Reversal on Cancellation**
    - **Validates: Requirements 13.3**

  - [x] 17.3 Implementar advertencia de stock bajo
    - Modificar addRepairItem para verificar stock disponible
    - Mostrar advertencia en UI si quantity > stock
    - Permitir continuar con la operación (solo advertencia)
    - _Requirements: 7.5_

  - [ ] 17.4 Escribir test de propiedad para advertencia de stock
    - **Property 20: Low Stock Warning**
    - **Validates: Requirements 7.5**

  - [x] 17.5 Implementar gestión de fecha estimada
    - Agregar campo de fecha estimada en formulario de creación
    - Permitir editar fecha estimada en detalle de orden
    - Calcular y mostrar indicador de "vencida" si fecha < hoy y no entregada
    - Agregar filtro de "órdenes vencidas" en lista
    - _Requirements: 19.1, 19.2, 19.5, 19.6_

  - [ ] 17.6 Escribir test de propiedad para fecha estimada
    - **Property 44: Estimated Delivery Date Management**
    - **Validates: Requirements 19.1, 19.2, 19.5, 19.6**

- [ ] 18. Implementar auditoría completa
  - [x] 18.1 Agregar campos de auditoría en todas las operaciones
    - Asegurar que created_by se establece en todas las creaciones
    - Asegurar que updated_by se establece en todas las actualizaciones
    - Usar auth.uid() de Supabase para obtener usuario actual
    - _Requirements: 21.4, 21.5_

  - [ ] 18.2 Escribir test de propiedad para auditoría
    - **Property 50: Audit Trail**
    - **Validates: Requirements 21.4, 21.5**

- [ ] 19. Checkpoint final - Pruebas de integración
  - Ejecutar todas las pruebas unitarias y de propiedades
  - Verificar flujo completo end-to-end con diferentes escenarios
  - Verificar restricción por plan funciona correctamente
  - Verificar RLS aísla datos entre empresas
  - Verificar notificaciones se envían correctamente
  - Verificar reportes muestran datos correctos
  - Verificar integración con caja y cuentas corrientes
  - Preguntar al usuario si hay ajustes finales necesarios

- [ ] 20. Documentación y refinamiento final
  - [x] 20.1 Agregar comentarios JSDoc a todas las funciones públicas
    - Documentar parámetros, retornos y excepciones
    - Agregar ejemplos de uso donde sea útil
    - _Requirements: Todos_

  - [x] 20.2 Crear componentes auxiliares faltantes
    - RepairStatusBadge para mostrar estado con color
    - RepairTimeline para mostrar historial de cambios
    - Cualquier otro componente de UI necesario
    - _Requirements: 4.1, 4.6_

  - [x] 20.3 Optimizar consultas y rendimiento
    - Revisar índices de base de datos
    - Optimizar queries con muchos joins
    - Implementar paginación en listas largas
    - _Requirements: Todos_

  - [ ] 20.4 Realizar pruebas de usuario final
    - Probar con datos reales de ejemplo
    - Verificar usabilidad de la interfaz
    - Ajustar según feedback
    - _Requirements: Todos_

## Notes

- Todas las tareas de tests son obligatorias para asegurar cobertura completa
- Cada tarea referencia los requisitos específicos que implementa
- Los checkpoints aseguran validación incremental antes de continuar
- Las pruebas de propiedades validan correctness universal
- Las pruebas unitarias validan casos específicos y edge cases
- La implementación sigue un enfoque incremental: base de datos → lógica → UI → integraciones
