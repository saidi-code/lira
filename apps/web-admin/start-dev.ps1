$ErrorActionPreference = "SilentlyContinue"
$dir = "c:/Users/achra/OneDrive/Bureau/lyra_app/apps/web-admin"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev > webadmin-dev.log 2>&1" -WorkingDirectory $dir -WindowStyle Hidden
"launched web-admin detached"
