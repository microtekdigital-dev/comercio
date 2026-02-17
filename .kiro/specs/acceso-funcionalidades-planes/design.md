# Design Document: Acceso a Funcionalidades por Planes

## Overview

Este diseño modifica el sistema de restricciones de planes del ERP para:
1. Habilitar Proveedores y Órdenes de Compra en el plan Trial
2. Mostrar todas las funcionalidades en el menú de navegación con indicadores visuales para las bloqueadas
3. Mantener los bloqueos de acceso existentes intactos

El enfoque es puramente visual y de permisos - no se modifican las funcionalidades existentes, solo se ajustan las reglas de acceso y la presentación en el UI.

## Architecture

### Componentes Afectados

1. **Plan Limits Module** (`lib/utils/plan-limits.ts`)
   - Funciones de verificación de permisos
   - Actualización de lógica para Trial

2. **Sidebar Server Component** (`components/dashboard/sidebar-server.tsx`)
   - Evaluación de permisos para todas las funcionalidades
   - Paso de información de bloqueo al componente cliente

3. **Sidebar Client Component** (`components/dashboard/sidebar.tsx`)
   - Renderizado de funcionalidades bloqueadas con indicadores
   - Manejo de clicks en funcionalidades bloqueadas

4. **Route Guards** (páginas individuales)
   - Verificación server-side de permisos
   - Redirección para acceso no autorizado

### Flujo de Datos

```
User Request
    ↓
Sidebar Server (evalúa permisos)
    ↓
Sidebar Client (renderiza con indicadores)
    ↓
User Click
    ↓
Route Guard (verifica permisos server-side)
    ↓
Allow/Deny Access
```

## Components and Interfaces

### 1. Plan Limits Module Updates

**Funciones a Modificar:**

```typescript
// Actualizar para permitir Trial
export async function canAccessSuppliers(companyId: string): Promise<{
  allowed: boolean;
  requiredPlan?: string;
  message?: string;
}> {
  const limits = await getCurrentPlanLimits(companyId);
  const planName = limits.planName.toLowerCase();
  
  // CAMBIO: Ahora Trial también tiene acceso
  const hasAccess = 
    planName.includes("trial") ||
    planName.includes("básico") ||
    planName.includes("pro") || 
    planName.includes("profesional") || 
    planName.includes("empresarial");
  
  return {
    allowed: hasAccess,
    requiredPlan: hasAccess ? undefined : "Básico",
    message: hasAccess ? undefined : "La gestión de proveedores está disponible en el plan Básico o superior.",
  };
}

// Actualizar para permitir Trial
export async function canAccessPurchaseOrders(companyId: string): Promise<{
  allowed: boolean;
  requiredPlan?: string;
  message?: string;
}> {
  const limits = await getCurrentPlanLimits(companyId);
  const planName = limits.planName.toLowerCase();
  
  // CAMBIO: Ahora Trial también tiene acceso
  const hasAccess = 
    planName.includes("trial") ||
    planName.includes("básico") ||
    planName.includes("pro") || 
    planName.includes("profesional") || 
    planName.includes("empresarial");
  
  return {
    allowed: hasAccess,
    requiredPlan: hasAccess ? undefined : "Básico",
    message: hasAccess ? undefined : "Las órdenes de compra están disponibles en el plan Básico o superior.",
  };
}
```

**Funciones Existentes a Actualizar (agregar requiredPlan):**

Todas las funciones de verificación de permisos deben retornar información sobre el plan requerido:

```typescript
export async function canAccessStockHistory(companyId: string): Promise<{
  allowed: boolean;
  requiredPlan?: string;
  message?: string;
}> {
  const limits = await getCurrentPlanLimits(companyId);
  const hasAccess = limits.planName !== "Trial";
  
  return {
    allowed: hasAccess,
    requiredPlan: hasAccess ? undefined : "Básico",
    message: hasAccess 
      ? undefined 
      : "El historial de stock está disponible en planes de pago.",
  };
}

// Similar para todas las demás funciones...
```

### 2. Feature Permission Interface

**Nueva Interfaz:**

```typescript
// lib/types/plans.ts (nuevo archivo o agregar a existente)
export interface FeaturePermission {
  allowed: boolean;
  requiredPlan?: string;
  message?: string;
}

export interface NavigationFeature {
  href: string;
  label: string;
  icon: any;
  permission: FeaturePermission;
}
```

### 3. Sidebar Server Component Updates

**Cambios Necesarios:**

