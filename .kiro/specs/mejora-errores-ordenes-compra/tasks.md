# Implementation Plan: Mejora de Manejo de Errores en Órdenes de Compra

## Overview

Este plan implementa un sistema robusto de manejo de errores para server actions de Next.js, comenzando con la creación de órdenes de compra. La implementación se enfoca en crear utilidades reutilizables que puedan aplicarse a otras server actions en el futuro.

El enfoque es incremental: primero creamos las utilidades base, luego las integramos en la server action de órdenes de compra, y finalmente agregamos tests para validar el comportamiento.

## Tasks

- [x] 1. Crear utilidades base de manejo de errores
  - [x] 1.1 Crear tipos TypeScript para manejo de errores
    - Crear archivo `lib/utils/error-types.ts`
    - Definir tipos: ErrorType, ErrorContext, StructuredErrorResponse, ServerActionResponse
    - Definir interfaces para PostgrestError de Supabase
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 1.2 Implementar Error Mapper
    - Crear archivo `lib/utils/error-mapper.ts`
    - Implementar función `getErrorMessage(errorType, errorCode?)`
    - Definir mapeo de todos los tipos de error a mensajes en español
    - Incluir mensajes para: RLS (42501), unique constraint (23505), foreign key (23503), not-null (23502), plan limits, validation, unknown
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [ ]* 1.3 Escribir unit tests para Error Mapper
    - Crear archivo `__tests__/lib/utils/error-mapper.unit.test.ts`
    - Test: RLS error retorna mensaje de permisos en español
    - Test: Unique constraint retorna mensaje de duplicado
    - Test: Foreign key retorna mensaje de referencia inválida
    - Test: Not-null retorna mensaje de campos requeridos
    - Test: Plan limit retorna mensaje de límite de plan
    - Test: Unknown error retorna mensaje genérico
    - Test: Todos los mensajes están en español
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 2. Implementar Error Handler principal
  - [x] 2.1 Crear función handleServerError
    - Crear archivo `lib/utils/error-handler.ts`
    - Implementar función `handleServerError(error: unknown, context: ErrorContext)`
    - Implementar clasificación de errores basada en códigos PostgreSQL
    - Implementar extracción de información de errores de Supabase
    - Implementar logging detallado con console.error
    - Implementar construcción de respuesta estructurada
    - Manejar casos edge: null, undefined, string, objetos sin propiedades
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.2, 6.6, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3_
  
  - [x] 2.2 Implementar sanitización de datos sensibles
    - Agregar función `sanitizeErrorForClient(error)` en error-handler.ts
    - Remover stack traces de respuestas al cliente
    - Remover IDs internos y detalles de base de datos
    - Preservar información sensible solo en logs del servidor
    - _Requirements: 4.7, 8.4_
  
  - [ ]* 2.3 Escribir unit tests para Error Handler
    - Crear archivo `__tests__/lib/utils/error-handler.unit.test.ts`
    - Test: Null error retorna respuesta estructurada con UNKNOWN_ERROR
    - Test: Undefined error retorna respuesta estructurada
    - Test: String error se procesa correctamente
    - Test: Error sin código se clasifica como UNKNOWN_ERROR
    - Test: console.error es llamado con información completa
    - Test: Contexto se incluye en logs
    - Test: Stack traces no aparecen en respuesta al cliente
    - _Requirements: 1.6, 4.1, 4.7, 6.2, 8.4_
  
  - [ ]* 2.4 Escribir property test para clasificación de errores
    - Crear archivo `__tests__/lib/utils/error-handler.property.test.ts`
    - Configurar fast-check con 100 iteraciones mínimo
    - **Property 1: Error Code Classification**
    - Generar códigos de error PostgreSQL aleatorios
    - Verificar clasificación correcta según código
    - Tag: `Feature: mejora-errores-ordenes-compra, Property 1: Error Code Classification`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 2.5 Escribir property test para preservación de error original
    - En `__tests__/lib/utils/error-handler.property.test.ts`
    - **Property 2: Original Error Preservation**
    - Generar objetos de error aleatorios con propiedades variadas
    - Verificar que todas las propiedades aparecen en logs
    - Tag: `Feature: mejora-errores-ordenes-compra, Property 2: Original Error Preservation`
    - _Requirements: 1.6_
  
  - [ ]* 2.6 Escribir property test para mensajes en español
    - En `__tests__/lib/utils/error-handler.property.test.ts`
    - **Property 3: Spanish Language Messages**
    - Generar tipos de error aleatorios
    - Verificar que mensajes contienen español, no términos en inglés
    - Tag: `Feature: mejora-errores-ordenes-compra, Property 3: Spanish Language Messages`
    - _Requirements: 2.7_
  
  - [ ]* 2.7 Escribir property test para estructura de respuesta
    - En `__tests__/lib/utils/error-handler.property.test.ts`
    - **Property 4: Structured Error Response Format**
    - Generar errores aleatorios
    - Verificar estructura: {success: false, error: string, errorType: ErrorType, errorDetails?: object}
    - Tag: `Feature: mejora-errores-ordenes-compra, Property 4: Structured Error Response Format`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 2.8 Escribir property test para inclusión condicional de detalles
    - En `__tests__/lib/utils/error-handler.property.test.ts`
    - **Property 5: Conditional Error Details Inclusion**
    - Generar errores con y sin información PostgreSQL
    - Verificar errorDetails presente solo cuando apropiado
    - Tag: `Feature: mejora-errores-ordenes-compra, Property 5: Conditional Error Details Inclusion`
    - _Requirements: 3.5_
  
  - [ ]* 2.9 Escribir property test para manejo de múltiples tipos de error
    - En `__tests__/lib/utils/error-handler.property.test.ts`
    - **Property 13: Handles Multiple Error Types**
    - Generar varios tipos: Error, object, string, null, undefined
    - Verificar que handler procesa todos sin lanzar excepciones
    - Tag: `Feature: mejora-errores-ordenes-compra, Property 13: Handles Multiple Error Types`
    - _Requirements: 6.2, 6.6_
  
  - [ ]* 2.10 Escribir property test para extracción de campos Supabase
    - En `__tests__/lib/utils/error-handler.property.test.ts`
    - **Property 14: Supabase Error Field Extraction**
    - Generar PostgrestError con combinaciones de campos
    - Verificar extracción correcta de code, message, details, hint
    - Tag: `Feature: mejora-errores-ordenes-compra, Property 14: Supabase Error Field Extraction`
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 3. Checkpoint - Verificar utilidades base
  - Ejecutar todos los tests unitarios y de propiedades
  - Verificar que todas las utilidades funcionan correctamente
  - Asegurar que no hay errores de TypeScript
  - Preguntar al usuario si hay dudas antes de continuar

