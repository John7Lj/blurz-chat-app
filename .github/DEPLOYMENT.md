# Render Deployment Guide

This guide covers deploying the **Blurz Chat App** backend to **Render** using the Infrastructure-as-Code Blueprint (`render.yaml`). Render offers a fully managed platform with built-in SSL, automatic database migrations, secure secret generation, and native WebSocket support.

---

## Prerequisites

Before starting, ensure you have:
1. A [Render Account](https://render.com/).
2. A managed **PostgreSQL** database (e.g., [Neon PostgreSQL](https://neon.tech/) which is free and highly compatible).
3. A managed **Redis** instance (e.g., [Upstash Redis](https://upstash.com/) or a native Render Redis service).
4. A [Brevo Account](https://www.brevo.com/) (formerly Sendinblue) or another SMTP provider for dispatching verification emails.

---

## Step 1: Set Up External Databases

For performance and persistence reliability, it is highly recommended to use dedicated external databases:

### A. Neon PostgreSQL Setup
1. Log in to Neon and create a new project.
2. Copy the connection string from your dashboard. It should look like this:
   ```
   postgresql://neondb_owner:password@ep-withered-truth.aws.neon.tech/neondb?sslmode=require
   ```
3. Change the scheme prefix from `postgresql://` to `postgresql+asyncpg://` so FastAPI can use its asynchronous connection pool:
   ```
   postgresql+asyncpg://neondb_owner:password@ep-withered-truth.aws.neon.tech/neondb?sslmode=require
   ```

### B. Upstash Redis Setup
1. Log in to Upstash and create a new serverless Redis database.
2. Copy the **Redis URL** under the Connect section. It should look like:
   ```
   redis://default:password@ready-fish-123.upstash.io:6379
   ```

---

## Step 2: Deploy Using the Render Blueprint

Render parses the [render.yaml](file:///e:/MY-PROJECTS/blurz-chatapp/render.yaml) file in the root of the project to automatically configure all resources.

1. Navigate to the **Render Dashboard**.
2. Click **Blueprints** (in the top navigation bar) -> **New Blueprint Instance**.
3. Connect your GitHub repository (`blurz-chat-app`).
4. Render will detect `render.yaml` and request values for the environment variables:

| Variable Name | Required Action |
|---|---|
| **`DB_URL`** | Paste your Neon PostgreSQL connection string (prefixed with `postgresql+asyncpg://`) |
| **`Redis_Url`** | Paste your Upstash Redis connection string |
| **`domain`** | Enter your final Render Web Service public domain with `/api/v1` appended (e.g., `https://blurz-chat-api.onrender.com/api/v1`) |
| **`FRONTEND_URL`** | The public URL of your React frontend application (e.g., `https://blurz-chat-app.vercel.app`) |
| **`MAIL_USERNAME`** | Your Brevo/SMTP login email address |
| **`MAIL_PASSWORD`** | Your Brevo/SMTP SMTP key or account password |
| **`MAIL_FROM`** | The verified sender email address registered on Brevo |

5. Click **Approve** or **Deploy**.

---

## Step 3: Automatic Setup and Deployment

Once you approve the Blueprint deployment, Render will automatically execute the following steps in sequence:

1. **Provision Container**: Build a Docker image based on [server/Dockerfile](file:///e:/MY-PROJECTS/blurz-chatapp/server/Dockerfile).
2. **Auto-Generate Secret Keys**: Render will dynamically generate high-entropy keys for `jwt_secret` and `password_secrete_reset`, keeping keys completely secure without hardcoding.
3. **Run Pre-Deploy Migrations**: Render automatically runs the pre-deploy command:
   ```bash
   alembic upgrade head
   ```
   This ensures your database tables are created or updated before the new version of the API boots up.
4. **Boot Server**: Launch the API utilizing the start command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

---

## Step 4: Deploy Frontend Client (e.g., Vercel or Render)

You can deploy the React frontend to Vercel, Netlify, or as a Render Static Site. 

During the build setup, provide the following environment variables pointing to your newly created Render backend:

```env
VITE_API_URL=https://your-backend-service.onrender.com/api/v1
VITE_WS_URL=wss://your-backend-service.onrender.com/api/v1/ws
VITE_MEDIA_URL=https://your-backend-service.onrender.com
```

> [!IMPORTANT]
> Ensure that the WebSocket protocol uses `wss://` (secure WebSocket) in production to avoid mixed-content blocks by browsers.

---

## Handling Development Workflows & PRs

### Continuous Integration (CI/CD)
* **Auto-Deploy on Push**: Every commit merged into the `main` branch will automatically trigger a rolling, zero-downtime deployment on Render.
* **PR Previews**: You can enable **Pull Request Previews** in the Render Web Service settings. This will automatically spin up a temporary instance of your API whenever a PR is opened, allowing you to test changes live before merging.

### Useful Logs Inspection
To monitor or debug your Render app, use the **Logs** tab in the Render Service dashboard to see stdout/stderr in real-time, including:
* Verification mail dispatches.
* Pub/Sub connection confirmations.
* Live WebSocket connection handshakes.
