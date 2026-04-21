import uuid
from fastapi import APIRouter, Depends, status, HTTPException, UploadFile, File, Form
from sqlmodel.ext.asyncio.session import AsyncSession
from db.main import get_session
from auth.dependencies import AccessTokenBearer, get_current_user
from db.models import User
from .schema import MessageResponse
from .service import (
    get_messages,
    create_message,
    save_media_file,
    validate_chat_participant,
    message_to_broadcast_dict,
)
from pubsub.pubsub import publish_message
from typing import Optional


messages_router = APIRouter(tags=["messages"])


@messages_router.get(
    "/chats/{chat_id}/messages",
    response_model=list[MessageResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(AccessTokenBearer())],
)
async def get_chat_messages(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    limit: int = 50,
    before: Optional[uuid.UUID] = None,
):
    """
    Get paginated messages for a chat.
    
    - `limit`: number of messages to return (default 50, max 100)
    - `before`: message ID cursor — returns messages older than this
    """
    # Verify user is in this chat
    await validate_chat_participant(chat_id, current_user.id, session)
    
    # Clamp limit
    limit = min(limit, 100)
    
    messages = await get_messages(chat_id, session, limit=limit, before_id=before)
    
    return [
        MessageResponse(
            id=msg.id,
            content=msg.content,
            file_key=msg.file_key,
            file_name=msg.file_name,
            sender_id=msg.sender_id,
            chat_id=msg.chat_id,
            msg_type=msg.msg_type.value if msg.msg_type else "text",
            status=msg.status.value if msg.status else "sent",
            sent_at=msg.sent_at,
        )
        for msg in messages
    ]


@messages_router.post(
    "/messages/media",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(AccessTokenBearer())],
)
async def upload_media_message(
    chat_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Upload a media file and create a file message in the chat.
    
    - Validates file extension and size (max 5MB)
    - Saves file to local storage
    - Creates a message with msg_type='file'
    - Publishes to Redis so online participants receive it in real time
    """
    # Verify user is in this chat
    await validate_chat_participant(chat_id, current_user.id, session)
    
    # Save the file
    file_key, original_name = await save_media_file(file)
    
    # Create the message
    message = await create_message(
        chat_id=chat_id,
        sender_id=current_user.id,
        session=session,
        content=None,
        msg_type="file",
        file_key=file_key,
        file_name=original_name,
    )
    
    # Publish to Redis so WS subscribers get notified
    broadcast_data = message_to_broadcast_dict(message)
    await publish_message(str(chat_id), broadcast_data)
    
    return MessageResponse(
        id=message.id,
        content=message.content,
        file_key=message.file_key,
        file_name=message.file_name,
        sender_id=message.sender_id,
        chat_id=message.chat_id,
        msg_type=message.msg_type.value if message.msg_type else "file",
        status=message.status.value if message.status else "sent",
        sent_at=message.sent_at,
    )
