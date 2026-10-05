# Generates and deploys all NiSenti app icon variants.
# Usage: Open PowerShell in repo root and run:
#   ./scripts/generate_and_deploy_icons.ps1

$repoRoot = Split-Path -Parent $PSScriptRoot
$deployScript = Join-Path $repoRoot 'scripts/generate_native_icons.ps1'
& $deployScript
if (-not $?) { throw 'Android icon deployment failed.' }
Write-Host 'Play Store icon: assets/branding/nisenti_playstore_512.png'
Write-Host 'Rebuild the Android app to include the updated launcher icons.'
