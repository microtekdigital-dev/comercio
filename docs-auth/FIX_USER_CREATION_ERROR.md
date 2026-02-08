# Fix: Database Error Saving New User

## Problema

Al intentar crear un nuevo usuario, aparece el error: **"Database error saving new user"**

## Causa

Falta el trigger de Supabase que automáticamente crea:
1. La empresa (company)
2. El perfil del usuario (profile)
3. La suscripción Trial

Cuando un usuario se registra en Supabase Auth, necesita un trigger que ejecute estas acciones automáticamente.

## Solución

Ejecuta el script `scripts/080_fix_user_creation_trigger.sql` en Supabase SQL Editor.

### Pasos:

1. **Abre Supabase SQL Editor**
   - Ve a tu proyecto en Supabase
   - Navega a SQL Editor

2. **Ejecuta el script**
   - Copia y pega el contenido completo de `scripts/080_fix_user_creation_trigger.sql`
   - Haz clic en "Run"

3. **Verifica que se ejecutó correctamente**
   - No deberías ver errores
   - El trigger `on_auth_user_created` debería estar creado

## Qué hace el trigger

El trigger `handle_new_user()` se ejecuta automáticamente cuando se crea un usuario en `auth.users` y:

### Para usuarios nuevos (sin invitación):
1. Crea una nueva empresa con el nombre proporcionado
2. Crea un perfil de usuario con rol "admin"
3. Crea una suscripción Trial de 14 días
4. Marca que el usuario ya usó su trial

### Para usuarios invitados (con token de invitación):
1. Busca la invitación por token
2. Crea el perfil del usuario en la empresa existente
3. Asigna el rol especificado en la invitación (admin o employee)
4. Marca la invitación como aceptada

## Verificar que funciona

Después de ejecutar el script, intenta crear un nuevo usuario:

1. Ve a `/auth/sign-up`
2. Completa el formulario
3. Haz clic en "Create account"
4. Deberías ver el mensaje de "Check your email" sin errores

## Verificar en la base de datos

Puedes verificar que el trigger se creó correctamente:

```sql
-- Ver el trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Ver la función
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

## Troubleshooting

### Error: "relation auth.users does not exist"
- Asegúrate de estar ejecutando el script en el proyecto correcto de Supabase
- Verifica que tienes permisos de administrador

### Error: "permission denied"
- El script incluye los permisos necesarios
- Si persiste, contacta al administrador de Supabase

### El trigger se ejecuta pero sigue dando error
1. Verifica que la tabla `plans` tiene un plan Trial activo:
```sql
SELECT * FROM plans WHERE name = 'Trial' AND is_active = true;
```

2. Si no existe, ejecuta primero `scripts/seed-plans.sql`

3. Verifica los logs de Supabase:
   - Ve a Logs → Database
   - Busca errores relacionados con `handle_new_user`

## Notas importantes

- Este trigger es **SECURITY DEFINER**, lo que significa que se ejecuta con permisos elevados
- El trigger maneja errores y los registra en los logs de Supabase
- Si hay un error, se muestra como "Database error saving new user" al usuario
- Los detalles del error se registran en los logs de Supabase para debugging

## Después de ejecutar el script

1. Intenta crear un nuevo usuario
2. Verifica que se crea correctamente
3. Verifica que el usuario tiene:
   - Una empresa creada
   - Un perfil con rol "admin"
   - Una suscripción Trial activa

```sql
-- Verificar usuario recién creado (reemplaza con el email del usuario)
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  c.name as company_name,
  s.status as subscription_status,
  pl.name as plan_name
FROM profiles p
JOIN companies c ON p.company_id = c.id
LEFT JOIN subscriptions s ON s.company_id = c.id AND s.status = 'active'
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email = 'usuario@ejemplo.com';
```
