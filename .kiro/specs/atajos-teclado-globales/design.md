# Design Document: Sistema de Atajos de Teclado Globales

## Overview

El sistema de atajos de teclado globales proporciona una capa de interacción eficiente para el ERP, permitiendo a los usuarios ejecutar acciones comunes mediante combinaciones de teclas. El diseño se basa en un patrón de Context Provider de React que captura eventos de teclado a nivel global y los mapea a acciones específicas.

La arquitectura sigue estos principios:
- **Separación de responsabilidades**: La lógica de captura de teclas está separada de la ejecución de acciones
- **Extensibilidad**: Nuevos atajos pueden agregarse fácilmente mediante configuración
- **Prevención de conflictos**: Sistema inteligente que detecta contextos donde los atajos deben deshabilitarse
- **Multiplataforma**: Detección automática de sistema operativo para usar modificadores correctos

## Architecture

### Component Hierarchy

```
KeyboardShortcutsProvider (Context)
├── useKeyboardShortcuts (Hook)
├── ShortcutsHelpModal (Component)
├── CommandPalette (Component)
├── ShortcutBadge (Component)
└── Toast Notifications (Integration)
```

### Data Flow

1. **Captura de eventos**: El provider escucha eventos `keydown` a nivel de `window`
2. **Filtrado de contexto**: Verifica si el atajo debe ejecutarse según el contexto actual
3. **Mapeo de acción**: Busca la acción asociada al atajo en el registro
4. **Ejecución**: Ejecuta la acción y muestra feedback visual
5. **Persistencia**: Guarda preferencias en localStorage

### Key Design Decisions

- **React Context**: Usar Context API para compartir estado de atajos en toda la app
- **Event Delegation**: Un solo listener global en lugar de múltiples listeners
- **Lazy Loading**: Los componentes modales se cargan solo cuando se necesitan
- **Platform Detection**: Usar `navigator.platform` para detectar Mac vs Windows/Linux

## Components and Interfaces

### 1. KeyboardShortcutsProvider

**Responsabilidad**: Proveedor de contexto que gestiona el estado global de atajos y captura eventos de teclado.

**Props**:
```typescript
interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  disabled?: boolean; // Deshabilitar todos los atajos
}
```

**State**:
```typescript
interface KeyboardShortcutsState {
  shortcuts: Map<string, ShortcutConfig>;
  disabledShortcuts: Set<string>;
  isHelpOpen: boolean;
  isCommandPaletteOpen: boolean;
  activeModals: string[];
}
```

**Methods**:
- `registerShortcut(key: string, config: ShortcutConfig): void`
- `unregisterShortcut(key: string): void`
- `executeShortcut(key: string): void`
- `toggleShortcut(key: string, enabled: boolean): void`
- `openHelp(): void`
- `closeHelp(): void`
- `openCommandPalette(): void`
- `closeCommandPalette(): void`

### 2. useKeyboardShortcuts Hook

**Responsabilidad**: Hook personalizado que proporciona acceso al contexto de atajos y métodos de utilidad.

**Return Type**:
```typescript
interface UseKeyboardShortcutsReturn {
  registerShortcut: (key: string, config: ShortcutConfig) => void;
  unregisterShortcut: (key: string) => void;
  isShortcutEnabled: (key: string) => boolean;
  toggleShortcut: (key: string, enabled: boolean) => void;
  openHelp: () => void;
  openCommandPalette: () => void;
  shortcuts: ShortcutConfig[];
  platformModifier: 'Cmd' | 'Ctrl';
}
```

**Usage Example**:
```typescript
const { registerShortcut, platformModifier } = useKeyboardShortcuts();

useEffect(() => {
  registerShortcut('Ctrl+N', {
    action: () => router.push('/dashboard/sales/new'),
    description: 'Nueva venta rápida',
    category: 'navigation'
  });
}, []);
```

### 3. ShortcutsHelpModal

**Responsabilidad**: Modal que muestra todos los atajos disponibles organizados por categoría.

**Props**:
```typescript
interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features**:
- Agrupación por categorías (Navegación, Formularios, Modales, etc.)
- Búsqueda de atajos
- Indicación de atajos deshabilitados
- Botón para restaurar valores por defecto

### 4. CommandPalette

**Responsabilidad**: Interfaz de búsqueda global para ejecutar acciones rápidamente.

**Props**:
```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features**:
- Búsqueda fuzzy de acciones
- Navegación con teclado (flechas arriba/abajo, Enter)
- Muestra atajo asociado a cada acción
- Historial de acciones recientes

