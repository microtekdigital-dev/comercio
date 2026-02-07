-- Seed default plans
-- Run this in Supabase SQL Editor
-- Actualizado con planes comerciales

-- Agregar columnas si no existen (primero)
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 3;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 500;

-- Crear índice único en name si no existe (para ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS plans_name_unique ON public.plans(name);

-- Actualizar planes existentes o insertar nuevos
-- Usamos ON CONFLICT para actualizar si ya existen
INSERT INTO public.plans (name, description, price, currency, interval, features, sort_order, is_active, max_users, max_products) VALUES
  (
    'Básico', 
    'Ideal para pequeños negocios que están comenzando', 
    2999.00, 
    'ARS', 
    'month', 
    '[
      "1 empresa",
      "1 usuario admin + 2 empleados",
      "Gestión de productos",
      "Gestión de ventas",
      "Gestión de clientes",
      "Reportes básicos",
      "Hasta 500 productos",
      "Hasta 3 usuarios",
      "Soporte por email"
    ]'::jsonb, 
    1, 
    true,
    3,
    500
  ),
  (
    'Pro', 
    'Para negocios en crecimiento que necesitan más funcionalidades', 
    7999.00, 
    'ARS', 
    'month', 
    '[
      "1 empresa",
      "1 admin + 10 empleados",
      "Gestión de productos",
      "Gestión de ventas",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Gestión de clientes",
      "Reportes completos",
      "Exportar a Excel",
      "Hasta 5,000 productos",
      "Hasta 11 usuarios",
      "Soporte prioritario"
    ]'::jsonb, 
    2, 
    true,
    11,
    5000
  ),
  (
    'Empresarial', 
    'Solución completa para empresas grandes con múltiples sucursales', 
    19999.00, 
    'ARS', 
    'month', 
    '[
      "Empresas ilimitadas",
      "Usuarios ilimitados",
      "Gestión completa de ventas",
      "Gestión completa de compras",
      "Gestión de inventario avanzada",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Gestión de clientes",
      "Reportes avanzados",
      "Exportar a Excel",
      "Productos ilimitados",
      "Soporte prioritario 24/7",
      "API access",
      "Capacitación personalizada"
    ]'::jsonb, 
    3, 
    true,
    999999,
    999999
  )
ON CONFLICT (name) 
DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products;

-- Comentarios
COMMENT ON COLUMN plans.max_users IS 'Número máximo de usuarios permitidos en el plan';
COMMENT ON COLUMN plans.max_products IS 'Número máximo de productos permitidos en el plan';

