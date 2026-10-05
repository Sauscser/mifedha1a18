# Generates launcher, adaptive, web, and Play Store PNG assets from the NiSenti logo.
param(
    [string]$SourceDir = "assets/branding",
    [string]$OutDir = "assets/android"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$SourceDir = Join-Path $repoRoot $SourceDir
$OutDir = Join-Path $repoRoot $OutDir
$logo = Join-Path $SourceDir 'nisenti_playstore_512.png'
$foreground = Join-Path $SourceDir 'nisenti_foreground.png'
$adaptiveForeground = Join-Path $SourceDir 'nisenti_foreground_adaptive.png'

foreach ($path in @($logo, $foreground)) {
    if (-not (Test-Path $path)) { throw "Required NiSenti icon source not found: $path" }
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
Add-Type -AssemblyName System.Drawing

function Write-ResizedPng {
    param(
        [string]$SourcePath,
        [string]$OutputPath,
        [int]$Size,
        [double]$Scale = 1.0
    )

    $sourceImage = [System.Drawing.Image]::FromFile($SourcePath)
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $drawSize = [int][Math]::Round($Size * $Scale)
        $offset = [int][Math]::Floor(($Size - $drawSize) / 2)
        $graphics.DrawImage($sourceImage, $offset, $offset, $drawSize, $drawSize)
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $graphics.Dispose()
        $bitmap.Dispose()
        $sourceImage.Dispose()
    }
}

$map = @{
    'icon-48.png' = 48
    'icon-72.png' = 72
    'icon-96.png' = 96
    'icon-144.png' = 144
    'icon-192.png' = 192
    'icon-512.png' = 512
}

foreach ($k in $map.Keys) {
    $size = $map[$k]
    $out = Join-Path $OutDir $k
    Write-ResizedPng -SourcePath $logo -OutputPath $out -Size $size
    Write-Host "Wrote $out"
}

Write-ResizedPng -SourcePath $logo -OutputPath (Join-Path $SourceDir 'nisenti_playstore_1024.png') -Size 1024
Write-ResizedPng -SourcePath $foreground -OutputPath $adaptiveForeground -Size 512 -Scale 0.72
Write-ResizedPng -SourcePath $logo -OutputPath (Join-Path $repoRoot 'assets/favicon.png') -Size 48
Write-Host "Wrote $adaptiveForeground with Android adaptive-icon safe margins"
Write-Host 'Play Store source remains assets/branding/nisenti_playstore_512.png'
