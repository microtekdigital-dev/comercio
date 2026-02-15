# Implementation Plan: Cuenta Corriente Detalle Individual

## Overview

Este plan implementa la funcionalidad de cuenta corriente con detalle individual para Clientes y Proveedores. La implementación se divide en tareas incrementales que construyen sobre el código existente, reutilizando la lógica de `accounts-settlement.ts` y el componente `quick-payment-modal.tsx`.

## Tasks

- [x] 1. Implementar funciones de cálculo de saldo y movimientos para clientes
  - [x] 1.1 Agregar función `getCustomerBalance` en `lib/actions/customers.ts`
    - Calcular saldo total de un cliente basado en ventas y pagos
    - Reutilizar función `calculateBalance` de `accounts-settlement.ts`
    - _Requirements: 1.5_
  
  - [x] 1.2 Agregar función `getCustomerAccountMovements` en `lib/actions/customers.ts`
    - Obtener todas las ventas del cliente con sus pagos
    - Transformar ventas y pagos en movimientos de cuenta corriente
    - Calcular saldo acumulado para cada movimiento
    - Ordenar movimientos por fecha descendente
    - _Requirements: 3.5, 5.1, 5.3, 5.5_
  
  - [x] 1.3 Agregar interfaz `AccountMovement` en `lib/actions/customers.ts`
    - Definir tipo TypeScript para movimientos de cuenta
    - Incluir campos: id, type, date, reference, description, debit, credit, balance
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 1.4 Escribir property test para cálculo de saldo de clientes
    - **Property 1: Cálculo correcto de saldo**
    - **Validates: Requirements 1.5**

- [x] 2. Implementar funciones de cálculo de saldo y movimientos para proveedores
  - [x] 2.1 Agregar función `getSupplierBalance` en `lib/actions/suppliers.ts`
    - Calcular saldo total de un proveedor basado en compras y pagos
    - Reutilizar función `calculateBalance` de `accounts-settlement.ts`
    - _Requirements: 2.5_
  
  - [x] 2.2 Agregar función `getSupplierAccountMovements` en `lib/actions/suppliers.ts`
    - Obtener todas las órdenes de compra del proveedor con sus pagos
    - Transformar compras y pagos en movimientos de cuenta corriente
    - Calcular saldo acumulado para cada movimiento
    - Ordenar movimientos por fecha descendente
    - _Requirements: 4.5, 5.2, 5.3, 5.5_
  
  - [x] 2.3 Agregar interfaz `AccountMovement` en `lib/actions/suppliers.ts`
    - Definir tipo TypeScript para movimientos de cuenta
    - Incluir campos: id, type, date, reference, description, debit, credit, balance
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 2.4 Escribir property test para cálculo de saldo de proveedores
    - **Property 1: Cálculo correcto de saldo**
    - **Validates: Requirements 2.5**

- [ ] 3. Checkpoint - Verificar funciones de cálculo
  - Asegurarse de que las funciones de cálculo funcionan correctamente
  - Ejecutar tests si existen
  - Preguntar al usuario si hay dudas o problemas

- [x] 4. Crear componente CustomerAccountModal
  - [x] 4.1 Crear archivo `components/dashboard/customer-account-modal.tsx`
    - Implementar componente modal usando shadcn/ui Dialog
    - Agregar props: customerId, customerName, open, onOpenChange
    - Implementar estado para movements, balance, loading
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [x] 4.2 Implementar carga de datos en CustomerAccountModal
    - Usar useEffect para cargar datos cuando el modal se abre
    - Llamar a `getCustomerAccountMovements` y `getCustomerBalance`
    - Manejar estados de loading y error
    - _Requirements: 3.5, 5.4_
  
  - [x] 4.3 Implementar UI del modal para clientes
    - Mostrar título con nombre del cliente
    - Mostrar saldo actual destacado con formato monetario
    - Mostrar tabla de movimientos con columnas: Fecha, Referencia, Descripción, Debe, Haber, Saldo
    - Aplicar formato monetario a todos los valores
    - Mostrar mensaje cuando no hay movimientos
    - _Requirements: 3.3, 3.4, 5.1, 5.3, 5.4, 9.1_
  
  - [ ]* 4.4 Escribir unit tests para CustomerAccountModal
    - Test: Modal se abre correctamente
    - Test: Modal muestra nombre del cliente
    - Test: Modal muestra saldo
    - Test: Modal muestra mensaje cuando no hay movimientos
    - _Requirements: 3.2, 3.3, 3.4, 5.4_

