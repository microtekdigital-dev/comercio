# Design Document: Movimientos de Caja (Ingresos y Retiros)

## Overview

Este documento describe el diseño técnico para implementar la funcionalidad de registro de ingresos y retiros de dinero en la sección de caja del sistema ERP. La solución extiende el sistema existente de apertura y cierre de caja, agregando una nueva tabla para registrar movimientos de efectivo y actualizando el cálculo de "Caja Actual" para incluir estos movimientos.

La implementación se integra con:
- Sistema existente de apertura de caja (`cash_register_openings`)
- Sistema existente de cierre de caja (`cash_register_closures`)
- Cálculo actual de saldo de caja en `lib/actions/financial-stats.ts`
- Página de caja en `/dashboard/cash-register`

## Architecture

### Database Layer

Se creará una nueva tabla `cash_movements` para registrar todos los ingresos y retiros de dinero:

```sql
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opening_id UUID NOT NULL REFERENCES cash_register_openings(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('income', 'withdrawal')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_by_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Application Layer

La arquitectura sigue el patrón existente del sistema:

```
UI Layer (React Components)
  ↓
Server Actions (lib/actions/cash-movements.ts)
  ↓
Supabase Client
  ↓
PostgreSQL Database (with RLS)
```

### Integration Points

1. **Financial Stats**: Actualizar `calculateCurrentCashBalance()` en `lib/actions/financial-stats.ts`
2. **Cash Register Page**: Agregar botones y modales en `/dashboard/cash-register`
3. **Cash Closures**: Incluir movimientos en el reporte de cierre de caja

## Components and Interfaces

### 1. Database Schema

**Tabla: cash_movements**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| company_id | UUID | Empresa propietaria |
| opening_id | UUID | Apertura de caja asociada |
| movement_type | VARCHAR(20) | 'income' o 'withdrawal' |
| amount | DECIMAL(12,2) | Monto del movimiento (siempre positivo) |
| description | TEXT | Motivo/descripción del movimiento |
| created_by | UUID | Usuario que registró el movimiento |
| created_by_name | VARCHAR(255) | Nombre del usuario (desnormalizado) |
| created_at | TIMESTAMPTZ | Fecha y hora de creación |
| updated_at | TIMESTAMPTZ | Fecha y hora de última actualización |

**Índices:**
- `idx_cash_movements_company_id` en `company_id`
- `idx_cash_movements_opening_id` en `opening_id`
- `idx_cash_movements_created_at` en `created_at DESC`

**RLS Policies:**
- SELECT: Usuarios pueden ver movimientos de su empresa
- INSERT: Usuarios pueden crear movimientos para su empresa
- UPDATE: Usuarios pueden actualizar movimientos de su empresa
- DELETE: Usuarios pueden eliminar movimientos de su empresa

### 2. TypeScript Types

```typescript
// lib/types/erp.ts

export interface CashMovement {
  id: string;
  company_id: string;
  opening_id: string;
  movement_type: 'income' | 'withdrawal';
  amount: number;
  description: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CashMovementFormData {
  movement_type: 'income' | 'withdrawal';
  amount: number;
  description: string;
}

export interface CashMovementFilters {
  dateFrom?: string;
  dateTo?: string;
  movementType?: 'income' | 'withdrawal' | 'all';
  openingId?: string;
}
```

### 3. Server Actions

**Archivo: lib/actions/cash-movements.ts**

```typescript
// Get all cash movements for a company
export async function getCashMovements(
  filters?: CashMovementFilters
): Promise<CashMovement[]>

// Get single cash movement
export async function getCashMovement(id: string): Promise<CashMovement | null>

// Create cash movement
export async function createCashMovement(
  formData: CashMovementFormData
): Promise<{ data?: CashMovement; error?: string }>

// Delete cash movement
export async function deleteCashMovement(id: string): Promise<{ success?: boolean; error?: string }>

// Get movements for a specific opening
export async function getCashMovementsByOpening(
  openingId: string
): Promise<CashMovement[]>

// Get movements summary for an opening
export async function getCashMovementsSummary(openingId: string): Promise<{
  totalIncome: number;
  totalWithdrawals: number;
  netMovement: number;
}>
```

### 4. UI Components

**Componente: CashMovementModal**
- Modal reutilizable para registrar ingresos y retiros
- Props: `type: 'income' | 'withdrawal'`, `onSuccess: () => void`
- Campos: monto, descripción
- Validación: monto > 0, descripción requerida

**Componente: CashMovementsList**
- Lista de movimientos de caja con filtros
- Muestra: tipo, monto, descripción, usuario, fecha
- Acciones: ver detalle, eliminar

**Actualización: app/dashboard/cash-register/page.tsx**
- Agregar botones "Registrar Ingreso" y "Registrar Retiro"
- Mostrar resumen de movimientos del turno actual
- Integrar con el cálculo de "Caja Actual"

## Data Models

### Cash Movement Entity

```typescript
interface CashMovement {
  // Identificación
  id: string;
  company_id: string;
  opening_id: string;
  
