# Guía Completa de RLS (Row Level Security)

## ¿Qué es RLS y por qué es importante?

RLS (Row Level Security) es una capa de seguridad a nivel de base de datos que controla qué filas puede ver/modificar cada usuario. Es tu **última línea de defensa** - incluso si hay un bug en tu código, RLS protege los datos.

## Estado Actual de RLS en tu Sistema

### ✅ Tablas con RLS HABILITADO

#### 1. **companies** - CRÍTICO ✅
- **Estado**: Habilitado y funcionando
- **Razón**: Evita que usuarios vean/modifiquen empresas de otros
- **Acción**: Mantener habilitado

#### 2. **profiles** - CRÍTICO ✅
- **Estado**: Habilitado (según script 001)
- **Razón**: Protege información personal de usuarios
- **Acción**: Mantener habilitado

#### 3. **invitations** - CRÍTICO ✅
- **Estado**: Habilitado (según script 001)
- **Razón**: Evita que usuarios vean invitaciones de otras empresas
- **Acción**: Mantener habilitado

#### 4. **plans** - PÚBLICO ✅
- **Estado**: Habilitado
- **Razón**: Solo lectura para todos, solo admins modifican
- **Acción**: Mantener habilitado

#### 5. **subscriptions** - CRÍTICO ✅
- **Estado**: Habilitado
- **Razón**: Información sensible de facturación
- **Acción**: Mantener habilitado

#### 6. **payments** - CRÍTICO ✅
- **Estado**: Habilitado
- **Razón**: Información financiera sensible
- **Acción**: Mantener habilitado

#### 7. **suppliers** - CRÍTICO ✅
- **Estado**: Habilitado
- **Razón**: Datos de proveedores por empresa
- **Acción**: Mantener habilitado

#### 8. **purchase_orders** - CRÍTICO ✅
- **Estado**: Habilitado
- **Razón**: Órdenes de compra por empresa
- **Acción**: Mantener habilitado

#### 9. **purchase_order_items** - CRÍTICO ✅
- **Estado**: Habilitado
- **Razón**: Detalles de órdenes de compra
- **Acción**: Mantener habilitado

#### 10. **supplier_payments** - CRÍTICO ✅
- **Estado**: Habilitado
- **Razón**: Pagos a proveedores (información financiera)
- **Acción**: Mantener habilitado

#### 11. **notifications** - IMPORTANTE ✅
- **Estado**: Habilitado
- **Razón**: Notificaciones por empresa/usuario
- **Acción**: Mantener habilitado

#### 12. **notification_preferences** - IMPORTANTE ✅
- **Estado**: Habilitado
- **Razón**: Preferencias personales de usuario
- **Acción**: Mantener habilitado

#### 13. **support_tickets** - CRÍTICO ✅
- **Estado**: Habilitado
- **Razón**: Tickets de soporte por usuario/empresa
- **Acción**: Mantener habilitado

#### 14. **support_messages** - CRÍTICO ✅
- **Estado**: Habilitado
- **Razón**: Mensajes privados de soporte
- **Acción**: Mantener habilitado

---

### ❌ Tablas SIN RLS (NECESITAN HABILITARLO)

#### 1. **customers** - CRÍTICO ❌
- **Estado**: Sin RLS
- **Riesgo**: Alto - Un usuario podría ver clientes de otras empresas
- **Acción**: **HABILITAR URGENTE**
- **Impacto**: Datos sensibles de clientes (emails, teléfonos, direcciones)

#### 2. **categories** - IMPORTANTE ❌
- **Estado**: Sin RLS
- **Riesgo**: Medio - Categorías de productos de otras empresas
- **Acción**: **HABILITAR**
- **Impacto**: Menor, pero puede revelar estructura de negocio

#### 3. **products** - CRÍTICO ❌
- **Estado**: Sin RLS
- **Riesgo**: Alto - Productos, precios, costos de otras empresas
- **Acción**: **HABILITAR URGENTE**
- **Impacto**: Información comercial sensible (precios, costos, stock)