- [x] 5. Crear componente SupplierAccountModal
  - [x] 5.1 Crear archivo `components/dashboard/supplier-account-modal.tsx`
    - Implementar componente modal usando shadcn/ui Dialog
    - Agregar props: supplierId, supplierName, open, onOpenChange
    - Implementar estado para movements, balance, loading
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [x] 5.2 Implementar carga de datos en SupplierAccountModal
    - Usar useEffect para cargar datos cuando el modal se abre
    - Llamar a `getSupplierAccountMovements` y `getSupplierBalance`
    - Manejar estados de loading y error
    - _Requirements: 4.5, 5.4_
  
  - [x] 5.3 Implementar UI del modal para proveedores
    - Mostrar título con nombre del proveedor
    - Mostrar saldo actual destacado con formato monetario (color rojo si es positivo)
    - Mostrar tabla de movimientos con columnas: Fecha, Referencia, Descripción, Debe, Haber, Saldo
    - Aplicar formato monetario a todos los valores
    - Mostrar mensaje cuando no hay movimientos
    - _Requirements: 4.3, 4.4, 5.2, 5.3, 5.4, 9.1_
  
  - [ ]* 5.4 Escribir unit tests para SupplierAccountModal
    - Test: Modal se abre correctamente
    - Test: Modal muestra nombre del proveedor
    - Test: Modal muestra saldo
    - Test: Modal muestra mensaje cuando no hay movimientos
    - _Requirements: 4.2, 4.3, 4.4, 5.4_

- [ ] 6. Checkpoint - Verificar componentes de modal
  - Asegurarse de que los modales se renderizan correctamente
  - Verificar que los datos se cargan y muestran correctamente
  - Ejecutar tests si existen
  - Preguntar al usuario si hay dudas o problemas

- [x] 7. Modificar página de clientes para agregar columna de saldo y botones
  - [x] 7.1 Agregar imports necesarios en `app/dashboard/customers/page.tsx`
    - Importar CustomerAccountModal
    - Importar QuickPaymentModal (ya existe)
    - Importar getCustomerBalance
    - Importar iconos: DollarSign, FileText, CreditCard
    - _Requirements: 1.1, 3.1, 6.1_
  
  - [x] 7.2 Agregar estados para controlar modales en página de clientes
    - Estado customerBalances: Record<string, number>
    - Estado selectedCustomerForAccount: Customer | null
    - Estado selectedCustomerForPayment: Customer | null
    - Estado accountModalOpen: boolean
    - Estado paymentModalOpen: boolean
    - _Requirements: 3.2, 6.2_
  
  - [x] 7.3 Implementar función para cargar saldos de clientes
    - Crear función loadCustomerBalances que itera sobre todos los clientes
    - Llamar a getCustomerBalance para cada cliente
    - Almacenar saldos en estado customerBalances
    - Llamar función en useEffect cuando customers cambia
    - _Requirements: 1.1, 1.5_
  
  - [x] 7.4 Agregar columna "Saldo" en la vista de clientes
    - Modificar el Card de cada cliente para mostrar el saldo
    - Aplicar formato monetario usando formatCurrency
    - Aplicar color verde para saldos positivos
    - _Requirements: 1.1, 1.2, 1.4, 9.1_
  
  - [x] 7.5 Agregar botones "Cuenta corriente" y "Registrar pago" para cada cliente
    - Agregar botón "Cuenta corriente" con icono FileText
    - Agregar botón "Registrar pago" con icono CreditCard
    - Implementar handlers: handleOpenAccountModal y handleOpenPaymentModal
    - _Requirements: 3.1, 6.1_
  
  - [x] 7.6 Integrar modales en página de clientes
    - Agregar CustomerAccountModal al final del componente
    - Agregar QuickPaymentModal al final del componente (adaptado para clientes)
    - Implementar handlePaymentSuccess para recargar datos después de pago
    - _Requirements: 3.2, 6.2, 6.5_
  
  - [ ]* 7.7 Escribir property test para formato monetario
    - **Property 2: Formato monetario consistente**
    - **Validates: Requirements 1.2, 1.4, 9.1, 9.4, 9.5**

