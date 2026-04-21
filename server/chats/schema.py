
from pydantic import BaseModel
import uuid 
from datetime import datetime
from typing import Optional
import enum

class Participant(BaseModel):
    user_id: uuid.UUID
    first_name:str
    last_name:str
    profile_url:Optional[str]

    


class ChatList(BaseModel):
    id: uuid.UUID
    created_at:datetime
    participants:Participant



class StartChatRequest(BaseModel):
    recipient_id: uuid.UUID
    message: str

class MessageOut(BaseModel):
    id: uuid.UUID
    content: str | None
    sender_id: uuid.UUID
    chat_id: uuid.UUID
    sent_at: datetime

class StartChatResponse(BaseModel):
    chat_id: uuid.UUID
    is_new: bool          # tells the client if this was a new or existing chat
    message: MessageOut


class MessageType(BaseModel,str, enum.Enum):
    text = "text"
    file = "file"
