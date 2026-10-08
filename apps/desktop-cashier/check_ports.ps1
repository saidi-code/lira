$ErrorActionPreference = "SilentlyContinue"
$conns = Get-NetTCPConnection -State Listen
foreach ($c in $conns) {
  if ($c.LocalPort -eq 3000 -or $c.LocalPort -eq 3449) {
    "{0}:{1} pid={2}" -f $c.LocalAddress, $c.LocalPort, $c.OwningProcess
  }
}
"done"
