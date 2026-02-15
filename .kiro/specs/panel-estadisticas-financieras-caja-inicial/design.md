# Design Document

## Overview

Este documento describe el diseño técnico para implementar un panel de estadísticas financieras en el dashboard principal y la configuración de caja inicial para empresas nuevas. El sistema proporcionará métricas financieras en tiempo real (ventas diarias, saldo de caja, cuentas por cobrar/pagar, ganancia mensual) y permitirá establecer un importe inicial de caja que se integrará con el sistema existente de apertura y cierre de caja.

## Architecture

### Component Structure

```
app/dashboard/
  └── page.tsx (Dashboard principal)
      └── <FinancialStatsPanel /> (Nuevo componente)

components/dashboard/
  ├── financial-stats-panel.tsx (Nuevo)
  └── initial-cash-setup-modal.tsx (Nuevo)

lib/actions/
  ├── financial-stats.ts (Nuevo)
  └── company-settings.ts (Extender existente)
```

### Data Flow

1. Usuario accede al dashboard → `page.tsx` renderiza `<FinancialStatsPanel />`
2. `<FinancialStatsPanel />` llama a `getFinancialStats()` (server action)
3. `getFinancialStats()` consulta múltiples fuentes de datos:
   - Ventas del día (tabla `sales`)
   - Saldo de caja (tabla `cash_register_openings` + movimientos)
   - Cuentas por cobrar (función `getCustomerBalance`)
   - Cuentas por pagar (función `getSupplierBalance`)
   - Ganancia mensual (ventas - costos del mes)
4. Datos se retornan y se muestran en el panel

### Initial Cash Setup Flow

1. Usuario nuevo crea empresa → Sistema verifica si existe `initial_cash_amount` en `company_settings`
2. Si no existe → Muestra modal `<InitialCashSetupModal />`
3. Usuario ingresa importe inicial → Se guarda en `company_settings`
4. Al crear primera apertura de caja → Sistema sugiere el importe inicial configurado

## Components and Interfaces

### FinancialStatsPanel Component

```typescript
// components/dashboard/financial-stats-panel.tsx
interface FinancialStats {
  dailySales: number;
  currentCashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  monthlyProfit: number;
}

export async function FinancialStatsPanel() {
  const stats = await getFinancialStats();
  
  // Render 5 cards with financial metrics
  // Use formatCurrency for all amounts
  // Show loading state if stats is null
}
```

### InitialCashSetupModal Component

```typescript
// components/dashboard/initial-cash-setup-modal.tsx
interface InitialCashSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => Promise<void>;
}

export function InitialCashSetupModal({ isOpen, onClose, onSave }: InitialCashSetupModalProps) {
  // Form with single input for initial cash amount
  // Validation: amount > 0
  // Calls onSave with validated amount
}
```


## Data Models

### Company Settings Extension

```typescript
// Existing table: company_settings
// Add new field: initial_cash_amount

interface CompanySettings {
  id: string;
  company_id: string;
  currency: string;
  timezone: string;
  // ... existing fields
  initial_cash_amount?: number; // NEW FIELD
  initial_cash_configured_at?: string; // NEW FIELD (timestamp)
  created_at: string;
  updated_at: string;
}
```

### Financial Stats Type

```typescript
// lib/types/erp.ts
export interface FinancialStats {
  dailySales: number;           // Total de ventas del día actual
  currentCashBalance: number;   // Saldo de caja actual
  accountsReceivable: number;   // Total cuentas por cobrar
  accountsPayable: number;      // Total cuentas por pagar
  monthlyProfit: number;        // Ganancia del mes actual
  currency: string;             // Moneda configurada
  lastUpdated: Date;            // Timestamp de última actualización
}
```

### Server Actions

