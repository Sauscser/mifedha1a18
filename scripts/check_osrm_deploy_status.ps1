param(
  [string]$HostIp = "98.82.187.250",
  [string]$KeyPath = "ops/aws-osrm/keys/osrm-africa-key.pem"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $KeyPath)) {
  Write-Error "Key file not found: $KeyPath"
}

$cmd = @'
echo '== Processes =='
pgrep -af 'deploy_osrm_region.sh|osrm-extract|osrm-partition|osrm-customize|osrm-routed|curl -L' || true

echo '== Data File =='
ls -lh /opt/osrm/data/region.osm.pbf 2>/dev/null || echo 'region.osm.pbf not present yet'

echo '== Disk =='
df -h /

echo '== Containers =='
sudo docker ps --format '{{.Names}} | {{.Status}} | {{.Ports}}' 2>/dev/null || true

echo '== Prep Container Logs =='
if sudo docker ps --filter 'name=osrm-osrm-prep-run' --format '{{.ID}}' 2>/dev/null | grep -q .; then
  PREP_ID=$(sudo docker ps --filter 'name=osrm-osrm-prep-run' --format '{{.ID}}' 2>/dev/null | sed -n '1p')
  sudo docker logs --tail 30 "$PREP_ID"
else
  echo 'No active osrm-prep container'
fi

echo '== Routed Container Logs =='
if sudo docker ps --filter 'name=osrm-routed' --format '{{.ID}}' 2>/dev/null | grep -q .; then
  ROUTED_ID=$(sudo docker ps --filter 'name=osrm-routed' --format '{{.ID}}' 2>/dev/null | sed -n '1p')
  sudo docker logs --tail 20 "$ROUTED_ID"
else
  echo 'No active osrm-routed container yet'
fi

echo '== Deploy Log Tail =='
tail -n 30 ~/osrm-bootstrap/deploy.log 2>/dev/null || echo 'deploy.log not found yet'
'@
$cmd = $cmd -replace "`r", ""
ssh -i $KeyPath ubuntu@$HostIp $cmd
