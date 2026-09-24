Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path "c:\Users\H-P\Desktop\jobvanta\web\public\logo.png").Path)

Write-Output "Visible top-left (65, 58): $($bmp.GetPixel(65, 58))"
Write-Output "Visible mid-left (65, 248): $($bmp.GetPixel(65, 248))"
Write-Output "Visible center (251, 248): $($bmp.GetPixel(251, 248))"
Write-Output "Visible bottom-right (437, 437): $($bmp.GetPixel(437, 437))"
Write-Output "Visible top-center (251, 58): $($bmp.GetPixel(251, 58))"

$bmp.Dispose()
