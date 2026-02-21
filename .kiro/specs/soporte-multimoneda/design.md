# Design Document: Soporte Multimoneda

## Overview

Este diseño implementa soporte multimoneda para el sistema ERP SaaS, permitiendo que cada empresa configure su moneda preferida y visualice correctamente los símbolos y formatos monetarios en toda la aplicación. La solución se enfoca en la configuración y visualización, sin incluir conversión entre monedas ya que cada empresa opera en su propia moneda local.

El diseño sigue un enfoque de tres capas:
1. **Capa de Datos**: Almacenamiento de configuración de moneda en `company_settings`
2. **Capa de Lógica**: Utilidad de formateo centralizada que aplica la configuración
3. **Capa de Presentación**: Actualización de componentes para usar el formateador

## Architecture

### Database Schema Changes

Se agregarán tres campos a la tabla `company_settings`:

```sql
ALTER TABLE public.company_settings
ADD COLUMN currency_code VARCHAR(3) DEFAULT 'USD' NOT NULL,
ADD COLUMN currency_symbol VARCHAR(10) DEFAULT '$' NOT NULL,
ADD COLUMN currency_position VARCHAR(10) DEFAULT 'before' NOT NULL;
```

**Justificación de campos separados**:
- `currency_code`: Código ISO 4217 (USD, EUR, ARS, etc.) para identificación estándar
- `currency_symbol`: Símbolo visual ($, €, ₡) para flexibilidad de visualización
- `currency_position`: "before" o "after" para control de formato regional

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (Components: Products, Sales, Purchases, Cash, Reports)    │
└────────────────────────┬────────────────────────────────────┘
                         │ uses
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Money Formatter Utility                    │
│  formatCurrency(amount, settings) → formatted string         │
└────────────────────────┬────────────────────────────────────┘
                         │ reads
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Company Settings DB                       │
│  { currency_code, currency_symbol, currency_position }       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Currency Configuration Data

**Supported Currencies**:

```typescript
export const SUPPORTED_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar Estadounidense', position: 'before' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', position: 'after' },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino', position: 'before' },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso Chileno', position: 'before' },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mexicano', position: 'before' },
  COP: { code: 'COP', symbol: '$', name: 'Peso Colombiano', position: 'before' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', position: 'before' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', position: 'before' },
  UYU: { code: 'UYU', symbol: '$U', name: 'Peso Uruguayo', position: 'before' }
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;
```

### 2. TypeScript Type Updates

**CompanySettings Interface** (actualización en `lib/types/erp.ts`):

```typescript
export interface CompanySettings {
  id: string;
  company_id: string;
  currency: string; // Deprecated - mantener por compatibilidad
  currency_code: string; // Nuevo: código ISO
  currency_symbol: string; // Nuevo: símbolo visual
  currency_position: 'before' | 'after'; // Nuevo: posición del símbolo
  tax_rate: number;
  invoice_prefix: string;
  invoice_next_number: number;
  quote_prefix: string;
  quote_next_number: number;
  purchase_order_prefix: string;
  purchase_order_next_number: number;
  initial_cash_amount?: number | null;
  initial_cash_configured_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after';
}
```

### 3. Money Formatter Utility

**Ubicación**: `lib/utils/currency.ts`

