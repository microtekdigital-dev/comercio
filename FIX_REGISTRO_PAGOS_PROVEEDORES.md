# Fix: Registro de Pagos a Proveedores

## Problema Reportado

El usuario reportó un error al intentar registrar pagos a proveedores:

```
Error: Cannot read properties of undefined (reading 'total')
at QuickPaymentModal (components/dashboard/quick-payment-modal.tsx:61:18)
```

Además, el botón "Registrar pago" que estaba antes en la cuenta corriente había desaparecido.

## Causa del Problema

1. Se estaba usando `QuickPaymentModal` (diseñado solo para ventas) en la página de proveedores
2. El componente `SupplierAccountModal` solo mostraba movimientos pero NO tenía funcionalidad para registrar nuevos pagos

## Solución Implementada

### 1. Nueva Función en Backend (`lib/actions/suppliers.ts`)

Se agregó la función `addGeneralSupplierPayment` para registrar pagos generales a proveedores (no vinculados a una orden de compra específica):

```typescript
export async function addGeneralSupplierPayment(
  supplierId: string,
  amount: number,
  paymentMethod: string,
  referenceNumber?: string,
  notes?: string
)
```

**Características:**
- Crea un pago con `purchase_order_id = null` (pago general)
- Valida autenticación y permisos
- Revalida las rutas de proveedores

### 2. Formulario de Pago en Modal (`components/dashboard/supplier-account-modal.tsx`)

Se agregó un formulario inline dentro del modal de cuenta corriente con:

**Campos del formulario:**
- Monto (requerido)
- Método de pago (requerido): Efectivo, Transferencia, Cheque, Tarjeta
- Número de referencia (opcional)
- Notas (opcional)

**Funcionalidad:**
- Botón "Registrar Pago" que muestra/oculta el formulario
- Validación de campos requeridos
- Mensajes de éxito/error con toast
- Recarga automática de movimientos después de registrar el pago
- Reset del formulario después de éxito

### 3. UI/UX Mejorada

**Botón de acción:**
- Ubicado en la sección de saldo actual
- Icono Plus cuando está cerrado
- Icono X cuando está abierto para cancelar

**Formulario:**
- Fondo azul claro para distinguirlo
- Grid de 2 columnas para monto y método de pago
- Campos de referencia y notas en ancho completo
- Botón de submit con estado de carga

## Archivos Modificados

1. `lib/actions/suppliers.ts`
   - Agregada función `addGeneralSupplierPayment`

2. `components/dashboard/supplier-account-modal.tsx`
   - Agregados imports necesarios (Button, Input, Label, Select, Textarea, toast)
   - Agregado estado para formulario de pago
   - Agregada función `handleSubmitPayment`
   - Agregado UI del formulario inline

## Cómo Usar

1. Ir a la página de Proveedores
2. Hacer clic en "Ver Cuenta Corriente" de un proveedor
3. En el modal, hacer clic en "Registrar Pago"
4. Completar el formulario:
   - Ingresar monto del pago
   - Seleccionar método de pago
   - (Opcional) Agregar número de referencia
   - (Opcional) Agregar notas
5. Hacer clic en "Registrar Pago"
6. El pago se registra y aparece inmediatamente en la lista de movimientos
7. El saldo se actualiza automáticamente

## Impacto en Cierre de Caja

Los pagos a proveedores registrados en efectivo:
- Se restan del efectivo esperado en el cierre de caja
- Aparecen en la tarjeta roja "Pagos a Proveedores" del preview
- Se incluyen en el cálculo: `Efectivo Esperado = Ventas Efectivo + Monto Inicial - Pagos Proveedores Efectivo`

## Validaciones

- ✅ Campos requeridos validados
- ✅ Autenticación verificada
- ✅ Permisos de empresa verificados
- ✅ Monto debe ser numérico positivo
- ✅ Método de pago debe ser válido

## Testing

Para probar:
1. Registrar un pago a un proveedor
2. Verificar que aparece en la cuenta corriente
3. Verificar que el saldo se actualiza correctamente
4. Si el pago es en efectivo, verificar que aparece en el cierre de caja del día

---

**Fecha:** 16/02/2026
**Estado:** Implementado y funcionando
