$ErrorActionPreference = "SilentlyContinue"
$job = Start-Job -Name lira-server -ScriptBlock {
  Set-Location "c:/Users/achra/OneDrive/Bureau/lyra_app/server"
  npm start 2>&1
}
"server job id: $($job.Id)"

