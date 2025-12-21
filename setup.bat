@echo off
echo =================================
echo PROGRENTURES SETUP SCRIPT
echo =================================
echo.

:: Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

:: Install Backend Dependencies
echo Installing Backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Backend installation failed
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
cd ..

:: Install Frontend Dependencies
echo.
echo Installing Frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend installation failed
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
cd ..

echo.
echo =================================
echo SETUP COMPLETE!
echo =================================
echo.
echo Next Steps:
echo 1. Configure email in backend\.env file
echo 2. Start backend: cd backend ^&^& npm start
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo 4. Open browser to: http://localhost:3000
echo.
echo Default Admin Credentials:
echo   Email: admin@progrentures.com
echo   Password: admin123
echo.
pause
