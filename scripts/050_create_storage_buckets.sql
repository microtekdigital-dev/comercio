-- =====================================================
-- Storage Buckets para imágenes de productos
-- =====================================================

-- NOTA: Este script debe ejecutarse desde el Supabase Dashboard
-- o necesitas permisos de superusuario.
-- 
-- ALTERNATIVA RECOMENDADA:
-- Crear el bucket manualmente desde Supabase Dashboard:
-- 1. Ve a Storage en el menú lateral
-- 2. Click en "New bucket"
-- 3. Nombre: "products"
-- 4. Marca como "Public bucket"
-- 5. Click en "Create bucket"

-- Si tienes permisos de superusuario, puedes ejecutar:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('products', 'products', true)
-- ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket de productos
-- IMPORTANTE: Estas políticas solo funcionarán después de crear el bucket

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- Permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Permitir subida de archivos a usuarios autenticados
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Permitir actualización de archivos a usuarios autenticados
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Permitir eliminación de archivos a usuarios autenticados
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- Comentarios
COMMENT ON POLICY "Public Access" ON storage.objects IS 'Permite lectura pública de imágenes de productos';
COMMENT ON POLICY "Authenticated users can upload product images" ON storage.objects IS 'Permite a usuarios autenticados subir imágenes';
COMMENT ON POLICY "Authenticated users can update product images" ON storage.objects IS 'Permite a usuarios autenticados actualizar imágenes';
COMMENT ON POLICY "Authenticated users can delete product images" ON storage.objects IS 'Permite a usuarios autenticados eliminar imágenes';
