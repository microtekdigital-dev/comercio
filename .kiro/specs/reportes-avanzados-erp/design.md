# Diseño: Reportes Avanzados ERP

## 1. Visión General

Este documento describe el diseño para mejorar los reportes avanzados del sistema ERP, específicamente enfocados en:
- Liquidaciones de inventario y cuentas
- Estado de caja y movimientos
- Cuentas corrientes (clientes y proveedores)

Los reportes mejorados proporcionarán información más detallada, filtros avanzados, y capacidades de exportación mejoradas.

## 2. Arquitectura de Componentes

### 2.1 Estructura de Reportes

```
reportes-avanzados/
├── liquidacion-inventario/
│   ├── ReporteDetallado.tsx
│   ├── FiltrosAvanzados.tsx
│   └── ExportadorExcel.tsx
├── liquidacion-cuentas/
│   ├── ReporteConsolidado.tsx
│   ├── DesglosePorEntidad.tsx
│   └── GraficosEstadisticos.tsx
├── estado-caja/
│   ├── ResumenDiario.tsx
│   ├── HistorialMovimientos.tsx
│   └── ComparativasPeriodos.tsx
└── cuentas-corrientes/
    ├── ResumenGeneral.tsx
    ├── DetalleMovimientos.tsx
    └── ProyeccionFlujo.tsx
```

### 2.2 Componentes Principales

#### A. Reporte de Liquidación de Inventario Mejorado

**Características nuevas:**
- Filtros por múltiples categorías simultáneas
- Filtros por rango de fechas con presets (hoy, semana, mes, trimestre, año)
- Filtros por proveedor
- Agrupación por categoría, producto, o proveedor
- Subtotales y totales generales
- Gráficos de movimientos de stock
- Comparativa entre períodos
- Exportación a Excel con formato profesional

**Métricas adicionales:**
- Rotación de inventario por producto
- Productos con mayor movimiento
- Productos con menor movimiento
- Valor promedio de compra vs venta
- Margen de ganancia por producto

#### B. Reporte de Liquidación de Cuentas Mejorado

**Características nuevas:**
- Vista consolidada de todas las cuentas
- Desglose individual por cliente/proveedor
- Filtros por estado (al día, vencido, próximo a vencer)
- Filtros por rango de montos
- Ordenamiento por múltiples criterios
- Gráficos de distribución de deudas
- Proyección de flujo de caja
- Alertas de cuentas vencidas

**Métricas adicionales:**
- Total cuentas por cobrar
- Total cuentas por pagar
- Balance neto
- Antigüedad de saldos (0-30, 31-60, 61-90, +90 días)
- Clientes/proveedores con mayor deuda
- Tendencia de pagos/cobros

#### C. Reporte de Estado de Caja Mejorado

**Características nuevas:**
- Resumen diario con comparativa
- Historial de aperturas y cierres
- Análisis de diferencias de caja
- Gráficos de evolución de caja
- Comparativa entre turnos
- Proyección de caja futura
- Alertas de diferencias significativas

**Métricas adicionales:**
- Promedio de ventas por turno
- Distribución por método de pago
- Tendencia de efectivo vs otros métodos
- Diferencias acumuladas
- Eficiencia de caja (diferencias/total ventas)

#### D. Reporte de Cuentas Corrientes Mejorado

**Características nuevas:**
- Vista unificada de clientes y proveedores
- Detalle de movimientos por entidad
- Filtros por tipo de movimiento (venta, pago, compra, etc.)
- Búsqueda por nombre o documento
- Exportación individual o masiva
- Envío de estado de cuenta por email
- Recordatorios automáticos de pagos

**Métricas adicionales:**
- Historial completo de transacciones
- Saldo actual y evolución
- Días promedio de pago
- Límite de crédito vs saldo actual
- Score de pago (puntualidad)

## 3. Modelos de Datos

### 3.1 Interfaces TypeScript

