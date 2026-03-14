# Implementation Plan: Sistema de Atajos de Teclado Globales

## Overview

Implementación del sistema de atajos de teclado globales para el ERP, siguiendo una arquitectura basada en React Context. La implementación se realizará de forma incremental, comenzando con la infraestructura base y agregando funcionalidades progresivamente.

## Tasks

- [ ] 1. Configurar infraestructura base del sistema de atajos
  - Crear tipos TypeScript para ShortcutConfig, Action, ShortcutPreferences, PlatformInfo
  - Crear utilidad de detección de plataforma (detectPlatform)
  - Crear utilidad para normalizar combinaciones de teclas
  - Configurar fast-check para property-based testing
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 2. Implementar KeyboardShortcutsProvider y Context
  - [ ] 2.1 Crear KeyboardShortcutsContext con estado inicial
    - Implementar estado para shortcuts, disabledShortcuts, modales activos
    - Crear métodos registerShortcut, unregisterShortcut, executeShortcut
    - Implementar detección de contexto (inputs enfocados, modales abiertos)
    - _Requirements: 1.1-1.8, 6.1, 6.3_
  
  - [ ]* 2.2 Write property test para ejecución consistente de atajos
    - **Property 1: Ejecución consistente de atajos de navegación**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**
  
  - [ ] 2.3 Implementar event listener global de teclado
    - Agregar listener de keydown en window
    - Implementar lógica de filtrado por contexto
    - Implementar preventDefault y stopPropagation
    - _Requirements: 3.2, 6.4_
  
  - [ ]* 2.4 Write property test para deshabilitación en inputs
    - **Property 9: Deshabilitación de atajos en inputs**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 3. Implementar useKeyboardShortcuts hook
  - Crear hook que consume KeyboardShortcutsContext
  - Exponer métodos de registro y gestión de atajos
  - Exponer platformModifier para uso en componentes
  - _Requirements: 9.3, 9.4_

- [ ] 4. Checkpoint - Verificar infraestructura base
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implementar gestión de modales y Escape
  - [ ] 5.1 Implementar stack de modales activos
    - Agregar métodos pushModal, popModal al context
    - Implementar lógica de cierre con Escape
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 5.2 Write property test para cierre de modales
    - **Property 3: Cierre de modal activo con Escape**
    - **Validates: Requirements 2.1, 2.2**
  
  - [ ]* 5.3 Write unit test para edge case sin modales
    - Test: Presionar Esc sin modales no causa error
    - _Requirements: 2.3_

- [ ] 6. Implementar guardado de formularios con Ctrl+S
  - [ ] 6.1 Implementar detección de formulario activo
    - Detectar formulario más cercano al elemento enfocado
    - Implementar lógica de envío de formulario
    - Implementar validación antes de envío
    - _Requirements: 3.1, 3.3_
  
  - [ ]* 6.2 Write property test para envío de formularios válidos
    - **Property 4: Envío de formulario con Ctrl+S**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ]* 6.3 Write property test para prevención con errores
    - **Property 5: Prevención de envío con errores de validación**
    - **Validates: Requirements 3.3**

- [ ] 7. Implementar ShortcutBadge component
  - [ ] 7.1 Crear componente ShortcutBadge
    - Implementar variantes (default, compact, tooltip)
    - Aplicar estilos consistentes con design system
    - Usar platformModifier para mostrar teclas correctas
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [ ]* 7.2 Write property test para renderizado de badges
    - **Property 8: Renderizado de badges en botones con atajos**
    - **Validates: Requirements 5.1, 5.2**
  
  - [ ]* 7.3 Write unit tests para variantes de badge
    - Test: Variante default renderiza correctamente
    - Test: Variante compact renderiza correctamente
    - Test: Variante tooltip renderiza correctamente

- [ ] 8. Checkpoint - Verificar componentes base
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implementar ShortcutsHelpModal component
  - [ ] 9.1 Crear componente ShortcutsHelpModal
    - Implementar UI del modal con lista de atajos
    - Agrupar atajos por categoría
    - Implementar búsqueda de atajos
    - Implementar botón de restaurar valores por defecto
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.4_
  
  - [ ]* 9.2 Write property test para apertura del panel de ayuda
    - **Property 6: Apertura del panel de ayuda**
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ]* 9.3 Write unit test para búsqueda en help panel
    - Test: Búsqueda filtra atajos correctamente
    - Test: Búsqueda case-insensitive funciona

- [ ] 10. Implementar CommandPalette component
  - [ ] 10.1 Crear componente CommandPalette
    - Implementar UI del command palette
    - Implementar búsqueda fuzzy de acciones
    - Implementar navegación con teclado (flechas, Enter)
    - Implementar historial de acciones recientes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 10.2 Write property test para filtrado en tiempo real
    - **Property 16: Filtrado en tiempo real del Command Palette**
    - **Validates: Requirements 10.2**
  
  - [ ]* 10.3 Write property test para ejecución desde palette
    - **Property 17: Ejecución y cierre desde Command Palette**
    - **Validates: Requirements 10.3**
  
  - [ ]* 10.4 Write property test para visualización de atajos
    - **Property 18: Visualización de atajos en Command Palette**
    - **Validates: Requirements 10.4**

