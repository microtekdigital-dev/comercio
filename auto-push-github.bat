@echo off
echo ========================================
echo   ACTUALIZACION AUTOMATICA A GITHUB
echo ========================================
echo.

REM Verificar antes de subir
echo [1/4] Verificando proyecto...
node verify-before-push.js
if errorlevel 1 (
    echo.
    echo ERROR: Corrige los errores antes de continuar
    pause
    exit /b 1
)

echo.
echo [2/4] Agregando archivos...
git add .

REM Verificar si hay cambios
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo.
    echo [3/4] Creando commit automatico...
    
    REM Generar mensaje de commit automatico con fecha y hora
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
    
    git commit -m "Auto-update: %mydate% %mytime%"
    
    echo.
    echo [4/4] Subiendo a GitHub...
    git push
    
    echo.
    echo ========================================
    echo   COMPLETADO!
    echo ========================================
    echo.
    echo Cambios subidos exitosamente a GitHub
    echo Commit: Auto-update: %mydate% %mytime%
    echo.
) else (
    echo.
    echo No hay cambios para subir
    echo.
)

pause
