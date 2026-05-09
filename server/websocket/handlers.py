# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
WebSocket Message Handlers
Dispatches incoming WebSocket messages by their "type" field.
"""
import uuid
import logging
from sqlmodel.ext.asyncio.session import AsyncSession
from db.models import User
from chats.service import verify_chat_membership, add_message_to_chat
from messages.service import read_message_byID
from pubsub.publisher import Publisher

logger = logging.getLogger(__name__)


async def handle_incoming(
    data: dict,
    user: User,
    session: AsyncSession,
    publisher: Publisher,
    manager,  # ConnectionManager — not typed to avoid circular import
):
    """
    Main dispatcher — routes incoming WebSocket JSON messages
    to the correct handler based on the "type" field.
    """
    msg_type = data.get("type")

    match msg_type:
        case "message":
            await handle_message(data, user, session, publisher, manager)
        case "typing":
            await handle_typing(data, user, publisher)
        case "read":
            await handle_read(data, user, session, publisher)
        case "ping":
            await handle_ping(user, manager)
        case _:
            await manager.send_to_user(user.id, {
                "type": "error",
                "detail": f"Unknown message type: {msg_type}",
            })

async def handle_message(
    data: dict,
    user: User,
    session: AsyncSession,
    publisher: Publisher,
    manager,
):
    """
    Handle a new chat message:
    1. Validate chat_id
    2. Persist to PostgreSQL (reuse existing chats/service)
    3. Send ack to sender
    4. Publish to Redis for delivery to recipient
    """
    chat_id_str = data.get("chat_id")
    content = data.get("content")

    if not chat_id_str or not content:
        await manager.send_to_user(user.id, {
            "type": "error",
            "detail": "Missing chat_id or content",
        })
        return

    try:
        chat_id = uuid.UUID(chat_id_str)
    except ValueError:
        await manager.send_to_user(user.id, {
            "type": "error",
            "detail": "Invalid chat_id format",
        })
        return

    # Validate that the sender is actually a member of this chat
    try:
        is_member = await verify_chat_membership(
            session=session, chat_id=chat_id, user_id=user.id
        )
    except Exception as e:
        logger.error(f"Membership check failed: {e}")
        await manager.send_to_user(user.id, {
            "type": "error",
            "detail": "Failed to verify chat membership",
        })
        return

    if not is_member:
        await manager.send_to_user(user.id, {
            "type": "error",
            "detail": "You are not a member of this chat",
        })
        return

    # Persist the message using existing service
    try:
        message = await add_message_to_chat(
            session=session,
            chat_id=chat_id,
            sender_id=user.id,
            content=content,
        )
    except Exception as e:
        logger.error(f"Failed to persist message: {e}")
        await manager.send_to_user(user.id, {
            "type": "error",
            "detail": "Failed to save message",
        })
        return

    # Send ack to sender
    await manager.send_to_user(user.id, {
        "type": "message_ack",
        "message_id": str(message.id),
        "chat_id": str(chat_id),
        "temp_id": data.get("temp_id"),
        "sender_id": str(user.id),
        "content": content,
        "sent_at": message.sent_at.isoformat(),
    })

    # Publish to Redis so the recipient gets it
    await publisher.publish_message(
        chat_id=chat_id,
        message_id=message.id,
        sender_id=user.id,
        content=content,
        sent_at=message.sent_at,
    )


async def handle_typing(data: dict, user: User, publisher: Publisher):
    """Publish a typing indicator to the chat channel."""
    chat_id_str = data.get("chat_id")
    if not chat_id_str:
        return

    try:
        chat_id = uuid.UUID(chat_id_str)
    except ValueError:
        return

    await publisher.publish_typing(chat_id=chat_id, user_id=user.id)


async def handle_read(
    data: dict,
    user: User,
    session: AsyncSession,
    publisher: Publisher,
):
    """
    Handle a read receipt:
    1. Update message status in DB (reuse existing messages/service)
    2. Publish to Redis so sender knows it was read
    """
    chat_id_str = data.get("chat_id")
    message_id_str = data.get("message_id")

    if not chat_id_str or not message_id_str:
        return

    try:
        chat_id = uuid.UUID(chat_id_str)
        message_id = uuid.UUID(message_id_str)
    except ValueError:
        return

    # Update in DB using existing service
    try:
        await read_message_byID(
            message_id=message_id,
            user_id=user.id,
            session=session,
        )
    except Exception as e:
        logger.error(f"Failed to update read receipt: {e}")
        return

    # Publish so the other user knows
    await publisher.publish_read(
        chat_id=chat_id,
        message_id=message_id,
        user_id=user.id,
    )


async def handle_ping(user: User, manager):
    """Respond to a ping with a pong and refresh presence."""
    await manager.refresh_presence(user.id)
    await manager.send_to_user(user.id, {"type": "pong"})
