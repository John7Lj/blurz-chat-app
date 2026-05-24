# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import httpx
import asyncio
import websockets
import json
import uuid
import sys

BASE_URL = "http://localhost:8001/api/v1"
WS_URL = "ws://localhost:8001/api/v1/ws"

async def run_e2e_tests():
    print("Starting E2E API & WebSocket Tests...")
    
    unique_id = str(uuid.uuid4())[:8]
    user1_data = {
        "username": f"testuser1_{unique_id}",
        "email": f"test1_{unique_id}@example.com",
        "first_name": "Test",
        "last_name": "User1",
        "password": "Password123!",
        "phone": f"+12345678{unique_id}"[:15],
        "profile_picture": None
    }
    user2_data = {
        "username": f"testuser2_{unique_id}",
        "email": f"test2_{unique_id}@example.com",
        "first_name": "Test",
        "last_name": "User2",
        "password": "Password123!",
        "phone": f"+87654321{unique_id}"[:15],
        "profile_picture": None
    }
    
    client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
    
    try:
        # 1. Signup Users
        print("\n[1] Testing Signup...")
        r1 = await client.post("/auth/signup", json=user1_data)
        assert r1.status_code == 201, f"User 1 signup failed: {r1.text}"
        print("OK: User 1 signed up")
        
        r2 = await client.post("/auth/signup", json=user2_data)
        assert r2.status_code == 201, f"User 2 signup failed: {r2.text}"
        user2_id = r2.json()["id"]
        print("OK: User 2 signed up")

        # 2. Verify Users in DB (since we don't have the email token in the response)
        print("\n[2] Verifying users in DB...")
        import asyncpg
        import os
        db_url = os.getenv("DB_URL", "postgresql://postgres:postgres@localhost:5432/blurzchat")
        conn = await asyncpg.connect(db_url)
        await conn.execute("UPDATE \"user\" SET is_verified = TRUE WHERE email = $1 OR email = $2", user1_data["email"], user2_data["email"])
        await conn.close()
        print("OK: Users verified")

        # 3. Login User 1
        print("\n[3] Testing Login...")
        login_resp = await client.post("/auth/login", json={"email": user1_data["email"], "password": user1_data["password"]})
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        tokens = login_resp.json()
        access_token = tokens["access_token"]
        print("OK: Login successful, got access token")
        
        # Set auth header
        client.headers.update({"Authorization": f"Bearer {access_token}"})
        
        # 3. Get Current User (Me)
        print("\n[3] Testing Current User (/users/me)...")
        me_resp = await client.get("/users/me")
        assert me_resp.status_code == 200, f"/users/me failed: {me_resp.text}"
        print(f"OK: Authenticated as: {me_resp.json()['username']}")

        # 4. Start Chat
        print("\n[4] Testing Chat Creation...")
        chat_payload = {"recipient_id": user2_id, "message": "Hello from E2E test!"}
        chat_resp = await client.post("/chat/start", json=chat_payload)
        assert chat_resp.status_code in [200, 201], f"Start chat failed: {chat_resp.text}"
        chat_id = chat_resp.json()["chat_id"]
        print(f"OK: Chat created with ID: {chat_id}")
        
        # 5. Get Chats
        print("\n[5] Testing Get Chats...")
        chats_resp = await client.get("/chats")
        assert chats_resp.status_code == 200, f"Get chats failed: {chats_resp.text}"
        assert len(chats_resp.json()) > 0, "No chats found"
        print("OK: Retrieved chats list")
        
        # 6. WebSocket Connection & Messaging
        print("\n[6] Testing WebSocket Messaging...")
        ws_endpoint = f"{WS_URL}?token={access_token}"
        async with websockets.connect(ws_endpoint) as ws:
            print("OK: WebSocket connected")
            
            # Send message
            ws_msg = {
                "action": "send_message",
                "payload": {
                    "chat_id": chat_id,
                    "content": "E2E WS Test Message"
                }
            }
            await ws.send(json.dumps(ws_msg))
            print("OK: Sent WS message")
            
            # Wait for echo/confirmation (the server broadcasts it back)
            response = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(response)
            assert data.get("type") == "new_message", f"Unexpected WS response: {data}"
            assert data["payload"]["content"] == "E2E WS Test Message"
            print("OK: Received message confirmation via WS")
            
        print("\nAll E2E API tests passed successfully!")
            
    except Exception as e:
        print(f"\nERROR: Test Failed: {e}")
        sys.exit(1)
    finally:
        await client.aclose()

if __name__ == "__main__":
    asyncio.run(run_e2e_tests())
