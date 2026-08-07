Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\morinatsu\projects\FeedEater\build\icon.png"
$appxDir = "c:\Users\morinatsu\projects\FeedEater\build\appx"

if (-not (Test-Path $appxDir)) {
    New-Item -ItemType Directory -Path $appxDir | Out-Null
}

$srcImage = [System.Drawing.Image]::FromFile($srcPath)

function Resize-SquareImage ($targetSize, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImage, 0, 0, $targetSize, $targetSize)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outPath"
}

function Resize-RectImage ($width, $height, $iconSize, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $x = [int](($width - $iconSize) / 2)
    $y = [int](($height - $iconSize) / 2)
    $g.DrawImage($srcImage, $x, $y, $iconSize, $iconSize)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outPath"
}

# Generate AppX required assets
Resize-SquareImage 44 "$appxDir\Square44x44Logo.png"
Resize-SquareImage 150 "$appxDir\Square150x150Logo.png"
Resize-SquareImage 310 "$appxDir\Square310x310Logo.png"
Resize-SquareImage 50 "$appxDir\StoreLogo.png"
Resize-RectImage 310 150 120 "$appxDir\Wide310x150Logo.png"
Resize-RectImage 620 300 200 "$appxDir\SplashScreen.png"

$srcImage.Dispose()
Write-Host "All AppX Visual Assets generated successfully!"
