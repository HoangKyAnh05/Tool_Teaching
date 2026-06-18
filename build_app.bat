@echo off
title Build TESOL AI Master
cd /d "%~dp0"
echo ==========================================================
echo    DONG GOI UNG DUNG TESOL AI MASTER (ELECTRON APP)
echo ==========================================================
echo.

echo [1/2] Dang kiem tra va cai dat thu vien dong goi (electron-builder)...
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [ERR] Gap loi khi cai dat thu vien.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Dang tien hanh dong goi thanh file Portable EXE...
call npm run dist
if %errorlevel% neq 0 (
    echo.
    echo [ERR] Gap loi khi dong goi ung dung.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================================
echo    DONG GOI THANH CONG!
echo    File .exe chay ngay da duoc tao trong thu muc "dist".
echo ==========================================================
echo.
explorer dist
pause
