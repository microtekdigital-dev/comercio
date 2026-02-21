# 🚀 Actualización Automática a GitHub

## Scripts Disponibles

Tienes 3 opciones para subir cambios a GitHub, ordenadas de más segura a más rápida:

### 1. `push-to-github.bat` (Recomendado para cambios importantes)
**Uso:** Doble click en el archivo

**Características:**
- ✅ Verifica el proyecto antes de subir
- ✅ Te pide un mensaje de commit personalizado
- ✅ Configura el repositorio remoto si es necesario
- ✅ Ideal para commits importantes con descripción detallada

**Cuándo usar:**
- Primera vez que subes el proyecto
- Cambios importantes que necesitan descripción
- Cuando quieres revisar qué se va a subir

---

### 2. `auto-push-github.bat` (Recomendado para uso diario)
**Uso:** Doble click en el archivo

**Características:**
- ✅ Verifica el proyecto antes de subir
- ✅ Genera mensaje de commit automático con fecha/hora
- ✅ Detecta si hay cambios antes de hacer commit
- ✅ Muestra confirmación al finalizar

**Cuándo usar:**
- Actualizaciones diarias del proyecto
- Cuando no necesitas un mensaje específico
- Trabajo en progreso que quieres respaldar

**Ejemplo de commit generado:**
```
Auto-update: 2026-02-21 14:30
```

---

### 3. `quick-push.bat` (Más rápido)
**Uso:** Doble click en el archivo

**Características:**
- ⚡ Ultra rápido - sin pausas ni confirmaciones
- ⚡ No verifica el proyecto
- ⚡ Mensaje de commit automático
- ⚡ Se cierra solo al terminar

**Cuándo usar:**
- Cambios pequeños frecuentes
- Cuando tienes prisa
- Respaldos rápidos durante desarrollo

**⚠️ Advertencia:** No verifica errores antes de subir

**Ejemplo de commit generado:**
```
Quick update: 2026-02-21 14:30
```

---

## 🎯 Flujo de Trabajo Recomendado

### Para Desarrollo Diario
```
1. Haces cambios en el código
2. Doble click en auto-push-github.bat
3. Esperas confirmación
4. ¡Listo!
```

### Para Cambios Importantes
```
1. Haces cambios significativos
2. Doble click en push-to-github.bat
3. Escribes mensaje descriptivo: "Implementar módulo de reparaciones"
4. ¡Listo!
```

### Para Respaldos Rápidos
```
1. Haces cambios pequeños
2. Doble click en quick-push.bat
3. ¡Listo! (se cierra solo)
```

---

## 🔧 Configuración Inicial

### Primera Vez (Solo una vez)

1. **Inicializar Git** (si no lo has hecho):
```bash
git init
```

2. **Configurar tu identidad**:
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

3. **Conectar con GitHub** (usa push-to-github.bat la primera vez):
- Te pedirá la URL del repositorio
- Ejemplo: `https://github.com/tuusuario/tu-repo.git`

4. **Autenticación**:
- Usa un Personal Access Token como contraseña
- Genera uno en: GitHub → Settings → Developer settings → Personal access tokens

---

## 📝 Personalizar Mensajes de Commit

Si quieres cambiar el formato de los mensajes automáticos:

### Editar auto-push-github.bat
Busca esta línea:
```batch
git commit -m "Auto-update: %mydate% %mytime%"
```

Cámbiala por:
```batch
git commit -m "WIP: %mydate% %mytime%"
```
O:
```batch
git commit -m "Backup automático - %mydate%"
```

### Editar quick-push.bat
Busca esta línea:
```batch
git commit -m "Quick update: %mydate% %mytime%"
```

Cámbiala por tu formato preferido.

---

## 🔄 Comandos Git Útiles

### Ver historial de commits
```bash
git log --oneline
```

### Ver cambios sin subir
```bash
git status
```

### Ver diferencias
```bash
git diff
```

### Deshacer último commit (mantener cambios)
```bash
git reset --soft HEAD~1
```

### Ver ramas
```bash
git branch
```

---

## 🚨 Solución de Problemas

### "No hay cambios para subir"
- Normal, significa que no has modificado archivos
- Git solo sube cuando hay cambios

### "Error: failed to push"
Puede ser que alguien más haya subido cambios. Solución:
```bash
git pull --rebase
git push
```

### "Authentication failed"
- Tu token expiró
- Genera uno nuevo en GitHub
- Usa el nuevo token como contraseña

### "Repository not found"
- Verifica la URL del repositorio
- Asegúrate de tener permisos

---

## 🎨 Crear Acceso Directo en Escritorio

Para tener acceso más rápido:

1. Click derecho en `auto-push-github.bat`
2. Enviar a → Escritorio (crear acceso directo)
3. Renombrar a "📤 Subir a GitHub"
4. Cambiar icono (opcional)

Ahora puedes subir cambios desde tu escritorio con un doble click.

---

## 📊 Buenas Prácticas

### ✅ Hacer
- Subir cambios frecuentemente (varias veces al día)
- Usar mensajes descriptivos para cambios importantes
- Revisar `git status` antes de subir
- Hacer commits pequeños y frecuentes

### ❌ Evitar
- Subir código que no compila
- Subir archivos `.env.local` con credenciales
- Hacer commits gigantes con muchos cambios
- Olvidar subir cambios al final del día

---

## 🔐 Seguridad

### Archivos que NUNCA se suben (están en .gitignore)
- `.env.local` - Credenciales
- `node_modules/` - Dependencias
- `.next/` - Build de Next.js
- `backups/` - Respaldos de base de datos

### Verificar antes de subir
```bash
git status
```

Si ves `.env.local` en la lista, ¡DETENTE! No lo subas.

---

## 🎯 Automatización Avanzada (Opcional)

### Subir automáticamente cada hora

Crea un archivo `auto-push-hourly.bat`:
```batch
@echo off
:loop
call quick-push.bat
timeout /t 3600 /nobreak
goto loop
```

Ejecuta este script y dejará subiendo cambios cada hora automáticamente.

### Subir al cerrar VS Code

Agrega a tu `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Auto Push on Close",
      "type": "shell",
      "command": "quick-push.bat",
      "problemMatcher": []
    }
  ]
}
```

---

## 📱 Notificaciones (Opcional)

Para recibir notificación cuando se sube:

Modifica `auto-push-github.bat` agregando al final:
```batch
msg * "Cambios subidos exitosamente a GitHub"
```

---

## 🎉 Resumen

| Script | Velocidad | Seguridad | Uso Recomendado |
|--------|-----------|-----------|-----------------|
| push-to-github.bat | 🐢 Lento | 🛡️ Muy seguro | Cambios importantes |
| auto-push-github.bat | 🚗 Normal | 🛡️ Seguro | Uso diario |
| quick-push.bat | 🚀 Rápido | ⚠️ Sin verificación | Respaldos rápidos |

**Recomendación:** Usa `auto-push-github.bat` para el 90% de tus actualizaciones.

---

*Última actualización: 2026-02-21*
