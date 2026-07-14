# Generates Android launcher icons from SVG sources using ImageMagick if available.
# This script writes into android/app/src/main/res mipmap folders.

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$sourceSVG = Join-Path $repoRoot 'assets/branding/nisenti_launcher.svg'
$androidRes = Join-Path $repoRoot 'android/app/src/main/res'
$outDir = Join-Path $repoRoot 'assets/android'

if (-not (Test-Path $sourceSVG)) {
    Write-Error "Source SVG not found: $sourceSVG"
    exit 1
}

if (-not (Test-Path $androidRes)) {
    Write-Error "Android res directory not found: $androidRes"
    exit 1
}

$iconSizes = @{
    'mipmap-mdpi' = 48
    'mipmap-hdpi' = 72
    'mipmap-xhdpi' = 96
    'mipmap-xxhdpi' = 144
    'mipmap-xxxhdpi' = 192
}

$magick = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magick) {
    Write-Error 'ImageMagick (magick) is not installed or not found in PATH.'
    exit 1
}

foreach ($folder in $iconSizes.Keys) {
    $dir = Join-Path $androidRes $folder
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $size = $iconSizes[$folder]
    $out = Join-Path $dir 'ic_launcher.png'
    magick convert $sourceSVG -resize ${size}x${size} $out
    Write-Host "Wrote $out"
}

# Create anydpi adaptive foreground icon
$anydpi = Join-Path $androidRes 'mipmap-anydpi-v26'
if (-not (Test-Path $anydpi)) { New-Item -ItemType Directory -Force -Path $anydpi | Out-Null }
magick convert $sourceSVG -resize 512x512 (Join-Path $anydpi 'ic_launcher_foreground.png')
Write-Host "Wrote adaptive icon foreground"
