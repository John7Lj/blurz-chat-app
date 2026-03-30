from fastapi.websockets import WebSocket
from datetime import datetime


class WebSocketManager:
    def __init__(self):
        self.connected_clients = []

    async def connect(self, websocket: WebSocket):
        client_ip = f"{websocket.client.host}:{websocket.client.port}"


        # client has connected
        await websocket.accept()


        # add client to list of connected clients
        self.connected_clients.append(websocket)


        # send welcome message to the client
        message = {
            "type": "welcome",
            "client": client_ip,
            "message": f"Welcome {client_ip}"
        }

        await websocket.send_json(message)

        # Broadcast that a new user joined
        join_message = {
            "type": "system",
            "message": f"{client_ip} joined the chat",
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast(join_message)

    async def broadcast(self, message: dict):
        for connection in self.connected_clients:
            try:
                await connection.send_json(message)
            except Exception:
                continue


    async def send_message(self, websocket: WebSocket, message: dict):
        # Broadcast formatted message
        ms = {
            "type": "chat",
            "client": message.get('client', 'Unknown'),
            "message": message.get('content', message.get('message', '')),
            "timestamp": message.get('timestamp', datetime.now().isoformat())
        }
        await websocket.send_json(ms)

    async def disconnect(self, websocket):
        if websocket in self.connected_clients:
            self.connected_clients.remove(websocket)