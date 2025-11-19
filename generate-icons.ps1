# PowerShell script to generate favicon sizes from source logo
# Requires .NET Framework (built-in on Windows)

$sourcePath = "c:\Users\HP\Desktop\chihealthmedisecure\logo-source.png"
$outputDir = "c:\Users\HP\Desktop\chihealthmedisecure\public"

# Load the source image
Add-Type -AssemblyName System.Drawing
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

Write-Host "Source image loaded: $($sourceImage.Width)x$($sourceImage.Height)" -ForegroundColor Green

# Function to resize and save image
function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutputPath
    )
    
    $destImage = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    
    # High quality settings
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    
    # Save as PNG
    $destImage.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $destImage.Dispose()
    
    Write-Host "Created: $OutputPath ($Width x $Height)" -ForegroundColor Cyan
}

# Generate all required sizes
Write-Host "`nGenerating PWA icons..." -ForegroundColor Yellow

Resize-Image -Image $sourceImage -Width 192 -Height 192 -OutputPath "$outputDir\pwa-192x192.png"
Resize-Image -Image $sourceImage -Width 512 -Height 512 -OutputPath "$outputDir\pwa-512x512.png"
Resize-Image -Image $sourceImage -Width 180 -Height 180 -OutputPath "$outputDir\apple-touch-icon.png"
Resize-Image -Image $sourceImage -Width 64 -Height 64 -OutputPath "$outputDir\favicon.png"
Resize-Image -Image $sourceImage -Width 32 -Height 32 -OutputPath "$outputDir\favicon-32x32.png"
Resize-Image -Image $sourceImage -Width 16 -Height 16 -OutputPath "$outputDir\favicon-16x16.png"

# Cleanup
$sourceImage.Dispose()

Write-Host "`nAll icons generated successfully!" -ForegroundColor Green
Write-Host "Files created in: $outputDir" -ForegroundColor Green
