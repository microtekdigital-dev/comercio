# 📦 Guía para Subir a GitHub

Sigue estos pasos para subir tu proyecto a GitHub.

## ✅ Verificación Pre-Subida

Antes de subir, asegúrate de que:

1. ✅ El archivo `.env.local` NO se subirá (está en .gitignore)
2. ✅ Las credenciales están en `.env.local`, no en el código
3. ✅ Has revisado que no hay datos sensibles en el código

## 🔧 Paso 1: Verificar Git

Verifica si ya tienes Git inicializado:

```bash
git status
```

Si ves un error, inicializa Git:

```bash
git init
```

## 📝 Paso 2: Agregar Archivos

Agrega todos los archivos al staging:

```bash
git add .
```

Verifica qué archivos se van a subir:

```bash
git status
```

**IMPORTANTE:** Verifica que `.env.local` NO aparezca en la lista. Si aparece, detente y revisa tu `.gitignore`.

## 💾 Paso 3: Hacer Commit

Crea tu primer commit:

```bash
git commit -m "Initial commit: ERP Multi-Tenant SaaS"
```

## 🌐 Paso 4: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Completa:
   - **Repository name**: `erp-saas` (o el nombre que prefieras)
   - **Description**: "Sistema ERP Multi-Tenant para PyMEs"
   - **Visibility**: 
     - ✅ **Private** (recomendado si es comercial)
     - ⚠️ Public (solo si quieres código abierto)
   - **NO marques**: Initialize with README, .gitignore, o license

3. Click en "Create repository"

## 🔗 Paso 5: Conectar con GitHub

GitHub te mostrará comandos. Usa estos (reemplaza con tu URL):

```bash
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main
```

**Ejemplo real:**
```bash
git remote add origin https://github.com/juanperez/erp-saas.git
git branch -M main
git push -u origin main
```

## 🔐 Autenticación

Si te pide usuario y contraseña:

### Opción A: Personal Access Token (Recomendado)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Selecciona scopes: `repo` (todos los permisos de repositorio)
4. Copia el token
5. Úsalo como contraseña cuando Git te lo pida

### Opción B: GitHub CLI

```bash
# Instalar GitHub CLI
# Windows: winget install GitHub.cli
# Mac: brew install gh

# Autenticar
gh auth login
```

## ✅ Verificación

Después de hacer push, verifica:

1. Ve a tu repositorio en GitHub
2. Deberías ver todos tus archivos
3. Verifica que `.env.local` NO esté visible
4. Verifica que `node_modules` NO esté visible

## 🔄 Actualizaciones Futuras

Para subir cambios futuros:

```bash
# 1. Ver qué cambió
git status

# 2. Agregar cambios
git add .

# 3. Hacer commit
git commit -m "Descripción de los cambios"

# 4. Subir a GitHub
git push
```

## 🌿 Trabajar con Ramas (Opcional)

Para trabajar en features sin afectar main:

```bash
# Crear y cambiar a nueva rama
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commits
git add .
git commit -m "Agregar nueva funcionalidad"

# Subir rama a GitHub
git push -u origin feature/nueva-funcionalidad

# Luego crear Pull Request en GitHub
```

## 🚨 Solución de Problemas

### Error: "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
```

### Error: "failed to push some refs"

```bash
git pull origin main --rebase
git push -u origin main
```

### Subiste .env.local por error

```bash
# Eliminar del repositorio (pero mantener local)
git rm --cached .env.local
git commit -m "Remove .env.local from repository"
git push

# Luego ve a GitHub → Settings → Secrets y agrega las variables
```

### Archivo muy grande

GitHub tiene límite de 100MB por archivo. Si tienes archivos grandes:

```bash
# Agregar a .gitignore
echo "archivo-grande.zip" >> .gitignore
git add .gitignore
git commit -m "Ignore large files"
```

## 📋 Checklist Final

Antes de compartir tu repositorio:

- [ ] `.env.local` no está en GitHub
- [ ] `node_modules` no está en GitHub
- [ ] README.md está actualizado
- [ ] DEPLOYMENT.md tiene instrucciones claras
- [ ] `.env.example` tiene todas las variables necesarias
- [ ] No hay credenciales hardcodeadas en el código
- [ ] El repositorio es privado (si es comercial)

## 🎉 ¡Listo!

Tu código está ahora en GitHub. Puedes:

1. Compartir el repositorio con tu equipo
2. Conectarlo con Vercel para despliegue automático
3. Configurar GitHub Actions para CI/CD
4. Usar GitHub Issues para tracking de bugs
5. Usar GitHub Projects para gestión de tareas

## 🔗 Próximos Pasos

1. [Desplegar en Vercel](DEPLOYMENT.md)
2. Configurar Supabase
3. Invitar colaboradores al repositorio
4. Configurar branch protection rules (opcional)

---

**Tip:** Haz commits frecuentes con mensajes descriptivos. Es mejor hacer muchos commits pequeños que uno grande.
