# 🎯 Configuración Manual Completa - Sin SQL

Esta guía te permite configurar el storage de imágenes usando **SOLO** la interfaz de Supabase Dashboard, sin necesidad de ejecutar scripts SQL.

---

## 📝 Paso 1: Crear el Bucket

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. En el menú lateral izquierdo, click en **"Storage"**
4. Click en el botón verde **"New bucket"** (esquina superior derecha)
5. En el formulario que aparece:
   - **Name**: Escribe `products`
   - **Public bucket**: ✅ **ACTIVAR ESTE SWITCH** (muy importante)
   - Deja las demás opciones por defecto
6. Click en **"Create bucket"**

**Verificación**: Deberías ver el bucket "products" en la lista con un ícono de globo 🌐 indicando que es público.

---

## 🔐 Paso 2: Configurar Políticas de Acceso

### 2.1 Acceder a las Políticas

1. En la lista de buckets, click en el bucket **"products"**
2. En la parte superior, verás varias pestañas. Click en **"Policies"**
3. Verás un mensaje diciendo que no hay políticas configuradas

### 2.2 Crear Política de Lectura Pública

1. Click en el botón **"New policy"**
2. Selecciona **"Create a policy from scratch"** (o "For full customization")
3. Completa el formulario:

   **Policy name:**
   ```
   Public Access
   ```

   **Allowed operation:**
   - Selecciona: **SELECT** (lectura)

   **Target roles:**
   - Deja en blanco o selecciona "public"

   **USING expression:**
   ```sql
   bucket_id = 'products'
   ```

   **WITH CHECK expression:**
   - Deja en blanco

4. Click en **"Review"** y luego **"Save policy"**

### 2.3 Crear Política de Subida (INSERT)

1. Click en **"New policy"** nuevamente
2. Selecciona **"Create a policy from scratch"**
3. Completa el formulario:

   **Policy name:**
   ```
   Authenticated users can upload product images
   ```

   **Allowed operation:**
   - Selecciona: **INSERT** (crear)

   **Target roles:**
   - Selecciona: **authenticated**

   **USING expression:**
   - Deja en blanco

   **WITH CHECK expression:**
   ```sql
   bucket_id = 'products'
   ```

4. Click en **"Review"** y luego **"Save policy"**

### 2.4 Crear Política de Actualización (UPDATE)

1. Click en **"New policy"** nuevamente
2. Selecciona **"Create a policy from scratch"**
3. Completa el formulario:

   **Policy name:**
   ```
   Authenticated users can update product images
   ```

   **Allowed operation:**
   - Selecciona: **UPDATE** (actualizar)

   **Target roles:**
   - Selecciona: **authenticated**

   **USING expression:**
   ```sql
   bucket_id = 'products'
   ```

   **WITH CHECK expression:**
   ```sql
   bucket_id = 'products'
   ```

4. Click en **"Review"** y luego **"Save policy"**

### 2.5 Crear Política de Eliminación (DELETE)

1. Click en **"New policy"** por última vez
2. Selecciona **"Create a policy from scratch"**
3. Completa el formulario:

   **Policy name:**
   ```
   Authenticated users can delete product images
   ```

   **Allowed operation:**
   - Selecciona: **DELETE** (eliminar)

   **Target roles:**
   - Selecciona: **authenticated**

   **USING expression:**
   ```sql
   bucket_id = 'products'
   ```

   **WITH CHECK expression:**
   - Deja en blanco

4. Click en **"Review"** y luego **"Save policy"**

---

## ✅ Paso 3: Verificar la Configuración

Después de crear todas las políticas, deberías ver en la pestaña "Policies":

1. ✅ **Public Access** (SELECT)
2. ✅ **Authenticated users can upload product images** (INSERT)
3. ✅ **Authenticated users can update product images** (UPDATE)
4. ✅ **Authenticated users can delete product images** (DELETE)

Todas las políticas deben tener un indicador verde o estar "Enabled".

---

## 🧪 Paso 4: Probar la Funcionalidad

### 4.1 Probar desde la Aplicación

1. Inicia tu aplicación Next.js:
   ```bash
   npm run dev
   ```

