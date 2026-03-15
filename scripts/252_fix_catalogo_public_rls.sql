-- =====================================================
-- Script 252: Fix RLS para catálogo público
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Ver políticas actuales en products
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;

-- 2. Ver políticas actuales en catalog_settings
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'catalog_settings'
ORDER BY policyname;

-- 3. Ver si RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('products', 'catalog_settings', 'online_orders', 'subscriptions', 'companies')
ORDER BY tablename;
