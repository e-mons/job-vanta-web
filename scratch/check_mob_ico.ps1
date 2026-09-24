Add-Type -AssemblyName System.Drawing

$ico = New-Object System.Drawing.Icon((Resolve-Path "c:\Users\H-P\Desktop\jobvanta\mobile\assets\favicon.ico").Path, 32, 32)
$bmp = $ico.ToBitmap()
$cMid = $bmp.GetPixel(16, 16)
Write-Output "mobile favicon.ico: $($bmp.Width)x$($bmp.Height) mid=A:$($cMid.A),R:$($cMid.R),G:$($cMid.G),B:$($cMid.B)"
$bmp.Save("c:\Users\H-P\Desktop\jobvanta\web\scratch\mob_ico_32.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$ico.Dispose()
