# 🚀 Configuración Rápida - Imágenes de Productos

## ✅ Checklist de Configuración

- [ ] **Paso 1**: Crear bucket "products" en Supabase
- [ ] **Paso 2**: Marcar bucket como público
- [ ] **Paso 3**: Configurar políticas de seguridad
- [ ] **Paso 4**: Probar subida de imagen

---

## 📋 Paso 1: Crear Bucket

1. Abre [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Click en **Storage** (menú izquierdo)
4. Click en **"New bucket"**
5. Ingresa:
   ```
   Name: products
   ✅ Public bucket (IMPORTANTE)
   ```
6. Click en **"Create bucket"**

---

## 🔓 Paso 2: Verificar que sea Público

El bucket debe tener un ícono de 🌐 al lado del nombre.

Si no lo tiene:
1. Click en los 3 puntos del bucket
2. Click en **"Edit bucket"**
3. Activa **"Public bucket"**
4. Guarda cambios

---

## 🔐 Paso 3: Configurar Políticas

### Opción A: Usando SQL (Recomendado)

1. Ve a **SQL Editor**
2. Click en **"New query"**
3. Copia y pega este código:

```sql
-- Lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Subida (autenticados)
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Actualización (autenticados)
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Eliminación (autenticados)
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
```

4. Click en **"Run"**

### Opción B: Interfaz Gráfica

1. Ve a **Storage** > bucket **"products"**
2. Click en pestaña **"Policies"**
3. Click en **"New policy"** 4 veces para crear:
   - Política SELECT (pública)
   - Política INSERT (authenticated)
   - Política UPDATE (authenticated)
   - Política DELETE (authenticated)

---

## 🧪 Paso 4: Probar

1. Inicia tu aplicación
2. Ve a **Dashboard** > **Productos** > **Nuevo Producto**
3. Completa el formulario
4. En la sección **"Imagen"**, arrastra o selecciona una imagen
5. Deberías ver:
   - ✅ Barra de progreso "Subiendo imagen..."
   - ✅ Preview de la imagen
   - ✅ Mensaje "Imagen cargada exitosamente"

---

## ❌ Solución de Problemas Comunes

### Error: "new row violates row-level security policy"

**Causa**: Las políticas no están configuradas correctamente.

**Solución**:
1. Verifica que las 4 políticas estén creadas
2. Verifica que estés autenticado en la aplicación
3. Revisa que los nombres de las políticas coincidan

### Error: "Bucket not found"

**Causa**: El bucket "products" no existe.

**Solución**:
1. Ve a Storage en Supabase Dashboard
2. Verifica que existe un bucket llamado exactamente "products"
3. Si no existe, créalo siguiendo el Paso 1

### La imagen no se muestra

**Causa**: El bucket no es público.

**Solución**:
1. Ve a Storage > bucket "products"
2. Click en los 3 puntos > "Edit bucket"
3. Activa "Public bucket"
4. Guarda cambios

### Error: "Failed to upload"

**Causas posibles**:
- Imagen muy grande (> 5MB)
- Formato no soportado
- Sin conexión a internet

**Solución**:
1. Verifica el tamaño de la imagen
2. Usa formatos: JPG, PNG, GIF, WebP
3. Verifica tu conexión

---

## 📊 Verificación Final

Después de completar todos los pasos, verifica:

✅ Bucket "products" existe y es público (🌐)
✅ 4 políticas están activas en el bucket
✅ Puedes subir una imagen desde la aplicación
✅ La imagen se muestra en el listado de productos

---

## 🎉 ¡Listo!

Tu sistema ahora soporta imágenes de productos. Los usuarios pueden:

- 📤 Subir imágenes al crear productos
- 🖼️ Ver thumbnails en el listado
- ✏️ Cambiar imágenes al editar
- 🗑️ Eliminar imágenes

---

## 📚 Documentación Adicional

- `STORAGE_SETUP.md` - Guía detallada de configuración
- `PRODUCT_IMAGES_FEATURE.md` - Documentación técnica completa
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
