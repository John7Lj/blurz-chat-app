from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.websockets import WebSocket, WebSocketDisconnect
from manager import WebSocketManager
from db.main import init_db, close_db
from contextlib import asynccontextmanager
from auth.routes import auth_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()







app = FastAPI(lifespan=lifespan)

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))


manager = WebSocketManager()
app.include_router(auth_router)
@app.get('/')
async def root(request: Request):
    return templates.TemplateResponse(
        'index.html',
        {"request": request}
    )

@app.get("/ws")
async def ws_get():
    return {"message": "This endpoint is for WebSockets. Please connect using a WebSocket client or visit the root URL '/' to use the chat UI."}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            message = await websocket.receive_json()
            for client in manager.connected_clients:
                await manager.send_message(client, message)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in websocket loop: {e}")
        await manager.disconnect(websocket)
        

    
