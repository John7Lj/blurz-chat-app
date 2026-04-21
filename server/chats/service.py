from logging import exception
from db.models import Chat ,ChatParticipants,User,Message
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from errors import UserNotFound, UserAlreadyExists
import uuid
from sqlalchemy.orm import selectinload
from .schema import MessageType
from annotated_types import List
async def get_user_chats_with_others(session: AsyncSession, user_id: uuid.UUID):
    subquery = (
        select(ChatParticipants.chat_id)
        .where(ChatParticipants.user_id == user_id)
    )

    statement = (
        select(Chat, User)
        .join(ChatParticipants, ChatParticipants.chat_id == Chat.id)
        .join(User, User.id == ChatParticipants.user_id)
        .where(Chat.id.in_(subquery))              # chats I belong to
        .where(User.id != user_id)                 # exclude me
    )

    result = await session.exec(statement)
    return result.all()



from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

async def find_existing_chat(
    session: AsyncSession, 
    user1_id: uuid.UUID, 
    user2_id: uuid.UUID
) -> Chat | None:

    subquery = (
        select(ChatParticipants.chat_id)
        .where(ChatParticipants.user_id == user1_id)
        .intersect(
            select(ChatParticipants.chat_id)
            .where(ChatParticipants.user_id == user2_id)
        )
    )

    # 2. Use .in_(subquery) correctly
    statement = select(Chat).where(Chat.id.in_(subquery))
    
    # 3. Execute and get the first result
    result = await session.execute(statement)
    chat = result.scalars().first()
    
    return chat


async def create_chat_with_message(
    session: AsyncSession,
    sender_id: uuid.UUID,
    recipient_id: uuid.UUID,
    content: str,
    msg_type: MessageType = MessageType.text,
) -> tuple[Chat, Message]:

    """Create a new chat, add participants, and save the first message."""
    chat = Chat()
    session.add(chat)
    await session.flush()  # Get chat.id before inserting participants

    # Add both participants
    session.add(ChatParticipants(chat_id=chat.id, user_id=sender_id))
    session.add(ChatParticipants(chat_id=chat.id, user_id=recipient_id))

    # Save the message
    message = Message(
        content=content,
        sender_id=sender_id,
        chat_id=chat.id,
        msg_type=msg_type,
    )
    session.add(message)

    await session.commit()
    await session.refresh(chat)
    await session.refresh(message)

    return chat, message

# this is for existing chat no need to create new chats this will matter in the endpoitn
#  
async def add_message_to_chat(
    session: AsyncSession,
    chat_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
    msg_type: MessageType = MessageType.text,
) -> Message:
    """Add a message to an existing chat."""
    message = Message(
        content=content,
        sender_id=sender_id,
        chat_id=chat_id,
        msg_type=msg_type,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message




async def delete_chats(ids:List[uuid.UUID], session:AsyncSession):
    id_list = ids 
    if not id_list : 
        return False
    try:
        for id in id_list :
            await session.delete(Chat,id)
            await session.commit()

        await session.refresh(Chat)
    except :
        raise exception 
    return True



