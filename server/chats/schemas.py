# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


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
    phone: str
    bio: Optional[str] = None

    


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


class MessageType(str, enum.Enum):
    text = "text"
    file = "file"