  // Datos del movimiento
  movement_type: 'income' | 'withdrawal';
  amount: number; // Siempre positivo, el tipo determina si suma o resta
  description: string;
  
  // Auditoría
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}
```

### Business Rules

1. **Validación de Monto**: El monto debe ser siempre mayor a cero
2. **Descripción Requerida**: Todos los movimientos deben tener una descripción
3. **Apertura Activa**: Solo se pueden crear movimientos si existe una apertura activa
4. **Asociación con Apertura**: Cada movimiento debe estar asociado a una apertura de caja
5. **Auditoría**: Se registra quién y cuándo creó cada movimiento

### Calculation Formula

**Caja Actual (actualizada):**
```
Caja Actual = Monto Inicial 
            + Ventas en Efectivo 
            - Pagos a Proveedores en Efectivo
            + Ingresos (cash_movements tipo 'income')
            - Retiros (cash_movements tipo 'withdrawal')
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe ser verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquina.*

### Property 1: Validación de Monto Positivo

*Para cualquier* intento de crear un movimiento de caja, si el monto es menor o igual a cero, el sistema debe rechazar la operación y retornar un error.

**Validates: Requirements 1.4, 2.4**

### Property 2: Persistencia Completa de Datos

*Para cualquier* movimiento de caja creado exitosamente, al consultar ese movimiento por su ID, todos los campos (tipo, monto, descripción, usuario, fecha) deben coincidir exactamente con los valores proporcionados en la creación.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 3: Asociación con Apertura Activa

*Para cualquier* intento de crear un movimiento de caja, si no existe una apertura de caja activa para la empresa del usuario, el sistema debe rechazar la operación y retornar un error.

**Validates: Requirements 6.3, 6.4**

### Property 4: Cálculo Correcto de Ingresos

*Para cualquier* apertura de caja con N movimientos de tipo 'income', la suma de todos los montos de ingresos debe ser igual al total calculado por la función `getCashMovementsSummary`.

**Validates: Requirements 3.4, 5.4**

### Property 5: Cálculo Correcto de Retiros

*Para cualquier* apertura de caja con N movimientos de tipo 'withdrawal', la suma de todos los montos de retiros debe ser igual al total calculado por la función `getCashMovementsSummary`.

**Validates: Requirements 3.5, 5.5**

### Property 6: Actualización de Caja Actual con Ingresos

*Para cualquier* estado de caja con saldo S, después de registrar un ingreso de monto M, el nuevo saldo de caja actual debe ser exactamente S + M.

**Validates: Requirements 1.6, 3.6**

### Property 7: Actualización de Caja Actual con Retiros

*Para cualquier* estado de caja con saldo S, después de registrar un retiro de monto M, el nuevo saldo de caja actual debe ser exactamente S - M.

**Validates: Requirements 2.6, 3.6**

### Property 8: Fórmula Completa de Caja Actual

*Para cualquier* apertura de caja, el saldo de caja actual calculado debe ser igual a: Monto Inicial + Ventas Efectivo - Pagos Proveedores Efectivo + Total Ingresos - Total Retiros.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 9: Aislamiento por Empresa (RLS)

*Para cualquier* usuario autenticado, al consultar movimientos de caja, solo debe recibir movimientos cuyo `company_id` coincida con el `company_id` del usuario.

**Validates: Requirements 6.2, 6.5**

### Property 10: Inclusión en Cierre de Caja

*Para cualquier* cierre de caja de una apertura específica, todos los movimientos asociados a esa apertura deben aparecer en el reporte de cierre, agrupados por tipo (ingresos y retiros).

**Validates: Requirements 5.1, 5.2, 5.3, 5.6**

## Error Handling

### Validation Errors

1. **Monto Inválido**: "El monto debe ser mayor a cero"
2. **Descripción Vacía**: "La descripción es requerida"
3. **Sin Apertura Activa**: "No hay una apertura de caja activa. Debe abrir la caja antes de registrar movimientos"
4. **Usuario No Autenticado**: "Debe iniciar sesión para registrar movimientos"
5. **Empresa No Encontrada**: "No se encontró la empresa asociada al usuario"

### Database Errors

1. **Constraint Violation**: Mapear errores de PostgreSQL a mensajes amigables
2. **RLS Policy Violation**: "No tiene permisos para realizar esta operación"
3. **Foreign Key Violation**: "La apertura de caja especificada no existe"

### Error Response Format

```typescript
interface ErrorResponse {
  error: string; // Mensaje de error amigable
  code?: string; // Código de error opcional para manejo programático
}
```

## Testing Strategy

### Unit Tests

Los unit tests se enfocarán en casos específicos y condiciones de borde:

1. **Validación de Formularios**:
   - Monto cero debe ser rechazado
   - Monto negativo debe ser rechazado
   - Descripción vacía debe ser rechazada

2. **Casos de Error Específicos**:
   - Crear movimiento sin apertura activa
   - Crear movimiento sin autenticación
   - Crear movimiento con opening_id inválido

3. **Integración con Componentes**:
   - Modal se abre correctamente
   - Formulario se resetea después de envío exitoso
   - Lista de movimientos se actualiza después de crear uno nuevo

### Property-Based Tests

Los property tests verificarán propiedades universales con mínimo 100 iteraciones:

1. **Property 1: Validación de Monto Positivo**
   - Generar montos aleatorios ≤ 0
   - Verificar que todos son rechazados

2. **Property 2: Persistencia Completa de Datos**
   - Generar movimientos aleatorios válidos
   - Crear y luego consultar
   - Verificar que todos los campos coinciden

3. **Property 4: Cálculo Correcto de Ingresos**
   - Generar N ingresos aleatorios
   - Verificar que la suma manual = suma calculada

4. **Property 5: Cálculo Correcto de Retiros**
   - Generar N retiros aleatorios
   - Verificar que la suma manual = suma calculada

5. **Property 6: Actualización de Caja Actual con Ingresos**
   - Generar estado inicial aleatorio
   - Agregar ingreso aleatorio
   - Verificar que saldo_nuevo = saldo_anterior + ingreso

6. **Property 7: Actualización de Caja Actual con Retiros**
   - Generar estado inicial aleatorio
   - Agregar retiro aleatorio
   - Verificar que saldo_nuevo = saldo_anterior - retiro

7. **Property 8: Fórmula Completa de Caja Actual**
   - Generar datos aleatorios completos (apertura, ventas, pagos, movimientos)
   - Calcular manualmente con la fórmula
   - Verificar que coincide con el cálculo del sistema

### Test Configuration

- Framework: Jest o Vitest (según el proyecto)
- Property Testing Library: fast-check (para TypeScript)
- Mínimo 100 iteraciones por property test
- Tag format: `Feature: movimientos-caja, Property N: [descripción]`

### Integration Tests

1. **Flujo Completo**:
   - Abrir caja → Registrar ingreso → Registrar retiro → Verificar saldo → Cerrar caja
   
2. **Actualización de Dashboard**:
   - Verificar que "Caja Actual" se actualiza en tiempo real

3. **Reporte de Cierre**:
   - Verificar que movimientos aparecen en el cierre de caja
