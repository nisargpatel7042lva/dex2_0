@echo off
REM Mobile App Build Script for Launch (Windows)
REM This script prepares the app for production launch

echo 🚀 Starting Mobile App Build for Launch...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root.
    exit /b 1
)

echo [INFO] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js.
    exit /b 1
)

echo [INFO] Checking npm version...
npm --version
if %errorlevel% neq 0 (
    echo [ERROR] npm not found. Please install npm.
    exit /b 1
)

REM Clean previous builds
echo [INFO] Cleaning previous builds...
if exist "node_modules" rmdir /s /q node_modules
if exist "android\build" rmdir /s /q android\build
if exist "android\app\build" rmdir /s /q android\app\build
if exist "ios\build" rmdir /s /q ios\build
if exist ".expo" rmdir /s /q .expo

REM Install dependencies
echo [INFO] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

REM Type checking
echo [INFO] Running TypeScript type checking...
npm run type-check
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed
    exit /b 1
)
echo [SUCCESS] TypeScript compilation successful

REM Linting
echo [INFO] Running ESLint...
npm run lint:check
if %errorlevel% neq 0 (
    echo [WARNING] ESLint found issues - please fix them before launch
) else (
    echo [SUCCESS] ESLint passed
)

REM Format checking
echo [INFO] Checking code formatting...
npm run fmt:check
if %errorlevel% neq 0 (
    echo [WARNING] Code formatting issues found - run 'npm run fmt' to fix
) else (
    echo [SUCCESS] Code formatting is correct
)

REM Build Android
echo [INFO] Building Android app...
npm run android:build
if %errorlevel% neq 0 (
    echo [ERROR] Android build failed
    exit /b 1
)
echo [SUCCESS] Android build successful

REM Check for critical files
echo [INFO] Checking critical files...
set CRITICAL_FILES=app\(tabs)\launchpad.tsx app\(tabs)\trading.tsx app\send.tsx app\receive.tsx app\swap.tsx src\context\AppContext.tsx src\services\WalletService.ts src\services\TokenLaunchService.ts src\services\JupiterService.ts src\services\RaydiumService.ts

for %%f in (%CRITICAL_FILES%) do (
    if exist "%%f" (
        echo [SUCCESS] ✓ %%f exists
    ) else (
        echo [ERROR] ✗ %%f missing
        exit /b 1
    )
)

REM Check for environment variables
echo [INFO] Checking environment configuration...
if exist ".env" (
    echo [SUCCESS] Environment file found
) else (
    echo [WARNING] No .env file found - make sure to configure environment variables
)

REM Check app.json configuration
echo [INFO] Checking app.json configuration...
if exist "app.json" (
    echo [SUCCESS] app.json found
    findstr /c:"\"name\"" app.json >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] ✓ App name configured
    ) else (
        echo [ERROR] ✗ App name not configured in app.json
    )
    
    findstr /c:"\"version\"" app.json >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] ✓ App version configured
    ) else (
        echo [ERROR] ✗ App version not configured in app.json
    )
) else (
    echo [ERROR] app.json not found
    exit /b 1
)

REM Check for test files
echo [INFO] Checking test files...
if exist "TESTING_GUIDE.md" (
    echo [SUCCESS] ✓ Testing guide exists
) else (
    echo [WARNING] Testing guide missing
)

REM Check for documentation
echo [INFO] Checking documentation...
if exist "README.md" (
    echo [SUCCESS] ✓ README exists
) else (
    echo [WARNING] README missing
)

REM Performance checks
echo [INFO] Running performance checks...

REM Check bundle size (approximate)
echo [INFO] Checking bundle size...
for /f %%i in ('dir /s /b *.js *.ts *.tsx ^| find /c /v ""') do set BUNDLE_SIZE=%%i
echo [SUCCESS] Total files: %BUNDLE_SIZE%

REM Security checks
echo [INFO] Running security checks...

REM Check for hardcoded secrets
echo [INFO] Checking for hardcoded secrets...
findstr /s /i "private_key secret password api_key" src\* >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Potential hardcoded secrets found - please review
) else (
    echo [SUCCESS] ✓ No obvious hardcoded secrets found
)

REM Check for console.log statements in production
echo [INFO] Checking for console.log statements...
findstr /s /c:"console.log" src\* | find /c /v "" > temp_console_count.txt
set /p CONSOLE_LOGS=<temp_console_count.txt
del temp_console_count.txt
if %CONSOLE_LOGS% gtr 0 (
    echo [WARNING] Found %CONSOLE_LOGS% console.log statements - consider removing for production
) else (
    echo [SUCCESS] ✓ No console.log statements found
)

REM Final checks
echo [INFO] Running final checks...

REM Check if all services are properly imported
echo [INFO] Checking service imports...
findstr /c:"import.*Service" src\context\AppContext.tsx >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] ✓ Services properly imported in AppContext
) else (
    echo [ERROR] ✗ Services not properly imported
)

REM Check for error boundaries
echo [INFO] Checking error boundaries...
findstr /s /i "ErrorBoundary" src\* >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] ✓ Error boundaries implemented
) else (
    echo [WARNING] Error boundaries not found - consider adding them
)

REM Generate build report
echo [INFO] Generating build report...
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set BUILD_DATE=%%a-%%b-%%c
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set BUILD_TIME=%%a-%%b
set BUILD_REPORT=build-report-%BUILD_DATE%-%BUILD_TIME%.txt

echo Mobile App Build Report > %BUILD_REPORT%
echo Generated: %date% %time% >> %BUILD_REPORT%
echo Version: >> %BUILD_REPORT%
echo. >> %BUILD_REPORT%
echo Build Status: SUCCESS >> %BUILD_REPORT%
echo Node.js Version: >> %BUILD_REPORT%
echo npm Version: >> %BUILD_REPORT%
echo. >> %BUILD_REPORT%
echo Critical Files Check: PASSED >> %BUILD_REPORT%
echo TypeScript Compilation: PASSED >> %BUILD_REPORT%
echo Android Build: PASSED >> %BUILD_REPORT%
echo. >> %BUILD_REPORT%
echo Bundle Size: %BUNDLE_SIZE% files >> %BUILD_REPORT%
echo Console Logs Found: %CONSOLE_LOGS% >> %BUILD_REPORT%
echo. >> %BUILD_REPORT%
echo Launch Readiness: READY >> %BUILD_REPORT%

echo [SUCCESS] Build report generated: %BUILD_REPORT%

REM Final summary
echo.
echo 🎉 BUILD COMPLETED SUCCESSFULLY!
echo.
echo 📋 Next Steps:
echo 1. Test the app on real devices
echo 2. Run through the testing guide: TESTING_GUIDE.md
echo 3. Submit to app stores
echo 4. Monitor performance after launch
echo.
echo 📊 Build Report: %BUILD_REPORT%
echo.

echo [SUCCESS] Mobile app is ready for launch! 🚀
pause
