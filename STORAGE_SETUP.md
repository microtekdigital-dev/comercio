# Configuración de Storage para Imágenes de Productos

## ⚠️ IMPORTANTE: Configuración Manual Requerida

Debido a restricciones de permisos en Supabase, el bucket debe crearse manualmente desde el Dashboard.

## Pasos para configurar Supabase Storage

### Paso 1: Crear el Bucket (MANUAL - REQUERIDO)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Storage** en el menú lateral izquierdo
3. Click en el botón **"New bucket"**
4. Configura el bucket:
   - **Name**: `products`
   - **Public bucket**: ✅ ACTIVAR (muy importante)
   - **File size limit**: Dejar por defecto o ajustar según necesites
5. Click en **"Create bucket"**

### Paso 2: Configurar Políticas de Seguridad (SQL)

Una vez creado el bucket, ejecuta el script SQL para configurar las políticas:

**Opción A: Desde SQL Editor**
1. Ve a **SQL Editor** en el menú lateral
2. Click en **"New query"**
3. Copia y pega el contenido de `scripts/050_create_storage_buckets.sql`
4. Click en **"Run"**

**Opción B: Configurar políticas manualmente**

Si prefieres configurar las políticas desde la interfaz:

1. Ve a **Storage** > Click en el bucket **"products"**
2. Ve a la pestaña **"Policies"**
3. Click en **"New policy"**
4. Crea las siguientes políticas:

#### Política 1: Lectura Pública
- **Policy name**: `Public Access`
- **Allowed operation**: `SELECT`
- **Policy definition**:
  ```sql
  bucket_id = 'products'
  ```

#### Política 2: Subida (Usuarios Autenticados)
- **Policy name**: `Authenticated users can upload product images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'products'
  ```

#### Política 3: Actualización (Usuarios Autenticados)
- **Policy name**: `Authenticated users can update product images`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'products'
  ```

#### Política 4: Eliminación (Usuarios Autenticados)
- **Policy name**: `Authenticated users can delete product images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'products'
  ```

### Paso 3: Verificar la Configuración

1. Ve a **Storage** en Supabase Dashboard
2. Deberías ver el bucket **"products"** con un ícono de 🌐 (indicando que es público)
3. Click en el bucket y ve a **"Policies"**
4. Verifica que las 4 políticas estén activas

### Paso 4: Probar la Funcionalidad

1. Inicia tu aplicación
2. Ve a **Productos** > **Nuevo Producto**
3. Intenta subir una imagen
4. Si todo está configurado correctamente, la imagen debería subirse sin errores

## Uso

Una vez configurado, los usuarios podrán:

1. **Crear productos**: Subir una imagen al crear un nuevo producto
2. **Editar productos**: Cambiar o eliminar la imagen de un producto existente
3. **Ver productos**: Las imágenes se mostrarán en el listado y detalle de productos

## Límites y consideraciones

- **Tamaño máximo por imagen**: 5MB
- **Formatos soportados**: JPG, PNG, GIF, WebP
- **Almacenamiento**: Verifica los límites de tu plan de Supabase
- **Optimización**: Las imágenes se muestran usando Next.js Image para optimización automática

## Troubleshooting

### Error: "new row violates row-level security policy"

Verifica que las políticas RLS estén correctamente configuradas y que el usuario esté autenticado.

### Error: "Bucket not found"

Asegúrate de que el bucket `products` existe en tu proyecto de Supabase.

### Las imágenes no se muestran

1. Verifica que el bucket sea público
2. Verifica que la URL de la imagen sea correcta
3. Revisa la consola del navegador para errores de CORS

### Error de CORS

Si tienes problemas de CORS, verifica la configuración de tu proyecto en Supabase Dashboard:
1. Ve a **Settings** > **API**
2. Verifica que tu dominio esté en la lista de orígenes permitidos