```typescript
import { CompanySettings } from '@/lib/types/erp';

export interface FormatCurrencyOptions {
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimals?: number;
  locale?: string;
}

/**
 * Formatea un monto numérico con el símbolo de moneda configurado
 * 
 * @param amount - Monto a formatear
 * @param options - Configuración de formato de moneda
 * @returns String formateado con símbolo de moneda
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: FormatCurrencyOptions
): string {
  // Manejar valores nulos o indefinidos
  const safeAmount = amount ?? 0;
  
  // Formatear número con separadores de miles y decimales
  const decimals = options.decimals ?? 2;
  const locale = options.locale ?? 'es-AR';
  
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeAmount);
  
  // Aplicar símbolo según posición configurada
  if (options.currencyPosition === 'before') {
    return `${options.currencySymbol}${formattedNumber}`;
  } else {
    return `${formattedNumber}${options.currencySymbol}`;
  }
}

/**
 * Formatea un monto usando la configuración de la empresa
 * 
 * @param amount - Monto a formatear
 * @param settings - Configuración de la empresa
 * @returns String formateado con símbolo de moneda
 */
export function formatCompanyCurrency(
  amount: number | null | undefined,
  settings: Pick<CompanySettings, 'currency_symbol' | 'currency_position'>
): string {
  return formatCurrency(amount, {
    currencySymbol: settings.currency_symbol,
    currencyPosition: settings.currency_position,
  });
}

/**
 * Obtiene la configuración de moneda desde los settings de la empresa
 * 
 * @param settings - Configuración completa de la empresa
 * @returns Objeto con configuración de moneda
 */
export function getCurrencyConfig(
  settings: CompanySettings
): FormatCurrencyOptions {
  return {
    currencySymbol: settings.currency_symbol,
    currencyPosition: settings.currency_position,
  };
}
```

### 4. Server Actions Updates

**Actualización de `lib/actions/company-settings.ts`**:

```typescript
export async function updateCompanySettings(
  companyId: string,
  data: {
    currency_code?: string;
    currency_symbol?: string;
    currency_position?: 'before' | 'after';
    // ... otros campos existentes
  }
) {
  // Validar código de moneda si se proporciona
  if (data.currency_code && !SUPPORTED_CURRENCIES[data.currency_code as CurrencyCode]) {
    return { success: false, error: 'Código de moneda no soportado' };
  }
  
  // Validar posición de símbolo
  if (data.currency_position && !['before', 'after'].includes(data.currency_position)) {
    return { success: false, error: 'Posición de símbolo inválida' };
  }
  
  // Actualizar en base de datos
  const { error } = await supabase
    .from('company_settings')
    .update(data)
    .eq('company_id', companyId);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}
```

### 5. UI Component Updates

**Currency Selector Component** (`components/dashboard/currency-selector.tsx`):

```typescript
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/utils/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string, symbol: string, position: 'before' | 'after') => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const handleChange = (code: string) => {
    const currency = SUPPORTED_CURRENCIES[code as CurrencyCode];
    if (currency) {
      onChange(code, currency.symbol, currency.position);
    }
  };
  
  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar moneda" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
          <SelectItem key={code} value={code}>
            {config.symbol} - {config.name} ({code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Company Settings Form Update**:

Agregar sección de moneda en `components/dashboard/company-settings-advanced.tsx`:

```typescript
// En la pestaña "Facturación", agregar:
<div className="space-y-4">
  <h3 className="text-sm font-medium">Configuración de Moneda</h3>
  
  <div className="space-y-2">
    <Label htmlFor="currency">Moneda</Label>
    <CurrencySelector
      value={formData.currency_code}
      onChange={(code, symbol, position) => {
        setFormData({
          ...formData,
          currency_code: code,
          currency_symbol: symbol,
          currency_position: position,
        });
      }}
    />
    <p className="text-xs text-muted-foreground">
      Los precios se mostrarán como: {formatCurrency(1234.56, {
        currencySymbol: formData.currency_symbol,
        currencyPosition: formData.currency_position,
      })}
    </p>
  </div>
</div>
```

## Data Models

### Database Migration Script

**Archivo**: `scripts/220_add_currency_support.sql`

```sql
-- Add currency fields to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'USD' NOT NULL,
ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '$' NOT NULL,
ADD COLUMN IF NOT EXISTS currency_position VARCHAR(10) DEFAULT 'before' NOT NULL;

-- Add check constraint for currency_position
ALTER TABLE public.company_settings
ADD CONSTRAINT check_currency_position 
CHECK (currency_position IN ('before', 'after'));

