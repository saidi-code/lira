$ErrorActionPreference = "SilentlyContinue"
$serverDir = "c:/Users/achra/OneDrive/Bureau/lyra_app/server"
$cashierDir = "c:/Users/achra/OneDrive/Bureau/lyra_app/apps/desktop-cashier"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm start > server-dev.log 2>&1" -WorkingDirectory $serverDir -WindowStyle Hidden
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev:vite > vite-dev.log 2>&1" -WorkingDirectory $cashierDir -WindowStyle Hidden
"launched server + vite detached"
