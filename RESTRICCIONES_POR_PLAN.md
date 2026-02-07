# 🔒 Restricciones por Plan Implementadas

## ✅ Funcionalidades Bloqueadas

### Plan Trial y Básico
❌ **Órdenes de Compra** - Bloqueado  
❌ **Gestión de Proveedores** - Bloqueado  
❌ **Exportar a Excel** - Bloqueado  

### Plan Pro
✅ **Órdenes de Compra** - Disponible  
✅ **Gestión de Proveedores** - Disponible  
✅ **Exportar a Excel** - Disponible  
❌ **API Access** - Bloqueado  

### Plan Empresarial
✅ **Todas las funcionalidades** - Disponible  
✅ **API Access** - Disponible  

---

## 📋 Implementación Técnica

### 1. Funciones de Validación (`lib/utils/plan-limits.ts`)

#### `canAccessPurchaseOrders(companyId)`
Verifica si el plan tiene acceso a órdenes de compra.
- **Retorna**: `{ allowed: boolean, message?: string }`
- **Mensaje de error**: "Las órdenes de compra están disponibles en el plan Pro o superior..."

#### `canAccessSuppliers(companyId)`
Verifica si el plan tiene acceso a proveedores.
- **Retorna**: `{ allowed: boolean, message?: string }`
- **Mensaje de error**: "La gestión de proveedores está disponible en el plan Pro o superior..."

#### `canExportToExcel(companyId)`
Verifica si el plan tiene acceso a exportar Excel.
- **Retorna**: `{ allowed: boolean, message?: string }`
- **Mensaje de error**: "La exportación a Excel está disponible en el plan Pro o superior..."

---

### 2. Validaciones en Órdenes de Compra (`lib/actions/purchase-orders.ts`)

#### `getPurchaseOrders()`
- ✅ Verifica acceso antes de listar órdenes
- ✅ Retorna array vacío si no tiene acceso

#### `createPurchaseOrder()`
- ✅ Verifica acceso antes de crear
- ✅ Retorna error con mensaje personalizado

**Ejemplo de error**:
```typescript
{
  error: "Las órdenes de compra están disponibles en el plan Pro o superior. Actualiza tu plan para acceder a esta funcionalidad."
}
```

---

### 3. Validaciones en Proveedores (`lib/actions/suppliers.ts`)

#### `getSuppliers()`
- ✅ Verifica acceso antes de listar proveedores
- ✅ Retorna array vacío si no tiene acceso

#### `createSupplier()`
- ✅ Verifica acceso antes de crear
- ✅ Retorna error con mensaje personalizado

**Ejemplo de error**:
```typescript
{
  error: "La gestión de proveedores está disponible en el plan Pro o superior. Actualiza tu plan para acceder a esta funcionalidad."
}
```

---

### 4. Validaciones en Exportación (`lib/utils/export.ts`)

#### `checkExportAccess(companyId)`
- ✅ Función auxiliar para verificar acceso
- ✅ Debe llamarse antes de exportar

**Uso recomendado en componentes**:
```typescript
const access = await canExportToExcel(companyId);
if (!access.allowed) {
  toast.error(access.message);
  return;
}
// Proceder con exportación
exportToExcel(data, filename);
```

---

## 🎯 Comportamiento por Funcionalidad

### Órdenes de Compra

| Acción | Plan Básico | Plan Pro | Plan Empresarial |
|---|---|---|---|
| Ver lista | ❌ Lista vacía | ✅ Permitido | ✅ Permitido |
| Crear orden | ❌ Error | ✅ Permitido | ✅ Permitido |
| Editar orden | ❌ Error | ✅ Permitido | ✅ Permitido |
| Eliminar orden | ❌ Error | ✅ Permitido | ✅ Permitido |
| Recibir items | ❌ Error | ✅ Permitido | ✅ Permitido |
| Registrar pagos | ❌ Error | ✅ Permitido | ✅ Permitido |

### Proveedores

| Acción | Plan Básico | Plan Pro | Plan Empresarial |
|---|---|---|---|
| Ver lista | ❌ Lista vacía | ✅ Permitido | ✅ Permitido |
| Crear proveedor | ❌ Error | ✅ Permitido | ✅ Permitido |
| Editar proveedor | ❌ Error | ✅ Permitido | ✅ Permitido |
| Eliminar proveedor | ❌ Error | ✅ Permitido | ✅ Permitido |
| Ver estadísticas | ❌ Error | ✅ Permitido | ✅ Permitido |

