Add-Type -AssemblyName System.Drawing

function Inspect-Img($path) {
    if (Test-Path $path) {
        $img = [System.Drawing.Bitmap]::FromFile((Resolve-Path $path).Path)
        $c00 = $img.GetPixel(0,0)
        $cMid = $img.GetPixel([int]($img.Width/2), [int]($img.Height/2))
        Write-Output "$path : $($img.Width)x$($img.Height) format=$($img.PixelFormat) c(0,0)=A:$($c00.A),R:$($c00.R),G:$($c00.G),B:$($c00.B) mid=A:$($cMid.A),R:$($cMid.R),G:$($cMid.G),B:$($cMid.B)"
        $img.Dispose()
    } else {
        Write-Output "$path NOT FOUND"
    }
}

Inspect-Img "c:\Users\H-P\Desktop\jobvanta\web\public\logo.png"
Inspect-Img "c:\Users\H-P\Desktop\jobvanta\mobile\assets\icon.png"
Inspect-Img "c:\Users\H-P\Desktop\jobvanta\mobile\assets\favicon.png"
Inspect-Img "c:\Users\H-P\Desktop\jobvanta\mobile\assets\adaptive-icon.png"
