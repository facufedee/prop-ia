# Script de Limpieza Completa - Next.js + Firebase
# Ejecutar en PowerShell

Write-Host "🧹 Iniciando limpieza completa..." -ForegroundColor Cyan
Write-Host ""

# 1. Matar todos los procesos de Node.js
Write-Host "1️⃣  Deteniendo todos los procesos de Node.js..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null
    Write-Host "   ✅ Procesos de Node.js detenidos" -ForegroundColor Green
} catch {
    Write-Host "   ℹ️  No hay procesos de Node.js corriendo" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# 2. Eliminar carpeta .next
Write-Host ""
Write-Host "2️⃣  Eliminando carpeta .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "   ✅ Carpeta .next eliminada" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Carpeta .next no existe" -ForegroundColor Gray
}

# 3. Limpiar caché de Turbopack
Write-Host ""
Write-Host "3️⃣  Limpiando caché de Turbopack..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "   ✅ Caché de Turbopack eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Caché de Turbopack no existe" -ForegroundColor Gray
}

# 4. Limpiar caché de Next.js
Write-Host ""
Write-Host "4️⃣  Limpiando caché de Next.js..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\.next") {
    Remove-Item -Recurse -Force "$env:TEMP\.next" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Caché de Next.js eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Caché de Next.js no existe" -ForegroundColor Gray
}

# 5. Verificar puerto 3000
Write-Host ""
Write-Host "5️⃣  Verificando puerto 3000..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "   ⚠️  Puerto 3000 está ocupado por PID: $($port3000.OwningProcess)" -ForegroundColor Red
    Write-Host "   🔧 Intentando liberar puerto..." -ForegroundColor Yellow
    Stop-Process -Id $port3000.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Puerto 3000 liberado" -ForegroundColor Green
} else {
    Write-Host "   ✅ Puerto 3000 está libre" -ForegroundColor Green
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Limpieza completada exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Ejecuta: npm run dev" -ForegroundColor White
Write-Host "   2. Abre: http://localhost:3000" -ForegroundColor White
Write-Host "   3. Verifica los logs en la consola del navegador (F12)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
