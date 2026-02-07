# 🏢 ERP Multi-Tenant SaaS

Sistema ERP completo multi-tenant construido con Next.js 14, Supabase y TypeScript. Diseñado para pequeñas y medianas empresas que necesitan gestionar inventario, ventas, clientes, proveedores y más.

## ✨ Características Principales

### 📦 Gestión de Inventario
- Control de productos y servicios
- Seguimiento de stock en tiempo real
- Alertas automáticas de stock bajo
- Categorización de productos
- Carga de imágenes de productos
- Códigos SKU personalizados

### 💰 Gestión de Ventas
- Creación rápida de ventas
- Múltiples métodos de pago
- Calculadora de vuelto para efectivo
- Pagos parciales y completos
- Historial de pagos
- Estados simplificados (borrador, completada, cancelada)
- Impresión de facturas
- Envío por email

### 👥 Gestión de Clientes
- Base de datos de clientes
- Historial de compras
- Información de contacto
- Notas y observaciones

### 🏭 Gestión de Proveedores
- Registro de proveedores
- Órdenes de compra
- Control de pagos a proveedores
- Historial de transacciones

### 📊 Reportes y Analíticas
- Dashboard con métricas clave
- Reportes de ventas
- Análisis de inventario
- Productos más vendidos
- Exportación de datos

### 🔔 Sistema de Notificaciones
- Alertas de stock bajo
- Recordatorios de pagos pendientes
- Notificaciones en tiempo real
- Configuración personalizable

### 👥 Multi-Tenant y Roles
- Sistema multi-empresa
- Roles: Administrador y Empleado
- Permisos granulares
- Invitaciones por email
- Gestión de equipo

### 💳 Integración de Pagos
- MercadoPago integrado
- Múltiples métodos de pago
- Suscripciones y planes

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Server Actions
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Pagos**: MercadoPago
- **Email**: Resend (opcional)
- **Despliegue**: Vercel

## 🚀 Inicio Rápido

### Pre-requisitos

- Node.js 18+ 
- npm, yarn, pnpm o bun
- Cuenta de Supabase
- Cuenta de Vercel (para producción)

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
```

4. **Configurar base de datos**

Ejecuta los scripts SQL en Supabase en este orden:
- `scripts/001_create_schema.sql`
- `scripts/001_create_tables.sql`
- `scripts/002_create_plans_subscriptions.sql`
- `scripts/010_create_erp_tables.sql`
- `scripts/020_add_company_settings.sql`
- `scripts/030_create_notifications.sql`
- `scripts/040_create_suppliers.sql`
- `scripts/060_simplify_sale_status.sql`

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📚 Documentación

- [Guía de Despliegue](DEPLOYMENT.md) - Cómo desplegar en producción
- [Configuración de Imágenes](README_IMAGENES.md) - Setup de Supabase Storage
- [Setup Manual Completo](SETUP_MANUAL_COMPLETO.md) - Guía detallada de configuración
- [Cambios en Ventas](CAMBIOS_VENTAS.md) - Documentación de cambios

## 🔐 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Autenticación mediante Supabase Auth
- Políticas de acceso por empresa
- Variables de entorno para datos sensibles
- HTTPS en producción

## 🎯 Roadmap

- [ ] Integración con más pasarelas de pago
- [ ] App móvil (React Native)
- [ ] Reportes avanzados con gráficos
- [ ] Integración con contabilidad
- [ ] API pública para integraciones
- [ ] Modo offline
- [ ] Facturación electrónica

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

## 📞 Soporte

Para soporte y consultas:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

Hecho con ❤️ para pequeñas y medianas empresas
