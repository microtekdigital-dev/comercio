-- Actualizar precios de planes a valores de lanzamiento
-- Nuevos precios: Básico $8.000, Profesional $15.000, Empresarial $30.000
-- Planes anuales con 20% de descuento

-- Desactivar todos los planes existentes
UPDATE public.plans SET is_active = false;

-- Insertar o actualizar los nuevos planes con precios actualizados
INSERT INTO public.plans (name, description, price, currency, interval, features, sort_order, is_active, max_users, max_products) VALUES
  -- PLAN TRIAL (14 días gratis)
  (
    'Trial', 
    'Prueba gratis por 14 días - Sin tarjeta de crédito', 
    0.00, 
    'ARS', 
    'month',
    '[
      "14 días gratis",
      "100 productos",
      "50 clientes",
      "Ventas ilimitadas",
      "Reportes básicos",
      "Soporte por email"
    ]'::jsonb, 
    0, 
    true,
    1,
    100
  ),
  
  -- PLAN BÁSICO MENSUAL - $8.000/mes
  (
    'Básico', 
    'Ideal para emprendedores y pequeños negocios', 
    8000.00, 
    'ARS', 
    'month', 
    '[
      "500 productos",
      "200 clientes",
      "Ventas ilimitadas",
      "1 usuario",
      "Reportes básicos",
      "Exportar a Excel",
      "Soporte por email"
    ]'::jsonb, 
    1, 
    true,
    1,
    500
  ),
  
  -- PLAN BÁSICO ANUAL - $76.800/año (ahorra $19.200 - 20% descuento)
  (
    'Básico', 
    'Ideal para emprendedores - Pago anual con 20% descuento', 
    76800.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $19.200 al año (20% descuento)",
      "Precio fijo por 12 meses",
      "500 productos",
      "200 clientes",
      "Ventas ilimitadas",
      "1 usuario",
      "Reportes básicos",
      "Exportar a Excel",
      "Soporte por email"
    ]'::jsonb, 
    2, 
    true,
    1,
    500
  ),
  
  -- PLAN PROFESIONAL MENSUAL - $15.000/mes
  (
    'Profesional', 
    'Para negocios en crecimiento', 
    15000.00, 
    'ARS', 
    'month', 
    '[
      "2.000 productos",
      "1.000 clientes",
      "Ventas ilimitadas",
      "5 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Reportes avanzados",
      "Exportar a Excel",
      "Soporte prioritario"
    ]'::jsonb, 
    3, 
    true,
    5,
    2000
  ),
  
  -- PLAN PROFESIONAL ANUAL - $144.000/año (ahorra $36.000 - 20% descuento)
  (
    'Profesional', 
    'Para negocios en crecimiento - Pago anual con 20% descuento', 
    144000.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $36.000 al año (20% descuento)",
      "Precio fijo por 12 meses",
      "2.000 productos",
      "1.000 clientes",
      "Ventas ilimitadas",
      "5 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Reportes avanzados",
      "Exportar a Excel",
      "Soporte prioritario"
    ]'::jsonb, 
    4, 
    true,
    5,
    2000
  ),
  
  -- PLAN EMPRESARIAL MENSUAL - $30.000/mes
  (
    'Empresarial', 
    'Solución completa para empresas', 
    30000.00, 
    'ARS', 
    'month', 
    '[
      "Productos ilimitados",
      "Clientes ilimitados",
      "Ventas ilimitadas",
      "15 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Reportes completos",
      "Exportar a Excel",
      "Soporte prioritario 24/7",
      "API access"
    ]'::jsonb, 
    5, 
    true,
    15,
    999999
  ),
  
  -- PLAN EMPRESARIAL ANUAL - $288.000/año (ahorra $72.000 - 20% descuento)
  (
    'Empresarial', 
    'Solución completa para empresas - Pago anual con 20% descuento', 
    288000.00, 
    'ARS', 
    'year', 
    '[
      "Ahorra $72.000 al año (20% descuento)",
      "Precio fijo por 12 meses",
      "Productos ilimitados",
      "Clientes ilimitados",
      "Ventas ilimitadas",
      "15 usuarios",
      "Órdenes de compra",
      "Gestión de proveedores",
      "Reportes completos",
      "Exportar a Excel",
      "Soporte prioritario 24/7",
      "API access",
      "Capacitación personalizada"
    ]'::jsonb, 
    6, 
    true,
    15,
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

-- Verificar los planes actualizados
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
