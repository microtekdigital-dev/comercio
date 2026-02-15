# Restricciones de Liquidaciones Implementadas

## Resumen
Se han implementado restricciones de plan para las funcionalidades de liquidación de inventario y liquidación de cuentas. Estas funcionalidades ahora solo están disponibles para los planes Profesional y Empresarial.

## Cambios Realizados

### 1. Nuevas Funciones en `lib/utils/plan-limits.ts`

Se agregaron dos nuevas funciones para verificar el acceso a las funcionalidades de liquidación:

#### `canAccessInventoryLiquidation(companyId: string)`
- Verifica si el plan tiene acceso a liquidación de inventario
- Solo planes Profesional y Empresarial tienen acceso
- Retorna: `{ allowed: boolean, message?: string }`

#### `canAccessAccountsSettlement(companyId: string)`
- Verifica si el plan tiene acceso a liquidación de cuentas
- Solo planes Profesional y Empresarial tienen acceso
- Retorna: `{ allowed: boolean, message?: string }`

### 2. Actualización de Páginas

#### `app/dashboard/inventory-report/page.tsx`
- Se agregó verificación de acceso usando `canAccessInventoryLiquidation()`
- Si el usuario no tiene acceso, se muestra un mensaje de error con un botón para ver los planes
- Se importaron componentes necesarios: `Alert`, `AlertCircle`, `Button`, `Link`

#### `app/dashboard/accounts-settlement/page.tsx`
- Se agregó verificación de acceso usando `canAccessAccountsSettlement()`
- Si el usuario no tiene acceso, se muestra un mensaje de error con un botón para ver los planes
- Se importaron componentes necesarios: `Alert`, `AlertCircle`, `Button`, `Link`

### 3. Actualización del Sidebar

#### `components/dashboard/sidebar-server.tsx`
- Se importaron las nuevas funciones de verificación de acceso
- Se agregaron verificaciones para `canSeeInventoryLiquidation` y `canSeeAccountsSettlement`
- Se pasan estas props al componente `DashboardSidebar`

#### `components/dashboard/sidebar.tsx`
- Se actualizó la interfaz `SidebarProps` para incluir:
  - `canSeeInventoryLiquidation?: boolean`
  - `canSeeAccountsSettlement?: boolean`
- Se actualizó la función del componente para recibir estas props con valores por defecto `true`
- Se actualizó `navSections` para ocultar los enlaces si el usuario no tiene acceso:
  - "Liquidación de Inventario" solo se muestra si `canSeeInventoryLiquidation` es `true`
  - "Liquidación de Cuentas" solo se muestra si `canSeeAccountsSettlement` es `true`
- Se actualizó el array de dependencias de `useMemo` para incluir las nuevas props

## Comportamiento

### Para usuarios con plan Básico o Trial:
- Los enlaces "Liquidación de Inventario" y "Liquidación de Cuentas" NO aparecen en el sidebar
- Si intentan acceder directamente a las URLs, verán un mensaje de error con un botón para actualizar su plan

### Para usuarios con plan Profesional o Empresarial:
- Los enlaces aparecen normalmente en el sidebar
- Tienen acceso completo a ambas funcionalidades

## Mensajes de Error

Cuando un usuario sin acceso intenta acceder a estas funcionalidades, ve:

**Liquidación de Inventario:**
> "La liquidación de inventario está disponible en el plan Profesional o superior. Actualiza tu plan para acceder a esta funcionalidad."

**Liquidación de Cuentas:**
> "La liquidación de cuentas está disponible en el plan Profesional o superior. Actualiza tu plan para acceder a esta funcionalidad."

## Archivos Modificados

1. `lib/utils/plan-limits.ts` - Agregadas funciones de verificación
2. `app/dashboard/inventory-report/page.tsx` - Agregada verificación de acceso
3. `app/dashboard/accounts-settlement/page.tsx` - Agregada verificación de acceso
4. `components/dashboard/sidebar-server.tsx` - Agregadas verificaciones y props
5. `components/dashboard/sidebar.tsx` - Actualizado para ocultar enlaces según permisos

## Testing

Para probar estas restricciones:

1. Crear una empresa con plan Básico
2. Verificar que los enlaces no aparecen en el sidebar
3. Intentar acceder directamente a `/dashboard/inventory-report` y `/dashboard/accounts-settlement`
4. Verificar que se muestra el mensaje de error con el botón "Ver Planes"
5. Actualizar el plan a Profesional o Empresarial
6. Verificar que los enlaces ahora aparecen en el sidebar
7. Verificar que se puede acceder a ambas funcionalidades

## Notas Técnicas

- Las verificaciones se realizan en el servidor (server-side) para mayor seguridad
- Se usa `useMemo` en el sidebar para evitar problemas de hidratación
- Los valores por defecto de las props son `true` para mantener compatibilidad con código existente
- La verificación de plan usa `includes()` para ser flexible con variaciones de nombres (ej: "Profesional Anual")
