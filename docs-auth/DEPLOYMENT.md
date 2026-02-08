# 🚀 Guía de Despliegue

Esta guía te ayudará a desplegar tu ERP en producción usando Vercel y Supabase.

## 📋 Pre-requisitos

- Cuenta de GitHub
- Cuenta de Vercel (gratis)
- Cuenta de Supabase (gratis)
- Cuenta de MercadoPago (opcional, para pagos)

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Inicializar Git (si no lo has hecho)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Crea un nuevo repositorio (puede ser privado)
3. NO inicialices con README, .gitignore o licencia

### 1.3 Conectar y Subir

```bash
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

## 🗄️ Paso 2: Configurar Supabase

### 2.1 Crear Proyecto

1. Ve a https://supabase.com/dashboard
2. Crea un nuevo proyecto
3. Guarda la URL y las API Keys

### 2.2 Ejecutar Scripts SQL

Ejecuta los scripts en este orden desde el SQL Editor de Supabase:

```sql
-- 1. Crear esquema y tablas base
scripts/001_create_schema.sql
scripts/001_create_tables.sql

-- 2. Crear sistema de planes y suscripciones
scripts/002_create_plans_subscriptions.sql

-- 3. Crear tablas ERP
scripts/010_create_erp_tables.sql

-- 4. Configuración de empresa
scripts/020_add_company_settings.sql

-- 5. Sistema de notificaciones
scripts/030_create_notifications.sql

-- 6. Proveedores
scripts/040_create_suppliers.sql

-- 7. Simplificar estados de venta
scripts/060_simplify_sale_status.sql

-- 8. Seed de planes (opcional)
scripts/seed-plans.sql
```

### 2.3 Configurar Storage

1. Ve a Storage en Supabase Dashboard
2. Crea un bucket llamado `products`
3. Configura las políticas de acceso:
   - Lectura pública: ✅
   - Escritura: Solo usuarios autenticados

## 🌐 Paso 3: Desplegar en Vercel

### 3.1 Conectar Repositorio

1. Ve a https://vercel.com/new
2. Importa tu repositorio de GitHub
3. Vercel detectará automáticamente que es Next.js

### 3.2 Configurar Variables de Entorno

En la sección "Environment Variables", agrega:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

Variables opcionales:

```env
MERCADOPAGO_ACCESS_TOKEN=tu_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key
RESEND_API_KEY=tu_resend_key
CRON_SECRET=un_token_secreto_aleatorio
```

### 3.3 Desplegar

1. Click en "Deploy"
2. Espera 2-3 minutos
3. ¡Tu app estará en línea!

## ⏰ Paso 4: Configurar Notificaciones Automáticas

### Opción A: Vercel Cron (Plan Pro - $20/mes)

Crea `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Opción B: cron-job.org (Gratis)

1. Ve a https://cron-job.org
2. Crea una cuenta
3. Crea un nuevo cron job:
   - URL: `https://tu-app.vercel.app/api/cron/notifications`
   - Frecuencia: Cada hora
   - Headers (si configuraste CRON_SECRET):
     ```
     Authorization: Bearer tu_cron_secret
     ```

### Opción C: GitHub Actions (Gratis)

Crea `.github/workflows/notifications.yml`:

```yaml
name: Run Notification Checks

on:
  schedule:
    - cron: '0 * * * *'  # Cada hora
  workflow_dispatch:  # Permite ejecución manual

jobs:
  check-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call notification endpoint
        run: |
          curl -X GET https://tu-app.vercel.app/api/cron/notifications \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🔐 Paso 5: Seguridad

### 5.1 Configurar CRON_SECRET

1. Genera un token aleatorio:
   ```bash
   openssl rand -base64 32
   ```

2. Agrégalo a las variables de entorno en Vercel

3. Úsalo en tus cron jobs externos

### 5.2 Configurar Políticas RLS en Supabase

Las políticas ya están en los scripts SQL, pero verifica que estén activas:

- ✅ Row Level Security habilitado en todas las tablas
- ✅ Políticas de acceso por company_id
- ✅ Solo usuarios autenticados pueden acceder

## 📊 Paso 6: Monitoreo

### Vercel Analytics (Opcional)

1. Ve a tu proyecto en Vercel
2. Habilita Analytics
3. Monitorea tráfico y rendimiento

### Supabase Logs

1. Ve a Logs en Supabase Dashboard
2. Monitorea queries y errores

## 🔄 Actualizaciones Futuras

Para actualizar tu app:

```bash
git add .
git commit -m "Descripción de cambios"
git push
```

Vercel desplegará automáticamente los cambios.

## 🆘 Solución de Problemas

### Error: "Invalid API Key"
- Verifica que las variables de entorno estén correctas
- Asegúrate de usar `NEXT_PUBLIC_` para variables del cliente

### Error: "Database connection failed"
- Verifica la URL de Supabase
- Asegúrate de que las tablas estén creadas

### Notificaciones no funcionan
- Verifica que el script SQL de notificaciones esté ejecutado
- Prueba manualmente desde Configuración → Notificaciones → "Verificar Alertas Ahora"
- Verifica que el cron job esté configurado correctamente

### Imágenes no se suben
- Verifica que el bucket "products" exista en Supabase Storage
- Verifica las políticas de acceso del bucket

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Revisa los logs en Supabase Dashboard
3. Verifica que todas las variables de entorno estén configuradas

## 🎉 ¡Listo!

Tu ERP está ahora en producción. Puedes:
- Compartir la URL con tus clientes
- Configurar un dominio personalizado en Vercel
- Monitorear el uso y rendimiento
- Escalar según sea necesario

---

**Costos Estimados:**
- Vercel Hobby: $0/mes (sin cron jobs)
- Vercel Pro: $20/mes (con cron jobs)
- Supabase Free: $0/mes (hasta 500MB)
- Supabase Pro: $25/mes (más recursos)
- cron-job.org: $0/mes (alternativa a Vercel cron)

**Total mínimo:** $0/mes usando plan gratuito + cron-job.org
**Total recomendado:** $20-45/mes para producción seria
