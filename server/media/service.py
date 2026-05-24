# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Business logic for media uploads: validates, uploads to Cloudinary,
and persists the Message record.
"""

import uuid
import logging
from sqlmodel.ext.asyncio.session import AsyncSession
from db.models import Message, MessageType
from chats.service import verify_chat_membership
from .cloudinary_service import (
    upload_image,
    upload_video,
    upload_audio,
    upload_document,
    upload_raw_file,
    upload_profile_image,
    upload_profile_image,
    delete_file,
    get_thumbnail_url,
)
from .schemas import get_msg_type, get_max_size
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

async def handle_direct_chat_upload(
    data: dict,  # Dict of ConfirmChatUploadRequest
    sender_id: uuid.UUID,
    session: AsyncSession,
) -> Message:
    """Save metadata for a file that was directly uploaded to Cloudinary."""
    chat_id = data["chat_id"]
    secure_url = data["secure_url"]
    public_id = data["public_id"]
    resource_type = data["resource_type"]
    original_name = data["original_filename"]
    file_size = data["file_size"]
    content_type = data["file_mime"]

    # 1. Verify chat membership
    is_member = await verify_chat_membership(session, chat_id, sender_id)
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this chat")

    # 2. Map MIME to MessageType
    msg_type_str = get_msg_type(content_type)
    try:
        db_msg_type = MessageType(msg_type_str)
    except ValueError:
        db_msg_type = MessageType.file

    # 3. Generate thumbnail
    thumbnail = get_thumbnail_url(secure_url, resource_type)

    # 4. Create Message record
    message = Message(
        content=f"📎 {original_name}",
        sender_id=sender_id,
        chat_id=chat_id,
        msg_type=db_msg_type,
        file_key=public_id,
        file_name=original_name,
        file_url=secure_url,
        file_size=file_size,
        file_mime=content_type,
        thumbnail_url=thumbnail,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)

    logger.info("Direct media message created: %s (%s, %s bytes)", message.id, msg_type_str, file_size)
    return message


async def handle_direct_profile_upload(
    secure_url: str,
    public_id: str,
    user_id: uuid.UUID,
    session: AsyncSession,
) -> str:
    """Update profile picture URL with a direct Cloudinary upload."""
    from db.models import User

    # Update user record
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete old profile picture from Cloudinary
    old_url = user.profile_url
    if old_url and "cloudinary" in old_url:
        try:
            parts = old_url.split("/upload/")
            if len(parts) == 2:
                path_part = parts[1].split("/", 1)[1]
                old_public_id = path_part.rsplit(".", 1)[0]
                delete_file(old_public_id, resource_type="image")
        except Exception:
            pass

    user.profile_url = secure_url
    await session.commit()

    return secure_url

