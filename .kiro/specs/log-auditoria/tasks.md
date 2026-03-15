# Plan de Implementación: Log de Auditoría Centralizado

## Visión General

Implementación incremental del sistema de auditoría: primero la infraestructura de base de datos y el logger central, luego la integración en cada módulo, y finalmente la interfaz de visualización.

## Tareas

- [x] 1. Crear la tabla `audit_logs` en Supabase
  - Crear el script SQL `scripts/240_create_audit_logs.sql` con la definición de la tabla, índices y políticas RLS
  - Incluir política de solo lectura para admins, política de inserción para usuarios autenticados, y sin UPDATE/DELETE
  - _Requerimientos: 2.1, 2.5, 3.3_

- [x] 2. Implementar el módulo central `lib/actions/audit-log.ts`
  - [x] 2.1 Implementar la función `logAuditEvent(input: AuditEventInput): Promise<void>`
    - Obtener el perfil del usuario actual (user_id y company_id) usando `createClient`
    - Insertar en `audit_logs` con todos los campos requeridos
    - Capturar cualquier excepción con `try/catch` y hacer `console.error` sin relanzar
    - _Requerimientos: 2.1, 2.2, 2.3, 5.1, 5.2_

  - [ ]* 2.2 Escribir test de propiedad: resiliencia del logger
    - **Propiedad 3: Resiliencia del logger**
    - Mockear Supabase para que falle en INSERT, generar inputs aleatorios de `AuditEventInput`, verificar que `logAuditEvent` nunca lanza excepción
    - **Valida: Requerimientos 5.1, 5.2**

  - [x] 2.3 Implementar la función `getAuditLogs(filters: AuditLogFilters): Promise<AuditLogEntry[]>`
    - Verificar que el usuario actual tiene rol `admin`, lanzar error de autorización si no
    - Construir query con filtros opcionales (module, action, user_id, dateFrom, dateTo)
    - Aplicar paginación (máximo 50 por página), ordenar por `created_at DESC`
    - Hacer join con `profiles` para obtener el nombre del usuario
    - _Requerimientos: 3.1, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 2.4 Escribir tests de propiedad: filtrado, orden y paginación
    - **Propiedad 5: Filtrado correcto por módulo** — generar entradas con módulos aleatorios, verificar que el filtro retorna solo el módulo correcto
    - **Propiedad 6: Orden descendente por fecha** — generar entradas con fechas aleatorias, verificar orden
    - **Propiedad 7: Paginación correcta** — generar N > 50 entradas, verificar que el resultado tiene ≤ 50
    - **Valida: Requerimientos 4.1, 4.2, 4.3**

