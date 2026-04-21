from fastapi.responses import JSONResponse
from .schema import ChatList,participant 
from typing import List
from fastapi import APIRouter, Depends, HTTPException,status
from auth.dependencies import get_current_user, AccessTokenBearer
from auth.schema import User, UserInfo
from db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import  get_user_chats_with_others,add_message_to_chat,find_existing_chat,create_chat_with_message,delete_chats
from db.models import User
from .schema import StartChatRequest,MessageOut,StartChatResponse
from users.service import get_user_by_id
import uuid

chat_router = APIRouter(prefix='/chats')



# get all my chats 
@chat_router.get('/mine',response_model=List[ChatList])
async def get_all_user_chats(session:AsyncSession=Depends(get_session),C_User:User=Depends(get_current_user)):
    chats = await get_user_chats_with_others(session,C_User.id)
    return [
        ChatList(
            id=chat.id,
            created_at=chat.created_at,
            participants=participant(
                user_id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                profile_url=user.profile_url or ""
            )
        )
        for chat, user in chats
    ]

"""
the logic of this endpoint will be a little complex cuz we have to check the user 
is exist and try to find if this user is existing or not 
if its exist we try to find a existing chat if not exist we create a new chat and 
try to save the message , participants and chat record 
"""

@chat_router.post('/start', response_model=StartChatResponse)
async def start_chat(
    body: StartChatRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # 1. Can't chat with yourself
    if body.recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot start a chat with yourself.")

    # 2. Check recipient exists
    recipient:User = await get_user_by_id(id =current_user.id ,session=session)
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found.")

    # 3. Find existing chat or create a new one
    existing_chat = await find_existing_chat(
        current_user.id, 
        recipient.id, 
        session=Depends(get_session)
    )

    if existing_chat:
        message = await add_message_to_chat(
           session=session,
            chat_id=existing_chat.id,
            sender_id=current_user.id,
            content=body.message,
        )
        return StartChatResponse(
            chat_id=existing_chat.id,
            is_new=False,
            message=MessageOut(**message.model_dump()),
        )
    else:
        chat, message = await create_chat_with_message(
            session=session,
            sender_id=current_user.id,
            recipient_id=recipient.id,
            content=body.message,
        )
        return StartChatResponse(
            chat_id=chat.id,
            is_new=True,
            message=MessageOut(**message.model_dump()),
        )


# this endpoit delete one chat or multiple chats based on ids chat

@chat_router.delete('/delete',status_code=200)
async def delete_chats(id=[uuid.UUID], session :AsyncSession=Depends(get_session)):
    deltion =  await delete_chats(id,session)
    if not deltion:
        return JSONResponse(content={'message':"an error occure when Deleting",
                                       "status_code":status.HTTP_400_BAD_REQUEST}) 
    return JSONResponse(content={'message':"chats deleted successfully",
                                       "status_code":status.HTTP_200_OK}) 

                            