# Requirements Document: Apertura de Caja

## Introduction

Este documento especifica los requerimientos para implementar la funcionalidad de "Apertura de Caja" en el sistema ERP. La apertura de caja es un proceso crítico que debe realizarse antes de cualquier cierre de caja, permitiendo registrar el monto inicial de efectivo y establecer un punto de referencia para calcular diferencias al final del turno.

El sistema ya cuenta con funcionalidad de "Cierre de Caja" completamente implementada. Esta nueva funcionalidad se integrará con el sistema existente para proporcionar un flujo completo de gestión de caja.

## Glossary

- **System**: El sistema ERP completo
- **Cash_Register_Module**: Módulo de gestión de caja registradora
- **Opening_Record**: Registro de apertura de caja en la base de datos
- **Closure_Record**: Registro de cierre de caja existente en la base de datos
- **User**: Usuario del sistema que opera la caja
- **Initial_Cash_Amount**: Monto inicial de efectivo con el que se abre la caja
- **Shift**: Turno de trabajo (mañana, tarde, noche)
- **Expected_Cash**: Efectivo esperado calculado a partir de transacciones
- **Counted_Cash**: Efectivo físicamente contado al cerrar la caja
- **Cash_Difference**: Diferencia entre efectivo contado y esperado

## Requirements

### Requirement 1: Crear Registro de Apertura de Caja

**User Story:** Como usuario del sistema, quiero registrar la apertura de caja con un monto inicial de efectivo, para establecer un punto de referencia al inicio del turno.

#### Acceptance Criteria

1. WHEN un usuario crea una apertura de caja, THE System SHALL almacenar el registro en la tabla cash_register_openings con todos los campos requeridos
2. WHEN se crea una apertura, THE System SHALL registrar automáticamente la fecha y hora de creación
3. WHEN se crea una apertura, THE System SHALL asociar el registro con el company_id del usuario autenticado
4. WHEN se crea una apertura, THE System SHALL registrar el ID y nombre del usuario que realiza la apertura
5. THE System SHALL permitir al usuario especificar el monto inicial de efectivo como número decimal positivo
6. THE System SHALL permitir al usuario especificar el turno (mañana, tarde, noche)
7. WHERE el usuario proporciona notas adicionales, THE System SHALL almacenar dichas notas en el registro

### Requirement 2: Validar Apertura Antes de Cierre

**User Story:** Como usuario del sistema, quiero que el sistema valide la existencia de una apertura antes de permitir un cierre de caja, para garantizar la integridad de los cálculos.

#### Acceptance Criteria

1. WHEN un usuario intenta crear un cierre de caja, THE System SHALL verificar si existe una apertura para la misma fecha y turno
2. IF no existe apertura para la fecha y turno especificados, THEN THE System SHALL mostrar una advertencia al usuario
3. WHEN no existe apertura, THE System SHALL informar que no se puede calcular la diferencia de efectivo
4. THE System SHALL permitir al usuario decidir si continuar con el cierre sin apertura o cancelar la operación
5. WHEN el usuario decide continuar sin apertura, THE System SHALL crear el cierre pero marcar que no hay cálculo de diferencia válido

### Requirement 3: Calcular Diferencia de Efectivo con Apertura

**User Story:** Como usuario del sistema, quiero que el sistema calcule correctamente la diferencia de efectivo considerando el monto inicial de apertura, para tener un control preciso de la caja.

#### Acceptance Criteria

1. WHEN existe una apertura para la fecha y turno del cierre, THE System SHALL incluir el monto inicial en el cálculo de diferencia
2. THE System SHALL calcular la diferencia como: Counted_Cash - (Expected_Cash + Initial_Cash_Amount)
3. WHEN no existe apertura, THE System SHALL omitir el cálculo de diferencia o marcarlo como no disponible
4. THE System SHALL mostrar claramente al usuario si el cálculo incluye o no el monto de apertura

### Requirement 4: Listar Aperturas de Caja

