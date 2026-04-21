import uuid
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from sqlmodel import select, and_
from sqlmodel.ext.asyncio.session import AsyncSession
from db.models import Message, MessageType, MessageStatus, ChatParticipants
from errors import ChatNotFound, NotChatParticipant
import logging

logger = logging.getLogger(__name__)

# Media storage config
MEDIA_DIR = Path("media/local-storage/chat-files")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".mp4", ".mp3", ".wav", ".doc", ".docx"}


async def validate_chat_participant(chat_id: uuid.UUID, user_id: uuid.UUID, session: AsyncSession) -> bool:
    """
    Verify that a user is a participant of a chat.
    Raises NotChatParticipant if not.
    """
    statement = select(ChatParticipants).where(
        and_(
            ChatParticipants.chat_id == chat_id,
            ChatParticipants.user_id == user_id,
        )
    )
    result = await session.execute(statement)
    participant = result.scalar_one_or_none()
    
    if not participant:
        raise NotChatParticipant()
    
    return True


async def create_message(
    chat_id: uuid.UUID,
    sender_id: uuid.UUID,
    session: AsyncSession,
    content: str = None,
    msg_type: str = "text",
    file_key: str = None,
    file_name: str = None,
) -> Message:
    """
    Insert a new message row. Called by:
    - WebSocket handler for text messages
    - Media upload route for file messages
    """
    new_message = Message(
        chat_id=chat_id,
        sender_id=sender_id,
        content=content,
        msg_type=MessageType(msg_type),
        status=MessageStatus.sent,
        file_key=file_key,
        file_name=file_name,
    )
    
    session.add(new_message)
    await session.commit()
    await session.refresh(new_message)
    
    logger.info(f"Message {new_message.id} saved: chat={chat_id}, sender={sender_id}, type={msg_type}")
    return new_message


async def get_messages(
    chat_id: uuid.UUID,
    session: AsyncSession,
    limit: int = 50,
    before_id: uuid.UUID = None,
) -> list[Message]:
    """
    Fetch paginated messages for a chat.
    
    Cursor-based pagination: returns `limit` messages older than `before_id`.
    Ordered newest-first so the client gets the most recent messages on first load.
    """
    statement = select(Message).where(Message.chat_id == chat_id)
    
    if before_id:
        # Get the sent_at of the cursor message
        cursor_msg = await session.get(Message, before_id)
        if cursor_msg:
            statement = statement.where(Message.sent_at < cursor_msg.sent_at)
    
    statement = statement.order_by(Message.sent_at.desc()).limit(limit)
    
    result = await session.execute(statement)
    messages = result.scalars().all()
    
    return list(messages)


async def save_media_file(file: UploadFile) -> tuple[str, str]:
    """
    Validate and save an uploaded file to local storage.
    Returns (file_key, original_filename).
    
    file_key is the server-side filename (UUID-based to avoid collisions).
    """
    # Validate extension
    original_name = file.filename or "unknown"
    ext = Path(original_name).suffix.lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' is not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Create storage directory
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_key = f"{uuid.uuid4()}{ext}"
    file_path = MEDIA_DIR / file_key
    
    # Write to disk
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"Media saved: {file_path} ({len(content)} bytes)")
    except OSError as e:
        logger.error(f"Failed to save media: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file"
        )
    
    return file_key, original_name


def message_to_broadcast_dict(message: Message) -> dict:
    """
    Convert a Message ORM object to a dict suitable for JSON serialization
    and Redis pub/sub broadcasting.
    """
    return {
        "id": str(message.id),
        "chat_id": str(message.chat_id),
        "sender_id": str(message.sender_id),
        "content": message.content,
        "file_key": message.file_key,
        "file_name": message.file_name,
        "msg_type": message.msg_type.value if message.msg_type else "text",
        "status": message.status.value if message.status else "sent",
        "sent_at": message.sent_at.isoformat() if message.sent_at else None,
    }
