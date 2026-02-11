# Solución: RLS de Companies Bloqueando Layout

## 🔴 Problema

Cuando habilitas RLS (Row Level Security) en la tabla `companies`, el layout del dashboard se bloquea y los usuarios no pueden acceder.

## 🔍 Causa Raíz

Las políticas RLS originales tienen problemas:

1. **Política SELECT demasiado restrictiva**: La política original usa una subconsulta que puede fallar si:
   - El usuario no tiene un profile correctamente configurado
   - Hay problemas de timing en la autenticación
   - La sesión de Supabase no está inicializada correctamente

2. **Falta de políticas para operaciones específicas**: No hay políticas claras para cada operación (SELECT, INSERT, UPDATE, DELETE)

## ✅ Solución

He creado el script `FIX_COMPANIES_RLS.sql` que:

### 1. Elimina políticas problemáticas
```sql
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.companies;
```

### 2. Crea políticas RLS correctas

#### Política SELECT (Ver companies)
```sql
CREATE POLICY "users_select_own_company" ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id 
      FROM public.profiles 
      WHERE id = auth.uid()
      AND company_id IS NOT NULL
    )
  );
```
- Permite que usuarios autenticados vean su company
- Usa `auth.uid()` para obtener el ID del usuario actual
- Verifica que el usuario tenga un profile con company_id válido

#### Política INSERT (Crear companies)
```sql
CREATE POLICY "authenticated_insert_company" ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
```
- Necesaria para el flujo de registro de nuevos usuarios
- Permite que cualquier usuario autenticado cree una company

#### Política UPDATE (Actualizar companies)
```sql
CREATE POLICY "admins_update_own_company" ON public.companies
  FOR UPDATE
  TO authenticated
  USING (...)
  WITH CHECK (...);
```
- Solo admins pueden actualizar su company
- Usa USING y WITH CHECK para validar antes y después

#### Política DELETE (Eliminar companies)
```sql
CREATE POLICY "admins_delete_own_company" ON public.companies
  FOR DELETE
  TO authenticated
  USING (...);
```
- Solo admins pueden eliminar su company
- Generalmente no se usa en producción

## 📋 Pasos para Aplicar (VERSIÓN SEGURA)

### ⚠️ IMPORTANTE: Usa el script seguro
**Archivo recomendado**: `FIX_COMPANIES_RLS_SAFE.sql`

Este script tiene:
- ✅ Transacciones con rollback automático
- ✅ Validaciones antes de cada cambio
- ✅ Backup de políticas actuales
- ✅ Verificaciones post-aplicación
- ✅ Instrucciones de rollback si algo falla

### Paso 1: DIAGNÓSTICO (Sin riesgo)
1. Abre Supabase SQL Editor
2. Copia y ejecuta **PARTE 1** del script `FIX_COMPANIES_RLS_SAFE.sql`
3. Revisa el output:
   - ¿RLS está habilitado? (debe ser `true` o `false`)
   - ¿Cuántas políticas existen?
   - ¿Hay datos en companies?

### Paso 2: BACKUP (Muy importante)
1. Ejecuta **PARTE 2** del script
2. **GUARDA EL RESULTADO** en un archivo de texto
3. Este backup te permitirá revertir si algo sale mal

### Paso 3: APLICAR CAMBIOS (Con cuidado)
1. **Solo si el diagnóstico se ve bien**, ejecuta **PARTE 3**
2. El script usa transacciones:
   - Si todo sale bien → COMMIT automático
   - Si algo falla → ROLLBACK automático
3. Lee los mensajes de NOTICE que aparecen

### Paso 4: VERIFICACIÓN
1. Ejecuta **PARTE 4** del script
2. Verifica que:
   - RLS está habilitado (`rls_enabled = true`)
   - Hay al menos 3 políticas nuevas
   - Las políticas tienen USING y WITH CHECK

### Paso 5: ROLLBACK (Solo si necesario)
Si algo salió mal:
1. Ejecuta **PARTE 5** del script (está comentada)
2. Esto restaurará las políticas originales
3. Usa el backup de PARTE 2 si necesitas los valores exactos

## 🚨 Advertencias de Seguridad

