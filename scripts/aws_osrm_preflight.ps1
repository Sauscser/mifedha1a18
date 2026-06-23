param(
  [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/5] Checking AWS CLI..."
aws --version | Out-Host

Write-Host "[2/5] Checking AWS identity..."
aws sts get-caller-identity --output json | Out-Host

Write-Host "[3/5] Checking region..."
$configuredRegion = aws configure get region
if (-not $configuredRegion) {
  Write-Host "No default region configured. Setting to $Region"
  aws configure set region $Region
  $configuredRegion = $Region
}
Write-Host "Active region: $configuredRegion"

Write-Host "[4/5] Validating EC2 permissions with dry-run..."
$dryRunError = $null
try {
  aws ec2 describe-instances --region $configuredRegion --max-items 1 --output json 2>$null | Out-Null
  Write-Host "EC2 read permission looks good."
} catch {
  $dryRunError = $_
}

if ($dryRunError) {
  Write-Warning "Could not validate EC2 describe permission. Continue after checking IAM policy."
}

Write-Host "[5/5] Preflight complete."
Write-Host "Next: follow ops/aws-osrm/NEXT_STEP_AWS_CLI_CHECKLIST.md"
