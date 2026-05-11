# ECHO-3D Setup Script for Windows
# Run from the echo-3d root directory: .\setup.ps1

Write-Host "=== ECHO-3D Setup ===" -ForegroundColor Cyan

# 1. Copy env files
if (-not (Test-Path "apps\web\.env.local")) {
    Copy-Item "apps\web\.env.local.example" "apps\web\.env.local"
    Write-Host "[OK] Created apps/web/.env.local" -ForegroundColor Green
}
if (-not (Test-Path "apps\backend\.env")) {
    Copy-Item "apps\backend\.env.example" "apps\backend\.env"
    Write-Host "[OK] Created apps/backend/.env" -ForegroundColor Green
}

# 2. Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
Set-Location apps\web
npm install
Set-Location ..\..

# 3. Install Python dependencies
Write-Host "`nInstalling backend dependencies..." -ForegroundColor Yellow
Set-Location apps\backend
python -m pip install -r requirements.txt
Set-Location ..\..

# 4. Build Rust WASM (requires Rust + wasm-pack)
$wasmPackExists = Get-Command wasm-pack -ErrorAction SilentlyContinue
if ($wasmPackExists) {
    Write-Host "`nBuilding Rust WASM crate..." -ForegroundColor Yellow
    Set-Location packages\echo3d-dsp
    wasm-pack build --target web --out-dir ..\..\apps\web\public\wasm
    Set-Location ..\..
    Write-Host "[OK] WASM built to apps/web/public/wasm/" -ForegroundColor Green
} else {
    Write-Host "[SKIP] wasm-pack not found. Install Rust then run: cargo install wasm-pack" -ForegroundColor Yellow
    Write-Host "       Then run: cd packages\echo3d-dsp && wasm-pack build --target web --out-dir ..\..\apps\web\public\wasm" -ForegroundColor Yellow
}

# 5. Start Docker services
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerExists) {
    Write-Host "`nStarting Redis + LiveKit via Docker..." -ForegroundColor Yellow
    docker compose up -d
    Write-Host "[OK] Redis on :6379 | LiveKit on :7880" -ForegroundColor Green
} else {
    Write-Host "[SKIP] Docker not found. Install Docker Desktop and run: docker compose up -d" -ForegroundColor Yellow
}

Write-Host "`n=== Setup complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the backend:" -ForegroundColor White
Write-Host "  cd apps\backend && uvicorn main:app --reload --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "To start the frontend:" -ForegroundColor White
Write-Host "  cd apps\web && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Open: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Wear headphones for spatial audio!" -ForegroundColor Magenta