**State**:
```typescript
interface CommandPaletteState {
  query: string;
  selectedIndex: number;
  filteredActions: Action[];
  recentActions: Action[];
}
```

### 5. ShortcutBadge

**Responsabilidad**: Componente visual que muestra el atajo asociado a un botón o elemento.

**Props**:
```typescript
interface ShortcutBadgeProps {
  shortcut: string; // e.g., "Ctrl+N"
  variant?: 'default' | 'compact' | 'tooltip';
  className?: string;
}
```

**Rendering Logic**:
- Detecta plataforma y muestra modificador correcto
- Estilo consistente con el design system
- Variante tooltip para mostrar en hover

## Data Models

### ShortcutConfig

```typescript
interface ShortcutConfig {
  key: string; // e.g., "Ctrl+N", "F2", "?"
  action: () => void | Promise<void>;
  description: string;
  category: ShortcutCategory;
  enabled?: boolean;
  preventDefault?: boolean; // Default: true
  stopPropagation?: boolean; // Default: true
  allowInInput?: boolean; // Default: false
}

type ShortcutCategory = 
  | 'navigation' 
  | 'forms' 
  | 'modals' 
  | 'search' 
  | 'general';
```

### Action (para Command Palette)

```typescript
interface Action {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  category: string;
  icon?: React.ReactNode;
  action: () => void | Promise<void>;
  keywords?: string[]; // Para búsqueda
}
```

### ShortcutPreferences

```typescript
interface ShortcutPreferences {
  disabledShortcuts: string[];
  customShortcuts?: Record<string, string>; // Future: custom mappings
  lastUpdated: string;
}
```

### Platform Detection

```typescript
type Platform = 'mac' | 'windows' | 'linux';

interface PlatformInfo {
  platform: Platform;
  modifier: 'Cmd' | 'Ctrl';
  modifierKey: 'metaKey' | 'ctrlKey';
}
```

### Keyboard Event Context

```typescript
interface KeyboardEventContext {
  isInputFocused: boolean;
  isModalOpen: boolean;
  activeElement: HTMLElement | null;
  allowedShortcuts: Set<string>;
}
```

### Default Shortcuts Configuration

```typescript
const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  {
    key: 'Ctrl+N',
    action: () => router.push('/dashboard/sales/new'),
    description: 'Nueva venta rápida',
    category: 'navigation',
  },
  {
    key: 'Ctrl+P',
    action: () => openProductSearch(),
    description: 'Buscar productos',
    category: 'search',
  },
  {
    key: 'Ctrl+K',
    action: () => openCommandPalette(),
    description: 'Command palette',
    category: 'search',
  },
  {
    key: 'Ctrl+Shift+C',
    action: () => openNewCustomerModal(),
    description: 'Nuevo cliente',
    category: 'navigation',
  },
  {
    key: 'Ctrl+Shift+P',
    action: () => router.push('/dashboard/products/new'),
    description: 'Nuevo producto',
    category: 'navigation',
  },
  {
    key: 'Ctrl+Shift+O',
    action: () => router.push('/dashboard/purchase-orders/new'),
    description: 'Nueva orden de compra',
    category: 'navigation',
  },
  {
    key: 'F2',
    action: () => openQuickPaymentModal(),
    description: 'Registro de pago rápido',
    category: 'forms',
  },
  {
    key: 'Escape',
    action: () => closeTopModal(),
    description: 'Cerrar modal/diálogo',
    category: 'modals',
    allowInInput: true,
  },
  {
    key: '?',
    action: () => openHelp(),
    description: 'Mostrar ayuda de atajos',
    category: 'general',
  },
  {
    key: 'Ctrl+S',
    action: () => submitActiveForm(),
    description: 'Guardar formulario actual',
    category: 'forms',
    allowInInput: true,
  },
  {
    key: 'Ctrl+/',
    action: () => toggleSidebar(),
    description: 'Toggle sidebar',
    category: 'general',
  },
];
```


## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema—esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquinas.*

### Property 1: Ejecución consistente de atajos de navegación

*Para cualquier* atajo de navegación registrado (Ctrl+N, Ctrl+P, Ctrl+K, Ctrl+Shift+C, Ctrl+Shift+P, Ctrl+Shift+O, F2) y cualquier estado válido de la aplicación donde no hay inputs enfocados, presionar el atajo debe ejecutar la acción asociada exactamente una vez.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

