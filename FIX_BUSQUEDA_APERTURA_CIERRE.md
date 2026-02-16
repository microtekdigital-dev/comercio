# Fix: Búsqueda de Apertura en Cierre de Caja

## Bug Reportado

El usuario reportó que el sistema mostraba un mensaje contradictorio:
- La alerta indicaba que había una apertura de "Noche" activa
- Pero al seleccionar ese turno, aparecía el error: "No se encontró apertura para esta fecha y turno"

## Causa Raíz

La función `calculatePreview()` en `app/dashboard/cash-register/new/page.tsx` NO estaba buscando la apertura correspondiente al turno seleccionado.

### Problema Específico

1. **Búsqueda inexistente**: La función simplemente establecía `hasOpening: false` y dejaba un comentario diciendo que el backend lo manejaría
2. **Desincronización de fechas**: La apertura era del 14/02/2026 pero la fecha de cierre por defecto era 16/02/2026 (hoy)
3. **Error prematuro**: El usuario veía el mensaje de error antes de poder enviar el formulario

### Código Problemático

```typescript
// ANTES (INCORRECTO)
setPreview({
  totalSalesCount,
  totalSalesAmount,
  cashSales,
  cardSales,
  transferSales,
  otherSales,
  hasOpening: false, // ← Siempre false!
  // No se buscaba la apertura
})
```

## Solución Implementada

### 1. Búsqueda de Apertura en activeOpenings

Se modificó `calculatePreview()` para buscar la apertura correspondiente en el array `activeOpenings` que ya tenemos cargado:

```typescript
// DESPUÉS (CORRECTO)
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
  totalSalesCount,
  totalSalesAmount,
  cashSales,
  cardSales,
  transferSales,
  otherSales,
  opening: matchingOpening ? {
    id: matchingOpening.id,
    initial_cash_amount: matchingOpening.initial_cash_amount,
    opened_by_name: matchingOpening.opened_by_name,
    shift: matchingOpening.shift,
  } : null,
  hasOpening,
})
```

### 2. Actualización Reactiva

Se actualizó el `useEffect` para recalcular el preview cuando cambian las aperturas activas:

```typescript
// ANTES
useEffect(() => {
  if (closureDate) {
    calculatePreview()
  }
}, [closureDate, shift])

// DESPUÉS
useEffect(() => {
  if (closureDate) {
    calculatePreview()
  }
}, [closureDate, shift, activeOpenings]) // ← activeOpenings agregado
```

## Por Qué Funciona

### Ventaja Clave: Búsqueda por Turno, No por Fecha

El nuevo enfoque busca en `activeOpenings` (aperturas sin cierre) filtrando por turno, independientemente de la fecha de apertura.

**Escenario del bug:**
- Apertura: 14/02/2026 21:00 - Turno "Noche"
- Cierre: 16/02/2026 (hoy)
- Turno seleccionado: "Noche"

**Búsqueda anterior (fallaba):**
```
Buscar apertura donde:
  - fecha = 16/02/2026
  - turno = "Noche"
→ No encuentra (la apertura es del 14/02)
→ Error ❌
```

**Búsqueda nueva (funciona):**
```
Buscar en activeOpenings donde:
  - turno = "Noche"
→ Encuentra la apertura del 14/02
→ Muestra detalles correctos ✓
```

## Comportamiento Actual

### Flujo Completo

1. **Carga inicial**: Se cargan todas las aperturas sin cierre
2. **Visualización**: Se muestran en alerta azul con detalles
3. **Selección de turno**: Usuario selecciona un turno
4. **Búsqueda automática**: Sistema busca apertura correspondiente en `activeOpenings`
5. **Resultado positivo**: Si encuentra, muestra alerta verde con detalles
6. **Resultado negativo**: Si no encuentra, muestra alerta roja de advertencia
7. **Cálculo correcto**: El efectivo esperado incluye el monto inicial de la apertura encontrada

### Alertas Contextuales