```typescript
// components/dashboard/sidebar-server.tsx
export async function DashboardSidebarServer() {
  const user = await getCurrentUser();
  
  if (!user || !user.company_id) {
    return null;
  }

  // Evaluar permisos para TODAS las funcionalidades
  const permissions = {
    purchaseOrders: await canAccessPurchaseOrders(user.company_id),
    suppliers: await canAccessSuppliers(user.company_id),
    stockHistory: await canAccessStockHistory(user.company_id),
    priceHistory: await canAccessPriceHistory(user.company_id),
    cashRegister: await canAccessCashRegister(user.company_id),
    inventoryLiquidation: await canAccessInventoryLiquidation(user.company_id),
    accountsSettlement: await canAccessAccountsSettlement(user.company_id),
  };

  return (
    <DashboardSidebar 
      user={serializedUser} 
      permissions={permissions}
    />
  );
}
```

### 4. Sidebar Client Component Updates

**Cambios en la Estructura:**

```typescript
// components/dashboard/sidebar.tsx
interface SidebarProps {
  user: Profile;
  permissions: {
    purchaseOrders: FeaturePermission;
    suppliers: FeaturePermission;
    stockHistory: FeaturePermission;
    priceHistory: FeaturePermission;
    cashRegister: FeaturePermission;
    inventoryLiquidation: FeaturePermission;
    accountsSettlement: FeaturePermission;
  };
}

// Renderizado de items con indicadores
const renderNavItem = (item: NavItem, permission: FeaturePermission) => {
  const Icon = item.icon;
  const isActive = pathname === item.href;
  const isLocked = !permission.allowed;

  if (isLocked) {
    // Renderizar como bloqueado
    return (
      <button
        key={item.href}
        onClick={() => handleLockedFeatureClick(permission)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full text-left",
          "text-muted-foreground hover:bg-muted/50 cursor-not-allowed opacity-60"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{item.label}</span>
        <span className="text-xs">🔒 {permission.requiredPlan}</span>
      </button>
    );
  }

  // Renderizar como accesible
  return (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
};

const handleLockedFeatureClick = (permission: FeaturePermission) => {
  toast.error(permission.message || "Esta funcionalidad no está disponible en tu plan actual", {
    description: "Actualiza tu plan para acceder a esta funcionalidad",
    action: {
      label: "Ver Planes",
      onClick: () => router.push("/dashboard/billing"),
    },
  });
};
```

### 5. Route Guards

**Patrón para Páginas Protegidas:**

```typescript
// Ejemplo: app/dashboard/stock-history/page.tsx
export default async function StockHistoryPage() {
  const user = await getCurrentUser();
  
  if (!user?.company_id) {
    redirect("/dashboard");
  }

  // Verificar permisos server-side
  const permission = await canAccessStockHistory(user.company_id);
  
  if (!permission.allowed) {
    redirect("/dashboard?error=insufficient_permissions");
  }

  // Renderizar página...
}
```

## Data Models

No se requieren cambios en los modelos de datos. Los planes existentes en la base de datos permanecen sin cambios.

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Trial Plan Supplier Access

*For any* company with Trial plan, all CRUD operations on suppliers (create, read, update, delete) should succeed without permission errors.

**Validates: Requirements 1.1**

### Property 2: Trial Plan Purchase Order Access

*For any* company with Trial plan, all CRUD operations on purchase orders (create, read, update, delete) should succeed without permission errors.

**Validates: Requirements 2.1**

### Property 3: Permission Function Returns Trial Access

*For any* company with Trial plan, calling canAccessSuppliers and canAccessPurchaseOrders should return allowed: true.

**Validates: Requirements 1.3, 2.3**

### Property 4: Menu Displays All Features

*For any* user regardless of plan, the navigation menu should display all system features (not just accessible ones).

**Validates: Requirements 3.1**

### Property 5: Locked Features Show Lock Indicator

*For any* feature that a user cannot access, the navigation menu should render that feature with a lock icon (🔒) and the required plan name.

**Validates: Requirements 3.2, 3.3**

### Property 6: Locked Feature Click Prevention

*For any* locked feature, clicking on it should prevent navigation, not change the URL, and display an upgrade message.

**Validates: Requirements 3.4**

### Property 7: Accessible Features No Lock Indicator

*For any* feature that a user can access, the navigation menu should render that feature without any lock icon or plan requirement indicator.

**Validates: Requirements 3.5**

### Property 8: UI Changes Don't Modify Permissions

