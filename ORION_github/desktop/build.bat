@echo off
chcp 65001 >nul
echo.
echo  O.R.I.O.N. — Build EXE
echo  ======================
echo.

:: Instalar dependencias si faltan
pip install pywebview pyinstaller --user --quiet

:: Construir
echo [BUILD] Empaquetando con PyInstaller...
cd /d "%~dp0"
pyinstaller orion.spec --clean --noconfirm

if errorlevel 1 (
    echo [ERROR] Build fallido.
    pause & exit
)

echo.
echo [OK] EXE generado en: dist\ORION\ORION.exe
echo      Copia la carpeta dist\ORION\ donde quieras y ejecuta ORION.exe
echo.
pause