### Property 2: Idempotencia del toggle de sidebar

*Para cualquier* estado inicial del sidebar (abierto o cerrado), presionar Ctrl+/ dos veces consecutivas debe restaurar el estado original del sidebar.

**Validates: Requirements 1.8**

### Property 3: Cierre de modal activo con Escape

*Para cualquier* estado de la aplicación con al menos un modal abierto, presionar Esc debe cerrar exactamente el modal más reciente y dejar los demás modales sin cambios.

**Validates: Requirements 2.1, 2.2, 4.3**

### Property 4: Envío de formulario con Ctrl+S

*Para cualquier* formulario válido sin errores de validación, presionar Ctrl+S debe enviar el formulario y prevenir el comportamiento por defecto del navegador.

**Validates: Requirements 3.1, 3.2**

### Property 5: Prevención de envío con errores de validación

*Para cualquier* formulario con al menos un error de validación, presionar Ctrl+S debe mostrar los errores de validación sin enviar el formulario.

**Validates: Requirements 3.3**

### Property 6: Apertura del panel de ayuda

*Para cualquier* estado válido de la aplicación, presionar ? debe abrir el Help_Panel mostrando todos los atajos registrados organizados por categoría.

**Validates: Requirements 4.1, 4.2**

### Property 7: Detección correcta de plataforma

*Para cualquier* sistema operativo (Mac, Windows, Linux), el sistema debe detectar automáticamente la plataforma y usar el modificador correcto (Cmd para Mac, Ctrl para Windows/Linux) en todos los componentes visuales.

**Validates: Requirements 4.4, 5.2, 9.1, 9.2, 9.3**

### Property 8: Renderizado de badges en botones con atajos

*Para cualquier* botón con un atajo asociado, el sistema debe renderizar un ShortcutBadge visible que muestre el atajo con el modificador de plataforma correcto.

**Validates: Requirements 5.1, 5.2**

### Property 9: Deshabilitación de atajos en inputs

*Para cualquier* estado donde un Input_Field tiene el foco, todos los atajos excepto Esc y Ctrl+S deben estar deshabilitados y no ejecutarse al presionar sus combinaciones de teclas.

**Validates: Requirements 6.1, 6.2**

### Property 10: Reactivación de atajos al salir de inputs

*Para cualquier* secuencia donde un Input_Field recibe foco y luego lo pierde, todos los atajos deben volver a estar habilitados y funcionar normalmente después de perder el foco.

**Validates: Requirements 6.3**

### Property 11: Notificación de ejecución exitosa

*Para cualquier* atajo ejecutado exitosamente, el sistema debe mostrar una notificación toast que indique qué acción se ejecutó.

**Validates: Requirements 7.1, 7.2**

### Property 12: Notificación de error en ejecución fallida

*Para cualquier* intento de ejecución de atajo que falle, el sistema debe mostrar un mensaje de error explicativo sin ejecutar la acción.

**Validates: Requirements 7.4**

### Property 13: Persistencia de preferencias

*Para cualquier* cambio en las preferencias de atajos (habilitar/deshabilitar), el sistema debe guardar la preferencia en localStorage inmediatamente.

**Validates: Requirements 8.1, 8.3**

### Property 14: Round-trip de preferencias

*Para cualquier* conjunto de preferencias de atajos guardadas, recargar la página debe restaurar exactamente las mismas preferencias que estaban guardadas.

**Validates: Requirements 8.2**

### Property 15: Restauración a valores por defecto

*Para cualquier* estado de preferencias modificadas, ejecutar la acción de restaurar valores por defecto debe volver todas las preferencias al estado inicial del sistema.

**Validates: Requirements 8.4**

### Property 16: Filtrado en tiempo real del Command Palette

*Para cualquier* query de búsqueda ingresada en el Command_Palette, el sistema debe filtrar y mostrar solo las acciones cuyo label, description o keywords contengan el query (case-insensitive).

**Validates: Requirements 10.2**

### Property 17: Ejecución y cierre desde Command Palette

*Para cualquier* acción seleccionada en el Command_Palette, el sistema debe ejecutar la acción asociada y cerrar el Command_Palette inmediatamente después.

**Validates: Requirements 10.3**

### Property 18: Visualización de atajos en Command Palette

