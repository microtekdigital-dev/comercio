# 🔧 Solución Alternativa: Bypass RLS en Layout

## 🎯 PROBLEMA

Las políticas RLS en `profiles` y `company_users` están bloqueando el acceso incluso con políticas correctas configuradas.

## ✅ SOLUCIÓN ALTERNATIVA

Usar el cliente admin de Supabase (que bypasea RLS) para las queries críticas del layout, mientras mantenemos RLS habilitado para seguridad.

## 📝 CAMBIOS NECESARIOS

### Paso 1: Modificar `app/dashboard/layout.tsx`

Reemplaza la sección que obtiene el perfil:

**ANTES:**
```typescript
// Get user's company and subscription status
const supabase = await createClient()
const { data: profile } = await supabase
  .from("profiles")
  .select("company_id, role")
  .eq("id", user.id)
  .single()
```

**DESPUÉS:**
```typescript
// Get user's company and subscription status
// Usar admin client para bypass RLS en esta query crítica
const { createAdminClient } = await import("@/lib/supabase/admin")
const adminClient = createAdminClient()
const { data: profile } = await adminClient
  .from("profiles")
  .select("company_id, role")
  .eq("id", user.id)
  .single()
```

### Paso 2: Modificar `lib/actions/plans.ts`

En la función `ensureCompanyUserMembership`, usar admin client:

**ANTES:**
```typescript
async function ensureCompanyUserMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId: string,
  role?: string | null,
) {
  const { data: existing, error: existingError } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .limit(1)
    .single();
```

**DESPUÉS:**
```typescript
async function ensureCompanyUserMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId: string,
  role?: string | null,
) {
  // Usar admin client para bypass RLS en esta verificación
  const adminClient = createAdminClient()
  const { data: existing, error: existingError } = await adminClient
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .limit(1)
    .single();
```

Y también el INSERT:

**ANTES:**
```typescript
const { error: insertError } = await supabase.from("company_users").insert({
  company_id: companyId,
  user_id: userId,
  role: role ?? null,
});
```

**DESPUÉS:**
```typescript
const { error: insertError } = await adminClient.from("company_users").insert({
  company_id: companyId,
  user_id: userId,
  role: role ?? null,
});
```

## 🔑 VENTAJAS DE ESTA SOLUCIÓN

1. ✅ RLS permanece habilitado en todas las tablas (seguridad)
2. ✅ El dashboard funciona correctamente
3. ✅ Solo las queries críticas del sistema usan admin client
4. ✅ Las queries de usuarios normales siguen usando RLS
5. ✅ No compromete la seguridad general

## ⚠️ IMPORTANTE

Esta solución es un **workaround** mientras identificamos por qué las políticas RLS no funcionan correctamente. 

El admin client bypasea RLS, por lo que:
- Solo úsalo en queries del sistema (layout, verificaciones internas)
- NUNCA lo uses en queries que vienen directamente de input del usuario
- Mantén RLS habilitado en todas las tablas

## 🧪 PRUEBA

Después de aplicar estos cambios:
1. Reinicia el servidor de desarrollo
2. Limpia el caché del navegador
3. Inicia sesión
4. El dashboard debería cargar correctamente

## 📊 DIAGNÓSTICO PENDIENTE

Mientras tanto, ejecuta el script de diagnóstico para entender por qué las políticas RLS no funcionan:

```sql
\i docs-auth/DIAGNOSTIC_RLS_FAILURE.sql
```

Comparte los resultados para identificar la causa raíz.

---

**Nota:** Esta es una solución temporal. Lo ideal es que las políticas RLS funcionen correctamente sin necesidad de usar admin client.
