# Fix: No puedo acceder con Google Auth

## Problema
Te registraste con Google Auth pero al intentar acceder a la app, no puedes entrar al dashboard.

## Causa
Cuando te registras con Google Auth, el sistema crea tu usuario en Supabase Auth, pero el trigger automático que debería crear tu empresa, perfil y suscripción de prueba puede haber fallado o no ejecutarse correctamente.

## Síntomas
- Puedes hacer login con Google
- Te redirige al dashboard
- Ves un mensaje de "Sin Suscripción Activa" o pantalla en blanco
- No puedes acceder a ninguna funcionalidad

## Solución

### Paso 1: Diagnosticar el problema

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Abre el archivo `DEBUG_GOOGLE_AUTH_USER.sql`
5. **IMPORTANTE**: Reemplaza `'TU_EMAIL_AQUI@gmail.com'` con tu email de Google en TODAS las consultas
6. Ejecuta el script completo
7. Anota el `id` que aparece en la primera consulta (es tu USER_ID)

### Paso 2: Aplicar la solución

1. Abre el archivo `FIX_GOOGLE_AUTH_USER.sql`
2. **IMPORTANTE**: Reemplaza `'USER_ID_AQUI'` con el ID que anotaste en el paso anterior
   - Busca todas las ocurrencias (hay 2)
   - Ejemplo: `'123e4567-e89b-12d3-a456-426614174000'`
3. Ejecuta el script completo en SQL Editor
4. Deberías ver mensajes como:
   ```
   NOTICE: Procesando usuario: tu@email.com (user-id)
   NOTICE: Perfil creado para usuario: user-id
   NOTICE: Empresa creada: company-id
   NOTICE: Suscripción Trial creada para empresa: company-id
   NOTICE: Proceso completado exitosamente
   ```

### Paso 3: Verificar y acceder

1. Cierra sesión en la app (si estás logueado)
2. Vuelve a hacer login con Google
3. Deberías poder acceder al dashboard
4. Tendrás una suscripción Trial de 7 días activa

## ¿Qué hace el script de fix?

El script:
1. Verifica si tienes un perfil en la tabla `profiles`
2. Si no existe, crea:
   - Una empresa con tu nombre (basado en tu email)
   - Un perfil de administrador vinculado a esa empresa
3. Verifica si tienes una suscripción activa
4. Si no existe, crea:
   - Una suscripción Trial de 7 días
   - Estado: activo
   - Plan: Trial (gratuito)

## Prevenir este problema en el futuro

El problema ocurre porque el trigger `handle_new_user` puede fallar. Para verificar que funcione:

```sql
-- Ver el trigger actual
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%handle_new_user%';
```

Si el trigger no existe o está deshabilitado, ejecuta el script:
```
scripts/080_fix_user_creation_trigger.sql
```

## Alternativa: Crear manualmente desde la UI

Si prefieres no usar SQL:

1. Ve a Supabase Dashboard
2. Ve a "Table Editor"
3. Crea manualmente:
   - Una empresa en la tabla `companies`
   - Un perfil en la tabla `profiles` con tu user_id
   - Una suscripción en la tabla `subscriptions`

Pero es más fácil y seguro usar el script SQL.

## Soporte

Si después de seguir estos pasos aún no puedes acceder:

1. Verifica los logs del navegador (F12 > Console)
2. Verifica los logs de Supabase (Dashboard > Logs)
3. Comparte el error específico que ves

## Notas Importantes

- El script es seguro y solo crea datos si no existen
- No modifica ni elimina datos existentes
- Puedes ejecutarlo múltiples veces sin problemas
- La suscripción Trial dura 7 días
- Después de los 7 días, deberás seleccionar un plan de pago
