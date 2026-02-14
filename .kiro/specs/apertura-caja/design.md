# Design Document: Apertura de Caja

## Overview

Este documento describe el diseño técnico para implementar la funcionalidad de "Apertura de Caja" en el sistema ERP. La apertura de caja es un proceso que se realiza al inicio de cada turno para registrar el monto inicial de efectivo disponible en la caja registradora.

El sistema ya cuenta con funcionalidad completa de "Cierre de Caja" implementada en:
- Tabla: `cash_register_closures`
- Acciones: `lib/actions/cash-register.ts`
- Páginas: `app/dashboard/cash-register/page.tsx` y `app/dashboard/cash-register/new/page.tsx`
- Script SQL: `scripts/130_create_cash_register.sql`

Esta nueva funcionalidad se integrará con el sistema existente para proporcionar un flujo completo de gestión de caja, permitiendo calcular diferencias de efectivo más precisas al considerar el monto inicial de apertura.

## Architecture

### Database Layer

La arquitectura sigue el patrón existente del módulo de caja:

```
┌─────────────────────────────────────────┐
│         Database (Supabase)             │
├─────────────────────────────────────────┤
│  cash_register_openings (NUEVA)        │
│  - id (UUID, PK)                        │
│  - company_id (UUID, FK)                │
│  - opening_date (TIMESTAMPTZ)           │
│  - shift (VARCHAR)                      │
│  - opened_by (UUID, FK)                 │
│  - opened_by_name (VARCHAR)             │
│  - initial_cash_amount (DECIMAL)        │
│  - notes (TEXT)                         │
│  - created_at (TIMESTAMPTZ)             │
│  - updated_at (TIMESTAMPTZ)             │
│                                         │
│  cash_register_closures (EXISTENTE)    │
│  - (estructura existente)               │
└─────────────────────────────────────────┘
```

### Application Layer

