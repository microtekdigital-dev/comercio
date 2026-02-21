-- =====================================================
-- Test: Technicians Table Access
-- =====================================================

-- 1. Verificar tabla existe
SELECT 'Table exists' as test, 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'technicians'
  ) as result;

-- 2. Verificar RLS habilitado
SELECT 'RLS enabled' as test,
  rowsecurity as result
FROM pg_tables
WHERE tablename = 'technicians';

-- 3. Contar técnicos (puede fallar si RLS bloquea)
SELECT 'Total technicians' as test,
  COUNT(*)::text as result
FROM technicians;

-- 4. Verificar usuario actual tiene company
SELECT 'User has company' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM company_users 
      WHERE user_id = auth.uid()
    ) THEN 'YES'
    ELSE 'NO'
  END as result;

-- 5. Intentar insertar técnico de prueba
-- NOTA: Cambia 'TU_COMPANY_ID' por tu company_id real
-- SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1;

-- INSERT INTO technicians (company_id, name, specialty, is_active)
-- VALUES (
--   (SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1),
--   'Técnico de Prueba',
--   'Electrónica',
--   true
-- )
-- RETURNING *;
