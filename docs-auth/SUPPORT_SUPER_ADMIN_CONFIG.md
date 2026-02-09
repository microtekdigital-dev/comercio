# 🔒 Configuración de Super Admin para Chat de Soporte

## 📋 Resumen

El sistema de chat de soporte está configurado para que **SOLO TÚ** (el creador de la app) puedas ver y responder todos los mensajes de soporte. Los admins de cada empresa NO tienen acceso al panel de soporte global.

---

## ⚙️ Configuración

### Paso 1: Agregar tu Email al .env

Agrega esta línea a tu archivo `.env.local`:

```bash
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=tu-email@ejemplo.com
```

**Reemplaza `tu-email@ejemplo.com` con tu email real.**

### Paso 2: Reiniciar el Servidor

Después de agregar la variable de entorno:

```bash
# Detén el servidor (Ctrl+C)
# Inicia nuevamente
npm run dev
```

---

## 🔐 Cómo Funciona la Seguridad

### Verificación en el Código

El archivo `app/dashboard/admin/support/page.tsx` verifica:

```typescript
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "tu-email@ejemplo.com";

if (user.email !== SUPER_ADMIN_EMAIL) {
  redirect("/dashboard");
}
```

### Niveles de Acceso

| Usuario | Puede Ver | Puede Responder |
|---------|-----------|-----------------|
| **Tú (Super Admin)** | ✅ Todos los tickets de todas las empresas | ✅ Sí |
| **Admin de Empresa** | ✅ Solo tickets de su empresa | ❌ No (redirigido) |
| **Usuario Normal** | ✅ Solo sus propios tickets | ❌ No (redirigido) |

---

## 📍 Acceso al Panel

### Para Ti (Super Admin)

**URL:** `/dashboard/admin/support`

Verás:
- 📋 Todos los tickets de todas las empresas
- 👤 Información del usuario (email, nombre)
- 🏢 Información de la empresa
- 💬 Chat en tiempo real
- 🎯 Cambiar estado de tickets

### Para Otros Usuarios

Si intentan acceder a `/dashboard/admin/support`:
- ❌ Serán redirigidos a `/dashboard`
- ❌ No verán ningún error, solo redirección silenciosa

---

## 🚀 Uso del Panel de Soporte

### 1. Acceder al Panel

Ve a: `http://localhost:3000/dashboard/admin/support`

(En producción: `https://tu-dominio.com/dashboard/admin/support`)

### 2. Ver Tickets

- **Sidebar izquierdo:** Lista de todos los tickets
- **Filtros:** Todos, Abiertos, En Progreso, Resueltos, Cerrados
- **Información:** Usuario, Empresa, Fecha

### 3. Responder Mensajes

1. Haz clic en un ticket
2. Escribe tu respuesta
3. Presiona Enter o clic en "Enviar"
4. El usuario recibe tu mensaje en tiempo real

### 4. Cambiar Estado

- **Abierto** → Ticket nuevo, sin atender
- **En Progreso** → Estás trabajando en él
- **Resuelto** → Problema solucionado
- **Cerrado** → Ticket finalizado

---

## 🔧 Personalización

### Cambiar el Email del Super Admin

1. Edita `.env.local`
2. Cambia `NEXT_PUBLIC_SUPER_ADMIN_EMAIL`
3. Reinicia el servidor

### Agregar Múltiples Super Admins

Si quieres que más personas tengan acceso, modifica `app/dashboard/admin/support/page.tsx`:

```typescript
const SUPER_ADMIN_EMAILS = [
  "tu-email@ejemplo.com",
  "otro-admin@ejemplo.com",
  "soporte@ejemplo.com"
];

if (!SUPER_ADMIN_EMAILS.includes(user.email || "")) {
  redirect("/dashboard");
}
```

---

## 🛡️ Seguridad Adicional

### Row Level Security (RLS)

Las políticas de Supabase ya están configuradas para:
- ✅ Los usuarios solo ven sus propios tickets
- ✅ Los mensajes están protegidos por ticket
- ✅ Solo el creador puede cerrar su ticket

### Verificación en el Backend

El acceso al panel se verifica en el servidor (Server Component), no en el cliente. Esto significa que:
- ✅ No se puede bypassear desde el navegador
- ✅ La verificación es segura
- ✅ No hay forma de acceder sin el email correcto

---

## 📊 Monitoreo

### Ver Todos los Tickets en Supabase

Si necesitas ver los datos directamente:

1. Ve a Supabase Dashboard
2. Table Editor
3. Tabla `support_tickets`
4. Tabla `support_messages`

### Estadísticas

El sistema calcula automáticamente:
- Total de tickets
- Tickets por estado
- Tiempo promedio de respuesta

---

## ⚠️ Importante

### NO Compartas tu Email de Super Admin

- ❌ No lo pongas en el código (usa .env)
- ❌ No lo subas a GitHub (está en .gitignore)
- ✅ Manténlo en `.env.local` (local)
- ✅ En producción, configúralo en las variables de entorno de Vercel/Netlify

### Backup del Email

Si pierdes acceso a tu email de super admin:
1. Accede a tu servidor/hosting
2. Cambia la variable de entorno
3. Reinicia la aplicación

---

## ✅ Checklist de Configuración

- [ ] Agregar `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` a `.env.local`
- [ ] Reiniciar el servidor de desarrollo
- [ ] Probar acceso a `/dashboard/admin/support`
- [ ] Verificar que otros usuarios NO puedan acceder
- [ ] Crear un ticket de prueba desde el botón flotante
- [ ] Responder el ticket desde el panel de admin
- [ ] Verificar que el usuario recibe la respuesta en tiempo real

---

## 🎉 ¡Listo!

Ahora solo TÚ puedes ver y responder todos los mensajes de soporte. Los usuarios crean tickets desde el botón flotante 💬 y tú los respondes desde `/dashboard/admin/support`.

**¡Tu sistema de soporte está completamente configurado y seguro!** 🚀
