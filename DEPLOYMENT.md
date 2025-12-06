# 🚀 Deployment Guide - AWS EC2

Deploy The Protocol War to AWS EC2 with Docker and GitHub Actions CI/CD.

## Prerequisites

- AWS Account with EC2 access
- Docker Hub account
- GitHub repository with this code

## 1. EC2 Instance Setup

### Launch Instance

1. Go to AWS EC2 Console
2. Click "Launch Instance"
3. Configure:
   - **Name**: `protocol-war`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: `t3.small` (recommended) or `t2.micro` (free tier)
   - **Key pair**: Create new or select existing (download `.pem` file!)
   - **Security Group**: Allow:
     - SSH (22) from your IP
     - HTTP (80) from anywhere
     - HTTPS (443) from anywhere

### Connect to Instance

```bash
# Set permissions on key file
chmod 400 your-key.pem

# SSH into instance
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Log out and back in for group changes
exit
```

Reconnect and verify:
```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
docker --version
docker compose version
```

## 2. GitHub Secrets Setup

Go to your GitHub repo → Settings → Secrets and variables → Actions.

Add these secrets:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | Your EC2 public IP (e.g., `54.123.45.67`) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your `.pem` file (entire file) |
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token (create at hub.docker.com → Account Settings → Security) |

## 3. Deploy

### First Deployment

Push to main branch:
```bash
git add .
git commit -m "Add Docker and CI/CD"
git push origin main
```

GitHub Actions will:
1. Build Docker images
2. Push to Docker Hub
3. Deploy to EC2

### Monitor Deployment

1. Go to GitHub → Actions tab
2. Click on the running workflow
3. Watch the logs

## 4. Verify

After deployment completes:

```bash
# Check app is running
curl http://<EC2_PUBLIC_IP>/health

# View logs
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
cd ~/protocol-war
docker compose -f docker-compose.prod.yml logs -f
```

Visit `http://<EC2_PUBLIC_IP>` in your browser!

## 5. (Optional) Add Domain + SSL

### Point Domain to EC2

In your DNS provider, add an A record:
- **Name**: `@` or subdomain
- **Value**: EC2 public IP

### Install Certbot for SSL

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Stop nginx temporarily
cd ~/protocol-war
docker compose -f docker-compose.prod.yml down

# Install Certbot
sudo apt install certbot -y

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Certificate files will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Then update nginx config to use SSL (see `nginx/nginx.ssl.conf` example).

## Troubleshooting

### Check Container Status
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
```

### Restart Containers
```bash
docker compose -f docker-compose.prod.yml restart
```

### View Database
```bash
docker exec -it protocol-war-backend ls -la /app/data/
```

### SSH Key Issues
Make sure:
1. Key file has `chmod 400` permissions
2. Entire key content is in GitHub secret (including `-----BEGIN` and `-----END`)

## Local Docker Testing

Before pushing to EC2, test locally:

```bash
# Build and run all services
docker compose up --build

# Visit http://localhost:8080 (through nginx proxy)
# Or http://localhost (frontend direct)
# Or http://localhost:8000 (backend direct)
```

## Cost Estimate

| Resource | Monthly Cost |
|----------|--------------|
| EC2 t3.small | ~$15 |
| EC2 t2.micro (free tier) | $0 first year |
| EBS Storage (8GB) | ~$0.80 |
| Data Transfer | Variable |

**Total**: ~$15-20/month (or free with t2.micro)
