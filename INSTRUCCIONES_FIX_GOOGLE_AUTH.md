# 🔧 Instrucciones Rápidas: Fix Google Auth

## ⚡ Solución Rápida (3 pasos)

### 1️⃣ Ejecutar Diagnóstico
```
Archivo: DEBUG_GOOGLE_AUTH_PROBLEMA_ESPECIFICO.sql
```
- Abre Supabase SQL Editor
- Reemplaza `'TU_EMAIL_AQUI@gmail.com'` con tu email en TODAS las líneas
- Ejecuta el script completo
- Lee los resultados

### 2️⃣ Aplicar Fix Automático
```
Archivo: FIX_GOOGLE_AUTH_ACCESO_COMPLETO.sql
```
- Abre Supabase SQL Editor
- Reemplaza `'TU_EMAIL_AQUI@gmail.com'` con tu email en TODAS las líneas
- Ejecuta el script completo
- Verás mensajes como "✓ Empresa creada", "✓ Membresía creada", etc.

### 3️⃣ Probar Acceso
- Cierra sesión en la app
- Vuelve a iniciar sesión con Google
- Deberías poder acceder al dashboard

---

## 📋 ¿Qué hace el fix automático?

El script `FIX_GOOGLE_AUTH_ACCESO_COMPLETO.sql` ejecuta 4 soluciones:

1. **Crea empresa** si no existe y asigna `company_id` al perfil
2. **Crea membresía** en `company_users` si no existe
3. **Crea suscripción Trial** si no hay ninguna activa (14 días)
4. **Limpia duplicados** si hay múltiples suscripciones activas

---

## 🔍 Interpretando el Diagnóstico

### ✅ Si ves esto, está todo bien:
```
✓ company_id está asignado correctamente
✓ DEBERÍA TENER ACCESO
✓ Solo una suscripción
✓ Existe en company_users
```

### ❌ Si ves esto, hay problemas:
```
✗ ERROR CRÍTICO: company_id es NULL
✗ SUSCRIPCIÓN EXPIRADA
✗ NO EXISTE EN company_users
⚠ ADVERTENCIA: Múltiples suscripciones encontradas
```

---

## 🆘 Si aún no funciona

### Opción A: Verificación Manual
```sql
SELECT 
  u.email,
  p.company_id,
  s.status,
  s.current_period_end > NOW() as vigente
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN subscriptions s ON s.company_id = p.company_id
WHERE u.email = 'tu-email@gmail.com';
```

**Resultado esperado:**
- `company_id`: debe tener un UUID (no NULL)
- `status`: debe ser 'active'
- `vigente`: debe ser true

### Opción B: Revisar Logs del Navegador
1. Abre la app
2. Presiona F12
3. Ve a "Console"
4. Intenta hacer login
5. Busca mensajes que empiecen con `[DashboardLayout]`

### Opción C: Extender Trial Manualmente
```sql
UPDATE subscriptions
SET current_period_end = NOW() + INTERVAL '14 days',
    status = 'active'
WHERE company_id = (
  SELECT company_id FROM profiles WHERE id = (
    SELECT id FROM auth.users WHERE email = 'tu-email@gmail.com'
  )
);
```

---

## 📁 Archivos Creados

1. **DEBUG_GOOGLE_AUTH_PROBLEMA_ESPECIFICO.sql** - Diagnóstico detallado
2. **FIX_GOOGLE_AUTH_ACCESO_COMPLETO.sql** - Solución automática
3. **FIX_GOOGLE_AUTH_NO_ACCESO_COMPLETO.md** - Documentación completa
4. **INSTRUCCIONES_FIX_GOOGLE_AUTH.md** - Este archivo (guía rápida)

---

## 💡 Tip Importante

**SIEMPRE** reemplaza `'TU_EMAIL_AQUI@gmail.com'` con tu email real antes de ejecutar los scripts.

Ejemplo:
```sql
-- ❌ MAL
WHERE u.email = 'TU_EMAIL_AQUI@gmail.com';

-- ✅ BIEN
WHERE u.email = 'juan.perez@gmail.com';
```

---

## ✨ Resultado Esperado

Después de aplicar el fix:
- ✓ Puedes hacer login con Google
- ✓ Accedes al dashboard sin problemas
- ✓ Ves tus datos y estadísticas
- ✓ Tienes 14 días de Trial activo

---

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos aún no funciona, comparte:
1. Resultados del diagnóstico (captura de pantalla)
2. Mensajes del fix (captura de pantalla)
3. Logs del navegador (Console)
4. Resultado de la verificación manual
