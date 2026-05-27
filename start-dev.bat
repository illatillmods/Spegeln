@echo off
setlocal
cd /d "%~dp0"

if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    set "line=%%A"
    if not "!line:~0,1!"=="#" (
      set "%%A"
    )
  )
)

echo Starting Spegeln dev stack...
echo   Backend  - http://127.0.0.1:4000
echo   Frontend - http://localhost:3000
echo   AI worker- http://localhost:8001
echo Close each window to stop that service.
echo.

start "Spegeln Backend" cmd /k "npm run backend:dev"
start "Spegeln AI Worker" cmd /k "npm run ai:worker:dev"
start "Spegeln Frontend" cmd /k "npm run dev"

endlocal
