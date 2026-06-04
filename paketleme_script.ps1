# M1G USB Paketleme - Standalone Mode (kucuk ve hizli)
$ProjectDir = "C:\Users\gunas\.gemini\antigravity\scratch\m1g-web-app"
$StandaloneDir = "$ProjectDir\.next\standalone"
$OutputDir  = "C:\Users\gunas\.gemini\antigravity\scratch\M1G-USB"
$ZipPath    = "C:\Users\gunas\.gemini\antigravity\scratch\M1G_SitePackage.zip"

Write-Host "=== M1G Standalone Paketleme ===" -ForegroundColor Cyan

if (-not (Test-Path $StandaloneDir)) {
    Write-Host "HATA: Standalone klasoru bulunamadi: $StandaloneDir" -ForegroundColor Red
    exit 1
}

# Temizle
if (Test-Path $OutputDir) { Remove-Item -Recurse -Force $OutputDir }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path "$OutputDir\node_portable" | Out-Null

# 1. Standalone server dosyalari
Write-Host "[1/5] Standalone server kopyalaniyor..." -ForegroundColor Yellow
& robocopy $StandaloneDir $OutputDir /E /NFL /NDL /NJH /NJS /MT:8 | Out-Null

# 2. Static dosyalar (.next/static -> .next/static)
Write-Host "[2/5] Static dosyalar kopyalaniyor..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$OutputDir\.next\static" | Out-Null
& robocopy "$ProjectDir\.next\static" "$OutputDir\.next\static" /E /NFL /NDL /NJH /NJS /MT:8 | Out-Null

# 3. Public klasoru
Write-Host "[3/5] Public dosyalar kopyalaniyor..." -ForegroundColor Yellow
& robocopy "$ProjectDir\public" "$OutputDir\public" /E /NFL /NDL /NJH /NJS /MT:8 | Out-Null

# 4. src/lib (JSON verileri - veritabani)
Write-Host "[4/5] Veritabani JSON dosyalari kopyalaniyor..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$OutputDir\src\lib" | Out-Null
& robocopy "$ProjectDir\src\lib" "$OutputDir\src\lib" /E /NFL /NDL /NJH /NJS /MT:8 | Out-Null

# .env
if (Test-Path "$ProjectDir\.env") { Copy-Item "$ProjectDir\.env" "$OutputDir\.env" -Force }

# 5. Portable node.exe
Write-Host "[5/5] Node.exe kopyalaniyor..." -ForegroundColor Yellow
Copy-Item "$ProjectDir\node.exe" "$OutputDir\node_portable\node.exe" -Force

# Baslat.bat
$encoding = New-Object System.Text.UTF8Encoding($false)
$batContent = @'
@echo off
title M1G Yonetim Sistemi
chcp 65001 > nul
color 0A
setlocal

set "SCRIPT_DIR=%~dp0"
set "NODE_EXE=%SCRIPT_DIR%node_portable\node.exe"

echo.
echo  ============================================
echo   M1G ARAMA KURTARMA - YONETIM SISTEMI
echo  ============================================
echo.
echo  Lutfen bu pencereyi KAPATMAYIN!
echo.

if not exist "%NODE_EXE%" (
    echo [HATA] node.exe bulunamadi: %NODE_EXE%
    pause & exit /b 1
)

if not exist "%SCRIPT_DIR%server.js" (
    echo [HATA] server.js bulunamadi!
    echo Bu klasor eksik gorunuyor. ZIP'i tekrar acin.
    pause & exit /b 1
)

if not exist "%SCRIPT_DIR%.env" (
    echo SESSION_SECRET=m1g_local_secret_2024_xk92pq> "%SCRIPT_DIR%.env"
)

cd /d "%SCRIPT_DIR%"
set PORT=3000
set HOSTNAME=0.0.0.0
set NODE_ENV=production

echo  Sunucu baslatiliyor...
echo  Hazir olunca tarayicinizda acin: http://localhost:3000
echo  Admin paneli: http://localhost:3000/admin
echo.

"%NODE_EXE%" server.js

echo.
echo  Sunucu kapandi. Kapatmak icin herhangi bir tusa basin.
pause
'@
[System.IO.File]::WriteAllText("$OutputDir\Baslat.bat", $batContent, $encoding)

$readmeContent = @'
M1G YONETIM SISTEMI - KULLANIM KILAVUZU
=========================================

NASIL CALISTIRILIR?
1. Bu klasoru USB'den masaustune KOPYALAYIN
2. "Baslat.bat" dosyasina cift tiklayin
3. Siyah pencere acilir - KAPATMAYIN
4. Tarayicinizda: http://localhost:3000

GIRIS
Admin paneli : http://localhost:3000/admin
Kullanici adi ve sifrenizle giris yapin.

NOTLAR
- Node.js kurmaya gerek YOK (paket icinde mevcut)
- Internet GEREKMEZ
- Kapatmak icin siyah pencereyi kapatin

SORUN GIDERME
- "Erisim engellendi": Sag tik > Yonetici olarak calistir
- Port 3000 mesgulse: Baslat.bat icinde PORT=3000 -> PORT=3001 yapin
=========================================
'@
[System.IO.File]::WriteAllText("$OutputDir\BENI_OKU.txt", $readmeContent, $encoding)

# Boyutu goster
$folderSizeMB = [math]::Round((Get-ChildItem $OutputDir -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 0)
Write-Host ""
Write-Host "Klasor boyutu: ${folderSizeMB} MB" -ForegroundColor Gray

# ZIP
Write-Host "ZIP olusturuluyor..." -ForegroundColor Yellow
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$sevenZip = "C:\Program Files\7-Zip\7z.exe"
if (Test-Path $sevenZip) {
    & $sevenZip a -tzip -mx=5 $ZipPath "$OutputDir\*" | Select-Object -Last 5
} else {
    Compress-Archive -Path "$OutputDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal
}

if (Test-Path $ZipPath) {
    $zipSizeMB = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host " TAMAMLANDI!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host " ZIP: $ZipPath" -ForegroundColor Cyan
    Write-Host " Boyut: ${zipSizeMB} MB" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host "ZIP olusturulamadi! Dogrudan kullanin:" -ForegroundColor Red
    Write-Host $OutputDir -ForegroundColor Yellow
}