**Alerta Azul (Información):**
- Se muestra siempre que hay aperturas activas
- Lista todas las aperturas pendientes de cierre
- Incluye: turno, fecha/hora, quien abrió, monto inicial

**Alerta Verde (Éxito):**
- Se muestra cuando se encuentra la apertura para el turno seleccionado
- Confirma que el cierre se vinculará correctamente
- Muestra detalles de la apertura encontrada

**Alerta Roja (Advertencia):**
- Se muestra cuando se selecciona un turno sin apertura correspondiente
- Advierte que el cálculo no incluirá monto inicial
- Previene confusión del usuario

## Archivos Modificados

### `app/dashboard/cash-register/new/page.tsx`

**Líneas modificadas:**
- Función `calculatePreview()`: Agregada búsqueda de apertura en `activeOpenings`
- `useEffect` de preview: Agregada dependencia `activeOpenings`

**Cambios específicos:**
```typescript
// Línea ~95-115: Búsqueda de apertura agregada
let matchingOpening = null
let hasOpening = false

if (shift && shift !== "sin-turno" && activeOpenings.length > 0) {
  matchingOpening = activeOpenings.find(opening => opening.shift === shift)
  if (matchingOpening) {
    hasOpening = true
  }
}

// Línea ~45-50: Dependencia agregada
}, [closureDate, shift, activeOpenings])
```

## Testing Manual

### Caso de Prueba 1: Apertura de Fecha Anterior
```
1. Crear apertura: 14/02/2026 - Turno "Noche" - $50,000
2. Ir a cierre: 16/02/2026 (hoy)
3. Ver alerta azul con apertura de "Noche"
4. Seleccionar turno "Noche"
5. ✓ Ver alerta verde con detalles de la apertura
6. ✓ Efectivo esperado incluye $50,000 inicial
7. ✓ Puede cerrar sin errores
```

### Caso de Prueba 2: Múltiples Aperturas
```
1. Crear apertura: Turno "Mañana" - $10,000
2. Crear apertura: Turno "Tarde" - $15,000
3. Ir a cierre
4. Ver alerta azul con ambas aperturas
5. Seleccionar "Mañana"
6. ✓ Ver detalles de apertura "Mañana" ($10,000)
7. Seleccionar "Tarde"
8. ✓ Ver detalles de apertura "Tarde" ($15,000)
```

### Caso de Prueba 3: Turno Sin Apertura
```
1. Crear apertura: Turno "Mañana" - $10,000
2. Ir a cierre
3. Ver alerta azul con apertura "Mañana"
4. Seleccionar turno "Tarde"
5. ✓ Ver alerta roja: "No se encontró apertura"
6. ✓ Cálculo sin monto inicial
7. ✓ Puede cerrar pero con advertencia
```

## Beneficios del Fix

### 1. Consistencia
- La información mostrada coincide con la realidad
- No hay mensajes contradictorios
- El usuario confía en el sistema

### 2. Flexibilidad
- Permite cerrar aperturas de días anteriores
- No fuerza a cerrar el mismo día
- Útil para correcciones y ajustes

### 3. Transparencia
- El usuario ve exactamente qué apertura está cerrando
- Información completa antes de confirmar
- Cálculos visibles y verificables

### 4. Prevención de Errores
- Validación en tiempo real
- Alertas contextuales claras
- Guía al usuario en el proceso

## Documentación Relacionada

- `INFO_TURNOS_ACTIVOS_CIERRE.md`: Documentación completa de la funcionalidad
- `CONTROL_APERTURA_CIERRE_CAJA.md`: Control de botones mutuamente excluyentes
- `FIX_CALCULO_CIERRE_CAJA.md`: Fix del cálculo de efectivo esperado

## Estado

✅ **RESUELTO** - El bug está completamente corregido y probado.

El sistema ahora busca correctamente la apertura correspondiente al turno seleccionado, independientemente de la fecha de apertura, y muestra la información correcta al usuario.
