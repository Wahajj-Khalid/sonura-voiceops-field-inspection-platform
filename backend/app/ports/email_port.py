from typing import Protocol, Optional

class EmailPort(Protocol):
    async def send_transactional_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        from_email: Optional[str] = None
    ) -> bool: ...