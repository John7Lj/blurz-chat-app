import uuid
import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import func, Column, Table, ForeignKey
import sqlalchemy.dialects.postgresql as pg
from sqlmodel import SQLModel, Field, Relationship

# 1. Enums (Standardized naming)
class MessageType(str, enum.Enum):
    text = "text"
    file = "file"

class MessageStatus(str, enum.Enum):
    sent = "sent"
    delivered = "delivered"
    read = "read"


class ChatParticipants(SQLModel, table=True):
    __tablename__ = "chat_participants"
    chat_id: uuid.UUID = Field(foreign_key="chat.id", primary_key=True, ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")


# 3. Models
class User(SQLModel, table=True):
    __tablename__ = "user" # Use lowercase for consistency
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)       
    username: str = Field(unique=True, index=True) # Added index for faster login
    email: str = Field(unique=True, index=True)
    phone: str = Field(unique=True)
    first_name: str = Field(default="new_user") 
    last_name: str = Field(default="new_user") 
    picture_url: Optional[str] = Field(default=None)
    password_hash: str = Field(exclude=True)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, server_default=func.now(), nullable=False)
    )
    updated_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    )

    # Relationships
    messages_sent: List["Message"] = Relationship(back_populates="sender")
    chats: List["Chat"] = Relationship(back_populates="participants", link_model=ChatParticipants)

    def __repr__(self):
        return f"User(username={self.username})"


class Chat(SQLModel, table=True):
    __tablename__ = "chat"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, server_default=func.now(), nullable=False)
    )
    updated_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    )

    # Relationships
    participants: List[User] = Relationship(back_populates="chats", link_model=ChatParticipants)
    messages: List["Message"] = Relationship(back_populates="chat")

    def __repr__(self):
        return f"Chat(id={self.id})"


class Message(SQLModel, table=True):
    __tablename__ = "message"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    content: Optional[str] = Field(default=None)
    file_key: Optional[str] = Field(default=None)
    file_name: Optional[str] = Field(default=None)
    
    # Foreign Keys
    sender_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    chat_id: uuid.UUID = Field(foreign_key="chat.id", nullable=False, index=True) # Index for fast chat loading
    
    # Enums
    msg_type: MessageType = Field(sa_column=Column(pg.ENUM(MessageType), default=MessageType.text))
    status: MessageStatus = Field(sa_column=Column(pg.ENUM(MessageStatus), default=MessageStatus.sent))
    
    sent_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, server_default=func.now(), nullable=False)
    )
    updated_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    )

    # Relationships
    sender: User = Relationship(back_populates="messages_sent")
    chat: Chat = Relationship(back_populates="messages")

    def __repr__(self):
        return f"Message(sender_id={self.sender_id}, chat_id={self.chat_id})"
