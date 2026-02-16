# Fix: Registro de Pagos a Clientes

## Problema Reportado

El usuario reportó un error al intentar registrar pagos a clientes desde la cuenta corriente:

```
Error: Cannot read properties of undefined (reading 'sale_number')
at QuickPaymentModal (components/dashboard/quick-payment-modal.tsx:141:51)
```

## Causa del Problema

1. El `QuickPaymentModal` estaba diseñado SOLO para ventas (sales)
2. Se estaba usando incorrectamente en la página de clientes
3. El componente intentaba acceder a `sale.sale_number` cuando `sale` era `undefined`
4. El `CustomerAccountModal` no tenía funcionalidad para registrar pagos

## Solución Implementada

### 1. Actualización de QuickPaymentModal (`components/dashboard/quick-payment-modal.tsx`)

Se modificó el modal para que sea más robusto y maneje casos donde no hay una venta:

**Cambios:**
- Agregadas variables `isSale`, `displayName`, `totalAmount`, `currency` para manejar ambos casos
- Validación para prevenir el submit si no es una venta
- Mensaje informativo cuando se intenta usar con clientes/proveedores
- Protección contra acceso a propiedades undefined

**Comportamiento:**
- Si se usa con una venta: funciona normalmente
- Si se usa con cliente/proveedor: muestra mensaje indicando que debe usar el modal de cuenta corriente

### 2. Nueva Función en Backend (`lib/actions/customers.ts`)

Se agregó la función `addGeneralCustomerPayment` para registrar pagos generales de clientes (no vinculados a una venta específica):

```typescript
export async function addGeneralCustomerPayment(
  customerId: string,
  amount: number,
  paymentMethod: string,
  referenceNumber?: string,
  notes?: string
)
```

**Características:**
- Crea un pago con `sale_id = null` (pago general)
- Valida autenticación y permisos
- Revalida las rutas de clientes

### 3. Formulario de Pago en CustomerAccountModal (`components/dashboard/customer-account-modal.tsx`)

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

### 4. UI/UX Mejorada

**Botón de acción:**
- Ubicado en la sección de saldo actual
- Icono Plus cuando está cerrado
- Icono X cuando está abierto para cancelar

**Formulario:**
- Fondo azul claro para distinguirlo
- Grid de 2 columnas para monto y método de pago
- Campos de referencia y notas en ancho completo
- Botón de submit con estado de carga

**Indicadores de saldo:**
- Verde: Cliente tiene saldo a favor
- Rojo: Cliente debe dinero
- Mensajes explicativos según el saldo

## Archivos Modificados

1. `components/dashboard/quick-payment-modal.tsx`
   - Agregada lógica para manejar casos sin venta
   - Protección contra undefined
   - Mensajes informativos

2. `lib/actions/customers.ts`
   - Agregada función `addGeneralCustomerPayment`

3. `components/dashboard/customer-account-modal.tsx`
   - Agregados imports necesarios (Button, Input, Label, Select, Textarea, toast)
   - Agregado estado para formulario de pago
   - Agregada función `handleSubmitPayment`
   - Agregado UI del formulario inline

## Cómo Usar

### Desde la Página de Clientes:
1. Ir a la página de Clientes
2. Hacer clic en "Cuenta corriente" de un cliente
3. En el modal, hacer clic en "Registrar Pago"
4. Completar el formulario:
   - Ingresar monto del pago
   - Seleccionar método de pago
   - (Opcional) Agregar número de referencia
   - (Opcional) Agregar notas
5. Hacer clic en "Registrar Pago"
6. El pago se registra y aparece inmediatamente en la lista de movimientos
7. El saldo se actualiza automáticamente

### Nota sobre el botón "Registrar pago" en la tarjeta:
El botón "Registrar pago" en la tarjeta del cliente ahora muestra un mensaje indicando que debe usar el modal de cuenta corriente, ya que `QuickPaymentModal` está diseñado solo para ventas.

## Diferencia entre Clientes y Proveedores

**Clientes:**
- Saldo positivo = Cliente tiene saldo a favor (nos debe menos o le debemos)
- Saldo negativo = Cliente nos debe dinero
- Los pagos se registran en `sale_payments` con `sale_id = null`

**Proveedores:**
- Saldo positivo = Le debemos al proveedor
- Saldo negativo = El proveedor nos debe (poco común)
- Los pagos se registran en `supplier_payments` con `purchase_order_id = null`

## Validaciones

- ✅ Campos requeridos validados
- ✅ Autenticación verificada
- ✅ Permisos de empresa verificados
- ✅ Monto debe ser numérico positivo
- ✅ Método de pago debe ser válido
- ✅ Protección contra undefined en QuickPaymentModal

## Testing

Para probar:
1. Registrar un pago a un cliente
2. Verificar que aparece en la cuenta corriente
3. Verificar que el saldo se actualiza correctamente
4. Intentar usar el botón "Registrar pago" de la tarjeta (debe mostrar mensaje)
5. Verificar que el formulario en el modal funciona correctamente

---

**Fecha:** 16/02/2026
**Estado:** Implementado y funcionando
