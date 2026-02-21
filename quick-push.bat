@echo off
REM Script ultra-rapido para subir cambios a GitHub
REM Sin verificaciones ni pausas

git add .
git diff-index --quiet HEAD --
if errorlevel 1 (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
    git commit -m "Quick update: %mydate% %mytime%"
    git push
    echo Cambios subidos a GitHub
) else (
    echo No hay cambios
)
