#!/usr/bin/env bash
set -euo pipefail

# Deploy OSRM on Ubuntu EC2 using Docker Compose.
# Usage:
#   bash deploy_osrm_region.sh "https://download.geofabrik.de/africa-latest.osm.pbf"

if [[ $# -lt 1 ]]; then
  echo "Usage: bash deploy_osrm_region.sh <PBF_URL>"
  exit 1
fi

PBF_URL="$1"
BASE_DIR="/opt/osrm"
DATA_DIR="$BASE_DIR/data"
COMPOSE_FILE="$BASE_DIR/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable docker
  sudo systemctl start docker
fi

sudo mkdir -p "$DATA_DIR"
sudo chown -R "$USER":"$USER" "$BASE_DIR"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/docker-compose.yml" "$COMPOSE_FILE"

if [[ ! -f "$DATA_DIR/region.osm.pbf" ]]; then
  echo "Downloading map extract..."
  curl -L "$PBF_URL" -o "$DATA_DIR/region.osm.pbf"
fi

cd "$BASE_DIR"

echo "Preparing OSRM graph files (this can take time)..."
docker compose run --rm osrm-prep

echo "Starting OSRM server..."
docker compose up -d osrm-routed

echo "Done. Test with:"
echo "curl 'http://<EC2_PUBLIC_IP>:5000/route/v1/driving/36.8219,-1.2921;36.8968,-1.2166?overview=false'"