- [x] 8. Modificar página de proveedores para agregar columna de saldo y botones
  - [x] 8.1 Agregar imports necesarios en `app/dashboard/suppliers/page.tsx`
    - Importar SupplierAccountModal
    - Importar QuickPaymentModal (ya existe)
    - Importar getSupplierBalance
    - Importar iconos: DollarSign, FileText, CreditCard
    - _Requirements: 2.1, 4.1, 7.1_
  
  - [x] 8.2 Agregar estados para controlar modales en página de proveedores
    - Estado supplierBalances: Record<string, number>
    - Estado selectedSupplierForAccount: Supplier | null
    - Estado selectedSupplierForPayment: Supplier | null
    - Estado accountModalOpen: boolean
    - Estado paymentModalOpen: boolean
    - _Requirements: 4.2, 7.2_
  
  - [x] 8.3 Implementar función para cargar saldos de proveedores
    - Crear función loadSupplierBalances que itera sobre todos los proveedores
    - Llamar a getSupplierBalance para cada proveedor
    - Almacenar saldos en estado supplierBalances
    - Llamar función en useEffect cuando suppliers cambia
    - _Requirements: 2.1, 2.5_
  
  - [x] 8.4 Agregar columna "Saldo" en la tabla de proveedores
    - Agregar TableHead "Saldo" en el header
    - Agregar TableCell con el saldo para cada proveedor
    - Aplicar formato monetario usando formatCurrency
    - Aplicar color rojo para saldos positivos (deuda)
    - _Requirements: 2.1, 2.2, 2.4, 9.1_
  
  - [x] 8.5 Agregar botones "Cuenta corriente" y "Registrar pago" en columna de acciones
    - Modificar columna de acciones para incluir dropdown con opciones
    - Agregar opción "Cuenta corriente" con icono FileText
    - Agregar opción "Registrar pago" con icono CreditCard
    - Implementar handlers: handleOpenAccountModal y handleOpenPaymentModal
    - _Requirements: 4.1, 7.1_
  
  - [x] 8.6 Integrar modales en página de proveedores
    - Agregar SupplierAccountModal al final del componente
    - Agregar QuickPaymentModal al final del componente (adaptado para proveedores)
    - Implementar handlePaymentSuccess para recargar datos después de pago
    - _Requirements: 4.2, 7.2, 7.5_
  
  - [ ]* 8.7 Escribir property test para ordenamiento de movimientos
    - **Property 3: Movimientos ordenados cronológicamente**
    - **Validates: Requirements 3.5, 4.5**

- [ ] 9. Checkpoint - Verificar integración completa
  - Asegurarse de que todas las páginas funcionan correctamente
  - Verificar que los botones abren los modales correctos
  - Verificar que los saldos se calculan y muestran correctamente
  - Verificar que el registro de pagos actualiza los saldos
  - Ejecutar todos los tests
  - Preguntar al usuario si hay dudas o problemas

- [ ] 10. Adaptar QuickPaymentModal para soportar proveedores
  - [ ] 10.1 Modificar QuickPaymentModal para aceptar tipo de entidad
    - Agregar prop entityType: 'customer' | 'supplier'
    - Adaptar lógica para manejar tanto ventas como órdenes de compra
    - Actualizar textos según el tipo de entidad
    - _Requirements: 6.2, 7.2_
  
  - [ ] 10.2 Crear función addPurchaseOrderPayment en `lib/actions/purchase-orders.ts`
    - Implementar función similar a addSalePayment pero para órdenes de compra
    - Validar que la orden existe y pertenece a la empresa
    - Registrar el pago en la tabla de pagos
    - Actualizar el payment_status de la orden
    - _Requirements: 7.5_
  
  - [ ]* 10.3 Escribir unit tests para addPurchaseOrderPayment
    - Test: Registrar pago completo
    - Test: Registrar pago parcial
    - Test: Validar que no se puede pagar más del total
    - Test: Actualizar payment_status correctamente
    - _Requirements: 7.5_

