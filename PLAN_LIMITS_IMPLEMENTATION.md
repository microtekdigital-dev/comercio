# 🔒 Implementación de Límites de Planes

## ✅ Cambios Realizados

### 1. Script SQL Actualizado
**Archivo**: `scripts/seed-plans.sql`

**Cambios**:
- ✅ Agregado soporte para actualizar planes existentes (ON CONFLICT)
- ✅ Creado índice único en `name` para evitar duplicados
- ✅ Agregadas columnas `max_users` y `max_products`
- ✅ Configurados límites por plan:
  - **Básico**: 3 usuarios, 500 productos
  - **Pro**: 11 usuarios, 5,000 productos
  - **Empresarial**: Ilimitado (999,999)

**Cómo ejecutar**:
```sql
-- En Supabase SQL Editor
-- Ejecutar todo el contenido de scripts/seed-plans.sql
```

---

### 2. Utilidades de Validación
**Archivo**: `lib/utils/plan-limits.ts`

**Funciones creadas**:
- ✅ `getCurrentPlanLimits(companyId)` - Obtiene límites del plan actual
- ✅ `canAddUser(companyId)` - Verifica si puede agregar usuarios
- ✅ `canAddProduct(companyId)` - Verifica si puede agregar productos
- ✅ `hasFeature(companyId, featureName)` - Verifica acceso a funcionalidad
- ✅ `getPlanUsage(companyId)` - Obtiene uso actual vs límites

---

### 3. Validación en Invitaciones
**Archivo**: `lib/actions/invitations.ts`

**Cambios**:
- ✅ Importado `canAddUser` de plan-limits
- ✅ Agregada validación antes de crear invitación
- ✅ Retorna mensaje de error si se alcanzó el límite
- ✅ Mensaje personalizado con nombre del plan y límite

**Flujo**:
1. Admin intenta invitar usuario
2. Sistema verifica límite del plan
3. Si está en el límite, muestra error
4. Si hay espacio, permite crear invitación

---

### 4. Validación en Productos
**Archivo**: `lib/actions/products.ts`

**Cambios**:
- ✅ Importado `canAddProduct` de plan-limits
- ✅ Agregada validación en `createProduct()`
- ✅ Retorna mensaje de error si se alcanzó el límite
- ✅ Mensaje personalizado con nombre del plan y límite

**Flujo**:
1. Usuario intenta crear producto
2. Sistema verifica límite del plan
3. Si está en el límite, muestra error
4. Si hay espacio, permite crear producto

---

### 5. Componente de Uso del Plan
**Archivos creados**:
- `components/dashboard/plan-usage.tsx` (cliente)
- `components/dashboard/plan-usage-server.tsx` (servidor)

**Características**:
- ✅ Muestra nombre del plan actual
- ✅ Barra de progreso para usuarios
- ✅ Barra de progreso para productos
- ✅ Alerta cuando se alcanza 80% del límite
- ✅ Botón para actualizar plan (si no es Empresarial)
- ✅ Muestra "∞" para límites ilimitados
- ✅ Responsive y con iconos

**Ubicación**: Dashboard principal (solo para admins)

---

### 6. Integración en Dashboard
**Archivo**: `app/dashboard/page.tsx`

**Cambios**:
- ✅ Importado componente `PlanUsageServer`
- ✅ Agregado en sección de organización
- ✅ Solo visible para usuarios admin
- ✅ Con Suspense para carga asíncrona
- ✅ Skeleton loader mientras carga

---

## 🎯 Funcionalidades Implementadas

### ✅ Límites de Usuarios
- Cuenta usuarios actuales de la empresa
- Compara con límite del plan
- Bloquea invitaciones si se alcanzó el límite
- Muestra mensaje personalizado con límite

### ✅ Límites de Productos
- Cuenta productos actuales de la empresa
- Compara con límite del plan
- Bloquea creación de productos si se alcanzó el límite
- Muestra mensaje personalizado con límite

### ✅ Visualización de Uso
- Dashboard muestra uso actual vs límites
- Barras de progreso visuales
- Alertas cuando se acerca al límite (80%)
- Botón para actualizar plan

### ✅ Manejo de Planes Ilimitados
- Plan Empresarial muestra "∞" en lugar de número
- No muestra barras de progreso para ilimitados
- No muestra alertas de límite

---

## 🧪 Cómo Probar

### 1. Ejecutar Script SQL
```sql
-- En Supabase SQL Editor
-- Copiar y pegar todo el contenido de scripts/seed-plans.sql
-- Ejecutar
```

