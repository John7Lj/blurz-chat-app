# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Application entry point.

Object wiring order (linear, no circular dependency):
    1. Publisher   — needs only redis
    2. Subscriber  — needs only redis
    3. Manager     — needs only redis
    4. Wire:         subscriber.set_handler(manager.handle_pubsub_message)
    5. Start:        asyncio.create_task(subscriber.listen())

Neither Subscriber nor Manager import each other.
They are connected here and only here.
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
import os

from db.main import init_db, close_db
from db.redis import PubSub_Redis
from pubsub.publisher import Publisher
from pubsub.subscriber import PubSubListener
from websocket.manager import ConnectionManager
from websocket.router import ws_router
from auth.router import auth_router
from users.router import user_router
from chats.router import chat_router
from messages.router import msg_router
from mailserver.router import mail_router
from core.middleware import custome_simple_middle
from core.errors import register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):

    # ── Startup ───────────────────────────────────────────────────────────
    await init_db()

    # 1. Create each object independently — no references to each other yet
    publisher  = Publisher(redis_client=PubSub_Redis)
    subscriber = PubSubListener(redis_client=PubSub_Redis)
    manager    = ConnectionManager(redis_client=PubSub_Redis)

    # 2. Wire subscriber → manager via callback
    #    This is the ONLY place these two are connected.
    #    Subscriber doesn't import Manager. Manager doesn't import Subscriber.
    subscriber.set_handler(manager.handle_pubsub_message)

    # 3. Store on app.state so routes can access them
    app.state.publisher  = publisher
    app.state.subscriber = subscriber
    app.state.manager    = manager

    # 4. Start the single background listener task
    listener_task = asyncio.create_task(
        subscriber.listen(),
        name="pubsub-listener",
    )

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────
    listener_task.cancel()
    try:
        await listener_task
    except asyncio.CancelledError:
        pass  # expected — listen() handles this cleanly in its finally block

    await PubSub_Redis.aclose()
    await close_db()


app = FastAPI(lifespan=lifespan)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

custome_simple_middle(app)
register_error_handlers(app)

from fastapi import APIRouter
api_v1 = APIRouter(prefix="/api/v1")

api_v1.include_router(auth_router,  prefix="/auth",  tags=["auth"])
api_v1.include_router(user_router,  prefix="/users", tags=["users"])
api_v1.include_router(chat_router)
api_v1.include_router(msg_router)
api_v1.include_router(mail_router,  prefix="/mail",  tags=["mail"])
api_v1.include_router(ws_router)

app.include_router(api_v1)


@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.head("/")
async def root_head():
    return {"status": "ok"}


@app.api_route("/healthz", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "healthy"}