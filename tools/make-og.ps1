# Regenerates public/assets/og-image.png (the WhatsApp / Facebook link preview)
# from tools/og.html, using Microsoft Edge in headless mode.
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File tools\make-og.ps1

$root = Split-Path -Parent $PSScriptRoot
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe" }
$edgeProfile = Join-Path $env:TEMP "og-edge-profile"
$out = Join-Path $env:TEMP "og-image.png"
$jpg = Join-Path $root "public\assets\og-image.jpg"
$page = "file:///" + (((Join-Path $root "tools\og.html") -replace '\\', '/') -replace ' ', '%20')

# Paths may contain spaces, so each argument is quoted explicitly.
Start-Process -FilePath $edge -Wait -NoNewWindow -ArgumentList @(
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
  "`"--user-data-dir=$edgeProfile`"", "--force-device-scale-factor=1", "--window-size=1200,630",
  "--virtual-time-budget=8000", "`"--screenshot=$out`"", "`"$page`""
)
# WhatsApp skips previews that are too large, so save a compressed JPEG (needs ffmpeg),
# or fall back to .NET's JPEG encoder if ffmpeg isn't installed.
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
  ffmpeg -v error -y -i $out -q:v 4 $jpg
} else {
  Add-Type -AssemblyName System.Drawing
  $img = [System.Drawing.Image]::FromFile($out)
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 86L
  $img.Save($jpg, $codec, $params)
  $img.Dispose()
}
Remove-Item $out -ErrorAction SilentlyContinue
Write-Host "Saved $jpg ($([math]::Round((Get-Item $jpg).Length / 1KB)) KB)"
