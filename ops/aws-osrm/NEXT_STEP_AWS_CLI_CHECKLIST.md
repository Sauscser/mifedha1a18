# Next Step AWS CLI Checklist (Do Together)

This checklist is the immediate next step for production routing rollout.

## A. Run Local Preflight

From project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\aws_osrm_preflight.ps1
```

Expected: AWS identity prints and preflight completes.

## B. Create EC2 Security Group for OSRM

Replace <YOUR_IP>/32 with your current public IP CIDR.

```powershell
$REGION = "us-east-1"
$SG_NAME = "osrm-africa-sg"

$SG_ID = aws ec2 create-security-group `
  --group-name $SG_NAME `
  --description "OSRM Africa routing SG" `
  --region $REGION `
  --query GroupId --output text

aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp --port 22 --cidr "<YOUR_IP>/32" `
  --region $REGION

aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp --port 5000 --cidr "<YOUR_IP>/32" `
  --region $REGION

Write-Host "Security Group: $SG_ID"
```

## C. Launch Ubuntu EC2

Recommended starter for Africa-regional OSRM: memory-optimized instance class.

```powershell
$REGION = "us-east-1"
$AMI = "ami-053b0d53c279acc90"  # Ubuntu 22.04 LTS in us-east-1 (verify before launch)
$TYPE = "r6i.xlarge"
$KEY = "<YOUR_KEYPAIR_NAME>"
$SUBNET = "<YOUR_SUBNET_ID>"
$SG_ID = "<SG_ID_FROM_STEP_B>"

$INSTANCE_ID = aws ec2 run-instances `
  --image-id $AMI `
  --instance-type $TYPE `
  --key-name $KEY `
  --subnet-id $SUBNET `
  --security-group-ids $SG_ID `
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":120,"VolumeType":"gp3"}}]' `
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=osrm-africa-1}]' `
  --region $REGION `
  --query 'Instances[0].InstanceId' --output text

Write-Host "Instance: $INSTANCE_ID"
```

## D. Get Public IP and Deploy OSRM

```powershell
$REGION = "us-east-1"
$INSTANCE_ID = "<INSTANCE_ID>"

$PUBLIC_IP = aws ec2 describe-instances `
  --instance-ids $INSTANCE_ID `
  --region $REGION `
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

Write-Host "Public IP: $PUBLIC_IP"
```

SSH and run deployment from this repo on the server:

```bash
cd ops/aws-osrm
bash deploy_osrm_region.sh "https://download.geofabrik.de/africa-latest.osm.pbf"
```

## E. Verify Endpoint from Local Machine

```powershell
$env:EXPO_PUBLIC_OSRM_BASE_URL = "http://<PUBLIC_IP>:5000"
npm run check:osrm
```

## F. Set App Build Variable

Set this variable in your build environment before release:

- EXPO_PUBLIC_OSRM_BASE_URL = http://<PUBLIC_IP>:5000 (or your HTTPS domain)

## G. Rollback Safety

If endpoint fails under load, set EXPO_PUBLIC_OSRM_BASE_URL back to previous known-good endpoint and rebuild.
