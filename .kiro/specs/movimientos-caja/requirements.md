# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar la funcionalidad de registro de ingresos y retiros de dinero en la sección de caja del sistema ERP. Esta funcionalidad permitirá a los usuarios registrar movimientos de efectivo que no están relacionados con ventas o pagos a proveedores, manteniendo un control preciso del flujo de caja.

## Glossary

- **Sistema**: El sistema ERP de gestión empresarial
- **Caja**: El módulo de gestión de efectivo del sistema
- **Movimiento_Caja**: Registro de ingreso o retiro de dinero en la caja
- **Ingreso**: Entrada de dinero a la caja no relacionada con ventas
- **Retiro**: Salida de dinero de la caja no relacionada con pagos a proveedores
- **Caja_Actual**: Saldo actual de efectivo calculado dinámicamente
- **Usuario**: Persona autenticada que utiliza el sistema
- **Cierre_Caja**: Proceso de cierre de turno que registra el estado final de la caja

## Requirements

### Requirement 1: Registro de Ingresos de Dinero

**User Story:** Como usuario del sistema, quiero registrar ingresos de dinero en la caja, para que pueda mantener un control preciso de todo el efectivo que entra.

#### Acceptance Criteria

1. WHEN un usuario accede a la página de caja, THE Sistema SHALL mostrar un botón claramente identificado para registrar ingresos
2. WHEN un usuario hace clic en el botón de ingreso, THE Sistema SHALL mostrar un formulario modal con campos para monto, motivo y fecha/hora
3. WHEN un usuario ingresa un monto válido (mayor a cero), THE Sistema SHALL aceptar el valor
4. WHEN un usuario intenta ingresar un monto inválido (cero, negativo o no numérico), THE Sistema SHALL rechazar el valor y mostrar un mensaje de error
5. WHEN un usuario completa el formulario de ingreso, THE Sistema SHALL registrar el movimiento con el ID del usuario autenticado y la fecha/hora actual
6. WHEN se registra un ingreso exitosamente, THE Sistema SHALL actualizar el Caja_Actual sumando el monto ingresado

### Requirement 2: Registro de Retiros de Dinero

**User Story:** Como usuario del sistema, quiero registrar retiros de dinero de la caja, para que pueda mantener un control preciso de todo el efectivo que sale.

#### Acceptance Criteria

1. WHEN un usuario accede a la página de caja, THE Sistema SHALL mostrar un botón claramente identificado para registrar retiros
2. WHEN un usuario hace clic en el botón de retiro, THE Sistema SHALL mostrar un formulario modal con campos para monto, motivo y fecha/hora
3. WHEN un usuario ingresa un monto válido (mayor a cero), THE Sistema SHALL aceptar el valor
4. WHEN un usuario intenta ingresar un monto inválido (cero, negativo o no numérico), THE Sistema SHALL rechazar el valor y mostrar un mensaje de error
5. WHEN un usuario completa el formulario de retiro, THE Sistema SHALL registrar el movimiento con el ID del usuario autenticado y la fecha/hora actual
6. WHEN se registra un retiro exitosamente, THE Sistema SHALL actualizar el Caja_Actual restando el monto retirado

### Requirement 3: Cálculo Dinámico de Caja Actual

**User Story:** Como usuario del sistema, quiero que el saldo de caja actual se actualice automáticamente con cada movimiento, para que siempre vea el estado real del efectivo disponible.

#### Acceptance Criteria

1. WHEN se calcula el Caja_Actual, THE Sistema SHALL sumar el monto inicial de apertura de caja
2. WHEN se calcula el Caja_Actual, THE Sistema SHALL sumar todas las ventas en efectivo del turno actual
3. WHEN se calcula el Caja_Actual, THE Sistema SHALL restar todos los pagos a proveedores en efectivo del turno actual
4. WHEN se calcula el Caja_Actual, THE Sistema SHALL sumar todos los ingresos registrados del turno actual
5. WHEN se calcula el Caja_Actual, THE Sistema SHALL restar todos los retiros registrados del turno actual
6. WHEN se registra un nuevo movimiento, THE Sistema SHALL recalcular y mostrar el Caja_Actual actualizado inmediatamente

### Requirement 4: Persistencia de Movimientos

**User Story:** Como usuario del sistema, quiero que todos los movimientos de caja queden registrados permanentemente, para que pueda auditar y revisar el historial completo.

#### Acceptance Criteria

1. WHEN se registra un Movimiento_Caja, THE Sistema SHALL almacenar el tipo (ingreso o retiro)
2. WHEN se registra un Movimiento_Caja, THE Sistema SHALL almacenar el monto exacto
3. WHEN se registra un Movimiento_Caja, THE Sistema SHALL almacenar el motivo o descripción proporcionada
4. WHEN se registra un Movimiento_Caja, THE Sistema SHALL almacenar la fecha y hora exacta del registro
5. WHEN se registra un Movimiento_Caja, THE Sistema SHALL almacenar el ID del usuario que lo registró
6. WHEN se registra un Movimiento_Caja, THE Sistema SHALL asociarlo con la apertura de caja activa actual

### Requirement 5: Visualización en Cierre de Caja

**User Story:** Como usuario del sistema, quiero ver todos los movimientos de caja en el reporte de cierre, para que pueda verificar y justificar el saldo final.

#### Acceptance Criteria

1. WHEN un usuario visualiza un cierre de caja, THE Sistema SHALL mostrar una sección de ingresos con todos los movimientos de tipo ingreso
2. WHEN un usuario visualiza un cierre de caja, THE Sistema SHALL mostrar una sección de retiros con todos los movimientos de tipo retiro
3. WHEN se muestra un movimiento en el cierre, THE Sistema SHALL incluir el monto, motivo, fecha/hora y usuario que lo registró
4. WHEN se calcula el total de ingresos en el cierre, THE Sistema SHALL sumar todos los montos de movimientos tipo ingreso
5. WHEN se calcula el total de retiros en el cierre, THE Sistema SHALL sumar todos los montos de movimientos tipo retiro
6. WHEN se calcula el saldo final en el cierre, THE Sistema SHALL incluir los ingresos y retiros en la fórmula de cálculo

### Requirement 6: Validación de Permisos

**User Story:** Como administrador del sistema, quiero que solo usuarios autenticados y autorizados puedan registrar movimientos de caja, para mantener la seguridad y trazabilidad.

#### Acceptance Criteria

1. WHEN un usuario no autenticado intenta acceder a la funcionalidad de movimientos, THE Sistema SHALL denegar el acceso
2. WHEN un usuario autenticado registra un movimiento, THE Sistema SHALL verificar que pertenece a una empresa activa
3. WHEN se registra un movimiento, THE Sistema SHALL validar que existe una apertura de caja activa
4. IF no existe una apertura de caja activa, THEN THE Sistema SHALL mostrar un mensaje de error y prevenir el registro
5. WHEN se consultan movimientos, THE Sistema SHALL filtrar solo los movimientos de la empresa del usuario autenticado
6. WHEN se consultan movimientos, THE Sistema SHALL aplicar las políticas RLS (Row Level Security) de la base de datos
