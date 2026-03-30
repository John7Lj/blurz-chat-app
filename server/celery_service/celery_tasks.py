from celery import Celery
from asgiref.sync import async_to_sync
from mailserver.service import send_email,mail
# Removed incorrect import from auth.service

from fastapi import UploadFile
from sqlmodel.ext.asyncio.session import AsyncSession
from db.config import config
from db.models import User as User_DB
from db.main import get_session

app  = Celery()


app.config_from_object('celery_service.celery_config')


@app.task()
def bg_send_mail(rec:list[str],sub:str,html_path:str,data_var:dict=None):
    
    message = send_email(recepients=rec,subject=sub,html_message_path=html_path,data_variables=data_var)
    
    # we use here this adapter for making async function work in sync context cause celery is syncrounous  

    async_to_sync(mail.send_message)(message)
    
    print('Email is sent')

from db.main import async_session  # ✅ imports the factory, not a connection
from db.models import User as User_DB
from asgiref.sync import async_to_sync

@app.task()
def bg_save_profile_picture(picture_bytes: bytes, ext: str, user_id: str):
    from auth.service import save_profile_picture_sync
    file_url = save_profile_picture_sync(picture_bytes, ext)

    async def _update_db():
        async with async_session() as session:  
            user = await session.get(User_DB, user_id)
            if user:
                user.profile_url = file_url
                await session.commit()

    async_to_sync(_update_db)()
    return file_url