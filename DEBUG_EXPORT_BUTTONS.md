# Debug: Botones de Exportar Aparecen en Trial/Básico

## Problema
Los botones "Exportar" aparecen en los reportes básicos para usuarios con plan Trial o Básico, cuando solo deberían aparecer para usuarios Pro o Empresarial.

## Verificaciones Necesarias

### 1. Verificar Script de Planes en Supabase

**IMPORTANTE**: Debes ejecutar el script `scripts/seed-plans.sql` en Supabase SQL Editor.

1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido completo de `scripts/seed-plans.sql`
4. Ejecuta el script
5. Verifica que se ejecutó sin errores

**Verificar que los planes se crearon correctamente:**

```sql
-- Ejecuta esta query en Supabase SQL Editor
SELECT name, interval, features 
FROM plans 
WHERE is_active = true 
ORDER BY sort_order;
```

**Resultado esperado:**
- Trial: NO debe tener "Exportar a Excel" en features
- Básico (month y year): NO debe tener "Exportar a Excel" en features
- Pro (month y year): SÍ debe tener "Exportar a Excel" en features
- Empresarial (month y year): SÍ debe tener "Exportar a Excel" en features

### 2. Verificar Suscripción Activa del Usuario

```sql
-- Reemplaza 'TU_COMPANY_ID' con el ID de tu empresa
SELECT 
  s.id,
  s.status,
  p.name as plan_name,
  p.interval,
  p.features
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.company_id = 'TU_COMPANY_ID'
  AND s.status = 'active'
ORDER BY s.created_at DESC
LIMIT 1;
```

**Verifica:**
- ¿Qué plan tiene activo tu usuario?
- ¿Ese plan tiene "Exportar a Excel" en las features?

### 3. Verificar Console Logs en el Navegador

1. Abre la página de Analytics en tu navegador
2. Abre la consola del navegador (F12 → Console)
3. Busca estos logs:

```
canExportToExcel - Plan: [nombre del plan]
canExportToExcel - Features: [array de features]
canExportToExcel - Has Access: [true/false]
Analytics Page - Export Access: {allowed: true/false, message: ...}
BasicReports - canExport: [true/false]
```

**Analiza:**
- ¿Qué plan muestra?
- ¿Qué features tiene ese plan?
- ¿El valor de `canExport` es correcto?

### 4. Limpiar Caché del Navegador

Si los logs muestran valores correctos pero los botones siguen apareciendo:

1. Presiona Ctrl + Shift + R (o Cmd + Shift + R en Mac) para hacer hard refresh
2. O limpia el caché del navegador completamente
3. O abre en modo incógnito

### 5. Verificar Deployment en Vercel

1. Ve a tu dashboard de Vercel
2. Verifica que el último deployment se completó exitosamente
3. Verifica que el commit `177b89b` está deployado
4. Si no, espera unos minutos a que Vercel termine el deployment

## Soluciones Posibles

### Si el script NO se ejecutó en Supabase:
1. Ejecuta `scripts/seed-plans.sql` en Supabase SQL Editor
2. Espera a que Vercel redeploy (automático)
3. Limpia caché del navegador

### Si el usuario tiene un plan antiguo:
1. Verifica la suscripción activa con la query del punto 2
2. Si el plan es antiguo (no tiene las features correctas), actualiza manualmente:

```sql
-- Actualizar suscripción a un plan nuevo
UPDATE subscriptions 
SET plan_id = (
  SELECT id FROM plans 
  WHERE name = 'Trial' AND interval = 'month' AND is_active = true
  LIMIT 1
)
WHERE company_id = 'TU_COMPANY_ID' 
  AND status = 'active';
```

### Si los logs muestran `canExport: true` pero no debería:
1. Verifica que el plan en la base de datos NO tiene "Exportar" en features
2. Verifica que la función `hasFeature` está buscando correctamente
3. Revisa los logs de `canExportToExcel` para ver qué features tiene

## Código Implementado

### BasicReports Component
```typescript
{canExport && (
  <Button variant="outline" size="sm" onClick={handleExportProfitability}>
    <FileSpreadsheet className="mr-2 h-4 w-4" />
    Exportar
  </Button>
)}
```

### Analytics Page
```typescript
const [canExport, setCanExport] = useState(false);

// En checkAccess:
const exportAccess = await canExportToExcel(profile.company_id);
setCanExport(exportAccess.allowed);

// Al renderizar:
<BasicReports canExport={canExport} />
```

### plan-limits.ts
```typescript
export async function canExportToExcel(companyId: string) {
  const hasAccess = await hasFeature(companyId, "exportar");
  return {
    allowed: hasAccess,
    message: hasAccess ? undefined : "La exportación a Excel está disponible..."
  };
}
```

## Próximos Pasos

1. Ejecuta las verificaciones en orden
2. Comparte los resultados de los console.logs
3. Comparte el resultado de las queries SQL
4. Con esa información podremos identificar exactamente dónde está el problema
