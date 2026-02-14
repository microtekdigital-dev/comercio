# Requirements Document

## Introduction

Este documento define los requisitos para mejorar el manejo de errores en la creación de órdenes de compra. Actualmente, cuando falla la creación de una orden de compra en el servidor (Next.js), el usuario recibe un mensaje genérico "Error al crear la orden de compra" sin detalles específicos sobre la causa del error. Esto dificulta la depuración y la experiencia del usuario.

El sistema debe proporcionar mensajes de error específicos, accionables y en español que ayuden al usuario a entender qué salió mal y cómo solucionarlo. Además, debe mantener información detallada en los logs del servidor para facilitar la depuración.

## Glossary

- **Server_Action**: Función del servidor en Next.js que maneja operaciones del lado del servidor
- **Error_Handler**: Componente del sistema que procesa y transforma errores técnicos
- **Error_Mapper**: Módulo que mapea códigos de error técnicos a mensajes amigables
- **Toast_Notification**: Notificación visual temporal que muestra mensajes al usuario
- **RLS_Error**: Error de Row Level Security de PostgreSQL/Supabase
- **Constraint_Error**: Error de violación de restricciones de base de datos
- **Validation_Error**: Error de validación de datos de entrada
- **Plan_Limit_Error**: Error cuando se exceden los límites del plan de suscripción
- **Error_Code**: Código técnico de error de PostgreSQL/Supabase
- **User_Message**: Mensaje amigable mostrado al usuario final
- **Server_Log**: Registro detallado del error en el servidor
- **Structured_Error_Response**: Objeto de respuesta con estructura consistente que incluye tipo de error, mensaje y detalles

## Requirements

### Requirement 1: Detección y Clasificación de Errores

**User Story:** Como desarrollador, quiero que el sistema detecte y clasifique diferentes tipos de errores, para que pueda manejarlos de manera específica.

#### Acceptance Criteria

1. WHEN a database error occurs, THE Error_Handler SHALL identify the error type based on PostgreSQL error codes
2. THE Error_Handler SHALL classify errors into categories: RLS_Error, Constraint_Error, Validation_Error, Plan_Limit_Error, and Unknown_Error
3. WHEN an RLS_Error is detected (error code 42501), THE Error_Handler SHALL classify it as permission error
4. WHEN a Constraint_Error is detected (error codes 23505, 23503, 23502), THE Error_Handler SHALL classify it as data integrity error
5. WHEN a Validation_Error is detected, THE Error_Handler SHALL classify it as input validation error
6. THE Error_Handler SHALL preserve the original error object for logging purposes

### Requirement 2: Mapeo de Errores a Mensajes Amigables

**User Story:** Como usuario, quiero recibir mensajes de error claros en español, para que pueda entender qué salió mal y cómo solucionarlo.

#### Acceptance Criteria

1. WHEN an RLS_Error occurs, THE Error_Mapper SHALL return "No tienes permisos para crear órdenes de compra. Contacta al administrador de tu empresa."
2. WHEN a unique constraint violation occurs (23505), THE Error_Mapper SHALL return "Ya existe una orden de compra con este número. El sistema generará un nuevo número automáticamente."
3. WHEN a foreign key violation occurs (23503), THE Error_Mapper SHALL return "El proveedor o producto seleccionado no existe. Por favor, verifica los datos."
4. WHEN a not-null constraint violation occurs (23502), THE Error_Mapper SHALL return "Faltan campos obligatorios. Por favor, completa todos los campos requeridos."
5. WHEN a Plan_Limit_Error occurs, THE Error_Mapper SHALL return "Has alcanzado el límite de órdenes de compra de tu plan. Actualiza tu suscripción para continuar."
6. WHEN an unknown error occurs, THE Error_Mapper SHALL return "Error al crear la orden de compra. Por favor, intenta nuevamente."
7. THE Error_Mapper SHALL return messages in Spanish language
8. THE Error_Mapper SHALL provide actionable guidance in error messages

### Requirement 3: Respuestas Estructuradas de Error