*Para cualquier* acción mostrada en el Command_Palette que tenga un atajo asociado, el sistema debe mostrar el atajo junto a la acción con el modificador de plataforma correcto.

**Validates: Requirements 10.4**

## Error Handling

### Input Validation Errors
- **Scenario**: Usuario presiona Ctrl+S en formulario con errores
- **Handling**: Mostrar errores de validación sin enviar, mantener foco en primer campo con error
- **User Feedback**: Toast notification indicando "Formulario tiene errores de validación"

### Shortcut Execution Errors
- **Scenario**: Acción asociada a atajo lanza excepción
- **Handling**: Capturar error, registrar en consola, no propagar
- **User Feedback**: Toast notification con mensaje "No se pudo ejecutar la acción"

### Platform Detection Errors
- **Scenario**: No se puede detectar plataforma (user agent inválido)
- **Handling**: Usar 'Ctrl' como valor por defecto
- **User Feedback**: Ninguno (fallback silencioso)

### LocalStorage Errors
- **Scenario**: LocalStorage no disponible o lleno
- **Handling**: Continuar sin persistencia, usar solo estado en memoria
- **User Feedback**: Toast notification "No se pudieron guardar preferencias"

### Modal Stack Errors
- **Scenario**: Presionar Esc sin modales abiertos
- **Handling**: No hacer nada, no lanzar error
- **User Feedback**: Ninguno

### Conflicting Shortcuts
- **Scenario**: Dos atajos registrados con la misma combinación
- **Handling**: Último registrado sobrescribe al anterior, log warning en consola
- **User Feedback**: Ninguno (solo en desarrollo)

## Testing Strategy

### Unit Tests

Los unit tests se enfocarán en casos específicos y edge cases:

1. **Platform Detection**
   - Test: Detectar Mac correctamente con user agent de Mac
   - Test: Detectar Windows correctamente con user agent de Windows
   - Test: Usar Ctrl como fallback con user agent desconocido

2. **Shortcut Registration**
   - Test: Registrar un atajo nuevo lo agrega al mapa
   - Test: Registrar atajo duplicado sobrescribe el anterior
   - Test: Desregistrar atajo lo elimina del mapa

3. **Modal Stack Management**
   - Test: Presionar Esc sin modales no causa error
   - Test: Presionar Esc con un modal lo cierra
   - Test: Presionar Esc con múltiples modales cierra solo el último

4. **Input Focus Detection**
   - Test: Detectar correctamente cuando un input tiene foco
   - Test: Detectar correctamente cuando un textarea tiene foco
   - Test: Detectar correctamente cuando un contenteditable tiene foco

5. **LocalStorage Persistence**
   - Test: Guardar preferencias escribe en localStorage
   - Test: Cargar preferencias lee de localStorage
   - Test: Manejar localStorage no disponible sin error

6. **Toast Notifications**
   - Test: Ejecutar atajo muestra toast con mensaje correcto
   - Test: Error en ejecución muestra toast de error
   - Test: Toast desaparece después de 2 segundos

### Property-Based Tests

Los property tests verificarán propiedades universales con 100+ iteraciones:

1. **Property Test: Ejecución consistente de atajos**
   - Generar: Estados aleatorios de aplicación sin inputs enfocados
   - Generar: Atajos de navegación aleatorios del conjunto registrado
   - Verificar: Presionar atajo ejecuta acción exactamente una vez
   - **Feature: atajos-teclado-globales, Property 1: Ejecución consistente de atajos de navegación**

2. **Property Test: Idempotencia del toggle**
   - Generar: Estado inicial aleatorio del sidebar (abierto/cerrado)
   - Acción: Presionar Ctrl+/ dos veces
   - Verificar: Estado final igual al estado inicial
   - **Feature: atajos-teclado-globales, Property 2: Idempotencia del toggle de sidebar**

3. **Property Test: Cierre correcto de modales**
   - Generar: Pila aleatoria de modales (1-5 modales)
   - Acción: Presionar Esc
   - Verificar: Solo el último modal se cierra, los demás permanecen
   - **Feature: atajos-teclado-globales, Property 3: Cierre de modal activo con Escape**

4. **Property Test: Envío de formularios válidos**
   - Generar: Formularios aleatorios sin errores de validación
   - Acción: Presionar Ctrl+S
   - Verificar: Formulario se envía y preventDefault() se llama
   - **Feature: atajos-teclado-globales, Property 4: Envío de formulario con Ctrl+S**

