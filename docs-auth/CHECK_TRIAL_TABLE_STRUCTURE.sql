-- Ver la estructura de la tabla trial_used_emails
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trial_used_emails'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver los datos actuales
SELECT * FROM trial_used_emails;
