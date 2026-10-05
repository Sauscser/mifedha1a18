# Generates all Android launcher densities from the shared NiSenti PNG artwork.

$repoRoot = Split-Path -Parent $PSScriptRoot
$androidRes = Join-Path $repoRoot 'android/app/src/main/res'
$outDir = Join-Path $repoRoot 'assets/android'
$generator = Join-Path $repoRoot 'scripts/generate_icons.ps1'

if (-not (Test-Path $androidRes)) { throw "Android res directory not found: $androidRes" }
& $generator
if (-not $?) { throw 'Icon asset generation failed.' }

$iconSizes = @{
    'mipmap-mdpi' = 48
    'mipmap-hdpi' = 72
    'mipmap-xhdpi' = 96
    'mipmap-xxhdpi' = 144
    'mipmap-xxxhdpi' = 192
}

foreach ($folder in $iconSizes.Keys) {
    $dir = Join-Path $androidRes $folder
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $size = $iconSizes[$folder]
    $source = Join-Path $outDir "icon-$size.png"
    Copy-Item -Force $source (Join-Path $dir 'ic_launcher.png')
    Copy-Item -Force $source (Join-Path $dir 'ic_launcher_round.png')
    Write-Host "Deployed $source -> $dir"
}

$anydpi = Join-Path $androidRes 'mipmap-anydpi-v26'
if (-not (Test-Path $anydpi)) { New-Item -ItemType Directory -Force -Path $anydpi | Out-Null }
$adaptiveForeground = Join-Path $repoRoot 'assets/branding/nisenti_foreground_adaptive.png'
Copy-Item -Force $adaptiveForeground (Join-Path $anydpi 'ic_launcher_foreground.png')
Write-Host "Deployed adaptive foreground -> $anydpi"
