-- Buscar el nombre exacto de la empresa vanithegameplay

SELECT 
  id,
  name,
  slug,
  created_at
FROM companies
WHERE name ILIKE '%vani%'
   OR name ILIKE '%game%'
   OR slug ILIKE '%vani%'
   OR slug ILIKE '%game%'
ORDER BY created_at DESC;

-- Ver todas las empresas
SELECT 
  id,
  name,
  slug
FROM companies
ORDER BY name;