### ❌ NO hagas esto:
- ❌ NO ejecutes el script en producción sin probar en desarrollo
- ❌ NO ejecutes sin hacer backup primero (PARTE 2)
- ❌ NO ejecutes si el diagnóstico muestra errores
- ❌ NO ejecutes si no entiendes qué hace cada parte

### ✅ SÍ haz esto:
- ✅ Ejecuta primero en desarrollo/staging
- ✅ Guarda el backup de políticas actuales
- ✅ Lee todos los mensajes de NOTICE
- ✅ Verifica después de aplicar
- ✅ Ten el rollback listo por si acaso

## 🧪 Pruebas

### Prueba 1: Verificar que RLS está habilitado
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'companies';
```
Resultado esperado: `rowsecurity = true`

### Prueba 2: Ver políticas activas
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'companies';
```
Resultado esperado: 4 políticas (SELECT, INSERT, UPDATE, DELETE)

### Prueba 3: Probar acceso como usuario
```sql
SELECT c.* 
FROM companies c
WHERE c.id IN (
  SELECT company_id 
  FROM profiles 
  WHERE id = auth.uid()
);
```
Resultado esperado: Debe devolver la company del usuario actual

## 🔧 Troubleshooting

### Problema: El layout sigue bloqueado después de aplicar el fix

**Posibles causas:**

1. **Usuario sin profile**
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   ```
   Si no devuelve nada, el usuario no tiene profile.

2. **Profile sin company_id**
   ```sql
   SELECT id, email, company_id FROM profiles WHERE id = auth.uid();
   ```
   Si `company_id` es NULL, el usuario no está asociado a ninguna company.

3. **Sesión de Supabase no inicializada**
   - Verifica que `createClient()` se esté llamando correctamente
   - Revisa los logs del servidor para errores de autenticación

4. **Políticas RLS en profiles bloqueando**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   Verifica que las políticas de profiles permitan SELECT.

### Problema: Error "new row violates row-level security policy"

Esto ocurre en INSERT o UPDATE. Verifica:

1. **WITH CHECK clause**: Asegúrate de que la política tenga WITH CHECK
2. **Datos válidos**: Verifica que los datos cumplan con las condiciones
3. **Usuario autenticado**: Confirma que `auth.uid()` no sea NULL

## 📊 Consultas de Diagnóstico

### Ver todos los usuarios y sus companies
```sql
SELECT 
  p.id as user_id,
  p.email,
  p.role,
  c.id as company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
ORDER BY p.created_at DESC;
```

### Ver políticas RLS de todas las tablas
```sql
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verificar estado de RLS en todas las tablas
```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('companies', 'profiles', 'invitations')
ORDER BY tablename;
```

## 🎯 Mejores Prácticas

1. **Siempre prueba RLS en desarrollo primero**: No habilites RLS en producción sin probar
2. **Usa políticas específicas por operación**: Separa SELECT, INSERT, UPDATE, DELETE
3. **Documenta las políticas**: Agrega comentarios explicando qué hace cada política
4. **Monitorea logs**: Revisa logs de Supabase para errores de RLS
5. **Usa índices**: Asegúrate de que las columnas usadas en políticas tengan índices

## 📚 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- **Script seguro recomendado**: `docs-auth/FIX_COMPANIES_RLS_SAFE.sql` ⭐
- Script de diagnóstico: `docs-auth/FIX_COMPANIES_RLS.sql`

## 🎯 Resumen Ejecutivo

### ¿Qué hace este fix?
Corrige las políticas RLS de la tabla `companies` para que no bloqueen el layout del dashboard.

### ¿Es seguro?
Sí, si usas `FIX_COMPANIES_RLS_SAFE.sql` que incluye:
- Transacciones con rollback
- Validaciones
- Backup automático
- Verificaciones

### ¿Cuándo aplicarlo?
- Cuando el layout se bloquea al habilitar RLS en companies
- Cuando ves errores de "permission denied" en companies
- Cuando quieres mejorar la seguridad de tu base de datos

### ¿Qué puede salir mal?
Si usas el script seguro, casi nada:
- Si falla, hace rollback automático
- Tienes backup de políticas originales
- Puedes revertir con PARTE 5

### ¿Necesito ayuda?
Si tienes dudas:
1. Ejecuta solo PARTE 1 (diagnóstico)
2. Comparte el output
3. No ejecutes PARTE 3 hasta estar seguro
