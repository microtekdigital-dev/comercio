# Solución: URL de Invitación con localhost

## Problema

Los emails de invitación están usando `http://localhost:3000` en lugar del dominio de producción.

## Causa

La URL del sitio está configurada en Supabase con `localhost:3000`. Esto afecta:
- Emails de confirmación
- Emails de invitación
- Emails de recuperación de contraseña
- Cualquier link generado por Supabase Auth

## Solución

Debes configurar la URL correcta en Supabase:

### Paso 1: Ir a Configuración de Supabase

1. Abre tu proyecto en Supabase Dashboard
2. Ve a **Authentication** → **URL Configuration**

### Paso 2: Configurar Site URL

Busca el campo **Site URL** y cámbialo de:
```
http://localhost:3000
```

A tu dominio de producción:
```
https://tu-dominio.com
```

O si estás usando Vercel:
```
https://tu-app.vercel.app
```

### Paso 3: Configurar Redirect URLs

En **Redirect URLs**, agrega:
```
https://tu-dominio.com/**
https://tu-dominio.com/auth/callback
https://tu-dominio.com/invite/*
```

Si quieres mantener localhost para desarrollo, también agrega:
```
http://localhost:3000/**
http://localhost:3000/auth/callback
http://localhost:3000/invite/*
```

### Paso 4: Configurar Email Templates (Opcional)

Si quieres personalizar los emails:

1. Ve a **Authentication** → **Email Templates**
2. Edita cada template (Confirm signup, Invite user, Magic Link, etc.)
3. Verifica que usen `{{ .SiteURL }}` en lugar de URLs hardcodeadas

Ejemplo de template de invitación:
```html
<h2>Has sido invitado</h2>
<p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
<p><a href="{{ .SiteURL }}/invite/{{ .Token }}">Aceptar invitación</a></p>
```

## Variables de Entorno (Opcional)

Si quieres manejar diferentes URLs según el entorno, puedes usar variables de entorno:

En tu archivo `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

En producción (Vercel):
```env
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

Luego en tu código:
```typescript
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
```

## Verificación

Después de cambiar la configuración:

1. Envía una nueva invitación
2. Verifica que el email contenga la URL correcta
3. Haz clic en el link para confirmar que funciona

## Notas Importantes

- Los cambios en Supabase son inmediatos
- No necesitas reiniciar tu aplicación
- Los emails ya enviados seguirán teniendo la URL antigua
- Solo los nuevos emails usarán la URL actualizada

## Para Desarrollo Local

Si quieres probar invitaciones en desarrollo:

1. Mantén `http://localhost:3000` en Site URL
2. O usa un servicio como ngrok para exponer tu localhost
3. Configura la URL de ngrok en Supabase temporalmente

## Troubleshooting

Si después de cambiar la URL sigues viendo localhost:

1. Verifica que guardaste los cambios en Supabase
2. Limpia el caché de tu navegador
3. Envía una nueva invitación (las antiguas no se actualizan)
4. Verifica que no haya variables de entorno sobreescribiendo la URL
