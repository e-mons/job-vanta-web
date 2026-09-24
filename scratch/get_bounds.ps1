Add-Type -AssemblyName System.Drawing

function Get-Bounds($path) {
    $bmp = [System.Drawing.Bitmap]::FromFile((Resolve-Path $path).Path)
    $minX = $bmp.Width; $maxX = 0; $minY = $bmp.Height; $maxY = 0
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 10) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $w = $maxX - $minX + 1
    $h = $maxY - $minY + 1
    Write-Output "$path : Total=$($bmp.Width)x$($bmp.Height), Visible bounds=X:$minX, Y:$minY, W:$w, H:$h"
    $bmp.Dispose()
}

Get-Bounds "c:\Users\H-P\Desktop\jobvanta\web\public\logo.png"
Get-Bounds "c:\Users\H-P\Desktop\jobvanta\mobile\assets\icon.png"
Get-Bounds "c:\Users\H-P\Desktop\jobvanta\mobile\assets\favicon.png"
