# Script to verify .env.local configuration
# This will check if your Firebase environment variables are properly set

Write-Host "`n🔍 Checking .env.local configuration..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create it using the env.template file" -ForegroundColor Yellow
    exit 1
}

$requiredVars = @(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

$content = Get-Content $envFile -Raw
$allGood = $true

Write-Host "`nChecking required variables:" -ForegroundColor Cyan

foreach ($var in $requiredVars) {
    if ($content -match "$var\s*=\s*(.+)") {
        $value = $matches[1].Trim()
        if ($value -and $value -ne "") {
            Write-Host "  ✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $var is EMPTY" -ForegroundColor Red
            $allGood = $false
        }
    } else {
        Write-Host "  ❌ $var is MISSING" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray

if ($allGood) {
    Write-Host "✅ All required variables are configured!" -ForegroundColor Green
    Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Stop the current dev server (Ctrl+C in the terminal)" -ForegroundColor White
    Write-Host "  2. Delete the .next folder: Remove-Item -Recurse -Force .next" -ForegroundColor White
    Write-Host "  3. Start the dev server again: npm run dev" -ForegroundColor White
} else {
    Write-Host "❌ Some variables are missing or empty!" -ForegroundColor Red
    Write-Host "`n📝 To fix this:" -ForegroundColor Cyan
    Write-Host "  1. Open .env.local in your editor" -ForegroundColor White
    Write-Host "  2. Fill in the missing/empty values from Firebase Console" -ForegroundColor White
    Write-Host "  3. Go to: https://console.firebase.google.com" -ForegroundColor White
    Write-Host "  4. Select your project → Project Settings → Your apps" -ForegroundColor White
    Write-Host "  5. Copy the firebaseConfig values" -ForegroundColor White
}

Write-Host ""
