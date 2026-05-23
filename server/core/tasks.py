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

def get_ipv4_socket(host, port, timeout):
    """Force IPv4 resolution to prevent 'Network is unreachable' on IPv6 servers."""
    addr_info = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
    ip = addr_info[0][4][0]
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    sock.connect((ip, port))
    return sock

class IPv4_SMTP_SSL(smtplib.SMTP_SSL):
    def _get_socket(self, host, port, timeout):
        return get_ipv4_socket(host, port, timeout)

class IPv4_SMTP(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        return get_ipv4_socket(host, port, timeout)

def bg_send_mail(rec: list[str], sub: str, html_path: str, data_var: dict = None):
    """
    Runs in a FastAPI threadpool because it's defined as a sync function.
    This prevents the asyncio event loop from hanging and crashing Uvicorn
    if Google SMTP drops the connection (very common on Render).
    """
    try:
        template_path = BASE_DIR / html_path
        with open(template_path, 'r', encoding='utf-8') as f:
            html_template = f.read()
        
        html_content = Template(html_template).render(**(data_var or {}))

        msg = MIMEMultipart("alternative")
        msg["Subject"] = sub
        msg["From"] = f"{config.MAIL_FROM_NAME} <{config.MAIL_FROM}>"
        msg["To"] = ", ".join(rec)
        msg.attach(MIMEText(html_content, "html"))

        # Connect with a strict 10 second timeout using explicit IPv4 sockets
        if config.MAIL_SSL_TLS:
            server = IPv4_SMTP_SSL(config.MAIL_SERVER, config.MAIL_PORT, timeout=10)
        else:
            server = IPv4_SMTP(config.MAIL_SERVER, config.MAIL_PORT, timeout=10)
            if config.MAIL_STARTTLS:
                server.starttls()
                
        server.login(config.MAIL_USERNAME, config.MAIL_PASSWORD)
        server.sendmail(config.MAIL_FROM, rec, msg.as_string())
        server.quit()
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
