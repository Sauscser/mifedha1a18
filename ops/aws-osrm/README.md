# AWS OSRM Deployment (Regional)

This folder gives you a repeatable path to deploy a regional OSRM backend on AWS EC2 and point the app to it.

## 1. What You Need

- AWS account
- Ubuntu EC2 instance (start with a memory-heavy instance for large regions)
- Security Group rule to allow TCP 5000 from your app clients or trusted networks
- SSH access to the EC2 instance

## 2. EC2 Quick Setup

1. Launch Ubuntu 22.04 LTS.
2. Attach enough EBS storage for your region extract and generated `.osrm*` files.
3. Open inbound port 5000 (or front with Nginx/ALB and HTTPS).
4. SSH into the instance.

## 3. Deploy OSRM

From this repo on the EC2 machine:

```bash
cd ops/aws-osrm
bash deploy_osrm_region.sh "https://download.geofabrik.de/africa-latest.osm.pbf"
```

For smaller first rollout, use a subregion URL instead of full Africa.

## 4. Health Test

```bash
curl "http://<EC2_PUBLIC_IP>:5000/route/v1/driving/36.8219,-1.2921;36.8968,-1.2166?overview=false"
```

You should get JSON with `code: "Ok"` and at least one route.

## 5. Auto-Start on Reboot

```bash
sudo cp systemd/osrm-routed.service /etc/systemd/system/osrm-routed.service
sudo systemctl daemon-reload
sudo systemctl enable osrm-routed.service
sudo systemctl start osrm-routed.service
```

## 6. Point App to AWS OSRM

Set the environment variable for your app builds:

- Name: `EXPO_PUBLIC_OSRM_BASE_URL`
- Value: `http://<EC2_PUBLIC_IP>:5000` (or your HTTPS domain)

Because app routing already uses `src/config/osrm.ts`, all integrated screens use this endpoint automatically.

## 7. Update Map Data Later

```bash
cd /opt/osrm
rm -f data/region.osm.pbf
curl -L "<new_pbf_url>" -o data/region.osm.pbf
docker compose run --rm osrm-prep
docker compose up -d osrm-routed
```

## 8. Production Notes

- Prefer HTTPS with a domain + reverse proxy.
- Restrict inbound traffic to reduce abuse.
- Add monitoring and alerts (CloudWatch Agent, uptime checks).
- Keep Amplify for Auth/API/Storage/Lambda; only routing is separate.
