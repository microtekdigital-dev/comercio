@echo off
REM ============================================================================
REM SCRIPT DE BACKUP MANUAL PARA SUPABASE
REM ============================================================================
REM 
REM INSTRUCCIONES:
REM 1. Instala PostgreSQL client: https://www.postgresql.org/download/windows/
REM 2. Edita este archivo y reemplaza [TU_CONNECTION_STRING] con tu connection string
REM 3. Ejecuta este script para crear un backup
REM
REM Para obtener tu connection string:
REM - Ve a Supabase Dashboard
REM - Settings → Database
REM - Copia "Connection string" (modo directo)
REM
REM ============================================================================

REM Configuración
SET BACKUP_DIR=backups
SET DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
SET DATE=%DATE: =0%
SET FILENAME=%BACKUP_DIR%\supabase_backup_%DATE%.sql

REM IMPORTANTE: Reemplaza esto con tu connection string de Supabase
REM Ejemplo: postgresql://postgres:tu_password@db.xxxxx.supabase.co:5432/postgres
SET DB_URL=[TU_CONNECTION_STRING]

REM Crear directorio de backups si no existe
IF NOT EXIST %BACKUP_DIR% (
    echo Creando directorio de backups...
    mkdir %BACKUP_DIR%
)

REM Verificar que pg_dump está instalado
where pg_dump >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: pg_dump no está instalado
    echo.
    echo Instala PostgreSQL client desde:
    echo https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

REM Verificar que se configuró la connection string
IF "%DB_URL%"=="[TU_CONNECTION_STRING]" (
    echo ERROR: Debes configurar tu connection string de Supabase
    echo.
    echo Edita este archivo y reemplaza [TU_CONNECTION_STRING]
    echo con tu connection string real.
    echo.
    echo Para obtenerla:
    echo 1. Ve a Supabase Dashboard
    echo 2. Settings → Database
    echo 3. Copia "Connection string" (modo directo)
    echo.
    pause
    exit /b 1
)

REM Crear backup
echo ============================================================================
echo CREANDO BACKUP DE SUPABASE
echo ============================================================================
echo.
echo Fecha: %DATE%
echo Archivo: %FILENAME%
echo.
echo Esto puede tomar varios minutos dependiendo del tamaño de tu base de datos...
echo.

pg_dump "%DB_URL%" > "%FILENAME%"

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================================
    echo BACKUP COMPLETADO EXITOSAMENTE
    echo ============================================================================
    echo.
    echo Archivo: %FILENAME%
    
    REM Mostrar tamaño del archivo
    FOR %%A IN ("%FILENAME%") DO (
        echo Tamaño: %%~zA bytes
    )
    
    echo.
    echo IMPORTANTE: Guarda este backup en un lugar seguro
    echo - NO lo subas a repositorios públicos
    echo - Considera encriptarlo si contiene datos sensibles
    echo - Guarda copias en múltiples ubicaciones
    echo.
) ELSE (
    echo.
    echo ============================================================================
    echo ERROR AL CREAR BACKUP
    echo ============================================================================
    echo.
    echo Verifica:
    echo - Que tu connection string sea correcta
    echo - Que tengas conexión a internet
    echo - Que tu IP esté permitida en Supabase (si tienes restricciones)
    echo.
)

pause
