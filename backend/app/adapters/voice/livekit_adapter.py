import uuid
import logging
from typing import Dict, Any, Optional
from livekit import api
from app.core.config import settings
from app.ports.voice_port import VoicePort

logger = logging.getLogger("livekit-adapter")

class LiveKitVoiceAdapter(VoicePort):
    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        livekit_url: Optional[str] = None
    ):
        self.api_key = api_key or settings.LIVEKIT_API_KEY
        self.api_secret = api_secret or settings.LIVEKIT_API_SECRET
        self.livekit_url = livekit_url or settings.LIVEKIT_URL

    async def generate_connection_token(self, room_name: str, participant_identity: str) -> str:
        unique_identity = f"{participant_identity}-{uuid.uuid4().hex[:6]}"
        token = api.AccessToken(self.api_key, self.api_secret) \
            .with_identity(unique_identity) \
            .with_name(f"Operator_{unique_identity[:8]}") \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True
            ))

        return token.to_jwt()

    async def dispatch_agent(self, room_name: str, metadata: Dict[str, Any]) -> bool:
        lk_client = api.LiveKitAPI(self.livekit_url, self.api_key, self.api_secret)
        try:
            await lk_client.room.create_room(
                api.CreateRoomRequest(
                    name=room_name,
                    empty_timeout=10
                )
            )
            return True
        finally:
            await lk_client.aclose()