```typescript
// lib/actions/financial-stats.ts

/**
 * Obtiene todas las estadísticas financieras para el dashboard
 */
export async function getFinancialStats(): Promise<FinancialStats | null> {
  // 1. Obtener company_id del usuario actual
  // 2. Calcular ventas del día actual
  // 3. Calcular saldo de caja actual
  // 4. Calcular cuentas por cobrar
  // 5. Calcular cuentas por pagar
  // 6. Calcular ganancia mensual
  // 7. Retornar objeto FinancialStats
}

/**
 * Calcula las ventas del día actual
 */
async function calculateDailySales(companyId: string): Promise<number> {
  // Query: SELECT SUM(total) FROM sales
  // WHERE company_id = ? AND DATE(sale_date) = TODAY
  // AND status IN ('confirmed', 'completed')
}

/**
 * Calcula el saldo de caja actual
 */
async function calculateCurrentCashBalance(companyId: string): Promise<number> {
  // 1. Buscar última apertura de caja activa
  // 2. Si existe: initial_cash_amount + ingresos - egresos desde apertura
  // 3. Si no existe: retornar 0
}

/**
 * Calcula el total de cuentas por cobrar
 */
async function calculateAccountsReceivable(companyId: string): Promise<number> {
  // 1. Obtener todos los clientes de la empresa
  // 2. Para cada cliente, llamar a getCustomerBalance()
  // 3. Sumar todos los balances positivos
}

/**
 * Calcula el total de cuentas por pagar
 */
async function calculateAccountsPayable(companyId: string): Promise<number> {
  // 1. Obtener todos los proveedores de la empresa
  // 2. Para cada proveedor, llamar a getSupplierBalance()
  // 3. Sumar todos los balances positivos
}

/**
 * Calcula la ganancia del mes actual
 */
async function calculateMonthlyProfit(companyId: string): Promise<number> {
  // 1. Obtener todas las ventas del mes actual (confirmed/completed)
  // 2. Para cada venta, obtener los items vendidos
  // 3. Calcular: SUM(unit_price * quantity) - SUM(cost * quantity)
  // 4. Retornar ganancia total
}

// lib/actions/company-settings.ts (extender existente)

/**
 * Configura el importe inicial de caja para una empresa
 */
export async function setInitialCashAmount(amount: number): Promise<{ success: boolean; error?: string }> {
  // 1. Validar que amount > 0
  // 2. Verificar que no exista initial_cash_amount ya configurado
  // 3. Actualizar company_settings con initial_cash_amount y timestamp
  // 4. Revalidar rutas necesarias
}

/**
 * Obtiene el importe inicial de caja configurado
 */
export async function getInitialCashAmount(): Promise<number | null> {
  // 1. Obtener company_id del usuario
  // 2. Query company_settings para obtener initial_cash_amount
  // 3. Retornar valor o null si no está configurado
}

/**
 * Verifica si la empresa necesita configurar caja inicial
 */
export async function needsInitialCashSetup(): Promise<boolean> {
  // 1. Obtener company_id del usuario
  // 2. Verificar si initial_cash_amount existe en company_settings
  // 3. Retornar true si no existe, false si ya está configurado
}
```


## Correctness Properties

Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquinas.

### Property Reflection

Después de analizar todos los criterios de aceptación, he identificado las siguientes redundancias y consolidaciones:

**Redundancias identificadas:**
- Las propiedades 2.4, 4.4, 5.4, 6.4 (formato de moneda) pueden consolidarse en una sola propiedad sobre formato consistente
- Las propiedades 3.1, 3.2, 3.3 (cálculo de saldo de caja) pueden combinarse en una propiedad de invariante de balance
- Las propiedades 4.1 y 4.3 (cuentas por cobrar) pueden combinarse en una sola propiedad
- Las propiedades 5.1 y 5.3 (cuentas por pagar) pueden combinarse en una sola propiedad
- Las propiedades 6.1 y 6.2 (ganancia mensual) pueden combinarse en una sola propiedad de cálculo

**Propiedades consolidadas:**
Después de la reflexión, mantendremos las siguientes propiedades únicas que proporcionan valor de validación:

1. Cálculo correcto de ventas diarias (consolida 1.1, 2.1, 2.2)
2. Cálculo correcto de saldo de caja (consolida 1.2, 3.1, 3.2, 3.3)
3. Cálculo correcto de cuentas por cobrar (consolida 1.3, 4.1, 4.3)
4. Cálculo correcto de cuentas por pagar (consolida 1.4, 5.1, 5.3)
5. Cálculo correcto de ganancia mensual (consolida 1.5, 6.1, 6.2, 6.3)
6. Formato consistente de moneda (consolida 2.4, 4.4, 5.4, 6.4, 10.2, 10.3)
7. Validación de importe inicial positivo (7.2)
8. Persistencia de importe inicial (7.3)
9. Restricción de configuración única (7.4)
10. Trazabilidad de importe inicial (8.4)
11. Validación de datos numéricos (9.1)
12. Resiliencia ante errores (9.4)
13. Presencia de etiquetas descriptivas (10.1)

### Properties