- [ ] 11. Implementar sistema de notificaciones toast
  - [ ] 11.1 Integrar con sistema de toast existente
    - Implementar notificación de éxito al ejecutar atajo
    - Implementar notificación de error al fallar atajo
    - Configurar auto-dismiss después de 2 segundos
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 11.2 Write property test para notificaciones de éxito
    - **Property 11: Notificación de ejecución exitosa**
    - **Validates: Requirements 7.1, 7.2**
  
  - [ ]* 11.3 Write property test para notificaciones de error
    - **Property 12: Notificación de error en ejecución fallida**
    - **Validates: Requirements 7.4**
  
  - [ ]* 11.4 Write unit test para auto-dismiss de toast
    - Test: Toast desaparece después de 2 segundos
    - _Requirements: 7.3_

- [ ] 12. Checkpoint - Verificar componentes UI
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implementar persistencia de preferencias
  - [ ] 13.1 Crear utilidades de localStorage
    - Implementar savePreferences para guardar en localStorage
    - Implementar loadPreferences para cargar de localStorage
    - Implementar manejo de errores de localStorage
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 13.2 Write property test para persistencia
    - **Property 13: Persistencia de preferencias**
    - **Validates: Requirements 8.1, 8.3**
  
  - [ ]* 13.3 Write property test para round-trip
    - **Property 14: Round-trip de preferencias**
    - **Validates: Requirements 8.2**
  
  - [ ]* 13.4 Write property test para restauración
    - **Property 15: Restauración a valores por defecto**
    - **Validates: Requirements 8.4**
  
  - [ ]* 13.5 Write unit test para manejo de errores de localStorage
    - Test: Continuar sin persistencia si localStorage no disponible
    - Test: Mostrar toast si no se pueden guardar preferencias

- [ ] 14. Implementar toggle de sidebar con Ctrl+/
  - [ ] 14.1 Crear acción de toggle sidebar
    - Implementar lógica de toggle en layout principal
    - Registrar atajo Ctrl+/
    - _Requirements: 1.8_
  
  - [ ]* 14.2 Write property test para idempotencia del toggle
    - **Property 2: Idempotencia del toggle de sidebar**
    - **Validates: Requirements 1.8**

- [ ] 15. Registrar atajos por defecto en layout principal
  - [ ] 15.1 Integrar KeyboardShortcutsProvider en layout
    - Envolver aplicación con KeyboardShortcutsProvider
    - Registrar todos los atajos por defecto (Ctrl+N, Ctrl+P, etc.)
    - Implementar acciones para cada atajo
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [ ] 15.2 Agregar ShortcutBadges a botones principales
    - Agregar badge a botón "Nueva Venta" (Ctrl+N)
    - Agregar badge a botón "Buscar Productos" (Ctrl+P)
    - Agregar badge a botón "Nuevo Cliente" (Ctrl+Shift+C)
    - Agregar badge a botón "Nuevo Producto" (Ctrl+Shift+P)
    - Agregar badge a botón "Nueva Orden de Compra" (Ctrl+Shift+O)
    - _Requirements: 5.1, 5.2_

- [ ] 16. Implementar modal de pago rápido con F2
  - Crear QuickPaymentModal component
  - Registrar atajo F2 para abrir modal
  - Implementar formulario de pago rápido
  - _Requirements: 1.7_

- [ ] 17. Checkpoint - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implementar reactivación de atajos después de inputs
  - [ ] 18.1 Agregar listeners de focus/blur en inputs
    - Detectar cuando input recibe foco
    - Detectar cuando input pierde foco
    - Actualizar estado de atajos permitidos
    - _Requirements: 6.3_
  
  - [ ]* 18.2 Write property test para reactivación
    - **Property 10: Reactivación de atajos al salir de inputs**
    - **Validates: Requirements 6.3**

- [ ] 19. Implementar detección de plataforma y modificadores
  - [ ]* 19.1 Write property test para detección de plataforma
    - **Property 7: Detección correcta de plataforma**
    - **Validates: Requirements 4.4, 5.2, 9.1, 9.2, 9.3**
  
  - [ ]* 19.2 Write unit tests para casos específicos de plataforma
    - Test: Detectar Mac correctamente con user agent de Mac
    - Test: Detectar Windows correctamente con user agent de Windows
    - Test: Usar Ctrl como fallback con user agent desconocido
    - _Requirements: 9.1, 9.2_

- [ ] 20. Testing de integración end-to-end
  - [ ]* 20.1 Write integration test para workflow de nueva venta
    - Test: Presionar Ctrl+N navega a nueva venta y muestra toast
    - _Requirements: 1.1, 7.1_
  
  - [ ]* 20.2 Write integration test para workflow de Command Palette
    - Test: Abrir palette, buscar, seleccionar acción, verificar ejecución
    - _Requirements: 1.3, 10.1, 10.2, 10.3_
  
  - [ ]* 20.3 Write integration test para workflow de persistencia
    - Test: Deshabilitar atajo, recargar, verificar deshabilitado, restaurar
    - _Requirements: 8.1, 8.2, 8.4_

- [ ] 21. Documentación y refinamiento final
  - Agregar comentarios JSDoc a componentes y hooks
  - Crear archivo README con guía de uso
  - Documentar cómo agregar nuevos atajos
  - Verificar accesibilidad de componentes modales

- [ ] 22. Final checkpoint - Verificar sistema completo
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- El sistema usa TypeScript para type safety
- Se integra con el sistema de toast notifications existente del ERP
- Los atajos son configurables y extensibles para futuras funcionalidades