-- Add comments
COMMENT ON COLUMN public.company_settings.currency_code IS 'ISO 4217 currency code (USD, EUR, ARS, etc.)';
COMMENT ON COLUMN public.company_settings.currency_symbol IS 'Currency symbol for display ($, €, etc.)';
COMMENT ON COLUMN public.company_settings.currency_position IS 'Position of currency symbol: before or after amount';

-- Set default values for existing companies
UPDATE public.company_settings
SET 
  currency_code = 'USD',
  currency_symbol = '$',
  currency_position = 'before'
WHERE currency_code IS NULL OR currency_symbol IS NULL OR currency_position IS NULL;
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquina.*

### Property Reflection

Después de analizar los criterios de aceptación, identifiqué las siguientes propiedades testables:

**Propiedades de Configuración**:
- Autocompletado de símbolo y posición al seleccionar moneda (1.2)
- Persistencia de configuración (1.3, 13.4) - Estas se pueden combinar en una propiedad de round-trip
- Validación de código de moneda (1.4)
- Cambio de moneda en cualquier momento (12.4)

**Propiedades de Formateo**:
- Aplicación de símbolo de moneda (3.1)
- Posición "before" del símbolo (3.2)
- Posición "after" del símbolo (3.3)
- Formato numérico con separadores y decimales (3.4)
- Formato de precios de variantes (4.4)

**Propiedades de Estructura de Datos**:
- Campos completos en cada moneda soportada (2.2, 2.3) - Se pueden combinar

**Redundancias eliminadas**:
- Los criterios 4.1-11.4 son todos ejemplos de aplicación del formateador en diferentes componentes. No necesitamos propiedades separadas para cada uno, ya que si el formateador funciona correctamente (propiedades 3.1-3.4), funcionará en todos los componentes.
- Las propiedades 3.2 y 3.3 son complementarias y necesarias (cubren ambos casos de posición).

### Correctness Properties

Property 1: Currency selection autocomplete
*For any* supported currency code, when selected from the currency selector, the system should automatically populate the corresponding symbol and position values from the SUPPORTED_CURRENCIES configuration.
**Validates: Requirements 1.2**

Property 2: Currency configuration persistence (round-trip)
*For any* valid currency configuration (code, symbol, position), saving the configuration and then loading it should return the exact same values.
**Validates: Requirements 1.3, 13.4**

Property 3: Currency code validation
*For any* currency code input, the system should accept it if and only if it exists in the SUPPORTED_CURRENCIES list, rejecting all other values.
**Validates: Requirements 1.4**

Property 4: Currency symbol application
*For any* numeric amount and currency configuration, the formatted output should contain the configured currency symbol.
**Validates: Requirements 3.1**

Property 5: Symbol position "before"
*For any* numeric amount, when currency_position is "before", the formatted string should start with the currency symbol followed by the number.
**Validates: Requirements 3.2**

Property 6: Symbol position "after"
*For any* numeric amount, when currency_position is "after", the formatted string should end with the currency symbol preceded by the number.
**Validates: Requirements 3.3**

Property 7: Number formatting with separators and decimals
*For any* numeric amount, the formatted output should include thousand separators and exactly two decimal places.
**Validates: Requirements 3.4**

Property 8: Variant price formatting
*For any* product with variants, each variant's price should be formatted with the company's configured currency symbol and position.
**Validates: Requirements 4.4**

Property 9: Currency data completeness
*For all* entries in SUPPORTED_CURRENCIES, each entry should have all required fields: code, symbol, name, and position.
**Validates: Requirements 2.2, 2.3**

Property 10: Currency change flexibility
*For any* company with an existing currency configuration, updating to any other supported currency should succeed and persist the new values.
**Validates: Requirements 12.4**



## Error Handling

### Validation Errors

