# Generates PNG icons from SVG and deploys them to Android mipmap folders
# Usage: Open PowerShell in repo root and run:
#   ./scripts/generate_and_deploy_icons.ps1

# Ensure ImageMagick (magick) is installed and in PATH

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $repoRoot

# Run the basic generator
Write-Host "Generating base PNG assets..."
& pwsh -NoProfile -ExecutionPolicy Bypass -Command "& './scripts/generate_icons.ps1'"

$srcDir = Join-Path $repoRoot 'assets/android'
$playSrc = Join-Path $repoRoot 'assets/branding/nisenti_playstore_512.png'

$androidRes = Join-Path $repoRoot 'android/app/src/main/res'
if (-not (Test-Path $androidRes)) { Write-Host "Android res folder not found at $androidRes"; Pop-Location; exit 1 }

# Map sizes to mipmap qualifiers
$mappings = @{
    'mipmap-mdpi' = 'icon-48.png'
    'mipmap-hdpi' = 'icon-72.png'
    'mipmap-xhdpi' = 'icon-96.png'
    'mipmap-xxhdpi' = 'icon-144.png'
    'mipmap-xxxhdpi' = 'icon-192.png'
}

foreach ($folder in $mappings.Keys) {
    $outFolder = Join-Path $androidRes $folder
    if (-not (Test-Path $outFolder)) { New-Item -ItemType Directory -Force -Path $outFolder | Out-Null }
    $srcFile = Join-Path $srcDir $mappings[$folder]
    if (Test-Path $srcFile) {
        Copy-Item -Force $srcFile (Join-Path $outFolder 'ic_launcher.png')
        Copy-Item -Force $srcFile (Join-Path $outFolder 'ic_launcher_round.png')
        Write-Host "Deployed $srcFile -> $outFolder"
    } else {
        Write-Host "Warning: $srcFile not found"
    }
}

# Adaptive icon (API 26+) - copy foreground as ic_launcher_foreground
$anydpi = Join-Path $androidRes 'mipmap-anydpi-v26'
if (-not (Test-Path $anydpi)) { New-Item -ItemType Directory -Force -Path $anydpi | Out-Null }
$foreground = Join-Path $srcDir 'icon-512.png'
if (Test-Path $foreground) {
    Copy-Item -Force $foreground (Join-Path $anydpi 'ic_launcher_foreground.png')
    Write-Host "Deployed adaptive foreground -> $anydpi"
}

# Copy Play Store icon to assets/branding (already generated) and notify user
if (Test-Path $playSrc) {
    Write-Host "Play Store icon available at: $playSrc"
} else {
    Write-Host "Play Store icon not found. You can generate it by running scripts/generate_icons.ps1"
}

Pop-Location
Write-Host "Done. Remember to rebuild your Android project to pick up new icons."