**User Story:** Como desarrollador, quiero que las server actions retornen respuestas de error estructuradas, para que pueda manejarlas consistentemente en el cliente.

#### Acceptance Criteria

1. THE Server_Action SHALL return a Structured_Error_Response object for all errors
2. THE Structured_Error_Response SHALL include a success boolean field set to false
3. THE Structured_Error_Response SHALL include an error string field with the User_Message
4. THE Structured_Error_Response SHALL include an errorType string field with the error classification
5. WHEN detailed error information is available, THE Structured_Error_Response SHALL include an errorDetails optional field
6. THE Server_Action SHALL return consistent response structure for both success and error cases

### Requirement 4: Logging Detallado de Errores

**User Story:** Como desarrollador, quiero que los errores se registren con información detallada en el servidor, para que pueda depurar problemas efectivamente.

#### Acceptance Criteria

1. WHEN an error occurs, THE Error_Handler SHALL log the complete error object to Server_Log
2. THE Server_Log SHALL include the error type classification
3. THE Server_Log SHALL include the original error message and stack trace
4. THE Server_Log SHALL include the PostgreSQL error code when available
5. THE Server_Log SHALL include contextual information (user ID, company ID, timestamp)
6. THE Error_Handler SHALL use console.error for error logging
7. THE Server_Log SHALL preserve sensitive information only in server logs, not in client responses

### Requirement 5: Visualización de Errores en UI

**User Story:** Como usuario, quiero ver mensajes de error en notificaciones toast, para que pueda entender rápidamente qué salió mal sin interrumpir mi flujo de trabajo.

#### Acceptance Criteria

1. WHEN a Server_Action returns an error response, THE UI SHALL display a Toast_Notification
2. THE Toast_Notification SHALL show the User_Message from the error response
3. THE Toast_Notification SHALL use error styling (red color scheme)
4. THE Toast_Notification SHALL be automatically dismissed after 5 seconds
5. THE Toast_Notification SHALL allow manual dismissal by the user
6. THE UI SHALL display only the User_Message, not technical error details

### Requirement 6: Patrón Reutilizable de Manejo de Errores

**User Story:** Como desarrollador, quiero un patrón consistente de manejo de errores, para que pueda aplicarlo fácilmente a otras server actions.

#### Acceptance Criteria

1. THE Error_Handler SHALL be implemented as a reusable utility function
2. THE Error_Handler SHALL accept any error object as input
3. THE Error_Handler SHALL return a Structured_Error_Response
4. THE Error_Handler SHALL be framework-agnostic and work with any server action
5. THE Error_Handler SHALL be documented with usage examples
6. THE Error_Handler SHALL handle both Supabase errors and generic JavaScript errors

### Requirement 7: Manejo de Errores Específicos de Supabase

**User Story:** Como desarrollador, quiero que el sistema maneje específicamente errores de Supabase, para que pueda extraer información relevante de sus estructuras de error.

#### Acceptance Criteria

1. WHEN a Supabase error occurs, THE Error_Handler SHALL extract the error code from error.code property
2. WHEN a Supabase error occurs, THE Error_Handler SHALL extract the error message from error.message property
3. WHEN a Supabase error contains details, THE Error_Handler SHALL extract them from error.details property
4. WHEN a Supabase error contains hint, THE Error_Handler SHALL include it in Server_Log
5. THE Error_Handler SHALL handle PostgrestError type from Supabase client

### Requirement 8: Preservación de Información de Contexto

**User Story:** Como desarrollador, quiero que los errores incluyan información de contexto, para que pueda reproducir y depurar problemas más fácilmente.

#### Acceptance Criteria

1. WHEN logging an error, THE Error_Handler SHALL include the operation name (e.g., "createPurchaseOrder")
2. WHEN logging an error, THE Error_Handler SHALL include relevant entity IDs when available
3. WHEN logging an error, THE Error_Handler SHALL include timestamp information
4. THE Error_Handler SHALL sanitize sensitive information before logging
5. THE Server_Log SHALL include enough context to reproduce the error scenario
