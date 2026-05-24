import logging
import httpx
from jinja2 import Template
from pathlib import Path
from db.config import config

BASE_DIR = Path(__file__).resolve().parent.parent / "mailserver" / "templates"

async def bg_send_mail(rec: list[str], sub: str, html_path: str, data_var: dict = None):
    """
    Sends email using the Brevo HTTP API (Port 443).
    This completely bypasses Render's firewall and IP blocking.
    """
    try:
        template_path = BASE_DIR / html_path
        with open(template_path, 'r', encoding='utf-8') as f:
            html_template = f.read()
        
        html_content = Template(html_template).render(**(data_var or {}))

        api_key = config.MAIL_PASSWORD
        logging.info("Brevo API client configured successfully")

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "accept": "application/json",
                    "api-key": api_key,
                    "content-type": "application/json"
                },
                json={
                    "sender": {"name": config.MAIL_FROM_NAME, "email": config.MAIL_FROM},
                    "to": [{"email": email} for email in rec],
                    "subject": sub,
                    "htmlContent": html_content
                }
            )
            if resp.status_code >= 400:
                logging.error(f"Brevo API error {resp.status_code}: {resp.text}")
            resp.raise_for_status()

        logging.info(f"Email sent successfully via Brevo HTTP API to {rec}")
    except Exception as e:
        logging.error(f"Failed to send email to {rec}: {str(e)}")

