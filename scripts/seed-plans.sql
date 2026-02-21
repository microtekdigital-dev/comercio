-- Seed default plans
-- Run this in Supabase SQL Editor
-- Actualizado con planes comerciales, trial y precios finales

-- Agregar columnas si no existen (primero)
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 3;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 500;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Eliminar índice antiguo si existe y crear uno nuevo con name + interval
DROP INDEX IF EXISTS plans_name_unique;
CREATE UNIQUE INDEX IF NOT EXISTS plans_name_interval_unique ON public.plans(name, interval);

-- IMPORTANTE: Actualizamos planes existentes en lugar de borrarlos
-- Esto mantiene las suscripciones activas de los usuarios

-- Primero, desactivar todos los planes existentes
UPDATE public.plans SET is_active = false;

-- Insertar o actualizar los nuevos planes
INSERT INTO public.plans (name, description, price, currency, interval, features, sort_order, is_active, max_users, max_products, is_popular) VALUES
  -- PLAN TRIAL (14 días gratis)
  (
    'Trial', 
    'Prueba gratis por 14 días - Funciones limitadas', 
    0.00, 
    'ARS', 
    'month',
    '[
      "14 días gratis",
      "Hasta 50 productos",
      "Hasta 3 usuarios",
      "Ventas y clientes",
      "Reportes básicos",
      "Soporte por email"
    ]'::jsonb, 
    0, 
    true,
    3,
    50,
    false
  ),
  
  -- PLAN BÁSICO MENSUAL
  (
    'Básico', 
    'Ideal para pequeños negocios que están comenzando', 
    15000.00, 
    'ARS', 
    'month', 
    '[
      "Hasta 500 productos",
      "Hasta 3 usuarios",
      "Ventas y clientes",
      "Gestión completa",
      "Reportes básicos",
      "Soporte por email"
    ]'::jsonb, 
    1, 
    true,
    3,
    500,
    false
  ),
  
  -- PLAN BÁSICO ANUAL
  (
    'Básico', 
    'Ideal para pequeños negocios - Pago anual', 
    150000.00, 
    'ARS', 
    'year', 
    '[
      "Hasta 500 productos",
      "Hasta 3 usuarios",
      "Ventas y clientes",
      "Gestión completa",
      "Reportes básicos",
      "Soporte por email"
    ]'::jsonb, 
    2, 
    true,
    3,
    500,
    false
  ),
  
  -- PLAN PRO MENSUAL (MÁS ELEGIDO)
  (
    'Pro', 
    '⭐ Más elegido - Para negocios en crecimiento que necesitan más funcionalidades', 
    30000.00, 
    'ARS', 
    'month', 
    '[
      "Hasta 5,000 productos",
      "Hasta 11 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Cuenta corriente clientes",
      "Cuenta corriente proveedores",
      "Apertura y cierre de caja",
      "Liquidación de inventario",
      "Liquidación de cuentas",
      "Reportes avanzados",
      "Exportar a Excel",
      "Soporte prioritario"
    ]'::jsonb, 
    3, 
    true,
    11,
    5000,
    true
  ),
  
  -- PLAN PRO ANUAL (MÁS ELEGIDO)
  (
    'Pro', 
    '⭐ Más elegido - Para negocios en crecimiento - Pago anual', 
    300000.00, 
    'ARS', 
    'year', 
    '[
      "Hasta 5,000 productos",
      "Hasta 11 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Cuenta corriente clientes",
      "Cuenta corriente proveedores",
      "Apertura y cierre de caja",
      "Liquidación de inventario",
      "Liquidación de cuentas",
      "Reportes avanzados",
      "Exportar a Excel",
      "Soporte prioritario"
    ]'::jsonb, 
    4, 
    true,
    11,
    5000,
    true
  ),
  
  -- PLAN PRO REPARACIONES MENSUAL
  (
    'Pro Reparaciones', 
    'Plan Pro con módulo de reparaciones incluido', 
    35000.00, 
    'ARS', 
    'month', 
    '[
      "Hasta 5,000 productos",
      "Hasta 11 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Cuenta corriente clientes",
      "Cuenta corriente proveedores",
      "Apertura y cierre de caja",
      "Liquidación de inventario",
      "Liquidación de cuentas",
      "Módulo de reparaciones",
      "Reportes avanzados",
      "Exportar a Excel",
      "Soporte prioritario"
    ]'::jsonb, 
    5, 
    true,
    11,
    5000,
    false
  ),
  
  -- PLAN PRO REPARACIONES ANUAL
  (
    'Pro Reparaciones', 
    'Plan Pro con módulo de reparaciones - Pago anual', 
    350000.00, 
    'ARS', 
    'year', 
    '[
      "Hasta 5,000 productos",
      "Hasta 11 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Cuenta corriente clientes",
      "Cuenta corriente proveedores",
      "Apertura y cierre de caja",
      "Liquidación de inventario",
      "Liquidación de cuentas",
      "Módulo de reparaciones",
      "Reportes avanzados",
      "Exportar a Excel",
      "Soporte prioritario"
    ]'::jsonb, 
    6, 
    true,
    11,
    5000,
    false
  ),
  
  -- PLAN EMPRESARIAL MENSUAL
  (
    'Empresarial', 
    'Solución completa para empresas grandes con múltiples sucursales', 
    55000.00, 
    'ARS', 
    'month', 
    '[
      "Productos ilimitados",
      "Usuarios ilimitados",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Cuenta corriente clientes",
      "Cuenta corriente proveedores",
      "Apertura y cierre de caja",
      "Liquidación de inventario",
      "Liquidación de cuentas",
      "Reportes completos",
      "Exportar a Excel",
      "Soporte prioritario 24/7",
      "API access"
    ]'::jsonb, 
    7, 
    true,
    999999,
    999999,
    false
  ),
  
  -- PLAN EMPRESARIAL ANUAL
  (
    'Empresarial', 
    'Solución completa para empresas - Pago anual', 
    500000.00, 
    'ARS', 
    'year', 
    '[
      "Productos ilimitados",
      "Usuarios ilimitados",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Cuenta corriente clientes",
      "Cuenta corriente proveedores",
      "Apertura y cierre de caja",
      "Liquidación de inventario",
      "Liquidación de cuentas",
      "Reportes completos",
      "Exportar a Excel",
      "Soporte prioritario 24/7",
      "API access"
    ]'::jsonb, 
    8, 
    true,
    999999,
    999999,
    false
  )
ON CONFLICT (name, interval) 
DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products,
  is_popular = EXCLUDED.is_popular;

-- Comentarios
COMMENT ON COLUMN plans.max_users IS 'Número máximo de usuarios permitidos en el plan';
COMMENT ON COLUMN plans.max_products IS 'Número máximo de productos permitidos en el plan';
COMMENT ON COLUMN plans.is_popular IS 'Indica si el plan debe mostrarse como "Más elegido" o "Popular" en la UI';

-- Nota: Las suscripciones y pagos existentes se mantienen activos
-- Los usuarios en trial seguirán con su plan hasta que expire
-- Los planes antiguos quedan desactivados (is_active = false)
