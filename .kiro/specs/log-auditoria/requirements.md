# Documento de Requerimientos: Log de Auditoría Centralizado

## Introducción

El sistema de log de auditoría centralizado registra todas las acciones relevantes realizadas en el ERP (ventas, devoluciones, compras, stock, reparaciones, caja, clientes, proveedores, productos y presupuestos). Solo los administradores pueden consultar el log. El objetivo es garantizar trazabilidad completa de las operaciones del negocio.

## Glosario

- **AuditLog**: Registro inmutable que documenta una acción realizada en el sistema.
- **AuditLogger**: Componente responsable de persistir entradas en el log de auditoría.
- **Actor**: Usuario autenticado que ejecuta una acción en el sistema.
- **Módulo**: Área funcional del ERP (ventas, stock, caja, etc.).
- **Acción**: Operación realizada sobre una entidad (crear, modificar, cancelar, etc.).
- **Entidad**: Objeto del dominio sobre el que se realiza la acción (venta, producto, orden de compra, etc.).
- **Snapshot**: Copia del estado de la entidad antes y/o después de la acción.
- **Admin**: Usuario con rol `admin` dentro de una empresa en el sistema.
- **Sistema**: El ERP construido con Next.js 14 y Supabase.

---

## Requerimientos

### Requerimiento 1: Registro de acciones en todos los módulos

**User Story:** Como administrador, quiero que todas las acciones relevantes del ERP queden registradas automáticamente, para poder auditar cualquier operación del negocio.

#### Criterios de Aceptación

1. WHEN una venta es creada, modificada o cancelada, THE AuditLogger SHALL registrar una entrada con módulo `ventas`, la acción correspondiente, el ID de la entidad y el ID del actor.
2. WHEN una devolución es creada o procesada, THE AuditLogger SHALL registrar una entrada con módulo `devoluciones`, la acción correspondiente, el ID de la entidad y el ID del actor.
3. WHEN un movimiento de stock es registrado, THE AuditLogger SHALL registrar una entrada con módulo `stock`, la acción `movimiento`, el ID de la entidad y el ID del actor.
4. WHEN una orden de compra es creada, modificada, recibida o cancelada, THE AuditLogger SHALL registrar una entrada con módulo `compras`, la acción correspondiente, el ID de la entidad y el ID del actor.
5. WHEN un pago de cliente o proveedor es registrado o eliminado, THE AuditLogger SHALL registrar una entrada con módulo `pagos`, la acción correspondiente, el ID de la entidad y el ID del actor.
6. WHEN una reparación es creada, actualizada o cerrada, THE AuditLogger SHALL registrar una entrada con módulo `reparaciones`, la acción correspondiente, el ID de la entidad y el ID del actor.
7. WHEN la caja es abierta o cerrada, THE AuditLogger SHALL registrar una entrada con módulo `caja`, la acción correspondiente, el ID de la entidad y el ID del actor.
8. WHEN un movimiento de caja es registrado, THE AuditLogger SHALL registrar una entrada con módulo `caja`, la acción `movimiento`, el ID de la entidad y el ID del actor.
9. WHEN un producto es creado o modificado, THE AuditLogger SHALL registrar una entrada con módulo `productos`, la acción correspondiente, el ID de la entidad y el ID del actor.
10. WHEN el precio de un producto es modificado, THE AuditLogger SHALL registrar una entrada con módulo `productos`, la acción `cambio_precio`, el ID de la entidad, el precio anterior y el precio nuevo.
11. WHEN un presupuesto es creado, modificado o cancelado, THE AuditLogger SHALL registrar una entrada con módulo `presupuestos`, la acción correspondiente, el ID de la entidad y el ID del actor.
12. WHEN un cliente o proveedor es creado o modificado, THE AuditLogger SHALL registrar una entrada con módulo `clientes` o `proveedores` respectivamente, la acción correspondiente, el ID de la entidad y el ID del actor.

---

### Requerimiento 2: Estructura del registro de auditoría

**User Story:** Como administrador, quiero que cada entrada del log contenga información suficiente para entender qué pasó, quién lo hizo y cuándo, para poder investigar cualquier incidente.

