# Generates launcher and Play Store PNG assets from the SVG sources using ImageMagick (convert)
param(
    [string]$SourceDir = "assets/branding",
    [string]$OutDir = "assets/android"
)

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

$launcher = Join-Path $SourceDir 'nisenti_launcher.svg'
$play = Join-Path $SourceDir 'nisenti_playstore.svg'

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
    convert $launcher -resize ${size}x${size} $out
    Write-Host "Wrote $out"
}

# Play Store icons
convert $play -resize 1024x1024 (Join-Path $SourceDir 'nisenti_playstore_1024.png')
convert $play -resize 512x512 (Join-Path $SourceDir 'nisenti_playstore_512.png')
Write-Host 'Play store assets written to assets/branding/'
