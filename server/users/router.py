# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from auth.dependencies import get_current_user, AccessTokenBearer
from auth.schemas import User, UserInfo
from .schemas import other_users, Update_User
from .service import update_user, get_contacts, search_user
from db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession

user_router = APIRouter()

# file size checker
MAX_FILE_SIZE = 5 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024  # Read 1MB at a time


@user_router.get('/me', response_model=UserInfo)
async def get_me(user_details: User = Depends(get_current_user)):
    return user_details


# update user
@user_router.patch('/update', response_model=UserInfo,
                    dependencies=[Depends(AccessTokenBearer())])
async def Update_user(update_data: Update_User,
                             user_details: User = Depends(get_current_user),
                             session: AsyncSession = Depends(get_session)):
    updated_user = await update_user(user_details.id, session, update_data)
    return updated_user


# get all contacts 
@user_router.get('/contacts', response_model=list[other_users], dependencies=[Depends(AccessTokenBearer())])
async def Get_contacts(session: AsyncSession = Depends(get_session)):
    return await get_contacts(session)


@user_router.get('/search/{query}', response_model=list[other_users], dependencies=[Depends(AccessTokenBearer())])
async def Search_user(query: str, session: AsyncSession = Depends(get_session)):
    return await search_user(query, session)




@user_router.delete('/me', dependencies=[Depends(AccessTokenBearer())])
async def delete_account(
    user_details: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Permanently delete the current user's account and all associated data."""
    from .service import delete_user_account
    
    deleted = await delete_user_account(user_details.id, session)
    if not deleted:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {"message": "Account deleted successfully"}

