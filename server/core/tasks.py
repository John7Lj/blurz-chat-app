import base64
import logging
from db.main import async_session
from db.models import User as User_DB
from auth.service import save_profile_picture_sync
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from pathlib import Path
from db.config import config

BASE_DIR = Path(__file__).resolve().parent.parent / "mailserver" / "templates"

import socket
import ssl
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx

async def bg_send_mail(rec: list[str], sub: str, html_path: str, data_var: dict = None):
    """
    Sends email using the SendGrid HTTP API (Port 443).
    This completely bypasses Render's firewall and IP blocking.
    """
    try:
        template_path = BASE_DIR / html_path
        with open(template_path, 'r', encoding='utf-8') as f:
            html_template = f.read()
        
        html_content = Template(html_template).render(**(data_var or {}))

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {config.MAIL_PASSWORD}",
                    "Content-Type": "application/json"
                },
                json={
                    "personalizations": [{"to": [{"email": email} for email in rec]}],
                    "from": {"email": config.MAIL_FROM, "name": config.MAIL_FROM_NAME},
                    "subject": sub,
                    "content": [{"type": "text/html", "value": html_content}]
                }
            )
            resp.raise_for_status()

        logging.info(f"Email sent successfully via SendGrid HTTP API to {rec}")
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
