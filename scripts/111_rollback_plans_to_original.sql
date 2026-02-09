-- ROLLBACK: Restaurar planes a precios originales
-- Este script revierte los cambios del script 110_update_plans_pricing.sql
-- Restaura los precios: Trial GRATIS, Básico $5k, Pro $12k, Empresarial $18k

-- IMPORTANTE: Los usuarios existentes mantienen sus suscripciones actuales
-- Este script solo actualiza los planes para futuros usuarios

-- Insertar o actualizar los planes con precios originales
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
      "Hasta 50 productos",
      "Hasta 3 usuarios",
      "Ventas y clientes",
      "Reportes básicos",
      "Soporte por email"
    ]'::jsonb, 
    0, 
    true,
    3,
    50
  ),
  
  -- PLAN BÁSICO MENSUAL - $5.000/mes
  (
    'Básico', 
    'Ideal para pequeños negocios que están comenzando', 
    5000.00, 
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
    500
  ),
  
  -- PLAN BÁSICO ANUAL - $51.000/año (ahorra $9.000 - 15% descuento)
  (
    'Básico', 
    'Ideal para pequeños negocios - Pago anual con 15% descuento', 
    51000.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $9,000 al año (15% descuento)",
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
    500
  ),
  
  -- PLAN PRO MENSUAL - $12.000/mes
  (
    'Pro', 
    'Para negocios en crecimiento que necesitan más funcionalidades', 
    12000.00, 
    'ARS', 
    'month', 
    '[
      "Hasta 5,000 productos",
      "Hasta 11 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Reportes avanzados",
      "Exportar a Excel",
      "Soporte prioritario"
    ]'::jsonb, 
    3, 
    true,
    11,
    5000
  ),
  
  -- PLAN PRO ANUAL - $102.000/año (ahorra $42.000 - 29% descuento)
  (
    'Pro', 
    'Para negocios en crecimiento - Pago anual con descuento especial', 
    102000.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $42,000 al año (29% descuento)",
      "Hasta 5,000 productos",
      "Hasta 11 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Reportes avanzados",
      "Exportar a Excel",
      "Soporte prioritario"
    ]'::jsonb, 
    4, 
    true,
    11,
    5000
  ),
  
  -- PLAN EMPRESARIAL MENSUAL - $18.000/mes
  (
    'Empresarial', 
    'Solución completa para empresas grandes con múltiples sucursales', 
    18000.00, 
    'ARS', 
    'month', 
    '[
      "Productos ilimitados",
      "Usuarios ilimitados",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Reportes completos",
      "Exportar a Excel",
      "Soporte prioritario 24/7",
      "API access"
    ]'::jsonb, 
    5, 
    true,
    999999,
    999999
  ),
  
  -- PLAN EMPRESARIAL ANUAL - $184.000/año (ahorra $32.000 - 15% descuento)
  (
    'Empresarial', 
    'Solución completa para empresas - Pago anual con 15% descuento', 
    184000.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $32,000 al año (15% descuento)",
      "Productos ilimitados",
      "Usuarios ilimitados",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Reportes completos",
      "Exportar a Excel",
      "Soporte prioritario 24/7",
      "API access"
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

-- Verificar los planes restaurados
SELECT 
  name,
  interval,
  price,
  max_products,
  max_users,
  is_active
FROM public.plans
WHERE is_active = true
ORDER BY sort_order;
