# 📧 Guía de Configuración de Resend

## 🎯 Objetivo

Configurar Resend para enviar emails automáticos de invitación a empleados.

---

## 📋 Paso 1: Crear Cuenta en Resend

1. **Ir a Resend**: https://resend.com
2. **Crear cuenta** (gratis)
3. **Verificar email**

---

## 🔑 Paso 2: Obtener API Key

1. **Login en Resend**: https://resend.com/login
2. **Ir a API Keys**: https://resend.com/api-keys
3. **Crear nueva API Key**:
   - Nombre: "Producción" o "Desarrollo"
   - Permisos: "Sending access"
4. **Copiar la API Key** (empieza con `re_`)

⚠️ **IMPORTANTE**: Guarda la API Key en un lugar seguro, solo se muestra una vez.

---

## 📧 Paso 3: Configurar Dominio (Opcional pero Recomendado)

### Opción A: Usar dominio propio (Recomendado para producción)

1. **Ir a Domains**: https://resend.com/domains
2. **Add Domain**
3. **Ingresar tu dominio**: `tudominio.com`
4. **Agregar registros DNS**:
   - Resend te dará 3 registros DNS (SPF, DKIM, DMARC)
   - Agrégalos en tu proveedor de dominio (GoDaddy, Namecheap, etc.)
5. **Verificar dominio** (puede tardar hasta 48 horas)

**Ventajas:**
- ✅ Emails desde `noreply@tudominio.com`
- ✅ Mejor deliverability
- ✅ Más profesional

### Opción B: Usar dominio de Resend (Para desarrollo)

- Puedes usar `onboarding@resend.dev` temporalmente
- Solo para pruebas, no para producción

---

## ⚙️ Paso 4: Configurar Variables de Entorno

### 4.1 Archivo `.env.local`

Crea o edita el archivo `.env.local` en la raíz del proyecto:

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tudominio.com

# Site URL (tu dominio de producción)
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

### 4.2 Valores a reemplazar:

- `re_xxxxxxxxxxxxx` → Tu API Key de Resend
- `noreply@tudominio.com` → Tu email verificado en Resend
- `https://tudominio.com` → Tu dominio de producción

### 4.3 Para desarrollo local:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🧪 Paso 5: Probar el Sistema

### 5.1 Reiniciar el servidor

```bash
npm run dev
```

### 5.2 Enviar invitación de prueba

1. **Login** como admin
2. **Ir a** `/dashboard/invitations`
3. **Enviar invitación** a un email de prueba
4. **Verificar**:
   - ✅ La invitación se crea en la base de datos
   - ✅ El email llega a la bandeja de entrada
   - ✅ El link de invitación funciona

### 5.3 Verificar logs

En la consola del servidor deberías ver:

```
[Resend] Invitation email sent successfully: [message-id]
```

Si hay error:

```
[Resend] Error sending invitation email: [error-message]
```

---

## 🔍 Paso 6: Verificar Deliverability

### En Resend Dashboard:

1. **Ir a Logs**: https://resend.com/logs
2. **Ver emails enviados**:
   - Status: "delivered" ✅
   - Opens: Cuántos abrieron el email
   - Clicks: Cuántos hicieron clic en el link

### Si los emails no llegan:

1. **Verificar spam**: Revisar carpeta de spam
2. **Verificar dominio**: Asegurarse que el dominio esté verificado
3. **Verificar API Key**: Que sea válida y tenga permisos
4. **Verificar logs**: En Resend Dashboard

---

## 📊 Límites del Plan Gratuito

| Característica | Plan Gratuito |
|---------------|---------------|
| Emails/mes | 3,000 |
| Emails/día | 100 |
| Dominios | 1 |
| API Keys | Ilimitadas |
| Logs | 30 días |

**Para tu caso:**
- 100 empresas × 3 empleados = 300 invitaciones
- Bien dentro del límite gratuito ✅

---

## 🚀 Paso 7: Configuración en Producción (Vercel)

### 7.1 Agregar variables de entorno en Vercel:

1. **Ir a tu proyecto** en Vercel
2. **Settings** → **Environment Variables**
3. **Agregar**:
   - `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
   - `RESEND_FROM_EMAIL` = `noreply@tudominio.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://tudominio.com`

### 7.2 Redeploy:

```bash
git push origin main
```

O desde Vercel Dashboard: **Deployments** → **Redeploy**

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Resend creada
- [ ] API Key obtenida
- [ ] Dominio agregado y verificado (opcional)
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Servidor reiniciado
- [ ] Invitación de prueba enviada
- [ ] Email recibido correctamente
- [ ] Link de invitación funciona
- [ ] Variables configuradas en Vercel (producción)

---

## 🐛 Troubleshooting

### Error: "Missing API key"

**Causa**: La variable `RESEND_API_KEY` no está configurada.

**Solución**:
1. Verificar que `.env.local` existe
2. Verificar que la variable está correctamente escrita
3. Reiniciar el servidor

### Error: "Invalid API key"

**Causa**: La API Key es incorrecta o expiró.

**Solución**:
1. Generar nueva API Key en Resend
2. Actualizar `.env.local`
3. Reiniciar el servidor

### Error: "Domain not verified"

**Causa**: El dominio no está verificado en Resend.

**Solución**:
1. Usar `onboarding@resend.dev` temporalmente
2. O verificar el dominio en Resend Dashboard

### Emails no llegan

**Posibles causas**:
1. Email en spam → Verificar carpeta de spam
2. Dominio no verificado → Verificar en Resend
3. API Key sin permisos → Regenerar API Key
4. Límite diario alcanzado → Esperar 24 horas o upgrade plan

### Emails llegan pero sin formato

**Causa**: El HTML no se está renderizando.

**Solución**:
- Verificar que el cliente de email soporta HTML
- Algunos clientes de email bloquean imágenes/estilos

---

## 📈 Monitoreo

### Métricas importantes:

1. **Delivery Rate**: % de emails entregados
   - Objetivo: >95%
2. **Open Rate**: % de emails abiertos
   - Objetivo: >20%
3. **Click Rate**: % de clicks en el link
   - Objetivo: >50%

### Ver métricas en Resend:

https://resend.com/logs

---

## 💰 Upgrade a Plan Pago (Opcional)

Si superas 3,000 emails/mes:

| Plan | Precio | Emails/mes |
|------|--------|------------|
| Free | $0 | 3,000 |
| Pro | $20 | 50,000 |
| Business | $80 | 200,000 |

**Cuándo hacer upgrade:**
- Más de 1,000 empresas activas
- Necesitas más de 3,000 emails/mes
- Quieres soporte prioritario

---

## 🔐 Seguridad

### Buenas prácticas:

1. **Nunca commitear** `.env.local` al repositorio
2. **Rotar API Keys** cada 6 meses
3. **Usar diferentes API Keys** para desarrollo y producción
4. **Monitorear uso** en Resend Dashboard
5. **Configurar alertas** si se alcanza el límite

---

## 📚 Recursos Adicionales

- **Documentación Resend**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference
- **Status Page**: https://status.resend.com
- **Soporte**: support@resend.com

---

## 🎉 ¡Listo!

Tu sistema de invitaciones ahora envía emails automáticamente. Los empleados recibirán un email profesional con un link para unirse a la empresa.

**Próximos pasos opcionales:**
- Personalizar el template del email
- Agregar logo de la empresa
- Agregar más tipos de emails (notificaciones, facturas, etc.)
