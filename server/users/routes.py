from fastapi import APIRouter,Depends
from auth.dependencies import get_current_user
from auth.schema import User
from auth.schema import UserInfo,other_users
from auth.dependencies import AccessTokenBearer
from .service import update_user,get_contacts,search_user
from .schema import Update_User,Profile_Picture_Response
from db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from celery_service.celery_tasks import bg_save_profile_picture
from pathlib import Path
user_router = APIRouter()


@user_router.get('/me',response_model=UserInfo,
                    dependencies=[Depends(AccessTokenBearer())])

async def get_me(user_details:User=Depends(get_current_user)):
    return user_details


# update user
@user_router.patch('/update',response_model=UserInfo,
                    dependencies=[Depends(AccessTokenBearer())])
async def Update_user(update_data:Update_User,
                             user_details:User=Depends(get_current_user),
                             session:AsyncSession=Depends(get_session)):
    updated_user = await update_user(user_details.id,session,update_data)
    return updated_user


# get all contacts 
@user_router.get('/contacts',response_model=list[other_users],
                    dependencies=[Depends(AccessTokenBearer())])
async def Get_contacts(user_details:User=Depends(get_current_user),
                             session:AsyncSession=Depends(get_session)):
    return await get_contacts(session)


@user_router.get('/search/{query}',response_model=list[other_users],
                    dependencies=[Depends(AccessTokenBearer())])
async def Search_user(query:str,user_details:User=Depends(get_current_user),
                             session:AsyncSession=Depends(get_session)):
    return await search_user(query,session)


# the profile picture is uploaded in background task and return public url
@user_router.patch('/update-profile-picture',response_model=Profile_Picture_Response,
                    dependencies=[Depends(AccessTokenBearer())])
async def Update_profile_picture(update_data:Update_Profile_Picture,
                             user_details:User=Depends(get_current_user),
                             session:AsyncSession=Depends(get_session)):
    if not update_data.profile_picture:
        raise HTTPException(status_code=400, detail="Profile picture is required")
        
    file_bytes = await update_data.profile_picture.read()
    ext = Path(update_data.profile_picture.filename).suffix
    bg_save_profile_picture.delay(file_bytes,ext,user_details.id)
    return {"message":"Profile picture is being uploaded"}
