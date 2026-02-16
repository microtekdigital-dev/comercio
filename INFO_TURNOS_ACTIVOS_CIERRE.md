# Información de Turnos Activos en Cierre de Caja

## Problema Reportado y Resuelto

### Problema Original
El usuario necesitaba que cuando vaya a hacer cierre de caja, el sistema le informe qué turno está activo para hacer el cierre.

### Bug Crítico Encontrado
El usuario reportó: "me indica que hay una apertura de noche activa, pero a la vez cuando selecciono ese turno me sale un mensaje diciendo que no se encontró apertura para ese turno"

**Causa del bug:**
1. La función `calculatePreview()` NO estaba buscando la apertura correspondiente
2. Simplemente establecía `hasOpening: false` y dejaba la búsqueda al backend
3. La apertura era del 14/02/2026 pero la fecha de cierre por defecto era 16/02/2026
4. El sistema mostraba el error antes de que el usuario pudiera enviar el formulario

## Solución Completa Implementada

### 1. Carga Automática de Aperturas Activas

Al cargar la página de cierre, el sistema:
- Obtiene todas las aperturas de caja
- Obtiene todos los cierres de caja
- Filtra las aperturas que NO tienen un cierre asociado
- Muestra estas aperturas activas en una alerta informativa

```typescript
const loadActiveOpenings = async () => {
  const [openings, closures] = await Promise.all([
    getCashRegisterOpenings(),
    getCashRegisterClosures()
  ])
  
  // Filtrar aperturas sin cierre
  const active = openings.filter(opening => {
    const hasMatchingClosure = closures.some(closure => 
      closure.opening_id === opening.id
    )
    return !hasMatchingClosure
  })
  
  setActiveOpenings(active)
  
  // Si hay solo una apertura activa, pre-seleccionar su turno
  if (active.length === 1) {
    setShift(active[0].shift)
  }
}
```

### 2. **FIX CRÍTICO**: Búsqueda de Apertura en el Preview

Se modificó `calculatePreview()` para buscar la apertura correspondiente en el array `activeOpenings`:

```typescript
// Find the corresponding opening from activeOpenings
let matchingOpening = null
let hasOpening = false

if (shift && shift !== "sin-turno" && activeOpenings.length > 0) {
  // Look for an opening that matches the selected shift
  matchingOpening = activeOpenings.find(opening => opening.shift === shift)
  
  if (matchingOpening) {
    hasOpening = true
  }
}

setPreview({
  // ... otros datos de ventas
  opening: matchingOpening ? {
    id: matchingOpening.id,
    initial_cash_amount: matchingOpening.initial_cash_amount,
    opened_by_name: matchingOpening.opened_by_name,
    shift: matchingOpening.shift,
  } : null,
  hasOpening,
})
```

**Cambio clave:** Ahora busca en `activeOpenings` (aperturas sin cierre) en lugar de buscar por fecha. Esto resuelve el problema de que la apertura sea de una fecha diferente a la fecha de cierre.

### 3. Actualización Reactiva del Preview

Se actualizó el `useEffect` para recalcular cuando cambian las aperturas activas:

```typescript
useEffect(() => {
  if (closureDate) {
    calculatePreview()
  }
}, [closureDate, shift, activeOpenings]) // ← activeOpenings agregado
```

### 4. Alerta Informativa con Detalles

Se muestra una alerta azul con la información de cada apertura activa:

**Información mostrada:**
- Turno (Mañana, Tarde, Noche)
- Fecha y hora de apertura
- Nombre de quien abrió la caja
- Monto inicial de efectivo

**Diseño visual:**
- Icono de reloj para indicar tiempo
- Badge con el nombre del turno
- Formato de moneda argentino (ARS)
- Colores azules para indicar información

### 5. Alerta de Apertura Encontrada

Cuando se selecciona un turno y se encuentra la apertura correspondiente, se muestra una alerta verde con:
- Confirmación de apertura encontrada
- Turno de la apertura
- Nombre de quien abrió
- Monto inicial

### 6. Pre-selección Automática de Turno

Si hay solo UNA apertura activa:
- El sistema pre-selecciona automáticamente ese turno en el formulario
- El usuario no necesita seleccionar manualmente
- Reduce errores y acelera el proceso

### 7. Validación de Aperturas

El botón "Cerrar Caja" se desactiva si:
- No hay aperturas activas
- Se muestra alerta roja indicando que debe crear una apertura primero

## Resultado del Fix

### Antes del Fix
```
Usuario selecciona turno "Noche"
↓
Sistema busca apertura en fecha 16/02/2026
↓
No encuentra (la apertura es del 14/02/2026)
↓
Muestra error: "No se encontró apertura para esta fecha y turno"
↓
Usuario confundido ❌
```

### Después del Fix
```
Usuario ve aperturas activas
↓
Selecciona turno "Noche"
↓
Sistema busca en activeOpenings por turno
↓
Encuentra la apertura (independiente de la fecha)
↓
Muestra detalles de la apertura ✓
↓
Calcula correctamente el efectivo esperado ✓
↓
Usuario puede cerrar sin problemas ✓
```

## Archivos Modificados

### `app/dashboard/cash-register/new/page.tsx`

**Importaciones agregadas:**
```typescript
import { getCashRegisterOpenings, getCashRegisterClosures } from "@/lib/actions/cash-register"
import { Badge } from "@/components/ui/badge"
import { AlertTitle } from "@/components/ui/alert"
import { Clock, Info } from "lucide-react"
import type { CashRegisterOpening } from "@/lib/types/erp"
```