**Invalid Currency Code**:
- **Trigger**: Usuario intenta guardar un código de moneda no soportado
- **Response**: Rechazar la actualización y mostrar mensaje: "Código de moneda no soportado. Por favor seleccione una moneda de la lista."
- **Recovery**: Mantener la configuración anterior

**Invalid Currency Position**:
- **Trigger**: Valor de `currency_position` no es "before" ni "after"
- **Response**: Rechazar la actualización y mostrar mensaje: "Posición de símbolo inválida"
- **Recovery**: Usar "before" como valor predeterminado

**Missing Currency Configuration**:
- **Trigger**: Empresa sin configuración de moneda (legacy data)
- **Response**: Usar valores predeterminados (USD, $, before)
- **Recovery**: Sugerir al usuario configurar su moneda preferida

### Database Errors

**Migration Failure**:
- **Trigger**: Error al ejecutar script de migración
- **Response**: Rollback de la transacción, log del error
- **Recovery**: Revisar logs, corregir conflictos, reintentar migración

**Update Failure**:
- **Trigger**: Error al actualizar company_settings
- **Response**: Mostrar mensaje genérico de error, log detallado en servidor
- **Recovery**: Usuario puede reintentar la operación

### Formatting Errors

**Null/Undefined Amount**:
- **Trigger**: Función de formateo recibe null o undefined
- **Response**: Formatear como 0.00 con el símbolo correspondiente
- **Recovery**: No requiere acción del usuario

**Invalid Number**:
- **Trigger**: Función de formateo recibe NaN o Infinity
- **Response**: Formatear como 0.00 con el símbolo correspondiente
- **Recovery**: Log warning en desarrollo, mostrar 0.00 en producción

## Testing Strategy

### Unit Testing

**Currency Formatter Tests** (`lib/utils/currency.test.ts`):
- Test formateo con símbolo antes del número
- Test formateo con símbolo después del número
- Test manejo de valores null/undefined
- Test manejo de valores negativos
- Test separadores de miles
- Test decimales correctos
- Test con diferentes locales

**Currency Selector Tests** (`components/dashboard/currency-selector.test.tsx`):
- Test renderizado de todas las monedas soportadas
- Test selección de moneda y callback
- Test visualización de código, nombre y símbolo

**Validation Tests** (`lib/actions/company-settings.test.ts`):
- Test validación de código de moneda válido
- Test rechazo de código de moneda inválido
- Test validación de posición válida
- Test rechazo de posición inválida

### Property-Based Testing

**Configuración**: Usar `fast-check` para TypeScript, mínimo 100 iteraciones por test.

