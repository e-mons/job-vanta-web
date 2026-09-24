Add-Type -AssemblyName System.Drawing

function Generate-SquareCanvas($src, $cropX, $cropY, $cropW, $cropH, $marginRatio) {
    $maxDim = [Math]::Max($cropW, $cropH)
    $margin = [int]($maxDim * $marginRatio)
    $squareSize = $maxDim + ($margin * 2)

    $canvas = New-Object System.Drawing.Bitmap($squareSize, $squareSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $destX = [int](($squareSize - $cropW) / 2)
    $destY = [int](($squareSize - $cropH) / 2)
    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $cropW, $cropH)
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    return $canvas
}

function Resize-Bitmap($canvas, $targetSize) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $g.DrawImage($canvas, 0, 0, $targetSize, $targetSize)
    $g.Dispose()
    return $bmp
}

function Convert-BitmapToDibData($bmp) {
    $w = $bmp.Width
    $h = $bmp.Height
    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)
    
    $bw.Write([uint32]40)              # biSize
    $bw.Write([int32]$w)               # biWidth
    $bw.Write([int32]($h * 2))         # biHeight (doubled for XOR + AND)
    $bw.Write([uint16]1)               # biPlanes
    $bw.Write([uint16]32)              # biBitCount
    $bw.Write([uint32]0)               # biCompression
    $bw.Write([uint32]($w * $h * 4))   # biSizeImage
    $bw.Write([int32]0)                # biXPelsPerMeter
    $bw.Write([int32]0)                # biYPelsPerMeter
    $bw.Write([uint32]0)               # biClrUsed
    $bw.Write([uint32]0)               # biClrImportant
    
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
    
    # AND mask
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

function Build-MultiResolutionIco($frames) {
    # frames is array of hashtables: @{ Width = w; Height = h; Data = byte[]; IsPng = bool }
    $count = $frames.Count
    $headerSize = 6 + ($count * 16)
    $currentOffset = $headerSize

    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)

    # ICONDIR
    $bw.Write([uint16]0)
    $bw.Write([uint16]1) # Type 1 = Icon
    $bw.Write([uint16]$count)

    # ICONDIRENTRY list
    foreach ($f in $frames) {
        $w = if ($f.Width -ge 256) { [byte]0 } else { [byte]$f.Width }
        $h = if ($f.Height -ge 256) { [byte]0 } else { [byte]$f.Height }
        $bw.Write($w)
        $bw.Write($h)
        $bw.Write([byte]0)   # colorCount
        $bw.Write([byte]0)   # reserved
        $bw.Write([uint16]1) # planes
        $bw.Write([uint16]32) # bpp
        $bw.Write([uint32]$f.Data.Length)
        $bw.Write([uint32]$currentOffset)

        $currentOffset += $f.Data.Length
    }

    # Image byte payloads
    foreach ($f in $frames) {
        $bw.Write($f.Data, 0, $f.Data.Length)
    }

    $bw.Flush()
    $icoBytes = $ms.ToArray()
    $bw.Close()
    $ms.Close()
    return $icoBytes
}

# --- Execution ---
$logoPath = "c:\Users\H-P\Desktop\jobvanta\web\public\logo.png"
$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $logoPath).Path)

# Bounding box
$minX = $src.Width; $maxX = 0; $minY = $src.Height; $maxY = 0
for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $pixel = $src.GetPixel($x, $y)
        if ($pixel.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1
Write-Output "Detected Logo Emblem visible bounds: ${cropW}x${cropH} at (${minX}, ${minY})"

# Master tight canvas for tabs (4% margin for maximum impact at small sizes)
$masterTight = Generate-SquareCanvas $src $minX $minY $cropW $cropH 0.04
# Master padded canvas for Apple Touch & Android (10% margin for rounded squircle safety)
$masterPadded = Generate-SquareCanvas $src $minX $minY $cropW $cropH 0.10

# Generate Bitmaps
$bmp16 = Resize-Bitmap $masterTight 16
$bmp32 = Resize-Bitmap $masterTight 32
$bmp48 = Resize-Bitmap $masterTight 48
$bmp64 = Resize-Bitmap $masterTight 64
$bmp128 = Resize-Bitmap $masterTight 128
$bmp256 = Resize-Bitmap $masterTight 256

$bmp180 = Resize-Bitmap $masterPadded 180
$bmp192 = Resize-Bitmap $masterPadded 192
$bmp512 = Resize-Bitmap $masterPadded 512

# Save PNGs to public
$publicDir = "c:\Users\H-P\Desktop\jobvanta\web\public"
$appDir = "c:\Users\H-P\Desktop\jobvanta\web\src\app"

$bmp16.Save((Join-Path $publicDir "favicon-16x16.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp32.Save((Join-Path $publicDir "favicon-32x32.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp32.Save((Join-Path $publicDir "favicon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp32.Save((Join-Path $appDir "icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$bmp180.Save((Join-Path $publicDir "apple-touch-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp180.Save((Join-Path $appDir "apple-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$bmp192.Save((Join-Path $publicDir "icon-192.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Save((Join-Path $publicDir "icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# Convert to ICO
function To-PngBytes($bmp) {
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $ms.ToArray()
    $ms.Close()
    return $bytes
}

$frames = @(
    @{ Width = 16; Height = 16; Data = (Convert-BitmapToDibData $bmp16) },
    @{ Width = 32; Height = 32; Data = (Convert-BitmapToDibData $bmp32) },
    @{ Width = 48; Height = 48; Data = (Convert-BitmapToDibData $bmp48) },
    @{ Width = 64; Height = 64; Data = (To-PngBytes $bmp64) },
    @{ Width = 128; Height = 128; Data = (To-PngBytes $bmp128) },
    @{ Width = 256; Height = 256; Data = (To-PngBytes $bmp256) }
)

$icoBytes = Build-MultiResolutionIco $frames
[System.IO.File]::WriteAllBytes((Join-Path $publicDir "favicon.ico"), $icoBytes)
[System.IO.File]::WriteAllBytes((Join-Path $appDir "favicon.ico"), $icoBytes)

Write-Output "Successfully built favicon.ico ($($icoBytes.Length) bytes) with 6 resolutions (16, 32, 48, 64, 128, 256)!"
Write-Output "Successfully generated all PNG assets in public and src/app!"

# Clean up
$masterTight.Dispose()
$masterPadded.Dispose()
$bmp16.Dispose()
$bmp32.Dispose()
$bmp48.Dispose()
$bmp64.Dispose()
$bmp128.Dispose()
$bmp256.Dispose()
$bmp180.Dispose()
$bmp192.Dispose()
$bmp512.Dispose()
$src.Dispose()
