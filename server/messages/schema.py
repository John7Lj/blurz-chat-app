from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import Optional


class MessageResponse(BaseModel):
    """A single message returned from the API"""
    id: uuid.UUID
    content: Optional[str] = None
    file_key: Optional[str] = None
    file_name: Optional[str] = None
    sender_id: uuid.UUID
    chat_id: uuid.UUID
    msg_type: str  # "text" or "file"
    status: str  # "sent", "delivered", "read"
    sent_at: datetime


class MessageCreate(BaseModel):
    """Internal schema for creating a message (used by WS handler and media route)"""
    chat_id: uuid.UUID
    content: Optional[str] = None
    msg_type: str = "text"
    file_key: Optional[str] = None
    file_name: Optional[str] = None


class WebSocketMessage(BaseModel):
    """The JSON shape the client sends over WebSocket"""
    chat_id: str  # UUID as string from the client
    content: str


class MessageBroadcast(BaseModel):
    """The JSON shape broadcast to all participants via pub/sub"""
    id: str
    chat_id: str
    sender_id: str
    content: Optional[str] = None
    file_key: Optional[str] = None
    file_name: Optional[str] = None
    msg_type: str
    status: str
    sent_at: str  # ISO format string for JSON serialization
