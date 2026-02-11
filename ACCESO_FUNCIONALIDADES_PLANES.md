# Acceso a Funcionalidades por Plan

## Resumen de Acceso

### Funcionalidades Bloqueadas SOLO en Trial:
- ✅ Historial de Stock
- ✅ Historial de Precios  
- ✅ Cierre de Caja

### Planes con Acceso Completo:
- ✅ Básico
- ✅ Profesional
- ✅ Empresarial

## Implementación Actual

El sistema ya está configurado correctamente. Las funciones de verificación en `lib/utils/plan-limits.ts` bloquean SOLO el plan Trial:

### 1. Historial de Stock
```typescript
export async function canAccessStockHistory(companyId: string) {
  const limits = await getCurrentPlanLimits(companyId);
  
  // Trial no tiene acceso, todos los demás planes sí
  const hasAccess = limits.planName !== "Trial";
  
  return {
    allowed: hasAccess,
    message: hasAccess 
      ? undefined 
      : "El historial de stock está disponible en planes de pago."
  };
}
```

### 2. Historial de Precios
```typescript
export async function canAccessPriceHistory(companyId: string) {
  const limits = await getCurrentPlanLimits(companyId);
  
  // Trial no tiene acceso, todos los demás planes sí
  const hasAccess = limits.planName !== "Trial";
  
  return {
    allowed: hasAccess,
    message: hasAccess 
      ? undefined 
      : "El historial de precios está disponible en planes de pago."
  };
}
```

### 3. Cierre de Caja
```typescript
export async function canAccessCashRegister(companyId: string) {
  const limits = await getCurrentPlanLimits(companyId);
  
  // Trial no tiene acceso, todos los demás planes sí
  const hasAccess = limits.planName !== "Trial";
  
  return {
    allowed: hasAccess,
    message: hasAccess 
      ? undefined 
      : "El cierre de caja está disponible en planes de pago."
  };
}
```

## Matriz de Acceso por Plan

| Funcionalidad | Trial | Básico | Profesional | Empresarial |
|--------------|-------|--------|-------------|-------------|
| Historial de Stock | ❌ | ✅ | ✅ | ✅ |
| Historial de Precios | ❌ | ✅ | ✅ | ✅ |
| Cierre de Caja | ❌ | ✅ | ✅ | ✅ |
| Proveedores | ❌ | ❌ | ✅ | ✅ |
| Órdenes de Compra | ❌ | ❌ | ✅ | ✅ |
| Exportar Excel | ❌ | ❌ | ✅ | ✅ |
| Reportes Avanzados | ❌ | ❌ | ✅ | ✅ |
| Reportes Completos | ❌ | ❌ | ❌ | ✅ |

## Cómo Funciona

### Verificación en el Sidebar
El archivo `components/dashboard/sidebar-server.tsx` verifica los permisos:

```typescript
const canSeeStockHistory = user.company_id
  ? (await canAccessStockHistory(user.company_id)).allowed
  : false;

const canSeePriceHistory = user.company_id
  ? (await canAccessPriceHistory(user.company_id)).allowed
  : false;

const canSeeCashRegister = user.company_id
  ? (await canAccessCashRegister(user.company_id)).allowed
  : false;
```

### Filtrado de Enlaces
El archivo `components/dashboard/sidebar.tsx` filtra los enlaces del menú:

```typescript
const baseAdminNavItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  // ... otros enlaces ...
  ...(canSeeStockHistory ? [{ href: "/dashboard/stock-history", label: "Historial de Stock", icon: History }] : []),
  ...(canSeePriceHistory ? [{ href: "/dashboard/price-history", label: "Historial de Precios", icon: TrendingUp }] : []),
  { href: "/dashboard/sales", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/quotes", label: "Presupuestos", icon: FileText },
  ...(canSeeCashRegister ? [{ href: "/dashboard/cash-register", label: "Cierre de Caja", icon: DollarSign }] : []),
  // ... más enlaces ...
];
```

## Comportamiento del Usuario

### Usuario con Plan Trial:
- NO ve los enlaces de:
  - Historial de Stock
  - Historial de Precios
  - Cierre de Caja
- Si intenta acceder directamente a la URL, será bloqueado

### Usuario con Plan Básico, Profesional o Empresarial:
- VE y puede acceder a:
  - Historial de Stock
  - Historial de Precios
  - Cierre de Caja
- Acceso completo sin restricciones

## Verificación

Para verificar que todo funciona correctamente:

1. Inicia sesión con una cuenta Trial
2. Verifica que NO aparecen los enlaces de:
   - Historial de Stock
   - Historial de Precios
   - Cierre de Caja

3. Actualiza a un plan de pago (Básico, Profesional o Empresarial)
4. Verifica que AHORA SÍ aparecen todos los enlaces

## Notas Importantes

- ✅ La lógica está basada en el NOMBRE del plan, no en el precio
- ✅ Cambiar el precio del plan NO afecta los bloqueos
- ✅ Solo el plan "Trial" está bloqueado
- ✅ Todos los planes de pago tienen acceso completo
- ✅ Los bloqueos se aplican tanto en el sidebar como en el acceso directo a las URLs

---

**Estado:** ✅ Implementado y funcionando correctamente
**Última actualización:** 11 de febrero de 2026
