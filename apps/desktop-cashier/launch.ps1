Start-Process -FilePath "npx" -ArgumentList "electron", "." -WorkingDirectory "c:/Users/achra/OneDrive/Bureau/lyra_app/apps/desktop-cashier" -WindowStyle Hidden
Start-Sleep -Seconds 12
Get-Process electron -ErrorAction SilentlyContinue | Select-Object Id, MainWindowTitle | Format-Table -AutoSize | Out-String -Width 200
