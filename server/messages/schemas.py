# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


from pydantic import BaseModel
import uuid 
from datetime import datetime
from typing import Optional
import enum



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


class MessageStatus(str, enum.Enum):
    sent = "sent"
    delivered = "delivered"
    read = "read"


class EditMessageBody(BaseModel):
    content: str
