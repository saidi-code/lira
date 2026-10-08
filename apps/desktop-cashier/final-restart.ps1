$ErrorActionPreference = 'SilentlyContinue'
$app = 'c:\Users\achra\OneDrive\Bureau\lyra_app\apps\desktop-cashier'

Get-CimInstance Win32_Process -Filter "Name='electron.exe'" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*electron*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Start-Sleep -Seconds 2

Remove-Item (Join-Path $app 'electron.log') -Force
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev:electron > electron.log 2>&1' `
  -WorkingDirectory $app -WindowStyle Hidden

Start-Sleep -Seconds 12
Get-Content (Join-Path $app 'electron.log') -Tail 4
Write-Host '--- CDP port 9222 should now be CLOSED ---'
$cdp = Test-NetConnection -ComputerName 127.0.0.1 -Port 9222 -WarningAction SilentlyContinue
Write-Host ("9222 open: {0}" -f $cdp.TcpTestSucceeded)
