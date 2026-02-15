# Implementation Plan: Sidebar de Notas Internas

## Overview

Este plan implementa un sidebar flotante de notas internas para el dashboard del ERP, con actualizaciones en tiempo real, seguridad multi-tenant, y optimistic updates para mejor UX. La implementación seguirá el orden: base de datos → tipos → server actions → componentes UI → integración.

## Tasks

- [x] 1. Crear esquema de base de datos y RLS policies
  - Crear tabla `internal_notes` con todos los campos necesarios
  - Implementar índices para optimizar queries
  - Configurar RLS policies para seguridad multi-tenant
  - Crear trigger para `updated_at`
  - Habilitar Realtime en la tabla
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 2. Definir tipos TypeScript
  - Agregar tipos `NoteType`, `InternalNote`, `CreateInternalNoteInput`, `UpdateInternalNoteInput`, `InternalNotesFilters` a `lib/types/erp.ts`
  - _Requirements: 7.4_

- [ ] 3. Implementar server actions
  - [x] 3.1 Crear `lib/actions/internal-notes.ts` con funciones base
    - Implementar `getInternalNotes()` con join a profiles
    - Implementar `createInternalNote()` con captura automática de metadatos
    - Implementar `updateInternalNote()` para marcar como resuelto
    - Implementar `deleteInternalNote()` con verificación de permisos
    - Implementar `getActiveNotesCount()` para el contador
    - _Requirements: 2.3, 2.4, 2.5, 3.1, 4.2, 4.5, 5.2, 5.3_

  - [ ]* 3.2 Escribir property test para captura automática de metadatos
    - **Property 4: Automatic Metadata Capture**
    - **Validates: Requirements 2.3, 2.4, 2.5**

  - [ ]* 3.3 Escribir property test para validación de contenido vacío
    - **Property 5: Empty Note Validation**
    - **Validates: Requirements 2.6**

  - [ ]* 3.4 Escribir property test para aislamiento de empresa
    - **Property 16: Company Isolation**
    - **Validates: Requirements 5.1, 5.2, 5.5**

  - [ ]* 3.5 Escribir property test para autorización de eliminación
    - **Property 17: Delete Authorization Enforcement**
    - **Validates: Requirements 5.4**

- [ ] 4. Crear componente de formulario de nota
  - [x] 4.1 Implementar `components/dashboard/internal-note-form.tsx`
    - Campo de texto para contenido
    - Selector de tipo de nota
    - Validación de contenido vacío
    - Manejo de submit con optimistic update
    - _Requirements: 2.1, 2.2, 2.6, 2.7, 6.1_

  - [ ]* 4.2 Escribir unit tests para validación de formulario
    - Test de validación de contenido vacío
    - Test de submit exitoso
    - Test de manejo de errores
    - _Requirements: 2.6, 6.4_

- [ ] 5. Crear componente de item de nota
  - [x] 5.1 Implementar `components/dashboard/internal-note-item.tsx`
    - Mostrar contenido, autor, fecha, tipo
    - Indicadores visuales por tipo (colores/iconos)
    - Botón de resolver (solo para notas activas)
    - Botón de eliminar (solo para autor o admin)
    - Manejo de acciones con optimistic updates
    - _Requirements: 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 6.2, 6.3_

  - [ ]* 5.2 Escribir property test para completitud de display
    - **Property 8: Note Display Completeness**
    - **Validates: Requirements 3.2**

  - [ ]* 5.3 Escribir property test para indicadores visuales
    - **Property 9: Note Type Visual Indicators**
    - **Validates: Requirements 3.3**

  - [ ]* 5.4 Escribir property test para visibilidad de botón resolver
    - **Property 10: Resolve Button Visibility**
    - **Validates: Requirements 4.1**

  - [ ]* 5.5 Escribir property test para autorización de botón eliminar
    - **Property 12: Delete Button Authorization**
    - **Validates: Requirements 4.3, 4.4**

