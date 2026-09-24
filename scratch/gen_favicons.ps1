Add-Type -AssemblyName System.Drawing

function Create-FaviconSet {
    param(
        [string]$SourcePath,
        [string]$OutputDir
    )

    $src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $SourcePath).Path)

    # Find tight bounding box of visible pixels
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
    Write-Output "Cropped bounds: $cropW x $cropH (from $minX, $minY)"

    # Create a square cropped master with slight margin
    $maxDim = [Math]::Max($cropW, $cropH)
    # Master size: make maxDim fit with 6% margin
    $margin = [int]($maxDim * 0.05)
    $squareSize = $maxDim + ($margin * 2)

    $master = New-Object System.Drawing.Bitmap($squareSize, $squareSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gMaster = [System.Drawing.Graphics]::FromImage($master)
    $gMaster.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gMaster.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gMaster.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gMaster.Clear([System.Drawing.Color]::Transparent)

    $destX = [int](($squareSize - $cropW) / 2)
    $destY = [int](($squareSize - $cropH) / 2)
    $srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $cropW, $cropH)
    $gMaster.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $gMaster.Dispose()

    # Sizes to generate:
    # 16, 32, 48, 64, 180 (apple-touch-icon), 192 (android chrome), 512 (splash/pwa)
    $sizes = @(16, 32, 48, 64, 180, 192, 512)
    $generatedPngs = @{}

    foreach ($size in $sizes) {
        $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)

        $g.DrawImage($master, 0, 0, $size, $size)
        $g.Dispose()

        $filePath = Join-Path $OutputDir "favicon-$size.png"
        $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
        $generatedPngs[$size] = $filePath
        $bmp.Dispose()
        Write-Output "Generated $filePath"
    }

    $master.Dispose()
    $src.Dispose()
}

$out = "c:\Users\H-P\Desktop\jobvanta\web\scratch"
Create-FaviconSet -SourcePath "c:\Users\H-P\Desktop\jobvanta\web\public\logo.png" -OutputDir $out
