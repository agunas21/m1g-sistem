@echo off
title M1G Arama Kurtarma Web Sitesi (Tasinabilir)
color 0B

echo ==================================================
echo.
echo           M1G TASINABILIR WEB SITESI
echo.
echo ==================================================
echo.
echo Lutfen bekleyin, sunucu baslatiliyor...
echo (Acilan siyah ekrani kapatmadiginiz surece site calismaya devam eder)
echo.

set PORT=3000

:: Tarayiciyi otomatik ac
start "" "http://localhost:%PORT%"

:: Tasinabilir node.exe yerine sistemdeki node ile next.js sunucusunu baslat
node "%~dp0node_modules\next\dist\bin\next" start -p %PORT%

echo.
echo Sunucu kapandi.
pause
