# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import uuid
import logging
from fastapi import APIRouter, Depends, UploadFile, File, Form, Request
from auth.dependencies import get_current_user
from db.main import get_session
from db.models import User
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import handle_chat_media_upload, handle_profile_upload
from .schemas import MediaUploadResponse, ProfilePictureResponse

logger = logging.getLogger(__name__)

media_router = APIRouter(prefix="/media", tags=["MEDIA"])


@media_router.post("/upload", response_model=MediaUploadResponse)
async def upload_chat_media(
    request: Request,
    file: UploadFile = File(...),
    chat_id: uuid.UUID = Form(...),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Upload a media file to a chat. Notifies recipient via WebSocket."""
    message = await handle_chat_media_upload(
        file=file,
        chat_id=chat_id,
        sender_id=user.id,
        session=session,
    )

    # Notify recipient via PubSub (same as text messages)
    try:
        publisher = request.app.state.publisher
        await publisher.publish_message(
            chat_id=message.chat_id,
            message_id=message.id,
            sender_id=user.id,
            content=message.content or f"📎 {message.file_name}",
            sent_at=message.sent_at,
        )
    except Exception as e:
        logger.error("Failed to publish media message event: %s", e)

    return MediaUploadResponse(
        message_id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        msg_type=message.msg_type.value,
        file_url=message.file_url or "",
        file_name=message.file_name,
        file_key=message.file_key,
        file_size=message.file_size,
        file_mime=message.file_mime,
        thumbnail_url=message.thumbnail_url,
        sent_at=message.sent_at,
    )


@media_router.post("/upload-profile", response_model=ProfilePictureResponse)
async def upload_profile_picture(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Upload or replace profile picture via Cloudinary."""
    new_url = await handle_profile_upload(
        file=file,
        user_id=user.id,
        session=session,
    )
    return ProfilePictureResponse(
        message="Profile picture updated",
        profile_url=new_url,
    )