### Exportación a Excel

| Acción | Plan Básico | Plan Pro | Plan Empresarial |
|---|---|---|---|
| Exportar ventas | ❌ Error | ✅ Permitido | ✅ Permitido |
| Exportar productos | ❌ Error | ✅ Permitido | ✅ Permitido |
| Exportar clientes | ❌ Error | ✅ Permitido | ✅ Permitido |
| Exportar reportes | ❌ Error | ✅ Permitido | ✅ Permitido |

---

## 🚀 Próximos Pasos (Recomendado)

### 1. Ocultar Menús en UI
Actualizar el sidebar para ocultar opciones no disponibles:

```typescript
// components/dashboard/sidebar.tsx
const canSeePurchaseOrders = await canAccessPurchaseOrders(companyId);
const canSeeSuppliers = await canAccessSuppliers(companyId);

{canSeePurchaseOrders && (
  <SidebarMenuItem href="/dashboard/purchase-orders">
    Órdenes de Compra
  </SidebarMenuItem>
)}

{canSeeSuppliers && (
  <SidebarMenuItem href="/dashboard/suppliers">
    Proveedores
  </SidebarMenuItem>
)}
```

### 2. Agregar Badges de Plan
Mostrar qué funcionalidades requieren upgrade:

```typescript
<Button disabled={!canExport}>
  Exportar a Excel
  {!canExport && <Badge>Pro</Badge>}
</Button>
```

### 3. Modal de Upgrade
Crear modal que se muestre cuando intenten acceder a funcionalidad bloqueada:

```typescript
if (!access.allowed) {
  showUpgradeModal({
    feature: "Órdenes de Compra",
    requiredPlan: "Pro",
    currentPlan: "Básico",
    message: access.message
  });
}
```

### 4. Bloquear Rutas en Middleware
Agregar validación en middleware de Next.js:

```typescript
// middleware.ts
if (pathname.startsWith('/dashboard/purchase-orders')) {
  const access = await canAccessPurchaseOrders(companyId);
  if (!access.allowed) {
    return NextResponse.redirect('/dashboard/billing');
  }
}
```

---

## 📊 Resumen de Cambios

### Archivos Modificados
1. ✅ `lib/utils/plan-limits.ts` - Agregadas 3 funciones de validación
2. ✅ `lib/actions/purchase-orders.ts` - Validación en 2 funciones
3. ✅ `lib/actions/suppliers.ts` - Validación en 2 funciones
4. ✅ `lib/utils/export.ts` - Agregada función de verificación

### Funciones Agregadas
- `canAccessPurchaseOrders(companyId)`
- `canAccessSuppliers(companyId)`
- `canExportToExcel(companyId)`
- `checkExportAccess(companyId)`

### Validaciones Implementadas
- ✅ Órdenes de compra bloqueadas en plan Básico
- ✅ Proveedores bloqueados en plan Básico
- ✅ Exportación Excel bloqueada en plan Básico
- ✅ Mensajes de error personalizados
- ✅ Retorno de arrays vacíos en listados

---

## 🧪 Cómo Probar

### 1. Con Plan Básico
```bash
# Intentar acceder a órdenes de compra
curl /api/purchase-orders
# Debería retornar: []

# Intentar crear orden de compra
curl -X POST /api/purchase-orders -d {...}
# Debería retornar: { error: "Las órdenes de compra están disponibles..." }
```

### 2. Con Plan Pro
```bash
# Intentar acceder a órdenes de compra
curl /api/purchase-orders
# Debería retornar: [{ id: "...", ... }]

# Intentar crear orden de compra
curl -X POST /api/purchase-orders -d {...}
# Debería retornar: { data: { id: "...", ... } }
```

### 3. Verificar en UI
1. Iniciar sesión con usuario en plan Básico
2. Intentar acceder a `/dashboard/purchase-orders`
3. Debería ver lista vacía o mensaje de upgrade
4. Intentar crear orden de compra
5. Debería ver error con mensaje personalizado

---

**Fecha**: Febrero 2026  
**Versión**: 1.0