**User Story:** Como usuario del sistema, quiero ver un listado de todas las aperturas de caja realizadas, para tener un historial completo de operaciones.

#### Acceptance Criteria

1. THE System SHALL mostrar una lista de todas las aperturas de caja de la empresa del usuario
2. WHEN se muestra la lista, THE System SHALL incluir: fecha de apertura, turno, usuario que abrió, monto inicial
3. THE System SHALL ordenar las aperturas por fecha de creación descendente (más recientes primero)
4. THE System SHALL aplicar paginación cuando existan más de 50 registros
5. THE System SHALL permitir filtrar aperturas por rango de fechas
6. THE System SHALL permitir filtrar aperturas por turno

### Requirement 5: Seguridad y Control de Acceso

**User Story:** Como administrador del sistema, quiero que las aperturas de caja estén protegidas por Row Level Security, para garantizar que cada empresa solo vea sus propios registros.

#### Acceptance Criteria

1. THE System SHALL habilitar Row Level Security (RLS) en la tabla cash_register_openings
2. THE System SHALL permitir a los usuarios ver únicamente las aperturas de su propia empresa
3. THE System SHALL permitir a los usuarios crear aperturas únicamente para su propia empresa
4. THE System SHALL prevenir que usuarios de una empresa accedan a aperturas de otras empresas
5. THE System SHALL registrar automáticamente el company_id del usuario autenticado al crear una apertura

### Requirement 6: Integridad de Datos

**User Story:** Como desarrollador del sistema, quiero que la tabla de aperturas tenga índices y restricciones apropiadas, para garantizar rendimiento y consistencia de datos.

#### Acceptance Criteria

1. THE System SHALL crear un índice en el campo company_id para optimizar consultas por empresa
2. THE System SHALL crear un índice compuesto en (company_id, opening_date, shift) para optimizar búsquedas de aperturas
3. THE System SHALL establecer una clave foránea entre cash_register_openings.company_id y companies.id
4. THE System SHALL establecer valores NOT NULL para campos críticos: company_id, opening_date, opened_by, initial_cash_amount, shift
5. THE System SHALL usar tipo DECIMAL(10,2) para el campo initial_cash_amount para precisión monetaria
6. THE System SHALL usar tipo TIMESTAMP WITH TIME ZONE para campos de fecha y hora

### Requirement 7: Interfaz de Usuario para Apertura

**User Story:** Como usuario del sistema, quiero una interfaz clara y sencilla para registrar la apertura de caja, para poder realizar esta operación rápidamente al inicio del turno.

#### Acceptance Criteria

1. THE System SHALL proporcionar un formulario con campos para: fecha de apertura, turno, monto inicial, notas
2. WHEN el usuario accede al formulario, THE System SHALL pre-llenar la fecha con la fecha actual
3. THE System SHALL validar que el monto inicial sea un número positivo mayor a cero
4. THE System SHALL proporcionar un selector para el turno con opciones: Mañana, Tarde, Noche
5. WHEN el usuario envía el formulario, THE System SHALL mostrar un mensaje de confirmación
6. IF ocurre un error al crear la apertura, THEN THE System SHALL mostrar un mensaje de error descriptivo
7. WHEN la apertura se crea exitosamente, THE System SHALL redirigir al usuario a la lista de aperturas

### Requirement 8: Integración con Sistema Existente

**User Story:** Como desarrollador del sistema, quiero que la nueva funcionalidad se integre correctamente con el sistema de cierre de caja existente, para mantener la coherencia del módulo.

#### Acceptance Criteria

1. THE System SHALL modificar la función createCashRegisterClosure para validar existencia de apertura
2. THE System SHALL modificar la interfaz de cierre para mostrar advertencias cuando no hay apertura
3. THE System SHALL mantener la compatibilidad con cierres existentes que no tienen apertura asociada
4. THE System SHALL actualizar la página de listado para mostrar tanto aperturas como cierres
5. THE System SHALL mantener la estructura de archivos existente: lib/actions/cash-register.ts para lógica de negocio
