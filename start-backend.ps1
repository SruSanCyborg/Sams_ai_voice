# Quick backend start script
Set-Location $PSScriptRoot\apps\backend
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}
Write-Host "Starting ECHO-3D backend on http://localhost:8000 ..." -ForegroundColor Cyan
uvicorn main:app --reload --host 0.0.0.0 --port 8000