*For any* permission check function, the return value should be identical before and after UI rendering changes (showing locked features doesn't change underlying permissions).

**Validates: Requirements 3.6**

### Property 9: Trial Restrictions Maintained

*For any* company with Trial plan, calling canAccessStockHistory, canAccessPriceHistory, and canAccessCashRegister should return allowed: false.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 10: Professional Plan Restrictions Maintained

*For any* company with Básico or Trial plan, calling canAccessInventoryLiquidation and canAccessAccountsSettlement should return allowed: false.

**Validates: Requirements 4.4, 4.5, 4.6**

### Property 11: Permission Functions Return Complete Information

*For any* permission check function, the return value should include allowed (boolean), requiredPlan (string or undefined), and message (string or undefined) fields.

**Validates: Requirements 5.3**

### Property 12: Plan Change Updates Menu

*For any* user whose plan is changed, the navigation menu should re-render and reflect the new permissions within the next page load.

**Validates: Requirements 6.4**

### Property 13: Consistent Locked Feature Styling

*For all* locked features in the navigation menu, the rendered HTML should use identical CSS classes and structure for the lock indicator.

**Validates: Requirements 6.5**

### Property 14: Upgrade Messages Include CTA

*For any* locked feature click, the displayed upgrade message should include a call-to-action button or link that navigates to /dashboard/billing.

**Validates: Requirements 7.2**

### Property 15: Consistent Plan Naming

*For any* permission function that returns a requiredPlan value, the value should be one of: "Básico", "Profesional", or "Empresarial".

**Validates: Requirements 7.3**

### Property 16: Direct URL Access Blocked

*For any* locked feature and any user without permission, attempting to access the feature's page directly via URL should result in a redirect to /dashboard.

**Validates: Requirements 8.1**

### Property 17: API Endpoints Enforce Permissions

*For any* API endpoint that requires specific plan permissions, calling it without proper permissions should return a 403 or 401 error response.

**Validates: Requirements 8.3**

## Error Handling

### Permission Denied Scenarios

1. **Direct URL Access to Locked Feature**
   - Detect: Server-side permission check fails
   - Handle: Redirect to `/dashboard?error=insufficient_permissions`
   - User sees: Toast notification with upgrade message

2. **API Call Without Permissions**
   - Detect: Permission check in API route fails
   - Handle: Return 403 Forbidden with error message
   - User sees: Error toast with upgrade option

3. **Locked Feature Click in UI**
   - Detect: Click handler checks permission state
   - Handle: Prevent navigation, show toast
   - User sees: Upgrade message with "Ver Planes" button

### Edge Cases

1. **Plan Change During Session**
   - Use `dynamic = 'force-dynamic'` and `revalidate = 0` on layout
   - Permissions re-evaluated on each navigation
   - No stale permission state

2. **Missing Company ID**
   - All permission functions handle null/undefined company_id
   - Default to most restrictive permissions
   - Redirect to onboarding if needed

3. **Database Query Failures**
   - Permission functions catch errors
   - Default to denied access (fail-safe)
   - Log errors for monitoring

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Permission Function Tests**
   - Test each permission function with Trial plan returns correct values
   - Test permission functions with other plans maintain restrictions
   - Test permission functions handle missing company_id

2. **UI Rendering Tests**
   - Test locked feature renders with lock icon
   - Test accessible feature renders without lock icon
   - Test click handler prevents navigation for locked features

3. **Route Guard Tests**
   - Test page redirects when permission denied
   - Test page renders when permission granted

### Property-Based Tests

Property tests will verify universal properties across all inputs. Each test should run a minimum of 100 iterations.

1. **Property 1-3: Trial Access Tests**
   - Generate random Trial companies
   - Verify supplier and purchase order access allowed
   - Tag: **Feature: acceso-funcionalidades-planes, Property 1-3: Trial plan access**

2. **Property 4-7: Menu Rendering Tests**
   - Generate random users with different plans
   - Verify menu shows all features with correct indicators
   - Tag: **Feature: acceso-funcionalidades-planes, Property 4-7: Menu rendering**

3. **Property 8: Permission Immutability Test**
   - Generate random companies and features
   - Verify permission values unchanged by UI operations
   - Tag: **Feature: acceso-funcionalidades-planes, Property 8: Permission immutability**

4. **Property 9-10: Restriction Maintenance Tests**
   - Generate random Trial and Básico companies
   - Verify existing restrictions still enforced
   - Tag: **Feature: acceso-funcionalidades-planes, Property 9-10: Restriction maintenance**

5. **Property 11: Permission Return Structure Test**
   - Generate random companies and features
   - Verify all permission functions return complete structure
   - Tag: **Feature: acceso-funcionalidades-planes, Property 11: Permission structure**

6. **Property 12-13: UI Consistency Tests**
   - Generate random plan changes and locked features
   - Verify consistent rendering and updates
   - Tag: **Feature: acceso-funcionalidades-planes, Property 12-13: UI consistency**

7. **Property 14-15: Upgrade Message Tests**
   - Generate random locked feature clicks
   - Verify messages include CTA and use consistent naming
   - Tag: **Feature: acceso-funcionalidades-planes, Property 14-15: Upgrade messages**

8. **Property 16-17: Access Control Tests**
   - Generate random unauthorized access attempts
   - Verify redirects and API errors
   - Tag: **Feature: acceso-funcionalidades-planes, Property 16-17: Access control**

### Testing Library

For TypeScript/React, we will use:
- **fast-check** for property-based testing
- **Jest** or **Vitest** as the test runner
- **React Testing Library** for component tests

Each property test will be configured to run 100 iterations minimum to ensure comprehensive coverage through randomization.

