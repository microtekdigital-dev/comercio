@echo off
echo ========================================
echo   SUBIR PROYECTO A GITHUB
echo ========================================
echo.

REM Verificar antes de subir
echo [1/5] Verificando proyecto...
node verify-before-push.js
if errorlevel 1 (
    echo.
    echo ERROR: Corrige los errores antes de continuar
    pause
    exit /b 1
)

echo.
echo [2/5] Agregando archivos...
git add .

echo.
echo [3/5] Creando commit...
set /p commit_msg="Ingresa el mensaje del commit: "
git commit -m "%commit_msg%"

echo.
echo [4/5] Configurando repositorio remoto...
set /p repo_url="Ingresa la URL de tu repositorio (ej: https://github.com/usuario/repo.git): "
git remote add origin %repo_url% 2>nul
if errorlevel 1 (
    echo Repositorio remoto ya existe, actualizando...
    git remote set-url origin %repo_url%
)

echo.
echo [5/5] Subiendo a GitHub...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo   COMPLETADO!
echo ========================================
echo.
echo Tu proyecto esta ahora en GitHub!
echo Proximos pasos:
echo   1. Ve a tu repositorio en GitHub
echo   2. Verifica que todo este correcto
echo   3. Sigue DEPLOYMENT.md para desplegar en Vercel
echo.
pause
