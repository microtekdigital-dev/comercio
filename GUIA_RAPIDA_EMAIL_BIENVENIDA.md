# Guía Rápida: Email de Bienvenida

## ✅ ¿Qué se implementó?

Se agregó un sistema automático de email de bienvenida que se envía cuando un usuario se registra.

## 🚀 Para que funcione AHORA:

### 1. Configurar Variables de Entorno

Edita tu archivo `.env.local` y agrega:

```env
RESEND_API_KEY=tu_api_key_de_resend
RESEND_FROM_EMAIL=onboarding@tudominio.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**¿Dónde conseguir la API Key de Resend?**
1. Ir a https://resend.com
2. Crear cuenta o iniciar sesión
3. Ir a "API Keys"
4. Crear nueva API key
5. Copiar y pegar en `.env.local`

### 2. Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Iniciar de nuevo
npm run dev
```

### 3. Probar

1. Ir a http://localhost:3000/auth/sign-up
2. Registrar un nuevo usuario
3. Revisar el email de bienvenida en la bandeja de entrada

## 🔧 Solucionar Cuenta Problemática

Para la cuenta `freyanimuetarot@gmail.com` que tiene el error:

### Opción A: Eliminar y Re-registrar (Recomendado)

1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Ejecutar el script `docs-auth/DELETE_FREYA_COMPLETE.sql`
4. Ir a Authentication → Users
5. Buscar `freyanimuetarot@gmail.com`
6. Eliminar el usuario de Auth
7. El usuario puede volver a registrarse

### Opción B: Reparar los Datos

1. Ejecutar `docs-auth/FIX_FREYA_COMPANY_ID.sql` en Supabase
2. Esto asignará un company_id válido al perfil

## 📧 Contenido del Email

El email incluye:
- Saludo personalizado con nombre y empresa
- Notificación de prueba gratuita de 14 días
- 4 pasos para comenzar:
  1. Configurar empresa
  2. Agregar productos
  3. Registrar clientes
  4. Comenzar a vender
- Botón para ir al dashboard
- Información de soporte

## 🧪 Probar el Email Manualmente

```bash
curl -X POST http://localhost:3000/api/welcome-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"tu@email.com\",\"userName\":\"Tu Nombre\",\"companyName\":\"Tu Empresa\"}"
```

## ⚠️ Importante

- **El error del dashboard está solucionado:** Ahora muestra un mensaje amigable en lugar de crashear
- **Debes reiniciar el servidor** para que los cambios surtan efecto
- **El email no bloquea el registro:** Si falla, el usuario igual se registra
- **Resend plan gratuito:** 100 emails/día, 3,000 emails/mes

## 📚 Documentación Completa

Para más detalles, ver:
- `RESUMEN_IMPLEMENTACION_BIENVENIDA.md` - Resumen completo
- `WELCOME_EMAIL_SETUP.md` - Guía técnica detallada

## ✅ Checklist Rápido

- [ ] Agregar `RESEND_API_KEY` a `.env.local`
- [ ] Agregar `RESEND_FROM_EMAIL` a `.env.local`
- [ ] Agregar `NEXT_PUBLIC_APP_URL` a `.env.local`
- [ ] Reiniciar servidor de desarrollo
- [ ] Probar registro de nuevo usuario
- [ ] Verificar email de bienvenida
- [ ] (Opcional) Eliminar cuenta problemática

## 🆘 ¿Problemas?

**No llega el email:**
- Verificar que `RESEND_API_KEY` esté correcta
- Verificar que `RESEND_FROM_EMAIL` use un dominio verificado en Resend
- Revisar la consola del servidor para errores
- Revisar Resend Dashboard → Emails

**Error en el dashboard:**
- Reiniciar el servidor de desarrollo
- Limpiar caché del navegador (Ctrl+Shift+R)
- Verificar que los cambios en `erp-stats.tsx` estén guardados

**Cuenta problemática sigue con error:**
- Ejecutar `DELETE_FREYA_COMPLETE.sql`
- Eliminar usuario de Supabase Auth
- Volver a registrar

---

**¿Listo?** Configura las variables de entorno, reinicia el servidor, y prueba registrando un nuevo usuario. 🚀
