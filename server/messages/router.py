# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi.responses import JSONResponse
from typing import List
from fastapi import APIRouter, Depends, HTTPException,status,Query
from auth.dependencies import get_current_user
from db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import get_message_by_chatId ,delete_messages_byID,edit_message_byID,read_message_byID
from .schemas import MessageOut, EditMessageBody
import uuid



msg_router = APIRouter(prefix="/messages",tags=["MESSAGE"])

# get the 50 message pagination only and when the user scroll get the next old 50 

@msg_router.get('/{chat_id}',response_model=List[MessageOut])
async def get_messages(
    chat_id:uuid.UUID
    ,limit:int=Query(default=50,ge=1,le=100)
    ,skip:int=Query(default=0,ge=0)
    ,user =Depends(get_current_user)
    ,session:AsyncSession = Depends(get_session)
    ):
    messages:List[MessageOut]
    try:
        messages = await get_message_by_chatId(
            user_id=user.id,session=session,chat_id=chat_id,limit=limit,skip=skip
        )
        if not messages:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No messages found."
            )
        return messages
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# need to implment edit and delete in service and routes

@msg_router.delete("/delete")
async def delete_message(
    message_id:List[uuid.UUID]=Query(default=[]),
    user =Depends(get_current_user),
    session:AsyncSession = Depends(get_session)
    ):
    if not message_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one message ID is required."
        )
    try:
        await delete_messages_byID(message_id,user.id,session)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Message deleted successfully."}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@msg_router.patch("/{message_id}")
async def edit_message(
    message_id:uuid.UUID,
    body: EditMessageBody,
    user=Depends(get_current_user),
    session:AsyncSession = Depends(get_session)
    ):
    try:
        is_edited=await edit_message_byID(message_id,user.id,body.content,session)
        if not is_edited:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found."
            )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Message edited successfully."}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@msg_router.patch("/{message_id}/read")
async def read_message(
    message_id:uuid.UUID,
    user=Depends(get_current_user),
    session:AsyncSession = Depends(get_session)
    ):
    try:
        is_read=await read_message_byID(message_id,user.id,session)
        if not is_read:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found."
            )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Message read successfully."}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
