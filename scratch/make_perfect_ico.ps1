Add-Type -AssemblyName System.Drawing

function Convert-BitmapToIcoData($bmp) {
    $w = $bmp.Width
    $h = $bmp.Height
    
    # 40-byte header
    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)
    
    $bw.Write([uint32]40)          # biSize
    $bw.Write([int32]$w)           # biWidth
    $bw.Write([int32]($h * 2))     # biHeight (doubled for XOR + AND)
    $bw.Write([uint16]1)           # biPlanes
    $bw.Write([uint16]32)          # biBitCount
    $bw.Write([uint32]0)           # biCompression (BI_RGB)
    $bw.Write([uint32]($w * $h * 4)) # biSizeImage
    $bw.Write([int32]0)            # biXPelsPerMeter
    $bw.Write([int32]0)            # biYPelsPerMeter
    $bw.Write([uint32]0)           # biClrUsed
    $bw.Write([uint32]0)           # biClrImportant
    
    # Bottom-up BGRA
    for ($y = $h - 1; $y -ge 0; $y--) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $bmp.GetPixel($x, $y)
            $bw.Write([byte]$p.B)
            $bw.Write([byte]$p.G)
            $bw.Write([byte]$p.R)
            $bw.Write([byte]$p.A)
        }
    }
    
    # AND mask (1 bit per pixel, rows aligned to 4 bytes)
    $rowBytes = [int][Math]::Ceiling($w / 32.0) * 4
    $andRow = New-Object byte[] $rowBytes
    for ($y = 0; $y -lt $h; $y++) {
        $bw.Write($andRow, 0, $rowBytes)
    }
    
    $bw.Flush()
    $data = $ms.ToArray()
    $bw.Close()
    $ms.Close()
    return $data
}

$bmp16 = [System.Drawing.Bitmap]::FromFile((Resolve-Path "c:\Users\H-P\Desktop\jobvanta\web\scratch\favicon-16.png").Path)
$bmp32 = [System.Drawing.Bitmap]::FromFile((Resolve-Path "c:\Users\H-P\Desktop\jobvanta\web\scratch\favicon-32.png").Path)
$bmp48 = [System.Drawing.Bitmap]::FromFile((Resolve-Path "c:\Users\H-P\Desktop\jobvanta\web\scratch\favicon-48.png").Path)

$d16 = Convert-BitmapToIcoData $bmp16
$d32 = Convert-BitmapToIcoData $bmp32
$d48 = Convert-BitmapToIcoData $bmp48

# Also include PNG for 64 and 256
$d64 = [System.IO.File]::ReadAllBytes((Resolve-Path "c:\Users\H-P\Desktop\jobvanta\web\scratch\favicon-64.png").Path)
$d256 = [System.IO.File]::ReadAllBytes((Resolve-Path "c:\Users\H-P\Desktop\jobvanta\web\scratch\favicon-512.png").Path) # or resize 256

Write-Output "D16 size=$($d16.Length) D32 size=$($d32.Length) D48 size=$($d48.Length)"
$bmp16.Dispose(); $bmp32.Dispose(); $bmp48.Dispose()
