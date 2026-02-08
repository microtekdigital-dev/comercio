-- Comparar suscripciones para ver si son nuevas o las mismas

SELECT 
  id,
  status,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutos_desde_creacion,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutos_desde_actualizacion,
  CASE 
    WHEN created_at = updated_at THEN '🆕 NUEVA (nunca actualizada)'
    WHEN updated_at > created_at THEN '📝 ACTUALIZADA'
    ELSE '❓ Desconocido'
  END as tipo,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) < 60 THEN '⚠️  CREADA RECIENTEMENTE'
    WHEN EXTRACT(EPOCH FROM (NOW() - updated_at)) < 60 THEN '⚠️  ACTUALIZADA RECIENTEMENTE'
    ELSE '✓ Antigua'
  END as reciente
FROM subscriptions
WHERE company_id = 'deaf584c-8964-4ec4-a4f3-a0310aa6e308'
ORDER BY created_at DESC;
