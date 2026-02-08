# 🎯 Pasos para Activar Resend (15 minutos)

## ✅ Estado Actual

El código ya está implementado. Solo necesitas configurar tu cuenta de Resend.

---

## 📝 Paso 1: Crear Cuenta (5 min)

### 1.1 Ir a Resend
```
https://resend.com
```

### 1.2 Hacer clic en "Sign Up"

### 1.3 Completar formulario:
- Email
- Password
- Nombre

### 1.4 Verificar email
- Revisar bandeja de entrada
- Hacer clic en el link de verificación

---

## 🔑 Paso 2: Obtener API Key (2 min)

### 2.1 Login en Resend
```
https://resend.com/login
```

### 2.2 Ir a API Keys
```
https://resend.com/api-keys
```

### 2.3 Crear nueva API Key
- Hacer clic en "Create API Key"
- Nombre: "Producción" o "Mi App"
- Permisos: "Sending access" (default)
- Hacer clic en "Add"

### 2.4 Copiar la API Key
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE**: Solo se muestra una vez. Guárdala en un lugar seguro.

---

## ⚙️ Paso 3: Configurar Variables (2 min)

### 3.1 Abrir archivo `.env.local`

Si no existe, créalo en la raíz del proyecto.

### 3.2 Agregar estas líneas:

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3.3 Reemplazar valores:

- `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` → Tu API Key de Resend (del paso 2.4)

**Ejemplo completo:**
```env
# Resend Configuration
RESEND_API_KEY=re_abc123def456ghi789jkl012mno345
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🔄 Paso 4: Reiniciar Servidor (1 min)

### 4.1 Detener el servidor
- Presiona `Ctrl + C` en la terminal

### 4.2 Iniciar nuevamente
```bash
npm run dev
```

### 4.3 Esperar a que inicie
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

---

## 🧪 Paso 5: Probar (5 min)

### 5.1 Abrir navegador
```
http://localhost:3000
```

### 5.2 Login como admin
- Email: tu email de admin
- Password: tu contraseña

### 5.3 Ir a Invitaciones
```
http://localhost:3000/dashboard/invitations
```

O desde el menú: Dashboard → Team → Invitations

### 5.4 Enviar invitación de prueba
- Email: tu email personal (para probar)
- Rol: Employee
- Hacer clic en "Send Invitation"

### 5.5 Verificar en consola del servidor

Deberías ver:
```
[Resend] Invitation email sent successfully: [message-id]
```

Si ves error:
```
[Resend] Error sending invitation email: [error-message]
```
→ Verificar que la API Key esté correcta

### 5.6 Revisar email

1. Abrir tu bandeja de entrada
2. Buscar email de "onboarding@resend.dev"
3. Verificar que el email llegó
4. Hacer clic en "Aceptar Invitación"
5. Completar el registro

---

## ✅ Verificación Final

### Checklist:

- [ ] Cuenta de Resend creada ✓
- [ ] Email verificado ✓
- [ ] API Key obtenida ✓
- [ ] `.env.local` actualizado ✓
- [ ] Servidor reiniciado ✓
- [ ] Invitación enviada ✓
- [ ] Email recibido ✓
- [ ] Link funciona ✓

---

## 🎉 ¡Listo!

Tu sistema ahora envía emails automáticamente cuando invitas empleados.

**Lo que cambió:**
- ❌ Antes: Tenías que copiar el link manualmente
- ✅ Ahora: El empleado recibe un email automático

---

## 📊 Monitoreo

### Ver emails enviados:

1. Ir a Resend Dashboard
```
https://resend.com/logs
```

2. Ver lista de emails:
- ✅ Delivered: Email entregado
- 📧 Opened: Email abierto
- 🔗 Clicked: Link clickeado

---

## 🔧 Configuración para Producción (Después)

Cuando subas a producción (Vercel):

### 1. Verificar dominio en Resend

1. Ir a: https://resend.com/domains
2. Add Domain: `tudominio.com`
3. Agregar registros DNS
4. Esperar verificación

### 2. Actualizar variables en Vercel

1. Ir a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agregar:
   - `RESEND_API_KEY` = `re_xxxxx`
   - `RESEND_FROM_EMAIL` = `noreply@tudominio.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://tudominio.com`

### 3. Redeploy

```bash
git push origin main
```

---

## 💰 Costos

| Plan | Precio | Emails/mes |
|------|--------|------------|
| Free | $0 | 3,000 |
| Pro | $20 | 50,000 |

**Tu caso:**
- 100 empresas × 3 empleados = 300 invitaciones/mes
- ✅ Gratis

---

## 🐛 Problemas Comunes

### Email no llega

**Solución 1:** Revisar spam
- Buscar en carpeta de spam/correo no deseado

**Solución 2:** Verificar API Key
- Ir a `.env.local`
- Verificar que `RESEND_API_KEY` esté correcta
- Reiniciar servidor

**Solución 3:** Ver logs en Resend
- Ir a: https://resend.com/logs
- Ver si el email se envió
- Ver error si lo hay

### Error: "Missing API key"

**Causa:** La variable no está configurada

**Solución:**
1. Verificar que `.env.local` existe
2. Verificar que tiene `RESEND_API_KEY=re_xxxxx`
3. Reiniciar servidor

### Error: "Invalid API key"

**Causa:** La API Key es incorrecta

**Solución:**
1. Ir a: https://resend.com/api-keys
2. Crear nueva API Key
3. Actualizar `.env.local`
4. Reiniciar servidor

---

## 📞 Soporte

- **Documentación**: https://resend.com/docs
- **Email**: support@resend.com
- **Status**: https://status.resend.com

---

## 📚 Archivos Relacionados

- `RESUMEN_RESEND.md` - Resumen ejecutivo
- `GUIA_CONFIGURACION_RESEND.md` - Guía completa
- `lib/email/resend.ts` - Código del servicio
- `lib/actions/invitations.ts` - Integración

---

**Tiempo total: 15 minutos** ⏱️

**Dificultad: Fácil** ⭐

**Resultado: Emails automáticos** 📧✨
