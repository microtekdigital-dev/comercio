# Verificación Manual de Google OAuth

## URGENTE: Información que Necesito

Por favor, ve a Supabase Dashboard y compárteme EXACTAMENTE lo que ves:

### 1. Site URL en Supabase

1. Ve a: **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. ¿Qué dice en el campo **"Site URL"**?
   - Copia exactamente lo que ves: https://www.negociopymes.com.ar

### 2. Redirect URLs en Supabase

En la misma página, en **"Redirect URLs"**:
- ¿Qué URLs ves listadas?
- Copia TODAS las URLs que aparecen: 
https://v0-saa-s-erp-boilerplate-plwd377ao.vercel.app/**

https://v0-saa-s-erp-boilerplate-bqykyarkl.vercel.app/**

https://v0-saa-s-erp-boilerplate-natu9xres.vercel.app/**

https://v0-saa-s-erp-boilerplate-b9p980rch.vercel.app/**

https://v0.app/chat/api/supabase/redirect/AHdR7ropc1c

https://www.negociopymes.com.ar

### 3. Google Provider

1. Ve a: **Supabase Dashboard** → **Authentication** → **Providers**
2. Busca **Google** en la lista
3. ¿El toggle está en verde (ON)? Si
4. Haz clic en Google para expandir
5. ¿Ves el Client ID completo? (termina en `.apps.googleusercontent.com`) Si

### 4. Error en el Navegador

Cuando intentas iniciar sesión con Google:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Haz clic en "Continuar con Google"
4. Copia TODO lo que aparece en la consola

### 5. URL del Error

Después de hacer clic en "Continuar con Google":
- ¿A qué URL te redirige?
- Copia la URL completa donde terminas

## Configuración Correcta Esperada

### Site URL debe ser:
```
https://www.negociopymes.com.ar
```

### Redirect URLs debe incluir:
```
http://localhost:3000/**
https://negociopymes.com.ar/**
https://www.negociopymes.com.ar/**
```

## Acción Inmediata

Si tu Site URL NO es `https://www.negociopymes.com.ar`:

1. Cámbialo a: `https://www.negociopymes.com.ar`
2. Haz clic en **Save**
3. Espera 3 minutos
4. Prueba nuevamente

Si tus Redirect URLs NO incluyen las 3 URLs de arriba:

1. Agrégalas (una por línea)
2. Haz clic en **Save**
3. Espera 3 minutos
4. Prueba nuevamente

## Variables de Entorno

¿Dónde tienes desplegada tu aplicación?
- [ X] Vercel
- [ ] Netlify
- [ ] Otro: _______________

En tu plataforma de hosting, verifica que tengas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rttzqbdxpvdyqqnxkaor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SITE_URL=https://www.negociopymes.com.ar
```

**ELIMINA** si existe:
```env
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
```

Después de cambiar variables de entorno:
1. Haz un **redeploy completo**
2. Espera a que termine
3. Prueba nuevamente

## Test Rápido

Para verificar si el problema es de configuración:

1. Abre: `https://www.negociopymes.com.ar/auth/login`
2. Abre consola del navegador (F12)
3. En la pestaña Console, escribe:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log(process.env.NEXT_PUBLIC_SITE_URL)
   ```
4. ¿Qué valores ves?

## Siguiente Paso

Comparte la información solicitada arriba y podré darte la solución exacta.