```typescript
// Reporte de Liquidación de Inventario
interface InventoryLiquidationReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalProducts: number;
    totalMovements: number;
    totalPurchaseValue: number;
    totalSalesValue: number;
    totalProfit: number;
    profitMargin: number;
  };
  byCategory: CategoryLiquidation[];
  byProduct: ProductLiquidation[];
  bySupplier: SupplierLiquidation[];
  topMovers: ProductMovement[];
  slowMovers: ProductMovement[];
}

interface ProductLiquidation {
  productId: string;
  productName: string;
  categoryName: string;
  supplierName?: string;
  initialStock: number;
  purchases: number;
  sales: number;
  finalStock: number;
  purchaseValue: number;
  salesValue: number;
  profit: number;
  profitMargin: number;
  turnoverRate: number;
}

// Reporte de Liquidación de Cuentas
interface AccountsSettlementReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalReceivable: number;
    totalPayable: number;
    netBalance: number;
    overdueReceivable: number;
    overduePayable: number;
  };
  receivables: AccountDetail[];
  payables: AccountDetail[];
  aging: AgingAnalysis;
  projections: CashFlowProjection[];
}

interface AccountDetail {
  entityId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  currentBalance: number;
  overdueAmount: number;
  dueAmount: number;
  movements: AccountMovement[];
  paymentScore: number;
  averagePaymentDays: number;
}

interface AgingAnalysis {
  current: number;      // 0-30 días
  days30to60: number;   // 31-60 días
  days61to90: number;   // 61-90 días
  over90: number;       // +90 días
}

// Reporte de Estado de Caja
interface CashStatusReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalOpenings: number;
    totalClosures: number;
    totalSales: number;
    totalCashSales: number;
    totalDifferences: number;
    averageDifference: number;
  };
  daily: DailyCashStatus[];
  byShift: ShiftAnalysis[];
  byPaymentMethod: PaymentMethodBreakdown;
  trends: CashTrend[];
}

interface DailyCashStatus {
  date: Date;
  openings: CashOpening[];
  closures: CashClosure[];
  totalSales: number;
  totalDifferences: number;
  efficiency: number;
}

// Reporte de Cuentas Corrientes
interface CurrentAccountReport {
  entityId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  currentBalance: number;
  creditLimit?: number;
  movements: AccountMovement[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    oldestMovement: Date;
    lastMovement: Date;
    averagePaymentDays: number;
  };
  aging: AgingAnalysis;
}

interface AccountMovement {
  id: string;
  date: Date;
  type: 'sale' | 'payment' | 'purchase' | 'credit_note' | 'debit_note';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}
```

## 4. Funciones de Servidor

### 4.1 Liquidación de Inventario

```typescript
// lib/actions/inventory-liquidation-advanced.ts

export async function getAdvancedInventoryLiquidation(
  companyId: string,
  filters: {
    startDate: Date;
    endDate: Date;
    categoryIds?: string[];
    productIds?: string[];
    supplierIds?: string[];
    groupBy?: 'category' | 'product' | 'supplier';
  }
): Promise<InventoryLiquidationReport>

export async function getInventoryTurnoverAnalysis(
  companyId: string,
  period: { startDate: Date; endDate: Date }
): Promise<ProductMovement[]>

export async function compareInventoryPeriods(
  companyId: string,
  period1: { startDate: Date; endDate: Date },
  period2: { startDate: Date; endDate: Date }
): Promise<PeriodComparison>
```

### 4.2 Liquidación de Cuentas

```typescript
// lib/actions/accounts-settlement-advanced.ts

export async function getAdvancedAccountsSettlement(
  companyId: string,
  filters: {
    startDate: Date;
    endDate: Date;
    entityType?: 'customer' | 'supplier' | 'both';
    status?: 'current' | 'overdue' | 'due_soon';
    minAmount?: number;
    maxAmount?: number;
  }
): Promise<AccountsSettlementReport>

export async function getAgingAnalysis(
  companyId: string,
  entityType: 'customer' | 'supplier'
): Promise<AgingAnalysis>

export async function getCashFlowProjection(
  companyId: string,
  days: number
): Promise<CashFlowProjection[]>
```

### 4.3 Estado de Caja

```typescript
// lib/actions/cash-status-advanced.ts

export async function getAdvancedCashStatus(
  companyId: string,
  filters: {
    startDate: Date;
    endDate: Date;
    shift?: string;
    userId?: string;
  }
): Promise<CashStatusReport>

export async function getCashTrends(
  companyId: string,
  period: { startDate: Date; endDate: Date }
): Promise<CashTrend[]>

export async function compareCashPeriods(
  companyId: string,
  period1: { startDate: Date; endDate: Date },
  period2: { startDate: Date; endDate: Date }
): Promise<CashPeriodComparison>
```

### 4.4 Cuentas Corrientes

```typescript
// lib/actions/current-accounts-advanced.ts

export async function getCurrentAccountReport(
  entityId: string,
  entityType: 'customer' | 'supplier',
  filters?: {
    startDate?: Date;
    endDate?: Date;
    movementTypes?: string[];
  }
): Promise<CurrentAccountReport>

export async function getAllCurrentAccounts(
  companyId: string,
  entityType: 'customer' | 'supplier' | 'both',
  filters?: {
    minBalance?: number;
    maxBalance?: number;
    status?: 'active' | 'inactive';
  }
): Promise<CurrentAccountReport[]>

export async function sendAccountStatement(
  entityId: string,
  entityType: 'customer' | 'supplier',
  email: string
): Promise<{ success: boolean; message: string }>
```