Property 1: Cálculo correcto de ventas diarias
*For any* empresa y fecha, el total de ventas diarias debe ser igual a la suma de todas las ventas con estado 'confirmed' o 'completed' de ese día, excluyendo ventas canceladas o pendientes
**Validates: Requirements 1.1, 2.1, 2.2**

Property 2: Invariante de saldo de caja
*For any* apertura de caja con importe inicial I, ingresos totales R y egresos totales E, el saldo de caja debe ser igual a I + R - E
**Validates: Requirements 1.2, 3.1, 3.2, 3.3**

Property 3: Cálculo correcto de cuentas por cobrar
*For any* empresa, el total de cuentas por cobrar debe ser igual a la suma de los balances positivos de todos los clientes, excluyendo clientes con balance cero o negativo
**Validates: Requirements 1.3, 4.1, 4.3**

Property 4: Cálculo correcto de cuentas por pagar
*For any* empresa, el total de cuentas por pagar debe ser igual a la suma de los balances positivos de todos los proveedores, excluyendo proveedores con balance cero o negativo
**Validates: Requirements 1.4, 5.1, 5.3**

Property 5: Cálculo correcto de ganancia mensual
*For any* mes calendario, la ganancia debe ser igual a la suma de (precio_unitario * cantidad - costo * cantidad) para todos los items de ventas completadas en ese mes
**Validates: Requirements 1.5, 6.1, 6.2, 6.3**

Property 6: Formato consistente de moneda
*For any* monto financiero mostrado en el panel, el string formateado debe contener el símbolo de moneda configurado en company_settings y separadores de miles apropiados
**Validates: Requirements 2.4, 4.4, 5.4, 6.4, 10.2, 10.3**

Property 7: Validación de importe inicial positivo
*For any* intento de establecer un importe inicial de caja, el sistema debe rechazar valores menores o iguales a cero
**Validates: Requirements 7.2**

Property 8: Persistencia de importe inicial
*For any* importe inicial configurado, al consultar company_settings inmediatamente después debe retornar el mismo valor
**Validates: Requirements 7.3**

Property 9: Restricción de configuración única
*For any* empresa que ya tiene un importe inicial configurado, intentar configurarlo nuevamente debe fallar
**Validates: Requirements 7.4**

Property 10: Trazabilidad de importe inicial
*For any* empresa con importe inicial configurado, todas las aperturas de caja deben poder rastrear su relación con este valor inicial
**Validates: Requirements 8.4**

Property 11: Validación de datos numéricos
*For any* cálculo de estadísticas financieras, todos los valores intermedios y finales deben ser números válidos (no NaN, no Infinity)
**Validates: Requirements 9.1**

Property 12: Resiliencia ante errores
*For any* error durante el cálculo de una métrica individual, el sistema debe retornar 0 para esa métrica sin interrumpir el cálculo de las demás métricas
**Validates: Requirements 9.4**

Property 13: Presencia de etiquetas descriptivas
*For any* métrica financiera renderizada, el HTML debe contener una etiqueta descriptiva que identifique claramente qué representa el valor
**Validates: Requirements 10.1**


## Error Handling

### Validation Errors

1. **Invalid Initial Cash Amount**
   - Error: "El importe inicial debe ser mayor a cero"
   - Trigger: Usuario intenta configurar importe ≤ 0
   - Action: Mostrar mensaje de error, no guardar valor

2. **Duplicate Initial Cash Configuration**
   - Error: "El importe inicial ya fue configurado para esta empresa"
   - Trigger: Usuario intenta configurar importe cuando ya existe uno
   - Action: Mostrar mensaje de error, no permitir modificación

3. **Missing Company ID**
   - Error: "No se encontró la empresa asociada al usuario"
   - Trigger: Usuario sin company_id intenta acceder a estadísticas
   - Action: Retornar null, mostrar mensaje de bienvenida

### Calculation Errors

1. **Database Query Failures**
   - Error: Error de conexión o query a Supabase
   - Action: Log error, retornar 0 para la métrica afectada, continuar con otras métricas

2. **Invalid Numeric Values**
   - Error: Valores NaN o Infinity en cálculos
   - Action: Reemplazar con 0, log warning

3. **Missing Data**
   - Error: No existen datos para calcular una métrica
   - Action: Retornar 0, no mostrar error al usuario

### UI Error States

1. **Loading State**
   - Mostrar skeleton loaders mientras se cargan las estadísticas
   - Timeout: 10 segundos máximo