- [ ] 11. Implementar funciones de formato y utilidades
  - [ ] 11.1 Crear función formatCurrency en `lib/utils/format.ts`
    - Implementar formato con separador de miles
    - Implementar dos decimales fijos
    - Agregar símbolo de moneda
    - Manejar valores negativos con signo
    - Manejar valores null/undefined
    - _Requirements: 9.1, 9.4, 9.5_
  
  - [ ] 11.2 Crear función sortMovementsByDate
    - Implementar ordenamiento por fecha descendente
    - Manejar casos edge (lista vacía, un elemento)
    - _Requirements: 3.5, 4.5_
  
  - [ ] 11.3 Crear función calculateRunningBalance
    - Calcular saldo acumulado para una secuencia de movimientos
    - Iterar desde el movimiento más antiguo al más reciente
    - Actualizar balance en cada movimiento
    - _Requirements: 5.5_
  
  - [ ]* 11.4 Escribir property test para saldo acumulado
    - **Property 5: Saldo acumulado correcto**
    - **Validates: Requirements 5.5**

- [ ] 12. Implementar manejo de errores y casos edge
  - [ ] 12.1 Agregar manejo de errores en funciones de carga de datos
    - Try-catch en getCustomerBalance y getSupplierBalance
    - Try-catch en getCustomerAccountMovements y getSupplierAccountMovements
    - Logging de errores para debugging
    - Valores por defecto seguros (0, [])
    - _Requirements: 10.1, 10.2_
  
  - [ ] 12.2 Agregar validación de datos en funciones de cálculo
    - Validar que total no es null/undefined/NaN
    - Validar que payments es un array
    - Validar que cada payment.amount es un número válido
    - _Requirements: 1.5, 2.5_
  
  - [ ] 12.3 Agregar indicadores de loading en modales
    - Mostrar spinner mientras se cargan datos
    - Deshabilitar interacciones durante carga
    - _Requirements: 3.2, 4.2_
  
  - [ ] 12.4 Agregar mensajes de error amigables
    - Toast de error cuando falla carga de datos
    - Mensaje en modal cuando hay error
    - Opción de reintentar
    - _Requirements: 10.3_
  
  - [ ]* 12.5 Escribir unit tests para manejo de errores
    - Test: Error al cargar saldos
    - Test: Datos inválidos en cálculo
    - Test: Valores null/undefined
    - Test: Arrays vacíos

- [ ] 13. Implementar optimizaciones de rendimiento
  - [ ] 13.1 Optimizar carga de saldos en listas grandes
    - Implementar carga paralela con Promise.all
    - Considerar paginación si hay más de 100 registros
    - Agregar debounce en búsquedas
    - _Requirements: 10.1, 10.2_
  
  - [ ] 13.2 Implementar paginación en modal de movimientos
    - Agregar paginación si hay más de 50 movimientos
    - Usar componente Pagination de shadcn/ui
    - Mantener ordenamiento por fecha
    - _Requirements: 10.5_
  
  - [ ]* 13.3 Escribir property test para paginación
    - **Property 8: Paginación de movimientos extensos**
    - **Validates: Requirements 10.5**

- [ ] 14. Checkpoint final - Verificación completa
  - Ejecutar todos los tests (unit y property)
  - Verificar que todos los requerimientos están implementados
  - Probar flujos completos de usuario
  - Verificar rendimiento con datos de prueba
  - Preguntar al usuario si hay dudas o problemas finales

- [ ] 15. Documentación y limpieza
  - [ ] 15.1 Agregar comentarios JSDoc a funciones públicas
    - Documentar getCustomerBalance y getSupplierBalance
    - Documentar getCustomerAccountMovements y getSupplierAccountMovements
    - Documentar formatCurrency y otras utilidades
  
  - [ ] 15.2 Actualizar tipos TypeScript si es necesario
    - Exportar interfaces AccountMovement
    - Asegurar tipos correctos en todas las funciones
  
  - [ ] 15.3 Revisar y limpiar código
    - Eliminar console.logs de debugging
    - Eliminar código comentado
    - Verificar consistencia de estilo

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requerimientos específicos que implementa
- Los checkpoints permiten validación incremental con el usuario
- Los property tests validan las propiedades de correctness del diseño
- Los unit tests validan ejemplos específicos y casos edge
- La implementación reutiliza código existente para mantener consistencia
