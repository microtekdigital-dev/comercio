-- Seed default plans
-- Run this in Supabase SQL Editor
-- Actualizado con planes comerciales, trial y precios finales

-- Agregar columnas si no existen (primero)
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 3;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_products INTEGER DEFAULT 500;

-- Eliminar índice antiguo si existe y crear uno nuevo con name + interval
DROP INDEX IF EXISTS plans_name_unique;
CREATE UNIQUE INDEX IF NOT EXISTS plans_name_interval_unique ON public.plans(name, interval);

-- IMPORTANTE: Actualizamos planes existentes en lugar de borrarlos
-- Esto mantiene las suscripciones activas de los usuarios

-- Primero, desactivar todos los planes existentes
UPDATE public.plans SET is_active = false;

-- Insertar o actualizar los nuevos planes
INSERT INTO public.plans (name, description, price, currency, interval, features, sort_order, is_active, max_users, max_products) VALUES
  -- PLAN TRIAL (14 días gratis)
  (
    'Trial', 
    'Prueba gratis por 14 días - Funciones limitadas', 
    0.00, 
    'ARS', 
    'month',
    '[
      "14 días gratis",
      "1 empresa",
      "1 usuario admin + 2 empleados",
      "Gestión de productos",
      "Gestión de ventas",
      "Gestión de clientes",
      "Reportes básicos",
      "Hasta 50 productos",
      "Hasta 3 usuarios",
      "Soporte por email"
    ]'::jsonb, 
    0, 
    true,
    3,
    50
  ),
  
  -- PLAN BÁSICO MENSUAL
  (
    'Básico', 
    'Ideal para pequeños negocios que están comenzando', 
    5000.00, 
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
  
  -- PLAN BÁSICO ANUAL (ahorra $9,000 al año - 15% descuento)
  (
    'Básico', 
    'Ideal para pequeños negocios - Pago anual con 15% descuento', 
    51000.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $9,000 al año (15% descuento)",
      "Equivalente a 10.2 meses",
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
    2, 
    true,
    3,
    500
  ),
  
  -- PLAN PRO MENSUAL
  (
    'Pro', 
    'Para negocios en crecimiento que necesitan más funcionalidades', 
    12000.00, 
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
    3, 
    true,
    11,
    5000
  ),
  
  -- PLAN PRO ANUAL (ahorra $42,000 al año - 29% descuento)
  (
    'Pro', 
    'Para negocios en crecimiento - Pago anual con descuento especial', 
    102000.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $42,000 al año (29% descuento)",
      "Equivalente a 8.5 meses",
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
    4, 
    true,
    11,
    5000
  ),
  
  -- PLAN EMPRESARIAL MENSUAL
  (
    'Empresarial', 
    'Solución completa para empresas grandes con múltiples sucursales', 
    18000.00, 
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
    5, 
    true,
    999999,
    999999
  ),
  
  -- PLAN EMPRESARIAL ANUAL (ahorra $32,000 al año - 15% descuento)
  (
    'Empresarial', 
    'Solución completa para empresas - Pago anual con 15% descuento', 
    184000.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $32,000 al año (15% descuento)",
      "Equivalente a 10.2 meses",
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
    6, 
    true,
    999999,
    999999
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
  max_products = EXCLUDED.max_products;

-- Comentarios
COMMENT ON COLUMN plans.max_users IS 'Número máximo de usuarios permitidos en el plan';
COMMENT ON COLUMN plans.max_products IS 'Número máximo de productos permitidos en el plan';

-- Nota: Las suscripciones y pagos existentes se mantienen activos
-- Los usuarios en trial seguirán con su plan hasta que expire
-- Los planes antiguos quedan desactivados (is_active = false)
