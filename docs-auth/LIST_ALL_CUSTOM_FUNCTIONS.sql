-- Listar TODAS las funciones personalizadas (no del sistema)

SELECT 
  proname as function_name,
  CASE 
    WHEN prosrc LIKE '%INSERT%subscriptions%' OR prosrc LIKE '%insert%subscriptions%' 
    THEN '⚠️  INSERTA EN SUBSCRIPTIONS'
    WHEN prosrc LIKE '%subscriptions%' OR prosrc LIKE '%subscription%'
    THEN '✓ Menciona subscriptions'
    ELSE '✓ No menciona subscriptions'
  END as relevancia
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname NOT LIKE 'pg_%'
AND proname NOT LIKE 'RI_%'
ORDER BY 
  CASE 
    WHEN prosrc LIKE '%INSERT%subscriptions%' THEN 1
    WHEN prosrc LIKE '%subscriptions%' THEN 2
    ELSE 3
  END,
  proname;