#### Criterios de Aceptación

1. THE AuditLog SHALL contener los campos: `id`, `company_id`, `user_id`, `module`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`.
2. WHEN una entrada es creada en el AuditLog, THE AuditLogger SHALL asignar automáticamente el `created_at` con la marca de tiempo UTC del momento de la operación.
3. WHEN una entrada es creada en el AuditLog, THE AuditLogger SHALL asignar el `company_id` correspondiente al actor que realiza la acción.
4. WHERE el contexto lo permita, THE AuditLogger SHALL incluir en `metadata` un snapshot con los valores relevantes antes y después de la modificación.
5. THE AuditLog SHALL ser inmutable: una vez creada una entrada, THE Sistema SHALL impedir su modificación o eliminación por parte de cualquier usuario.

---

### Requerimiento 3: Acceso exclusivo para administradores

**User Story:** Como administrador, quiero ser el único rol que puede consultar el log de auditoría, para proteger la información sensible de las operaciones del negocio.

#### Criterios de Aceptación

1. WHEN un usuario con rol distinto a `admin` intenta acceder al log de auditoría, THE Sistema SHALL denegar el acceso y retornar un error de autorización.
2. WHEN un usuario con rol `admin` accede al log de auditoría, THE Sistema SHALL retornar únicamente las entradas correspondientes a su `company_id`.
3. THE Sistema SHALL aplicar Row Level Security (RLS) en la tabla `audit_logs` para garantizar el aislamiento por empresa.

---

### Requerimiento 4: Consulta y filtrado del log

**User Story:** Como administrador, quiero poder filtrar y buscar en el log de auditoría, para encontrar rápidamente las acciones relevantes que necesito investigar.

#### Criterios de Aceptación

1. WHEN un admin consulta el log, THE Sistema SHALL soportar filtrado por `module`, `action`, `user_id` y rango de fechas (`date_from`, `date_to`).
2. WHEN un admin consulta el log sin filtros, THE Sistema SHALL retornar las entradas ordenadas por `created_at` descendente.
3. WHEN un admin consulta el log, THE Sistema SHALL retornar los resultados paginados con un máximo de 50 entradas por página.
4. WHEN un admin consulta el log con un filtro de módulo inválido, THE Sistema SHALL retornar una lista vacía sin error.

---

### Requerimiento 5: Resiliencia del registro

**User Story:** Como administrador, quiero que el fallo en el registro de auditoría no interrumpa la operación principal del ERP, para que el negocio no se vea afectado por problemas en el log.

#### Criterios de Aceptación

1. IF el AuditLogger falla al persistir una entrada, THEN THE Sistema SHALL continuar ejecutando la operación principal sin lanzar un error al usuario.
2. IF el AuditLogger falla al persistir una entrada, THEN THE Sistema SHALL registrar el error en la consola del servidor con el detalle de la operación que no pudo ser auditada.
3. WHILE el AuditLogger está procesando una entrada, THE Sistema SHALL ejecutar la operación principal de forma independiente, sin esperar la confirmación del log.

---

### Requerimiento 6: Interfaz de visualización del log

**User Story:** Como administrador, quiero ver el log de auditoría desde el dashboard del ERP, para poder consultar las acciones sin necesidad de acceder directamente a la base de datos.

#### Criterios de Aceptación

1. THE Sistema SHALL proveer una página en `/dashboard/audit-log` accesible únicamente para usuarios con rol `admin`.
2. WHEN un admin accede a `/dashboard/audit-log`, THE Sistema SHALL mostrar una tabla con las columnas: fecha/hora, módulo, acción, entidad, usuario y detalles.
3. WHEN un admin aplica filtros en la página de log, THE Sistema SHALL actualizar la tabla sin recargar la página completa.
4. WHEN un admin hace clic en una entrada del log, THE Sistema SHALL mostrar el `metadata` completo de esa entrada en un panel de detalle.
5. IF no existen entradas para los filtros aplicados, THEN THE Sistema SHALL mostrar un mensaje indicando que no se encontraron resultados.