**Property Test 1: Currency Selection Autocomplete**
```typescript
// Tag: Feature: soporte-multimoneda, Property 1: Currency selection autocomplete
test('selecting any supported currency should autocomplete symbol and position', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...Object.keys(SUPPORTED_CURRENCIES)),
      (currencyCode) => {
        const expected = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
        const result = getCurrencyDetails(currencyCode);
        
        return result.symbol === expected.symbol &&
               result.position === expected.position;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 2: Currency Configuration Persistence**
```typescript
// Tag: Feature: soporte-multimoneda, Property 2: Currency configuration persistence
test('saving and loading currency config should return same values', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...Object.keys(SUPPORTED_CURRENCIES)),
      async (currencyCode) => {
        const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
        
        // Save configuration
        await updateCompanySettings(testCompanyId, {
          currency_code: currency.code,
          currency_symbol: currency.symbol,
          currency_position: currency.position,
        });
        
        // Load configuration
        const loaded = await getCompanySettings(testCompanyId);
        
        return loaded.currency_code === currency.code &&
               loaded.currency_symbol === currency.symbol &&
               loaded.currency_position === currency.position;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 3: Currency Code Validation**
```typescript
// Tag: Feature: soporte-multimoneda, Property 3: Currency code validation
test('should accept valid currency codes and reject invalid ones', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 5 }),
      (code) => {
        const isValid = Object.keys(SUPPORTED_CURRENCIES).includes(code);
        const result = validateCurrencyCode(code);
        
        return result.valid === isValid;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 4: Currency Symbol Application**
```typescript
// Tag: Feature: soporte-multimoneda, Property 4: Currency symbol application
test('formatted output should always contain the currency symbol', () => {
  fc.assert(
    fc.property(
      fc.double({ min: -1000000, max: 1000000 }),
      fc.constantFrom(...Object.keys(SUPPORTED_CURRENCIES)),
      (amount, currencyCode) => {
        const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
        const formatted = formatCurrency(amount, {
          currencySymbol: currency.symbol,
          currencyPosition: currency.position,
        });
        
        return formatted.includes(currency.symbol);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 5: Symbol Position Before**
```typescript
// Tag: Feature: soporte-multimoneda, Property 5: Symbol position before
test('when position is before, symbol should precede the number', () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0, max: 1000000 }),
      fc.string({ minLength: 1, maxLength: 3 }),
      (amount, symbol) => {
        const formatted = formatCurrency(amount, {
          currencySymbol: symbol,
          currencyPosition: 'before',
        });
        
        return formatted.startsWith(symbol);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 6: Symbol Position After**
```typescript
// Tag: Feature: soporte-multimoneda, Property 6: Symbol position after
test('when position is after, symbol should follow the number', () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0, max: 1000000 }),
      fc.string({ minLength: 1, maxLength: 3 }),
      (amount, symbol) => {
        const formatted = formatCurrency(amount, {
          currencySymbol: symbol,
          currencyPosition: 'after',
        });
        
        return formatted.endsWith(symbol);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 7: Number Formatting**
```typescript
// Tag: Feature: soporte-multimoneda, Property 7: Number formatting with separators
test('formatted numbers should have exactly two decimal places', () => {
  fc.assert(
    fc.property(
      fc.double({ min: -1000000, max: 1000000 }),
      fc.constantFrom(...Object.keys(SUPPORTED_CURRENCIES)),
      (amount, currencyCode) => {
        const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
        const formatted = formatCurrency(amount, {
          currencySymbol: currency.symbol,
          currencyPosition: currency.position,
        });
        
        // Remove currency symbol to check number format
        const numberPart = formatted.replace(currency.symbol, '').trim();
        const decimalPart = numberPart.split(/[,.]/).pop();
        
        return decimalPart?.length === 2;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 8: Variant Price Formatting**
```typescript
// Tag: Feature: soporte-multimoneda, Property 8: Variant price formatting
test('all variant prices should be formatted with currency', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        id: fc.uuid(),
        variant_name: fc.string(),
        price: fc.double({ min: 0, max: 10000 }),
      }), { minLength: 1, maxLength: 10 }),
      fc.constantFrom(...Object.keys(SUPPORTED_CURRENCIES)),
      (variants, currencyCode) => {
        const currency = SUPPORTED_CURRENCIES[currencyCode as CurrencyCode];
        const settings = {
          currency_symbol: currency.symbol,
          currency_position: currency.position,
        };
        
        return variants.every(variant => {
          const formatted = formatCompanyCurrency(variant.price, settings);
          return formatted.includes(currency.symbol);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 9: Currency Data Completeness**
```typescript
// Tag: Feature: soporte-multimoneda, Property 9: Currency data completeness
test('all supported currencies should have complete data', () => {
  const currencies = Object.values(SUPPORTED_CURRENCIES);
  
  const allComplete = currencies.every(currency => 
    currency.code &&
    currency.symbol &&
    currency.name &&
    (currency.position === 'before' || currency.position === 'after')
  );
  
  expect(allComplete).toBe(true);
});
```

**Property Test 10: Currency Change Flexibility**
```typescript
// Tag: Feature: soporte-multimoneda, Property 10: Currency change flexibility
test('should allow changing currency multiple times', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.array(
        fc.constantFrom(...Object.keys(SUPPORTED_CURRENCIES)),
        { minLength: 2, maxLength: 5 }
      ),
      async (currencyCodes) => {
        let allSucceeded = true;
        
        for (const code of currencyCodes) {
          const currency = SUPPORTED_CURRENCIES[code as CurrencyCode];
          const result = await updateCompanySettings(testCompanyId, {
            currency_code: currency.code,
            currency_symbol: currency.symbol,
            currency_position: currency.position,
          });
          
          if (!result.success) {
            allSucceeded = false;
            break;
          }
          
          const loaded = await getCompanySettings(testCompanyId);
          if (loaded.currency_code !== currency.code) {
            allSucceeded = false;
            break;
          }
        }
        
        return allSucceeded;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Currency Flow**:
1. Configurar moneda en settings
2. Crear producto con precio
3. Verificar que el precio se muestra con el símbolo correcto
4. Crear venta con el producto
5. Verificar que todos los montos en la venta usan el símbolo
6. Cambiar moneda de la empresa
7. Verificar que todos los montos se actualizan con el nuevo símbolo

**Component Integration Tests**:
- Test que el selector de moneda se integra correctamente con el formulario de settings
- Test que los componentes de productos usan el formateador correctamente
- Test que los reportes aplican el formato de moneda

### Manual Testing Checklist

- [ ] Configurar cada una de las 9 monedas soportadas
- [ ] Verificar visualización en módulo de Productos
- [ ] Verificar visualización en módulo de Ventas
- [ ] Verificar visualización en módulo de Compras
- [ ] Verificar visualización en módulo de Reparaciones
- [ ] Verificar visualización en módulo de Caja
- [ ] Verificar visualización en Reportes Financieros
- [ ] Verificar visualización en Dashboard
- [ ] Verificar visualización en Cuentas Corrientes
- [ ] Verificar impresión de facturas con símbolo correcto
- [ ] Verificar impresión de órdenes de reparación
- [ ] Verificar impresión de informes de cierre de caja
- [ ] Verificar exportación de reportes con símbolo
- [ ] Cambiar moneda y verificar que se actualiza en toda la aplicación
- [ ] Verificar retrocompatibilidad con empresas existentes

## Implementation Notes

### Migration Strategy

1. **Fase 1**: Ejecutar script de migración en base de datos
   - Agregar columnas con valores predeterminados
   - Todas las empresas existentes quedan con USD

2. **Fase 2**: Implementar utilidad de formateo
   - Crear `lib/utils/currency.ts`
   - Agregar tests unitarios y de propiedades

3. **Fase 3**: Actualizar UI de configuración
   - Agregar selector de moneda
   - Actualizar formulario de company settings

4. **Fase 4**: Actualizar componentes de visualización
   - Productos
   - Ventas y presupuestos
   - Compras
   - Reparaciones
   - Caja
   - Reportes
   - Dashboard
   - Cuentas corrientes

5. **Fase 5**: Testing y validación
   - Ejecutar tests automatizados
   - Realizar testing manual
   - Validar con usuarios beta

### Performance Considerations

- El formateo de moneda es una operación ligera (solo manipulación de strings)
- No hay impacto significativo en performance
- La configuración de moneda se carga una vez por sesión
- Considerar memoización si se formatea el mismo valor múltiples veces en un componente

### Backwards Compatibility

- El campo `currency` existente en algunas tablas se mantiene por compatibilidad
- Los nuevos campos `currency_code`, `currency_symbol`, `currency_position` son la fuente de verdad
- La migración establece valores predeterminados para todas las empresas existentes
- No se requiere acción del usuario para que el sistema siga funcionando

### Future Enhancements

Funcionalidades que NO están en el scope actual pero podrían agregarse en el futuro:

- Conversión entre monedas con tasas de cambio
- Soporte para múltiples monedas por empresa
- Historial de cambios de moneda
- Reportes comparativos en diferentes monedas
- Integración con APIs de tasas de cambio en tiempo real
