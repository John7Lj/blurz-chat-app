# Blurz Chat App

A real-time chat application built with **FastAPI**, **WebSockets**, **Redis Pub/Sub**, **PostgreSQL**, and **Celery** for background tasks.

## 🏗️ Architecture

```
client/          → React front-end
server/
  ├── auth/          → JWT authentication, registration, login
  ├── chats/         → Chat rooms and DM logic
  ├── messages/      → Message storage and retrieval
  ├── websocket/     → WebSocket connection manager
  ├── pubsub/        → Redis Pub/Sub publisher & subscriber
  ├── celery_service/→ Background tasks (email, profile pics)
  ├── mailserver/    → Email sending via SMTP
  ├── users/         → User profiles
  ├── core/          → Middleware, error handlers, config
  ├── db/            → SQLAlchemy models, session, migrations
  └── migrations/    → Alembic migration history
```

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone and enter the repo
```bash
git clone https://github.com/blurz17/blurz-chat-app.git
cd blurz-chat-app
```

### 2. Create environment variables
```bash
cp server/.env.example server/.env
# Edit server/.env with your values
```

### 3. Start all services locally (with PostgreSQL)
```bash
docker compose -f server/docker-compose.dev.yml up --build
```

The API will be available at `http://localhost:8000` and auto-reloads on code changes.

### 4. Run database migrations (first time only)
```bash
docker exec -it <api-container-name> alembic upgrade head
```

## 🔑 Environment Variables

Copy `server/.env.example` to `server/.env` and fill in your values:

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL connection string (asyncpg format) |
| `jwt_secret` | Secret key for JWT signing |
| `password_secrete_reset` | Secret for password reset tokens |
| `jwt_algorithm` | Algorithm used for JWT (e.g. `HS256`) |
| `refresh_token_expiary` | Refresh token expiry in **days** |
| `access_token_expiary` | Access token expiry in **minutes** |
| `Redis_Url` | Full Redis connection URL (e.g. `redis://localhost:6379/0`) |
| `ResisHost` | Redis server hostname (used in some configurations) |
| `ResdisPort` | Redis server port |
| `Redis_DB` | Redis database index |
| `MAIL_USERNAME` | SMTP server username (e.g. Gmail address) |
| `MAIL_PASSWORD` | SMTP server password (e.g. Gmail App Password) |
| `MAIL_FROM` | Email address shown in the "From" field |
| `MAIL_PORT` | SMTP server port (usually 587 for TLS) |
| `MAIL_SERVER` | SMTP server address |
| `MAIL_FROM_NAME` | Name shown in the "From" field (e.g. `Blurz_chat`) |
| `domain` | Public API base URL (e.g. `https://your-domain.com/api/v1`) |
| `debug` | Set to `False` in production |
| `profile_picture_path` | Local directory path for storing profile pictures |

## 🐳 Docker Compose Files

| File | Purpose |
|---|---|
| `server/docker-compose.yml` | **Production** — API + Celery + Redis |
| `server/docker-compose.dev.yml` | **Local Dev** — API + Celery + Redis + PostgreSQL |

## 🔄 Contributing

1. **Fork** the repository.
2. Create a **feature branch**: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them.
4. Open a **Pull Request** targeting the `main` branch.
5. A maintainer will review and merge your PR. On merge, it auto-deploys to AWS.

## 🏭 Production Deployment

The server is deployed on **AWS EC2** behind **Nginx** as a reverse proxy, secured with a **Let's Encrypt SSL certificate**.

See the [Deployment Walkthrough](.github/DEPLOYMENT.md) for the full step-by-step guide.

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| API Framework | FastAPI |
| Real-time | WebSockets + Redis Pub/Sub |
| Database | PostgreSQL (SQLAlchemy + Alembic) |
| Cache / Broker | Redis |
| Background Tasks | Celery |
| Email | FastAPI-Mail (SMTP) |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |
| CI/CD | GitHub Actions |

## 📄 Legal

- [License](LICENSE) - MIT License
- [Terms of Service](TERMS_OF_SERVICE.md)
- [Privacy Policy](PRIVACY_POLICY.md)