2. **Empty State**
   - Cuando no hay datos: Mostrar mensaje amigable explicando que no hay información disponible
   - Sugerir acciones: "Comienza agregando productos y ventas"

3. **Error State**
   - Cuando falla la carga: Mostrar mensaje genérico de error
   - Ofrecer botón de "Reintentar"

## Testing Strategy

### Dual Testing Approach

Este proyecto utilizará tanto tests unitarios como tests basados en propiedades (property-based testing) para asegurar la corrección del sistema:

- **Unit tests**: Verificarán ejemplos específicos, casos edge y condiciones de error
- **Property tests**: Verificarán propiedades universales a través de múltiples entradas generadas aleatoriamente

Ambos tipos de tests son complementarios y necesarios para una cobertura completa.

### Property-Based Testing

**Framework**: fast-check (para TypeScript/JavaScript)

**Configuración**:
- Mínimo 100 iteraciones por test de propiedad
- Cada test debe referenciar su propiedad del documento de diseño
- Formato de tag: `// Feature: panel-estadisticas-financieras-caja-inicial, Property N: [descripción]`

**Propiedades a implementar**:

1. **Property 1: Cálculo de ventas diarias**
   - Generar: Ventas aleatorias con diferentes estados y fechas
   - Verificar: Suma solo incluye ventas confirmed/completed del día especificado

2. **Property 2: Invariante de saldo de caja**
   - Generar: Aperturas con importes aleatorios, ingresos y egresos aleatorios
   - Verificar: Saldo = Importe inicial + Ingresos - Egresos

3. **Property 3: Cuentas por cobrar**
   - Generar: Clientes con ventas y pagos aleatorios
   - Verificar: Total = Suma de balances positivos

4. **Property 4: Cuentas por pagar**
   - Generar: Proveedores con compras y pagos aleatorios
   - Verificar: Total = Suma de balances positivos

5. **Property 5: Ganancia mensual**
   - Generar: Ventas con items aleatorios (precios y costos)
   - Verificar: Ganancia = Suma(precio * cantidad - costo * cantidad)

6. **Property 6: Formato de moneda**
   - Generar: Montos aleatorios y configuraciones de moneda
   - Verificar: String contiene símbolo correcto y separadores

7. **Property 7: Validación positiva**
   - Generar: Números aleatorios (positivos, negativos, cero)
   - Verificar: Solo positivos son aceptados

8. **Property 8: Persistencia round-trip**
   - Generar: Importes iniciales aleatorios
   - Verificar: Guardar y recuperar retorna el mismo valor

9. **Property 9: Configuración única**
   - Generar: Intentos múltiples de configuración
   - Verificar: Solo el primero tiene éxito

10. **Property 11: Validación numérica**
    - Generar: Datos que puedan causar NaN/Infinity
    - Verificar: Todos los resultados son números válidos

11. **Property 12: Resiliencia**
    - Generar: Escenarios con errores en cálculos individuales
    - Verificar: Sistema continúa funcionando, retorna 0 para métrica fallida

### Unit Testing

**Framework**: Jest + React Testing Library

**Casos a cubrir**:

1. **Edge Cases**:
   - Empresa sin datos (todos los valores en 0)
   - Empresa sin apertura de caja (saldo = 0)
   - Mes sin ventas (ganancia = 0)

2. **Ejemplos Específicos**:
   - Primera apertura de caja usa importe inicial sugerido
   - Panel muestra etiquetas descriptivas correctas

3. **Integración**:
   - Componente FinancialStatsPanel renderiza correctamente
   - Modal InitialCashSetupModal funciona correctamente
   - Server actions retornan datos en formato esperado

4. **Error Handling**:
   - Manejo de errores de base de datos
   - Validación de formularios
   - Estados de carga y error en UI

### Balance de Testing

- **Evitar exceso de unit tests**: Los property tests ya cubren muchos casos de entrada
- **Enfoque de unit tests**: Ejemplos concretos, casos edge específicos, integración de componentes
- **Enfoque de property tests**: Propiedades universales, validación exhaustiva de lógica de negocio

### Test Organization

```
__tests__/
  ├── lib/
  │   ├── actions/
  │   │   ├── financial-stats.unit.test.ts
  │   │   ├── financial-stats.property.test.ts
  │   │   └── company-settings.unit.test.ts
  ├── components/
  │   ├── dashboard/
  │   │   ├── financial-stats-panel.test.tsx
  │   │   └── initial-cash-setup-modal.test.tsx
```