2. Inicia sesión en tu aplicación

3. Ve a **Dashboard** → **Productos** → **Nuevo Producto**

4. Completa los campos básicos del producto

5. En la sección **"Imagen del Producto"**:
   - Arrastra una imagen o click para seleccionar
   - Deberías ver "Subiendo imagen..."
   - Luego aparecerá el preview de la imagen
   - Mensaje: "Imagen cargada exitosamente"

6. Guarda el producto

7. Ve al listado de productos y verifica que se muestre la imagen

### 4.2 Probar desde Supabase Dashboard (Opcional)

1. Ve a **Storage** → bucket **"products"**
2. Deberías ver la carpeta **"images"**
3. Dentro de "images" verás los archivos subidos
4. Click en cualquier imagen para ver el preview

---

## 🐛 Solución de Problemas

### Problema: "new row violates row-level security policy"

**Causa**: Las políticas no están bien configuradas.

**Solución**:
1. Ve a Storage → products → Policies
2. Verifica que las 4 políticas existan
3. Verifica que cada política tenga el "Target role" correcto:
   - Public Access: sin role o "public"
   - Las otras 3: "authenticated"
4. Verifica que las expresiones SQL sean exactamente: `bucket_id = 'products'`

### Problema: "Bucket not found"

**Causa**: El bucket no se creó correctamente.

**Solución**:
1. Ve a Storage
2. Verifica que existe un bucket llamado exactamente "products" (minúsculas)
3. Si no existe, créalo siguiendo el Paso 1

### Problema: Las imágenes no se muestran (404)

**Causa**: El bucket no es público.

**Solución**:
1. Ve a Storage
2. Click en los 3 puntos (...) al lado del bucket "products"
3. Click en "Edit bucket"
4. Verifica que "Public bucket" esté ✅ ACTIVADO
5. Guarda cambios

### Problema: "Failed to upload image"

**Causas posibles**:
- Imagen muy grande (> 5MB)
- Formato no soportado
- No estás autenticado

**Solución**:
1. Verifica que la imagen sea menor a 5MB
2. Usa formatos: JPG, PNG, GIF, WebP
3. Verifica que hayas iniciado sesión en la aplicación
4. Abre la consola del navegador (F12) para ver errores detallados

### Problema: Error de CORS

**Causa**: Configuración de CORS en Supabase.

**Solución**:
1. Ve a Settings → API en Supabase Dashboard
2. En "CORS Configuration", verifica que tu dominio esté permitido
3. Para desarrollo local, asegúrate que `http://localhost:3000` esté permitido

---

## 📊 Checklist Final

Antes de considerar la configuración completa, verifica:

- [ ] Bucket "products" existe
- [ ] Bucket "products" es público (tiene ícono 🌐)
- [ ] Política "Public Access" (SELECT) está creada
- [ ] Política de INSERT (authenticated) está creada
- [ ] Política de UPDATE (authenticated) está creada
- [ ] Política de DELETE (authenticated) está creada
- [ ] Puedes subir una imagen desde la aplicación
- [ ] La imagen se muestra en el listado de productos
- [ ] Puedes eliminar la imagen
- [ ] Puedes actualizar la imagen

---

## 🎉 ¡Configuración Completa!

Si todos los pasos anteriores funcionan correctamente, tu sistema está listo para gestionar imágenes de productos.

### Funcionalidades Disponibles:

✅ Subir imágenes al crear productos
✅ Ver thumbnails en el listado
✅ Actualizar imágenes en productos existentes
✅ Eliminar imágenes
✅ Validación de tamaño (máx 5MB)
✅ Validación de formato (solo imágenes)
✅ Preview antes de guardar

---

## 📞 Soporte Adicional

Si sigues teniendo problemas:

1. Revisa la consola del navegador (F12) para errores
2. Revisa los logs de Supabase Dashboard
3. Consulta la documentación oficial: https://supabase.com/docs/guides/storage
4. Verifica que tus variables de entorno estén correctas en `.env.local`

---

## 🔑 Variables de Entorno Requeridas

Asegúrate de tener en tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Estas variables las encuentras en:
Supabase Dashboard → Settings → API