### 2. Verificar Planes
```sql
SELECT name, max_users, max_products FROM plans ORDER BY sort_order;
```

Deberías ver:
```
Básico       | 3      | 500
Pro          | 11     | 5000
Empresarial  | 999999 | 999999
```

### 3. Probar Límite de Usuarios
1. Ir a Dashboard → Team
2. Intentar invitar usuarios hasta alcanzar el límite
3. Al alcanzar el límite, debería mostrar error:
   ```
   Has alcanzado el límite de 3 usuarios de tu plan Básico. 
   Actualiza tu plan para agregar más usuarios.
   ```

### 4. Probar Límite de Productos
1. Ir a Dashboard → Productos
2. Crear productos hasta alcanzar el límite
3. Al alcanzar el límite, debería mostrar error:
   ```
   Has alcanzado el límite de 500 productos de tu plan Básico. 
   Actualiza tu plan para agregar más productos.
   ```

### 5. Verificar Dashboard
1. Ir a Dashboard principal
2. Como admin, deberías ver card "Uso del Plan"
3. Debería mostrar:
   - Nombre del plan
   - Usuarios: X / Y con barra de progreso
   - Productos: X / Y con barra de progreso
   - Alerta si está cerca del límite (80%+)
   - Botón "Actualizar Plan" si hay alerta

---

## 📊 Mensajes de Error

### Límite de Usuarios
```
Has alcanzado el límite de {max_users} usuarios de tu plan {plan_name}. 
Actualiza tu plan para agregar más usuarios.
```

### Límite de Productos
```
Has alcanzado el límite de {max_products} productos de tu plan {plan_name}. 
Actualiza tu plan para agregar más productos.
```

### Alerta en Dashboard (80%+)
```
⚠️ Solo quedan {remaining} usuario(s) disponible(s)
⚠️ Solo quedan {remaining} producto(s) disponible(s)
```

---

## 🔄 Próximos Pasos (Opcional)

### 1. Bloqueo de Funcionalidades por Plan
- [ ] Bloquear órdenes de compra en plan Básico
- [ ] Bloquear proveedores en plan Básico
- [ ] Bloquear exportar Excel en plan Básico
- [ ] Mostrar mensaje "Actualiza a Pro" en funciones bloqueadas

### 2. Alertas Proactivas
- [ ] Email cuando se alcanza 80% del límite
- [ ] Notificación en dashboard cuando se alcanza 90%
- [ ] Banner en toda la app cuando se alcanza 100%

### 3. Mejoras en UI
- [ ] Modal de upgrade con comparación de planes
- [ ] Animaciones en barras de progreso
- [ ] Tooltips explicativos en límites
- [ ] Historial de uso (gráfico de tendencia)

### 4. Analytics
- [ ] Tracking de intentos bloqueados por límite
- [ ] Métricas de conversión a planes superiores
- [ ] Dashboard de uso para admins

---

## 🐛 Troubleshooting

### Error: "plans_name_unique already exists"
**Solución**: El índice ya existe, puedes ignorar este error o comentar la línea en el script.

### Error: "column max_users already exists"
**Solución**: Las columnas ya existen, puedes ignorar este error o comentar las líneas en el script.

### No se muestra el componente de uso del plan
**Verificar**:
1. ¿Eres usuario admin?
2. ¿Tu empresa tiene una suscripción activa?
3. ¿Ejecutaste el script SQL?
4. Revisar consola del navegador para errores

### Los límites no se aplican
**Verificar**:
1. ¿Ejecutaste el script SQL?
2. ¿Las columnas max_users y max_products existen?
3. ¿La suscripción está activa?
4. Revisar logs del servidor para errores

---

## 📝 Notas Técnicas

### Manejo de Suscripciones Sin Plan
Si una empresa no tiene suscripción activa, el sistema retorna límites por defecto del plan Básico:
- 3 usuarios
- 500 productos
- Sin funcionalidades premium

### Planes Ilimitados
El valor `999999` se usa para representar "ilimitado":
- En UI se muestra como "∞"
- No se muestran barras de progreso
- No se muestran alertas de límite

### Performance
Las funciones de validación hacen queries a la base de datos:
- `canAddUser()`: 2 queries (plan + count usuarios)
- `canAddProduct()`: 2 queries (plan + count productos)
- `getPlanUsage()`: 3 queries (plan + count usuarios + count productos)

Considera implementar caché si hay problemas de performance.

---

**Última actualización**: Febrero 2026
**Versión**: 1.0
