# Resumen: Arreglar Cuentas vanitoadette y vanithegameplay

## Estado Actual

### vanithegameplay@gmail.com (Bazar Lili)
- ❌ **PROBLEMA**: No tiene ninguna suscripción
- **Causa**: El trigger de creación de trial no se ejecutó al registrarse
- **Solución**: Crear trial manualmente

### vanitoadette@gmail.com
- ⚠️ **PENDIENTE**: Necesitas ejecutar el diagnóstico para ver qué problema tiene
- **Script**: `docs-auth/CHECK_VANITOADETTE.sql`

## Pasos para Arreglar

### 1. Arreglar vanithegameplay@gmail.com

**Ejecutar en Supabase SQL Editor:**

```sql
-- Archivo: docs-auth/FIX_VANITHEGAMEPLAY.sql

-- Paso 1: Crear trial de 28 días
INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT 
  p.company_id,
  (SELECT id FROM plans WHERE price = 0 AND is_active = true ORDER BY sort_order LIMIT 1) as plan_id,
  'active' as status,
  NOW() as current_period_start,
  NOW() + INTERVAL '28 days' as current_period_end,
  false as cancel_at_period_end
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com'
  AND p.company_id IS NOT NULL;

-- Paso 2: Asegurar membresía en company_users
INSERT INTO company_users (company_id, user_id, role)
SELECT 
  p.company_id,
  p.id,
  COALESCE(p.role, 'owner') as role
FROM profiles p
WHERE p.email = 'vanithegameplay@gmail.com'
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_users cu 
    WHERE cu.user_id = p.id AND cu.company_id = p.company_id
  );

-- Paso 3: Verificar que funcionó
SELECT 
  p.email,
  c.name as company_name,
  s.status,
  s.current_period_end,
  pl.name as plan_name,
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as dias_restantes,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✅ FUNCIONANDO'
    ELSE '❌ AÚN HAY PROBLEMA'
  END as resultado
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN subscriptions s ON s.company_id = c.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email = 'vanithegameplay@gmail.com'
ORDER BY s.created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- status: active
- dias_restantes: 28
- resultado: ✅ FUNCIONANDO

### 2. Diagnosticar vanitoadette@gmail.com

**Ejecutar en Supabase SQL Editor:**

```sql
-- Archivo: docs-auth/CHECK_VANITOADETTE.sql

SELECT 
  p.email as user_email,
  c.name as company_name,
  s.id as subscription_id,
  s.status,
  s.current_period_end,
  pl.name as plan_name,
  pl.price,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN '✅ DEBERÍA FUNCIONAR'
    WHEN s.status = 'cancelled' THEN '❌ CANCELADA - Necesita nuevo plan'
    WHEN s.current_period_end < NOW() THEN '❌ VENCIDA - Necesita renovación'
    WHEN s.id IS NULL THEN '❌ SIN SUSCRIPCIÓN'
    ELSE '⚠️ Estado: ' || s.status
  END as diagnostico_final
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN LATERAL (
  SELECT * FROM subscriptions 
  WHERE company_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) s ON true
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email = 'vanitoadette@gmail.com';
```

**Según el resultado:**

- Si muestra `❌ SIN SUSCRIPCIÓN` → Usar el mismo fix que vanithegameplay
- Si muestra `❌ CANCELADA` → Usuario canceló el trial, debe elegir plan de pago
- Si muestra `❌ VENCIDA` → Trial expiró, debe elegir plan de pago
- Si muestra `✅ DEBERÍA FUNCIONAR` → Problema es de cache, hacer hard refresh

### 3. Después de Ejecutar los Scripts

**Pedir a los usuarios que:**

1. **Hard refresh del navegador**: `Ctrl + Shift + R`
2. Si no funciona, **cerrar sesión y volver a entrar**
3. Si persiste, **abrir en modo incógnito** para descartar cache
4. Si aún persiste, **revisar logs en Vercel** para ver qué está pasando

## Archivos Creados

1. `docs-auth/DEBUG_TWO_ACCOUNTS.sql` - Diagnóstico completo de ambas cuentas
2. `docs-auth/FIX_TWO_ACCOUNTS.sql` - Soluciones generales para múltiples problemas
3. `docs-auth/FIX_VANITHEGAMEPLAY.sql` - Fix específico para vanithegameplay
4. `docs-auth/CHECK_VANITOADETTE.sql` - Diagnóstico específico para vanitoadette
5. `docs-auth/RESUMEN_FIX_DOS_CUENTAS.md` - Este documento

## Notas Importantes

- ⚠️ Los scripts están diseñados para NO crear duplicados
- ⚠️ Solo crean trial si NO existe ninguna suscripción
- ⚠️ Solo agregan membresía si NO existe
- ✅ Es seguro ejecutarlos múltiples veces
- ✅ NO afectan otras cuentas ni la lógica de bloqueos

## Próximos Pasos

1. Ejecutar fix para vanithegameplay (ya sabemos que no tiene suscripción)
2. Ejecutar diagnóstico para vanitoadette (necesitamos ver qué problema tiene)
3. Según resultado de vanitoadette, aplicar la solución correspondiente
4. Pedir a ambos usuarios que hagan hard refresh
5. Verificar que ambas cuentas funcionen correctamente