## 5. Componentes de UI

### 5.1 Filtros Avanzados

```typescript
// components/dashboard/advanced-filters.tsx

interface AdvancedFiltersProps {
  onFilterChange: (filters: any) => void;
  availableFilters: {
    dateRange: boolean;
    categories: boolean;
    products: boolean;
    suppliers: boolean;
    customers: boolean;
    paymentMethods: boolean;
    status: boolean;
    amounts: boolean;
  };
}
```

### 5.2 Exportador Excel Mejorado

```typescript
// lib/utils/excel-export-advanced.ts

export async function exportInventoryLiquidationToExcel(
  report: InventoryLiquidationReport,
  companyInfo: CompanyInfo
): Promise<Blob>

export async function exportAccountsSettlementToExcel(
  report: AccountsSettlementReport,
  companyInfo: CompanyInfo
): Promise<Blob>

export async function exportCashStatusToExcel(
  report: CashStatusReport,
  companyInfo: CompanyInfo
): Promise<Blob>

export async function exportCurrentAccountToExcel(
  report: CurrentAccountReport,
  companyInfo: CompanyInfo
): Promise<Blob>
```

### 5.3 Gráficos y Visualizaciones

```typescript
// components/dashboard/report-charts.tsx

- InventoryTurnoverChart: Gráfico de rotación de inventario
- AgingChart: Gráfico de antigüedad de saldos
- CashTrendChart: Gráfico de tendencia de caja
- PaymentMethodDistribution: Distribución por método de pago
- ProfitMarginChart: Gráfico de márgenes de ganancia
- CashFlowProjectionChart: Proyección de flujo de caja
```

## 6. Restricciones por Plan

### 6.1 Acceso a Reportes Avanzados

- **Plan Básico**: Sin acceso a reportes avanzados
- **Plan Profesional**: Acceso a todos los reportes avanzados con filtros básicos
- **Plan Empresarial**: Acceso completo con filtros avanzados, gráficos, y exportación

### 6.2 Funciones de Verificación

```typescript
// lib/utils/plan-limits.ts

export async function canAccessAdvancedInventoryReports(
  companyId: string
): Promise<{ allowed: boolean; message?: string }>

export async function canAccessAdvancedAccountsReports(
  companyId: string
): Promise<{ allowed: boolean; message?: string }>

export async function canAccessAdvancedCashReports(
  companyId: string
): Promise<{ allowed: boolean; message?: string }>

export async function canExportAdvancedReports(
  companyId: string
): Promise<{ allowed: boolean; message?: string }>
```

## 7. Rutas y Páginas

### 7.1 Nuevas Rutas

```
/dashboard/reports/inventory-liquidation
/dashboard/reports/accounts-settlement
/dashboard/reports/cash-status
/dashboard/reports/current-accounts
```

### 7.2 Estructura de Páginas

```typescript
// app/dashboard/reports/[reportType]/page.tsx

- Verificación de acceso por plan
- Carga de datos del reporte
- Renderizado de componentes de filtros
- Renderizado de tablas y gráficos
- Opciones de exportación
```

## 8. Optimizaciones de Rendimiento

### 8.1 Consultas SQL Optimizadas

- Uso de índices en columnas de fecha
- Agregaciones en base de datos
- Paginación de resultados grandes
- Cache de consultas frecuentes

### 8.2 Carga Progresiva

- Skeleton loaders durante carga
- Lazy loading de gráficos
- Streaming de datos grandes
- Debounce en filtros

## 9. Seguridad

### 9.1 Validaciones

- Verificación de permisos por plan
- Validación de rangos de fechas
- Sanitización de filtros
- Rate limiting en exportaciones

### 9.2 RLS Policies

- Acceso solo a datos de la empresa del usuario
- Verificación de rol (admin vs employee)
- Auditoría de accesos a reportes sensibles

## 10. Pruebas

### 10.1 Pruebas Unitarias

- Funciones de cálculo de métricas
- Funciones de agregación
- Funciones de exportación
- Validaciones de filtros

### 10.2 Pruebas de Integración

- Flujo completo de generación de reportes
- Exportación a Excel
- Envío de estados de cuenta
- Proyecciones de flujo de caja

## 11. Documentación

### 11.1 Guías de Usuario

- Cómo usar filtros avanzados
- Interpretación de métricas
- Exportación de reportes
- Mejores prácticas

### 11.2 Documentación Técnica

- API de funciones de servidor
- Estructura de datos
- Consultas SQL
- Componentes reutilizables
