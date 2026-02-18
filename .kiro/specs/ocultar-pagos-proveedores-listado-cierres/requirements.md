# Ocultar Pagos a Proveedores en Listado de Cierres

## 1. Descripción General

Actualmente, en la página principal de Apertura/Cierre de Caja (`/dashboard/cash-register`), la tabla de listado de cierres muestra una sección de "Pagos a Proveedores" con el total de pagos y el desglose por efectivo. Esta información debe ocultarse del listado general, pero debe mantenerse visible en el informe detallado individual de cada cierre.

## 2. Problema Actual

En el componente `CashRegisterClient` (líneas 267-280), se renderiza una sección de "Pagos a Proveedores" para cada cierre en el listado:

```tsx
{/* Supplier Payments Summary */}
{closure.supplier_payments_cash > 0 && (
  <div className="mt-4 pt-4 border-t">
    <h4 className="text-sm font-semibold mb-3 text-red-600">Pagos a Proveedores</h4>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-sm text-muted-foreground mb-1">Total Pagos</p>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(closure.supplier_payments_cash)}</p>
      </div>
      <div className="border rounded-lg p-3">
        <p className="text-sm text-muted-foreground mb-1">Efectivo</p>
        <p className="text-lg font-semibold text-red-600">{formatCurrency(closure.supplier_payments_cash)}</p>
      </div>
    </div>
  </div>
)}
```

Esta sección debe eliminarse del listado.

## 3. Historias de Usuario

### 3.1 Como usuario del sistema
**Quiero** que la tabla de listado de cierres de caja muestre solo información resumida de ventas  
**Para** tener una vista más limpia y enfocada en las operaciones principales de caja

**Criterios de Aceptación:**
- La sección "Pagos a Proveedores" NO debe aparecer en las tarjetas de cierre del listado principal
- El listado debe mostrar únicamente:
  - Fecha y hora del cierre
  - Usuario que realizó el cierre
  - Total de ventas y cantidad de ventas
  - Desglose de ventas por método de pago (Efectivo, Tarjeta, Transferencia, Otros)
  - Efectivo esperado, contado y diferencia (si aplica)
  - Notas (si existen)
  - Botón "Ver Informe Detallado"

### 3.2 Como usuario del sistema
**Quiero** que la información de pagos a proveedores siga visible en el informe detallado  
**Para** poder consultar esta información cuando necesite ver el detalle completo de un cierre específico

**Criterios de Aceptación:**
- El informe detallado de cierre (`/dashboard/cash-register/[id]`) debe mantener toda la información de pagos a proveedores
- No debe haber cambios en el componente `CashClosureReport`
- La funcionalidad del informe detallado debe permanecer intacta

## 4. Requisitos Técnicos

### 4.1 Componente a Modificar
- **Archivo:** `components/dashboard/cash-register-client.tsx`
- **Acción:** Eliminar la sección de "Pagos a Proveedores" del renderizado de cada cierre en el listado

### 4.2 Componentes que NO deben modificarse
- `components/dashboard/cash-closure-report.tsx` - Debe mantener la visualización de pagos a proveedores
- `app/dashboard/cash-register/[id]/page.tsx` - No requiere cambios
- Cualquier otro componente relacionado con el informe detallado

## 5. Alcance

### Incluido en el alcance:
- Eliminación de la sección "Pagos a Proveedores" del listado de cierres
- Verificación de que el informe detallado mantiene la información completa

### Fuera del alcance:
- Cambios en la estructura de datos
- Modificaciones en las consultas a la base de datos
- Cambios en el cálculo de pagos a proveedores
- Modificaciones en el informe detallado de cierre

## 6. Notas Adicionales

- Este cambio es puramente visual y de UX
- No afecta la lógica de negocio ni los datos almacenados
- La información de pagos a proveedores seguirá estando disponible en el informe detallado
- El cambio mejora la legibilidad del listado al reducir la cantidad de información mostrada
