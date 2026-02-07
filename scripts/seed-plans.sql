-- Seed default plans
-- Run this in Supabase SQL Editor

INSERT INTO public.plans (name, description, price, currency, interval, features, sort_order, is_active) VALUES
  ('Trial', 'Prueba gratuita por 14 días', 0.00, 'ARS', 'month', 
   '["Hasta 3 usuarios", "500 MB de almacenamiento", "Soporte por email", "14 días gratis"]'::jsonb, 0, true),
  ('Básico', 'Ideal para pequeños equipos', 2999.00, 'ARS', 'month', 
   '["Hasta 5 usuarios", "1 GB de almacenamiento", "Soporte por email"]'::jsonb, 1, true),
  ('Profesional', 'Para equipos en crecimiento', 7999.00, 'ARS', 'month', 
   '["Hasta 25 usuarios", "10 GB de almacenamiento", "Soporte prioritario", "Reportes avanzados"]'::jsonb, 2, true),
  ('Empresarial', 'Solución completa para grandes empresas', 19999.00, 'ARS', 'month', 
   '["Usuarios ilimitados", "100 GB de almacenamiento", "Soporte 24/7", "API access", "SSO"]'::jsonb, 3, true)
ON CONFLICT DO NOTHING;