- [x] 3. Checkpoint — Verificar que todos los tests del módulo central pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [x] 4. Integrar `logAuditEvent` en los módulos del ERP
  - [x] 4.1 Integrar en `lib/actions/sales.ts`
    - Agregar `void logAuditEvent(...)` en `createSale`, `updateSale` y `cancelSale`
    - Incluir en metadata: `total`, `customer_id`, `items_count`, y `previous_status` en cancelaciones
    - _Requerimientos: 1.1_

  - [x] 4.2 Integrar en `lib/actions/returns.ts`
    - Agregar `void logAuditEvent(...)` en `createReturn` y `processReturn`
    - _Requerimientos: 1.2_

  - [x] 4.3 Integrar en `lib/actions/stock-movements.ts`
    - Agregar `void logAuditEvent(...)` en la función de creación de movimientos
    - Incluir en metadata: `quantity`, `type`, `product_id`
    - _Requerimientos: 1.3_

  - [x] 4.4 Integrar en `lib/actions/purchase-orders.ts`
    - Agregar `void logAuditEvent(...)` en crear, modificar, recibir y cancelar órdenes de compra
    - _Requerimientos: 1.4_

  - [x] 4.5 Integrar en acciones de pagos (ventas y proveedores)
    - Agregar `void logAuditEvent(...)` en las funciones de registro y eliminación de pagos en `lib/actions/sales.ts` y `lib/actions/suppliers.ts`
    - Incluir en metadata: `amount`, `method`, `entity_type`
    - _Requerimientos: 1.5_

  - [x] 4.6 Integrar en `lib/actions/repair-orders.ts`
    - Agregar `void logAuditEvent(...)` en crear, actualizar y cerrar reparaciones
    - _Requerimientos: 1.6_

  - [x] 4.7 Integrar en `lib/actions/cash-register.ts`
    - Agregar `void logAuditEvent(...)` en apertura y cierre de caja
    - Incluir en metadata: `initial_amount`, `shift` en apertura; `total_sales`, `total_cash` en cierre
    - _Requerimientos: 1.7_

  - [x] 4.8 Integrar movimientos de caja en `lib/actions/cash-register.ts`
    - Agregar `void logAuditEvent(...)` en la creación de movimientos de caja
    - _Requerimientos: 1.8_

  - [x] 4.9 Integrar en `lib/actions/products.ts`
    - Agregar `void logAuditEvent(...)` en crear y modificar productos
    - Agregar `void logAuditEvent(...)` con acción `cambio_precio` en `lib/actions/price-changes.ts`, incluyendo `previous_price` y `new_price` en metadata
    - _Requerimientos: 1.9, 1.10_

  - [x] 4.10 Integrar en `lib/actions/quotes.ts`
    - Agregar `void logAuditEvent(...)` en crear, modificar y cancelar presupuestos
    - _Requerimientos: 1.11_

  - [x] 4.11 Integrar en `lib/actions/customers.ts` y `lib/actions/suppliers.ts`
    - Agregar `void logAuditEvent(...)` en crear y modificar clientes y proveedores
    - _Requerimientos: 1.12_

  - [ ]* 4.12 Escribir test de propiedad: completitud de campos obligatorios
    - **Propiedad 4: Completitud de campos obligatorios**
    - Generar `AuditEventInput` aleatorios válidos, llamar a `logAuditEvent`, verificar que la entrada insertada tiene todos los campos requeridos no nulos
    - **Valida: Requerimientos 2.1, 2.2, 2.3**

- [x] 5. Checkpoint — Verificar integración en todos los módulos
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

- [x] 6. Implementar la página de visualización del log
  - [x] 6.1 Crear `app/dashboard/audit-log/page.tsx`
    - Server Component que verifica rol admin (redirigir a `/dashboard` si no es admin)
    - Obtener datos iniciales con `getAuditLogs()` y pasarlos al componente cliente
    - _Requerimientos: 3.1, 6.1_

  - [x] 6.2 Crear `components/dashboard/audit-log-table.tsx`
    - Tabla con columnas: fecha/hora, módulo, acción, entidad, usuario, detalles
    - Filtros controlados: módulo (select), acción (select), usuario (input), rango de fechas
    - Paginación con botones anterior/siguiente
    - Al hacer clic en una fila, mostrar un Sheet/Dialog con el `metadata` completo formateado como JSON
    - Mensaje de estado vacío cuando no hay resultados
    - _Requerimientos: 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.3 Escribir test de propiedad: panel de detalle muestra metadata completo
    - **Propiedad (display):** para cualquier entrada del log con metadata, el panel de detalle debe renderizar todos los campos del metadata
    - **Valida: Requerimiento 6.4**

- [x] 7. Agregar enlace al log de auditoría en el sidebar del dashboard
  - Agregar ítem de navegación "Log de Auditoría" en el sidebar, visible solo para usuarios con rol `admin`
  - _Requerimientos: 6.1_

- [ ] 8. Checkpoint final — Verificar que todos los tests pasan
  - Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requerimientos específicos para trazabilidad
- El patrón `void logAuditEvent(...)` garantiza fire-and-forget en todas las integraciones
- Los tests de propiedad usan **fast-check** con mínimo 100 iteraciones por propiedad