- [x] 4. Integrar error handler en server action de órdenes de compra
  - [x] 4.1 Actualizar createPurchaseOrder con nuevo manejo de errores
    - Modificar `lib/actions/purchase-orders.ts`
    - Importar handleServerError y tipos
    - Reemplazar bloque catch genérico con handleServerError
    - Agregar contexto: operation, userId, companyId, supplierIds
    - Mantener estructura de respuesta existente (success/error)
    - _Requirements: 3.6, 6.1, 8.1, 8.2, 8.3_
  
  - [x] 4.2 Actualizar otras funciones de purchase-orders si existen
    - Aplicar mismo patrón a updatePurchaseOrder, deletePurchaseOrder, etc.
    - Usar handleServerError en todos los bloques catch
    - Agregar contexto apropiado para cada operación
    - _Requirements: 6.1, 6.4_
  
  - [ ]* 4.3 Escribir integration test para server action
    - Crear archivo `__tests__/lib/actions/purchase-orders.integration.test.ts`
    - Mock Supabase client para simular errores
    - Test: RLS error retorna respuesta estructurada con mensaje correcto
    - Test: Constraint error retorna respuesta estructurada
    - Test: Error desconocido retorna respuesta estructurada
    - Test: Éxito retorna estructura consistente con campo success
    - _Requirements: 3.6, 6.1_

- [x] 5. Verificar integración con UI existente
  - [x] 5.1 Revisar componente de formulario de órdenes de compra
    - Abrir `app/dashboard/purchase-orders/new/page.tsx`
    - Verificar que manejo de errores existente funciona con nueva estructura
    - Confirmar que toast.error se llama con result.error
    - No se requieren cambios si ya usa el patrón correcto
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [ ]* 5.2 Escribir UI integration test
    - Crear archivo `__tests__/components/dashboard/purchase-order-form.ui.test.tsx`
    - Mock server action para retornar error estructurado
    - Test: Toast notification se muestra cuando hay error
    - Test: Toast muestra mensaje de usuario, no detalles técnicos
    - Test: Toast usa estilo de error (toast.error)
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [ ] 6. Documentar patrón y crear ejemplos
  - [ ] 6.1 Crear documentación de uso
    - Crear archivo `docs/ERROR_HANDLING_PATTERN.md`
    - Documentar cómo usar handleServerError
    - Incluir ejemplos de uso en server actions
    - Documentar tipos de error y mensajes
    - Incluir guía para agregar nuevos tipos de error
    - _Requirements: 6.5_
  
  - [ ] 6.2 Agregar comentarios JSDoc a funciones
    - Agregar JSDoc a handleServerError con ejemplos
    - Agregar JSDoc a getErrorMessage
    - Documentar parámetros y valores de retorno
    - _Requirements: 6.5_

- [ ] 7. Checkpoint final - Validación completa
  - Ejecutar todos los tests (unit, property, integration, UI)
  - Verificar que no hay errores de TypeScript
  - Probar manualmente creando una orden de compra con errores simulados
  - Verificar que mensajes en español aparecen correctamente en UI
  - Verificar que logs del servidor contienen información detallada
  - Preguntar al usuario si todo funciona correctamente

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que implementa
- Los property tests usan fast-check con mínimo 100 iteraciones
- El patrón es reutilizable y puede aplicarse a otras server actions después
- La integración con UI existente es transparente (no requiere cambios si ya usa el patrón correcto)
- Los checkpoints aseguran validación incremental del progreso
