# Fix: Contador de Reparaciones Activas por Técnico

## Problema
El contador de "Reparaciones Activas" en la tabla de técnicos siempre mostraba 0, incluso cuando un técnico tenía reparaciones asignadas que no estaban entregadas o canceladas.

## Causa Raíz
1. La función `getTechnicians()` no estaba obteniendo ni calculando el conteo de reparaciones activas
2. El tipo `Technician` no incluía el campo `active_repairs_count`
3. La función `getTechnicianStats()` tenía una sintaxis incorrecta en la consulta SQL

## Solución Implementada

### 1. Actualización de `getTechnicians()` (lib/actions/technicians.ts)
- Modificada la consulta para incluir las órdenes de reparación relacionadas
- Agregado cálculo del conteo de reparaciones activas (excluyendo estados 'delivered' y 'cancelled')
- El conteo se calcula en el servidor y se incluye en cada objeto técnico

```typescript
.select(`
  *,
  repair_orders!repair_orders_technician_id_fkey (
    id,
    status
  )
`)
```

### 2. Actualización del tipo `Technician` (lib/types/erp.ts)
- Agregado campo opcional `active_repairs_count?: number`
- Este campo contiene el número de reparaciones activas asignadas al técnico

### 3. Fix en `getTechnicianStats()` (lib/actions/technicians.ts)
- Corregida la sintaxis de la consulta `.not('status', 'in', '("delivered","cancelled")')`
- Antes usaba sintaxis incorrecta sin comillas en los valores

## Estados Considerados "Activos"
Una reparación se considera activa si su estado es:
- `received` - Recibido
- `diagnosing` - En Diagnóstico
- `waiting_parts` - Esperando Repuestos
- `repairing` - En Reparación
- `repaired` - Reparado

Estados NO activos:
- `delivered` - Entregado
- `cancelled` - Cancelado

## Verificación
Para verificar que el fix funciona correctamente:

1. Ejecutar el script `DEBUG_TECHNICIAN_ACTIVE_REPAIRS.sql` en Supabase
2. Verificar que los conteos coincidan con las reparaciones asignadas
3. En la interfaz, el contador debe mostrar el número correcto de reparaciones activas

## Archivos Modificados
- `lib/actions/technicians.ts` - Función getTechnicians() y getTechnicianStats()
- `lib/types/erp.ts` - Tipo Technician
- `DEBUG_TECHNICIAN_ACTIVE_REPAIRS.sql` - Script de diagnóstico (nuevo)

## Impacto
- El contador ahora muestra correctamente el número de reparaciones activas
- No hay cambios en la base de datos
- No afecta otras funcionalidades del módulo de reparaciones
