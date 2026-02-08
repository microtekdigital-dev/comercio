# 🚀 Inicio Rápido - Subir a GitHub

## ⚡ Opción 1: Automático (Windows)

Ejecuta el script automático:

```bash
push-to-github.bat
```

El script hará:
1. ✅ Verificar que todo esté correcto
2. ✅ Agregar archivos
3. ✅ Crear commit
4. ✅ Conectar con GitHub
5. ✅ Subir código

---

## 📝 Opción 2: Manual (Paso a Paso)

### Paso 1: Verificar

```bash
node verify-before-push.js
```

Si hay errores, corrígelos antes de continuar.

### Paso 2: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `erp-saas` (o el que prefieras)
3. Visibilidad: **Private** (recomendado)
4. NO marques ninguna opción de inicialización
5. Click "Create repository"

### Paso 3: Subir Código

```bash
# Agregar archivos
git add .

# Crear commit
git commit -m "Initial commit: ERP Multi-Tenant SaaS"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git

# Subir
git branch -M main
git push -u origin main
```

### Paso 4: Verificar

1. Ve a tu repositorio en GitHub
2. Verifica que todos los archivos estén ahí
3. Verifica que `.env.local` NO esté visible
4. Verifica que `node_modules` NO esté visible

---

## 🔐 Autenticación

Si te pide contraseña, usa un Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Selecciona scope: `repo`
4. Copia el token
5. Úsalo como contraseña

---

## ✅ Checklist Rápido

Antes de subir, verifica:

- [ ] `.env.local` existe localmente
- [ ] `.env.example` existe
- [ ] `.gitignore` está configurado
- [ ] No hay credenciales en el código
- [ ] README.md está actualizado
- [ ] Has ejecutado `node verify-before-push.js`

---

## 🎯 Próximos Pasos

Después de subir a GitHub:

1. **Desplegar en Vercel**
   - Lee [DEPLOYMENT.md](DEPLOYMENT.md)
   - Conecta tu repo con Vercel
   - Configura variables de entorno

2. **Configurar Supabase**
   - Ejecuta los scripts SQL
   - Configura Storage
   - Habilita RLS

3. **Configurar Notificaciones**
   - Opción A: Vercel Cron (Plan Pro)
   - Opción B: cron-job.org (Gratis)
   - Opción C: GitHub Actions (Gratis)

---

## 🆘 Problemas Comunes

### "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
```

### "failed to push"
```bash
git pull origin main --rebase
git push -u origin main
```

### Subiste .env.local por error
```bash
git rm --cached .env.local
git commit -m "Remove .env.local"
git push
```

---

## 📞 Ayuda

Si tienes problemas:
1. Lee [GITHUB_SETUP.md](GITHUB_SETUP.md) para guía detallada
2. Revisa la documentación de Git
3. Busca el error en Google/Stack Overflow

---

## 🎉 ¡Éxito!

Una vez que tu código esté en GitHub:
- ✅ Está respaldado en la nube
- ✅ Puedes colaborar con otros
- ✅ Puedes desplegar en Vercel
- ✅ Tienes control de versiones
- ✅ Puedes revertir cambios si algo sale mal

**¡Felicitaciones! 🎊**