**Estado agregado:**
```typescript
const [activeOpenings, setActiveOpenings] = useState<CashRegisterOpening[]>([])
```

**Funciones agregadas:**
- `loadActiveOpenings()`: Carga y filtra aperturas activas
- `formatDateTime()`: Formatea fecha y hora para mostrar

**Funciones modificadas:**
- `calculatePreview()`: Ahora busca la apertura en `activeOpenings` por turno (FIX CRÍTICO)

**useEffect modificado:**
- Agregada dependencia `activeOpenings` para recalcular preview cuando cambian las aperturas

**Componentes agregados:**
- Alerta de aperturas activas (azul)
- Alerta de sin aperturas (roja)
- Alerta de apertura encontrada (verde)
- Lista de aperturas con detalles

**Validación del botón:**
```typescript
<Button 
  type="submit" 
  disabled={loading || calculating || activeOpenings.length === 0}
>
  {loading ? "Guardando..." : "Cerrar Caja"}
</Button>
```

## Casos de Uso

### Caso 1: Una Apertura Activa
```
┌─────────────────────────────────────────┐
│ ℹ️ Aperturas Activas (1)                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 [Mañana] 16/02/2026 08:00       │ │
│ │    Abierto por: Juan Pérez          │ │
│ │                        $10,000.00   │ │
│ │                        Monto inicial│ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Turno: [Mañana] (pre-seleccionado)
```

### Caso 2: Múltiples Aperturas Activas
```
┌─────────────────────────────────────────┐
│ ℹ️ Aperturas Activas (2)                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 [Mañana] 16/02/2026 08:00       │ │
│ │    Abierto por: Juan Pérez          │ │
│ │                        $10,000.00   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🕐 [Tarde] 16/02/2026 14:00        │ │
│ │    Abierto por: María García        │ │
│ │                        $15,000.00   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Turno: [Seleccionar turno] (usuario elige)
```

### Caso 3: Sin Aperturas Activas
```
┌─────────────────────────────────────────┐
│ ⚠️ No hay aperturas activas             │
│                                         │
│ No se encontraron aperturas de caja     │
│ pendientes de cierre. Debes crear una   │
│ apertura antes de hacer un cierre.      │
└─────────────────────────────────────────┘

[Cerrar Caja] (deshabilitado)
```

## Beneficios

### 1. Claridad
- El usuario ve exactamente qué turnos están abiertos
- No hay confusión sobre qué está cerrando
- Información completa y visible

### 2. Prevención de Errores
- No se puede cerrar sin apertura activa
- Pre-selección automática reduce errores
- Validación clara del estado

### 3. Trazabilidad
- Se muestra quién abrió cada turno
- Fecha y hora exacta de apertura
- Monto inicial visible para verificación

### 4. Eficiencia
- Pre-selección automática cuando hay un solo turno
- Menos clics para el usuario
- Proceso más rápido

### 5. Transparencia
- El usuario sabe el estado antes de empezar
- Información financiera visible (monto inicial)
- Contexto completo para el cierre

## Flujo de Trabajo Mejorado

### Antes
1. Usuario va a "Nuevo Cierre"
2. Selecciona fecha y turno manualmente
3. No sabe si hay apertura para ese turno
4. Puede intentar cerrar un turno sin apertura
5. Error al guardar

### Ahora
1. Usuario va a "Nuevo Cierre"
2. Ve inmediatamente las aperturas activas
3. Si hay una sola, el turno se pre-selecciona
4. Si hay varias, elige cuál cerrar
5. Si no hay ninguna, el botón está deshabilitado
6. Proceso claro y sin errores

## Integración con Control de Botones

Esta mejora se complementa con el control de botones implementado anteriormente:

**En la página principal:**
- Botón "Nuevo Cierre" solo se habilita si hay aperturas activas

**En la página de cierre:**
- Se muestra información detallada de esas aperturas activas
- Se valida que existan antes de permitir el cierre

**Flujo completo:**
1. Usuario crea apertura → Botón "Nuevo Cierre" se habilita
2. Usuario hace clic en "Nuevo Cierre" → Ve detalles de la apertura
3. Usuario completa el cierre → Apertura se marca como cerrada
4. Botón "Nueva Apertura" se habilita nuevamente

## Consideraciones Técnicas

### Performance
- Carga de datos al montar el componente
- Una sola llamada para obtener aperturas y cierres
- Filtrado eficiente en el cliente

### UX
- Colores consistentes (azul para info, rojo para error)
- Iconos descriptivos (reloj, info, alerta)
- Formato de moneda localizado (es-AR)

### Accesibilidad
- Alertas con títulos descriptivos
- Iconos con significado claro
- Contraste de colores adecuado

## Mejoras Futuras Posibles

1. **Selector de apertura**
   - Dropdown para elegir qué apertura cerrar
   - Útil cuando hay múltiples aperturas

2. **Tiempo transcurrido**
   - Mostrar cuánto tiempo lleva abierto el turno
   - Ej: "Abierto hace 6 horas"

3. **Resumen de ventas por turno**
   - Mostrar ventas del turno en la alerta
   - Vista previa antes de cerrar

4. **Notificaciones**
   - Alerta si un turno lleva mucho tiempo abierto
   - Recordatorio de cierre al final del día

5. **Historial rápido**
   - Mostrar últimos cierres del mismo turno
   - Comparación con días anteriores
