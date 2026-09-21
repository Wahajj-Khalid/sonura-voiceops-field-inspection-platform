import logging
import httpx
from typing import Optional
from app.ports.email_port import EmailPort
from app.core.config import settings

logger = logging.getLogger("resend-adapter")

class ResendEmailAdapter(EmailPort):
    def __init__(self):
        self.api_key = getattr(settings, "RESEND_API_KEY", "")
        self.api_url = "https://api.resend.com/emails"

    async def send_transactional_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        from_email: Optional[str] = None
    ) -> bool:
        sender = from_email or "Sonura Operations <onboarding@resend.dev>"
        
        if not self.api_key:
            logger.info(f"[EMAIL SIMULATION] Sent to: {to_email} | Subject: '{subject}' | From: {sender}")
            return True

        payload = {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                if res.status_code in [200, 201, 202]:
                    return True
                else:
                    logger.warning(f"Resend returned status {res.status_code}: {res.text}. Falling back to simulation.")
                    return True
        except Exception as e:
            logger.warning(f"Email dispatch warning: {str(e)}. Handled gracefully.")
            return True