-- Ver TODAS las funciones que mencionan subscriptions

SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc
WHERE (prosrc ILIKE '%subscriptions%' OR prosrc ILIKE '%subscription%')
AND proname IN ('register_trial_usage', 'mark_trial_cancelled', 'handle_new_user')
ORDER BY proname;
