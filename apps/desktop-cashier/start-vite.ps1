$ErrorActionPreference = "SilentlyContinue"
Start-Job -Name lira-vite -ScriptBlock {
  Set-Location "c:/Users/achra/OneDrive/Bureau/lyra_app/apps/desktop-cashier"
  npm run dev:vite 2>&1 | Out-File "c:/Users/achra/OneDrive/Bureau/lyra_app/apps/desktop-cashier/vite.log" -Append
} | Out-Null
"vite job started"
