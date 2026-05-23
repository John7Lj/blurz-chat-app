import base64
import logging
from db.main import async_session
from db.models import User as User_DB
from auth.service import save_profile_picture_sync
from mailserver.service import send_email, mail

async def bg_send_mail(rec: list[str], sub: str, html_path: str, data_var: dict = None):
    try:
        message = send_email(recepients=rec, subject=sub, html_message_path=html_path, data_variables=data_var)
        await mail.send_message(message)
        logging.info(f"Email sent successfully to {rec}")
    except Exception as e:
        logging.error(f"Failed to send email to {rec}: {str(e)}")

async def bg_save_profile_picture(picture_bytes_b64: str, ext: str, user_id: str):
    try:
        # Decode base64 string back to bytes
        picture_bytes = base64.b64decode(picture_bytes_b64)
        
        # Save file synchronously (this is fast enough for background tasks)
        file_url = save_profile_picture_sync(picture_bytes, ext)

        # Update DB
        async with async_session() as session:  
            user = await session.get(User_DB, user_id)
            if user:
                user.profile_url = file_url
                await session.commit()
                logging.info(f"Profile picture saved for user {user_id}")
    except Exception as e:
        logging.error(f"Failed to save profile picture for user {user_id}: {str(e)}")
