-- Ver todos los planes disponibles (mensuales y anuales)

SELECT 
  id,
  name,
  price,
  currency,
  interval,
  interval_count,
  is_active
FROM public.plans
WHERE is_active = true
ORDER BY 
  CASE 
    WHEN name LIKE '%Trial%' THEN 1
    WHEN name LIKE '%Básico%' THEN 2
    WHEN name LIKE '%Profesional%' THEN 3
    WHEN name LIKE '%Empresarial%' THEN 4
    ELSE 5
  END,
  interval DESC;
