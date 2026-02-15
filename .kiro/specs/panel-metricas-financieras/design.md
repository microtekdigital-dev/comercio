# Design Document

## Overview

El panel de métricas financieras es un componente visual que se integrará en el dashboard principal de la aplicación ERP. Proporcionará una vista consolidada de cinco métricas financieras clave calculadas en tiempo real desde la base de datos. El diseño incluye un sistema de configuración inicial para empresas nuevas que solicita el saldo de caja inicial mediante un modal.

## Architecture

### Component Structure

```
Dashboard Principal (page.tsx)
├── FinancialMetricsPanel (componente principal)
│   ├── MetricCard (componente reutilizable × 5)
│   └── InitialCashModal (modal de configuración)
└── Server Actions (lib/actions/financial-metrics.ts)
```

### Data Flow

1. El usuario accede al dashboard principal
2. El componente FinancialMetricsPanel se renderiza en el servidor
3. Se ejecutan las server actions para obtener las métricas
4. Si es una empresa nueva sin caja inicial, se muestra el modal
5. El usuario configura la caja inicial (si es necesario)
6. Se muestran las métricas calculadas en tarjetas visuales

## Components and Interfaces

### 1. FinancialMetricsPanel Component

Componente principal que orquesta la visualización de las métricas.

**Props:**
```typescript
interface FinancialMetricsPanelProps {
  companyId: string;
}
```

**Responsibilities:**
- Obtener las métricas financieras mediante server actions
- Detectar si es necesario mostrar el modal de configuración inicial
- Renderizar las tarjetas de métricas
- Manejar el estado del modal de configuración

### 2. MetricCard Component

Componente reutilizable para mostrar una métrica individual.

**Props:**
```typescript
interface MetricCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
}
```

**Responsibilities:**
- Formatear el valor monetario con símbolo de moneda y separadores
- Aplicar estilos visuales según el esquema de color
- Mostrar el título y valor de forma clara

### 3. InitialCashModal Component

Modal para configurar el saldo de caja inicial en empresas nuevas.

**Props:**
```typescript
interface InitialCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => Promise<void>;
}
```

**Responsibilities:**
- Mostrar un formulario para ingresar el importe inicial
- Validar que el importe sea un número válido (≥ 0)
- Llamar a la función de guardado al confirmar
- Manejar estados de carga y errores

### 4. Server Actions

**File:** `lib/actions/financial-metrics.ts`

```typescript
interface FinancialMetrics {
  todaySales: number;
  currentCash: number;
  accountsReceivable: number;
  accountsPayable: number;
  estimatedMonthProfit: number;
}

// Obtener todas las métricas
async function getFinancialMetrics(companyId: string): Promise<FinancialMetrics>

// Verificar si existe caja inicial configurada
async function hasInitialCash(companyId: string): Promise<boolean>

// Configurar caja inicial
async function setInitialCash(companyId: string, amount: number): Promise<void>

// Calcular ventas del día
async function calculateTodaySales(companyId: string): Promise<number>

// Calcular saldo de caja actual
async function calculateCurrentCash(companyId: string): Promise<number>

// Calcular cuentas por cobrar
async function calculateAccountsReceivable(companyId: string): Promise<number>

// Calcular cuentas por pagar
async function calculateAccountsPayable(companyId: string): Promise<number>

// Calcular ganancia estimada del mes
async function calculateEstimatedMonthProfit(companyId: string): Promise<number>
```

## Data Models

### Company Settings Extension

Se extenderá la tabla `company_settings` existente para almacenar el saldo de caja inicial:

```sql
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS initial_cash_balance DECIMAL(12, 2) DEFAULT NULL;
```

### Queries for Metrics Calculation

**Ventas del día:**
```sql
SELECT COALESCE(SUM(total), 0) as today_sales
FROM sales
WHERE company_id = $1
  AND status = 'completed'
  AND DATE(created_at) = CURRENT_DATE;
```

**Saldo de caja actual:**
```sql
SELECT 
  COALESCE(cs.initial_cash_balance, 0) +
  COALESCE(SUM(cr.amount), 0) as current_cash
FROM company_settings cs
LEFT JOIN cash_register cr ON cr.company_id = cs.company_id
WHERE cs.company_id = $1;
```

**Cuentas por cobrar:**
```sql
SELECT COALESCE(SUM(pending_amount), 0) as accounts_receivable
FROM sales
WHERE company_id = $1
  AND status IN ('pending', 'partial')
  AND pending_amount > 0;
```

**Cuentas por pagar:**
```sql
SELECT COALESCE(SUM(pending_amount), 0) as accounts_payable
FROM purchase_orders
WHERE company_id = $1
  AND status IN ('pending', 'partial')
  AND pending_amount > 0;
```

**Ganancia estimada del mes:**
```sql
SELECT 
  COALESCE(SUM(s.total), 0) - COALESCE(SUM(s.cost), 0) as estimated_profit
FROM sales s
WHERE s.company_id = $1
  AND DATE_TRUNC('month', s.created_at) = DATE_TRUNC('month', CURRENT_DATE)
  AND s.status = 'completed';
```

