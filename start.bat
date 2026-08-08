@echo off
setlocal
title Siolownia Tracker
echo ============================================
echo   SI LOWNIA TRACKER - serwer lokalny
echo ============================================
echo.
echo  Adres IP tego komputera w sieci (szukaj 192.168...):
ipconfig | findstr /R /C:"IPv4"
echo.
echo  1) Otworz na TYM komputerze w przegladarce:
echo     http://localhost:8000
echo     (otworzy sie automatycznie za chwile)
echo.
echo  2) Na TELEFONIE (ta sama siec WiFi):
echo     otworz w przegladarce adres  http://ADRES-IP:8000
echo     gdzie ADRES-IP to numer z linijki powyzej.
echo.
echo  Po otwarciu na telefonie: menu przegladarki
echo    -^> "Dodaj do ekranu glownego"  = jak aplikacja.
echo  Dziala tez bez internetu (offline).
echo.
echo  Zamykanie serwera: Ctrl+C w tym oknie.
echo ============================================
echo.
start "" cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:8000"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
echo.
echo  Serwer zostal zatrzymany. To okno mozesz zamknac.
pause
