# Migración de Suscripciones a Nuevos Planes

## Problema Identificado

Los usuarios tienen suscripciones activas a planes Trial antiguos que tienen features diferentes a los nuevos planes. Esto causa que los botones de "Exportar" aparezcan para usuarios Trial/Básico cuando no deberían.

## Solución

Migrar todas las suscripciones activas de planes antiguos a los nuevos planes.

## Pasos para Migrar

### 1. Verificar Planes Actuales

Primero, verifica qué planes tienes en la base de datos:

```sql
-- Ver todos los planes (activos e inactivos)
SELECT 
  id,
  name,
  interval,
  is_active,
  features,
  sort_order
FROM plans
ORDER BY sort_order;
```

**Resultado esperado:**
- Deberías ver planes duplicados: algunos con `is_active = false` (antiguos) y otros con `is_active = true` (nuevos)
- Los planes nuevos deben tener las features correctas según `scripts/seed-plans.sql`

### 2. Verificar Suscripciones Actuales

```sql
-- Ver qué planes están usando las suscripciones activas
SELECT 
  COUNT(*) as total,
  p.name,
  p.interval,
  p.is_active as plan_activo,
  p.features
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
GROUP BY p.id, p.name, p.interval, p.is_active, p.features;
```

**Problema:** Si ves suscripciones con `plan_activo = false`, esas están usando planes antiguos.

### 3. Ejecutar Script de Migración

Ejecuta el script completo en Supabase SQL Editor:

```bash
scripts/070_migrate_subscriptions_to_new_plans.sql
```

Este script:
1. Actualiza todas las suscripciones activas para que apunten a los nuevos planes
2. Mantiene el mismo tipo de plan (Trial → Trial, Básico → Básico, etc.)
3. Mantiene el mismo intervalo (mensual → mensual, anual → anual)
4. Muestra un resumen al final

### 4. Verificar Migración

Después de ejecutar el script, verifica que todas las suscripciones activas usan planes activos:

```sql
-- Esta query NO debería retornar ninguna fila
SELECT 
  s.id as subscription_id,
  s.company_id,
  p.name as plan_name,
  p.interval,
  p.is_active
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
  AND p.is_active = false;
```

**Resultado esperado:** 0 filas (ninguna suscripción activa usando planes inactivos)

### 5. Verificar Features de Planes

```sql
-- Verificar que Trial y Básico NO tienen "Exportar a Excel"
SELECT 
  name,
  interval,
  features
FROM plans
WHERE is_active = true
  AND name IN ('Trial', 'Básico')
ORDER BY sort_order;
```

**Resultado esperado:**
- Trial: NO debe tener "Exportar a Excel" en features
- Básico: NO debe tener "Exportar a Excel" en features

### 6. Probar en el Navegador

1. Limpia el caché del navegador (Ctrl + Shift + R)
2. Recarga la página de Analytics
3. Verifica que los botones "Exportar" NO aparecen en reportes básicos para usuarios Trial/Básico
4. Verifica los console.logs:
   - `canExportToExcel - Plan: Trial` (o Básico)
   - `canExportToExcel - Has Access: false`
   - `BasicReports - canExport: false`

## Alternativa: Migración Manual

Si prefieres migrar manualmente una suscripción específica:

```sql
-- Migrar una suscripción específica a nuevo plan Trial
UPDATE subscriptions
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Trial' 
    AND interval = 'month' 
    AND is_active = true
  LIMIT 1
)
WHERE id = 'ID_DE_LA_SUSCRIPCION';
```

## Limpieza (Opcional)

Después de verificar que todo funciona, puedes eliminar los planes antiguos:

```sql
-- CUIDADO: Solo ejecuta esto después de verificar que todas las suscripciones se migraron
DELETE FROM plans WHERE is_active = false;
```

## Resumen de Features por Plan

### Trial
- ❌ NO tiene "Exportar a Excel"
- ❌ NO tiene "Órdenes de compra"
- ❌ NO tiene "Gestión de proveedores"
- ❌ NO tiene "Reportes avanzados"
- ❌ NO tiene "Reportes completos"

### Básico
- ❌ NO tiene "Exportar a Excel"
- ❌ NO tiene "Órdenes de compra"
- ❌ NO tiene "Gestión de proveedores"
- ❌ NO tiene "Reportes avanzados"
- ❌ NO tiene "Reportes completos"

### Pro
- ✅ SÍ tiene "Exportar a Excel"
- ✅ SÍ tiene "Órdenes de compra"
- ✅ SÍ tiene "Gestión de proveedores"
- ✅ SÍ tiene "Reportes avanzados"
- ❌ NO tiene "Reportes completos"

### Empresarial
- ✅ SÍ tiene "Exportar a Excel"
- ✅ SÍ tiene "Órdenes de compra"
- ✅ SÍ tiene "Gestión de proveedores"
- ✅ SÍ tiene "Reportes avanzados"
- ✅ SÍ tiene "Reportes completos"

## Troubleshooting

### Los botones siguen apareciendo después de migrar

1. Verifica que ejecutaste el script de migración
2. Limpia el caché del navegador completamente
3. Verifica los console.logs en el navegador
4. Verifica que la suscripción del usuario apunta al plan correcto:

```sql
-- Reemplaza con tu company_id
SELECT 
  s.status,
  p.name,
  p.interval,
  p.is_active,
  p.features
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.company_id = 'TU_COMPANY_ID'
  AND s.status = 'active';
```

### Error al ejecutar el script

Si obtienes un error, verifica:
1. Que ejecutaste `seed-plans.sql` primero
2. Que los nuevos planes existen con `is_active = true`
3. Que hay suscripciones activas para migrar

## Contacto

Si tienes problemas con la migración, comparte:
1. El resultado de las queries de verificación
2. Los console.logs del navegador
3. Cualquier mensaje de error
