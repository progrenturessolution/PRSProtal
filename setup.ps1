# Progrentures Internship Management System
# Automated Setup Script for Windows PowerShell

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "PROGRENTURES SETUP SCRIPT" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is NOT installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is installed or running
Write-Host "Checking MongoDB installation..." -ForegroundColor Yellow
try {
    $mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    if ($mongoService) {
        Write-Host "MongoDB service found: $($mongoService.Status)" -ForegroundColor Green
        if ($mongoService.Status -ne 'Running') {
            Write-Host "  Starting MongoDB service..." -ForegroundColor Yellow
            Start-Service MongoDB
            Write-Host "MongoDB service started" -ForegroundColor Green
        }
    } else {
        Write-Host "MongoDB service not found" -ForegroundColor Yellow
        Write-Host "  Please ensure MongoDB is installed or running manually" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not check MongoDB status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "INSTALLING DEPENDENCIES" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Install Backend Dependencies
Write-Host "Installing Backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Backend installation failed" -ForegroundColor Red
    exit 1
}

# Go back to root
Set-Location ..

# Install Frontend Dependencies
Write-Host ""
Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Frontend installation failed" -ForegroundColor Red
    exit 1
}

# Go back to root
Set-Location ..

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure email in backend/.env file" -ForegroundColor White
Write-Host "   - Set EMAIL_USER to your Gmail address" -ForegroundColor White
Write-Host "   - Set EMAIL_PASS to your Gmail app password" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. In a new terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Open browser to: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Default Admin Credentials:" -ForegroundColor Yellow
Write-Host "  Email: admin@progrentures.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see QUICKSTART.md" -ForegroundColor Green
Write-Host ""
