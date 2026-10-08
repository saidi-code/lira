Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinCapX {
  [DllImport("user32.dll")] public static extern IntPtr FindWindowX(string lpClassName, string lpWindowName);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, int nFlags);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@
$hwnd = [WinCapX]::FindWindowX($null, "Lira Cashier")
if ($hwnd -eq [IntPtr]::Zero) {
  Write-Host "WINDOW-NOT-FOUND. Trying partial match..."
  Get-Process electron -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "electron pid:" $_.Id "title:" $_.MainWindowTitle }
  exit 1
}
[void][WinCapX]::SetForegroundWindow($hwnd)
Start-Sleep -Milliseconds 800
$rect = New-Object WinCap+RECT
[void][WinCapX]::GetWindowRect($hwnd, [ref]$rect)
$w = $rect.Right - $rect.Left; $h = $rect.Bottom - $rect.Top
Write-Host "rect: $w x $h"
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $gfx.GetHdc()
[void][WinCapX]::PrintWindow($hwnd, $hdc, 0)
$gfx.ReleaseHdc($hdc)
$gfx.Dispose()
$out = "c:\Users\achra\OneDrive\Bureau\lyra_app\apps\desktop-cashier\screen.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "saved: $out"
