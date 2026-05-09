# AWS EC2 Deployment Guide

This guide covers deploying Blurz Chat to AWS EC2 with Docker, Nginx, and SSL.

---

## Prerequisites

- An AWS EC2 instance (Ubuntu 22.04+).
- A domain name pointed to your EC2's public IP (e.g. DuckDNS).
- Your `.pem` key file to SSH into the instance.
- Ports **22 (SSH)**, **80 (HTTP)**, **443 (HTTPS)** open in your EC2 Security Group.

---

## Step 1: Connect to EC2

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_IP
```

---

## Step 2: Install Docker on EC2 (first time only)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu
# Log out and back in for the group change to take effect
```

---

## Step 3: Clone the Repository

```bash
git clone https://github.com/blurz17/blurz-chat-app.git
cd blurz-chat-app/server
git checkout main
```

---

## Step 4: Upload Your `.env` File

**Do NOT put your `.env` in Git.** Transfer it securely from your local machine.

**Option A: Using SCP (from your local Windows PowerShell)**
```powershell
scp -i "C:\path\to\your-key.pem" "E:\path\to\blurz-chatapp\server\.env" ubuntu@YOUR_EC2_IP:~/blurz-chat-app/server/
```

**Option B: Create it manually on the server**
```bash
nano ~/blurz-chat-app/server/.env
# Paste your .env content, then Ctrl+X → Y → Enter to save
```

> [!IMPORTANT]
> Make sure to update `DB_URL` to point to your production database (e.g. Neon),
> set `Redis_Url=redis://redis:6379/0` (using the Docker service name, not localhost),
> and set `domain` to `https://your-domain.com/api/v1`.

---

## Step 5: Update `.env` for Production

Before starting Docker, make these changes in your `.env` on the server:

```env
# Use your managed PostgreSQL (Neon, RDS, etc.)
DB_URL=postgresql+asyncpg://user:password@your-db-host/blurz_chat

# Use Docker service name "redis", NOT "localhost"
Redis_Url=redis://redis:6379/0
ResisHost=redis
ResdisPort=6379

# Your public domain
domain=https://your-domain.com/api/v1

# Turn off debug
debug=False
```

---

## Step 6: Start the Docker Stack

```bash
cd ~/blurz-chat-app/server
sudo docker compose up --build -d
```

Verify all containers are running:
```bash
sudo docker compose ps
```

You should see `api`, `celery_worker`, and `redis` all with `Up` status.

---

## Step 7: Run Database Migrations

```bash
sudo docker compose exec api alembic upgrade head
```

---

## Step 8: Install and Configure Nginx

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Copy your nginx config
sudo cp ~/blurz-chat-app/server/nginx.conf /etc/nginx/sites-available/blurzchat

# Enable it
sudo ln -s /etc/nginx/sites-available/blurzchat /etc/nginx/sites-enabled/

# Remove the default config
sudo rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

> [!NOTE]
> Before continuing, update `server_name` inside the nginx.conf to match your actual domain name.

---

## Step 9: Get SSL Certificate with Certbot

Make sure your domain DNS is already pointing to your EC2 IP.

```bash
sudo certbot --nginx -d your-domain.com
```

Follow the prompts (enter your email, accept terms). Certbot will:
1. Get the SSL certificate from Let's Encrypt.
2. Automatically update your Nginx config to serve HTTPS.
3. Set up auto-renewal in the background.

---

## Step 10: Set Up GitHub Actions for Auto-Deploy

Go to your GitHub repo → **Settings → Secrets and variables → Actions** and add:

| Secret Name | Value |
|---|---|
| `HOST_DNS` | Your EC2 public IP (e.g. `54.198.23.178`) |
| `USERNAME` | `ubuntu` |
| `EC2_SSH_KEY` | The **entire contents** of your `.pem` key file |

From now on, every push to `main` will automatically SSH into your EC2 instance, pull the latest code, and restart the Docker containers.

---

## Handling Pull Requests (PRs)

When someone contributes to your repo:

1. They fork the repo and push their changes to their own fork.
2. They open a PR on GitHub targeting `main`.
3. You review the PR in the GitHub web interface.
4. If approved, click **"Merge pull request"** — this triggers the GitHub Action and auto-deploys.

**Recommended: Use a `dev` branch for staging**
- Set up a separate `dev` branch.
- PRs target `dev`, not `main`.
- When `dev` is stable, you manually merge `dev → main` to deploy.

---

## Useful Commands on EC2

```bash
# View logs for all services
sudo docker compose logs -f

# View logs for a specific service
sudo docker compose logs -f api
sudo docker compose logs -f celery_worker

# Restart a single service
sudo docker compose restart api

# Rebuild and restart everything
sudo docker compose up --build -d

# Stop everything
sudo docker compose down
```
