# Control de Apertura y Cierre de Caja

## Problema Resuelto

Se necesitaba que los botones de "Nueva Apertura" y "Nuevo Cierre" se desactiven mutuamente para evitar:
- Crear múltiples aperturas sin cerrar la anterior
- Crear cierres sin tener una apertura activa

## Solución Implementada

### Lógica de Control

El sistema ahora verifica si hay aperturas pendientes de cierre:

```typescript
// Verifica si hay alguna apertura que NO tiene un cierre asociado
const hasOpenOpeningToday = openings.some(opening => {
  const hasMatchingClosure = closures.some(closure => 
    closure.opening_id === opening.id
  )
  return !hasMatchingClosure
})
```

### Comportamiento de los Botones

#### Botón "Nueva Apertura"
- **Habilitado**: Cuando NO hay aperturas pendientes de cierre
- **Deshabilitado**: Cuando hay una apertura sin cerrar
- **Icono**: 
  - `Plus` cuando está habilitado
  - `Lock` cuando está deshabilitado

#### Botón "Nuevo Cierre"
- **Habilitado**: Cuando hay una apertura pendiente de cierre
- **Deshabilitado**: Cuando NO hay aperturas sin cerrar
- **Icono**:
  - `Plus` cuando está habilitado
  - `Lock` cuando está deshabilitado

### Mensajes de Alerta

El sistema muestra alertas contextuales para guiar al usuario:

#### Cuando hay apertura pendiente (puede cerrar)
```
🔵 Hay una apertura de caja pendiente de cierre. 
   Debes cerrar la caja antes de crear una nueva apertura.
```

#### Cuando NO hay apertura pendiente (puede abrir)
```
🟡 No hay aperturas de caja pendientes. 
   Debes crear una apertura antes de hacer un cierre.
```

## Archivos Modificados

### `app/dashboard/cash-register/page.tsx`

**Cambios principales:**

1. **Conversión a Client Component**
   - Cambió de `async function` a componente cliente con `"use client"`
   - Agregado `useState` y `useEffect` para manejo de estado

2. **Importaciones agregadas**
   ```typescript
   import { Lock } from "lucide-react"
   import type { CashRegisterClosure, CashRegisterOpening } from "@/lib/types/erp"
   ```

3. **Estado del componente**
   ```typescript
   const [closures, setClosures] = useState<CashRegisterClosure[]>([])
   const [openings, setOpenings] = useState<CashRegisterOpening[]>([])
   const [loading, setLoading] = useState(true)
   ```

4. **Lógica de verificación**
   - Verifica aperturas sin cierre usando `opening_id`
   - Más confiable que comparar fechas y turnos

5. **Botones con estado condicional**
   ```typescript
   <Button 
     variant="outline"
     disabled={hasOpenOpeningToday}
   >
     {hasOpenOpeningToday && <Lock className="mr-2 h-4 w-4" />}
     {!hasOpenOpeningToday && <Plus className="mr-2 h-4 w-4" />}
     Nueva Apertura
   </Button>
   ```

6. **Alertas contextuales**
   - Tarjeta azul cuando hay apertura pendiente
   - Tarjeta amarilla cuando no hay apertura pendiente

## Flujo de Trabajo

### Escenario 1: Inicio del día
1. Usuario ve alerta amarilla: "No hay aperturas pendientes"
2. Botón "Nueva Apertura" está habilitado ✅
3. Botón "Nuevo Cierre" está deshabilitado 🔒
4. Usuario crea apertura de caja

### Escenario 2: Durante el día (apertura activa)
1. Usuario ve alerta azul: "Hay apertura pendiente"
2. Botón "Nueva Apertura" está deshabilitado 🔒
3. Botón "Nuevo Cierre" está habilitado ✅
4. Usuario puede hacer ventas normalmente

### Escenario 3: Fin del día
1. Usuario ve alerta azul: "Hay apertura pendiente"
2. Botón "Nuevo Cierre" está habilitado ✅
3. Usuario crea cierre de caja
4. Sistema asocia el cierre con la apertura (`opening_id`)

### Escenario 4: Después del cierre
1. Usuario ve alerta amarilla: "No hay aperturas pendientes"
2. Botón "Nueva Apertura" está habilitado ✅
3. Botón "Nuevo Cierre" está deshabilitado 🔒
4. Ciclo se repite

## Ventajas de la Implementación

### 1. Prevención de Errores
- No se pueden crear múltiples aperturas simultáneas
- No se pueden crear cierres sin apertura previa
- Flujo de trabajo claro y guiado

### 2. Feedback Visual
- Iconos cambian según el estado (Plus/Lock)
- Alertas contextuales explican el estado actual
- Botones deshabilitados visualmente distintos

### 3. Integridad de Datos
- Usa `opening_id` para vincular aperturas y cierres
- Verificación confiable basada en relaciones de BD
- No depende de comparaciones de fechas/turnos

### 4. Experiencia de Usuario
- Mensajes claros y en español
- Guía al usuario sobre qué hacer
- Previene confusión sobre el flujo correcto

## Consideraciones Técnicas

### Relación Apertura-Cierre
El sistema usa el campo `opening_id` en la tabla `cash_register_closures` para:
- Vincular cada cierre con su apertura correspondiente
- Verificar si una apertura ya fue cerrada
- Mantener trazabilidad del flujo de caja

### Carga de Datos
- Los datos se cargan al montar el componente
- Se usa `useEffect` para la carga inicial
- Estado de loading mientras se obtienen los datos

### Tipos TypeScript
- Usa tipos definidos en `lib/types/erp.ts`
- `CashRegisterOpening` y `CashRegisterClosure`
- Type-safe en todo el componente

## Casos Edge

### ¿Qué pasa si hay múltiples aperturas sin cerrar?
- El sistema detecta si HAY AL MENOS UNA apertura sin cerrar
- Desactiva el botón de nueva apertura
- Permite crear cierre para cualquiera de las aperturas abiertas

### ¿Qué pasa si se elimina una apertura?
- Si la apertura no tiene cierre asociado, se puede eliminar
- Si tiene cierre asociado, el `opening_id` se pone en NULL (ON DELETE SET NULL)
- El sistema sigue funcionando correctamente

### ¿Qué pasa con cierres antiguos sin opening_id?
- Los cierres antiguos (antes de esta feature) tienen `opening_id = NULL`
- No afectan la lógica de verificación
- El sistema es retrocompatible

## Testing Recomendado

1. **Crear apertura sin cierres previos**
   - Verificar que botón apertura se desactiva
   - Verificar que botón cierre se activa
   - Verificar alerta azul aparece

2. **Crear cierre con apertura activa**
   - Verificar que cierre se asocia con apertura
   - Verificar que botón apertura se activa
   - Verificar que botón cierre se desactiva
   - Verificar alerta amarilla aparece

3. **Intentar crear apertura con apertura activa**
   - Verificar que botón está deshabilitado
   - Verificar que no se puede hacer clic

4. **Intentar crear cierre sin apertura**
   - Verificar que botón está deshabilitado
   - Verificar que no se puede hacer clic

## Mejoras Futuras Posibles

1. **Confirmación de cierre**
   - Modal de confirmación antes de cerrar
   - Resumen de la apertura que se va a cerrar

2. **Selector de apertura**
   - Si hay múltiples aperturas abiertas
   - Permitir seleccionar cuál cerrar

3. **Notificaciones**
   - Recordatorio si hay apertura sin cerrar por mucho tiempo
   - Alerta si se intenta salir con apertura activa

4. **Historial visual**
   - Timeline de aperturas y cierres
   - Gráfico de flujo de caja por período
