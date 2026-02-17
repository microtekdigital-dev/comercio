# Solución: Problema de Acceso con Google Auth

## Problema
Usuario registrado con Google Auth no puede acceder a la aplicación después de hacer login, a pesar de tener una suscripción activa.

## Diagnóstico Realizado
- ✓ Usuario existe en la base de datos
- ✓ Suscripción Trial activa (válida hasta 27 feb 2026)
- ✓ Status: `active`
- ? Posible problema con permisos RLS o configuración de perfil

## Posibles Causas

### 1. Company ID NULL en Profiles
Si el perfil del usuario no tiene `company_id` asignado, el sistema no puede verificar la suscripción.

### 2. Falta Membresía en company_users
La tabla `company_users` debe tener un registro que vincule al usuario con su empresa.

### 3. Políticas RLS Bloqueando Acceso
Las políticas de Row Level Security pueden estar bloqueando la consulta de suscripción.

### 4. Suscripciones Duplicadas
Múltiples suscripciones activas pueden causar conflictos en la verificación.

### 5. Problema de Timezone en Fechas
La comparación de `current_period_end` con la fecha actual puede estar fallando por diferencias de timezone.

## Solución Paso a Paso

### PASO 1: Ejecutar Diagnóstico Completo

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Abre el archivo `DEBUG_GOOGLE_AUTH_PROBLEMA_ESPECIFICO.sql`
4. **IMPORTANTE**: Reemplaza `'TU_EMAIL_AQUI@gmail.com'` con tu email real en TODAS las líneas donde aparece
5. Ejecuta el script completo
6. Revisa los resultados de cada sección

### PASO 2: Interpretar Resultados del Diagnóstico

Busca estos indicadores en los resultados:

#### ✓ TODO BIEN:
- `company_id` tiene un valor UUID
- `esta_vigente` = true
- `diagnostico` = "✓ DEBERÍA TENER ACCESO"
- `total_suscripciones` = 1
- Existe en `company_users`

#### ✗ PROBLEMAS:
- `company_id` = NULL → Ejecutar SOLUCIÓN 1
- `esta_vigente` = false → Ejecutar SOLUCIÓN 3
- `total_suscripciones` > 1 → Ejecutar SOLUCIÓN 4
- No existe en `company_users` → Ejecutar SOLUCIÓN 2

### PASO 3: Aplicar Soluciones

1. Abre el archivo `FIX_GOOGLE_AUTH_ACCESO_COMPLETO.sql`
2. **IMPORTANTE**: Reemplaza `'TU_EMAIL_AQUI@gmail.com'` con tu email real en TODAS las líneas donde aparece
3. Ejecuta el script completo (incluye todas las soluciones)
4. Revisa los mensajes de NOTICE que aparecen

### PASO 4: Verificar la Solución

Después de ejecutar el fix:

1. Cierra sesión en la aplicación
2. Vuelve a iniciar sesión con Google Auth
3. Deberías poder acceder al dashboard

Si aún no funciona, revisa la sección "Verificación Final" del script de fix.

## Soluciones Individuales

### SOLUCIÓN 1: Crear Empresa y Asignar company_id
```sql
-- Crea una empresa automáticamente y la asigna al perfil
-- Se ejecuta automáticamente en el script de fix
```

**Qué hace:**
- Crea una nueva empresa con el nombre "Empresa de [tu-email]"
- Asigna el `company_id` al perfil del usuario
- Establece el rol como `owner`

### SOLUCIÓN 2: Crear Membresía en company_users
```sql
-- Asegura que el usuario esté vinculado a su empresa
-- Se ejecuta automáticamente en el script de fix
```

**Qué hace:**
- Crea un registro en `company_users` vinculando al usuario con su empresa
- Copia el rol desde `profiles`

### SOLUCIÓN 3: Crear Suscripción Trial
```sql
-- Crea una suscripción Trial si no existe ninguna activa
-- Se ejecuta automáticamente en el script de fix
```

**Qué hace:**
- Verifica si hay suscripciones activas
- Si no hay ninguna, crea una suscripción Trial válida por 14 días
- Status: `active`

### SOLUCIÓN 4: Limpiar Suscripciones Duplicadas
```sql
-- Cancela suscripciones duplicadas, mantiene solo la más reciente
-- Se ejecuta automáticamente en el script de fix
```

**Qué hace:**
- Identifica suscripciones duplicadas
- Mantiene solo la más reciente
- Cancela las demás

## Verificación Manual

Si después de aplicar las soluciones aún no funciona, verifica manualmente:

```sql
-- Verificar estado final
SELECT 
  u.email,
  p.company_id,
  p.role,
  s.status,
  s.current_period_end,
  s.current_period_end > NOW() as vigente
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN subscriptions s ON s.company_id = p.company_id
WHERE u.email = 'tu-email@gmail.com';
```

**Resultado esperado:**
- `company_id`: UUID válido (no NULL)
- `role`: 'owner' o 'admin'
- `status`: 'active'
- `vigente`: true

## Problemas Conocidos y Soluciones Adicionales

### Problema: "Pantalla en blanco después de login"

**Causa:** El componente `SubscriptionGuard` está bloqueando el acceso.

**Solución:**
1. Verifica que la suscripción tenga `status = 'active'`
2. Verifica que `current_period_end > NOW()`
3. Revisa los logs del navegador (F12 → Console)

### Problema: "Error de permisos RLS"

**Causa:** Las políticas RLS están bloqueando la consulta.

**Solución:**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
```

Si las políticas están mal configuradas, contacta al administrador del sistema.

### Problema: "Suscripción aparece como expirada"

**Causa:** Problema de timezone en la comparación de fechas.

**Solución:**
```sql
-- Extender la suscripción Trial
UPDATE subscriptions
SET current_period_end = NOW() + INTERVAL '14 days'
WHERE company_id = (
  SELECT company_id FROM profiles WHERE id = (
    SELECT id FROM auth.users WHERE email = 'tu-email@gmail.com'
  )
)
AND status = 'active';
```

## Logs y Debugging

Para ver logs detallados del proceso de autenticación:

1. Abre el navegador en modo desarrollador (F12)
2. Ve a la pestaña "Console"
3. Intenta hacer login
4. Busca mensajes que empiecen con `[DashboardLayout]`

Estos logs muestran:
- Company ID encontrado
- Si se encontró suscripción
- Status de la suscripción
- Fecha de expiración
- Si está expirada o no

## Contacto y Soporte

Si después de seguir todos estos pasos aún no puedes acceder:

1. Toma capturas de pantalla de:
   - Resultados del diagnóstico
   - Mensajes del script de fix
   - Logs del navegador (Console)
   - Verificación manual

2. Comparte esta información para análisis adicional

## Prevención

Para evitar este problema en el futuro:

1. El trigger `handle_new_user` debe crear automáticamente:
   - Perfil con `company_id`
   - Empresa
   - Membresía en `company_users`
   - Suscripción Trial

2. Verificar que el trigger esté activo:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

3. Si el trigger no existe, ejecutar:
```sql
-- Ver archivo: scripts/080_fix_user_creation_trigger.sql
```
