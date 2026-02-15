# Fix: Foreign Key de Notas Internas

## Problema

El sistema de notas internas muestra el siguiente error:

```
PGRST200: Could not find a relationship between 'internal_notes' and 'profiles' in the schema cache
```

## Causa

La tabla `internal_notes` tiene una foreign key `user_id` que apunta a `auth.users(id)`, pero el código intenta hacer JOIN con `public.profiles(id)`. Supabase PostgREST no puede encontrar esta relación porque la FK apunta a la tabla incorrecta.

## Solución

Ejecutar el script de migración que corrige la foreign key para que apunte a `public.profiles(id)`.

## Pasos para Aplicar el Fix

### 1. Abrir Supabase SQL Editor

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query

### 2. Ejecutar el Script de Migración

Copia y pega el contenido del archivo `scripts/211_fix_internal_notes_fk.sql` en el editor SQL y ejecuta.

O ejecuta directamente estos comandos:

```sql
-- Eliminar la FK existente
ALTER TABLE public.internal_notes 
  DROP CONSTRAINT IF EXISTS internal_notes_user_id_fkey;

-- Crear la nueva FK apuntando a public.profiles
ALTER TABLE public.internal_notes 
  ADD CONSTRAINT internal_notes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
```

### 3. Verificar el Fix

Ejecuta esta query para verificar que la FK se creó correctamente:

```sql
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conrelid = 'public.internal_notes'::regclass
  AND conname = 'internal_notes_user_id_fkey';
```

Deberías ver:

| constraint_name | table_name | referenced_table |
|----------------|------------|------------------|
| internal_notes_user_id_fkey | internal_notes | profiles |

### 4. Probar el Sistema

1. Recarga la aplicación en el navegador
2. Haz clic en el botón de notas internas en el header (ícono de mensaje)
3. El sidebar debería abrirse sin errores
4. Intenta crear una nueva nota
5. Verifica que aparece el nombre del autor correctamente

## Resultado Esperado

- ✅ El error PGRST200 desaparece
- ✅ El sidebar de notas se abre correctamente
- ✅ Las notas muestran el nombre del autor
- ✅ El contador de notas activas funciona
- ✅ Las actualizaciones en tiempo real funcionan

## Notas Técnicas

### ¿Por qué este cambio?

- **Antes**: `internal_notes.user_id` → `auth.users(id)`
- **Ahora**: `internal_notes.user_id` → `public.profiles(id)`

Supabase PostgREST solo puede hacer JOINs automáticos cuando existe una foreign key explícita entre las tablas. Como `profiles` es nuestra tabla de usuarios en el schema `public`, necesitamos que la FK apunte ahí.

### ¿Es seguro este cambio?

Sí, completamente seguro:

- No se pierden datos (solo se cambia la definición de la FK)
- `profiles.id` tiene los mismos valores que `auth.users.id` (están sincronizados por trigger)
- El `ON DELETE CASCADE` asegura que si se elimina un perfil, se eliminan sus notas

### ¿Qué pasa con las notas existentes?

Todas las notas existentes permanecen intactas. La migración solo cambia la definición de la constraint, no los datos.

## Troubleshooting

### Si el error persiste después del fix:

1. **Verifica que la FK se creó correctamente** (ver paso 3)
2. **Limpia la caché de Supabase**: A veces Supabase cachea el schema. Espera 1-2 minutos o reinicia el proyecto
3. **Verifica que todos los user_id existen en profiles**:

```sql
SELECT 
  n.id,
  n.user_id,
  p.id as profile_exists
FROM internal_notes n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE p.id IS NULL;
```

Si esta query devuelve filas, hay notas con user_id que no existen en profiles. Elimínalas:

```sql
DELETE FROM internal_notes
WHERE user_id NOT IN (SELECT id FROM profiles);
```

### Si ves errores de permisos:

Asegúrate de estar ejecutando el script como superusuario o con permisos suficientes en Supabase.

## Archivos Relacionados

- `scripts/210_create_internal_notes.sql` - Script original (ya actualizado con FK correcta)
- `scripts/211_fix_internal_notes_fk.sql` - Script de migración para corregir FK
- `lib/actions/internal-notes.ts` - Server actions (ya usa sintaxis correcta)
- `components/dashboard/internal-notes-button.tsx` - Botón en el header
- `components/dashboard/internal-notes-sidebar.tsx` - Sidebar flotante

## Estado del Sistema

- ✅ Base de datos: Script de migración creado
- ✅ Tipos TypeScript: Correctos
- ✅ Server actions: Sintaxis de JOIN correcta
- ✅ Componentes UI: Completos y funcionando
- ✅ Botón en header: Implementado (no flotante)
- ⏳ **Pendiente**: Ejecutar script de migración en Supabase

---

**Última actualización**: 2026-02-15
