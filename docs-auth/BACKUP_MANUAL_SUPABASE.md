# 🔄 GUÍA DE BACKUP MANUAL PARA SUPABASE

## ¿Por Qué Necesitas Backups?

Tu sistema ERP contiene datos críticos:
- 💰 Ventas y facturación
- 📦 Inventario de productos
- 👥 Clientes y proveedores
- 💳 Historial de pagos y suscripciones
- 🏢 Datos de empresas

**Perder estos datos sería catastrófico para el negocio.**

## 🎯 Estrategia de Backup Recomendada

### Opción 1: Backup Manual con pg_dump (Gratis)

#### Requisitos
- PostgreSQL client instalado en tu computadora
- Credenciales de conexión de Supabase

#### Pasos

1. **Obtener credenciales de conexión**
   - Ve a tu proyecto en Supabase
   - Settings → Database
   - Copia la "Connection string" (modo directo)

2. **Instalar PostgreSQL client**
   ```bash
   # Windows (con Chocolatey)
   choco install postgresql

   # O descarga desde:
   # https://www.postgresql.org/download/windows/
   ```

3. **Crear script de backup**

   Crea un archivo `backup-supabase.bat`:

   ```batch
   @echo off
   SET BACKUP_DIR=backups
   SET DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
   SET DATE=%DATE: =0%
   SET FILENAME=%BACKUP_DIR%\supabase_backup_%DATE%.sql

   IF NOT EXIST %BACKUP_DIR% mkdir %BACKUP_DIR%

   echo Creando backup de Supabase...
   pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > %FILENAME%

   echo Backup completado: %FILENAME%
   pause
   ```

4. **Ejecutar backup**
   ```bash
   # Ejecuta el script
   backup-supabase.bat
   ```

#### Frecuencia Recomendada
- **Diario:** Si tienes muchas transacciones
- **Semanal:** Para desarrollo/testing
- **Antes de cambios importantes:** Siempre

### Opción 2: Upgrade a Plan Pro ($25/mes) ⭐ RECOMENDADO

#### Ventajas
- ✅ Backups automáticos diarios
- ✅ No requiere mantenimiento manual
- ✅ Restauración fácil desde el dashboard
- ✅ Point-in-Time Recovery (7 días)
- ✅ Más recursos (CPU, RAM, Storage)

#### Cuándo Upgradearse
- Cuando tengas clientes reales usando el sistema
- Cuando los datos sean críticos para el negocio
- Cuando no quieras preocuparte por backups manuales

### Opción 3: Backup Automatizado con GitHub Actions (Gratis)

Crear un workflow que haga backups automáticos y los suba a GitHub o cloud storage.

#### Crear archivo `.github/workflows/backup-database.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Ejecutar todos los días a las 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Permitir ejecución manual

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Install PostgreSQL Client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Create Backup
        env:
          DATABASE_URL: \${{ secrets.SUPABASE_DB_URL }}
        run: |
          BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
          pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
          gzip "$BACKUP_FILE"

      - name: Upload to Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backup-*.sql.gz
          retention-days: 30
```

#### Configurar Secrets en GitHub
1. Ve a tu repositorio → Settings → Secrets
2. Agrega `SUPABASE_DB_URL` con tu connection string

## 🔐 Seguridad de Backups

### ⚠️ IMPORTANTE
- **NUNCA** subas backups a repositorios públicos
- **NUNCA** compartas backups sin encriptar
- Los backups contienen datos sensibles de clientes

### Mejores Prácticas
1. **Encriptar backups**
   ```bash
   # Encriptar con 7-Zip
   7z a -p[PASSWORD] backup.7z backup.sql
   ```

2. **Almacenar en múltiples lugares**
   - Disco local
   - Cloud storage (Google Drive, Dropbox)
   - Servidor remoto

3. **Probar restauración periódicamente**
   - No sirve un backup si no puedes restaurarlo
   - Prueba restaurar en un proyecto de testing

## 📊 Qué Incluir en el Backup

### Tablas Críticas (Prioridad Alta)
- `companies` - Datos de empresas
- `profiles` - Usuarios
- `subscriptions` - Suscripciones activas
- `payments` - Historial de pagos
- `products` - Inventario
- `sales` - Ventas
- `customers` - Clientes
- `suppliers` - Proveedores
- `purchase_orders` - Órdenes de compra

### Tablas de Configuración
- `plans` - Planes de suscripción
- `categories` - Categorías de productos
- `company_settings` - Configuración

### Tablas de Sistema
- `invitations` - Invitaciones pendientes
- `notifications` - Notificaciones

## 🔄 Cómo Restaurar un Backup

### Desde archivo SQL
```bash
# Restaurar en proyecto de Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < backup.sql
```

### Desde Dashboard de Supabase (Plan Pro)
1. Ve a Database → Backups
2. Selecciona el backup
3. Click en "Restore"

## 📅 Calendario de Backups Recomendado

### Desarrollo
- **Manual:** Antes de cambios importantes
- **Automático:** Semanal

### Producción
- **Automático:** Diario (mínimo)
- **Manual:** Antes de deploys importantes
- **Retención:** 30 días mínimo

## 💰 Costo vs Beneficio

### Plan Free + Backups Manuales
- **Costo:** $0/mes
- **Esfuerzo:** Alto (manual)
- **Riesgo:** Medio (depende de disciplina)

### Plan Pro
- **Costo:** $25/mes
- **Esfuerzo:** Bajo (automático)
- **Riesgo:** Bajo (backups confiables)

### Recomendación
- **Desarrollo/Testing:** Plan Free + backups manuales
- **Producción con clientes:** Plan Pro (vale la pena)

## 🚨 Plan de Recuperación de Desastres

### Escenario 1: Pérdida de Datos Reciente (< 24h)
1. Usar Point-in-Time Recovery de Supabase
2. Restaurar a punto antes del problema

### Escenario 2: Pérdida de Datos Antigua (> 24h)
1. Restaurar desde último backup manual
2. Reconstruir datos faltantes manualmente

### Escenario 3: Pérdida Total del Proyecto
1. Crear nuevo proyecto en Supabase
2. Restaurar desde backup más reciente
3. Reconfigurar variables de entorno
4. Probar funcionalidad completa

## ✅ Checklist de Backup

- [ ] Decidir estrategia de backup (manual/automático/Pro)
- [ ] Configurar backups automáticos o script manual
- [ ] Probar restauración en proyecto de testing
- [ ] Documentar proceso de restauración
- [ ] Establecer calendario de backups
- [ ] Configurar alertas si falla backup automático
- [ ] Revisar backups mensualmente

## 📞 Próximos Pasos

1. **Inmediato:** Hacer un backup manual AHORA
2. **Esta semana:** Configurar backups automáticos
3. **Este mes:** Probar restauración en proyecto de testing
4. **Evaluar:** Si necesitas upgrade a Plan Pro

---

**IMPORTANTE:** Los backups son como un seguro - esperas nunca necesitarlos, pero cuando los necesitas, son invaluables.
