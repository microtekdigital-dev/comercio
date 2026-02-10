-- Ver el código actual del trigger handle_new_user
SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';
