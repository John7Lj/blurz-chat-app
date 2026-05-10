# Copyright (c) 2026 Blurz
# 
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, Depends, HTTPException
from auth.dependencies import get_current_user, AccessTokenBearer
from auth.schemas import User, UserInfo
from .schemas import other_users, Update_User, Profile_Picture_Response, Update_Profile_Picture
from .service import update_user, get_contacts, search_user
from db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from celery_service.celery_tasks import bg_save_profile_picture
import base64

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


# the profile picture is uploaded in background task and return public url
@user_router.patch('/update-profile-picture', response_model=Profile_Picture_Response,
                    dependencies=[Depends(AccessTokenBearer())])
async def Update_profile_picture(update_data: Update_Profile_Picture,
                             user_details: User = Depends(get_current_user)):
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
    
    if not update_data.profile_picture:
        raise HTTPException(status_code=400, detail="No profile picture is provided")
    
    ext = update_data.file_extension.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Decode base64 to check size
    try:
        file_bytes = base64.b64decode(update_data.profile_picture)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")
    
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    # Re-encode for Celery transport (it's already base64, but we validated it)
    file_bytes_b64 = update_data.profile_picture
    bg_save_profile_picture.delay(file_bytes_b64, ext, str(user_details.id))
    return {"message": "Profile picture is being uploaded"}


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