- [ ] 6. Crear componente de filtros
  - [x] 6.1 Implementar `components/dashboard/internal-notes-filters.tsx`
    - Toggle para mostrar/ocultar notas resueltas
    - Dropdown para filtrar por tipo de nota
    - _Requirements: 4.6, 4.7_

  - [ ]* 6.2 Escribir property test para filtro de notas resueltas
    - **Property 14: Resolved Notes Filter**
    - **Validates: Requirements 4.6**

  - [ ]* 6.3 Escribir property test para filtro de tipo de nota
    - **Property 15: Note Type Filter**
    - **Validates: Requirements 4.7**

- [ ] 7. Crear componente principal del sidebar
  - [x] 7.1 Implementar `components/dashboard/internal-notes-sidebar.tsx`
    - Estructura del sidebar con overlay
    - Integración de formulario, filtros y lista de notas
    - Manejo de estado de apertura/cierre
    - Carga inicial de notas
    - Suscripción a Realtime updates
    - Scroll area para lista de notas
    - Estado de carga y estado vacío
    - _Requirements: 1.2, 1.3, 1.4, 3.1, 3.4, 3.6, 6.5_

  - [ ]* 7.2 Escribir property test para ordenamiento de notas
    - **Property 7: Notes Ordering**
    - **Validates: Requirements 3.1**

  - [ ]* 7.3 Escribir unit tests para interacciones del sidebar
    - Test de apertura/cierre con ESC
    - Test de cierre al hacer click fuera
    - Test de estado de carga
    - Test de estado vacío
    - _Requirements: 1.4, 3.6, 6.5_

- [ ] 8. Crear componente de botón flotante
  - [x] 8.1 Implementar `components/dashboard/internal-notes-button.tsx`
    - Botón flotante en esquina inferior derecha
    - Badge con contador de notas activas
    - Integración con sidebar
    - Suscripción a cambios para actualizar contador
    - _Requirements: 1.1, 1.2, 1.6_

  - [ ]* 8.2 Escribir property test para contador de notas activas
    - **Property 3: Active Notes Counter**
    - **Validates: Requirements 1.6**

- [ ] 9. Checkpoint - Verificar funcionalidad básica
  - Asegurar que todos los tests pasen
  - Verificar que el sidebar se abre y cierra correctamente
  - Verificar que se pueden crear, resolver y eliminar notas
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [ ] 10. Integrar botón flotante en el layout del dashboard
  - [x] 10.1 Agregar `<InternalNotesButton />` al layout principal del dashboard
    - Importar y renderizar el componente
    - Asegurar que sea visible en todas las páginas del dashboard
    - _Requirements: 1.1_

  - [ ]* 10.2 Escribir test de integración end-to-end
    - Test de flujo completo: abrir → crear nota → resolver → eliminar
    - Test de realtime sync entre múltiples usuarios
    - _Requirements: 2.8, 3.5_

- [ ] 11. Implementar responsive design
  - [ ] 11.1 Ajustar estilos para mobile
    - Sidebar ocupa ancho completo en mobile
    - Ajustar tamaños de fuente y espaciado
    - Verificar usabilidad en pantallas pequeñas
    - _Requirements: 1.5_

  - [ ]* 11.2 Escribir property test para responsive behavior
    - **Property 2: Sidebar Close Actions** (incluye mobile)
    - **Validates: Requirements 1.4, 1.5**

- [ ] 12. Implementar manejo de errores y rollback
  - [ ] 12.1 Agregar manejo de errores en optimistic updates
    - Implementar rollback en caso de fallo
    - Mostrar mensajes de error apropiados
    - Usar toast notifications para feedback
    - _Requirements: 6.4_

  - [ ]* 12.2 Escribir property test para rollback de optimistic updates
    - **Property 19: Optimistic Update Rollback**
    - **Validates: Requirements 6.4**

  - [ ]* 12.3 Escribir unit tests para casos de error
    - Test de error de red
    - Test de error de autorización
    - Test de error de validación
    - _Requirements: 6.4_

- [ ] 13. Checkpoint final - Verificar todos los requirements
  - Ejecutar todos los tests (unit + property + integration)
  - Verificar RLS policies en base de datos
  - Probar realtime updates con múltiples usuarios
  - Verificar responsive design en diferentes dispositivos
  - Asegurar que todos los tests pasen
  - Preguntar al usuario si hay ajustes finales

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requirements específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud
- Los unit tests validan ejemplos específicos y casos edge
- La implementación sigue el orden: base de datos → lógica → UI → integración
