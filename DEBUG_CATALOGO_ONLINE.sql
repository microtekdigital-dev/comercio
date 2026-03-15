-- =====================================================
-- DEBUG: Catálogo Online
-- Ejecutar en Supabase SQL Editor para diagnosticar
-- por qué el catálogo no muestra nada.
-- =====================================================

-- 1. Verificar que las tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('catalog_settings', 'online_orders');

-- 2. Verificar que la columna published existe en products
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name = 'published';

-- 3. Ver todas las empresas con su slug
SELECT id, name, slug, created_at
FROM companies
ORDER BY created_at DESC
LIMIT 10;

-- 4. Ver configuraciones de catálogo
SELECT cs.*, c.name as company_name, c.slug
FROM catalog_settings cs
JOIN companies c ON c.id = cs.company_id;

-- 5. Ver suscripciones activas
SELECT s.company_id, s.status, p.name as plan_name, c.name as company_name, c.slug
FROM subscriptions s
JOIN plans p ON p.id = s.plan_id
JOIN companies c ON c.id = s.company_id
WHERE s.status = 'active';

-- 6. Ver productos publicados
SELECT p.id, p.name, p.published, p.is_active, c.name as company_name
FROM products p
JOIN companies c ON c.id = p.company_id
WHERE p.published = true
LIMIT 20;

-- =====================================================
-- Si las tablas del paso 1 NO aparecen, ejecutar:
-- scripts/250_create_catalogo_online.sql
-- =====================================================