```
┌──────────────────────────────────────────────────┐
│              UI Layer (Next.js)                  │
├──────────────────────────────────────────────────┤
│  /dashboard/cash-register/page.tsx              │
│  - Lista aperturas y cierres                    │
│                                                  │
│  /dashboard/cash-register/opening/new/page.tsx  │
│  - Formulario de apertura                       │
│                                                  │
│  /dashboard/cash-register/new/page.tsx          │
│  - Formulario de cierre (MODIFICADO)            │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│         Actions Layer (Server Actions)           │
├──────────────────────────────────────────────────┤
│  lib/actions/cash-register.ts                   │
│  - getCashRegisterOpenings() (NUEVA)            │
│  - getCashRegisterOpening() (NUEVA)             │
│  - createCashRegisterOpening() (NUEVA)          │
│  - deleteCashRegisterOpening() (NUEVA)          │
│  - findOpeningForClosure() (NUEVA)              │
│  - createCashRegisterClosure() (MODIFICADA)     │
│  - getCashRegisterClosures() (EXISTENTE)        │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│            Database Layer (Supabase)             │
│  - RLS Policies                                  │
│  - Indexes                                       │
│  - Foreign Keys                                  │
└──────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema

#### Nueva Tabla: cash_register_openings

```sql
CREATE TABLE cash_register_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opening_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  shift VARCHAR(50) NOT NULL,
  opened_by UUID NOT NULL REFERENCES profiles(id),
  opened_by_name VARCHAR(255) NOT NULL,
  initial_cash_amount DECIMAL(10, 2) NOT NULL CHECK (initial_cash_amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Índices:**
- `idx_cash_register_openings_company_id` en `company_id`
- `idx_cash_register_openings_company_date_shift` en `(company_id, opening_date, shift)`
- `idx_cash_register_openings_created_at` en `created_at DESC`

**RLS Policies:**
- SELECT: usuarios pueden ver aperturas de su empresa
- INSERT: usuarios pueden crear aperturas para su empresa
- UPDATE: usuarios pueden actualizar aperturas de su empresa
- DELETE: usuarios pueden eliminar aperturas de su empresa

### 2. TypeScript Types

```typescript
// lib/types/erp.ts (AGREGAR)

export interface CashRegisterOpening {
  id: string
  company_id: string
  opening_date: string
  shift: string
  opened_by: string
  opened_by_name: string
  initial_cash_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CashRegisterOpeningFormData {
  opening_date: string
  shift: string
  initial_cash_amount: number
  notes?: string
}

// MODIFICAR tipo existente
export interface CashRegisterClosureFormData {
  closure_date: string
  shift?: string
  cash_counted?: number
  notes?: string
  opening_id?: string // NUEVO: referencia opcional a apertura
}
```

### 3. Server Actions

#### Nuevas Funciones en lib/actions/cash-register.ts

```typescript
// Obtener todas las aperturas de una empresa
export async function getCashRegisterOpenings(filters?: {
  dateFrom?: string
  dateTo?: string
  shift?: string
}): Promise<CashRegisterOpening[]>

// Obtener una apertura específica
export async function getCashRegisterOpening(id: string): Promise<CashRegisterOpening | null>

// Crear nueva apertura
export async function createCashRegisterOpening(
  formData: CashRegisterOpeningFormData
): Promise<{ data?: CashRegisterOpening; error?: string }>

// Eliminar apertura
export async function deleteCashRegisterOpening(
  id: string
): Promise<{ success?: boolean; error?: string }>

// Buscar apertura para un cierre específico
export async function findOpeningForClosure(
  companyId: string,
  closureDate: string,
  shift?: string
): Promise<CashRegisterOpening | null>
```

#### Modificación de Función Existente

```typescript
// MODIFICAR: createCashRegisterClosure
// Agregar lógica para:
// 1. Buscar apertura correspondiente usando findOpeningForClosure()
// 2. Si existe apertura, ajustar cálculo de diferencia:
//    cash_difference = cash_counted - (cash_sales + initial_cash_amount)
// 3. Si no existe apertura, mantener cálculo actual:
//    cash_difference = cash_counted - cash_sales
// 4. Guardar opening_id en el cierre (requiere agregar columna)
```

### 4. UI Components

#### Nueva Página: /dashboard/cash-register/opening/new/page.tsx

Formulario para crear apertura de caja con:
- Campo de fecha (pre-llenado con fecha actual)
- Selector de turno (Mañana, Tarde, Noche)
- Campo numérico para monto inicial
- Campo de texto para notas opcionales
- Botones: Cancelar, Guardar

#### Modificación: /dashboard/cash-register/page.tsx

Actualizar para mostrar:
- Sección de "Aperturas Recientes" (últimas 5)
- Sección de "Cierres Recientes" (existente)
- Botón "Nueva Apertura" junto a "Nuevo Cierre"
- Indicador visual de aperturas sin cierre correspondiente

#### Modificación: /dashboard/cash-register/new/page.tsx

Actualizar para:
- Buscar apertura correspondiente al cargar
- Mostrar advertencia si no existe apertura
- Mostrar monto inicial de apertura en el resumen
- Ajustar cálculo de diferencia mostrado en preview

## Data Models

### CashRegisterOpening

Representa un registro de apertura de caja.

**Campos:**
- `id`: Identificador único (UUID)
- `company_id`: Referencia a la empresa (UUID, FK)
- `opening_date`: Fecha y hora de apertura (TIMESTAMPTZ)
- `shift`: Turno (VARCHAR: "Mañana", "Tarde", "Noche")
- `opened_by`: Usuario que realizó la apertura (UUID, FK)
- `opened_by_name`: Nombre del usuario (VARCHAR, desnormalizado)
- `initial_cash_amount`: Monto inicial de efectivo (DECIMAL(10,2))
- `notes`: Notas opcionales (TEXT, nullable)
- `created_at`: Fecha de creación del registro (TIMESTAMPTZ)
- `updated_at`: Fecha de última actualización (TIMESTAMPTZ)

**Restricciones:**
- `initial_cash_amount` debe ser mayor a 0
- `company_id`, `opening_date`, `shift`, `opened_by`, `opened_by_name`, `initial_cash_amount` son NOT NULL

**Relaciones:**
- Pertenece a una `company` (many-to-one)
- Creada por un `profile` (many-to-one)
- Puede estar asociada a un `cash_register_closure` (one-to-one opcional)

### Modificación a CashRegisterClosure

Agregar campo opcional:
- `opening_id`: Referencia a apertura asociada (UUID, FK nullable)

Esto permite vincular un cierre con su apertura correspondiente para trazabilidad.


## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de correctness verificables por máquina.*

### Property Reflection

Después de analizar todos los acceptance criteria, he identificado las siguientes redundancias:

- **Criterios 3.1 y 3.2**: Ambos verifican el mismo cálculo de diferencia con apertura. Se combinan en una sola propiedad.
- **Criterios 5.2 y 5.4**: Ambos verifican el aislamiento de datos entre empresas. Se combinan en una sola propiedad.
- **Criterios 1.3 y 5.5**: Ambos verifican que company_id se establezca automáticamente. Se combinan en una sola propiedad.
- **Criterios 1.5 y 7.3**: Ambos verifican la validación de monto positivo. Se combinan en una sola propiedad.
- **Criterios 2.1 y 8.1**: Ambos verifican la búsqueda de apertura al crear cierre. Se combinan en una sola propiedad.
- **Criterios 2.2 y 8.2**: Ambos verifican la advertencia cuando no hay apertura. Se combinan en un solo ejemplo.

Las propiedades finales eliminan estas redundancias y se enfocan en verificar comportamientos únicos del sistema.

### Properties

**Property 1: Apertura completa con campos requeridos**
*Para cualquier* apertura de caja creada, todos los campos NOT NULL (company_id, opening_date, shift, opened_by, opened_by_name, initial_cash_amount) deben estar presentes y tener valores válidos en la base de datos.
**Validates: Requirements 1.1, 6.4**

**Property 2: Registro automático de timestamps**
*Para cualquier* apertura de caja creada, el campo created_at debe establecerse automáticamente con una fecha válida cercana al momento de creación (dentro de 5 segundos).
**Validates: Requirements 1.2**

**Property 3: Asociación automática de company_id**
*Para cualquier* usuario autenticado con un company_id conocido, cuando crea una apertura, el registro debe tener el mismo company_id que el usuario.
**Validates: Requirements 1.3, 5.5**

**Property 4: Registro de usuario que abre**
*Para cualquier* usuario autenticado que crea una apertura, los campos opened_by y opened_by_name deben coincidir con el ID y nombre del usuario autenticado.
**Validates: Requirements 1.4**

**Property 5: Validación de monto positivo**
*Para cualquier* intento de crear una apertura, si el monto inicial es menor o igual a cero, el sistema debe rechazar la operación; si el monto es positivo, debe aceptarse.
**Validates: Requirements 1.5, 7.3**

**Property 6: Almacenamiento de turnos válidos**
*Para cualquier* apertura creada con un turno de la lista válida (Mañana, Tarde, Noche), el sistema debe almacenar el turno correctamente.
**Validates: Requirements 1.6**

**Property 7: Almacenamiento opcional de notas**
*Para cualquier* apertura creada, si se proporcionan notas, deben almacenarse en el campo notes; si no se proporcionan, el campo debe ser NULL.
**Validates: Requirements 1.7**

**Property 8: Búsqueda de apertura correspondiente**
*Para cualquier* intento de crear un cierre con fecha y turno específicos, el sistema debe buscar correctamente si existe una apertura con la misma fecha y turno en la misma empresa.
**Validates: Requirements 2.1, 8.1**

**Property 9: Creación de cierre sin apertura**
*Para cualquier* cierre creado cuando no existe apertura correspondiente, el sistema debe crear el cierre exitosamente y el campo opening_id debe ser NULL.
**Validates: Requirements 2.5**

**Property 10: Cálculo de diferencia con apertura**
*Para cualquier* cierre creado cuando existe una apertura correspondiente, la diferencia de efectivo debe calcularse como: cash_counted - (cash_sales + initial_cash_amount).
**Validates: Requirements 3.1, 3.2**

**Property 11: Cálculo de diferencia sin apertura**
*Para cualquier* cierre creado cuando no existe apertura correspondiente, la diferencia de efectivo debe calcularse como: cash_counted - cash_sales (sin incluir monto inicial).
**Validates: Requirements 3.3**

**Property 12: Aislamiento de datos por empresa**
*Para cualquier* empresa, las consultas de aperturas deben retornar únicamente las aperturas de esa empresa, nunca las de otras empresas.
**Validates: Requirements 4.1, 5.2, 5.4**

**Property 13: Campos completos en listado**
*Para cualquier* apertura retornada en el listado, los campos opening_date, shift, opened_by_name e initial_cash_amount deben estar presentes en el resultado.
**Validates: Requirements 4.2**

**Property 14: Orden descendente por fecha**
*Para cualquier* conjunto de aperturas retornadas, deben estar ordenadas por created_at en orden descendente (más recientes primero).
**Validates: Requirements 4.3**

**Property 15: Filtrado por rango de fechas**
*Para cualquier* consulta con filtro de rango de fechas (dateFrom, dateTo), todas las aperturas retornadas deben tener opening_date dentro del rango especificado.
**Validates: Requirements 4.5**

**Property 16: Filtrado por turno**
*Para cualquier* consulta con filtro de turno, todas las aperturas retornadas deben tener el turno especificado.
**Validates: Requirements 4.6**

**Property 17: Restricción de creación por empresa**
*Para cualquier* usuario autenticado, los intentos de crear aperturas para empresas diferentes a la suya deben ser rechazados por RLS.
**Validates: Requirements 5.3**

**Property 18: Compatibilidad con cierres antiguos**
*Para cualquier* cierre existente sin opening_id (creado antes de implementar aperturas), el sistema debe poder consultarlo y procesarlo correctamente sin errores.
**Validates: Requirements 8.3**

## Error Handling

### Validation Errors

1. **Monto inicial inválido**
   - Error: "El monto inicial debe ser mayor a cero"
   - Código HTTP: 400 Bad Request
   - Ocurre cuando: initial_cash_amount <= 0

2. **Turno inválido**
   - Error: "El turno debe ser Mañana, Tarde o Noche"
   - Código HTTP: 400 Bad Request
   - Ocurre cuando: shift no está en la lista válida

3. **Fecha inválida**
   - Error: "La fecha de apertura es inválida"
   - Código HTTP: 400 Bad Request
   - Ocurre cuando: opening_date no es una fecha válida

### Authentication Errors

4. **Usuario no autenticado**
   - Error: "No autenticado"
   - Código HTTP: 401 Unauthorized
   - Ocurre cuando: No hay sesión de usuario activa

5. **Empresa no encontrada**
   - Error: "No se encontró la empresa"
   - Código HTTP: 404 Not Found
   - Ocurre cuando: El usuario no tiene company_id asociado

### Database Errors

6. **Error de inserción**
   - Error: "Error al crear la apertura de caja"
   - Código HTTP: 500 Internal Server Error
   - Ocurre cuando: Falla la inserción en la base de datos

7. **Error de consulta**
   - Error: "Error al obtener las aperturas de caja"
   - Código HTTP: 500 Internal Server Error
   - Ocurre cuando: Falla la consulta a la base de datos

### Business Logic Errors

8. **Apertura duplicada (advertencia)**
   - Advertencia: "Ya existe una apertura para esta fecha y turno"
   - Código HTTP: 200 OK (con advertencia en respuesta)
   - Ocurre cuando: Ya existe una apertura con la misma fecha y turno
   - Acción: Permitir crear de todos modos, pero informar al usuario

9. **Cierre sin apertura (advertencia)**
   - Advertencia: "No se encontró apertura para esta fecha y turno. El cálculo de diferencia no incluirá el monto inicial."
   - Código HTTP: 200 OK (con advertencia en respuesta)
   - Ocurre cuando: Se intenta crear un cierre sin apertura correspondiente
   - Acción: Permitir crear el cierre, pero ajustar el cálculo

### Error Recovery

- Todos los errores de validación deben mostrarse en el formulario junto al campo correspondiente
- Los errores de autenticación deben redirigir al login
- Los errores de base de datos deben registrarse en logs del servidor
- Las advertencias de negocio deben mostrarse en un modal o toast, permitiendo al usuario decidir

## Testing Strategy

### Dual Testing Approach

El sistema utilizará dos tipos complementarios de pruebas:

1. **Unit Tests**: Verifican ejemplos específicos, casos edge y condiciones de error
2. **Property-Based Tests**: Verifican propiedades universales a través de múltiples inputs generados

Ambos tipos son necesarios para cobertura completa. Los unit tests capturan bugs concretos, mientras que los property tests verifican correctness general.

### Property-Based Testing Configuration

- **Librería**: fast-check (para TypeScript/JavaScript)
- **Iteraciones mínimas**: 100 por test
- **Tag format**: `Feature: apertura-caja, Property {number}: {property_text}`
- Cada propiedad de correctness debe implementarse como UN SOLO test de propiedad

### Unit Testing Focus

Los unit tests deben enfocarse en:
- Ejemplos específicos de aperturas válidas
- Casos edge: monto mínimo válido (0.01), notas muy largas, fechas límite
- Condiciones de error: montos negativos, turnos inválidos, fechas inválidas
- Integración entre componentes: apertura → cierre

### Property Testing Focus

Los property tests deben enfocarse en:
- Propiedades universales que aplican a todas las aperturas
- Invariantes: campos requeridos siempre presentes, company_id siempre correcto
- Relaciones: cálculo de diferencia siempre correcto con/sin apertura
- Aislamiento: empresas nunca ven datos de otras empresas

### Test Organization

```
__tests__/
  lib/
    actions/
      cash-register-openings.unit.test.ts    # Unit tests
      cash-register-openings.property.test.ts # Property tests
      cash-register-integration.test.ts       # Integration tests
  components/
    dashboard/
      cash-register-opening-form.test.tsx    # Component tests
```

### Example Property Test Structure

```typescript
import fc from 'fast-check'

// Feature: apertura-caja, Property 1: Apertura completa con campos requeridos
test('all required fields are present in created openings', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        opening_date: fc.date(),
        shift: fc.constantFrom('Mañana', 'Tarde', 'Noche'),
        initial_cash_amount: fc.float({ min: 0.01, max: 1000000 }),
        notes: fc.option(fc.string(), { nil: null })
      }),
      async (openingData) => {
        const result = await createCashRegisterOpening(openingData)
        expect(result.data).toBeDefined()
        expect(result.data.company_id).toBeDefined()
        expect(result.data.opening_date).toBeDefined()
        expect(result.data.shift).toBeDefined()
        expect(result.data.opened_by).toBeDefined()
        expect(result.data.opened_by_name).toBeDefined()
        expect(result.data.initial_cash_amount).toBeDefined()
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

Los integration tests deben verificar:
- Flujo completo: crear apertura → crear cierre → verificar cálculo
- Interacción con base de datos real (usando Supabase local)
- RLS policies funcionando correctamente
- Triggers y constraints de base de datos

### Manual Testing Checklist

- [ ] Crear apertura con todos los campos
- [ ] Crear apertura sin notas
- [ ] Intentar crear apertura con monto negativo (debe fallar)
- [ ] Intentar crear apertura con monto cero (debe fallar)
- [ ] Crear cierre con apertura correspondiente (verificar cálculo)
- [ ] Crear cierre sin apertura correspondiente (verificar advertencia)
- [ ] Verificar que empresas no vean aperturas de otras empresas
- [ ] Verificar filtros de fecha y turno
- [ ] Verificar orden descendente en listado
- [ ] Verificar que cierres antiguos sin opening_id sigan funcionando
