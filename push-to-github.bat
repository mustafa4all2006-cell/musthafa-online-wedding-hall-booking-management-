@echo off
title Push Musthafa Wedding Hall Booking to GitHub
echo =====================================================================
echo  Pushing project to GitHub: mustafa4all2006-cell/wedding-hall-booking
echo =====================================================================
echo.
echo 1. Ensure you created the repository on GitHub:
echo    https://github.com/new  (Repository name: wedding-hall-booking)
echo.
git branch -M main
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo =====================================================================
    echo  SUCCESS! Project uploaded to GitHub!
    echo  Link: https://github.com/mustafa4all2006-cell/wedding-hall-booking
    echo =====================================================================
) else (
    echo =====================================================================
    echo  Push failed. If repo doesn't exist, create it at:
    echo  https://github.com/new with name "wedding-hall-booking"
    echo =====================================================================
)
pause