#### 4. **sales** - CRÍTICO ❌
- **Estado**: Sin RLS
- **Riesgo**: Muy Alto - Ventas y facturación de otras empresas
- **Acción**: **HABILITAR URGENTE**
- **Impacto**: Información financiera crítica

#### 5. **sale_items** - CRÍTICO ❌
- **Estado**: Sin RLS
- **Riesgo**: Alto - Detalles de ventas
- **Acción**: **HABILITAR URGENTE**
- **Impacto**: Detalles de transacciones comerciales

#### 6. **sale_payments** - CRÍTICO ❌
- **Estado**: Sin RLS
- **Riesgo**: Muy Alto - Pagos recibidos
- **Acción**: **HABILITAR URGENTE**
- **Impacto**: Información financiera sensible

#### 7. **company_users** - IMPORTANTE ❌
- **Estado**: Sin RLS (deshabilitado intencionalmente)
- **Riesgo**: Medio - Membresías de equipo
- **Acción**: **HABILITAR cuando datos estén limpios**
- **Impacto**: Información de equipo y roles

---

## Prioridades de Implementación

### 🔴 URGENTE (Implementar YA)
1. **sales** - Información financiera crítica
2. **sale_payments** - Pagos recibidos
3. **products** - Precios y costos
4. **customers** - Datos personales de clientes
5. **sale_items** - Detalles de ventas

### 🟡 IMPORTANTE (Implementar pronto)
6. **categories** - Estructura de negocio
7. **company_users** - Membresías de equipo (cuando datos estén limpios)

---

## Script de Implementación

He creado un script completo para habilitar RLS en todas las tablas críticas:
- **Archivo**: `ENABLE_RLS_ERP_TABLES.sql`

Este script incluye:
- Habilitación de RLS en todas las tablas ERP
- Políticas de seguridad para SELECT, INSERT, UPDATE, DELETE
- Verificación de que las políticas funcionan correctamente
- Rollback automático si algo falla

---

## Recomendaciones Finales

### ✅ Mantener Habilitado
- `companies` - Ya funciona bien
- `profiles` - Protección de usuarios
- `invitations` - Seguridad de invitaciones
- `plans`, `subscriptions`, `payments` - Información de facturación
- `suppliers`, `purchase_orders`, etc. - Ya tienen RLS
- `notifications`, `support_tickets` - Ya protegidos

### ⚠️ Habilitar URGENTE
- `customers` - Datos personales
- `products` - Información comercial
- `sales`, `sale_items`, `sale_payments` - Información financiera

### 🔄 Habilitar Después
- `company_users` - Cuando termines de limpiar los datos
- `categories` - Menor prioridad

---

## Cómo Verificar RLS

```sql
-- Ver estado de RLS en todas las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Notas Importantes

1. **RLS no afecta al service_role**: Los scripts de migración y funciones con `SECURITY DEFINER` pueden seguir funcionando

2. **Prueba antes de producción**: Siempre prueba en desarrollo primero

3. **Backup antes de cambios**: Haz backup antes de habilitar RLS en producción

4. **Monitorea después**: Verifica que no haya errores de acceso después de habilitar

5. **RLS es tu amigo**: Aunque parezca complicado, RLS te protege de bugs en el código

---

## Próximos Pasos

1. ✅ Ejecutar `ENABLE_RLS_ERP_TABLES.sql` para tablas críticas
2. ⏳ Probar que todo funciona correctamente
3. ⏳ Limpiar datos de `company_users`
4. ⏳ Habilitar RLS en `company_users`
5. ✅ Mantener RLS habilitado en todas las tablas

---

## Resumen Ejecutivo

**Tablas con RLS**: 14 ✅  
**Tablas sin RLS**: 7 ❌  
**Prioridad Alta**: 5 tablas (sales, payments, products, customers, sale_items)  
**Prioridad Media**: 2 tablas (categories, company_users)

**Recomendación**: Ejecuta el script `ENABLE_RLS_ERP_TABLES.sql` lo antes posible para proteger tus datos críticos.