5. **Property Test: Prevención de envío con errores**
   - Generar: Formularios aleatorios con al menos un error de validación
   - Acción: Presionar Ctrl+S
   - Verificar: Formulario no se envía y errores se muestran
   - **Feature: atajos-teclado-globales, Property 5: Prevención de envío con errores de validación**

6. **Property Test: Detección de plataforma**
   - Generar: User agents aleatorios de diferentes plataformas
   - Acción: Detectar plataforma
   - Verificar: Modificador correcto (Cmd para Mac, Ctrl para otros)
   - **Feature: atajos-teclado-globales, Property 7: Detección correcta de plataforma**

7. **Property Test: Renderizado de badges**
   - Generar: Botones aleatorios con atajos asociados
   - Acción: Renderizar componente
   - Verificar: ShortcutBadge presente con modificador correcto
   - **Feature: atajos-teclado-globales, Property 8: Renderizado de badges en botones con atajos**

8. **Property Test: Deshabilitación en inputs**
   - Generar: Estados aleatorios con input enfocado
   - Generar: Atajos aleatorios (excepto Esc y Ctrl+S)
   - Acción: Presionar atajo
   - Verificar: Atajo no se ejecuta
   - **Feature: atajos-teclado-globales, Property 9: Deshabilitación de atajos en inputs**

9. **Property Test: Reactivación después de input**
   - Generar: Estados aleatorios con input enfocado
   - Acción: Enfocar input, luego desenfocar
   - Generar: Atajo aleatorio
   - Verificar: Atajo se ejecuta normalmente
   - **Feature: atajos-teclado-globales, Property 10: Reactivación de atajos al salir de inputs**

10. **Property Test: Notificaciones de éxito**
    - Generar: Atajos aleatorios
    - Acción: Ejecutar atajo exitosamente
    - Verificar: Toast notification aparece con mensaje correcto
    - **Feature: atajos-teclado-globales, Property 11: Notificación de ejecución exitosa**

11. **Property Test: Round-trip de preferencias**
    - Generar: Conjunto aleatorio de preferencias de atajos
    - Acción: Guardar preferencias, recargar, cargar preferencias
    - Verificar: Preferencias cargadas son idénticas a las guardadas
    - **Feature: atajos-teclado-globales, Property 14: Round-trip de preferencias**

12. **Property Test: Restauración a valores por defecto**
    - Generar: Preferencias aleatorias modificadas
    - Acción: Restaurar valores por defecto
    - Verificar: Todas las preferencias vuelven al estado inicial
    - **Feature: atajos-teclado-globales, Property 15: Restauración a valores por defecto**

13. **Property Test: Filtrado de Command Palette**
    - Generar: Lista aleatoria de acciones
    - Generar: Query de búsqueda aleatorio
    - Acción: Filtrar acciones
    - Verificar: Todas las acciones retornadas contienen el query
    - **Feature: atajos-teclado-globales, Property 16: Filtrado en tiempo real del Command Palette**

14. **Property Test: Ejecución desde Command Palette**
    - Generar: Acción aleatoria del Command_Palette
    - Acción: Seleccionar y ejecutar acción
    - Verificar: Acción se ejecuta y Command_Palette se cierra
    - **Feature: atajos-teclado-globales, Property 17: Ejecución y cierre desde Command Palette**

### Integration Tests

1. **Full Workflow: Nueva venta con atajo**
   - Presionar Ctrl+N
   - Verificar navegación a /dashboard/sales/new
   - Verificar toast notification
   - Verificar que el formulario está listo para usar

2. **Full Workflow: Command Palette**
   - Presionar Ctrl+K
   - Escribir query de búsqueda
   - Seleccionar acción con Enter
   - Verificar que acción se ejecuta
   - Verificar que palette se cierra

3. **Full Workflow: Persistencia de preferencias**
   - Deshabilitar un atajo
   - Recargar página
   - Verificar que atajo sigue deshabilitado
   - Restaurar valores por defecto
   - Verificar que atajo vuelve a estar habilitado

### Test Configuration

- **Property tests**: Mínimo 100 iteraciones por test
- **Framework**: Jest + React Testing Library para unit tests
- **Property testing library**: fast-check para TypeScript
- **Coverage target**: 80% para lógica de negocio, 60% para componentes UI
