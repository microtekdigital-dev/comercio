-- ============================================================================
-- FIX: Corregir Foreign Key de internal_notes
-- ============================================================================
-- Este script corrige la foreign key de internal_notes.user_id para que
-- apunte a public.profiles(id) en lugar de auth.users(id)
-- Esto permite hacer JOINs correctamente con la tabla profiles
-- ============================================================================

-- 1. Verificar el estado actual de la FK
SELECT 
  '=== ESTADO ACTUAL DE LA FK ===' as info,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conrelid = 'public.internal_notes'::regclass
  AND conname LIKE '%user_id%';

-- 2. Eliminar la FK existente (si existe)
ALTER TABLE public.internal_notes 
  DROP CONSTRAINT IF EXISTS internal_notes_user_id_fkey;

-- 3. Crear la nueva FK apuntando a public.profiles
ALTER TABLE public.internal_notes 
  ADD CONSTRAINT internal_notes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 4. Verificar que la FK se creó correctamente
SELECT 
  '=== NUEVA FK CREADA ===' as info,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conrelid = 'public.internal_notes'::regclass
  AND conname = 'internal_notes_user_id_fkey';

-- 5. Verificar que los datos siguen intactos
SELECT 
  '=== VERIFICACIÓN DE DATOS ===' as info,
  COUNT(*) as total_notas
FROM public.internal_notes;

SELECT '✅ Foreign Key corregida exitosamente' as resultado;
