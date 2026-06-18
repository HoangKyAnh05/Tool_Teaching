@echo off
title Push to GitHub - TESOL AI Master
cls
echo ==========================================================
echo    TIEN HANH PUSH CODE LEN GITHUB
echo    Repository: https://github.com/HoangKyAnh05/Tool_Teaching.git
echo ==========================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERR] May tinh cua ban chua cai dat Git. Vui long tai va cai dat Git tai: https://git-scm.com/
    pause
    exit /b
)

if not exist ".git" (
    echo [1/5] Khoi tao Git Repository cuc bo...
    git init
) else (
    echo [1/5] Git Repository da duoc khoi tao truoc do.
)

git remote remove origin >nul 2>nul
echo [2/5] Cau hinh Remote URL...
git remote add origin https://github.com/HoangKyAnh05/Tool_Teaching.git

echo [3/5] Them cac file vao khu vuc commit (Staging)...
git add .

echo [4/5] Commit code...
git commit -m "Initial commit - TESOL AI Master Framework - Hoan thien module Auto-Retry & Safe Parser"

echo.
echo [5/5] Dang day code len GitHub (main branch)...
echo.
echo * Luu y: Neu ban chua dang nhap Git, cua so dang nhap cua GitHub hoac yeu cau Personal Access Token (PAT) se hien len. Vui long hoan tat dang nhap.
echo.
git branch -M main
git push -u origin main --force

if %errorlevel% == 0 (
    echo.
    echo ==========================================================
    echo [OK] Da day code len GitHub thanh cong!
    echo Link: https://github.com/HoangKyAnh05/Tool_Teaching.git
    echo ==========================================================
) else (
    echo.
    echo [ERR] Gap loi khi push code len GitHub. Vui long kiem tra lai quyen truy cap cua tai khoan hoac Remote URL.
)

echo.
pause
