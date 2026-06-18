@echo off
title Create Desktop Shortcut - TESOL AI Master
cls
echo ==========================================================
echo    DANG TAO SHORTCUT CHO TESOL AI MASTER TREN DESKTOP...
echo ==========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'TESOL AI Master.lnk')); $Shortcut.TargetPath = 'wscript.exe'; $Shortcut.Arguments = '\"%~dp0run.vbs\"'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = '%~dp0node_modules\electron\dist\electron.exe, 0'; $Shortcut.Save()"

echo [OK] Da tao shortcut "TESOL AI Master" tren Desktop cua ban!
echo.
pause
