# Blurz Chat App

Blurz is a real-time, production-ready chat application built with a modern distributed architecture. It features a scalable real-time engine utilizing **FastAPI WebSockets** and **Redis Pub/Sub**, a decoupled **React 19 Frontend**, and **SQLModel (SQLAlchemy) + PostgreSQL** for persistent storage.

---

## 🏗️ System Architecture & How It Works

Blurz is designed to scale horizontally across multiple application instances behind a load balancer. 

```
                                      +-----------------------------------+
                                      |         React 19 Frontend         |
                                      +-----------------+-----------------+
                                                        | WebSocket
                                                        v
                                      +-----------------+-----------------+
                                      |        FastAPI WebSockets         |
                                      +--------+-----------------+--------+
                                               |                 ^
                                  PostgreSQL   |                 | Redis Pub/Sub
                                  (SQLModel)   v                 | Broadcast
                                      +--------+-----+     +-----+--------+
                                      |  PostgreSQL  |     |  Redis Cache |
                                      +--------------+     +--------------+
```

### 1. The Real-Time Message Flow
1. **WebSocket Connection**: The client initiates a WebSocket connection at `/api/v1/ws?token=<JWT>`. The server decodes the JWT to authenticate the user and registers the active connection in the [ConnectionManager](file:///e:/MY-PROJECTS/blurz-chatapp/server/websocket/manager.py).
2. **Sending a Message**: When a user sends a message, the endpoint stores the message in PostgreSQL via SQLModel.
3. **Publishing to Redis**: Upon saving, a message payload is published to the corresponding Redis Pub/Sub channel.
4. **Subscribed Broadcast**: A single background listener task running inside the FastAPI lifespan loop ([PubSubListener](file:///e:/MY-PROJECTS/blurz-chatapp/server/pubsub/subscriber.py)) listens to Redis Pub/Sub messages and invokes the `ConnectionManager.handle_pubsub_message` callback.
5. **Client Delivery**: The connection manager delivers the message to the target user's active WebSocket connection.

### 2. File Organization
```
├── client/              → React 19 + TypeScript + Tailwind CSS v4
│   ├── src/             → Main frontend source code
│   ├── public/          → Static assets (logos, icons)
│   └── tests/           → Vitest & Playwright E2E tests
└── server/              → FastAPI backend services
    ├── auth/            → JWT authentication, registration & login flow
    ├── chats/           → DM rooms, chat logic & endpoint routers
    ├── messages/        → Message models, schemas & endpoints
    ├── users/           → User profile and media status management
    ├── websocket/       → WebSocket routing & client state management
    ├── pubsub/          → Redis Publisher & Listener logic
    ├── db/              → SQLite/Postgres connection pooling & settings
    ├── core/            → Middlewares, custom exceptions & utilities
    └── mailserver/      → HTML templates & mail helpers
```

---

## 🚀 Quick Start (Docker Setup)

The fastest way to spin up the entire application—including PostgreSQL, Redis, and the API—is using Docker Compose.

### 1. Prerequisites
Ensure you have the following installed:
* [Docker & Docker Compose](https://www.docker.com/products/docker-desktop)
* [Node.js v20+](https://nodejs.org/) (if running client locally outside Docker)

### 2. Start Services
1. Clone the repository and enter the project folder:
   ```bash
   git clone https://github.com/blurz17/blurz-chat-app.git
   cd blurz-chat-app
   ```
2. Set up the backend environment variables:
   ```bash
   cp server/.env.example server/.env
   # Update server/.env with your local credentials and mail config
   ```
3. Run the development docker compose:
   ```bash
   docker compose -f server/docker-compose.dev.yml up --build
   ```
   > [!NOTE]
   > On startup, `init_db()` will automatically run inside FastAPI's lifespan, creating all necessary tables in PostgreSQL. You do not need to run migrations manually for initial setup.

The API service will be available at `http://localhost:8000`.

---

## 💻 Detailed Platform-Specific Setup (Without Docker)

If you prefer to run services natively on **Windows**, **macOS**, or **Linux**, follow these step-by-step instructions.

### Prerequisites
* **Python 3.10+** (Backend)
* **Node.js v20+** and **npm v10+** (Frontend)
* **PostgreSQL** running locally or in the cloud
* **Redis** server running locally or in the cloud

---

### 1. Backend Service Setup (`server/`)

#### Step A: Navigate & Environment Setup
Open a terminal in the root of the project and run the following based on your OS:

##### Windows (PowerShell)
```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
```

##### macOS / Linux
```bash
cd server
python3 -m venv venv
source venv/bin/activate
```

#### Step B: Install Dependencies
```bash
pip install -r requirements/dev.txt
```

#### Step C: Configure `.env`
Create the `.env` file from the template:
* **Linux/macOS/Git Bash**: `cp .env.example .env`
* **Windows PowerShell**: `Copy-Item .env.example .env`

Edit the newly created `.env` file:
```ini
DB_URL=postgresql+asyncpg://<username>:<password>@localhost:5432/blurz_chat
Redis_Url=redis://localhost:6379/0
jwt_secret=your_super_secret_jwt_key
password_secrete_reset=your_safe_serializer_salt
```

#### Step D: Run the Backend Server
Start the development server with live reload:
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 2. Frontend Client Setup (`client/`)

#### Step A: Navigate & Environment Setup
Open a new terminal session in the root of the project:
```bash
cd client
```

#### Step B: Install Dependencies
```bash
npm install
```

#### Step C: Configure `.env`
Copy the environment template:
* **Linux/macOS**: `cp .env .env.local`
* **Windows PowerShell**: `Copy-Item .env .env.local`

Ensure the local environment variables point to your local backend server:
```ini
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1/ws
VITE_MEDIA_URL=http://localhost:8000
```

#### Step D: Start Development Server
```bash
npm run dev
```
The client dashboard will be available at `http://localhost:5173`.

---

## 🔑 Comprehensive Environment Configuration

### Backend Environment Variables (`server/.env`)

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `DB_URL` | PostgreSQL connection URI utilizing `asyncpg` driver | `postgresql+asyncpg://postgres:pass@localhost:5432/db` |
| `jwt_secret` | High-entropy string used for JWT authorization tokens | `e4da7262d3c5ee5db1385...` |
| `password_secrete_reset` | High-entropy string used for signed reset links | `TsyGlEv65bYI8kFt5fWh...` |
| `jwt_algorithm` | Token signature cryptographic algorithm | `HS256` |
| `refresh_token_expiary` | Expiry duration for refresh tokens (in days) | `7` |
| `access_token_expiary` | Expiry duration for access tokens (in minutes) | `30` |
| `Redis_Url` | Full Redis network URI | `redis://localhost:6379/0` |
| `MAIL_USERNAME` | SMTP account username used to dispatch verification mails | `user@gmail.com` |
| `MAIL_PASSWORD` | SMTP password or App Specific password | `mbmxckwbhrwvoxgy` |
| `MAIL_FROM` | Dispatcher email header address | `user@gmail.com` |
| `MAIL_PORT` | Mail server SMTP port | `587` |
| `MAIL_SERVER` | SMTP host gateway | `smtp.gmail.com` |
| `MAIL_FROM_NAME` | Dispatcher identity display name | `Blurz_chat` |
| `CLOUDINARY_CLOUD_NAME` | Optional Cloudinary cloud account name | `blurz_cloud` |
| `CLOUDINARY_API_KEY` | Optional Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Optional Cloudinary API Secret | `sec_abc123...` |

### Frontend Environment Variables (`client/.env.local`)

| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint route for the FastAPI core router | `http://localhost:8000/api/v1` |
| `VITE_WS_URL` | WebSocket handshake route | `ws://localhost:8000/api/v1/ws` |
| `VITE_MEDIA_URL` | Static media fallback server route | `http://localhost:8000` |

---

## 🧪 Testing Suites

Blurz includes extensive integration and E2E test suites to ensure absolute runtime reliability.

### Backend Testing (Python)
Ensure your virtual environment is active, then run:
```bash
cd server
pytest
```

### Frontend Testing (Vite & Playwright)
Run the React unit and browser integration tests:
```bash
cd client
npm run test          # Runs Vitest unit tests
npx playwright test   # Runs Playwright E2E browser tests
```

---

## 🏭 Production & Deployment Architecture

Blurz is deployed behind an **Nginx reverse proxy** acting as the TLS termination point, utilizing free automated **Let's Encrypt** SSL certificates.

### CI/CD Workflow
1. Code pushed to `main` initiates a GitHub Action workflow.
2. The pipeline runs linting, code formatting checks, and security tests.
3. Upon approval, deployment is dispatched automatically.

For step-by-step installation instructions on a live cloud server, see our [Deployment Walkthrough](.github/DEPLOYMENT.md).

---

## 📄 Legal & Compliance

* [MIT License](LICENSE)
* [Terms of Service](TERMS_OF_SERVICE.md)
* [Privacy Policy](PRIVACY_POLICY.md)
